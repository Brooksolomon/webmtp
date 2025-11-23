
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { mtpDevice, MtpObjectInfo } from '@/lib/mtp/mtp-device';
import { usbManager } from '@/lib/usb/usb-manager';
import { MtpObjectFormat } from '@/lib/mtp/constants';

export interface FileTransfer {
    id: string;
    filename: string;
    loaded: number;
    total: number;
    status: 'pending' | 'downloading' | 'uploading' | 'completed' | 'error' | 'paused';
    error?: string;
    timestamp: number;
    speed?: number; // bytes per second
    direction: 'download' | 'upload';
}

export function useMtp() {
    // ... (existing state)
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [files, setFiles] = useState<MtpObjectInfo[]>([]);
    const [currentStorageId, setCurrentStorageId] = useState<number | null>(null);
    const [currentParentHandle, setCurrentParentHandle] = useState<number>(0xFFFFFFFF); // Root
    const [pathStack, setPathStack] = useState<{ handle: number, name: string }[]>([]);

    // History for navigation
    const [history, setHistory] = useState<{ handle: number, name: string }[][]>([[]]);
    const [historyIndex, setHistoryIndex] = useState(0);

    const [error, setError] = useState<string | null>(null);
    const [isLoadingFiles, setIsLoadingFiles] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
    const [transfers, setTransfers] = useState<FileTransfer[]>([]);

    const [thumbnails, setThumbnails] = useState<Record<number, string>>({});

    const loadedThumbnailsRef = useRef<Set<number>>(new Set());
    const thumbnailQueueRef = useRef<MtpObjectInfo[]>([]);
    const isProcessingQueueRef = useRef(false);

    // Transfer controls
    const transferControlsRef = useRef<Record<string, {
        abortController: AbortController,
        resume?: () => void,
        isPaused: boolean
    }>>({});

    useEffect(() => {
        const onConnected = () => setIsConnected(true);
        const onDisconnected = () => {
            setIsConnected(false);
            setFiles([]);
            setPathStack([]);
            setHistory([[]]);
            setHistoryIndex(0);
            setCurrentStorageId(null);
            setIsLoadingFiles(false);
            setThumbnails({});
            loadedThumbnailsRef.current.clear();
        };

        usbManager.on('connected', onConnected);
        usbManager.on('disconnected', onDisconnected);

        // Auto-connect on mount
        usbManager.autoConnect().then(connected => {
            if (connected) {
                // If connected, we need to initialize session
                connect();
            }
        });

        // Listen for global USB connect events to trigger auto-connect
        const handleUsbConnect = () => {
            if (!usbManager.isConnected) {
                usbManager.autoConnect().then(connected => {
                    if (connected) connect();
                });
            }
        };
        navigator.usb.addEventListener('connect', handleUsbConnect);

        return () => {
            usbManager.off('connected', onConnected);
            usbManager.off('disconnected', onDisconnected);
            navigator.usb.removeEventListener('connect', handleUsbConnect);
        };
    }, []);

    const processThumbnailQueue = useCallback(async () => {
        if (isProcessingQueueRef.current) return;

        isProcessingQueueRef.current = true;

        while (thumbnailQueueRef.current.length > 0) {
            // Check if any transfer is downloading
            const hasActiveDownload = await new Promise<boolean>(resolve => {
                setTransfers(prev => {
                    resolve(prev.some(t => t.status === 'downloading'));
                    return prev;
                });
            });

            if (hasActiveDownload) {
                // Stop processing queue if download is active
                break;
            }

            const file = thumbnailQueueRef.current.shift();
            if (!file) continue;

            try {
                // Small delay to allow UI updates and prevent USB choking
                await new Promise(resolve => setTimeout(resolve, 10));

                const data = await mtpDevice.getThumbnail(file.handle);
                if (data) {
                    const blob = new Blob([data as unknown as BlobPart], { type: 'image/jpeg' });
                    const url = URL.createObjectURL(blob);
                    setThumbnails(prev => ({ ...prev, [file.handle]: url }));
                }
            } catch (err) {
                console.warn(`Failed to load thumbnail for ${file.filename}`, err);
            }
        }

        isProcessingQueueRef.current = false;
    }, []);

    // Trigger queue processing when transfers change (e.g. when all downloads finish)
    useEffect(() => {
        processThumbnailQueue();
    }, [transfers, processThumbnailQueue]);


    const pauseTransfer = useCallback((id: string) => {
        if (transferControlsRef.current[id]) {
            transferControlsRef.current[id].isPaused = true;
            setTransfers(prev => prev.map(t => t.id === id ? { ...t, status: 'paused' } : t));
        }
    }, []);

    const resumeTransfer = useCallback((id: string) => {
        if (transferControlsRef.current[id]) {
            transferControlsRef.current[id].isPaused = false;
            if (transferControlsRef.current[id].resume) {
                transferControlsRef.current[id].resume!();
                transferControlsRef.current[id].resume = undefined;
            }
            setTransfers(prev => prev.map(t => t.id === id ? { ...t, status: 'downloading' } : t));
        }
    }, []);

    const loadFiles = useCallback(async (storageId: number, parentHandle: number) => {
        setIsLoadingFiles(true);
        setThumbnails({});
        loadedThumbnailsRef.current.clear();
        thumbnailQueueRef.current = []; // Clear pending thumbnails

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
            if (!usbManager.isConnected) {
                await mtpDevice.connect();
            }
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
        if (currentParentHandle === folder.handle) return;

        try {
            const newPath = [...pathStack, { handle: folder.handle, name: folder.filename }];

            // Update history: remove forward history and push new state
            const newHistory = history.slice(0, historyIndex + 1);
            newHistory.push(newPath);

            setHistory(newHistory);
            setHistoryIndex(newHistory.length - 1);
            setPathStack(newPath);
            setCurrentParentHandle(folder.handle);
            await loadFiles(currentStorageId, folder.handle);
        } catch (err) {
            console.error(err);
        }
    }, [currentStorageId, loadFiles, currentParentHandle, pathStack, history, historyIndex]);

    const navigateUp = useCallback(async () => {
        if (pathStack.length === 0) return;
        if (currentStorageId === null) return;

        const newStack = pathStack.slice(0, -1);
        const newParent = newStack.length > 0 ? newStack[newStack.length - 1].handle : 0xFFFFFFFF;

        // Treat as a new navigation state
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newStack);

        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        setPathStack(newStack);
        setCurrentParentHandle(newParent);
        await loadFiles(currentStorageId, newParent);
    }, [pathStack, currentStorageId, loadFiles, history, historyIndex]);

    const goBack = useCallback(async () => {
        if (historyIndex <= 0) return;
        if (currentStorageId === null) return;

        const newIndex = historyIndex - 1;
        const newStack = history[newIndex];
        const newParent = newStack.length > 0 ? newStack[newStack.length - 1].handle : 0xFFFFFFFF;

        setHistoryIndex(newIndex);
        setPathStack(newStack);
        setCurrentParentHandle(newParent);
        await loadFiles(currentStorageId, newParent);
    }, [history, historyIndex, currentStorageId, loadFiles]);

    const goForward = useCallback(async () => {
        if (historyIndex >= history.length - 1) return;
        if (currentStorageId === null) return;

        const newIndex = historyIndex + 1;
        const newStack = history[newIndex];
        const newParent = newStack.length > 0 ? newStack[newStack.length - 1].handle : 0xFFFFFFFF;

        setHistoryIndex(newIndex);
        setPathStack(newStack);
        setCurrentParentHandle(newParent);
        await loadFiles(currentStorageId, newParent);
    }, [history, historyIndex, currentStorageId, loadFiles]);

    const goHome = useCallback(async () => {
        if (currentStorageId === null) return;

        const newStack: { handle: number, name: string }[] = [];
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newStack);

        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        setPathStack(newStack);
        setCurrentParentHandle(0xFFFFFFFF);
        await loadFiles(currentStorageId, 0xFFFFFFFF);
    }, [currentStorageId, loadFiles, history, historyIndex]);

    // Clear queue when search or sort changes to prioritize new visible items
    useEffect(() => {
        // Remove queued items from the "loaded" set so they can be re-requested if still visible
        thumbnailQueueRef.current.forEach(file => {
            loadedThumbnailsRef.current.delete(file.handle);
        });
        thumbnailQueueRef.current = [];
        isProcessingQueueRef.current = false;
    }, [searchQuery, sortBy, sortOrder]);

    const loadThumbnail = useCallback((file: MtpObjectInfo) => {
        if (loadedThumbnailsRef.current.has(file.handle)) return;

        // Debug logging for video files
        const isVideo = file.format === MtpObjectFormat.MPEG || file.format === MtpObjectFormat.AVI || file.format === MtpObjectFormat.WMV || file.format === MtpObjectFormat.MP4;
        if (isVideo) {
            console.log(`Queueing thumbnail for video: ${file.filename}, format: ${file.format.toString(16)}, thumbSize: ${file.thumbCompressedSize}`);
        }

        if (file.thumbCompressedSize === 0) {
            // For videos, sometimes the size is reported as 0 but a thumbnail might still exist or be generatable
            if (!isVideo) return;
            console.log(`Attempting to load video thumbnail despite size 0: ${file.filename}`);
        }

        loadedThumbnailsRef.current.add(file.handle);
        thumbnailQueueRef.current.push(file);
        processThumbnailQueue();
    }, [processThumbnailQueue, searchQuery, sortBy, sortOrder]);

    const downloadFile = useCallback(async (file: MtpObjectInfo) => {
        const transferId = Math.random().toString(36).substring(7);
        const newTransfer: FileTransfer = {
            id: transferId,
            filename: file.filename,
            loaded: 0,
            total: file.compressedSize,
            status: 'pending',
            timestamp: Date.now(),
            speed: 0,
            direction: 'download'
        };

        setTransfers(prev => [newTransfer, ...prev]);

        const abortController = new AbortController();
        transferControlsRef.current[transferId] = {
            abortController,
            isPaused: false
        };

        let lastLoaded = 0;
        let lastTime = Date.now();

        try {
            setTransfers(prev => prev.map(t => t.id === transferId ? { ...t, status: 'downloading' } : t));

            const pauseCheck = async () => {
                if (transferControlsRef.current[transferId]?.isPaused) {
                    await new Promise<void>(resolve => {
                        if (transferControlsRef.current[transferId]) {
                            transferControlsRef.current[transferId].resume = resolve;
                        }
                    });
                    // Reset speed calculation after pause
                    lastTime = Date.now();
                }
            };

            const data = await mtpDevice.readFile(
                file.handle,
                (loaded, total) => {
                    const now = Date.now();
                    const timeDiff = now - lastTime;

                    if (timeDiff >= 1000) { // Update speed every second
                        const bytesDiff = loaded - lastLoaded;
                        const speed = (bytesDiff / timeDiff) * 1000; // bytes/sec

                        setTransfers(prev => prev.map(t => t.id === transferId ? { ...t, loaded, total, speed } : t));

                        lastTime = now;
                        lastLoaded = loaded;
                    } else {
                        // Just update progress without speed recalc to keep UI smooth but not jittery
                        setTransfers(prev => prev.map(t => t.id === transferId ? { ...t, loaded, total } : t));
                    }
                },
                {
                    signal: abortController.signal,
                    pause: pauseCheck
                }
            );

            const blob = new Blob([data as unknown as BlobPart], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setTransfers(prev => prev.map(t => t.id === transferId ? { ...t, status: 'completed', loaded: t.total, speed: 0 } : t));
        } catch (err: any) {
            console.error(err);
            setError(`Download failed: ${err.message}`);
            setTransfers(prev => prev.map(t => t.id === transferId ? { ...t, status: 'error', error: err.message, speed: 0 } : t));
        } finally {
            delete transferControlsRef.current[transferId];
        }
    }, [mtpDevice, setTransfers, setError]);

    const uploadFiles = useCallback(async (fileList: FileList) => {
        if (currentStorageId === null) return;

        const filesToUpload = Array.from(fileList);
        const folderHandles: Record<string, number> = {
            "": currentParentHandle
        };

        for (const file of filesToUpload) {
            const transferId = Math.random().toString(36).substring(7);
            const newTransfer: FileTransfer = {
                id: transferId,
                filename: file.name,
                loaded: 0,
                total: file.size,
                status: 'pending',
                timestamp: Date.now(),
                speed: 0,
                direction: 'upload'
            };

            setTransfers(prev => [newTransfer, ...prev]);

            try {
                setTransfers(prev => prev.map(t => t.id === transferId ? { ...t, status: 'uploading' } : t));

                let parent = currentParentHandle;
                const relativePath = file.webkitRelativePath;

                if (relativePath) {
                    const parts = relativePath.split('/');
                    let currentPath = "";
                    for (let i = 0; i < parts.length - 1; i++) {
                        const folderName = parts[i];
                        const parentPath = currentPath;
                        currentPath = currentPath ? `${currentPath}/${folderName}` : folderName;

                        if (!folderHandles[currentPath]) {
                            const parentH = folderHandles[parentPath] || currentParentHandle;
                            try {
                                const newHandle = await mtpDevice.createFolder(folderName, parentH, currentStorageId);
                                folderHandles[currentPath] = newHandle;
                            } catch (e) {
                                console.error(`Failed to create folder ${folderName}`, e);
                                // Try to continue? Or abort?
                                // If folder creation fails, we might fail to upload file.
                                // Maybe the folder already exists? MTP doesn't return existing handle usually, it creates duplicate or errors.
                                // We assume it succeeds or we catch error.
                            }
                        }
                    }

                    const fileParentPath = parts.slice(0, -1).join('/');
                    if (folderHandles[fileParentPath]) {
                        parent = folderHandles[fileParentPath];
                    }
                }

                await mtpDevice.uploadFile(file, parent, currentStorageId, (sent, total) => {
                    setTransfers(prev => prev.map(t => t.id === transferId ? { ...t, loaded: sent, total } : t));
                });

                setTransfers(prev => prev.map(t => t.id === transferId ? { ...t, status: 'completed', loaded: t.total } : t));
            } catch (err: any) {
                console.error(err);
                setTransfers(prev => prev.map(t => t.id === transferId ? { ...t, status: 'error', error: err.message } : t));
            }
        }

        await loadFiles(currentStorageId, currentParentHandle);
    }, [currentStorageId, currentParentHandle, loadFiles]);

    const filteredFiles = useMemo(() => files
        .filter(f => f.filename.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => {
            const aIsFolder = a.format === MtpObjectFormat.Association;
            const bIsFolder = b.format === MtpObjectFormat.Association;

            if (aIsFolder && !bIsFolder) return -1;
            if (!aIsFolder && bIsFolder) return 1;

            let comparison = 0;
            switch (sortBy) {
                case 'name':
                    comparison = a.filename.localeCompare(b.filename);
                    break;
                case 'size':
                    comparison = b.compressedSize - a.compressedSize;
                    break;
                case 'date':
                    comparison = b.dateModified.localeCompare(a.dateModified);
                    break;
            }

            return sortOrder === 'asc' ? comparison : -comparison;
        }), [files, searchQuery, sortBy, sortOrder]);

    const canGoBack = historyIndex > 0;
    const canGoForward = historyIndex < history.length - 1;

    return {
        isConnected,
        isConnecting,
        isLoadingFiles,
        files: filteredFiles,
        connect,
        navigate,
        navigateUp,
        downloadFile,
        uploadFiles,
        loadThumbnail,
        thumbnails,
        error,
        currentPath: pathStack,
        searchQuery,
        setSearchQuery,
        sortBy,
        setSortBy,
        sortOrder,
        setSortOrder,
        viewMode,
        setViewMode,
        transfers,
        goBack,
        goForward,
        goHome,
        canGoBack,
        canGoForward,
        pauseTransfer,
        resumeTransfer
    };
}
