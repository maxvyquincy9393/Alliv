import { User, AuthUser } from '../types/user';
import { Match } from '../types/match';
import { Message } from '../types/message';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Mock data for development
const mockUsers: User[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    age: 24,
    bio: 'UI/UX Designer • Building the future of design systems • Coffee enthusiast ☕',
    avatar: 'https://i.pravatar.cc/400?img=1',
    skills: ['Figma', 'Adobe XD', 'Design Systems', 'Prototyping'],
    interests: ['Art', 'Tech', 'Coffee'],
    location: 'San Francisco, CA',
  },
  {
    id: '2',
    name: 'Marcus Rodriguez',
    age: 28,
    bio: 'Full-stack Developer • Open source contributor • AI enthusiast 🤖',
    avatar: 'https://i.pravatar.cc/400?img=12',
    skills: ['React', 'Node.js', 'Python', 'Machine Learning'],
    interests: ['Coding', 'AI', 'Gaming'],
    location: 'Austin, TX',
  },
  {
    id: '3',
    name: 'Elena Volkov',
    age: 26,
    bio: 'Product Manager • Ex-Google • Building the next big thing 🚀',
    avatar: 'https://i.pravatar.cc/400?img=5',
    skills: ['Product Strategy', 'Agile', 'Data Analysis', 'Leadership'],
    interests: ['Startups', 'Innovation', 'Travel'],
    location: 'New York, NY',
  },
  {
    id: '4',
    name: 'James Anderson',
    age: 30,
    bio: 'DevOps Engineer • Cloud architect • Automation lover ⚡',
    avatar: 'https://i.pravatar.cc/400?img=13',
    skills: ['AWS', 'Docker', 'Kubernetes', 'CI/CD'],
    interests: ['Tech', 'Music', 'Hiking'],
    location: 'Seattle, WA',
  },
  {
    id: '5',
    name: 'Priya Sharma',
    age: 25,
    bio: 'Data Scientist • AI researcher • Making sense of big data 📊',
    avatar: 'https://i.pravatar.cc/400?img=9',
    skills: ['Python', 'TensorFlow', 'Statistics', 'Deep Learning'],
    interests: ['AI', 'Research', 'Books'],
    location: 'Boston, MA',
  },
];

class API {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  getToken() {
    if (!this.token) {
      // Check both auth_token (old) and access_token (new from email verification)
      this.token = localStorage.getItem('access_token') || localStorage.getItem('auth_token');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
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
    localStorage.setItem('refresh_token', response.refreshToken);

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
      localStorage.setItem('refresh_token', response.refreshToken);

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

      return authUser;
    }

    // Fallback
    return response;
  }

  async logout(): Promise<void> {
    this.clearToken();
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
