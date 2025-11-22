
import { MtpContainerType } from './constants';

export interface MtpContainer {
    length: number;
    type: MtpContainerType;
    code: number;
    transactionId: number;
    payload: ArrayBuffer;
}

export class MtpPacket {
    static readonly HEADER_SIZE = 12;

    static buildContainer(type: MtpContainerType, code: number, transactionId: number, payload: ArrayBuffer = new ArrayBuffer(0)): ArrayBuffer {
        const length = MtpPacket.HEADER_SIZE + payload.byteLength;
        const buffer = new ArrayBuffer(length);
        const view = new DataView(buffer);

        view.setUint32(0, length, true); // Little Endian
        view.setUint16(4, type, true);
        view.setUint16(6, code, true);
        view.setUint32(8, transactionId, true);

        // Copy payload
        const payloadView = new Uint8Array(payload);
        const bufferView = new Uint8Array(buffer);
        bufferView.set(payloadView, MtpPacket.HEADER_SIZE);

        return buffer;
    }

    static parseContainer(buffer: ArrayBuffer): MtpContainer {
        const view = new DataView(buffer);
        if (buffer.byteLength < MtpPacket.HEADER_SIZE) {
            throw new Error('Buffer too small to be an MTP container');
        }

        const length = view.getUint32(0, true);
        const type = view.getUint16(4, true);
        const code = view.getUint16(6, true);
        const transactionId = view.getUint32(8, true);

        const payload = buffer.slice(MtpPacket.HEADER_SIZE, length);

        return {
            length,
            type,
            code,
            transactionId,
            payload
        };
    }

    // Helper to create a command packet
    static createCommand(opCode: number, transactionId: number, params: number[] = []): ArrayBuffer {
        const payloadSize = params.length * 4;
        const payload = new ArrayBuffer(payloadSize);
        const view = new DataView(payload);

        params.forEach((param, index) => {
            view.setUint32(index * 4, param, true);
        });

        return MtpPacket.buildContainer(MtpContainerType.Command, opCode, transactionId, payload);
    }
}
