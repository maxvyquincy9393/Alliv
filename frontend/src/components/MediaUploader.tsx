import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Image as ImageIcon, Video, Loader2, AlertCircle } from 'lucide-react';
import type { Media } from '../types/post';
import api from '../services/api';

interface MediaUploaderProps {
    onMediaAdded: (media: Media[]) => void;
    onMediaRemoved: (url: string) => void;
    maxFiles?: number;
    currentMedia?: Media[];
}

export const MediaUploader = ({
    onMediaAdded,
    onMediaRemoved,
    maxFiles = 10,
    currentMedia = []
}: MediaUploaderProps) => {
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const validateFile = (file: File): { valid: boolean; error?: string } => {
        const imageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        const videoTypes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'];

        const isImage = imageTypes.includes(file.type);
        const isVideo = videoTypes.includes(file.type);

        if (!isImage && !isVideo) {
            return { valid: false, error: `Unsupported file type: ${file.type}` };
        }

        const maxSize = isImage ? 5 * 1024 * 1024 : 100 * 1024 * 1024; // 5MB for images, 100MB for videos

        if (file.size > maxSize) {
            const maxSizeMB = maxSize / 1024 / 1024;
            return { valid: false, error: `File too large. Max size: ${maxSizeMB}MB for ${isImage ? 'images' : 'videos'}` };
        }

        return { valid: true };
    };

    const uploadFiles = async (files: FileList) => {
        if (currentMedia.length + files.length > maxFiles) {
            setError(`Maximum ${maxFiles} files allowed`);
            return;
        }

        setUploading(true);
        setError(null);
        setUploadProgress(0);

        const validFiles: File[] = [];
        const errors: string[] = [];

        // Validate all files first
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const validation = validateFile(file);

            if (validation.valid) {
                validFiles.push(file);
            } else {
                errors.push(`${file.name}: ${validation.error}`);
            }
        }

        if (errors.length > 0) {
            setError(errors.join('; '));
        }

        if (validFiles.length === 0) {
            setUploading(false);
            return;
        }

        try {
            const uploadedMedia: Media[] = [];

            for (let i = 0; i < validFiles.length; i++) {
                const file = validFiles[i];
                setUploadProgress(Math.round((i / validFiles.length) * 100));

                const formData = new FormData();
                formData.append('file', file);

                const response = await api.media.uploadMedia(formData);

                if (response.data && response.data.media) {
                    uploadedMedia.push(response.data.media);
                }
            }

            setUploadProgress(100);
            onMediaAdded(uploadedMedia);

            // Reset input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (err: any) {
            console.error('Upload error:', err);
            setError(err.message || 'Failed to upload files');
        } finally {
            setUploading(false);
            setTimeout(() => setUploadProgress(0), 1000);
        }
    };

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            uploadFiles(e.dataTransfer.files);
        }
    }, [uploadFiles]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            uploadFiles(e.target.files);
        }
    };

    const handleRemove = async (url: string) => {
        try {
            await api.media.deleteMedia(url);
            onMediaRemoved(url);
        } catch (err) {
            console.error('Delete error:', err);
            setError('Failed to delete media');
        }
    };

    return (
        <div className="space-y-4">
            {/* Upload Zone */}
            <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
          relative border-2 border-dashed rounded-2xl p-8 transition-all cursor-pointer
          ${dragActive
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-slate-600 hover:border-slate-500 hover:bg-slate-800/30'
                    }
          ${uploading ? 'pointer-events-none opacity-50' : ''}
        `}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={uploading || currentMedia.length >= maxFiles}
                />

                <div className="flex flex-col items-center justify-center text-center">
                    {uploading ? (
                        <>
                            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                            <p className="text-white font-medium">Uploading... {uploadProgress}%</p>
                            <div className="w-full max-w-xs h-2 bg-slate-700 rounded-full mt-3 overflow-hidden">
                                <motion.div
                                    className="h-full bg-blue-500"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${uploadProgress}%` }}
                                    transition={{ duration: 0.3 }}
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <Upload className="w-12 h-12 text-slate-400 mb-4" />
                            <h3 className="text-lg font-semibold text-white mb-2">
                                Drop files here or click to select
                            </h3>
                            <p className="text-sm text-slate-400">
                                Images (JPG, PNG, WebP, GIF) up to 5MB<br />
                                Videos (MP4, MOV, WebM) up to 100MB<br />
                                Maximum {maxFiles} files
                            </p>
                            <p className="text-xs text-slate-500 mt-2">
                                {currentMedia.length} / {maxFiles} files uploaded
                            </p>
                        </>
                    )}
                </div>
            </div>

            {/* Error Message */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl"
                    >
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm text-red-400">{error}</p>
                        </div>
                        <button
                            onClick={() => setError(null)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Media Preview Grid */}
            {currentMedia.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    <AnimatePresence>
                        {currentMedia.map((media, index) => (
                            <motion.div
                                key={media.url}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: index * 0.05 }}
                                className="relative aspect-square rounded-xl overflow-hidden bg-slate-800 border border-slate-700 group"
                            >
                                {media.type === 'image' ? (
                                    <img
                                        src={media.url}
                                        alt="Upload preview"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-900">
                                        <Video className="w-12 h-12 text-slate-500" />
                                    </div>
                                )}

                                {/* Media Type Badge */}
                                <div className="absolute top-2 left-2 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm">
                                    {media.type === 'image' ? (
                                        <ImageIcon className="w-4 h-4 text-white" />
                                    ) : (
                                        <Video className="w-4 h-4 text-white" />
                                    )}
                                </div>

                                {/* Remove Button */}
                                <button
                                    onClick={() => handleRemove(media.url)}
                                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500/90 hover:bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110"
                                >
                                    <X size={16} />
                                </button>

                                {/* File Info */}
                                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                    <p className="text-xs text-white truncate">
                                        {media.filename || 'Untitled'}
                                    </p>
                                    {media.size && (
                                        <p className="text-xs text-slate-300">
                                            {(media.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};
