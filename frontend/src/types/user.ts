import type { UserLocation } from './profile';

export interface User {
  id: string;
  name: string;
  age: number;
  bio?: string;
  avatar: string;
  skills: string[];
  badges?: string[];
  interests: string[];
  location?: string;
  githubUrl?: string;
  xHandle?: string;
  portfolio?: string; 
  socialLinks?: {
    instagram?: string;
    telegram?: string;
    whatsapp?: string;
  }
}

export interface AuthUser extends User {
  email: string;
  token?: string;
}

export interface RegistrationData {
  name: string;
  age: number;
  city: string;
  photo: string | null;
  skills: string[];
  interests: string[];
}
