import { motion } from 'framer-motion';

interface RadiusSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export const RadiusSlider = ({ 
  value, 
  onChange, 
  min = 1, 
  max = 50 
}: RadiusSliderProps) => {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-white/60">Search Radius</span>
        <span className="text-sm font-medium text-accent-blue">{value} km</span>
      </div>
      
      <div className="relative h-2">
        {/* Track background */}
        <div className="absolute inset-0 glass rounded-full" />
        
        {/* Active track */}
        <motion.div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-accent-blue/50 to-accent-blue rounded-full"
          style={{ width: `${percentage}%` }}
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        
        {/* Slider input */}
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
        />
        
        {/* Thumb */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-glow-blue border-2 border-accent-blue pointer-events-none"
          style={{ left: `calc(${percentage}% - 10px)` }}
          whileHover={{ scale: 1.2 }}
        />
      </div>
      
      <div className="flex justify-between text-xs text-white/40">
        <span>{min} km</span>
        <span>{max} km</span>
      </div>
    </div>
  );
};
