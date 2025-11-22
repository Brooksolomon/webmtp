
import { useState, useEffect, useCallback } from 'react';
import { mtpDevice, MtpObjectInfo } from '@/lib/mtp/mtp-device';
import { usbManager } from '@/lib/usb/usb-manager';
import { MtpObjectFormat } from '@/lib/mtp/constants';

export function useMtp() {
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [files, setFiles] = useState<MtpObjectInfo[]>([]);
    const [currentStorageId, setCurrentStorageId] = useState<number | null>(null);
    const [currentParentHandle, setCurrentParentHandle] = useState<number>(0xFFFFFFFF); // Root
    const [pathStack, setPathStack] = useState<{ handle: number, name: string }[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isLoadingFiles, setIsLoadingFiles] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('name');

    useEffect(() => {
        const onConnected = () => setIsConnected(true);
        const onDisconnected = () => {
            setIsConnected(false);
            setFiles([]);
            setPathStack([]);
            setCurrentStorageId(null);
            setIsLoadingFiles(false);
        };

        usbManager.on('connected', onConnected);
        usbManager.on('disconnected', onDisconnected);

        return () => {
            usbManager.off('connected', onConnected);
            usbManager.off('disconnected', onDisconnected);
        };
    }, []);

    const loadFiles = useCallback(async (storageId: number, parentHandle: number) => {
        setIsLoadingFiles(true);
        try {
            const handles = await mtpDevice.getObjectHandles(storageId, parentHandle);
            const fileInfos = await Promise.all(handles.map(h => mtpDevice.getObjectInfo(h)));
            setFiles(fileInfos);
        } catch (err: any) {
            console.error(err);
            setError('Failed to load files');
        } finally {
            setIsLoadingFiles(false);
        }
    }, []);

    const connect = useCallback(async () => {
        setIsConnecting(true);
        setError(null);
        try {
            await mtpDevice.connect();
            await mtpDevice.openSession();

            const storageIds = await mtpDevice.getStorageIds();
            if (storageIds.length > 0) {
                setCurrentStorageId(storageIds[0]);
                await loadFiles(storageIds[0], 0xFFFFFFFF);
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to connect');
        } finally {
            setIsConnecting(false);
        }
    }, [loadFiles]);

    const navigate = useCallback(async (folder: MtpObjectInfo) => {
        if (folder.format !== MtpObjectFormat.Association) return;
        if (currentStorageId === null) return;

        // Prevent navigating to the same folder if it's already the current one
        if (currentParentHandle === folder.handle) return;

        try {
            setPathStack(prev => {
                // Double check we aren't adding a duplicate at the end
                if (prev.length > 0 && prev[prev.length - 1].handle === folder.handle) {
                    return prev;
                }
                return [...prev, { handle: folder.handle, name: folder.filename }];
            });
            setCurrentParentHandle(folder.handle);
            await loadFiles(currentStorageId, folder.handle);
        } catch (err) {
            console.error(err);
        }
    }, [currentStorageId, loadFiles, currentParentHandle]);

    const navigateUp = useCallback(async () => {
        if (pathStack.length === 0) return;
        if (currentStorageId === null) return;

        const newStack = pathStack.slice(0, -1);
        const newParent = newStack.length > 0 ? newStack[newStack.length - 1].handle : 0xFFFFFFFF;

        setPathStack(newStack);
        setCurrentParentHandle(newParent);
        await loadFiles(currentStorageId, newParent);
    }, [pathStack, currentStorageId, loadFiles]);

    const downloadFile = useCallback(async (file: MtpObjectInfo) => {
        try {
            const data = await mtpDevice.readFile(file.handle, (loaded, total) => {
                console.log(`Downloading ${file.filename}: ${Math.round(loaded / total * 100)}%`);
            });

            const blob = new Blob([data as unknown as BlobPart], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err: any) {
            console.error(err);
            setError(`Download failed: ${err.message}`);
        }
    }, []);

    const filteredFiles = files
        .filter(f => f.filename.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => {
            const aIsFolder = a.format === MtpObjectFormat.Association;
            const bIsFolder = b.format === MtpObjectFormat.Association;

            if (aIsFolder && !bIsFolder) return -1;
            if (!aIsFolder && bIsFolder) return 1;

            switch (sortBy) {
                case 'name':
                    return a.filename.localeCompare(b.filename);
                case 'size':
                    return b.compressedSize - a.compressedSize;
                case 'date':
                    return b.dateModified.localeCompare(a.dateModified);
                default:
                    return 0;
            }
        });

    return {
        isConnected,
        isConnecting,
        isLoadingFiles,
        files: filteredFiles,
        connect,
        navigate,
        navigateUp,
        downloadFile,
        error,
        currentPath: pathStack,
        searchQuery,
        setSearchQuery,
        sortBy,
        setSortBy
    };
}
