import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Play,
    Pause,
    Volume2,
    VolumeX,
    Maximize,
    Minimize,
    SkipBack,
    SkipForward
} from 'lucide-react';

interface VideoPlayerProps {
    src: string;
    poster?: string;
    autoPlay?: boolean;
    className?: string;
    onEnded?: () => void;
}

export const VideoPlayer = ({
    src,
    poster,
    autoPlay = false,
    className = '',
    onEnded
}: VideoPlayerProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [isPlaying, setIsPlaying] = useState(autoPlay);
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(1);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [buffered, setBuffered] = useState(0);

    const hideControlsTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleLoadedMetadata = () => {
            setDuration(video.duration);
        };

        const handleTimeUpdate = () => {
            setCurrentTime(video.currentTime);

            // Update buffered
            if (video.buffered.length > 0) {
                const bufferedEnd = video.buffered.end(video.buffered.length - 1);
                setBuffered((bufferedEnd / video.duration) * 100);
            }
        };

        const handleEnded = () => {
            setIsPlaying(false);
            onEnded?.();
        };

        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('ended', handleEnded);
        document.addEventListener('fullscreenchange', handleFullscreenChange);

        return () => {
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('ended', handleEnded);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, [onEnded]);

    const togglePlay = () => {
        const video = videoRef.current;
        if (!video) return;

        if (isPlaying) {
            video.pause();
        } else {
            video.play();
        }
        setIsPlaying(!isPlaying);
    };

    const toggleMute = () => {
        const video = videoRef.current;
        if (!video) return;

        video.muted = !isMuted;
        setIsMuted(!isMuted);
    };

    const handleVolumeChange = (newVolume: number) => {
        const video = videoRef.current;
        if (!video) return;

        video.volume = newVolume;
        setVolume(newVolume);
        setIsMuted(newVolume === 0);
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const video = videoRef.current;
        if (!video) return;

        const newTime = parseFloat(e.target.value);
        video.currentTime = newTime;
        setCurrentTime(newTime);
    };

    const skip = (seconds: number) => {
        const video = videoRef.current;
        if (!video) return;

        video.currentTime = Math.max(0, Math.min(duration, currentTime + seconds));
    };

    const toggleFullscreen = async () => {
        const container = containerRef.current;
        if (!container) return;

        try {
            if (!isFullscreen) {
                await container.requestFullscreen();
            } else {
                await document.exitFullscreen();
            }
        } catch (err) {
            console.error('Fullscreen error:', err);
        }
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleMouseMove = () => {
        setShowControls(true);

        if (hideControlsTimeout.current) {
            clearTimeout(hideControlsTimeout.current);
        }

        hideControlsTimeout.current = setTimeout(() => {
            if (isPlaying) {
                setShowControls(false);
            }
        }, 3000);
    };

    return (
        <div
            ref={containerRef}
            className={`relative bg-black rounded-xl overflow-hidden group ${className}`}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => {
                if (isPlaying) {
                    setShowControls(false);
                }
            }}
        >
            {/* Video Element */}
            <video
                ref={videoRef}
                src={src}
                poster={poster}
                className="w-full h-full object-contain"
                playsInline
                onClick={togglePlay}
            />

            {/* Play/Pause Overlay */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: !isPlaying && showControls ? 1 : 0 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={togglePlay}
                    className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-colors pointer-events-auto"
                >
                    {isPlaying ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
                </motion.button>
            </motion.div>

            {/* Controls */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: showControls ? 1 : 0, y: showControls ? 0 : 20 }}
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-4 space-y-3"
            >
                {/* Progress Bar */}
                <div className="relative">
                    {/* Buffered Progress */}
                    <div className="absolute h-1 bg-white/20 rounded-full" style={{ width: `${buffered}%` }} />

                    {/* Seek Bar */}
                    <input
                        type="range"
                        min="0"
                        max={duration || 0}
                        value={currentTime}
                        onChange={handleSeek}
                        className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer hover:[&::-webkit-slider-thumb]:scale-110 transition-all"
                        style={{
                            background: `linear-gradient(to right, rgb(59 130 246) 0%, rgb(59 130 246) ${(currentTime / duration) * 100}%, rgba(255,255,255,0.1) ${(currentTime / duration) * 100}%, rgba(255,255,255,0.1) 100%)`
                        }}
                    />
                </div>

                {/* Controls Row */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {/* Play/Pause */}
                        <button
                            onClick={togglePlay}
                            className="p-2 rounded-lg hover:bg-white/10 text-white transition-colors"
                        >
                            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                        </button>

                        {/* Skip Controls */}
                        <button
                            onClick={() => skip(-10)}
                            className="p-2 rounded-lg hover:bg-white/10 text-white transition-colors"
                            title="Skip back 10s"
                        >
                            <SkipBack size={18} />
                        </button>
                        <button
                            onClick={() => skip(10)}
                            className="p-2 rounded-lg hover:bg-white/10 text-white transition-colors"
                            title="Skip forward 10s"
                        >
                            <SkipForward size={18} />
                        </button>

                        {/* Volume */}
                        <div className="flex items-center gap-2 group/volume">
                            <button
                                onClick={toggleMute}
                                className="p-2 rounded-lg hover:bg-white/10 text-white transition-colors"
                            >
                                {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                            </button>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={isMuted ? 0 : volume}
                                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                                className="w-0 group-hover/volume:w-20 opacity-0 group-hover/volume:opacity-100 h-1 bg-white/10 rounded-full appearance-none cursor-pointer transition-all duration-200 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer"
                            />
                        </div>

                        {/* Time */}
                        <span className="text-xs text-white/80 font-mono">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                    </div>

                    {/* Fullscreen */}
                    <button
                        onClick={toggleFullscreen}
                        className="p-2 rounded-lg hover:bg-white/10 text-white transition-colors"
                    >
                        {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
