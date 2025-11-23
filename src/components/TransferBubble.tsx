import { useState } from 'react';
import { Upload, Download, Play, Pause, X } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { FileTransfer } from '@/hooks/use-mtp';
import { formatBytes } from '@/utils/format';

interface TransferBubbleProps {
    transfers: FileTransfer[];
    onPause: (id: string) => void;
    onResume: (id: string) => void;
    onCancel: (id: string) => void;
}

export function TransferBubble({ transfers, onPause, onResume, onCancel }: TransferBubbleProps) {
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
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 pointer-events-none">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="pointer-events-auto bg-black/80 border border-white/10 rounded-2xl shadow-2xl w-80 overflow-hidden backdrop-blur-md"
                    >
                        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                            <h3 className="font-medium text-white">Transfers</h3>
                            <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-white transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="max-h-96 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                            {transfers.map((transfer) => (
                                <motion.div
                                    key={transfer.id}
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-3"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-white/10 rounded-lg">
                                            {transfer.direction === 'upload' ? <Upload className="w-4 h-4 text-white/70" /> : <Download className="w-4 h-4 text-white/70" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-white/90 truncate" title={transfer.filename}>
                                                {transfer.filename}
                                            </p>
                                            <div className="flex items-center justify-between mt-1">
                                                <p className={clsx(
                                                    "text-xs",
                                                    transfer.status === 'error' ? "text-red-400" :
                                                        transfer.status === 'completed' ? "text-green-400" :
                                                            transfer.status === 'cancelled' ? "text-orange-400" :
                                                                "text-white/50"
                                                )}>
                                                    {transfer.status === 'downloading' || transfer.status === 'uploading' ? (
                                                        <span className="flex items-center gap-2">
                                                            <span>{formatBytes(transfer.loaded)} / {formatBytes(transfer.total)}</span>
                                                            {transfer.speed !== undefined && (
                                                                <span className="text-white/40">
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

                                    {(transfer.status === 'downloading' || transfer.status === 'uploading' || transfer.status === 'paused' || transfer.status === 'pending') && (
                                        <div className="flex items-center gap-2">
                                            <div className="h-1.5 flex-1 bg-white/10 rounded-full overflow-hidden">
                                                <motion.div
                                                    className={clsx(
                                                        "h-full rounded-full",
                                                        transfer.status === 'paused' ? "bg-yellow-500" :
                                                            transfer.status === 'pending' ? "bg-white/30" : "bg-blue-500"
                                                    )}
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(transfer.loaded / transfer.total) * 100}%` }}
                                                    transition={{ type: "spring", stiffness: 50, damping: 15 }}
                                                />
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {transfer.status === 'paused' ? (
                                                    <button
                                                        onClick={() => onResume(transfer.id)}
                                                        className="p-1 hover:bg-white/10 rounded text-blue-400 transition-colors"
                                                        title="Resume"
                                                    >
                                                        <Play className="w-3 h-3" />
                                                    </button>
                                                ) : transfer.status === 'pending' ? (
                                                    <button
                                                        onClick={() => onCancel(transfer.id)}
                                                        className="p-1 hover:bg-white/10 rounded text-red-400 transition-colors"
                                                        title="Cancel"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => onPause(transfer.id)}
                                                        className="p-1 hover:bg-white/10 rounded text-yellow-400 transition-colors"
                                                        title="Pause"
                                                    >
                                                        <Pause className="w-3 h-3" />
                                                    </button>
                                                )}
                                                {(transfer.status === 'downloading' || transfer.status === 'uploading' || transfer.status === 'paused') && (
                                                    <button
                                                        onClick={() => onCancel(transfer.id)}
                                                        className="p-1 hover:bg-white/10 rounded text-red-400 transition-colors"
                                                        title="Cancel"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    {transfer.status === 'cancelled' && (
                                        <div className="flex items-center gap-2">
                                            <div className="h-1.5 flex-1 bg-white/10 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-orange-500/50"
                                                    style={{ width: `${(transfer.loaded / transfer.total) * 100}%` }}
                                                />
                                            </div>
                                            <span className="text-xs text-orange-400">Cancelled</span>
                                        </div>
                                    )}
                                    {transfer.error && (
                                        <p className="text-xs text-red-400 bg-red-400/10 p-2 rounded-lg border border-red-400/20">
                                            {transfer.error}
                                        </p>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                layout
                onClick={() => setIsOpen(!isOpen)}
                className="relative group pointer-events-auto"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
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
                            className="text-white/10"
                        />
                        <motion.circle
                            cx="32"
                            cy="32"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="transparent"
                            strokeDasharray={circumference}
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset }}
                            transition={{ type: "spring", stiffness: 50, damping: 15 }}
                            className={clsx(
                                isPaused ? "text-yellow-500" : "text-blue-500"
                            )}
                            strokeLinecap="round"
                        />
                    </svg>
                )}

                <div className={clsx(
                    "w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all relative z-10",
                    isDownloading ? "bg-black text-blue-500 border border-white/10" :
                        isPaused ? "bg-black text-yellow-500 border border-white/10" :
                            "bg-blue-600 text-white hover:bg-blue-500"
                )}>
                    {isDownloading || isPaused ? (
                        <span className="text-xs font-bold">{Math.round(progress)}%</span>
                    ) : (
                        <Download className="w-5 h-5" />
                    )}

                    {activeTransfers.length > 0 && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-black flex items-center justify-center"
                        >
                            <span className="text-[10px] font-bold text-white">{activeTransfers.length}</span>
                        </motion.div>
                    )}
                </div>
            </motion.button>
        </div>
    );
}
