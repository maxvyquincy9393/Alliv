import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Check } from 'lucide-react';
import { useTranslation } from '../lib/i18n';

export const LanguageSwitcher = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { language, setLanguage, languages, t } = useTranslation();
  
  const currentLang = languages.find(lang => lang.code === language);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 glass rounded-lg hover:bg-white/10 transition-colors"
      >
        <Globe className="w-4 h-4 text-white/60" />
        <span className="text-sm text-white/80">{currentLang?.flag}</span>
        <span className="text-sm text-white/60 hidden sm:inline">{currentLang?.name}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute right-0 mt-2 w-64 glass-strong rounded-xl shadow-2xl overflow-hidden z-50"
            >
              <div className="p-2 max-h-96 overflow-y-auto">
                <p className="text-xs text-white/40 px-3 py-2 uppercase tracking-wide">
                  {t('common.selectLanguage')}
                </p>
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      language === lang.code
                        ? 'bg-accent-blue/20 text-white'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span className="text-xl">{lang.flag}</span>
                    <span className="flex-1 text-left text-sm font-medium">
                      {lang.name}
                    </span>
                    {language === lang.code && (
                      <Check className="w-4 h-4 text-accent-blue" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
