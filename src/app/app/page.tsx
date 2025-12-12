'use client';

import { useMtp, FileTransfer } from '@/hooks/use-mtp';
import { MtpObjectInfo, mtpDevice } from '@/lib/mtp/mtp-device';
import { formatMtpDate } from '@/utils/format';
import { MtpObjectFormat } from '@/lib/mtp/constants';
import clsx from 'clsx';
import { useEffect, useRef, useState, memo, useCallback } from 'react';
import {
  Usb,
  ChevronLeft,
  ChevronRight,
  Home as HomeIcon,
  HardDrive,
  Download,
  Trash2,
  Edit2,
  X,
  FolderPlus,
  Upload,
  Search,
  LayoutGrid,
  List,
  ArrowUp,
  ArrowDown,
  Smartphone,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Folder,
  FolderInput,
  Check,
  Play,
  Pause,
  Image as ImageIcon,
  Film,
  File as FileIcon
} from 'lucide-react';
import { FileItem } from '@/components/FileItem';
import { TransferBubble } from '@/components/TransferBubble';
import { formatBytes } from '@/utils/format';

export default function Home() {
  const {
    isConnected, isConnecting, files, connect, navigate, navigateUp, downloadFile, uploadFiles, currentPath, error,
    isLoadingFiles, searchQuery, setSearchQuery, sortBy, setSortBy, loadThumbnail, thumbnails, sortOrder, setSortOrder, transfers,
    goBack, goForward, goHome, canGoBack, canGoForward, pauseTransfer, resumeTransfer, cancelTransfer, viewMode, setViewMode,
    selectedFiles, toggleFileSelection, clearSelection, selectAll, deleteSelected, renameFile, moveFiles, copyFiles,
    createNewFolder, downloadMultiple, currentStorageId, currentParentHandle, loadFiles
  } = useMtp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [renameTarget, setRenameTarget] = useState<MtpObjectInfo | null>(null);
  const [newName, setNewName] = useState('');

  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const [dragOver, setDragOver] = useState<number | null>(null);

  const [showDetailsPanel, setShowDetailsPanel] = useState(false);
  const [detailsFile, setDetailsFile] = useState<MtpObjectInfo | null>(null);

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; file: MtpObjectInfo | null } | null>(null);

  const [isDragSelecting, setIsDragSelecting] = useState(false);
  const [dragSelectStart, setDragSelectStart] = useState<{ x: number; y: number } | null>(null);
  const [dragSelectEnd, setDragSelectEnd] = useState<{ x: number; y: number } | null>(null);
  const fileListRef = useRef<HTMLDivElement>(null);

  const [isDragOver, setIsDragOver] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isConnected) return;

      // Ctrl/Cmd + A - Select All
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        selectAll();
      }

      // Delete key - Delete selected
      if (e.key === 'Delete' && selectedFiles.size > 0) {
        e.preventDefault();
        deleteSelected();
      }

      // Escape - Clear selection, close menus
      if (e.key === 'Escape') {
        setContextMenu(null);
        setShowDetailsPanel(false);
        clearSelection();
      }
    };

    const handleClick = () => {
      setContextMenu(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('click', handleClick);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('click', handleClick);
    };
  }, [isConnected, selectAll, deleteSelected, clearSelection, selectedFiles.size]);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragOver) {
      setIsDragOver(true);
    }
  }, [isDragOver]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set drag over to false if we're leaving the main container
    if (e.currentTarget === e.target) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (!isConnected) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await uploadFiles(files);
    }
  }, [isConnected, uploadFiles]);

  // Clear selection when navigating
  useEffect(() => {
    clearSelection();
  }, [currentPath, clearSelection]);

  return (
    <main className="min-h-screen bg-black text-white font-sans selection:bg-blue-500/30 relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px]" />
      </div>
      {/* Header */}
      <div className="relative z-40 h-16 border-b border-white/10 flex items-center px-6 justify-between bg-black/50 backdrop-blur-xl sticky top-0">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20 overflow-hidden">
              <img src="/logo.png" alt="WebMTP" className="w-full h-full object-cover" />
            </div>
            <span className="font-bold text-lg tracking-tight text-white hidden sm:block">WebMTP</span>
          </div>

          {isConnected && (
            <>
              <div className="h-6 w-px bg-neutral-800 mx-2" />

              {/* Navigation Controls */}
              <div className="flex items-center gap-1">
                <button
                  onClick={goBack}
                  disabled={!canGoBack}
                  className="p-1.5 rounded-md hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                  title="Go Back"
                >
                  <ChevronLeft className="w-5 h-5 text-neutral-400" />
                </button>
                <button
                  onClick={goForward}
                  disabled={!canGoForward}
                  className="p-1.5 rounded-md hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                  title="Go Forward"
                >
                  <ChevronRight className="w-5 h-5 text-neutral-400" />
                </button>
                <button
                  onClick={goHome}
                  className="p-1.5 rounded-md hover:bg-neutral-800 transition-colors"
                  title="Go Home"
                >
                  <HomeIcon className="w-4 h-4 text-neutral-400" />
                </button>
              </div>

              <div className="h-6 w-px bg-neutral-800 mx-2" />

              {/* Breadcrumbs */}
              <div className="flex items-center gap-1 overflow-hidden text-sm mask-linear-fade">
                <button
                  onClick={goHome}
                  className={clsx(
                    "flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors",
                    currentPath.length === 0 ? "bg-neutral-800 text-white" : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50"
                  )}
                >
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>Root</span>
                </button>
                {currentPath.map((folder, i) => (
                  <div key={folder.handle} className="flex items-center gap-1 min-w-0">
                    <span className="text-neutral-600">/</span>
                    <button
                      onClick={() => {
                        // Ideally implement jump to history index
                      }}
                      className={clsx(
                        "px-2 py-1 rounded-md transition-colors truncate max-w-[150px]",
                        i === currentPath.length - 1 ? "bg-neutral-800 text-white font-medium" : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50"
                      )}
                    >
                      {folder.name}
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* File Operations Toolbar */}
        {isConnected && selectedFiles.size > 0 && (
          <div className="flex items-center gap-2 bg-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-800">
            <span className="text-xs text-neutral-400">{selectedFiles.size} selected</span>
            <div className="h-4 w-px bg-neutral-800" />
            <button
              onClick={() => downloadMultiple(Array.from(selectedFiles))}
              className="p-1.5 rounded-md hover:bg-blue-500/10 text-blue-400 hover:text-blue-300 transition-colors"
              title="Download Selected"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => deleteSelected()}
              className="p-1.5 rounded-md hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors"
              title="Delete Selected"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            {selectedFiles.size === 1 && (
              <button
                onClick={() => {
                  const file = files.find(f => selectedFiles.has(f.handle));
                  if (file) {
                    setRenameTarget(file);
                    setNewName(file.filename);
                    setShowRenameDialog(true);
                  }
                }}
                className="p-1.5 rounded-md hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
                title="Rename"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={clearSelection}
              className="p-1.5 rounded-md hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
              title="Clear Selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Search & Sort & Upload */}
        {isConnected && (
          <div className="flex items-center gap-3">
            {/* Create Folder Button */}
            <button
              onClick={() => setShowCreateFolderDialog(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all flex items-center gap-2 border border-neutral-800"
              title="Create Folder"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Folder</span>
            </button>

            <div className="h-6 w-px bg-neutral-800" />

            {/* Upload Controls */}
            <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-lg border border-neutral-800">
              <input
                type="file"
                multiple
                className="hidden"
                ref={fileInputRef}
                onChange={(e) => {
                  if (e.target.files) uploadFiles(e.target.files);
                  e.target.value = ''; // Reset
                }}
              />
              <input
                type="file"
                // @ts-ignore
                webkitdirectory=""
                directory=""
                className="hidden"
                ref={folderInputRef}
                onChange={(e) => {
                  if (e.target.files) uploadFiles(e.target.files);
                  e.target.value = ''; // Reset
                }}
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-md text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all flex items-center gap-2"
                title="Upload Files"
              >
                <Upload className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Files</span>
              </button>
              <div className="w-px h-4 bg-neutral-800" />
              <button
                onClick={() => folderInputRef.current?.click()}
                className="px-3 py-1.5 rounded-md text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all flex items-center gap-2"
                title="Upload Folder"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Folder</span>
              </button>
            </div>

            <div className="h-6 w-px bg-neutral-800" />

            <div className="relative group">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="bg-neutral-900 border border-neutral-800 rounded-full pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 w-32 focus:w-48 transition-all"
              />
            </div>
            <div className="h-6 w-px bg-neutral-800" />

            {/* View Mode Toggle */}
            <div className="flex bg-neutral-900 p-1 rounded-lg border border-neutral-800">
              <button
                onClick={() => setViewMode('grid')}
                className={clsx(
                  "p-1.5 rounded-md transition-all",
                  viewMode === 'grid' ? "bg-neutral-700 text-white shadow-sm" : "text-neutral-400 hover:text-neutral-300"
                )}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={clsx(
                  "p-1.5 rounded-md transition-all",
                  viewMode === 'list' ? "bg-neutral-700 text-white shadow-sm" : "text-neutral-400 hover:text-neutral-300"
                )}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <div className="h-6 w-px bg-neutral-800" />

            <div className="flex bg-neutral-900 p-1 rounded-lg border border-neutral-800">
              {(['name', 'date', 'size'] as const).map((key) => (
                <button
                  key={key}
                  onClick={() => {
                    if (sortBy === key) {
                      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortBy(key);
                      setSortOrder('asc');
                    }
                  }}
                  className={clsx(
                    "px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5",
                    sortBy === key ? "bg-neutral-700 text-white shadow-sm" : "text-neutral-400 hover:text-neutral-300"
                  )}
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                  {sortBy === key && (
                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="relative z-10 p-8">
        {!isConnected ? (
          <div className="h-[calc(100vh-10rem)] flex flex-col items-center justify-center gap-8 animate-in fade-in zoom-in duration-500">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full" />
              <div className="w-24 h-24 bg-neutral-900 border border-neutral-800 rounded-3xl flex items-center justify-center shadow-2xl relative z-10">
                <Smartphone className="w-10 h-10 text-neutral-400" />
              </div>
              {isConnecting && (
                <div className="absolute -right-2 -bottom-2">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
              )}
            </div>
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold text-white">Connect Device</h2>
              <p className="text-neutral-400 max-w-xs mx-auto">
                Connect your Android device via USB and ensure file transfer mode is enabled.
              </p>
            </div>
            <button
              onClick={connect}
              disabled={isConnecting}
              className="bg-white text-black px-10 py-4 rounded-full font-medium hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shadow-lg shadow-white/10"
            >
              {isConnecting ? 'Connecting...' : 'Connect via USB'}
            </button>
            {error && (
              <div className="flex items-center gap-2 text-red-400 bg-red-400/10 px-4 py-2 rounded-lg text-sm border border-red-400/20">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}
          </div>
        ) : (
          <div
            className="space-y-4 pb-24 relative"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Back Button (Mobile/Small screens or just general convenience) */}
            {currentPath.length > 0 && (
              <button
                onClick={navigateUp}
                className="flex items-center gap-2 text-neutral-400 hover:text-white mb-6 px-3 py-2 rounded-lg hover:bg-neutral-900 w-fit transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to {currentPath.length > 1 ? currentPath[currentPath.length - 2].name : 'Root'}</span>
              </button>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-3 text-amber-400 bg-amber-400/10 px-4 py-3 rounded-lg text-sm border border-amber-400/20 mb-4">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium mb-1">Directory Access Issue</p>
                  <p className="text-amber-300/80">{error}</p>
                </div>
              </div>
            )}

            {isLoadingFiles ? (
              <div className="flex flex-col items-center justify-center py-24 text-neutral-500 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <p>Loading files...</p>
              </div>
            ) : files.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center text-neutral-400 gap-6 max-w-md mx-auto">
                <Folder className="w-16 h-16 opacity-30" />
                <div className="space-y-2">
                  <p className="text-lg font-medium text-white">No files found</p>
                  <p className="text-sm">
                    If you're not seeing any files, try these steps:
                  </p>
                </div>
                <ul className="text-sm space-y-2 text-left w-full bg-white/5 p-4 rounded-lg border border-white/10">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5 text-green-400 flex-shrink-0" />
                    <span>Make sure your phone is unlocked and set to <span className="font-medium text-white">File Transfer</span> or <span className="font-medium text-white">MTP</span> mode (not just charging)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5 text-green-400 flex-shrink-0" />
                    <span>Try a different USB port or cable if available</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5 text-green-400 flex-shrink-0" />
                    <span>Check if your phone shows a notification to allow file transfer</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5 text-green-400 flex-shrink-0" />
                    <span>Refresh the page</span>
                  </li>
                </ul>
              </div>
            ) : (
              <div
                ref={fileListRef}
                className={clsx(
                  "relative",
                  viewMode === 'grid'
                    ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6"
                    : "flex flex-col gap-2"
                )}
                onMouseDown={(e) => {
                  if (e.button === 0 && !e.shiftKey && !e.ctrlKey && !e.metaKey && e.target === e.currentTarget) {
                    setIsDragSelecting(true);
                    setDragSelectStart({ x: e.clientX, y: e.clientY });
                    setDragSelectEnd({ x: e.clientX, y: e.clientY });
                    clearSelection();
                  }
                }}
                onMouseMove={(e) => {
                  if (isDragSelecting && dragSelectStart) {
                    setDragSelectEnd({ x: e.clientX, y: e.clientY });
                  }
                }}
                onMouseUp={() => {
                  setIsDragSelecting(false);
                  setDragSelectStart(null);
                  setDragSelectEnd(null);
                }}
              >
                {files.map((file, index) => (
                  <FileItem
                    key={file.handle}
                    file={file}
                    index={index}
                    onNavigate={navigate}
                    onDownload={downloadFile}
                    loadThumbnail={loadThumbnail}
                    thumbnailUrl={thumbnails[file.handle]}
                    viewMode={viewMode}
                    isSelected={selectedFiles.has(file.handle)}
                    onSelect={toggleFileSelection}
                    onShowDetails={(file) => {
                      setDetailsFile(file);
                      setShowDetailsPanel(true);
                    }}
                    onContextMenu={(e, file) => {
                      e.preventDefault();
                      setContextMenu({ x: e.clientX, y: e.clientY, file });
                    }}
                    onFileDragStart={() => {
                      if (!selectedFiles.has(file.handle)) {
                        toggleFileSelection(file.handle, index);
                      }
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (file.format === MtpObjectFormat.Association) {
                        setDragOver(file.handle);
                      }
                    }}
                    onDragLeave={() => setDragOver(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(null);
                      if (file.format === MtpObjectFormat.Association && selectedFiles.size > 0) {
                        moveFiles(Array.from(selectedFiles), file.handle);
                      }
                    }}
                    isDragOver={dragOver === file.handle}
                  />
                ))}

                {/* Drag Select Overlay */}
                {isDragSelecting && dragSelectStart && dragSelectEnd && (
                  <div
                    className="absolute pointer-events-none border-2 border-blue-500 bg-blue-500/10"
                    style={{
                      left: Math.min(dragSelectStart.x, dragSelectEnd.x),
                      top: Math.min(dragSelectStart.y, dragSelectEnd.y),
                      width: Math.abs(dragSelectEnd.x - dragSelectStart.x),
                      height: Math.abs(dragSelectEnd.y - dragSelectStart.y),
                    }}
                  />
                )}
              </div>
            )}

            {/* Drag and Drop Overlay */}
            {isDragOver && (
              <div className="absolute inset-0 bg-blue-500/10 border-2 border-dashed border-blue-500 rounded-lg flex items-center justify-center z-10 pointer-events-none">
                <div className="text-center space-y-3">
                  <Upload className="w-16 h-16 text-blue-500 mx-auto animate-bounce" />
                  <div className="space-y-1">
                    <p className="text-lg font-semibold text-blue-400">Drop files to upload</p>
                    <p className="text-sm text-blue-300/70">Release to start uploading to current folder</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <TransferBubble transfers={transfers} onPause={pauseTransfer} onResume={resumeTransfer} onCancel={cancelTransfer} />

      {/* Rename Dialog */}
      {showRenameDialog && renameTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowRenameDialog(false)}>
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-4">Rename</h2>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
              placeholder="Enter new name"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newName.trim()) {
                  renameFile(renameTarget.handle, newName);
                  setShowRenameDialog(false);
                  setRenameTarget(null);
                } else if (e.key === 'Escape') {
                  setShowRenameDialog(false);
                  setRenameTarget(null);
                }
              }}
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowRenameDialog(false);
                  setRenameTarget(null);
                }}
                className="flex-1 px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (newName.trim()) {
                    renameFile(renameTarget.handle, newName);
                    setShowRenameDialog(false);
                    setRenameTarget(null);
                  }
                }}
                disabled={!newName.trim()}
                className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Folder Dialog */}
      {showCreateFolderDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowCreateFolderDialog(false)}>
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-4">Create Folder</h2>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
              placeholder="Enter folder name"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newFolderName.trim()) {
                  createNewFolder(newFolderName);
                  setShowCreateFolderDialog(false);
                  setNewFolderName('');
                } else if (e.key === 'Escape') {
                  setShowCreateFolderDialog(false);
                  setNewFolderName('');
                }
              }}
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateFolderDialog(false);
                  setNewFolderName('');
                }}
                className="flex-1 px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (newFolderName.trim()) {
                    createNewFolder(newFolderName);
                    setShowCreateFolderDialog(false);
                    setNewFolderName('');
                  }
                }}
                disabled={!newFolderName.trim()}
                className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-neutral-900 border border-neutral-800 rounded-lg shadow-2xl py-1 min-w-48"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.file ? (
            <>
              {contextMenu.file.format !== MtpObjectFormat.Association && (
                <button
                  onClick={() => {
                    downloadFile(contextMenu.file!);
                    setContextMenu(null);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-neutral-800 flex items-center gap-3 text-sm"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              )}
              {contextMenu.file.format === MtpObjectFormat.Association && (
                <button
                  onClick={() => {
                    navigate(contextMenu.file!);
                    setContextMenu(null);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-neutral-800 flex items-center gap-3 text-sm"
                >
                  <FolderInput className="w-4 h-4" />
                  Open
                </button>
              )}
              <button
                onClick={() => {
                  setRenameTarget(contextMenu.file!);
                  setNewName(contextMenu.file!.filename);
                  setShowRenameDialog(true);
                  setContextMenu(null);
                }}
                className="w-full px-4 py-2 text-left hover:bg-neutral-800 flex items-center gap-3 text-sm"
              >
                <Edit2 className="w-4 h-4" />
                Rename
              </button>
              <button
                onClick={async () => {
                  if (contextMenu.file) {
                    await mtpDevice.deleteObject(contextMenu.file.handle);
                    if (currentStorageId) {
                      await loadFiles(currentStorageId, currentParentHandle);
                    }
                  }
                  setContextMenu(null);
                }}
                className="w-full px-4 py-2 text-left hover:bg-red-500/10 text-red-400 flex items-center gap-3 text-sm"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  selectAll();
                  setContextMenu(null);
                }}
                className="w-full px-4 py-2 text-left hover:bg-neutral-800 flex items-center gap-3 text-sm"
              >
                <Check className="w-4 h-4" />
                Select All
              </button>
              <button
                onClick={() => {
                  setShowCreateFolderDialog(true);
                  setContextMenu(null);
                }}
                className="w-full px-4 py-2 text-left hover:bg-neutral-800 flex items-center gap-3 text-sm"
              >
                <FolderPlus className="w-4 h-4" />
                New Folder
              </button>
            </>
          )}
        </div>
      )}

      {/* Details Panel */}
      {showDetailsPanel && detailsFile && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDetailsPanel(false)}>
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-xl font-bold text-white">File Details</h2>
              <button onClick={() => setShowDetailsPanel(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-neutral-500 uppercase">Name</p>
                <p className="text-white font-medium">{detailsFile.filename}</p>
              </div>

              {detailsFile.format !== MtpObjectFormat.Association && (
                <>
                  <div>
                    <p className="text-xs text-neutral-500 uppercase">Size</p>
                    <p className="text-white">{formatBytes(detailsFile.compressedSize)}</p>
                  </div>

                  <div>
                    <p className="text-xs text-neutral-500 uppercase">Type</p>
                    <p className="text-white">{detailsFile.format === MtpObjectFormat.Association ? 'Folder' : 'File'}</p>
                  </div>
                </>
              )}

              {detailsFile.dateModified && (
                <div>
                  <p className="text-xs text-neutral-500 uppercase">Modified</p>
                  <p className="text-white" title={detailsFile.dateModified}>
                    {formatMtpDate(detailsFile.dateModified)}
                  </p>
                </div>
              )}

              {detailsFile.dateCreated && (
                <div>
                  <p className="text-xs text-neutral-500 uppercase">Created</p>
                  <p className="text-white" title={detailsFile.dateCreated}>
                    {formatMtpDate(detailsFile.dateCreated)}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowDetailsPanel(false)}
                className="flex-1 px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white transition-colors"
              >
                Close
              </button>
              {detailsFile.format !== MtpObjectFormat.Association && (
                <button
                  onClick={() => {
                    downloadFile(detailsFile);
                    setShowDetailsPanel(false);
                  }}
                  className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

