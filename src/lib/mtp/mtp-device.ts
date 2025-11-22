
import { usbManager } from '../usb/usb-manager';
import { MtpPacket, MtpContainer } from './mtp-packet';
import { MtpOperationCode, MtpResponseCode, MtpContainerType } from './constants';

export interface MtpObjectInfo {
    storageId: number;
    format: number;
    protectionStatus: number;
    compressedSize: number;
    thumbFormat: number;
    thumbCompressedSize: number;
    thumbPixWidth: number;
    thumbPixHeight: number;
    imagePixWidth: number;
    imagePixHeight: number;
    imageBitDepth: number;
    parentHandle: number;
    associationType: number;
    associationDesc: number;
    sequenceNumber: number;
    filename: string;
    dateCreated: string;
    dateModified: string;
    keywords: string;
    handle: number;
}

export class MtpDevice {
    private transactionId: number = 1;
    private sessionId: number = 0;

    constructor() { }

    private nextTransactionId(): number {
        return this.transactionId++;
    }

    async connect() {
        await usbManager.requestDevice();
    }

    async openSession() {
        this.sessionId = 1; // Usually starts at 1

        // OpenSession MUST use TransactionID 0
        const response = await this.performTransaction(MtpOperationCode.OpenSession, [this.sessionId], 0);

        if (response.code === MtpResponseCode.SessionAlreadyOpen) {
            console.warn('Session already open, resetting...');
            // Try to close and re-open
            await this.performTransaction(MtpOperationCode.CloseSession, [], 0);
            const retry = await this.performTransaction(MtpOperationCode.OpenSession, [this.sessionId], 0);
            if (retry.code !== MtpResponseCode.OK) {
                throw new Error(`Failed to open session after reset: ${retry.code.toString(16)}`);
            }
        } else if (response.code !== MtpResponseCode.OK) {
            throw new Error(`Failed to open session: ${response.code.toString(16)}`);
        }

        // Reset transaction ID after new session
        this.transactionId = 1;
        console.log('Session Opened');
    }

    async getStorageIds(): Promise<number[]> {
        const data = await this.performTransactionWithData(MtpOperationCode.GetStorageIDs, []);
        // Parse array of uint32
        const view = new DataView(data);
        const count = view.getUint32(0, true);
        const ids: number[] = [];
        for (let i = 0; i < count; i++) {
            ids.push(view.getUint32(4 + (i * 4), true));
        }
        return ids;
    }

    async getObjectHandles(storageId: number, parentHandle: number = 0xFFFFFFFF, format: number = 0): Promise<number[]> {
        // Parent 0xFFFFFFFF means root
        // Format 0 means all formats
        const data = await this.performTransactionWithData(MtpOperationCode.GetObjectHandles, [storageId, format, parentHandle]);
        const view = new DataView(data);
        const count = view.getUint32(0, true);
        const handles: number[] = [];
        for (let i = 0; i < count; i++) {
            handles.push(view.getUint32(4 + (i * 4), true));
        }
        return handles;
    }

    async getObjectInfo(handle: number): Promise<MtpObjectInfo> {
        const data = await this.performTransactionWithData(MtpOperationCode.GetObjectInfo, [handle]);
        const view = new DataView(data);

        // Parsing ObjectInfo Dataset (PIMA 15740)
        // Offsets are approximate, need to handle variable length strings carefully
        let offset = 0;
        const storageId = view.getUint32(offset, true); offset += 4;
        const format = view.getUint16(offset, true); offset += 2;
        const protectionStatus = view.getUint16(offset, true); offset += 2;
        const compressedSize = view.getUint32(offset, true); offset += 4;
        const thumbFormat = view.getUint16(offset, true); offset += 2;
        const thumbCompressedSize = view.getUint32(offset, true); offset += 4;
        const thumbPixWidth = view.getUint32(offset, true); offset += 4;
        const thumbPixHeight = view.getUint32(offset, true); offset += 4;
        const imagePixWidth = view.getUint32(offset, true); offset += 4;
        const imagePixHeight = view.getUint32(offset, true); offset += 4;
        const imageBitDepth = view.getUint32(offset, true); offset += 4;
        const parentHandle = view.getUint32(offset, true); offset += 4;
        const associationType = view.getUint16(offset, true); offset += 2;
        const associationDesc = view.getUint32(offset, true); offset += 4;
        const sequenceNumber = view.getUint32(offset, true); offset += 4;

        const readString = () => {
            const numChars = view.getUint8(offset); offset += 1;
            if (numChars === 0) return '';
            let str = '';
            for (let i = 0; i < numChars; i++) {
                // MTP strings are UTF-16LE
                const charCode = view.getUint16(offset, true);
                if (charCode !== 0) str += String.fromCharCode(charCode);
                offset += 2;
            }
            return str;
        };

        const filename = readString();
        const dateCreated = readString();
        const dateModified = readString();
        const keywords = readString();

        return {
            storageId, format, protectionStatus, compressedSize,
            thumbFormat, thumbCompressedSize, thumbPixWidth, thumbPixHeight,
            imagePixWidth, imagePixHeight, imageBitDepth, parentHandle,
            associationType, associationDesc, sequenceNumber,
            filename, dateCreated, dateModified, keywords,
            handle
        };
    }

    private transactionLock: Promise<void> = Promise.resolve();

    private async runInLock<T>(action: () => Promise<T>): Promise<T> {
        const previousLock = this.transactionLock;
        let releaseLock: () => void;
        const newLock = new Promise<void>(resolve => { releaseLock = resolve; });
        // Chain the new lock to the previous one to ensure order
        this.transactionLock = newLock;

        // Wait for the previous transaction to complete (success or failure)
        await previousLock.catch(() => { });

        try {
            return await action();
        } finally {
            releaseLock!();
        }
    }

    // Generic transaction handler
    private async performTransaction(opCode: number, params: number[], forceTransactionId?: number): Promise<MtpContainer> {
        return this.runInLock(async () => {
            const tid = forceTransactionId !== undefined ? forceTransactionId : this.nextTransactionId();
            const command = MtpPacket.createCommand(opCode, tid, params);

            await usbManager.transferOut(command);

            // Read response
            const result = await usbManager.transferIn(512); // Read header
            if (!result.data) throw new Error('No data received');

            const container = MtpPacket.parseContainer(result.data.buffer as ArrayBuffer);
            return container;
        });
    }

    private async performTransactionWithData(opCode: number, params: number[]): Promise<ArrayBuffer> {
        return this.runInLock(async () => {
            const tid = this.nextTransactionId();
            const command = MtpPacket.createCommand(opCode, tid, params);

            await usbManager.transferOut(command);

            // Read Data Phase
            // First read header to get length
            const headerResult = await usbManager.transferIn(512);
            if (!headerResult.data) throw new Error('No data received');

            const headerContainer = MtpPacket.parseContainer(headerResult.data.buffer as ArrayBuffer);

            if (headerContainer.type === MtpContainerType.Response) {
                // Something went wrong, we got a response instead of data
                throw new Error(`Expected data, got response: ${headerContainer.code.toString(16)}`);
            }

            if (headerContainer.type !== MtpContainerType.Data) {
                throw new Error(`Unexpected container type: ${headerContainer.type}`);
            }

            // If the data is larger than what we read (512 bytes), we need to read the rest
            const totalLength = headerContainer.length;
            const bytesRead = headerResult.data.byteLength;
            const bytesRemaining = totalLength - bytesRead;

            let completePayload = new Uint8Array(totalLength - 12); // -12 for header

            // Copy initial chunk
            completePayload.set(new Uint8Array(headerContainer.payload), 0);
            let currentOffset = headerContainer.payload.byteLength;

            if (bytesRemaining > 0) {
                let remaining = bytesRemaining;
                while (remaining > 0) {
                    const chunk = await usbManager.transferIn(remaining); // Try to read all
                    if (!chunk.data) break;
                    completePayload.set(new Uint8Array(chunk.data.buffer), currentOffset);
                    currentOffset += chunk.data.byteLength;
                    remaining -= chunk.data.byteLength;
                }
            }

            // Read Response Phase
            const responseResult = await usbManager.transferIn(512);
            if (responseResult.data) {
                const responseContainer = MtpPacket.parseContainer(responseResult.data.buffer as ArrayBuffer);
                if (responseContainer.code !== MtpResponseCode.OK) {
                    throw new Error(`Transaction failed: ${responseContainer.code.toString(16)}`);
                }
            }

            return completePayload.buffer;
        });
    }

    async readFile(handle: number, onProgress?: (loaded: number, total: number) => void): Promise<Uint8Array> {
        const info = await this.getObjectInfo(handle);
        const totalSize = info.compressedSize;

        const tid = this.nextTransactionId();
        const command = MtpPacket.createCommand(MtpOperationCode.GetObject, tid, [handle]);
        await usbManager.transferOut(command);

        // Read Data Header
        const headerResult = await usbManager.transferIn(512);
        if (!headerResult.data) throw new Error('No data received');

        const headerContainer = MtpPacket.parseContainer(headerResult.data.buffer as ArrayBuffer);

        if (headerContainer.type !== MtpContainerType.Data) {
            if (headerContainer.type === MtpContainerType.Response) {
                throw new Error(`Expected data, got response: ${headerContainer.code.toString(16)}`);
            }
            throw new Error(`Unexpected container type: ${headerContainer.type}`);
        }

        const totalLength = headerContainer.length; // Total MTP container length (header + data)
        const dataLength = totalLength - 12; // Actual file size

        // Verify size matches (mostly)
        // Note: MTP length includes header. info.compressedSize is just file content.

        const resultBuffer = new Uint8Array(dataLength);
        let offset = 0;

        // Copy initial payload
        const initialPayload = new Uint8Array(headerContainer.payload);
        resultBuffer.set(initialPayload, offset);
        offset += initialPayload.byteLength;

        if (onProgress) onProgress(offset, dataLength);

        // Read rest
        // We'll read in chunks of 16KB or larger (WebUSB supports up to 1MB usually but depends on device)
        const CHUNK_SIZE = 1024 * 128;

        while (offset < dataLength) {
            const remaining = dataLength - offset;
            const readSize = Math.min(remaining, CHUNK_SIZE);

            // Note: transferIn expects expected length.
            // If we ask for more than available, it might wait or timeout?
            // USB bulk transfer usually returns what is available up to length.

            const chunk = await usbManager.transferIn(readSize);
            if (!chunk.data || chunk.data.byteLength === 0) break;

            resultBuffer.set(new Uint8Array(chunk.data.buffer), offset);
            offset += chunk.data.byteLength;

            if (onProgress) onProgress(offset, dataLength);
        }

        // Read Response
        const responseResult = await usbManager.transferIn(512);
        if (responseResult.data) {
            const responseContainer = MtpPacket.parseContainer(responseResult.data.buffer as ArrayBuffer);
            if (responseContainer.code !== MtpResponseCode.OK) {
                console.warn(`File read finished with non-OK status: ${responseContainer.code.toString(16)}`);
            }
        }

        return resultBuffer;
    }
}

export const mtpDevice = new MtpDevice();
