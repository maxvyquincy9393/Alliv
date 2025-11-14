import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  autoComplete?: string;
  tone?: 'light' | 'dark';
}

export const PasswordInput = ({
  value,
  onChange,
  placeholder = '********',
  className = '',
  required = false,
  autoComplete = 'current-password',
  tone = 'dark',
}: PasswordInputProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const isLight = tone === 'light';
  const inputClasses =
    className ||
    (isLight
      ? 'w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 transition-colors'
      : 'w-full pl-4 pr-12 py-4 bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white focus:border-white/40 transition-all hover:border-white/30');
  const toggleClasses = isLight
    ? 'text-gray-400 hover:text-gray-900 focus:outline-none'
    : 'text-white/40 hover:text-white/70 focus:outline-none';

  return (
    <div className="relative">
      <input
        type={showPassword ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        className={inputClasses}
        placeholder={placeholder}
        required={required}
      />
      <button
        type='button'
        onClick={() => setShowPassword((prev) => !prev)}
        className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${toggleClasses}`}
        aria-label={showPassword ? 'Hide password' : 'Show password'}
      >
        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
      </button>
    </div>
  );
};
