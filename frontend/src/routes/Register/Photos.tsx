import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Upload, Edit2, AlertCircle } from 'lucide-react';
import { GlassButton } from '../../components/GlassButton';
import { PhotoEditor } from '../../components/PhotoEditor';
import { fadeInUp, stagger } from '../../lib/motion';
import { useRegistrationStore } from '../../store/registration';
import { compressImage, validateImage } from '../../lib/upload';

export const Photos = () => {
  const navigate = useNavigate();
  const { data, setData } = useRegistrationStore();
  const [photos, setPhotos] = useState<string[]>(data.photos || []);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [error, setError] = useState<string>('');

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || photos.length >= 6) return;

    setUploading(true);
    setError('');
    const newPhotos = [...photos];

    for (let i = 0; i < files.length && newPhotos.length < 6; i++) {
      const file = files[i];
      try {
        validateImage(file);
        const compressed = await compressImage(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          // Open editor for each uploaded photo
          setEditingPhoto(reader.result as string);
          setEditingIndex(newPhotos.length);
          newPhotos.push(reader.result as string);
        };
        reader.readAsDataURL(compressed);
      } catch (error) {
        setError('Failed to upload photo. Please try again.');
        console.error('Upload failed:', error);
      }
    }

    setPhotos(newPhotos);
    setUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleContinue = () => {
    if (photos.length < 2) {
      setError('Minimum 2 photos required to continue');
      return;
    }
    setData({ photos });
    navigate('/register/info');
  };

  const handlePhotoEdit = (index: number) => {
    setEditingPhoto(photos[index]);
    setEditingIndex(index);
  };

  const handlePhotoSave = (editedPhoto: string) => {
    if (editingIndex !== null) {
      const newPhotos = [...photos];
      newPhotos[editingIndex] = editedPhoto;
      setPhotos(newPhotos);
    }
    setEditingPhoto(null);
    setEditingIndex(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <motion.div
        variants={stagger(0.1)}
        initial="hidden"
        animate="show"
        className="max-w-3xl w-full"
      >
        {/* Header */}
        <motion.div variants={fadeInUp} className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-3">Portfolio Photos</h1>
          <p className="text-white/60">
            Upload 2-6 photos (minimum 2 required). Each photo will open in editor.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="h-1 w-8 bg-accent-blue rounded-full" />
            <div className="h-1 w-4 bg-accent-blue/60 rounded-full" />
            <div className="h-1 w-2 bg-accent-blue/30 rounded-full" />
          </div>
          
          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex items-center justify-center gap-2 text-red-400"
            >
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </motion.div>
          )}
          
          {/* Photo Count */}
          <div className="mt-4 flex items-center justify-center gap-4">
            <span className={`text-sm ${
              photos.length >= 2 ? 'text-green-400' : 'text-orange-400'
            }`}>
              {photos.length}/6 photos uploaded
            </span>
            {photos.length < 2 && (
              <span className="text-xs text-white/40">
                (Need {2 - photos.length} more)
              </span>
            )}
          </div>
        </motion.div>

        {/* Upload Area */}
        <motion.div variants={fadeInUp} className="glass-card rounded-2xl p-8 mb-6">
          {/* Photo Grid - Circular Slots */}
          <div className="grid grid-cols-3 gap-6 mb-6 max-w-2xl mx-auto">
            <AnimatePresence>
              {photos.map((photo, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8, rotate: -180 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  whileHover={{ scale: 1.05 }}
                  className="relative w-[180px] h-[180px] mx-auto"
                >
                  <div 
                    className="w-full h-full rounded-full overflow-hidden border-2 border-accent-blue shadow-glow-blue group cursor-pointer"
                    onClick={() => handlePhotoEdit(index)}
                  >
                    <img
                      src={photo}
                      alt={`Portfolio ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Edit Overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                      <Edit2 className="w-8 h-8 text-white" />
                    </div>
                  </div>

                  {index === 0 && (
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-accent-blue to-accent-purple text-xs text-white font-bold shadow-glow-blue">
                      Main Photo
                    </div>
                  )}

                  <button
                    onClick={() => removePhoto(index)}
                    className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg transform hover:scale-110"
                  >
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Empty Slots */}
            {[...Array(Math.max(0, 6 - photos.length))].map((_, index) => (
              <motion.div
                key={`empty-${index}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 * index }}
                className="relative w-[180px] h-[180px] mx-auto"
              >
                <div className="w-full h-full rounded-full border-2 border-dashed border-white/20 hover:border-white/40 flex flex-col items-center justify-center transition-all cursor-pointer group">
                  <span className="text-white/30 group-hover:text-white/50 text-5xl mb-1">+</span>
                  <span className="text-white/20 text-xs">Slot {photos.length + index + 1}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Drag & Drop Zone */}
          {photos.length < 6 && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                dragOver
                  ? 'border-accent-blue bg-accent-blue/5'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={uploading}
              />

              <div className="pointer-events-none">
                <motion.div 
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-16 h-16 mx-auto mb-4 rounded-full glass-strong flex items-center justify-center"
                >
                  <svg
                    className="w-8 h-8 text-accent-blue"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </motion.div>

                <p className="text-white font-medium mb-1">
                  {uploading ? 'Mengupload...' : 'Drag foto portofoliomu di sini'}
                </p>
                <p className="text-xs text-white/40">
                  JPG, PNG max 1MB · {6 - photos.length} slot tersisa
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Navigation */}
        <motion.div variants={fadeInUp} className="flex gap-4">
          <GlassButton
            variant="secondary"
            onClick={() => navigate('/register/account')}
            fullWidth
          >
            Back
          </GlassButton>
          <GlassButton
            variant="primary"
            onClick={handleContinue}
            disabled={photos.length < 2}
            fullWidth
            className={photos.length < 2 ? 'opacity-50 cursor-not-allowed' : ''}
          >
            {photos.length < 2 ? `Need ${2 - photos.length} more photo${2 - photos.length > 1 ? 's' : ''}` : 'Continue'}
          </GlassButton>
        </motion.div>
      </motion.div>
      
      {/* Photo Editor Modal */}
      {editingPhoto && (
        <PhotoEditor
          imageUrl={editingPhoto}
          onSave={handlePhotoSave}
          onCancel={() => {
            setEditingPhoto(null);
            setEditingIndex(null);
          }}
        />
      )}
    </div>
  );
};
