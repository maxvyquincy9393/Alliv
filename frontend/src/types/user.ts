export interface User {
  id: string;
  name: string;
  age: number;
  bio?: string;
  avatar: string;
  skills: string[];
  badges?: string[];
  interests?: string[];
  location?: string | {
    lat: number;
    lon: number;
    city?: string;
  };
  githubUrl?: string;
  xHandle?: string;
  portfolio?: string; 
  // Social media - both formats for compatibility
  instagram?: string;
  telegram?: string;
  whatsapp?: string;
  socialLinks?: {
    instagram?: string;
    telegram?: string;
    whatsapp?: string;
  };
  isOnline?: boolean;
  distance?: number;
  compatibility?: number;
  matchScore?: number;
  email?: string;
  phone?: string;
}

export interface AuthUser extends User {
  email: string;
  token?: string;
  emailVerified?: boolean;
  profileComplete?: boolean;
}

export interface RegistrationData {
  name: string;
  email: string;
  password: string;
  age?: number;
  city?: string;
  photo?: string | null;
  photos?: string[];
  skills?: string[];
  interests?: string[];
  field?: string;
}
