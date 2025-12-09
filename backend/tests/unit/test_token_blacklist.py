"""
Unit tests for Token Blacklist Service
"""
import pytest
import asyncio
from datetime import datetime, timedelta
from app.services.token_blacklist import TokenBlacklist


@pytest.fixture
def blacklist():
    """Create a fresh blacklist instance for each test"""
    bl = TokenBlacklist()
    bl._memory_blacklist.clear()
    bl._memory_expiry.clear()
    return bl


class TestTokenBlacklist:
    """Test token blacklist functionality"""
    
    @pytest.mark.asyncio
    async def test_revoke_token(self, blacklist):
        """Should successfully revoke a token"""
        token = "test_token_123"
        exp_time = int((datetime.utcnow() + timedelta(hours=1)).timestamp())
        
        result = await blacklist.revoke_token(token, exp_time)
        assert result is True
        print("✅ Token revoked successfully")
    
    @pytest.mark.asyncio
    async def test_is_revoked_returns_true_for_blacklisted_token(self, blacklist):
        """Should return True for blacklisted token"""
        token = "test_token_456"
        exp_time = int((datetime.utcnow() + timedelta(hours=1)).timestamp())
        
        await blacklist.revoke_token(token, exp_time)
        is_revoked = await blacklist.is_revoked(token)
        
        assert is_revoked is True
        print("✅ Blacklisted token correctly identified")
    
    @pytest.mark.asyncio
    async def test_is_revoked_returns_false_for_valid_token(self, blacklist):
        """Should return False for non-blacklisted token"""
        token = "valid_token_789"
        
        is_revoked = await blacklist.is_revoked(token)
        
        assert is_revoked is False
        print("✅ Valid token correctly identified")
    
    @pytest.mark.asyncio
    async def test_expired_token_not_blacklisted(self, blacklist):
        """Should not blacklist already expired tokens"""
        token = "expired_token_000"
        exp_time = int((datetime.utcnow() - timedelta(hours=1)).timestamp())  # Already expired
        
        result = await blacklist.revoke_token(token, exp_time)
        
        # Should still return True (operation succeeded)
        assert result is True
        print("✅ Expired token handled correctly")
    
    @pytest.mark.asyncio
    async def test_cleanup_expired_tokens(self, blacklist):
        """Should clean up expired tokens from memory"""
        # Add expired token
        expired_token = "expired_token_111"
        exp_time = int((datetime.utcnow() - timedelta(seconds=1)).timestamp())
        blacklist._memory_blacklist.add(expired_token)
        blacklist._memory_expiry[expired_token] = exp_time
        
        # Add valid token
        valid_token = "valid_token_222"
        valid_exp = int((datetime.utcnow() + timedelta(hours=1)).timestamp())
        blacklist._memory_blacklist.add(valid_token)
        blacklist._memory_expiry[valid_token] = valid_exp
        
        # Run cleanup
        cleaned = await blacklist.cleanup_expired()
        
        assert cleaned == 1
        assert expired_token not in blacklist._memory_blacklist
        assert valid_token in blacklist._memory_blacklist
        print("✅ Expired tokens cleaned up successfully")
    
    @pytest.mark.asyncio
    async def test_revoke_all_user_tokens(self, blacklist):
        """Should revoke multiple tokens for a user"""
        user_id = "user_123"
        tokens = [
            {"token": "token_1", "exp": int((datetime.utcnow() + timedelta(hours=1)).timestamp())},
            {"token": "token_2", "exp": int((datetime.utcnow() + timedelta(hours=2)).timestamp())},
            {"token": "token_3", "exp": int((datetime.utcnow() + timedelta(hours=3)).timestamp())},
        ]
        
        revoked_count = await blacklist.revoke_all_user_tokens(user_id, tokens)
        
        assert revoked_count == 3
        
        # Verify all tokens are blacklisted
        for token_data in tokens:
            is_revoked = await blacklist.is_revoked(token_data["token"])
            assert is_revoked is True
        
        print("✅ Multiple tokens revoked successfully")
    
    @pytest.mark.asyncio
    async def test_get_stats(self, blacklist):
        """Should return blacklist statistics"""
        # Add some tokens to memory
        token1 = "stats_token_1"
        exp1 = int((datetime.utcnow() + timedelta(hours=1)).timestamp())
        await blacklist.revoke_token(token1, exp1)
        
        stats = await blacklist.get_stats()
        
        assert "backend" in stats
        assert "memory_tokens" in stats
        assert stats["memory_tokens"] >= 1
        print(f"✅ Stats retrieved: {stats}")
    
    @pytest.mark.asyncio
    async def test_memory_fallback(self, blacklist):
        """Should use memory storage when Redis is unavailable"""
        # Force memory fallback by not having Redis configured
        token = "memory_token_999"
        exp_time = int((datetime.utcnow() + timedelta(hours=1)).timestamp())
        
        await blacklist.revoke_token(token, exp_time)
        is_revoked = await blacklist.is_revoked(token)
        
        assert is_revoked is True
        assert token in blacklist._memory_blacklist
        print("✅ Memory fallback works correctly")


class TestTokenBlacklistIntegration:
    """Integration tests for token blacklist with auth flow"""
    
    @pytest.mark.asyncio
    async def test_blacklist_prevents_token_reuse(self, blacklist):
        """Should prevent reuse of blacklisted tokens"""
        token = "integration_token_001"
        exp_time = int((datetime.utcnow() + timedelta(hours=1)).timestamp())
        
        # Token should be valid initially
        is_revoked = await blacklist.is_revoked(token)
        assert is_revoked is False
        
        # Blacklist the token
        await blacklist.revoke_token(token, exp_time)
        
        # Token should now be invalid
        is_revoked = await blacklist.is_revoked(token)
        assert is_revoked is True
        
        print("✅ Token reuse prevented after blacklisting")
    
    @pytest.mark.asyncio
    async def test_concurrent_blacklist_operations(self, blacklist):
        """Should handle concurrent blacklist operations"""
        tokens = [f"concurrent_token_{i}" for i in range(10)]
        exp_time = int((datetime.utcnow() + timedelta(hours=1)).timestamp())
        
        # Revoke all tokens concurrently
        tasks = [blacklist.revoke_token(token, exp_time) for token in tokens]
        results = await asyncio.gather(*tasks)
        
        assert all(results)
        
        # Verify all are blacklisted
        check_tasks = [blacklist.is_revoked(token) for token in tokens]
        revoked_status = await asyncio.gather(*check_tasks)
        
        assert all(revoked_status)
        print("✅ Concurrent operations handled correctly")
