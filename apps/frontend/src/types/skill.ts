export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  icon?: string; // URL to skill icon/image
}

export type SkillCategory = 
  | 'programming'
  | 'design'
  | 'music'
  | 'art'
  | 'business'
  | 'health'
  | 'sports'
  | 'languages'
  | 'other';

export interface Interest {
  id: string;
  name: string;
  category: InterestCategory;
  thumbnail?: string; // URL to interest thumbnail
}

export type InterestCategory =
  | 'music'
  | 'health'
  | 'sports'
  | 'film'
  | 'coding'
  | 'business'
  | 'art'
  | 'travel'
  | 'food'
  | 'gaming'
  | 'reading'
  | 'photography';

export const SKILL_CATEGORIES: Record<SkillCategory, string> = {
  programming: 'Programming',
  design: 'Design',
  music: 'Music',
  art: 'Art',
  business: 'Business',
  health: 'Health',
  sports: 'Sports',
  languages: 'Languages',
  other: 'Other',
};

export const INTEREST_CATEGORIES: Record<InterestCategory, string> = {
  music: 'Music',
  health: 'Health',
  sports: 'Sports',
  film: 'Film & TV',
  coding: 'Coding',
  business: 'Business',
  art: 'Art',
  travel: 'Travel',
  food: 'Food & Dining',
  gaming: 'Gaming',
  reading: 'Reading',
  photography: 'Photography',
};

// Mock skill data
export const MOCK_SKILLS: Skill[] = [
  { id: 'python', name: 'Python', category: 'programming', icon: '/assets/skills/python.webp' },
  { id: 'javascript', name: 'JavaScript', category: 'programming', icon: '/assets/skills/javascript.webp' },
  { id: 'react', name: 'React', category: 'programming', icon: '/assets/skills/react.webp' },
  { id: 'figma', name: 'Figma', category: 'design', icon: '/assets/skills/figma.webp' },
  { id: 'photoshop', name: 'Photoshop', category: 'design', icon: '/assets/skills/photoshop.webp' },
  { id: 'illustrator', name: 'Illustrator', category: 'design', icon: '/assets/skills/illustrator.webp' },
  { id: 'piano', name: 'Piano', category: 'music', icon: '/assets/skills/piano.webp' },
  { id: 'guitar', name: 'Guitar', category: 'music', icon: '/assets/skills/guitar.webp' },
  { id: 'photography', name: 'Photography', category: 'art', icon: '/assets/skills/photography.webp' },
  { id: 'nursing', name: 'Nursing', category: 'health', icon: '/assets/skills/nursing.webp' },
  { id: 'yoga', name: 'Yoga', category: 'health', icon: '/assets/skills/yoga.webp' },
  { id: 'marketing', name: 'Marketing', category: 'business', icon: '/assets/skills/marketing.webp' },
];

// Mock interest data
export const MOCK_INTERESTS: Interest[] = [
  { id: 'rock', name: 'Rock Music', category: 'music', thumbnail: '/assets/interests/rock.webp' },
  { id: 'jazz', name: 'Jazz', category: 'music', thumbnail: '/assets/interests/jazz.webp' },
  { id: 'fitness', name: 'Fitness', category: 'health', thumbnail: '/assets/interests/fitness.webp' },
  { id: 'meditation', name: 'Meditation', category: 'health', thumbnail: '/assets/interests/meditation.webp' },
  { id: 'basketball', name: 'Basketball', category: 'sports', thumbnail: '/assets/interests/basketball.webp' },
  { id: 'soccer', name: 'Soccer', category: 'sports', thumbnail: '/assets/interests/soccer.webp' },
  { id: 'scifi', name: 'Sci-Fi', category: 'film', thumbnail: '/assets/interests/scifi.webp' },
  { id: 'documentary', name: 'Documentary', category: 'film', thumbnail: '/assets/interests/documentary.webp' },
  { id: 'ai', name: 'AI & ML', category: 'coding', thumbnail: '/assets/interests/ai.webp' },
  { id: 'webdev', name: 'Web Development', category: 'coding', thumbnail: '/assets/interests/webdev.webp' },
  { id: 'startup', name: 'Startups', category: 'business', thumbnail: '/assets/interests/startup.webp' },
  { id: 'investing', name: 'Investing', category: 'business', thumbnail: '/assets/interests/investing.webp' },
];