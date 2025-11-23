
import { usbManager } from '../usb/usb-manager';
import { MtpPacket, MtpContainer } from './mtp-packet';
import { MtpOperationCode, MtpResponseCode, MtpContainerType, MtpObjectFormat } from './constants';

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
    private transactionLock: Promise<void> = Promise.resolve();

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

    async readFile(handle: number, onProgress?: (loaded: number, total: number) => void, control?: { signal: AbortSignal, pause?: () => Promise<void> }): Promise<Uint8Array> {
        const info = await this.getObjectInfo(handle);
        const totalSize = info.compressedSize;
        const resultBuffer = new Uint8Array(totalSize);
        let offset = 0;

        // Use 1MB chunks for GetPartialObject to allow interleaving other commands
        const CHUNK_SIZE = 1024 * 1024;

        while (offset < totalSize) {
            if (control?.signal.aborted) {
                throw new Error('Transfer aborted');
            }

            if (control?.pause) {
                await control.pause();
            }

            const remaining = totalSize - offset;
            const readSize = Math.min(remaining, CHUNK_SIZE);

            // GetPartialObject (0x101B) params: [Handle, Offset, BytesToRead]
            // Note: This supports up to 4GB files. For larger files, we'd need 64-bit extension support.
            const chunkBuffer = await this.performTransactionWithData(
                MtpOperationCode.GetPartialObject,
                [handle, offset, readSize]
            );

            const chunk = new Uint8Array(chunkBuffer);
            resultBuffer.set(chunk, offset);
            offset += chunk.byteLength;

            if (onProgress) onProgress(offset, totalSize);
        }

        return resultBuffer;
    }

    async getThumbnail(handle: number): Promise<Uint8Array | null> {
        try {
            // Check if it has a thumbnail first? 
            // We can just try GetThumb (0x100A)
            const data = await this.performTransactionWithData(MtpOperationCode.GetThumb, [handle]);
            return new Uint8Array(data);
        } catch (e) {
            // It's common for files to not have thumbnails
            return null;
        }
    }

    // Helper to encode MTP string
    private encodeString(str: string): Uint8Array {
        if (!str) return new Uint8Array([0]);
        const numChars = str.length + 1;
        const buf = new Uint8Array(1 + numChars * 2);
        buf[0] = numChars;
        let offset = 1;
        for (let i = 0; i < str.length; i++) {
            const code = str.charCodeAt(i);
            buf[offset++] = code & 0xFF;
            buf[offset++] = code >> 8;
        }
        // Null terminator
        buf[offset++] = 0;
        buf[offset++] = 0;
        return buf;
    }

    private createObjectInfo(filename: string, size: number, format: number, parentHandle: number, storageId: number): ArrayBuffer {
        const filenameBytes = this.encodeString(filename);
        const dateString = new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 15); // YYYYMMDDThhmmss
        const dateBytes = this.encodeString(dateString);

        // Calculate total size
        // Fixed fields: 
        // StorageID (4) + Format (2) + Protection (2) + Size (4) + 
        // ThumbFormat (2) + ThumbSize (4) + ThumbW (4) + ThumbH (4) + 
        // ImageW (4) + ImageH (4) + BitDepth (4) + 
        // Parent (4) + AssocType (2) + AssocDesc (4) + SeqNum (4)
        // = 52 bytes
        // + Strings (Filename, DateCreated, DateModified, Keywords)

        const fixedSize = 52;
        const totalSize = fixedSize + filenameBytes.length + dateBytes.length * 2 + 1; // +1 for empty keywords (0)

        const buffer = new ArrayBuffer(totalSize);
        const view = new DataView(buffer);
        let offset = 0;

        view.setUint32(offset, storageId, true); offset += 4;
        view.setUint16(offset, format, true); offset += 2;
        view.setUint16(offset, 0, true); offset += 2; // Protection Status
        view.setUint32(offset, size, true); offset += 4;

        // Thumb fields (0)
        view.setUint16(offset, 0, true); offset += 2;
        view.setUint32(offset, 0, true); offset += 4;
        view.setUint32(offset, 0, true); offset += 4;
        view.setUint32(offset, 0, true); offset += 4;

        // Image fields (0)
        view.setUint32(offset, 0, true); offset += 4;
        view.setUint32(offset, 0, true); offset += 4;
        view.setUint32(offset, 0, true); offset += 4;

        view.setUint32(offset, parentHandle, true); offset += 4;
        view.setUint16(offset, 0, true); offset += 2; // Association Type
        view.setUint32(offset, 0, true); offset += 4; // Association Desc
        view.setUint32(offset, 0, true); offset += 4; // Sequence Num

        // Strings
        new Uint8Array(buffer).set(filenameBytes, offset); offset += filenameBytes.length;
        new Uint8Array(buffer).set(dateBytes, offset); offset += dateBytes.length; // Date Created
        new Uint8Array(buffer).set(dateBytes, offset); offset += dateBytes.length; // Date Modified
        view.setUint8(offset, 0); // Empty keywords

        return buffer;
    }

    private async performTransactionWithDataOut(opCode: number, params: number[], data: ArrayBuffer): Promise<MtpContainer> {
        return this.runInLock(async () => {
            const tid = this.nextTransactionId();
            const command = MtpPacket.createCommand(opCode, tid, params);
            await usbManager.transferOut(command);

            // Send Data Header
            const header = new ArrayBuffer(12);
            const view = new DataView(header);
            view.setUint32(0, 12 + data.byteLength, true);
            view.setUint16(4, MtpContainerType.Data, true);
            view.setUint16(6, opCode, true);
            view.setUint32(8, tid, true);
            await usbManager.transferOut(header);

            // Send Data
            await usbManager.transferOut(data);

            // Read Response
            const result = await usbManager.transferIn(512);
            if (!result.data) throw new Error('No response received');
            return MtpPacket.parseContainer(result.data.buffer as ArrayBuffer);
        });
    }

    async uploadFile(file: File, parentHandle: number, storageId: number, onProgress?: (sent: number, total: number) => void, control?: { signal: AbortSignal, pause?: () => Promise<void> }): Promise<void> {
        console.log(`Starting upload: ${file.name} (${file.size} bytes) to parent ${parentHandle}`);
        return this.runInLock(async () => {
            if (control?.signal.aborted) throw new Error('Aborted');

            // 1. SendObjectInfo
            const objectInfo = this.createObjectInfo(file.name, file.size, MtpObjectFormat.Undefined, parentHandle, storageId);
            console.log(`Generated ObjectInfo: ${objectInfo.byteLength} bytes`);

            const tid1 = this.nextTransactionId();
            console.log(`Sending SendObjectInfo Command (TID: ${tid1})`);
            const command1 = MtpPacket.createCommand(MtpOperationCode.SendObjectInfo, tid1, [storageId, parentHandle]);
            await usbManager.transferOut(command1);

            // Combine Header + ObjectInfo Data
            // Combining to avoid small packet issues
            const combinedInfoSize = 12 + objectInfo.byteLength;
            const combinedInfoBuffer = new Uint8Array(combinedInfoSize);
            const viewInfo = new DataView(combinedInfoBuffer.buffer);

            viewInfo.setUint32(0, combinedInfoSize, true);
            viewInfo.setUint16(4, MtpContainerType.Data, true);
            viewInfo.setUint16(6, MtpOperationCode.SendObjectInfo, true);
            viewInfo.setUint32(8, tid1, true);

            combinedInfoBuffer.set(new Uint8Array(objectInfo), 12);

            console.log(`Sending ObjectInfo Data Packet (${combinedInfoSize} bytes)`);
            await usbManager.transferOut(combinedInfoBuffer);

            // Read Response for SendObjectInfo
            console.log('Waiting for SendObjectInfo response...');
            const result1 = await usbManager.transferIn(512);
            if (!result1.data) throw new Error('No response received for SendObjectInfo');
            const container1 = MtpPacket.parseContainer(result1.data.buffer as ArrayBuffer);
            console.log(`SendObjectInfo Response: ${container1.code.toString(16)}`);

            if (container1.code !== MtpResponseCode.OK) {
                throw new Error(`Failed to send object info: ${container1.code.toString(16)}`);
            }

            if (control?.signal.aborted) throw new Error('Aborted');
            if (control?.pause) await control.pause();

            // 2. SendObject
            // MUST follow immediately
            const tid2 = this.nextTransactionId();
            console.log(`Sending SendObject Command (TID: ${tid2})`);
            const command2 = MtpPacket.createCommand(MtpOperationCode.SendObject, tid2, []);
            await usbManager.transferOut(command2);

            // Send Data Header + First Chunk
            const CHUNK_SIZE = 1024 * 1024 * 1; // 1MB chunks

            // We need to ensure that if we are sending multiple chunks, the first transfer (Header + Chunk)
            // is a multiple of the USB Max Packet Size (512 bytes).
            // Otherwise, a short packet (remainder) might be interpreted by the USB controller as End of Transfer.
            // Header is 12 bytes.
            // If we use CHUNK_SIZE (1MB) as the total first transfer size, it is aligned (1024*1024 % 512 === 0).
            // So the data part should be CHUNK_SIZE - 12.

            const firstChunkSize = Math.min(file.size, CHUNK_SIZE - 12);
            const firstChunk = file.slice(0, firstChunkSize);
            const firstChunkBuffer = await firstChunk.arrayBuffer();

            const combinedSize = 12 + firstChunkSize;
            const combinedBuffer = new Uint8Array(combinedSize);
            const view2 = new DataView(combinedBuffer.buffer);

            // Header
            view2.setUint32(0, 12 + file.size, true); // Total length of Data Phase
            view2.setUint16(4, MtpContainerType.Data, true);
            view2.setUint16(6, MtpOperationCode.SendObject, true);
            view2.setUint32(8, tid2, true);

            // Payload
            combinedBuffer.set(new Uint8Array(firstChunkBuffer), 12);

            console.log(`Sending combined header + first chunk: ${combinedSize} bytes`);
            await usbManager.transferOut(combinedBuffer);

            if (onProgress) onProgress(firstChunkSize, file.size);

            let offset = firstChunkSize;
            let chunkCount = 1;

            while (offset < file.size) {
                if (control?.signal.aborted) throw new Error('Aborted');
                if (control?.pause) await control.pause();

                const chunk = file.slice(offset, offset + CHUNK_SIZE);
                const buffer = await chunk.arrayBuffer();
                console.log(`Sending chunk ${chunkCount++}: ${buffer.byteLength} bytes (Offset: ${offset})`);
                await usbManager.transferOut(buffer);
                offset += buffer.byteLength;
                if (onProgress) onProgress(offset, file.size);
            }

            // Read Response for SendObject
            console.log('Waiting for SendObject response...');
            const result2 = await usbManager.transferIn(512);
            if (!result2.data) throw new Error('No response received for SendObject');
            const container2 = MtpPacket.parseContainer(result2.data.buffer as ArrayBuffer);
            console.log(`SendObject Response: ${container2.code.toString(16)}`);

            if (container2.code !== MtpResponseCode.OK) {
                throw new Error(`Failed to send object: ${container2.code.toString(16)}`);
            }
            console.log('Upload complete');
        });
    }

    async readLargeFile(handle: number, totalSize: number, writer: WritableStreamDefaultWriter<Uint8Array>, onProgress?: (loaded: number, total: number) => void, control?: { signal: AbortSignal, pause?: () => Promise<void> }): Promise<void> {
        let offset = 0;
        const CHUNK_SIZE = 1024 * 1024; // 1MB

        while (offset < totalSize) {
            if (control?.signal.aborted) {
                throw new Error('Transfer aborted');
            }

            if (control?.pause) {
                await control.pause();
            }

            const remaining = totalSize - offset;
            const readSize = Math.min(remaining, CHUNK_SIZE);

            const chunkBuffer = await this.performTransactionWithData(
                MtpOperationCode.GetPartialObject,
                [handle, offset, readSize]
            );

            const chunk = new Uint8Array(chunkBuffer);
            await writer.write(chunk);

            offset += chunk.byteLength;

            if (onProgress) onProgress(offset, totalSize);
        }
    }

    async createFolder(name: string, parentHandle: number, storageId: number): Promise<number> {
        console.log(`Creating folder: ${name} in ${parentHandle}`);
        return this.runInLock(async () => {
            // 1. SendObjectInfo
            const objectInfo = this.createObjectInfo(name, 0, MtpObjectFormat.Association, parentHandle, storageId);
            const tid1 = this.nextTransactionId();
            const command1 = MtpPacket.createCommand(MtpOperationCode.SendObjectInfo, tid1, [storageId, parentHandle]);
            await usbManager.transferOut(command1);

            // Combine Header + ObjectInfo Data
            const combinedInfoSize = 12 + objectInfo.byteLength;
            const combinedInfoBuffer = new Uint8Array(combinedInfoSize);
            const viewInfo = new DataView(combinedInfoBuffer.buffer);

            viewInfo.setUint32(0, combinedInfoSize, true);
            viewInfo.setUint16(4, MtpContainerType.Data, true);
            viewInfo.setUint16(6, MtpOperationCode.SendObjectInfo, true);
            viewInfo.setUint32(8, tid1, true);

            combinedInfoBuffer.set(new Uint8Array(objectInfo), 12);

            await usbManager.transferOut(combinedInfoBuffer);

            // Read Response
            const result1 = await usbManager.transferIn(512);
            if (!result1.data) throw new Error('No response received for SendObjectInfo');
            const container1 = MtpPacket.parseContainer(result1.data.buffer as ArrayBuffer);
            if (container1.code !== MtpResponseCode.OK) {
                throw new Error(`Failed to create folder info: ${container1.code.toString(16)}`);
            }

            const viewResponse = new DataView(container1.payload);
            // Payload is [StorageID, ParentHandle, Handle]
            // But wait, parseContainer returns payload as ArrayBuffer.
            // The payload in the response container contains the params.
            // MTP Response Block: Length(4), Type(2), Code(2), TransactionID(4), P1(4), P2(4), P3(4)...
            // My MtpPacket.parseContainer extracts the payload (P1, P2, P3...).
            // So payload[0-3] is P1, [4-7] is P2, [8-11] is P3.
            // SendObjectInfo response: StorageID, ParentHandle, Handle.
            // So Handle is P3.

            const handle = viewResponse.getUint32(8, true);
            console.log(`Folder created with handle: ${handle}`);

            // 2. SendObject (Empty data for folder)
            const tid2 = this.nextTransactionId();
            const command2 = MtpPacket.createCommand(MtpOperationCode.SendObject, tid2, []);
            await usbManager.transferOut(command2);

            // Send Data Header (Length 12, size 0)
            const header2 = new ArrayBuffer(12);
            const view2 = new DataView(header2);
            view2.setUint32(0, 12, true);
            view2.setUint16(4, MtpContainerType.Data, true);
            view2.setUint16(6, MtpOperationCode.SendObject, true);
            view2.setUint32(8, tid2, true);
            await usbManager.transferOut(header2);

            // No data payload

            // Read Response
            const result2 = await usbManager.transferIn(512);
            if (!result2.data) throw new Error('No response received for SendObject');
            const container2 = MtpPacket.parseContainer(result2.data.buffer as ArrayBuffer);
            if (container2.code !== MtpResponseCode.OK) {
                throw new Error(`Failed to complete folder creation: ${container2.code.toString(16)}`);
            }

            return handle;
        });
    }

    async deleteObject(handle: number): Promise<void> {
        console.log(`Deleting object with handle: ${handle}`);
        const response = await this.performTransaction(MtpOperationCode.DeleteObject, [handle]);
        if (response.code !== MtpResponseCode.OK) {
            throw new Error(`Failed to delete object: ${response.code.toString(16)}`);
        }
    }

    async renameObject(handle: number, newName: string): Promise<void> {
        console.log(`Renaming object ${handle} to: ${newName}`);
        
        // MTP Property Code for Object File Name is 0xDC07
        const OBJECT_FILE_NAME_PROP = 0xDC07;
        
        const nameBytes = this.encodeString(newName);
        
        return this.runInLock(async () => {
            const tid = this.nextTransactionId();
            const command = MtpPacket.createCommand(MtpOperationCode.SetObjectPropValue, tid, [handle, OBJECT_FILE_NAME_PROP]);
            await usbManager.transferOut(command);

            // Send Data Header + String
            const combinedSize = 12 + nameBytes.length;
            const combinedBuffer = new Uint8Array(combinedSize);
            const view = new DataView(combinedBuffer.buffer);

            view.setUint32(0, combinedSize, true);
            view.setUint16(4, MtpContainerType.Data, true);
            view.setUint16(6, MtpOperationCode.SetObjectPropValue, true);
            view.setUint32(8, tid, true);

            combinedBuffer.set(nameBytes, 12);

            await usbManager.transferOut(combinedBuffer);

            // Read Response
            const result = await usbManager.transferIn(512);
            if (!result.data) throw new Error('No response received for SetObjectPropValue');
            const container = MtpPacket.parseContainer(result.data.buffer as ArrayBuffer);
            if (container.code !== MtpResponseCode.OK) {
                throw new Error(`Failed to rename object: ${container.code.toString(16)}`);
            }
        });
    }

    async moveObject(handle: number, storageId: number, newParentHandle: number): Promise<void> {
        console.log(`Moving object ${handle} to parent ${newParentHandle}`);
        const response = await this.performTransaction(MtpOperationCode.MoveObject, [handle, storageId, newParentHandle]);
        if (response.code !== MtpResponseCode.OK) {
            throw new Error(`Failed to move object: ${response.code.toString(16)}`);
        }
    }

    async copyObject(handle: number, storageId: number, newParentHandle: number): Promise<number> {
        console.log(`Copying object ${handle} to parent ${newParentHandle}`);
        const response = await this.performTransaction(MtpOperationCode.CopyObject, [handle, storageId, newParentHandle]);
        if (response.code !== MtpResponseCode.OK) {
            throw new Error(`Failed to copy object: ${response.code.toString(16)}`);
        }
        
        // Response contains the new object handle
        const view = new DataView(response.payload);
        const newHandle = view.getUint32(0, true);
        return newHandle;
    }
}

export const mtpDevice = new MtpDevice();
