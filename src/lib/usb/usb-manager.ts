
import { EventEmitter } from 'events';

export interface UsbDeviceConfig {
    vendorId?: number;
    productId?: number;
}

export class UsbManager extends EventEmitter {
    private device: USBDevice | null = null;
    private interfaceNumber: number = -1;
    private endpointIn: number = -1;
    private endpointOut: number = -1;
    private maxPacketSize: number = 512;

    constructor() {
        super();
    }

    public get isConnected(): boolean {
        return this.device !== null && this.device.opened;
    }

    public get deviceName(): string {
        return this.device?.productName || 'Unknown Device';
    }

    async requestDevice(): Promise<void> {
        try {
            // Request device - this must be triggered by a user gesture
            // We filter for devices that likely support MTP (or just allow all for now to be safe)
            // MTP class is 6, subclass 1, protocol 1.
            const device = await navigator.usb.requestDevice({
                filters: [] // Allow user to select any device, then we validate
            });

            await this.connect(device);
        } catch (error) {
            console.error('Error requesting device:', error);
            throw error;
        }
    }

    async connect(device: USBDevice): Promise<void> {
        this.device = device;

        try {
            await this.device.open();

            if (this.device.configuration === null) {
                await this.device.selectConfiguration(1);
            }

            // Find the MTP interface
            const interfaceFound = this.findMtpInterface();
            if (!interfaceFound) {
                throw new Error('Could not find MTP interface (Class 6, Subclass 1, Protocol 1) or compatible Bulk endpoints.');
            }

            try {
                await this.device.claimInterface(this.interfaceNumber);
            } catch (err) {
                throw new Error('Unable to claim interface. Please close "Android File Transfer" or other MTP apps and try again.');
            }

            // Clear any stalls from previous sessions
            await this.clearHalts();

            this.emit('connected', this.device);
            console.log(`Connected to ${this.device.productName}`);

        } catch (error) {
            console.error('Connection error:', error);
            await this.disconnect();
            throw error;
        }
    }

    async clearHalts(): Promise<void> {
        if (!this.device || !this.device.opened) return;
        if (this.endpointIn === -1 || this.endpointOut === -1) return;

        try {
            await this.device.clearHalt('in', this.endpointIn);
            await this.device.clearHalt('out', this.endpointOut);
        } catch (e) {
            console.warn('Failed to clear halts:', e);
        }
    }

    private findMtpInterface(): boolean {
        if (!this.device || !this.device.configuration) return false;

        let bestInterface: any = null;
        let bestEpIn = -1;
        let bestEpOut = -1;
        let bestPacketSize = 512;

        console.log(`Scanning ${this.device.configuration.interfaces.length} interfaces...`);

        for (const iface of this.device.configuration.interfaces) {
            const alternate = iface.alternates[0];
            const isMtp = alternate.interfaceClass === 6 && alternate.interfaceSubclass === 1 && alternate.interfaceProtocol === 1;
            const isVendor = alternate.interfaceClass === 255;

            console.log(`Interface ${iface.interfaceNumber}: Class ${alternate.interfaceClass}, Subclass ${alternate.interfaceSubclass}, Protocol ${alternate.interfaceProtocol}`);

            let epIn = -1;
            let epOut = -1;
            let packetSize = 512;

            for (const ep of alternate.endpoints) {
                if (ep.type === 'bulk') {
                    if (ep.direction === 'in') {
                        epIn = ep.endpointNumber;
                    } else if (ep.direction === 'out') {
                        epOut = ep.endpointNumber;
                        packetSize = ep.packetSize;
                    }
                }
            }

            if (epIn !== -1 && epOut !== -1) {
                // If we found a standard MTP interface, use it immediately
                if (isMtp) {
                    this.interfaceNumber = iface.interfaceNumber;
                    this.endpointIn = epIn;
                    this.endpointOut = epOut;
                    this.maxPacketSize = packetSize;
                    console.log(`Selected Standard MTP Interface: ${this.interfaceNumber}`);
                    return true;
                }

                // Otherwise, keep the first valid vendor interface as a backup
                if (isVendor && !bestInterface) {
                    bestInterface = iface;
                    bestEpIn = epIn;
                    bestEpOut = epOut;
                    bestPacketSize = packetSize;
                }
            }
        }

        if (bestInterface) {
            this.interfaceNumber = bestInterface.interfaceNumber;
            this.endpointIn = bestEpIn;
            this.endpointOut = bestEpOut;
            this.maxPacketSize = bestPacketSize;
            console.log(`Selected Vendor Interface: ${this.interfaceNumber}`);
            return true;
        }

        return false;
    }

    async disconnect(): Promise<void> {
        if (this.device) {
            try {
                if (this.device.opened) {
                    // Try to release interface if claimed
                    if (this.interfaceNumber !== -1) {
                        try {
                            await this.device.releaseInterface(this.interfaceNumber);
                        } catch (e) { /* ignore */ }
                    }
                    await this.device.close();
                }
            } catch (error) {
                console.error('Error during disconnect:', error);
            }
        }
        this.device = null;
        this.interfaceNumber = -1;
        this.endpointIn = -1;
        this.endpointOut = -1;
        this.emit('disconnected');
    }

    async transferOut(data: BufferSource): Promise<USBOutTransferResult> {
        if (!this.device || !this.device.opened) throw new Error('Device not connected');
        try {
            return await this.device.transferOut(this.endpointOut, data);
        } catch (err) {
            console.warn('TransferOut failed, attempting to clear halt and retry...', err);
            await this.clearHalts();
            return await this.device.transferOut(this.endpointOut, data);
        }
    }

    async transferIn(length: number): Promise<USBInTransferResult> {
        if (!this.device || !this.device.opened) throw new Error('Device not connected');
        return await this.device.transferIn(this.endpointIn, length);
    }
}

export const usbManager = new UsbManager();
