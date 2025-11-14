export interface Project {
  id: string;
  title: string;
  description: string;
  ownerId: string;
  ownerName: string;
  ownerAvatar: string;
  owner?: {
    id: string;
    name: string;
    avatar: string;
  };
  tags: string[];
  field: string;
  location?: {
    city: string;
    country: string;
    lat?: number;
    lon?: number;
  };
  lookingFor: string[]; // Skills needed
  status: 'open' | 'in-progress' | 'completed' | 'closed';
  members: string[]; // User IDs
  applicants: string[]; // User IDs
  thumbnail?: string;
  createdAt: string;
  updatedAt?: string;
  deadline?: string;
}

export interface ProjectApplication {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  message: string;
  skills: string[];
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}
