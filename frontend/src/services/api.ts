/**
 * API Service for Alliv Backend
 */

import { config } from '../config';

const API_BASE_URL = config.apiUrl;

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function formatErrorDetail(detail: any, fallback: string, status?: number): string {
  if (!detail) {
    return fallback;
  }

  if (typeof detail === 'string') {
    return detail;
  }

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item?.msg) return item.msg;
        if (item?.detail) return item.detail;
        if (item?.message) return item.message;
        return JSON.stringify(item);
      })
      .filter(Boolean);

    if (messages.length > 0) {
      return messages.join(' | ');
    }
  }

  if (typeof detail === 'object') {
    if (detail.message) return detail.message;
    if (detail.error) return detail.error;
    if (detail.msg) return detail.msg;
    return JSON.stringify(detail);
  }

  return fallback || (status ? `Request failed with status ${status}` : 'An error occurred');
}

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

interface VerificationRequest {
  email: string;
}

interface VerificationConfirm {
  email: string;
  code: string;
}

export interface ProfileUpdate {
  name?: string;
  age?: number;
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

// Retry configuration interface
interface RetryConfig {
  maxRetries?: number;
  retryDelay?: number;
  retryableErrors?: number[];
  exponentialBackoff?: boolean;
}

// Helper function to handle fetch requests with abort signal support
async function fetchAPI<T = any>(
  endpoint: string,
  options: RequestInit = {},
  signal?: AbortSignal
): Promise<ApiResponse<T>> {
  // CSRF token (if needed for POST/PUT/DELETE)
  const csrfToken = getCookie('csrf_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // Cookie-based auth: No Authorization header needed
  // Cookies are sent automatically with credentials: 'include'

  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal, // Add abort signal support
      credentials: 'include', // Always include cookies
    });

    let data: any = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      return {
        error: formatErrorDetail(
          data?.detail ?? data?.message ?? data,
          'An error occurred',
          response.status
        ),
      };
    }

    return { data };
  } catch (error) {
    // Handle abort errors
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('Request cancelled:', endpoint);
      return { error: 'Request cancelled' };
    }

    console.error('API Error:', error);
    return {
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

// Enhanced fetch with retry logic
async function fetchWithRetry<T = any>(
  endpoint: string,
  options: RequestInit = {},
  config: RetryConfig = {},
  signal?: AbortSignal
): Promise<ApiResponse<T>> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    retryableErrors = [408, 429, 500, 502, 503, 504],
    exponentialBackoff = true
  } = config;

  let lastError: string | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    // Check if request was aborted before making attempt
    if (signal?.aborted) {
      return { error: 'Request cancelled' };
    }

    try {
      const response = await fetchAPI<T>(endpoint, options, signal);

      // Success - return immediately
      if (!response.error) return response;

      // Check if cancelled
      if (response.error === 'Request cancelled') {
        return response;
      }

      // Check if error is retryable based on status code
      const statusMatch = response.error.match(/\b(\d{3})\b/);
      const status = statusMatch ? parseInt(statusMatch[1]) : 0;

      if (!retryableErrors.includes(status) || attempt === maxRetries) {
        return response; // Don't retry or max retries reached
      }

      lastError = response.error;

      // Wait before retry with exponential backoff
      const delay = exponentialBackoff
        ? retryDelay * Math.pow(2, attempt)
        : retryDelay;

      console.log(`Retrying ${endpoint} (attempt ${attempt + 1}/${maxRetries}) after ${delay}ms...`);

      // Use Promise.race to handle abort during delay
      await Promise.race([
        new Promise(resolve => setTimeout(resolve, delay)),
        new Promise((_, reject) => {
          signal?.addEventListener('abort', () => reject(new Error('Aborted during retry delay')));
        })
      ]).catch(() => { });

    } catch (error) {
      if (error instanceof Error && error.message === 'Aborted during retry delay') {
        return { error: 'Request cancelled' };
      }

      lastError = error instanceof Error ? error.message : 'Unknown error';

      if (attempt === maxRetries) {
        return {
          error: lastError || 'Request failed after retries'
        };
      }

      // Wait before retry
      const delay = exponentialBackoff
        ? retryDelay * Math.pow(2, attempt)
        : retryDelay;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return {
    error: lastError || 'Request failed after retries'
  };
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
    const response = await fetchAPI<{ accessToken?: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    // Backend sets tokens in HttpOnly cookies
    // No need to store tokens in localStorage

    return response;
  },

  /**
   * Logout
   */
  logout: async () => {
    const response = await fetchAPI('/auth/logout', {
      method: 'POST',
    });

    return response;
  },

  /**
   * Refresh access token
   */
  refreshToken: async () => {
    return fetchAPI<{ access_token: string }>('/auth/refresh', {
      method: 'POST',
    });
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

  /**
   * Request password reset OTP
   */
  requestPasswordReset: async (data: { email: string }) => {
    return fetchAPI('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Verify password reset OTP
   */
  verifyPasswordResetOTP: async (data: { email: string; code: string }) => {
    return fetchAPI<{ token: string }>('/auth/verify-reset-otp', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Reset password with token
   */
  resetPassword: async (data: { email: string; token: string; newPassword: string }) => {
    return fetchAPI('/auth/reset-password', {
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
  }, signal?: AbortSignal) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
    }

    return fetchWithRetry(
      `/discover/online?${params.toString()}`,
      {},
      {
        maxRetries: 2,
        retryDelay: 500,
        exponentialBackoff: true
      },
      signal
    );
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
  }, signal?: AbortSignal) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString());
      });
    }

    return fetchWithRetry(
      `/discover/nearby?${params.toString()}`,
      {},
      {
        maxRetries: 2,
        retryDelay: 500,
        exponentialBackoff: true
      },
      signal
    );
  },
};

// Match API
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


// Feed API
export const feedAPI = {
  /**
   * Get feed posts
   */
  getFeed: async (params?: {
    limit?: number;
    offset?: number;
    filter_type?: 'all' | 'following' | 'trending' | 'industry';
    industry?: string;
    tags?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.offset) query.append('offset', params.offset.toString());
    if (params?.filter_type) query.append('filter_type', params.filter_type);
    if (params?.industry) query.append('industry', params.industry);
    if (params?.tags) query.append('tags', params.tags);

    return fetchAPI(`/api/feed?${query.toString()}`);
  },

  /**
   * Create a new post
   */
  createPost: async (data: {
    type: string;
    content: {
      text: string;
      tags?: string[];
    };
    media_urls?: string[];
    visibility?: string;
    project_id?: string | null;
    tags?: string[];
  }) => {
    return fetchAPI('/api/feed', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update post
   */
  updatePost: async (postId: string, data: {
    content?: {
      text?: string;
      tags?: string[];
    };
    visibility?: string;
    tags?: string[];
  }) => {
    return fetchAPI(`/api/feed/${postId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete post
   */
  deletePost: async (postId: string) => {
    return fetchAPI(`/api/feed/${postId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Engage with post (like, bookmark, share)
   */
  engagePost: async (postId: string, action: 'like' | 'unlike' | 'bookmark' | 'unbookmark' | 'share') => {
    return fetchAPI(`/api/feed/${postId}/engage`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    });
  },

  /**
   * Get post comments
   */
  getComments: async (postId: string, params?: { limit?: number; offset?: number }) => {
    const query = new URLSearchParams();
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.offset) query.append('offset', params.offset.toString());

    return fetchAPI(`/api/feed/${postId}/comments?${query.toString()}`);
  },

  /**
   * Create comment
   */
  createComment: async (postId: string, data: { content: string; parent_id?: string | null }) => {
    return fetchAPI(`/api/feed/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Get trending tags
   */
  getTrendingTags: async (limit = 20) => {
    return fetchAPI(`/api/feed/trending-tags?limit=${limit}`);
  },
};

// Media API
export const mediaAPI = {
  /**
   * Upload media file (image or video)
   */
  uploadMedia: async (formData: FormData, onProgress?: (percent: number) => void) => {
    // Don't use fetchAPI for FormData uploads, use raw fetch
    const csrfToken = getCookie('csrf_token');
    const tokenResp = await authAPI.refreshToken();
    const token = tokenResp.data?.access_token || null;

    return new Promise<ApiResponse>((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            onProgress(percent);
          }
        });
      }

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.response);
            resolve({ data });
          } catch (e) {
            reject(new Error('Invalid response'));
          }
        } else {
          try {
            const errorData = JSON.parse(xhr.response);
            resolve({ error: errorData.detail || 'Upload failed' });
          } catch (e) {
            resolve({ error: `Upload failed with status ${xhr.status}` });
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload cancelled'));
      });

      xhr.open('POST', `${API_BASE_URL}/api/media/upload`);

      // Add auth header if token exists
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      if (csrfToken) {
        xhr.setRequestHeader('X-CSRF-Token', csrfToken);
      }

      // Include cookies for cookie-based auth
      xhr.withCredentials = true;

      xhr.send(formData);
    });
  },

  /**
   * Upload multiple media files
   */
  uploadMultiple: async (files: File[], onProgress?: (percent: number) => void) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    return mediaAPI.uploadMedia(formData, onProgress);
  },

  /**
   * Delete media file
   */
  deleteMedia: async (url: string) => {
    return fetchAPI('/api/media/delete', {
      method: 'DELETE',
      body: JSON.stringify({ url }),
    });
  },

  /**
   * Validate media URL
   */
  validateMedia: async (url: string) => {
    return fetchAPI(`/api/media/validate?url=${encodeURIComponent(url)}`);
  },
};

// Connections API
export const connectionsAPI = {
  /**
   * Get connections list
   */
  getConnections: async (params?: URLSearchParams) => {
    return fetchAPI(`/connections?${params?.toString() || ''}`);
  },

  /**
   * Get connection statistics
   */
  getStats: async () => {
    return fetchAPI('/connections/stats');
  },

  /**
   * Send connection request
   */
  requestConnection: async (recipientId: string, note?: string) => {
    return fetchAPI('/connections/request', {
      method: 'POST',
      body: JSON.stringify({ recipient_id: recipientId, note }),
    });
  },

  /**
   * Accept connection request
   */
  acceptConnection: async (connectionId: string) => {
    return fetchAPI(`/connections/${connectionId}/accept`, {
      method: 'PUT',
    });
  },
};

// Insights API
export const insightsAPI = {
  getMatchInsights: async (userId: string) => {
    return fetchAPI(`/insights/matches/${userId}`);
  },
};

// Health check
export const healthAPI = {
  check: async () => {
    return fetchAPI('/health');
  },
};

// Export all APIs
const api = {
  auth: authAPI,
  profile: profileAPI,
  upload: uploadAPI,
  discovery: discoveryAPI,
  match: matchAPI,
  chat: chatAPI,
  projects: projectsAPI,
  events: eventsAPI,
  safety: safetyAPI,
  connections: connectionsAPI,
  feed: feedAPI,
  media: mediaAPI,
  insights: insightsAPI,
  health: healthAPI,
};

export default api;
