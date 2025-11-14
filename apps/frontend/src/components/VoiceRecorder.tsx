import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Send, X, Pause, Play } from 'lucide-react';

interface VoiceRecorderProps {
  onSend: (audioBlob: Blob) => void;
  onCancel: () => void;
}

export const VoiceRecorder = ({ onSend, onCancel }: VoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording, isPaused]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioBlob(audioBlob);
        setAudioUrl(audioUrl);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Tidak bisa akses microphone. Pastikan browser punya permission.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
    }
  };

  const pauseResumeRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
      } else {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
      }
    }
  };

  const handleSend = () => {
    if (audioBlob) {
      onSend(audioBlob);
      cleanup();
    }
  };

  const handleCancel = () => {
    stopRecording();
    cleanup();
    onCancel();
  };

  const cleanup = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setAudioBlob(null);
    setRecordingTime(0);
    setIsRecording(false);
    setIsPaused(false);
  };

  const togglePlayback = () => {
    if (!audioUrl) return;
    
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence mode="wait">
      {!isRecording && !audioUrl ? (
        // Start Recording Button
        <motion.button
          key="start"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={startRecording}
          className="w-12 h-12 rounded-full bg-accent-blue hover:bg-accent-blue/80 flex items-center justify-center transition-colors shadow-glow-blue"
        >
          <Mic className="w-5 h-5 text-white" />
        </motion.button>
      ) : (
        // Recording/Preview UI
        <motion.div
          key="recording"
          initial={{ width: 48, opacity: 0 }}
          animate={{ width: 'auto', opacity: 1 }}
          exit={{ width: 48, opacity: 0 }}
          className="flex items-center gap-3 bg-dark-surface/80 backdrop-blur-sm rounded-full px-4 py-2 border border-white/10"
        >
          {/* Cancel Button */}
          <button
            onClick={handleCancel}
            className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white/60" />
          </button>

          {/* Waveform Visualization */}
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  height: isRecording && !isPaused ? [8, 20, 8] : audioUrl ? 12 : 8,
                }}
                transition={{
                  duration: 0.5,
                  repeat: isRecording && !isPaused ? Infinity : 0,
                  delay: i * 0.1,
                }}
                className="w-1 bg-accent-blue rounded-full"
                style={{ height: 8 }}
              />
            ))}
          </div>

          {/* Timer */}
          <span className="text-white/80 text-sm font-mono min-w-[48px]">
            {formatTime(recordingTime)}
          </span>

          {/* Max Duration Warning */}
          {recordingTime >= 25 && (
            <span className="text-orange-400 text-xs">Max 30s</span>
          )}

          {/* Controls */}
          {isRecording ? (
            <>
              {/* Pause/Resume */}
              <button
                onClick={pauseResumeRecording}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                {isPaused ? (
                  <Play className="w-4 h-4 text-white" />
                ) : (
                  <Pause className="w-4 h-4 text-white" />
                )}
              </button>
              
              {/* Stop */}
              <button
                onClick={stopRecording}
                className="w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors"
              >
                <Square className="w-4 h-4 text-white" />
              </button>
            </>
          ) : audioUrl ? (
            <>
              {/* Playback */}
              <button
                onClick={togglePlayback}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 text-white" />
                ) : (
                  <Play className="w-4 h-4 text-white" />
                )}
              </button>
              
              {/* Send */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSend}
                className="w-8 h-8 rounded-full bg-accent-blue hover:bg-accent-blue/80 flex items-center justify-center transition-colors shadow-glow-blue"
              >
                <Send className="w-4 h-4 text-white" />
              </motion.button>
            </>
          ) : null}

          {/* Hidden Audio Element */}
          {audioUrl && (
            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
