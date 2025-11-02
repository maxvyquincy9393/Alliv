import { useState, useRef, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadImage, validateImage } from '../lib/upload';

interface PhotoUploaderProps {
  onUploadComplete: (url: string) => void;
  currentPhoto?: string | null;
}

export const PhotoUploader = ({ onUploadComplete, currentPhoto }: PhotoUploaderProps) => {
  const [preview, setPreview] = useState<string | null>(currentPhoto || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate
    const validation = validateImage(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    setUploading(true);
    try {
      const url = await uploadImage(file);
      onUploadComplete(url);
    } catch (err) {
      setError('Upload failed. Please try again.');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <motion.div
        whileHover={{ scale: preview ? 1.02 : 1.05 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleClick}
        className="relative cursor-pointer group"
      >
        {/* Photo circle */}
        <div className={`
          w-40 h-40 rounded-full overflow-hidden
          ${preview ? 'ring-2 ring-accent-blue/50 shadow-glow' : 'glass border-2 border-dashed border-white/20'}
          transition-all duration-300
        `}>
          <AnimatePresence mode="wait">
            {preview ? (
              <motion.img
                key="preview"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                src={preview}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full flex flex-col items-center justify-center text-white/40"
              >
                <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-xs">Add Photo</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Uploading overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}

        {/* Edit icon on hover */}
        {preview && !uploading && (
          <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            </svg>
          </div>
        )}
      </motion.div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-3 text-sm text-red-400"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <p className="mt-4 text-sm text-white/40 text-center max-w-xs">
        Upload a clear photo of yourself. This helps others connect with you.
      </p>
    </div>
  );
};
