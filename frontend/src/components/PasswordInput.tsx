import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  autoComplete?: string;
}

export const PasswordInput = ({ 
  value, 
  onChange, 
  placeholder = "••••••••",
  className = "",
  required = false,
  autoComplete = "current-password"
}: PasswordInputProps) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <input
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        className={`w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-300 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all ${className}`}
        placeholder={placeholder}
        required={required}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors focus:outline-none"
        aria-label={showPassword ? "Hide password" : "Show password"}
      >
        {showPassword ? (
          <EyeOff className="w-5 h-5" />
        ) : (
          <Eye className="w-5 h-5" />
        )}
      </button>
    </div>
  );
};
