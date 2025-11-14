/**
 * Progressive Image Component with Skeleton Loader
 * 
 * Features:
 * - Skeleton loading state
 * - Lazy loading with Intersection Observer
 * - Blur-up effect (optional low-res preview)
 * - Error handling with fallback
 * - Optimized image loading
 */

import { useState, useEffect, useRef } from 'react';
import { useInView } from 'react-intersection-observer';

interface ProgressiveImageProps {
  src: string;
  alt: string;
  className?: string;
  skeletonClassName?: string;
  lowResSrc?: string; // Optional low-res preview for blur-up
  fallbackSrc?: string;
  onLoad?: () => void;
  onError?: () => void;
  eager?: boolean; // Skip lazy loading
}

export const ProgressiveImage = ({
  src,
  alt,
  className = '',
  skeletonClassName = '',
  lowResSrc,
  fallbackSrc = 'https://via.placeholder.com/400x400?text=No+Image',
  onLoad,
  onError,
  eager = false,
}: ProgressiveImageProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(lowResSrc || '');
  const imgRef = useRef<HTMLImageElement>(null);

  // Lazy loading with intersection observer
  const { ref: inViewRef, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
    skip: eager, // Skip if eager loading
  });

  // Combine refs
  const setRefs = (el: HTMLDivElement | null) => {
    inViewRef(el);
  };

  useEffect(() => {
    // Don't load if not in view and not eager
    if (!eager && !inView) return;

    // Load high-res image
    const img = new Image();
    img.src = src;

    img.onload = () => {
      setCurrentSrc(src);
      setLoading(false);
      onLoad?.();
    };

    img.onerror = () => {
      setError(true);
      setCurrentSrc(fallbackSrc);
      setLoading(false);
      onError?.();
    };

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, fallbackSrc, inView, eager, onLoad, onError]);

  return (
    <div ref={setRefs} className="relative overflow-hidden">
      {/* Skeleton loader */}
      {loading && (
        <div
          className={`absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer ${skeletonClassName}`}
          style={{
            backgroundSize: '200% 100%',
          }}
        />
      )}

      {/* Image */}
      <img
        ref={imgRef}
        src={currentSrc || fallbackSrc}
        alt={alt}
        className={`${className} ${
          loading ? 'opacity-0' : 'opacity-100'
        } transition-opacity duration-300 ${
          lowResSrc && currentSrc === lowResSrc && !error
            ? 'blur-sm scale-105'
            : ''
        }`}
        loading={eager ? 'eager' : 'lazy'}
      />

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center text-gray-400">
            <svg
              className="w-12 h-12 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-sm">Image unavailable</p>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Avatar Component with Progressive Loading
 */
interface AvatarProps {
  src?: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fallbackText?: string;
  className?: string;
}

export const Avatar = ({
  src,
  alt,
  size = 'md',
  fallbackText,
  className = '',
}: AvatarProps) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base',
    xl: 'w-24 h-24 text-xl',
  };

  const initials = fallbackText
    ? fallbackText
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : alt
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

  if (!src) {
    return (
      <div
        className={`${sizeClasses[size]} ${className} rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center font-semibold text-white`}
      >
        {initials}
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} ${className} rounded-full overflow-hidden`}>
      <ProgressiveImage
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        fallbackSrc={`https://ui-avatars.com/api/?name=${encodeURIComponent(
          alt
        )}&background=a855f7&color=fff`}
        eager={size === 'sm'} // Eager load small avatars
      />
    </div>
  );
};

/**
 * Card Image Skeleton
 */
export const CardImageSkeleton = ({ className = '' }: { className?: string }) => {
  return (
    <div
      className={`bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer ${className}`}
      style={{
        backgroundSize: '200% 100%',
      }}
    />
  );
};

/**
 * Grid Skeleton for loading states
 */
export const GridSkeleton = ({ count = 6 }: { count?: number }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden">
          <CardImageSkeleton className="h-48 w-full" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
            <div className="h-3 bg-gray-100 rounded w-1/2 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
};
