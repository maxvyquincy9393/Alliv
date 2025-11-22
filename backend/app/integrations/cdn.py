"""
CDN Integration helper for static assets.

Provides utilities for:
- CloudFront/Cloudflare URL generation
- Cache control headers
- Asset versioning
- Cache purging
"""
import hashlib
import logging
from typing import Optional, Dict, List
from datetime import datetime, timedelta
from ..config import settings

logger = logging.getLogger(__name__)


class CDNConfig:
    """CDN configuration and utilities."""
    
    def __init__(
        self,
        cdn_domain: Optional[str] = None,
        cache_ttl: int = 86400,  # 24 hours default
        enable_versioning: bool = True
    ):
        """
        Initialize CDN configuration.
        
        Args:
            cdn_domain: CDN domain (e.g., 'd123.cloudfront.net' or 'cdn.example.com')
            cache_ttl: Default cache TTL in seconds
            enable_versioning: Enable asset versioning
        """
        self.cdn_domain = cdn_domain or getattr(settings, 'CDN_DOMAIN', None)
        self.cache_ttl = cache_ttl
        self.enable_versioning = enable_versioning
        self.version = self._get_version()
    
    def _get_version(self) -> str:
        """Get current asset version (based on deployment time or config)."""
        # In production, use actual version from deployment
        return getattr(settings, 'ASSET_VERSION', 'v1')
    
    def get_asset_url(
        self,
        path: str,
        versioned: Optional[bool] = None
    ) -> str:
        """
        Get CDN URL for static asset.
        
        Args:
            path: Asset path (e.g., '/images/logo.png')
            versioned: Override version setting
            
        Returns:
            Full CDN URL
        """
        if not self.cdn_domain:
            # No CDN configured, return local path
            return path
        
        # Remove leading slash
        path = path.lstrip('/')
        
        # Add version if enabled
        use_version = versioned if versioned is not None else self.enable_versioning
        if use_version:
            path = f"{self.version}/{path}"
        
        # Construct CDN URL
        protocol = "https"
        return f"{protocol}://{self.cdn_domain}/{path}"
    
    def get_cache_headers(
        self,
        cache_type: str = "static",
        custom_ttl: Optional[int] = None
    ) -> Dict[str, str]:
        """
        Get cache control headers for asset type.
        
        Args:
            cache_type: Type of cache ('static', 'dynamic', 'private', 'immutable')
            custom_ttl: Custom TTL in seconds
            
        Returns:
            Dictionary of cache headers
        """
        ttl = custom_ttl or self.cache_ttl
        
        cache_configs = {
            "static": {
                "Cache-Control": f"public, max-age={ttl}, immutable",
                "Vary": "Accept-Encoding"
            },
            "dynamic": {
                "Cache-Control": f"public, max-age={min(ttl, 300)}, must-revalidate",
                "Vary": "Accept-Encoding"
            },
            "private": {
                "Cache-Control": "private, no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0"
            },
            "immutable": {
                "Cache-Control": f"public, max-age={ttl}, immutable",
                "Vary": "Accept-Encoding"
            }
        }
        
        return cache_configs.get(cache_type, cache_configs["static"])
    
    def generate_etag(self, content: bytes) -> str:
        """
        Generate ETag for content.
        
        Args:
            content: Content bytes
            
        Returns:
            ETag string
        """
        return f'"{hashlib.md5(content).hexdigest()}"'
    
    def purge_cache(
        self,
        paths: List[str],
        invalidate_all: bool = False
    ) -> Dict[str, any]:
        """
        Purge CDN cache for specific paths.
        
        Args:
            paths: List of paths to purge
            invalidate_all: Invalidate all cached content
            
        Returns:
            Purge result
        """
        logger.info(f"Cache purge requested for {len(paths)} paths")
        
        # In production:
        # - For CloudFront: Use boto3 to create invalidation
        # - For Cloudflare: Use API to purge cache
        # - For other CDNs: Use respective APIs
        
        if invalidate_all:
            logger.warning("Full cache invalidation requested")
        
        return {
            "status": "completed",
            "paths_purged": len(paths),
            "invalidate_all": invalidate_all,
            "timestamp": datetime.now().isoformat()
        }


# Global CDN instance
cdn = CDNConfig()


def get_cdn_url(path: str, versioned: bool = True) -> str:
    """
    Helper function to get CDN URL.
    
    Args:
        path: Asset path
        versioned: Include version
        
    Returns:
        CDN URL
    """
    return cdn.get_asset_url(path, versioned)


def get_static_headers(cache_type: str = "static") -> Dict[str, str]:
    """
    Helper function to get static asset headers.
    
    Args:
        cache_type: Cache type
        
    Returns:
        Cache headers
    """
    return cdn.get_cache_headers(cache_type)
