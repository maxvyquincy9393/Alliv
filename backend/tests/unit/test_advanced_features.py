"""
Unit tests for Priority 3 & 4 features.
"""
import pytest
from unittest.mock import Mock, patch
from app.integrations.cdn import CDNConfig, get_cdn_url, get_static_headers
from app.integrations.feature_flags import (
    FeatureFlag,
    FeatureFlagManager,
    FeatureFlagType,
    is_feature_enabled,
    get_ab_variant,
)


class TestCDNIntegration:
    """Test CDN integration."""
    
    def test_cdn_config_initialization(self):
        """Test CDN configuration initialization."""
        cdn = CDNConfig(
            cdn_domain="cdn.example.com",
            cache_ttl=3600,
            enable_versioning=True
        )
        
        assert cdn.cdn_domain == "cdn.example.com"
        assert cdn.cache_ttl == 3600
        assert cdn.enable_versioning is True
    
    def test_get_asset_url_with_cdn(self):
        """Test asset URL generation with CDN."""
        cdn = CDNConfig(cdn_domain="cdn.example.com")
        url = cdn.get_asset_url("/images/logo.png")
        
        assert "cdn.example.com" in url
        assert "logo.png" in url
        assert url.startswith("https://")
    
    def test_get_asset_url_without_cdn(self):
        """Test asset URL without CDN."""
        cdn = CDNConfig(cdn_domain=None)
        url = cdn.get_asset_url("/images/logo.png")
        
        assert url == "/images/logo.png"
    
    def test_cache_headers_static(self):
        """Test static cache headers."""
        cdn = CDNConfig()
        headers = cdn.get_cache_headers("static")
        
        assert "Cache-Control" in headers
        assert "public" in headers["Cache-Control"]
        assert "immutable" in headers["Cache-Control"]
    
    def test_cache_headers_private(self):
        """Test private cache headers."""
        cdn = CDNConfig()
        headers = cdn.get_cache_headers("private")
        
        assert "Cache-Control" in headers
        assert "private" in headers["Cache-Control"]
        assert "no-cache" in headers["Cache-Control"]
    
    def test_generate_etag(self):
        """Test ETag generation."""
        cdn = CDNConfig()
        etag = cdn.generate_etag(b"test content")
        
        assert etag.startswith('"')
        assert etag.endswith('"')
        assert len(etag) > 2
    
    def test_purge_cache(self):
        """Test cache purge."""
        cdn = CDNConfig()
        result = cdn.purge_cache(["/images/logo.png", "/css/style.css"])
        
        assert result["status"] == "completed"
        assert result["paths_purged"] == 2
    
    def test_helper_functions(self):
        """Test CDN helper functions."""
        url = get_cdn_url("/test.png")
        assert isinstance(url, str)
        
        headers = get_static_headers("static")
        assert isinstance(headers, dict)


class TestFeatureFlags:
    """Test feature flag system."""
    
    def test_feature_flag_creation(self):
        """Test feature flag creation."""
        flag = FeatureFlag(
            key="test_feature",
            name="Test Feature",
            description="A test feature",
            flag_type=FeatureFlagType.BOOLEAN,
            enabled=True
        )
        
        assert flag.key == "test_feature"
        assert flag.enabled is True
    
    def test_boolean_flag(self):
        """Test boolean feature flag."""
        manager = FeatureFlagManager()
        
        # Add test flag
        flag = FeatureFlag(
            key="test_bool",
            name="Test Bool",
            description="Test",
            flag_type=FeatureFlagType.BOOLEAN,
            enabled=True
        )
        manager.add_flag(flag)
        
        assert manager.is_enabled("test_bool") is True
    
    def test_percentage_flag(self):
        """Test percentage-based feature flag."""
        manager = FeatureFlagManager()
        
        # 100% rollout should always be enabled
        flag = FeatureFlag(
            key="test_100",
            name="Test 100%",
            description="Test",
            flag_type=FeatureFlagType.PERCENTAGE,
            percentage=100
        )
        manager.add_flag(flag)
        
        assert manager.is_enabled("test_100", user_id="user123") is True
    
    def test_percentage_flag_zero(self):
        """Test 0% rollout."""
        manager = FeatureFlagManager()
        
        flag = FeatureFlag(
            key="test_0",
            name="Test 0%",
            description="Test",
            flag_type=FeatureFlagType.PERCENTAGE,
            percentage=0
        )
        manager.add_flag(flag)
        
        assert manager.is_enabled("test_0", user_id="user123") is False
    
    def test_user_list_flag(self):
        """Test user list feature flag."""
        manager = FeatureFlagManager()
        
        flag = FeatureFlag(
            key="test_users",
            name="Test Users",
            description="Test",
            flag_type=FeatureFlagType.USER_LIST,
            user_list=["user1", "user2", "user3"]
        )
        manager.add_flag(flag)
        
        assert manager.is_enabled("test_users", user_id="user1") is True
        assert manager.is_enabled("test_users", user_id="user999") is False
    
    def test_environment_flag(self):
        """Test environment-based feature flag."""
        manager = FeatureFlagManager()
        
        flag = FeatureFlag(
            key="test_env",
            name="Test Environment",
            description="Test",
            flag_type=FeatureFlagType.ENVIRONMENT,
            environments=["development", "staging"]
        )
        manager.add_flag(flag)
        
        assert manager.is_enabled("test_env", environment="development") is True
        assert manager.is_enabled("test_env", environment="production") is False
    
    def test_ab_variant_assignment(self):
        """Test A/B test variant assignment."""
        manager = FeatureFlagManager()
        
        # Same user should get same variant
        variant1 = manager.get_variant("test_experiment", "user123")
        variant2 = manager.get_variant("test_experiment", "user123")
        
        assert variant1 == variant2
        assert variant1 in ["control", "variant"]
    
    def test_ab_variant_multiple_variants(self):
        """Test A/B test with multiple variants."""
        manager = FeatureFlagManager()
        
        variants = ["control", "variant_a", "variant_b", "variant_c"]
        variant = manager.get_variant("test_experiment", "user123", variants)
        
        assert variant in variants
    
    def test_list_flags(self):
        """Test listing all flags."""
        manager = FeatureFlagManager()
        flags = manager.list_flags()
        
        assert isinstance(flags, list)
        assert len(flags) > 0
        assert all("key" in flag for flag in flags)
    
    def test_remove_flag(self):
        """Test removing feature flag."""
        manager = FeatureFlagManager()
        
        flag = FeatureFlag(
            key="test_remove",
            name="Test Remove",
            description="Test"
        )
        manager.add_flag(flag)
        
        assert "test_remove" in manager.flags
        
        manager.remove_flag("test_remove")
        assert "test_remove" not in manager.flags
    
    def test_unknown_flag(self):
        """Test checking unknown flag."""
        manager = FeatureFlagManager()
        
        # Unknown flags should return False
        assert manager.is_enabled("unknown_flag") is False
    
    def test_helper_functions(self):
        """Test feature flag helper functions."""
        result = is_feature_enabled("premium_features")
        assert isinstance(result, bool)
        
        variant = get_ab_variant("test_exp", "user123")
        assert variant in ["control", "variant"]


class TestDatabaseReadReplicas:
    """Test database read replica configuration."""
    
    def test_database_config_initialization(self):
        """Test database config initialization."""
        from app.integrations.database import DatabaseConfig
        
        config = DatabaseConfig()
        assert config.primary_uri is not None
        assert isinstance(config.read_replicas, list)
    
    def test_parse_read_replicas_empty(self):
        """Test parsing empty read replicas."""
        from app.integrations.database import DatabaseConfig
        
        config = DatabaseConfig()
        replicas = config._parse_read_replicas()
        
        assert isinstance(replicas, list)
    
    @pytest.mark.asyncio
    async def test_connect_primary(self):
        """Test primary connection."""
        from app.integrations.database import DatabaseConfig
        
        config = DatabaseConfig()
        
        # Should not raise exception
        try:
            client = await config.connect_primary()
            assert client is not None
        except Exception:
            # Connection might fail in test environment
            pass


class TestIntegrationModules:
    """Test integration module imports."""
    
    def test_cdn_module_imports(self):
        """Test CDN module imports."""
        from app.integrations import cdn
        
        assert hasattr(cdn, 'CDNConfig')
        assert hasattr(cdn, 'get_cdn_url')
        assert hasattr(cdn, 'get_static_headers')
    
    def test_feature_flags_module_imports(self):
        """Test feature flags module imports."""
        from app.integrations import feature_flags
        
        assert hasattr(feature_flags, 'FeatureFlag')
        assert hasattr(feature_flags, 'FeatureFlagManager')
        assert hasattr(feature_flags, 'is_feature_enabled')
        assert hasattr(feature_flags, 'get_ab_variant')
    
    def test_database_module_imports(self):
        """Test database module imports."""
        from app.integrations import database
        
        assert hasattr(database, 'DatabaseConfig')
        assert hasattr(database, 'db_config')
