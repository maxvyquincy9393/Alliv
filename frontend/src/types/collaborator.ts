// Enhanced cross-industry collaborator types
export interface CollaboratorProfile {
  id: string;
  basicInfo: {
    name: string;
    avatar: string;
    headline: string;
    location: string;
    timezone: string;
    languages: string[];
  };
  
  // Industry-specific roles
  roles: CollaboratorRole[];
  
  // Comprehensive skills
  skills: {
    primary: Skill[];
    secondary: Skill[];
    tools: Tool[];
    certifications: Certification[];
  };
  
  // Multimedia portfolio
  portfolio: {
    featured: PortfolioItem[];
    categories: {
      [industry: string]: PortfolioItem[];
    };
    achievements: Achievement[];
  };
  
  // Reputation system
  reputation: {
    overall: number;
    badges: Badge[];
    reviews: Review[];
    completedProjects: number;
    successRate: number;
    responseTime: string;
  };
  
  // Availability management
  availability: {
    status: 'available' | 'busy' | 'on-project' | 'vacation';
    calendar: AvailabilitySlot[];
    preferredHours: string;
    maxProjects: number;
    currentProjects: number;
    nextAvailable: Date;
  };
  
  // Networking
  connections: {
    total: number;
    mutual: string[];
    followers: number;
    following: number;
  };
  
  // Preferences
  preferences: {
    industries: Industry[];
    projectTypes: ProjectType[];
    teamSize: 'solo' | 'small' | 'medium' | 'large';
    remoteWork: boolean;
    travelWilling: boolean;
    rates: RateStructure;
  };
}

export interface CollaboratorRole {
  industry: Industry;
  title: string;
  level: 'junior' | 'mid' | 'senior' | 'expert';
  yearsExperience: number;
  verified: boolean;
}

export interface Skill {
  name: string;
  level: 1 | 2 | 3 | 4 | 5;
  endorsed: number;
  verified: boolean;
  projects: string[];
}

export interface Tool {
  name: string;
  category: string;
  proficiency: 'basic' | 'intermediate' | 'advanced' | 'expert';
  lastUsed: Date;
}

export interface Certification {
  name: string;
  issuer: string;
  date: Date;
  expiry?: Date;
  verificationUrl?: string;
  badge?: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'link' | '3d-model' | 'code';
  url: string;
  thumbnail: string;
  industry: Industry;
  role: string;
  collaborators: string[];
  metrics: {
    views?: number;
    likes?: number;
    shares?: number;
    revenue?: number;
    impact?: string;
  };
  tags: string[];
  date: Date;
  featured: boolean;
}

export interface Achievement {
  title: string;
  description: string;
  icon: string;
  date: Date;
  category: 'award' | 'milestone' | 'certification' | 'recognition';
  verificationUrl?: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: 'skill' | 'achievement' | 'community' | 'verification';
  earnedDate: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface Review {
  id: string;
  projectId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar: string;
  rating: number;
  comment: string;
  skills: string[];
  date: Date;
  verified: boolean;
}

export interface AvailabilitySlot {
  date: Date;
  startTime: string;
  endTime: string;
  available: boolean;
  projectId?: string;
  note?: string;
}

export interface RateStructure {
  currency: string;
  hourly?: number;
  daily?: number;
  project?: number;
  negotiable: boolean;
  equity?: boolean;
  volunteer?: boolean;
}

export enum Industry {
  FILM = 'film',
  MUSIC = 'music',
  STARTUP = 'startup',
  SOCIAL = 'social',
  GAMING = 'gaming',
  FASHION = 'fashion',
  ART = 'art',
  TECH = 'tech',
  EDUCATION = 'education',
  HEALTHCARE = 'healthcare',
  FINANCE = 'finance',
  MEDIA = 'media',
  NONPROFIT = 'nonprofit',
  RESEARCH = 'research',
  EVENT = 'event'
}

export enum ProjectType {
  SHORT_TERM = 'short-term',
  LONG_TERM = 'long-term',
  FREELANCE = 'freelance',
  FULL_TIME = 'full-time',
  PART_TIME = 'part-time',
  CONTRACT = 'contract',
  VOLUNTEER = 'volunteer',
  INTERNSHIP = 'internship',
  COLLABORATION = 'collaboration'
}

// Connection types
export interface Connection {
  id: string;
  profile: CollaboratorProfile;
  connectionDate: Date;
  relationship: 'colleague' | 'client' | 'mentor' | 'mentee' | 'friend';
  endorsements: string[];
  sharedProjects: string[];
  interaction: {
    lastContact: Date;
    frequency: 'daily' | 'weekly' | 'monthly' | 'occasional';
    quality: number; // 1-5
  };
}




