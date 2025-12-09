import { useState, useRef, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Check, FlipHorizontal, FlipVertical, Maximize2 } from 'lucide-react';

type AspectRatio = '1:1' | '4:5' | '16:9' | '9:16' | 'free';

interface ImageCropperProps {
    image: string;
    onCropComplete: (croppedImageBlob: Blob) => void;
    onCancel: () => void;
    defaultAspectRatio?: AspectRatio;
}

interface CropArea {
    x: number;
    y: number;
    width: number;
    height: number;
}

const ASPECT_RATIOS: { value: AspectRatio; label: string; ratio: number | null }[] = [
    { value: '1:1', label: 'Square', ratio: 1 },
    { value: '4:5', label: 'Portrait', ratio: 4 / 5 },
    { value: '16:9', label: 'Landscape', ratio: 16 / 9 },
    { value: '9:16', label: 'Story', ratio: 9 / 16 },
    { value: 'free', label: 'Free', ratio: null },
];

export const ImageCropper = ({
    image,
    onCropComplete,
    onCancel,
    defaultAspectRatio = '1:1'
}: ImageCropperProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [aspectRatio, setAspectRatio] = useState<AspectRatio>(defaultAspectRatio);
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [flipH, setFlipH] = useState(false);
    const [flipV, setFlipV] = useState(false);
    const [crop, setCrop] = useState<CropArea>({ x: 0, y: 0, width: 100, height: 100 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const handleCropStart = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - crop.x, y: e.clientY - crop.y });
    };

    const handleCropMove = useCallback((e: React.MouseEvent) => {
        if (!isDragging || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        let newX = e.clientX - dragStart.x;
        let newY = e.clientY - dragStart.y;

        // Constrain to container
        newX = Math.max(0, Math.min(newX, rect.width - crop.width));
        newY = Math.max(0, Math.min(newY, rect.height - crop.height));

        setCrop(prev => ({ ...prev, x: newX, y: newY }));
    }, [isDragging, dragStart, crop.width, crop.height]);

    const handleCropEnd = () => {
        setIsDragging(false);
    };

    const changeAspectRatio = (newRatio: AspectRatio) => {
        setAspectRatio(newRatio);

        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();

        const ratio = ASPECT_RATIOS.find(r => r.value === newRatio)?.ratio;

        if (ratio) {
            // Calculate new crop dimensions maintaining aspect ratio
            const maxWidth = rect.width * 0.8;
            const maxHeight = rect.height * 0.8;

            let newWidth = maxWidth;
            let newHeight = maxWidth / ratio;

            if (newHeight > maxHeight) {
                newHeight = maxHeight;
                newWidth = maxHeight * ratio;
            }

            setCrop({
                x: (rect.width - newWidth) / 2,
                y: (rect.height - newHeight) / 2,
                width: newWidth,
                height: newHeight
            });
        }
    };

    const handleZoom = (delta: number) => {
        setZoom(prev => Math.max(0.5, Math.min(3, prev + delta)));
    };

    const handleRotate = () => {
        setRotation(prev => (prev + 90) % 360);
    };

    const getCroppedImage = async (): Promise<Blob | null> => {
        const canvas = canvasRef.current;
        const img = imageRef.current;

        if (!canvas || !img) return null;

        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        // Set canvas size to crop area
        canvas.width = crop.width;
        canvas.height = crop.height;

        // Apply transformations
        ctx.save();
        ctx.translate(crop.width / 2, crop.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
        ctx.scale(zoom, zoom);
        ctx.translate(-crop.width / 2, -crop.height / 2);

        // Draw the cropped portion
        ctx.drawImage(
            img,
            crop.x, crop.y, crop.width, crop.height,
            0, 0, crop.width, crop.height
        );

        ctx.restore();

        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                resolve(blob);
            }, 'image/jpeg', 0.95);
        });
    };

    const handleSave = async () => {
        const blob = await getCroppedImage();
        if (blob) {
            onCropComplete(blob);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 bg-slate-900/50 backdrop-blur-sm border-b border-slate-700">
                <div>
                    <h2 className="text-xl font-bold text-white">Crop Image</h2>
                    <p className="text-sm text-slate-400">Adjust your image before uploading</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors flex items-center gap-2"
                    >
                        <X size={18} />
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors flex items-center gap-2"
                    >
                        <Check size={18} />
                        Apply
                    </button>
                </div>
            </div>

            {/* Main Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Image Preview */}
                <div className="flex-1 flex items-center justify-center p-8">
                    <div
                        ref={containerRef}
                        className="relative max-w-full max-h-full"
                        onMouseMove={handleCropMove}
                        onMouseUp={handleCropEnd}
                        onMouseLeave={handleCropEnd}
                    >
                        <img
                            ref={imageRef}
                            src={image}
                            alt="Crop preview"
                            className="max-w-full max-h-full object-contain"
                            style={{
                                transform: `scale(${zoom}) rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
                                transition: isDragging ? 'none' : 'transform 0.2s ease'
                            }}
                        />

                        {/* Crop Overlay */}
                        <div
                            className="absolute border-2 border-white shadow-lg cursor-move"
                            style={{
                                left: crop.x,
                                top: crop.y,
                                width: crop.width,
                                height: crop.height,
                                boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)'
                            }}
                            onMouseDown={handleCropStart}
                        >
                            {/* Grid */}
                            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                                {[...Array(9)].map((_, i) => (
                                    <div key={i} className="border border-white/30" />
                                ))}
                            </div>

                            {/* Corner Handles */}
                            {['tl', 'tr', 'bl', 'br'].map(corner => (
                                <div
                                    key={corner}
                                    className={`absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-full ${corner === 'tl' ? '-top-1.5 -left-1.5' :
                                            corner === 'tr' ? '-top-1.5 -right-1.5' :
                                                corner === 'bl' ? '-bottom-1.5 -left-1.5' :
                                                    '-bottom-1.5 -right-1.5'
                                        }`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Hidden canvas for cropping */}
                    <canvas ref={canvasRef} className="hidden" />
                </div>

                {/* Tools Panel */}
                <div className="w-80 bg-slate-900/50 backdrop-blur-sm border-l border-slate-700 p-6 space-y-6 overflow-y-auto">
                    {/* Aspect Ratio */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-3">
                            Aspect Ratio
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {ASPECT_RATIOS.map(({ value, label }) => (
                                <button
                                    key={value}
                                    onClick={() => changeAspectRatio(value)}
                                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${aspectRatio === value
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                        }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Zoom */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-3">
                            Zoom: {zoom.toFixed(1)}x
                        </label>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => handleZoom(-0.1)}
                                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors"
                            >
                                <ZoomOut size={18} />
                            </button>
                            <input
                                type="range"
                                min="0.5"
                                max="3"
                                step="0.1"
                                value={zoom}
                                onChange={(e) => setZoom(parseFloat(e.target.value))}
                                className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:cursor-pointer"
                            />
                            <button
                                onClick={() => handleZoom(0.1)}
                                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors"
                            >
                                <ZoomIn size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Transformations */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-3">
                            Transformations
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                onClick={handleRotate}
                                className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors flex flex-col items-center gap-2"
                                title="Rotate 90°"
                            >
                                <RotateCw size={18} />
                                <span className="text-xs">Rotate</span>
                            </button>
                            <button
                                onClick={() => setFlipH(!flipH)}
                                className={`p-3 rounded-xl transition-colors flex flex-col items-center gap-2 ${flipH ? 'bg-blue-600 text-white' : 'bg-slate-800 text-white hover:bg-slate-700'
                                    }`}
                                title="Flip Horizontal"
                            >
                                <FlipHorizontal size={18} />
                                <span className="text-xs">Flip H</span>
                            </button>
                            <button
                                onClick={() => setFlipV(!flipV)}
                                className={`p-3 rounded-xl transition-colors flex flex-col items-center gap-2 ${flipV ? 'bg-blue-600 text-white' : 'bg-slate-800 text-white hover:bg-slate-700'
                                    }`}
                                title="Flip Vertical"
                            >
                                <FlipVertical size={18} />
                                <span className="text-xs">Flip V</span>
                            </button>
                        </div>
                    </div>

                    {/* Reset */}
                    <button
                        onClick={() => {
                            setZoom(1);
                            setRotation(0);
                            setFlipH(false);
                            setFlipV(false);
                            changeAspectRatio(defaultAspectRatio);
                        }}
                        className="w-full px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors flex items-center justify-center gap-2"
                    >
                        <Maximize2 size={18} />
                        Reset All
                    </button>
                </div>
            </div>
        </div>
    );
};
