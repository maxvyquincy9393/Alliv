export interface UserLocation {
  city: string;
  country: string;
  lat: number;
  lon: number;
  hideExact: boolean;
}

export type ModePreference = 'online' | 'nearby';
export type AuthProvider = 'google' | 'github' | 'x' | 'email';
export type Gender = 'man' | 'woman' | 'other' | 'prefer-not-to-say';
export type VerificationMethod = 'email' | 'phone';

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  email: string;
  provider: AuthProvider;
  photos: string[];
  bio: string;
  goals: string;
  field: string;
  skills: string[];
  interests: string[];
  location: UserLocation;
  trustScore: number;
  modePreference: ModePreference;
  verified: boolean;
  gender: Gender;
  birthday: string; // DD/MM/YYYY
  portfolioLinks?: {
    github?: string;
    behance?: string;
    figma?: string;
    youtube?: string;
    website?: string;
  };
  createdAt: string;
  lastActive: string;
  availability: 'online' | 'offline';
  hideLocation: boolean;
}

// Extended from existing user.ts
export interface RegistrationData {
  // Rules step
  acceptedRules: boolean;
  
  // Auth step
  provider?: AuthProvider;
  verificationMethod?: VerificationMethod;
  verified: boolean;
  
  // Account step
  name: string;
  email: string;
  birthday: string;
  gender: Gender;
  city: string;
  bio: string;
  goals: string;
  
  // Photos step
  photos: string[];
  
  // Info step
  field: string;
  
  // Skills step
  skills: string[];
  
  // Interests step
  interests: string[];
  
  // Location step
  location?: UserLocation;
}

// Match compatibility score
export interface MatchScore {
  userId: string;
  totalScore: number;
  breakdown: {
    sharedSkills: number;
    sharedInterests: number;
    distance?: number;
    fieldCompatibility: number;
  };
}
