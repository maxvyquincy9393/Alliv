import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCw, Crop, X, FlipHorizontal, FlipVertical } from 'lucide-react';
import { GlassButton } from './GlassButton';

interface PhotoEditorProps {
  imageUrl: string;
  onSave: (editedImageUrl: string) => void;
  onCancel: () => void;
}

interface CropAspectRatio {
  label: string;
  value: number;
}

const aspectRatios: CropAspectRatio[] = [
  { label: '1:1', value: 1 },
  { label: '4:5', value: 0.8 },
  { label: '16:9', value: 16 / 9 },
  { label: 'Free', value: 0 }
];

export const PhotoEditor = ({ imageUrl, onSave, onCancel }: PhotoEditorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<number>(1);
  const [cropMode, setCropMode] = useState(false);
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 100, height: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [quality, setQuality] = useState(0.8);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadImage();
  }, [imageUrl]);

  useEffect(() => {
    if (imageRef.current) {
      applyTransformations();
    }
  }, [rotation, flipH, flipV, cropArea]);

  const loadImage = () => {
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      if (canvasRef.current) {
        canvasRef.current.width = img.width;
        canvasRef.current.height = img.height;
        applyTransformations();
      }
    };
    img.src = imageUrl;
  };

  const applyTransformations = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Save context
    ctx.save();

    // Move to center
    ctx.translate(canvas.width / 2, canvas.height / 2);

    // Apply rotation
    ctx.rotate((rotation * Math.PI) / 180);

    // Apply flip
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

    // Draw image
    ctx.drawImage(
      img,
      -img.width / 2,
      -img.height / 2,
      img.width,
      img.height
    );

    // Restore context
    ctx.restore();

    // Apply crop overlay if in crop mode
    if (cropMode) {
      drawCropOverlay(ctx);
    }
  };

  const drawCropOverlay = (ctx: CanvasRenderingContext2D) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Darken non-crop area
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Clear crop area
    ctx.clearRect(
      (cropArea.x * canvas.width) / 100,
      (cropArea.y * canvas.height) / 100,
      (cropArea.width * canvas.width) / 100,
      (cropArea.height * canvas.height) / 100
    );

    // Draw crop border
    ctx.strokeStyle = '#6E9EFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(
      (cropArea.x * canvas.width) / 100,
      (cropArea.y * canvas.height) / 100,
      (cropArea.width * canvas.width) / 100,
      (cropArea.height * canvas.height) / 100
    );
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleFlipHorizontal = () => {
    setFlipH(!flipH);
  };

  const handleFlipVertical = () => {
    setFlipV(!flipV);
  };

  const handleCropStart = (e: React.MouseEvent) => {
    if (!cropMode) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleCropMove = (e: React.MouseEvent) => {
    if (!isDragging || !cropMode) return;
    
    const deltaX = ((e.clientX - dragStart.x) / canvasRef.current!.width) * 100;
    const deltaY = ((e.clientY - dragStart.y) / canvasRef.current!.height) * 100;
    
    setCropArea(prev => ({
      ...prev,
      x: Math.max(0, Math.min(100 - prev.width, prev.x + deltaX)),
      y: Math.max(0, Math.min(100 - prev.height, prev.y + deltaY))
    }));
    
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleCropEnd = () => {
    setIsDragging(false);
  };

  const handleSave = async () => {
    setLoading(true);
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    try {
      // Create a new canvas for the final image
      const finalCanvas = document.createElement('canvas');
      const finalCtx = finalCanvas.getContext('2d');
      if (!finalCtx) return;

      let finalWidth, finalHeight, sourceX, sourceY, sourceWidth, sourceHeight;

      if (cropMode) {
        // Apply crop
        finalWidth = (cropArea.width * img.width) / 100;
        finalHeight = (cropArea.height * img.height) / 100;
        sourceX = (cropArea.x * img.width) / 100;
        sourceY = (cropArea.y * img.height) / 100;
        sourceWidth = finalWidth;
        sourceHeight = finalHeight;
      } else {
        finalWidth = img.width;
        finalHeight = img.height;
        sourceX = 0;
        sourceY = 0;
        sourceWidth = img.width;
        sourceHeight = img.height;
      }

      // Set maximum dimensions (1200px)
      const maxDimension = 1200;
      let scale = 1;
      if (finalWidth > maxDimension || finalHeight > maxDimension) {
        scale = Math.min(maxDimension / finalWidth, maxDimension / finalHeight);
        finalWidth *= scale;
        finalHeight *= scale;
      }

      finalCanvas.width = finalWidth;
      finalCanvas.height = finalHeight;

      // Apply transformations to final canvas
      finalCtx.save();
      finalCtx.translate(finalWidth / 2, finalHeight / 2);
      finalCtx.rotate((rotation * Math.PI) / 180);
      finalCtx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      
      // Draw the cropped/transformed image
      finalCtx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        -finalWidth / 2,
        -finalHeight / 2,
        finalWidth,
        finalHeight
      );
      
      finalCtx.restore();

      // Convert to WebP
      finalCanvas.toBlob(
        (blob) => {
          if (blob) {
            const reader = new FileReader();
            reader.onloadend = () => {
              onSave(reader.result as string);
              setLoading(false);
            };
            reader.readAsDataURL(blob);
          }
        },
        'image/webp',
        quality
      );
    } catch (error) {
      console.error('Failed to save image:', error);
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col"
      >
        {/* Header */}
        <div className="glass-strong border-b border-white/10 px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Edit Photo</h2>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex">
          {/* Sidebar */}
          <div className="w-80 glass p-6 border-r border-white/10 space-y-6 overflow-y-auto">
            {/* Transform Tools */}
            <div>
              <h3 className="text-sm font-medium text-white/60 mb-4">Transform</h3>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={handleRotate}
                  className="p-3 glass rounded-lg hover:bg-white/10 transition-colors flex flex-col items-center gap-1"
                >
                  <RotateCw className="w-5 h-5 text-white/80" />
                  <span className="text-xs text-white/60">Rotate</span>
                </button>
                <button
                  onClick={handleFlipHorizontal}
                  className={`p-3 glass rounded-lg hover:bg-white/10 transition-colors flex flex-col items-center gap-1 ${
                    flipH ? 'bg-accent-blue/20' : ''
                  }`}
                >
                  <FlipHorizontal className="w-5 h-5 text-white/80" />
                  <span className="text-xs text-white/60">Flip H</span>
                </button>
                <button
                  onClick={handleFlipVertical}
                  className={`p-3 glass rounded-lg hover:bg-white/10 transition-colors flex flex-col items-center gap-1 ${
                    flipV ? 'bg-accent-blue/20' : ''
                  }`}
                >
                  <FlipVertical className="w-5 h-5 text-white/80" />
                  <span className="text-xs text-white/60">Flip V</span>
                </button>
              </div>
            </div>

            {/* Crop */}
            <div>
              <h3 className="text-sm font-medium text-white/60 mb-4">Crop</h3>
              <button
                onClick={() => setCropMode(!cropMode)}
                className={`w-full p-3 glass rounded-lg hover:bg-white/10 transition-colors flex items-center justify-center gap-2 ${
                  cropMode ? 'bg-accent-blue/20' : ''
                }`}
              >
                <Crop className="w-5 h-5 text-white/80" />
                <span className="text-white/80">
                  {cropMode ? 'Exit Crop Mode' : 'Enter Crop Mode'}
                </span>
              </button>
              {cropMode && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-white/40">Aspect Ratio</p>
                  <div className="grid grid-cols-2 gap-2">
                    {aspectRatios.map((ratio) => (
                      <button
                        key={ratio.label}
                        onClick={() => {
                          setAspectRatio(ratio.value);
                          if (ratio.value > 0) {
                            const newHeight = cropArea.width / ratio.value;
                            setCropArea(prev => ({ ...prev, height: newHeight }));
                          }
                        }}
                        className={`px-3 py-2 glass rounded-lg text-sm transition-colors ${
                          aspectRatio === ratio.value
                            ? 'bg-accent-blue/20 text-white'
                            : 'text-white/60 hover:text-white'
                        }`}
                      >
                        {ratio.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quality */}
            <div>
              <h3 className="text-sm font-medium text-white/60 mb-4">
                Quality: {Math.round(quality * 100)}%
              </h3>
              <input
                type="range"
                min="0.5"
                max="1"
                step="0.1"
                value={quality}
                onChange={(e) => setQuality(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-6 border-t border-white/10">
              <GlassButton
                variant="primary"
                fullWidth
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Save Changes'}
              </GlassButton>
              <GlassButton
                variant="secondary"
                fullWidth
                onClick={onCancel}
              >
                Cancel
              </GlassButton>
            </div>
          </div>

          {/* Canvas Area */}
          <div 
            className="flex-1 flex items-center justify-center p-8 overflow-hidden"
            onMouseDown={handleCropStart}
            onMouseMove={handleCropMove}
            onMouseUp={handleCropEnd}
            onMouseLeave={handleCropEnd}
          >
            <div className="relative max-w-full max-h-full">
              <canvas
                ref={canvasRef}
                className="max-w-full max-h-[80vh] rounded-lg shadow-2xl cursor-move"
                style={{ objectFit: 'contain' }}
              />
              {cropMode && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-2 left-2 bg-black/80 px-2 py-1 rounded text-xs text-white">
                    Drag to move crop area
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
