import { User, AuthUser } from '../types/user';
import { Match } from '../types/match';
import { Message } from '../types/message';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const TOKEN_STORAGE_KEY = 'auth_token';
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_STORAGE_KEY = 'auth_user';

// Mock data for development
const mockUsers: User[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    age: 24,
    bio: 'UI/UX designer building the future of design systems. Coffee enthusiast.',
    avatar: 'https://i.pravatar.cc/400?img=1',
    photos: [
      'https://i.pravatar.cc/600?img=1',
      'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=900&q=80',
    ],
    skills: ['Figma', 'Adobe XD', 'Design Systems', 'Prototyping'],
    interests: ['Art', 'Tech', 'Coffee'],
    role: 'Lead Product Designer',
    company: 'ScaleLab',
    location: 'San Francisco, CA',
    distance: 2.8,
    matchScore: 86,
    responseRate: 'Responds within 45 min',
    availability: 'Available this week',
    projectsCompleted: 18,
    quickResponder: true,
    badges: ['Verified', 'Premium'],
  },
  {
    id: '2',
    name: 'Marcus Rodriguez',
    age: 28,
    bio: 'Full-stack developer and open source contributor who loves AI.',
    avatar: 'https://i.pravatar.cc/400?img=12',
    photos: [
      'https://i.pravatar.cc/600?img=12',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80',
    ],
    skills: ['React', 'Node.js', 'Python', 'Machine Learning'],
    interests: ['Coding', 'AI', 'Gaming'],
    role: 'Full-stack Engineer',
    company: 'NovaAI',
    location: 'Austin, TX',
    distance: 5.1,
    matchScore: 91,
    responseRate: 'Replies in under an hour',
    availability: 'Open for weekend sprints',
    projectsCompleted: 27,
    quickResponder: true,
    badges: ['Verified'],
  },
  {
    id: '3',
    name: 'Elena Volkov',
    age: 26,
    bio: 'Product manager, ex-Google, focused on shipping the next big thing.',
    avatar: 'https://i.pravatar.cc/400?img=5',
    photos: [
      'https://i.pravatar.cc/600?img=5',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=900&q=80',
    ],
    skills: ['Product Strategy', 'Agile', 'Data Analysis', 'Leadership'],
    interests: ['Startups', 'Innovation', 'Travel'],
    role: 'Product Manager',
    company: 'CollabNext',
    location: 'New York, NY',
    distance: 2.3,
    matchScore: 89,
    responseRate: 'Responds within 2 hours',
    availability: '🟢 Available now',
    projectsCompleted: 12,
    quickResponder: true,
    badges: ['Verified', 'Quick responder'],
  },
  {
    id: '4',
    name: 'James Anderson',
    age: 30,
    bio: 'DevOps engineer and cloud architect with an automation mindset.',
    avatar: 'https://i.pravatar.cc/400?img=13',
    photos: [
      'https://i.pravatar.cc/600?img=13',
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80',
    ],
    skills: ['AWS', 'Docker', 'Kubernetes', 'CI/CD'],
    interests: ['Tech', 'Music', 'Hiking'],
    role: 'DevOps Lead',
    company: 'CloudForge',
    location: 'Seattle, WA',
    distance: 7.6,
    matchScore: 77,
    responseRate: 'Usually replies in 3 hours',
    availability: 'Evenings & weekends',
    projectsCompleted: 34,
    quickResponder: false,
    badges: ['Premium'],
  },
  {
    id: '5',
    name: 'Priya Sharma',
    age: 25,
    bio: 'Data scientist and AI researcher making sense of big data.',
    avatar: 'https://i.pravatar.cc/400?img=9',
    photos: [
      'https://i.pravatar.cc/600?img=9',
      'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=900&q=80',
    ],
    skills: ['Python', 'TensorFlow', 'Statistics', 'Deep Learning'],
    interests: ['AI', 'Research', 'Books'],
    role: 'Data Scientist',
    company: 'Orbital Labs',
    location: 'Boston, MA',
    distance: 4.4,
    matchScore: 83,
    responseRate: 'Replies within 90 min',
    availability: 'Weekday mornings',
    projectsCompleted: 21,
    quickResponder: true,
    badges: ['Verified'],
  },
];

class API {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  }

  getToken() {
    if (!this.token) {
      // Check both auth_token (old) and access_token (new from email verification)
      this.token = localStorage.getItem(ACCESS_TOKEN_KEY) || localStorage.getItem(TOKEN_STORAGE_KEY);
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  }

  private storeUser(user: AuthUser) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  }

  getStoredUser(): AuthUser | null {
    try {
      const value = localStorage.getItem(USER_STORAGE_KEY);
      return value ? (JSON.parse(value) as AuthUser) : null;
    } catch (error) {
      console.warn('Failed to parse stored user', error);
      return null;
    }
  }

  private clearStoredUser() {
    localStorage.removeItem(USER_STORAGE_KEY);
  }

  clearSession() {
    this.clearToken();
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    this.clearStoredUser();
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        // Try to parse error details from backend
        let errorMessage = response.statusText;
        try {
          const errorData = await response.json();
          if (errorData.detail) {
            errorMessage = errorData.detail;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch {
          // If can't parse JSON, use statusText
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth endpoints
  async login(email: string, password: string): Promise<AuthUser & { profileComplete?: boolean }> {
    // REAL API CALL - Not mock!
    const response = await this.request<{
      accessToken: string;
      refreshToken: string;
      user: {
        id: string;
        email: string;
        name: string;
        emailVerified: boolean;
        profileComplete: boolean;
      };
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    // Store tokens
    this.setToken(response.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);

    // Return user with profileComplete flag
    const authUser: AuthUser & { profileComplete?: boolean } = {
      id: response.user.id,
      name: response.user.name,
      email: response.user.email,
      age: 0, // Will be filled from profile
      bio: '',
      avatar: '',
      skills: [],
      interests: [], // Add missing field
      token: response.accessToken,
      profileComplete: response.user.profileComplete, // IMPORTANT!
    };

    this.storeUser(authUser);
    return authUser;
  }

  async register(data: {
    name: string;
    email: string;
    password: string;
  }): Promise<any> {  // Changed to 'any' to handle both response types
    // REAL API CALL - Not mock!
    const response = await this.request<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        birthdate: '1990-01-01', // Default for now
      }),
    });

    // NEW: Check if email verification required
    if (response.requiresEmailVerification) {
      // Return verification data (no tokens yet)
      return {
        requiresEmailVerification: true,
        emailSent: response.emailSent,
        verificationToken: response.verificationToken,  // Dev only
        verificationLink: response.verificationLink,    // Dev only
        message: response.message,
      };
    }

    // OLD: If tokens provided (OAuth or no verification needed)
    if (response.accessToken) {
      this.setToken(response.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);

      // Return user with profileComplete flag
      const authUser: AuthUser & { profileComplete?: boolean } = {
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        age: 0,
        bio: '',
        avatar: '',
        skills: [],
        interests: [], // Add missing field
        token: response.accessToken,
        profileComplete: response.user.profileComplete,
      };

      this.storeUser(authUser);
      return authUser;
    }

    // Fallback
    return response;
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.warn('Logout request failed or skipped:', error);
    } finally {
      this.clearSession();
    }
  }

  async fetchCurrentUser(): Promise<AuthUser | null> {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    const profile = await this.request<any>('/me');

    if (!profile || !profile.userId) {
      return null;
    }

    const authUser: AuthUser = {
      id: profile.userId,
      name: profile.name || '',
      email: profile.email || '',
      age: profile.age || 0,
      bio: profile.bio || '',
      avatar: Array.isArray(profile.photos) && profile.photos.length > 0 ? profile.photos[0] : '',
      skills: profile.skills || [],
      interests: profile.interests || [],
      token,
      emailVerified: Boolean(profile.verified),
      profileComplete: profile.profileComplete ?? true,
    };

    this.storeUser(authUser);
    return authUser;
  }

  // Discover endpoints
  async getDiscoverUsers(): Promise<User[]> {
    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([...mockUsers]);
      }, 300);
    });
  }

  async swipeUser(userId: string, direction: 'left' | 'right' | 'up'): Promise<{
    match: boolean;
    user?: User;
  }> {
    // Mock implementation - 30% chance of match on right swipe
    return new Promise((resolve) => {
      setTimeout(() => {
        if (direction === 'right' && Math.random() > 0.7) {
          const user = mockUsers.find((u) => u.id === userId);
          resolve({ match: true, user });
        } else {
          resolve({ match: false });
        }
      }, 300);
    });
  }

  // Match endpoints
  async getMatches(): Promise<Match[]> {
    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        const matches: Match[] = mockUsers.slice(0, 3).map((user, index) => ({
          id: `match-${user.id}`,
          user,
          matchedAt: new Date(Date.now() - index * 86400000),
          lastMessage: index === 0 ? 'Hey! How are you?' : undefined,
          unreadCount: index === 0 ? 2 : 0,
        }));
        resolve(matches);
      }, 300);
    });
  }

  // Chat endpoints
  async getMessages(_matchId: string): Promise<Message[]> {
    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        const messages: Message[] = [
          {
            id: '1',
            senderId: '1',
            receiverId: 'current-user',
            content: "Hey! I saw you're working on AI projects. That's awesome!",
            timestamp: new Date(Date.now() - 3600000),
            read: true,
          },
          {
            id: '2',
            senderId: 'current-user',
            receiverId: '1',
            content: 'Thanks! Yeah, I love working with machine learning.',
            timestamp: new Date(Date.now() - 3000000),
            read: true,
          },
          {
            id: '3',
            senderId: '1',
            receiverId: 'current-user',
            content: 'Would love to collaborate on something!',
            timestamp: new Date(Date.now() - 1800000),
            read: false,
          },
        ];
        resolve(messages);
      }, 300);
    });
  }

  async sendMessage(
    matchId: string,
    content: string
  ): Promise<Message> {
    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        const message: Message = {
          id: `msg-${Date.now()}`,
          senderId: 'current-user',
          receiverId: matchId,
          content,
          timestamp: new Date(),
          read: false,
        };
        resolve(message);
      }, 200);
    });
  }
}

export const api = new API();

