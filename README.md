# WebMTP - Browser-based Android File Transfer for Mac & Windows

A modern, web-based MTP (Media Transfer Protocol) client built with Next.js and WebUSB.
Easily transfer files between your Mac and Android device directly from your browser - no additional software required.

## Features

- 🚀 **No Installation**: Runs entirely in the browser - perfect for Mac users who want to avoid Android File Transfer.
- 🍏 **Mac & Windows Support**: Seamless Android file transfer on macOS without additional drivers.
- 📱 **Android Support**: Connect any Android device (select "File Transfer" or "MTP" mode).
- 📂 **File Browsing**: Navigate folders and view file metadata.
- ⬆️⬇️ **File Transfer**: Upload and download files between your Mac/PC and Android device.
- 🎨 **Modern UI**: Clean, dark-mode interface that feels native on macOS and Windows.

## Requirements

- **Browser**: Google Chrome, Microsoft Edge, or Opera (browsers with WebUSB support).
- **OS**: Works great on both macOS and Windows. No need for Android File Transfer on Mac!
- **Connection**: USB Cable (USB-C to USB-C or USB-A to USB-C adapters supported).

### For Mac Users

WebMTP provides a better alternative to the traditional Android File Transfer app for macOS. No more unreliable connections or clunky interfaces - just plug in your Android device and start transferring files directly from your browser.

## Usage

1. Connect your Android device via USB.
2. On your Android device, tap the "Charging via USB" notification and select **"File Transfer"** or **"MTP"**.
3. Open this app in a supported browser.
4. Click **"Connect Device"**.
5. Select your device from the browser popup.
6. Browse and transfer files!

## Development

This project uses:
- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **WebUSB API**

### Running Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Architecture

- **USB Layer**: `src/lib/usb/usb-manager.ts` - Handles raw WebUSB transfers.
- **MTP Layer**: `src/lib/mtp/` - Implements MTP protocol (Packet framing, Operations).
- **State**: `src/hooks/use-mtp.ts` - React hook for device state and navigation.
- **UI**: `src/app/page.tsx` - Main interface.

## License

MIT
