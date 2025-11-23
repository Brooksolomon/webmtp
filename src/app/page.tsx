'use client';

import { useMtp, FileTransfer } from '@/hooks/use-mtp';
import { MtpObjectInfo } from '@/lib/mtp/mtp-device';
import { Folder, File, ArrowLeft, Usb, HardDrive, Smartphone, Loader2, AlertCircle, Download, Search, Image as ImageIcon, Film, ArrowUp, ArrowDown, X, ChevronLeft, ChevronRight, Home as HomeIcon, Pause, Play, LayoutGrid, List } from 'lucide-react';
import { MtpObjectFormat } from '@/lib/mtp/constants';
import clsx from 'clsx';
import { useEffect, useRef, useState, memo } from 'react';

export default function Home() {
  const {
    isConnected, isConnecting, files, connect, navigate, navigateUp, downloadFile, currentPath, error,
    isLoadingFiles, searchQuery, setSearchQuery, sortBy, setSortBy, loadThumbnail, thumbnails, sortOrder, setSortOrder, transfers,
    goBack, goForward, goHome, canGoBack, canGoForward, pauseTransfer, resumeTransfer, viewMode, setViewMode
  } = useMtp();

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

        {/* Search & Sort */}
        {isConnected && (
          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search files..."
                className="bg-neutral-900 border border-neutral-800 rounded-full pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 w-48 transition-all"
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
              <div className={clsx(
                viewMode === 'grid'
                  ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
                  : "flex flex-col gap-1"
              )}>
                {files.map((file) => (
                  <FileItem
                    key={file.handle}
                    file={file}
                    onNavigate={navigate}
                    onDownload={downloadFile}
                    loadThumbnail={loadThumbnail}
                    thumbnailUrl={thumbnails[file.handle]}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <TransferBubble transfers={transfers} onPause={pauseTransfer} onResume={resumeTransfer} />
    </main>
  );
}

const FileItem = memo(function FileItem({
  file, onNavigate, onDownload, loadThumbnail, thumbnailUrl, viewMode
}: {
  file: MtpObjectInfo,
  onNavigate: (file: MtpObjectInfo) => void,
  onDownload: (file: MtpObjectInfo) => void,
  loadThumbnail: (file: MtpObjectInfo) => void,
  thumbnailUrl?: string,
  viewMode: 'list' | 'grid'
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

  const handleClick = () => {
    if (isFolder) {
      onNavigate(file);
    } else {
      onDownload(file);
    }
  };

  if (viewMode === 'grid') {
    return (
      <button
        ref={elRef}
        onClick={handleClick}
        className="group flex flex-col items-center gap-3 p-4 rounded-2xl hover:bg-neutral-800/50 transition-all text-center border border-transparent hover:border-neutral-700/50 aspect-square justify-center relative overflow-hidden"
      >
        <div className={clsx(
          "w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 transition-colors overflow-hidden shadow-lg",
          isFolder
            ? "bg-yellow-500/10 text-yellow-500 group-hover:bg-yellow-500/20"
            : "bg-blue-500/10 text-blue-500 group-hover:bg-blue-500/20"
        )}>
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
            <File className="w-8 h-8" />
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
      className="group flex items-start gap-3 p-3 rounded-xl hover:bg-neutral-800/50 transition-all text-left border border-transparent hover:border-neutral-700/50"
    >
      <div className={clsx(
        "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors overflow-hidden",
        isFolder
          ? "bg-yellow-500/10 text-yellow-500 group-hover:bg-yellow-500/20"
          : "bg-blue-500/10 text-blue-500 group-hover:bg-blue-500/20"
      )}>
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
          <File className="w-5 h-5" />
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
  const activeTransfers = transfers.filter(t => ['downloading', 'pending', 'paused'].includes(t.status));
  const hasTransfers = transfers.length > 0;

  if (!hasTransfers) return null;

  const totalLoaded = activeTransfers.reduce((acc, t) => acc + t.loaded, 0);
  const totalSize = activeTransfers.reduce((acc, t) => acc + t.total, 0);
  const progress = totalSize > 0 ? (totalLoaded / totalSize) * 100 : 0;
  const isDownloading = activeTransfers.some(t => t.status === 'downloading');
  const isPaused = activeTransfers.some(t => t.status === 'paused') && !isDownloading;

  // Calculate circle circumference for SVG
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
      {isOpen && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl w-80 overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-200">
          <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-800/50">
            <h3 className="font-semibold text-white text-sm">Transfers</h3>
            <button onClick={() => setIsOpen(false)} className="text-neutral-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto p-2 space-y-2">
            {transfers.map((transfer) => (
              <div key={transfer.id} className="p-3 rounded-xl bg-neutral-800/50 border border-neutral-800">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-white truncate max-w-[140px]" title={transfer.filename}>
                    {transfer.filename}
                  </p>
                  <div className="flex items-center gap-2">
                    {transfer.status === 'downloading' && (
                      <button onClick={() => onPause(transfer.id)} className="p-1 hover:bg-neutral-700 rounded text-neutral-400 hover:text-white transition-colors">
                        <Pause className="w-3 h-3" />
                      </button>
                    )}
                    {transfer.status === 'paused' && (
                      <button onClick={() => onResume(transfer.id)} className="p-1 hover:bg-neutral-700 rounded text-neutral-400 hover:text-white transition-colors">
                        <Play className="w-3 h-3" />
                      </button>
                    )}
                    <span className={clsx(
                      "text-xs font-medium px-2 py-0.5 rounded-full",
                      transfer.status === 'completed' ? "bg-green-500/10 text-green-400" :
                        transfer.status === 'error' ? "bg-red-500/10 text-red-400" :
                          transfer.status === 'paused' ? "bg-yellow-500/10 text-yellow-400" :
                            "bg-blue-500/10 text-blue-400"
                    )}>
                      {transfer.status === 'completed' ? 'Done' :
                        transfer.status === 'error' ? 'Error' :
                          transfer.status === 'paused' ? 'Paused' :
                            `${Math.round((transfer.loaded / transfer.total) * 100)}%`}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
                  <span>{formatBytes(transfer.loaded)} / {formatBytes(transfer.total)}</span>
                  {transfer.speed !== undefined && transfer.status === 'downloading' && (
                    <span>{formatBytes(transfer.speed)}/s</span>
                  )}
                </div>
                <div className="h-1.5 bg-neutral-700 rounded-full overflow-hidden">
                  <div
                    className={clsx(
                      "h-full transition-all duration-300 rounded-full",
                      transfer.status === 'completed' ? "bg-green-500" :
                        transfer.status === 'error' ? "bg-red-500" :
                          transfer.status === 'paused' ? "bg-yellow-500" :
                            "bg-blue-500"
                    )}
                    style={{ width: `${(transfer.loaded / transfer.total) * 100}%` }}
                  />
                </div>
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
        {(isDownloading || isPaused) && (
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
