# WebMTP - Browser-based Android File Transfer

A modern, web-based MTP (Media Transfer Protocol) client built with Next.js and WebUSB.
Allows you to manage files on your Android device directly from the browser without installing any software.

## Features

- 🚀 **No Installation**: Runs entirely in the browser.
- 📱 **Android Support**: Connect any Android device (select "File Transfer" mode).
- 📂 **File Browsing**: Navigate folders and view file metadata.
- ⬇️ **Download**: Download files from device to computer.
- 🎨 **Modern UI**: Clean, dark-mode interface.

## Requirements

- **Browser**: Google Chrome, Microsoft Edge, or Opera (browsers with WebUSB support).
- **OS**: Windows, macOS, Linux, Android, ChromeOS.
- **Connection**: USB Cable.

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
