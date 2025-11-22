'use client';

import { useMtp } from '@/hooks/use-mtp';
import { Folder, File, ArrowLeft, Usb, HardDrive, Smartphone, Loader2, AlertCircle, Download, Search, Image as ImageIcon, Film, ArrowUp, ArrowDown } from 'lucide-react';
import { MtpObjectFormat } from '@/lib/mtp/constants';
import clsx from 'clsx';
import { useEffect, useRef } from 'react';

export default function Home() {
  const {
    isConnected, isConnecting, files, connect, navigate, navigateUp, downloadFile, currentPath, error,
    isLoadingFiles, searchQuery, setSearchQuery, sortBy, setSortBy, loadThumbnail, thumbnails, sortOrder, setSortOrder
  } = useMtp();

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-200 p-4 md:p-8 font-sans selection:bg-blue-500/30">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <header className="flex items-center justify-between pb-6 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/20">
              <Usb className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">WebMTP</h1>
              <p className="text-xs text-neutral-500 font-medium">Browser-based File Transfer</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {!isConnected && (
              <button
                onClick={connect}
                disabled={isConnecting}
                className="flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-lg font-semibold hover:bg-neutral-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-white/5"
              >
                {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />}
                {isConnecting ? 'Connecting...' : 'Connect Device'}
              </button>
            )}
            {isConnected && (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-400 rounded-full text-sm font-medium border border-green-500/20">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Connected
              </div>
            )}
          </div>
        </header>

        {/* Error Banner */}
        {error && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Connection Failed</p>
              <p className="text-sm opacity-90">{error}</p>
            </div>
          </div>
        )}

        {/* Main Content */}
        {!isConnected ? (
          <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
            <div className="w-24 h-24 rounded-full bg-neutral-900 flex items-center justify-center border border-neutral-800">
              <Smartphone className="w-10 h-10 text-neutral-600" />
            </div>
            <div className="max-w-md space-y-2">
              <h2 className="text-2xl font-bold text-white">Connect your Android device</h2>
              <p className="text-neutral-400">
                Make sure your device is unlocked and "File Transfer" (MTP) is selected in USB settings.
              </p>
            </div>
            <button
              onClick={connect}
              disabled={isConnecting}
              className="px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-500 transition-all shadow-xl shadow-blue-900/20 hover:shadow-blue-900/40 hover:-translate-y-0.5"
            >
              Connect via USB
            </button>
          </div>
        ) : (
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl overflow-hidden backdrop-blur-sm">
            {/* Breadcrumbs / Toolbar */}
            <div className="p-4 border-b border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2 overflow-x-auto">
                <button
                  onClick={navigateUp}
                  disabled={currentPath.length === 0}
                  className="p-2 hover:bg-neutral-800 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2 text-sm font-medium px-2">
                  <span className={clsx("flex items-center gap-2", currentPath.length === 0 ? "text-white" : "text-neutral-500")}>
                    <HardDrive className="w-4 h-4" />
                    Storage
                  </span>
                  {currentPath.map((folder, i) => (
                    <div key={folder.handle} className="flex items-center gap-2">
                      <span className="text-neutral-700">/</span>
                      <span className={clsx(i === currentPath.length - 1 ? "text-white" : "text-neutral-500")}>
                        {folder.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="text"
                    placeholder="Search files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-neutral-800 border-none rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-neutral-500 focus:ring-2 focus:ring-blue-500/50 w-full md:w-64"
                  />
                </div>

                <div className="flex items-center gap-2 bg-neutral-800 rounded-lg p-1">
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
            </div>

            {/* File List */}
            <div className="min-h-[400px] relative">
              {isLoadingFiles && (
                <div className="absolute inset-0 bg-neutral-900/50 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-b-2xl">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                  <p className="text-sm text-neutral-400 font-medium">Loading files...</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
                {files.map((file) => (
                  <FileItem
                    key={file.handle}
                    file={file}
                    navigate={navigate}
                    downloadFile={downloadFile}
                    loadThumbnail={loadThumbnail}
                    thumbnailUrl={thumbnails[file.handle]}
                  />
                ))}

                {!isLoadingFiles && files.length === 0 && (
                  <div className="col-span-full py-12 text-center text-neutral-500">
                    <p>This folder is empty</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

// FileItem Component
function FileItem({
  file, navigate, downloadFile, loadThumbnail, thumbnailUrl
}: {
  file: any, navigate: (file: any) => void, downloadFile: (file: any) => void, loadThumbnail: (file: any) => void, thumbnailUrl?: string
}) {
  const elRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!elRef.current) return;

    const isFolder = file.format === MtpObjectFormat.Association;
    const isImage = file.format === MtpObjectFormat.EXIF_JPEG || file.format === MtpObjectFormat.PNG || file.format === MtpObjectFormat.BMP || file.format === MtpObjectFormat.GIF;
    const isVideo = file.format === MtpObjectFormat.MPEG || file.format === MtpObjectFormat.AVI;

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
  const isImage = file.format === MtpObjectFormat.EXIF_JPEG || file.format === MtpObjectFormat.PNG || file.format === MtpObjectFormat.BMP || file.format === MtpObjectFormat.GIF;
  const isVideo = file.format === MtpObjectFormat.MPEG || file.format === MtpObjectFormat.AVI || file.format === MtpObjectFormat.WMV || file.format === MtpObjectFormat.MP4;

  const handleClick = () => {
    if (isFolder) {
      navigate(file);
    } else {
      downloadFile(file);
    }
  };

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
            downloadFile(file);
          }}
          className="p-2 rounded-lg hover:bg-neutral-700 text-neutral-400 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
        >
          <Download className="w-4 h-4" />
        </div>
      )}
    </button>
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
