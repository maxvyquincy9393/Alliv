/**
 * API Service for Alliv Backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Types
interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  birthdate: string;
}

interface OAuthProvider {
  provider: 'google' | 'github' | 'x';
}

interface VerificationRequest {
  email: string;
}

interface VerificationConfirm {
  email: string;
  code: string;
}

interface ProfileUpdate {
  name?: string;
  bio?: string;
  field?: string;
  skills?: string[];
  interests?: string[];
  goals?: string;
  photos?: string[];
  location?: {
    city: string;
    country: string;
    lat: number;
    lon: number;
    hideExact: boolean;
  };
  portfolio?: {
    github?: string;
    behance?: string;
    figma?: string;
    youtube?: string;
  };
}

// Helper function to handle fetch requests
async function fetchAPI<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('access_token');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token && !endpoint.includes('/auth/')) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        error: data.detail || data.message || 'An error occurred',
      };
    }

    return { data };
  } catch (error) {
    console.error('API Error:', error);
    return {
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

// Auth API
export const authAPI = {
  /**
   * Register with email/password
   */
  register: async (data: RegisterData) => {
    return fetchAPI('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Login with email/password
   */
  login: async (credentials: LoginCredentials) => {
    const response = await fetchAPI<{ access_token: string; refresh_token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.data?.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('refresh_token', response.data.refresh_token);
    }

    return response;
  },

  /**
   * Logout
   */
  logout: async () => {
    const response = await fetchAPI('/auth/logout', {
      method: 'POST',
    });

    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');

    return response;
  },

  /**
   * Refresh access token
   */
  refreshToken: async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      return { error: 'No refresh token' };
    }

    const response = await fetchAPI<{ access_token: string }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (response.data?.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
    }

    return response;
  },

  /**
   * Get OAuth authorization URL
   */
  getOAuthURL: async (provider: 'google' | 'github' | 'x') => {
    return fetchAPI<{ url: string }>(`/auth/oauth/${provider}/url`);
  },

  /**
   * Request OTP verification
   */
  requestVerification: async (data: VerificationRequest) => {
    return fetchAPI('/auth/verify/request', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Confirm OTP code
   */
  confirmVerification: async (data: VerificationConfirm) => {
    return fetchAPI('/auth/verify-email-code', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Profile API
export const profileAPI = {
  /**
   * Get current user profile
   */
  getMe: async () => {
    return fetchAPI('/me');
  },

  /**
   * Update current user profile
   */
  updateMe: async (data: ProfileUpdate) => {
    return fetchAPI('/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update profile photos
   */
  updatePhotos: async (photos: string[]) => {
    return fetchAPI('/me/photos', {
      method: 'PUT',
      body: JSON.stringify({ photos }),
    });
  },

  /**
   * Get user profile by ID
   */
  getProfile: async (userId: string) => {
    return fetchAPI(`/profiles/${userId}`);
  },
};

// Upload API
export const uploadAPI = {
  /**
   * Get presigned upload URL
   */
  getPresignURL: async () => {
    return fetchAPI<{
      timestamp: number;
      signature: string;
      api_key: string;
      cloud_name: string;
      public_id: string;
      folder: string;
    }>('/uploads/presign', {
      method: 'POST',
    });
  },

  /**
   * Complete upload after Cloudinary upload
   */
  completeUpload: async (publicId: string, url: string) => {
    return fetchAPI('/uploads/complete', {
      method: 'POST',
      body: JSON.stringify({ public_id: publicId, url }),
    });
  },

  /**
   * Delete photo by index
   */
  deletePhoto: async (photoIndex: number) => {
    return fetchAPI(`/uploads/photo/${photoIndex}`, {
      method: 'DELETE',
    });
  },

  /**
   * Get upload statistics
   */
  getStats: async () => {
    return fetchAPI<{
      currentPhotoCount: number;
      maxPhotos: number;
      uploadsInLastHour: number;
      maxUploadsPerHour: number;
      canUpload: boolean;
    }>('/uploads/stats');
  },

  /**
   * Upload file to Cloudinary using presigned URL
   */
  uploadToCloudinary: async (
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<{ url: string; publicId: string } | null> => {
    try {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File too large. Maximum size is 5MB');
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Only JPG, PNG, and WEBP are allowed');
      }

      // Get presigned URL
      const presignResponse = await uploadAPI.getPresignURL();
      if (!presignResponse.data) {
        console.error('Failed to get presign URL');
        return null;
      }

      const {
        timestamp,
        signature,
        api_key,
        cloud_name,
        public_id,
        folder
      } = presignResponse.data;

      // Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('timestamp', timestamp.toString());
      formData.append('signature', signature);
      formData.append('api_key', api_key);
      formData.append('public_id', public_id);
      formData.append('folder', folder);

      // Upload with progress tracking
      const uploadResponse = await new Promise<Response>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable && onProgress) {
            const percent = Math.round((e.loaded / e.total) * 100);
            onProgress(percent);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(new Response(xhr.response));
          } else {
            reject(new Error(`Upload failed: ${xhr.statusText}`));
          }
        });

        xhr.addEventListener('error', () => reject(new Error('Upload failed')));
        xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));

        xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`);
        xhr.send(formData);
      });

      if (!uploadResponse.ok) {
        console.error('Failed to upload to Cloudinary');
        return null;
      }

      const uploadData = await uploadResponse.json();

      // Complete upload (save to database)
      const completeResponse = await uploadAPI.completeUpload(
        public_id,
        uploadData.secure_url
      );

      if (!completeResponse.data) {
        console.error('Failed to complete upload');
        return null;
      }

      return {
        url: uploadData.secure_url,
        publicId: public_id
      };
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  },
};

// Discovery API
export const discoveryAPI = {
  /**
   * Discover online users
   */
  discoverOnline: async (filters?: {
    field?: string;
    skills?: string;
    interests?: string;
    vibe?: string;
    limit?: number;
    cursor?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
    }

    return fetchAPI(`/discover/online?${params.toString()}`);
  },

  /**
   * Discover nearby users
   */
  discoverNearby: async (filters?: {
    lat?: number;
    lon?: number;
    radiusKm?: number;
    field?: string;
    skills?: string;
    interests?: string;
    limit?: number;
    cursor?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString());
      });
    }

    return fetchAPI(`/discover/nearby?${params.toString()}`);
  },
};

// Swipes & Matches API
export const matchAPI = {
  /**
   * Swipe action
   */
  swipe: async (targetId: string, action: 'skip' | 'save' | 'connect') => {
    return fetchAPI('/swipes', {
      method: 'POST',
      body: JSON.stringify({ targetId, action }),
    });
  },

  /**
   * Get all matches
   */
  getMatches: async () => {
    return fetchAPI('/matches');
  },

  /**
   * Get match details
   */
  getMatch: async (matchId: string) => {
    return fetchAPI(`/matches/${matchId}`);
  },

  /**
   * Open chat with match
   */
  openChat: async (matchId: string) => {
    return fetchAPI(`/matches/${matchId}/open-chat`, {
      method: 'POST',
    });
  },
};

// Chat API
export const chatAPI = {
  /**
   * Get all chats
   */
  getChats: async () => {
    return fetchAPI('/chats');
  },

  /**
   * Get messages for a chat
   */
  getMessages: async (chatId: string, cursor?: string, limit = 50) => {
    const params = new URLSearchParams();
    if (cursor) params.append('cursor', cursor);
    params.append('limit', limit.toString());

    return fetchAPI(`/chats/${chatId}/messages?${params.toString()}`);
  },

  /**
   * Send message
   */
  sendMessage: async (chatId: string, text?: string, mediaUrl?: string) => {
    return fetchAPI(`/chats/${chatId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text, mediaUrl }),
    });
  },
};

// Projects API
export const projectsAPI = {
  /**
   * Get all projects
   */
  getProjects: async () => {
    return fetchAPI('/projects');
  },

  /**
   * Create project
   */
  createProject: async (data: {
    title: string;
    description: string;
    tags: string[];
    location?: string;
  }) => {
    return fetchAPI('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Apply to project
   */
  applyToProject: async (projectId: string) => {
    return fetchAPI(`/projects/${projectId}/apply`, {
      method: 'POST',
    });
  },

  /**
   * Invite to project
   */
  inviteToProject: async (projectId: string, userId: string) => {
    return fetchAPI(`/projects/${projectId}/invite`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  },
};

// Events API
export const eventsAPI = {
  /**
   * Get all events
   */
  getEvents: async () => {
    return fetchAPI('/events');
  },

  /**
   * Create event
   */
  createEvent: async (data: {
    title: string;
    startsAt: string;
    venueCity: string;
    tags: string[];
  }) => {
    return fetchAPI('/events', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * RSVP to event
   */
  rsvpToEvent: async (eventId: string) => {
    return fetchAPI(`/events/${eventId}/rsvp`, {
      method: 'POST',
    });
  },
};

// Safety API
export const safetyAPI = {
  /**
   * Report user
   */
  reportUser: async (data: {
    targetUserId: string;
    reason: 'harassment' | 'spam' | 'romantic' | 'nsfw' | 'other';
    details?: string;
  }) => {
    return fetchAPI('/reports', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Block user
   */
  blockUser: async (targetUserId: string) => {
    return fetchAPI('/blocks', {
      method: 'POST',
      body: JSON.stringify({ targetUserId }),
    });
  },
};

// Health check
export const healthAPI = {
  check: async () => {
    return fetchAPI('/health');
  },
};

export default {
  auth: authAPI,
  profile: profileAPI,
  upload: uploadAPI,
  discovery: discoveryAPI,
  match: matchAPI,
  chat: chatAPI,
  projects: projectsAPI,
  events: eventsAPI,
  safety: safetyAPI,
  health: healthAPI,
};
