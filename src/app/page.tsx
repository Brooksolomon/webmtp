'use client';

import { useMtp, FileTransfer } from '@/hooks/use-mtp';
import { MtpObjectInfo, mtpDevice } from '@/lib/mtp/mtp-device';
import { formatMtpDate } from '@/utils/format';
import { MtpObjectFormat } from '@/lib/mtp/constants';
import clsx from 'clsx';
import { useEffect, useRef, useState, memo } from 'react';
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

export default function Home() {
  const {
    isConnected, isConnecting, files, connect, navigate, navigateUp, downloadFile, uploadFiles, currentPath, error,
    isLoadingFiles, searchQuery, setSearchQuery, sortBy, setSortBy, loadThumbnail, thumbnails, sortOrder, setSortOrder, transfers,
    goBack, goForward, goHome, canGoBack, canGoForward, pauseTransfer, resumeTransfer, viewMode, setViewMode,
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

  // Clear selection when navigating
  useEffect(() => {
    clearSelection();
  }, [currentPath, clearSelection]);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-200 font-sans selection:bg-blue-500/30">
      {/* Header */}
      <div className="h-16 border-b border-neutral-800 flex items-center px-4 justify-between bg-neutral-900/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-900/20">
              <Usb className="w-4 h-4 text-white" />
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
      <div className="p-4">
        {!isConnected ? (
          <div className="h-[calc(100vh-8rem)] flex flex-col items-center justify-center gap-6 animate-in fade-in zoom-in duration-500">
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
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-white">Connect Device</h2>
              <p className="text-neutral-400 max-w-xs mx-auto">
                Connect your Android device via USB and ensure file transfer mode is enabled.
              </p>
            </div>
            <button
              onClick={connect}
              disabled={isConnecting}
              className="bg-white text-black px-8 py-3 rounded-full font-medium hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shadow-lg shadow-white/10"
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
          <div className="space-y-2 pb-20">
            {/* Back Button (Mobile/Small screens or just general convenience) */}
            {currentPath.length > 0 && (
              <button
                onClick={navigateUp}
                className="flex items-center gap-2 text-neutral-400 hover:text-white mb-4 px-2 py-1 rounded-lg hover:bg-neutral-900 w-fit transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to {currentPath.length > 1 ? currentPath[currentPath.length - 2].name : 'Root'}</span>
              </button>
            )}

            {isLoadingFiles ? (
              <div className="flex flex-col items-center justify-center py-20 text-neutral-500 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <p>Loading files...</p>
              </div>
            ) : files.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-neutral-500 gap-3">
                <Folder className="w-12 h-12 opacity-20" />
                <p>No files found</p>
              </div>
            ) : (
              <div 
                ref={fileListRef}
                className={clsx(
                  "relative",
                  viewMode === 'grid'
                    ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
                    : "flex flex-col gap-1"
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
          </div>
        )}
      </div>
      <TransferBubble transfers={transfers} onPause={pauseTransfer} onResume={resumeTransfer} />
      
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

const FileItem = memo(function FileItem({
  file, index, onNavigate, onDownload, loadThumbnail, thumbnailUrl, viewMode, isSelected, onSelect,
  onShowDetails, onContextMenu, onFileDragStart, onDragOver, onDragLeave, onDrop, isDragOver
}: {
  file: MtpObjectInfo,
  index: number,
  onNavigate: (file: MtpObjectInfo) => void,
  onDownload: (file: MtpObjectInfo) => void,
  loadThumbnail: (file: MtpObjectInfo) => void,
  thumbnailUrl?: string,
  viewMode: 'list' | 'grid',
  isSelected: boolean,
  onSelect: (handle: number, index: number, event?: React.MouseEvent) => void,
  onShowDetails: (file: MtpObjectInfo) => void,
  onContextMenu: (e: React.MouseEvent, file: MtpObjectInfo) => void,
  onFileDragStart: () => void,
  onDragOver: (e: React.DragEvent) => void,
  onDragLeave: () => void,
  onDrop: (e: React.DragEvent) => void,
  isDragOver: boolean
}) {
  const elRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!elRef.current) return;

    const isFolder = file.format === MtpObjectFormat.Association;

    const isImageFormat = file.format === MtpObjectFormat.EXIF_JPEG || file.format === MtpObjectFormat.PNG || file.format === MtpObjectFormat.BMP || file.format === MtpObjectFormat.GIF;
    const isVideoFormat = file.format === MtpObjectFormat.MPEG || file.format === MtpObjectFormat.AVI || file.format === MtpObjectFormat.WMV || file.format === MtpObjectFormat.MP4;

    const ext = file.filename.split('.').pop()?.toLowerCase();
    const isImageExt = ['jpg', 'jpeg', 'png', 'bmp', 'gif', 'webp'].includes(ext || '');
    const isVideoExt = ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm', '3gp'].includes(ext || '');

    const isImage = isImageFormat || isImageExt;
    const isVideo = isVideoFormat || isVideoExt;

    // Only load thumbnails for image/video files and if it's not a folder
    if (isFolder || (!isImage && !isVideo)) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        loadThumbnail(file);
        observer.disconnect();
      }
    });

    observer.observe(elRef.current);

    return () => observer.disconnect();
  }, [file, loadThumbnail]);

  const isFolder = file.format === MtpObjectFormat.Association;

  const isImageFormat = file.format === MtpObjectFormat.EXIF_JPEG || file.format === MtpObjectFormat.PNG || file.format === MtpObjectFormat.BMP || file.format === MtpObjectFormat.GIF;
  const isVideoFormat = file.format === MtpObjectFormat.MPEG || file.format === MtpObjectFormat.AVI || file.format === MtpObjectFormat.WMV || file.format === MtpObjectFormat.MP4;

  const ext = file.filename.split('.').pop()?.toLowerCase();
  const isImageExt = ['jpg', 'jpeg', 'png', 'bmp', 'gif', 'webp'].includes(ext || '');
  const isVideoExt = ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm', '3gp'].includes(ext || '');

  const isImage = isImageFormat || isImageExt;
  const isVideo = isVideoFormat || isVideoExt;

  const handleClick = (e: React.MouseEvent) => {
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      onSelect(file.handle, index, e);
    } else if (isFolder) {
      onNavigate(file);
    } else {
      onShowDetails(file);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onContextMenu(e, file);
  };

  if (viewMode === 'grid') {
    return (
      <button
        ref={elRef}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        draggable
        onDragStart={onFileDragStart}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={clsx(
          "group flex flex-col items-center gap-3 p-4 rounded-2xl transition-all text-center border relative overflow-hidden aspect-square justify-center",
          isSelected 
            ? "bg-blue-500/20 border-blue-500/50 hover:bg-blue-500/30" 
            : "border-transparent hover:border-neutral-700/50 hover:bg-neutral-800/50",
          isDragOver && "ring-2 ring-blue-500 bg-blue-500/10"
        )}
      >
        <div className={clsx(
          "w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 transition-colors overflow-hidden shadow-lg",
          isFolder
            ? "bg-yellow-500/10 text-yellow-500 group-hover:bg-yellow-500/20"
            : "bg-blue-500/10 text-blue-500 group-hover:bg-blue-500/20"
        )}>
          {isSelected && (
            <div className="absolute top-1 left-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center z-10">
              <Check className="w-3 h-3 text-white" />
            </div>
          )}
          {isFolder ? (
            <Folder className="w-8 h-8 fill-current" />
          ) : isImage ? (
            thumbnailUrl ? (
              <img src={thumbnailUrl} alt={file.filename} className="w-full h-full object-cover" />
            ) : (
              <ImageIcon className="w-8 h-8" />
            )
          ) : isVideo ? (
            thumbnailUrl ? (
              <img src={thumbnailUrl} alt={file.filename} className="w-full h-full object-cover" />
            ) : (
              <Film className="w-8 h-8" />
            )
          ) : (
            <FileIcon className="w-8 h-8" />
          )}
        </div>
        <div className="min-w-0 w-full">
          <p className="text-sm font-medium text-neutral-200 truncate group-hover:text-white transition-colors w-full">
            {file.filename}
          </p>
          <p className="text-xs text-neutral-500 truncate mt-0.5">
            {file.format === MtpObjectFormat.Association ? 'Folder' : formatBytes(file.compressedSize)}
          </p>
        </div>
        {file.format !== MtpObjectFormat.Association && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              onDownload(file);
            }}
            className="absolute top-2 right-2 p-2 rounded-lg bg-neutral-900/80 text-neutral-400 hover:text-white opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
          >
            <Download className="w-4 h-4" />
          </div>
        )}
      </button>
    );
  }

  return (
    <button
      ref={elRef}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      draggable
      onDragStart={onFileDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={clsx(
        "group flex items-start gap-3 p-3 rounded-xl transition-all text-left border",
        isSelected 
          ? "bg-blue-500/20 border-blue-500/50 hover:bg-blue-500/30" 
          : "border-transparent hover:border-neutral-700/50 hover:bg-neutral-800/50",
        isDragOver && "ring-2 ring-blue-500 bg-blue-500/10"
      )}
    >
      <div className={clsx(
        "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors overflow-hidden relative",
        isFolder
          ? "bg-yellow-500/10 text-yellow-500 group-hover:bg-yellow-500/20"
          : "bg-blue-500/10 text-blue-500 group-hover:bg-blue-500/20"
      )}>
        {isSelected && (
          <div className="absolute top-0 left-0 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center z-10">
            <Check className="w-2.5 h-2.5 text-white" />
          </div>
        )}
        {isFolder ? (
          <Folder className="w-5 h-5 fill-current" />
        ) : isImage ? (
          thumbnailUrl ? (
            <img src={thumbnailUrl} alt={file.filename} className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="w-5 h-5" />
          )
        ) : isVideo ? (
          thumbnailUrl ? (
            <img src={thumbnailUrl} alt={file.filename} className="w-full h-full object-cover" />
          ) : (
            <Film className="w-5 h-5" />
          )
        ) : (
          <FileIcon className="w-5 h-5" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-neutral-200 truncate group-hover:text-white transition-colors">
          {file.filename}
        </p>
        <p className="text-xs text-neutral-500 truncate mt-0.5">
          {file.format === MtpObjectFormat.Association ? 'Folder' : formatBytes(file.compressedSize)}
        </p>
      </div>
      {file.format !== MtpObjectFormat.Association && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            onDownload(file);
          }}
          className="p-2 rounded-lg hover:bg-neutral-700 text-neutral-400 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
        >
          <Download className="w-4 h-4" />
        </div>
      )}
    </button>
  );
});

function TransferBubble({ transfers, onPause, onResume }: { transfers: FileTransfer[], onPause: (id: string) => void, onResume: (id: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const activeTransfers = transfers.filter(t => ['downloading', 'pending', 'paused', 'uploading'].includes(t.status));
  const hasTransfers = transfers.length > 0;

  if (!hasTransfers) return null;

  const totalLoaded = activeTransfers.reduce((acc, t) => acc + t.loaded, 0);
  const totalSize = activeTransfers.reduce((acc, t) => acc + t.total, 0);
  const progress = totalSize > 0 ? (totalLoaded / totalSize) * 100 : 0;
  const isDownloading = activeTransfers.some(t => t.status === 'downloading');
  const isUploading = activeTransfers.some(t => t.status === 'uploading');
  const isPaused = activeTransfers.some(t => t.status === 'paused') && !isDownloading && !isUploading;

  // Calculate circle circumference for SVG
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
      {isOpen && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl w-80 overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-200">
          <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/50 backdrop-blur-sm">
            <h3 className="font-medium text-white">Transfers</h3>
            <button onClick={() => setIsOpen(false)} className="text-neutral-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto p-2 space-y-1">
            {transfers.map((transfer) => (
              <div key={transfer.id} className="p-3 rounded-xl bg-neutral-800/30 border border-neutral-800/50 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-neutral-800 rounded-lg">
                    {transfer.direction === 'upload' ? <Upload className="w-4 h-4 text-neutral-400" /> : <Download className="w-4 h-4 text-neutral-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-200 truncate" title={transfer.filename}>
                      {transfer.filename}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <p className={clsx(
                        "text-xs",
                        transfer.status === 'error' ? "text-red-400" :
                          transfer.status === 'completed' ? "text-green-400" :
                            "text-neutral-500"
                      )}>
                        {transfer.status === 'downloading' || transfer.status === 'uploading' ? (
                          <span className="flex items-center gap-2">
                            <span>{formatBytes(transfer.loaded)} / {formatBytes(transfer.total)}</span>
                            {transfer.speed !== undefined && (
                              <span className="text-neutral-400">
                                ({formatBytes(transfer.speed)}/s)
                              </span>
                            )}
                          </span>
                        ) : (
                          transfer.status.charAt(0).toUpperCase() + transfer.status.slice(1)
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {(transfer.status === 'downloading' || transfer.status === 'uploading' || transfer.status === 'paused') && (
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className={clsx(
                          "h-full rounded-full transition-all duration-300",
                          transfer.status === 'paused' ? "bg-yellow-500" : "bg-blue-500"
                        )}
                        style={{ width: `${(transfer.loaded / transfer.total) * 100}%` }}
                      />
                    </div>
                    {transfer.status === 'paused' ? (
                      <button
                        onClick={() => onResume(transfer.id)}
                        className="p-1 hover:bg-neutral-700 rounded text-blue-400"
                        title="Resume"
                      >
                        <Play className="w-3 h-3" />
                      </button>
                    ) : (
                      <button
                        onClick={() => onPause(transfer.id)}
                        className="p-1 hover:bg-neutral-700 rounded text-yellow-400"
                        title="Pause"
                      >
                        <Pause className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
                {transfer.error && (
                  <p className="text-xs text-red-400 bg-red-400/10 p-2 rounded-lg border border-red-400/20">
                    {transfer.error}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative group"
      >
        {/* Progress Circle */}
        {(isDownloading || isUploading || isPaused) && (
          <svg className="w-16 h-16 transform -rotate-90 absolute -top-2 -left-2 pointer-events-none">
            <circle
              cx="32"
              cy="32"
              r={radius}
              stroke="currentColor"
              strokeWidth="3"
              fill="transparent"
              className="text-neutral-800"
            />
            <circle
              cx="32"
              cy="32"
              r={radius}
              stroke="currentColor"
              strokeWidth="3"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className={clsx(
                "transition-all duration-300",
                isPaused ? "text-yellow-500" : "text-blue-500"
              )}
              strokeLinecap="round"
            />
          </svg>
        )}

        <div className={clsx(
          "w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all relative z-10",
          isDownloading ? "bg-neutral-900 text-blue-500" :
            isPaused ? "bg-neutral-900 text-yellow-500" :
              "bg-blue-600 text-white hover:bg-blue-500"
        )}>
          {isDownloading || isPaused ? (
            <span className="text-xs font-bold">{Math.round(progress)}%</span>
          ) : (
            <Download className="w-5 h-5" />
          )}

          {activeTransfers.length > 0 && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-neutral-950 flex items-center justify-center">
              <span className="text-[10px] font-bold text-white">{activeTransfers.length}</span>
            </div>
          )}
        </div>
      </button>
    </div>
  );
}

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
