/**
 * Post and Feed Types for Community Feed
 */

export type PostType =
    | 'update'
    | 'talent-request'
    | 'event'
    | 'showcase'
    | 'milestone'
    | 'opportunity'
    | 'collaboration'
    | 'resource'
    | 'discussion';

export type Industry =
    | 'technology'
    | 'design'
    | 'marketing'
    | 'business'
    | 'arts'
    | 'education'
    | 'healthcare'
    | 'finance'
    | 'engineering'
    | 'all';

export type MediaType = 'image' | 'video';

export type AspectRatio = 'square' | 'portrait' | 'landscape';

export type Visibility = 'public' | 'connections' | 'project' | 'private';

export interface Media {
    type: MediaType;
    url: string;
    thumbnail?: string; // For videos
    width?: number;
    height?: number;
    duration?: number; // For videos in seconds
    aspectRatio?: AspectRatio;
    filename?: string;
    size?: number;
    mimeType?: string;
}

export interface MediaUploadResponse {
    success: boolean;
    media: Media;
    message?: string;
}

export interface PostAuthor {
    id: string;
    name: string;
    avatar: string;
    role: string;
    field?: string;
    verified: boolean;
}

export interface PostProject {
    id: string;
    name: string;
    industry?: string;
    logo?: string;
}

export interface PostContent {
    text: string;
    tags: string[];
    media?: Media[];
}

export interface PostEngagement {
    likes: number;
    comments: number;
    shares: number;
    views: number;
    bookmarks?: number;
}

export interface UserEngagement {
    liked: boolean;
    bookmarked: boolean;
    shared?: boolean;
}

export interface Post {
    id: string;
    type: PostType;
    author: PostAuthor;
    content: PostContent;
    project?: PostProject;
    engagement: PostEngagement;
    userEngagement: UserEngagement;
    timestamp: string;
    visibility: Visibility;
    tags?: string[];
    media_urls?: string[]; // For backend compatibility
    updatedAt?: string;
}

export interface PostCreateData {
    type: PostType;
    content: {
        text: string;
        tags?: string[];
    };
    media_urls?: string[];
    visibility?: Visibility;
    project_id?: string | null;
    tags?: string[];
}

export interface PostUpdateData {
    content?: {
        text?: string;
        tags?: string[];
    };
    visibility?: Visibility;
    tags?: string[];
}

export interface Comment {
    id: string;
    post_id: string;
    author: PostAuthor;
    content: string;
    parent_id?: string | null;
    replies: Comment[];
    likes: number;
    user_liked: boolean;
    timestamp: string;
}

export interface CommentCreateData {
    content: string;
    parent_id?: string | null;
}

export interface FeedParams {
    limit?: number;
    offset?: number;
    filter_type?: 'all' | 'following' | 'trending' | 'industry';
    industry?: Industry;
    tags?: string;
}

export interface TrendingTag {
    tag: string;
    count: number;
    engagement: number;
}
