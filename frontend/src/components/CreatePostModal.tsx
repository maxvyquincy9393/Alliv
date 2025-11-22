import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Globe, Users, Lock, Loader2 } from 'lucide-react';
import type { PostCreateData, PostType, Visibility, Media } from '../types/post';
import { MediaUploader } from './MediaUploader';
import api from '../services/api';

interface CreatePostModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPostCreated?: () => void;
}

const POST_TYPES: { value: PostType; label: string; description: string }[] = [
    {
        value: 'update', label: 'Update', description: 'Share what you're working on' },
  { value: 'showcase', label: 'Showcase', description: 'Show off your work' },
  { value: 'collaboration', label: 'Collaboration', description: 'Find collaborators' },
    { value: 'milestone', label: 'Milestone', description: 'Celebrate achievements' },
    { value: 'opportunity', label: 'Opportunity', description: 'Share jobs or gigs' },
];

const VISIBILITY_OPTIONS: { value: Visibility; icon: any; label: string; description: string }[] = [
    { value: 'public', icon: Globe, label: 'Public', description: 'Anyone can see' },
    { value: 'connections', icon: Users, label: 'Connections', description: 'Only connections' },
    { value: 'private', icon: Lock, label: 'Private', description: 'Only you' },
];

const MAX_CAPTION_LENGTH = 2200;

export const CreatePostModal = ({ isOpen, onClose, onPostCreated }: CreatePostModalProps) => {
    const [postType, setPostType] = useState<PostType>('update');
    const [caption, setCaption] = useState('');
    const [visibility, setVisibility] = useState<Visibility>('public');
    const [media, setMedia] = useState<Media[]>([]);
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleMediaAdded = (newMedia: Media[]) => {
        setMedia(prev => [...prev, ...newMedia]);
    };

    const handleMediaRemoved = (url: string) => {
        setMedia(prev => prev.filter(m => m.url !== url));
    };

    const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            const tag = tagInput.trim().toLowerCase().replace(/^#/, '');

            if (tag && !tags.includes(tag) && tags.length < 10) {
                setTags([...tags, tag]);
                setTagInput('');
            }
        }
    };

    const handleRemoveTag = (tag: string) => {
        setTags(tags.filter(t => t !== tag));
    };

    const handleSubmit = async () => {
        if (!caption.trim() && media.length === 0) {
            setError('Please add some content or media');
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const postData: PostCreateData = {
                type: postType,
                content: {
                    text: caption.trim(),
                    tags: tags,
                },
                media_urls: media.map(m => m.url),
                visibility,
                tags,
            };

            await api.feed.createPost(postData);

            // Reset form
            setCaption('');
            setMedia([]);
            setTags([]);
            setPostType('update');
            setVisibility('public');

            onPostCreated?.();
            onClose();
        } catch (err: any) {
            console.error('Post creation error:', err);
            setError(err.message || 'Failed to create post');
        } finally {
            setSubmitting(false);
        }
    };

    const remainingChars = MAX_CAPTION_LENGTH - caption.length;
    const canSubmit = (caption.trim() || media.length > 0) && !submitting;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                    >
                        <div
                            className="w-full max-w-2xl max-h-[90vh] bg-slate-900 rounded-3xl shadow-2xl overflow-hidden pointer-events-auto flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-slate-700">
                                <h2 className="text-2xl font-bold text-white">Create Post</h2>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Content - Scrollable */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {/* Post Type Selector */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-3">
                                        Post Type
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {POST_TYPES.map((type) => (
                                            <button
                                                key={type.value}
                                                onClick={() => setPostType(type.value)}
                                                className={`
                          p-3 rounded-xl border-2 text-left transition-all
                          ${postType === type.value
                                                        ? 'border-blue-500 bg-blue-500/10'
                                                        : 'border-slate-700 hover:border-slate-600 bg-slate-800/30'
                                                    }
                        `}
                                            >
                                                <div className="font-semibold text-white text-sm mb-1">
                                                    {type.label}
                                                </div>
                                                <div className="text-xs text-slate-400">
                                                    {type.description}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Caption */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-3">
                                        Caption
                                    </label>
                                    <textarea
                                        value={caption}
                                        onChange={(e) => setCaption(e.target.value.slice(0, MAX_CAPTION_LENGTH))}
                                        placeholder="What's on your mind?"
                                        maxLength={MAX_CAPTION_LENGTH}
                                        rows={6}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none transition-colors resize-none"
                                    />
                                    <div className="flex items-center justify-between mt-2">
                                        <p className="text-xs text-slate-500">
                                            Use # for hashtags, @ to mention
                                        </p>
                                        <p className={`text-xs ${remainingChars < 100 ? 'text-yellow-400' : 'text-slate-500'}`}>
                                            {remainingChars} characters remaining
                                        </p>
                                    </div>
                                </div>

                                {/* Tags */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-3">
                                        Tags (max 10)
                                    </label>
                                    <input
                                        type="text"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={handleAddTag}
                                        placeholder="Type a tag and press Enter"
                                        disabled={tags.length >= 10}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none transition-colors disabled:opacity-50"
                                    />
                                    {tags.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {tags.map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded-full text-sm text-blue-300"
                                                >
                                                    #{tag}
                                                    <button
                                                        onClick={() => handleRemoveTag(tag)}
                                                        className="hover:text-blue-100 transition-colors"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Media Uploader */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-3">
                                        Media (max 10)
                                    </label>
                                    <MediaUploader
                                        onMediaAdded={handleMediaAdded}
                                        onMediaRemoved={handleMediaRemoved}
                                        currentMedia={media}
                                        maxFiles={10}
                                    />
                                </div>

                                {/* Visibility */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-3">
                                        Who can see this?
                                    </label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {VISIBILITY_OPTIONS.map((option) => {
                                            const Icon = option.icon;
                                            return (
                                                <button
                                                    key={option.value}
                                                    onClick={() => setVisibility(option.value)}
                                                    className={`
                            p-3 rounded-xl border-2 text-center transition-all
                            ${visibility === option.value
                                                            ? 'border-blue-500 bg-blue-500/10'
                                                            : 'border-slate-700 hover:border-slate-600 bg-slate-800/30'
                                                        }
                          `}
                                                >
                                                    <Icon className="w-5 h-5 mx-auto mb-2 text-white" />
                                                    <div className="font-semibold text-white text-sm mb-1">
                                                        {option.label}
                                                    </div>
                                                    <div className="text-xs text-slate-400">
                                                        {option.description}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Error Message */}
                                {error && (
                                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                                        <p className="text-sm text-red-400">{error}</p>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-6 border-t border-slate-700 bg-slate-900/50">
                                <div className="flex items-center justify-between gap-4">
                                    <p className="text-sm text-slate-400">
                                        {media.length} media • {tags.length} tags
                                    </p>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={onClose}
                                            className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors"
                                            disabled={submitting}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSubmit}
                                            disabled={!canSubmit}
                                            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all shadow-lg shadow-blue-900/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {submitting ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    Posting...
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="w-5 h-5" />
                                                    Post
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
