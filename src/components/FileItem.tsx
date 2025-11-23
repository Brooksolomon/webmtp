import { memo, useRef, useEffect } from 'react';
import {
    Folder,
    Image as ImageIcon,
    Film,
    File as FileIcon,
    Check,
    Download
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { MtpObjectInfo } from '@/lib/mtp/mtp-device';
import { MtpObjectFormat } from '@/lib/mtp/constants';
import { formatBytes } from '@/utils/format';

interface FileItemProps {
    file: MtpObjectInfo;
    index: number;
    onNavigate: (file: MtpObjectInfo) => void;
    onDownload: (file: MtpObjectInfo) => void;
    loadThumbnail: (file: MtpObjectInfo) => void;
    thumbnailUrl?: string;
    viewMode: 'list' | 'grid';
    isSelected: boolean;
    onSelect: (handle: number, index: number, event?: React.MouseEvent) => void;
    onShowDetails: (file: MtpObjectInfo) => void;
    onContextMenu: (e: React.MouseEvent, file: MtpObjectInfo) => void;
    onFileDragStart: () => void;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: () => void;
    onDrop: (e: React.DragEvent) => void;
    isDragOver: boolean;
}

export const FileItem = memo(function FileItem({
    file, index, onNavigate, onDownload, loadThumbnail, thumbnailUrl, viewMode, isSelected, onSelect,
    onShowDetails, onContextMenu, onFileDragStart, onDragOver, onDragLeave, onDrop, isDragOver
}: FileItemProps) {
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
            <motion.button
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                ref={elRef}
                onClick={handleClick}
                onContextMenu={handleContextMenu}
                draggable
                onDragStart={onFileDragStart}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className={clsx(
                    "group flex flex-col items-center gap-3 p-4 rounded-2xl transition-colors text-center border relative overflow-hidden aspect-square justify-center",
                    isSelected
                        ? "bg-blue-500/20 border-blue-500/50"
                        : "border-transparent hover:border-white/10 hover:bg-white/5",
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
                        <div className="absolute top-2 left-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center z-10 shadow-md">
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
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            onDownload(file);
                        }}
                        className="absolute top-2 right-2 p-2 rounded-lg bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm"
                    >
                        <Download className="w-4 h-4" />
                    </motion.div>
                )}
            </motion.button>
        );
    }

    return (
        <motion.button
            layout
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            ref={elRef}
            onClick={handleClick}
            onContextMenu={handleContextMenu}
            draggable
            onDragStart={onFileDragStart}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={clsx(
                "group flex items-center gap-4 p-3 rounded-xl transition-colors text-left border w-full",
                isSelected
                    ? "bg-blue-500/20 border-blue-500/50"
                    : "border-transparent hover:border-white/10 hover:bg-white/5",
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
                    className="p-2 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                >
                    <Download className="w-4 h-4" />
                </div>
            )}
        </motion.button>
    );
});
