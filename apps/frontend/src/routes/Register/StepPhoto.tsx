import { motion } from 'framer-motion';
import { useRegistrationStore } from '../../store/registration';
import { PhotoUploader } from '../../components/PhotoUploader';
import { GlassButton } from '../../components/GlassButton';

export const StepPhoto = () => {
  const { data, setData, nextStep, prevStep } = useRegistrationStore();

  const handlePhotosChange = (photos: string[]) => {
    setData({ photos });
  };

  const handleContinue = () => {
    if (data.photos && data.photos.length > 0) {
      nextStep();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-3">Add Your Photos</h1>
        <p className="text-white/50">Show your authentic self (up to 6 photos)</p>
      </div>

      <div className="flex justify-center mb-12">
        <PhotoUploader 
          photos={data.photos || []}
          onPhotosChange={handlePhotosChange}
          maxPhotos={6}
        />
      </div>

      <div className="space-y-3">
        <GlassButton
          variant="primary"
          fullWidth
          onClick={handleContinue}
          disabled={!data.photos || data.photos.length === 0}
        >
          Continue
        </GlassButton>

        <GlassButton
          variant="ghost"
          fullWidth
          onClick={prevStep}
        >
          Back
        </GlassButton>
      </div>

      {/* Progress indicator */}
      <div className="mt-12 flex justify-center gap-2">
        {[0, 1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={`h-1 rounded-full transition-all ${
              step === 1 ? 'w-8 bg-accent-blue' : step < 1 ? 'w-1 bg-accent-blue/50' : 'w-1 bg-white/20'
            }`}
          />
        ))}
      </div>
    </motion.div>
  );
};
