"""
Enhanced Security Module for CollabMatch
"""
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from fastapi import HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from passlib.context import CryptContext
from passlib.totp import TOTP
import hashlib
import hmac
import secrets
import re
import json
import os
import html
from email_validator import validate_email, EmailNotValidError
import redis
from ipaddress import ip_address, ip_network

try:
    import geoip2.database  # type: ignore
except ImportError:  # pragma: no cover - optional dependency
    geoip2 = None  # type: ignore

from cryptography.fernet import Fernet
import bcrypt
from slowapi import Limiter
from slowapi.util import get_remote_address


class EnhancedSecurityManager:
    """Comprehensive security management system"""
    
    def __init__(self, config: Dict):
        self.config = config
        self.pwd_context = CryptContext(
            schemes=["argon2", "bcrypt"],
            deprecated="auto",
            argon2__rounds=4,
            argon2__memory_cost=102400,
            argon2__parallelism=8
        )
        
        # JWT Configuration
        self.jwt_secret = config.get('JWT_SECRET')
        self.jwt_algorithm = "HS256"
        self.jwt_expiration = config.get('JWT_EXPIRATION', 3600)
        
        # Redis for session management
        self.redis_client = redis.Redis(
            host=config.get('REDIS_HOST', 'localhost'),
            port=config.get('REDIS_PORT', 6379),
            decode_responses=True
        )
        
        # Rate limiting
        self.limiter = Limiter(
            key_func=get_remote_address,
            default_limits=["1000 per hour", "100 per minute"]
        )
        
        # Encryption for sensitive data
        self.fernet = Fernet(config.get('ENCRYPTION_KEY', Fernet.generate_key()))
        
        # GeoIP for location verification (optional dependency)
        if geoip2 is not None:
            try:
                self.geoip_reader = geoip2.database.Reader('GeoLite2-City.mmdb')
            except Exception:  # pragma: no cover - missing DB file
                self.geoip_reader = None
        else:
            self.geoip_reader = None
        
        # Security patterns
        self.security_patterns = self._load_security_patterns()
    
    def _load_security_patterns(self) -> Dict:
        """Load security patterns and rules"""
        return {
            'password_requirements': {
                'min_length': 12,
                'require_uppercase': True,
                'require_lowercase': True,
                'require_digits': True,
                'require_special': True,
                'special_chars': '!@#$%^&*()_+-=[]{}|;:,.<>?',
                'banned_passwords': self._load_common_passwords()
            },
            'suspicious_patterns': {
                'sql_injection': [
                    r"(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE)\b)",
                    r"(--|\||;|\/\*|\*\/|xp_|sp_|0x)",
                ],
                'xss_attempts': [
                    r"<script[^>]*>.*?</script>",
                    r"javascript:",
                    r"on\w+\s*=",
                ],
                'path_traversal': [
                    r"\.\./",
                    r"\.\.\\",
                ],
            },
            'rate_limits': {
                'login': '5 per 15 minutes',
                'signup': '3 per hour',
                'password_reset': '3 per hour',
                'api_general': '1000 per hour',
                'message_send': '60 per minute',
                'profile_view': '100 per hour',
            },
            'session_config': {
                'max_duration': 86400,  # 24 hours
                'idle_timeout': 3600,    # 1 hour
                'concurrent_sessions': 5,
                'refresh_threshold': 1800,  # 30 minutes
            }
        }
    
    def _load_common_passwords(self) -> List[str]:
        """Load list of common passwords to ban"""
        return [
            'password', '123456', 'password123', 'admin', 'letmein',
            'qwerty', 'abc123', 'monkey', 'dragon', 'master',
            'password1', 'password123!', 'admin123', 'root', 'toor'
        ]
    
    # ============= Password Management =============
    
    def validate_password_strength(self, password: str) -> Dict[str, Any]:
        """Validate password strength with detailed feedback"""
        issues = []
        score = 100
        requirements = self.security_patterns['password_requirements']
        
        # Length check
        if len(password) < requirements['min_length']:
            issues.append(f"Password must be at least {requirements['min_length']} characters")
            score -= 20
        
        # Complexity checks
        if requirements['require_uppercase'] and not re.search(r'[A-Z]', password):
            issues.append("Must contain at least one uppercase letter")
            score -= 15
        
        if requirements['require_lowercase'] and not re.search(r'[a-z]', password):
            issues.append("Must contain at least one lowercase letter")
            score -= 15
        
        if requirements['require_digits'] and not re.search(r'\d', password):
            issues.append("Must contain at least one number")
            score -= 15
        
        if requirements['require_special'] and not re.search(
            f"[{re.escape(requirements['special_chars'])}]", password
        ):
            issues.append("Must contain at least one special character")
            score -= 15
        
        # Common password check
        if password.lower() in requirements['banned_passwords']:
            issues.append("This password is too common")
            score -= 50
        
        # Sequential characters check
        if self._has_sequential_chars(password):
            issues.append("Avoid sequential characters (abc, 123)")
            score -= 10
        
        # Repeated characters check
        if self._has_excessive_repeats(password):
            issues.append("Too many repeated characters")
            score -= 10
        
        # Calculate strength level
        if score >= 80:
            strength = "strong"
        elif score >= 60:
            strength = "medium"
        elif score >= 40:
            strength = "weak"
        else:
            strength = "very_weak"
        
        return {
            'valid': len(issues) == 0,
            'strength': strength,
            'score': max(0, score),
            'issues': issues,
            'suggestions': self._get_password_suggestions(score)
        }
    
    def _has_sequential_chars(self, password: str) -> bool:
        """Check for sequential characters"""
        sequences = ['abc', 'bcd', 'cde', '123', '234', '345', 'qwe', 'asd', 'zxc']
        password_lower = password.lower()
        return any(seq in password_lower for seq in sequences)
    
    def _has_excessive_repeats(self, password: str) -> bool:
        """Check for excessive character repetition"""
        return bool(re.search(r'(.)\1{2,}', password))
    
    def _get_password_suggestions(self, score: int) -> List[str]:
        """Get password improvement suggestions"""
        suggestions = []
        if score < 80:
            suggestions.append("Use a passphrase with 4+ random words")
            suggestions.append("Add numbers and special characters")
            suggestions.append("Avoid personal information")
        return suggestions
    
    def hash_password(self, password: str) -> str:
        """Hash password with Argon2"""
        return self.pwd_context.hash(password)
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify password against hash"""
        try:
            return self.pwd_context.verify(plain_password, hashed_password)
        except:
            return False
    
    # ============= Two-Factor Authentication =============
    
    def generate_2fa_secret(self, user_id: str) -> str:
        """Generate 2FA secret for user"""
        secret = secrets.token_urlsafe(32)
        # Store encrypted secret
        encrypted_secret = self.encrypt_data(secret)
        self.redis_client.setex(
            f"2fa_secret:{user_id}",
            86400,  # 24 hours
            encrypted_secret
        )
        return secret
    
    def setup_totp(self, user_id: str, secret: str) -> Dict[str, str]:
        """Setup TOTP for user"""
        totp = TOTP(secret)
        provisioning_uri = totp.generate_provisioning_uri(
            user_id,
            issuer="CollabMatch"
        )
        
        # Generate backup codes
        backup_codes = [secrets.token_hex(4) for _ in range(10)]
        self._store_backup_codes(user_id, backup_codes)
        
        return {
            'provisioning_uri': provisioning_uri,
            'backup_codes': backup_codes
        }
    
    def verify_2fa_token(self, user_id: str, token: str) -> bool:
        """Verify 2FA token"""
        # Get encrypted secret
        encrypted_secret = self.redis_client.get(f"2fa_secret:{user_id}")
        if not encrypted_secret:
            return False
        
        secret = self.decrypt_data(encrypted_secret)
        totp = TOTP(secret)
        
        # Check token or backup code
        if totp.verify(token, window=1):
            return True
        
        return self._verify_backup_code(user_id, token)
    
    def _store_backup_codes(self, user_id: str, codes: List[str]):
        """Store encrypted backup codes"""
        encrypted_codes = [self.encrypt_data(code) for code in codes]
        self.redis_client.setex(
            f"backup_codes:{user_id}",
            2592000,  # 30 days
            json.dumps(encrypted_codes)
        )
    
    def _verify_backup_code(self, user_id: str, code: str) -> bool:
        """Verify and consume backup code"""
        codes_json = self.redis_client.get(f"backup_codes:{user_id}")
        if not codes_json:
            return False
        
        encrypted_codes = json.loads(codes_json)
        for i, encrypted_code in enumerate(encrypted_codes):
            decrypted_code = self.decrypt_data(encrypted_code)
            if decrypted_code == code:
                # Remove used code
                del encrypted_codes[i]
                self.redis_client.setex(
                    f"backup_codes:{user_id}",
                    2592000,
                    json.dumps(encrypted_codes)
                )
                return True
        
        return False
    
    # ============= JWT & Session Management =============
    
    def create_access_token(
        self,
        user_id: str,
        additional_claims: Dict = None,
        expires_delta: Optional[timedelta] = None
    ) -> str:
        """Create JWT access token with enhanced claims"""
        to_encode = {
            'sub': user_id,
            'iat': datetime.utcnow(),
            'jti': secrets.token_urlsafe(32),  # JWT ID for revocation
            'type': 'access'
        }
        
        if additional_claims:
            to_encode.update(additional_claims)
        
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(seconds=self.jwt_expiration)
        
        to_encode.update({'exp': expire})
        
        # Store session
        self._store_session(user_id, to_encode['jti'], expire)
        
        return jwt.encode(to_encode, self.jwt_secret, algorithm=self.jwt_algorithm)
    
    def create_refresh_token(self, user_id: str) -> str:
        """Create refresh token"""
        to_encode = {
            'sub': user_id,
            'iat': datetime.utcnow(),
            'exp': datetime.utcnow() + timedelta(days=30),
            'jti': secrets.token_urlsafe(32),
            'type': 'refresh'
        }
        
        return jwt.encode(to_encode, self.jwt_secret, algorithm=self.jwt_algorithm)
    
    def verify_token(self, token: str, token_type: str = 'access') -> Dict:
        """Verify JWT token with additional checks"""
        try:
            payload = jwt.decode(
                token,
                self.jwt_secret,
                algorithms=[self.jwt_algorithm]
            )
            
            # Check token type
            if payload.get('type') != token_type:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token type"
                )
            
            # Check if token is revoked
            if self._is_token_revoked(payload.get('jti')):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token has been revoked"
                )
            
            # Check session validity
            if not self._is_session_valid(payload.get('sub'), payload.get('jti')):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Session expired or invalid"
                )
            
            return payload
            
        except JWTError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Token validation failed: {str(e)}"
            )
    
    def revoke_token(self, token_id: str):
        """Revoke a token by its JTI"""
        self.redis_client.setex(
            f"revoked_token:{token_id}",
            86400,  # Keep for 24 hours
            "1"
        )
    
    def _is_token_revoked(self, token_id: str) -> bool:
        """Check if token is revoked"""
        return bool(self.redis_client.get(f"revoked_token:{token_id}"))
    
    def _store_session(self, user_id: str, session_id: str, expires_at: datetime):
        """Store session information"""
        session_data = {
            'session_id': session_id,
            'user_id': user_id,
            'created_at': datetime.utcnow().isoformat(),
            'expires_at': expires_at.isoformat(),
            'last_activity': datetime.utcnow().isoformat()
        }
        
        self.redis_client.setex(
            f"session:{user_id}:{session_id}",
            int((expires_at - datetime.utcnow()).total_seconds()),
            json.dumps(session_data)
        )
    
    def _is_session_valid(self, user_id: str, session_id: str) -> bool:
        """Check if session is still valid"""
        session_data = self.redis_client.get(f"session:{user_id}:{session_id}")
        if not session_data:
            return False
        
        session = json.loads(session_data)
        
        # Check idle timeout
        last_activity = datetime.fromisoformat(session['last_activity'])
        idle_time = (datetime.utcnow() - last_activity).total_seconds()
        
        if idle_time > self.security_patterns['session_config']['idle_timeout']:
            return False
        
        # Update last activity
        session['last_activity'] = datetime.utcnow().isoformat()
        expires_at = datetime.fromisoformat(session['expires_at'])
        self.redis_client.setex(
            f"session:{user_id}:{session_id}",
            int((expires_at - datetime.utcnow()).total_seconds()),
            json.dumps(session)
        )
        
        return True
    
    # ============= Input Validation & Sanitization =============
    
    def validate_email(self, email: str) -> bool:
        """Validate email address"""
        try:
            validated = validate_email(email)
            return True
        except EmailNotValidError:
            return False
    
    def sanitize_input(self, input_str: str, input_type: str = 'general') -> str:
        """Sanitize user input to prevent injection attacks"""
        if not input_str:
            return ""
        
        # Remove null bytes
        sanitized = input_str.replace('\x00', '')
        
        # Check for SQL injection patterns
        for pattern in self.security_patterns['suspicious_patterns']['sql_injection']:
            if re.search(pattern, sanitized, re.IGNORECASE):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Potentially malicious input detected"
                )
        
        # Check for XSS attempts
        for pattern in self.security_patterns['suspicious_patterns']['xss_attempts']:
            if re.search(pattern, sanitized, re.IGNORECASE):
                sanitized = re.sub(pattern, '', sanitized, flags=re.IGNORECASE)
        
        # HTML escape for display
        if input_type == 'display':
            sanitized = html.escape(sanitized)
        
        # Path traversal prevention
        if input_type == 'filename':
            sanitized = os.path.basename(sanitized)
            sanitized = re.sub(r'[^a-zA-Z0-9._-]', '', sanitized)
        
        return sanitized[:1000]  # Limit length
    
    # ============= Rate Limiting =============
    
    def check_rate_limit(self, user_id: str, action: str) -> bool:
        """Check if user has exceeded rate limit for action"""
        limit_config = self.security_patterns['rate_limits'].get(action, '100 per hour')
        
        # Parse limit config
        parts = limit_config.split()
        limit = int(parts[0])
        period = parts[2]
        
        # Convert period to seconds
        period_seconds = {
            'second': 1,
            'minute': 60,
            'minutes': 60,
            'hour': 3600,
            'day': 86400
        }.get(period, 3600)
        
        # Check current count
        key = f"rate_limit:{action}:{user_id}"
        current = self.redis_client.get(key)
        
        if current is None:
            self.redis_client.setex(key, period_seconds, 1)
            return True
        
        if int(current) >= limit:
            return False
        
        self.redis_client.incr(key)
        return True
    
    # ============= IP & Geo Verification =============
    
    def verify_ip_location(self, ip_addr: str, expected_country: str = None) -> Dict:
        """Verify IP location and detect anomalies"""
        result = {
            'ip': ip_addr,
            'valid': True,
            'country': None,
            'city': None,
            'risk_score': 0.0,
            'is_vpn': False,
            'is_proxy': False,
            'is_tor': False
        }
        
        # Check if IP is valid
        try:
            ip = ip_address(ip_addr)
        except ValueError:
            result['valid'] = False
            return result
        
        # Check for private/local IPs
        if ip.is_private or ip.is_loopback:
            result['risk_score'] = 0.1
            return result
        
        # GeoIP lookup
        if self.geoip_reader:
            try:
                response = self.geoip_reader.city(ip_addr)
                result['country'] = response.country.iso_code
                result['city'] = response.city.name
                
                # Check country mismatch
                if expected_country and result['country'] != expected_country:
                    result['risk_score'] += 0.3
                
            except:
                result['risk_score'] += 0.2
        
        # Check against known VPN/proxy ranges
        if self._is_vpn_or_proxy(ip_addr):
            result['is_vpn'] = True
            result['risk_score'] += 0.4
        
        # Check Tor exit nodes
        if self._is_tor_exit(ip_addr):
            result['is_tor'] = True
            result['risk_score'] += 0.5
        
        return result
    
    def _is_vpn_or_proxy(self, ip_addr: str) -> bool:
        """Check if IP belongs to known VPN/proxy services"""
        # This would check against a database of known VPN IPs
        # For demo, checking against common VPN subnets
        vpn_ranges = [
            '10.0.0.0/8',
            '172.16.0.0/12',
            '192.168.0.0/16'
        ]
        
        try:
            ip = ip_address(ip_addr)
            for range_str in vpn_ranges:
                if ip in ip_network(range_str):
                    return True
        except:
            pass
        
        return False
    
    def _is_tor_exit(self, ip_addr: str) -> bool:
        """Check if IP is a Tor exit node"""
        # This would check against Tor exit node list
        # For demo, returning False
        return False
    
    # ============= Encryption & Data Protection =============
    
    def encrypt_data(self, data: str) -> str:
        """Encrypt sensitive data"""
        if isinstance(data, str):
            data = data.encode()
        return self.fernet.encrypt(data).decode()
    
    def decrypt_data(self, encrypted_data: str) -> str:
        """Decrypt sensitive data"""
        return self.fernet.decrypt(encrypted_data.encode()).decode()
    
    def hash_data(self, data: str) -> str:
        """Create SHA-256 hash of data"""
        return hashlib.sha256(data.encode()).hexdigest()
    
    def generate_secure_token(self, length: int = 32) -> str:
        """Generate cryptographically secure token"""
        return secrets.token_urlsafe(length)
    
    # ============= Account Security =============
    
    def detect_account_takeover(
        self,
        user_id: str,
        current_ip: str,
        user_agent: str
    ) -> Dict[str, Any]:
        """Detect potential account takeover attempts"""
        risk_indicators = []
        risk_score = 0.0
        
        # Get user's login history
        history_key = f"login_history:{user_id}"
        history = self.redis_client.lrange(history_key, 0, 10)
        
        if history:
            # Check for unusual IP
            recent_ips = [json.loads(h).get('ip') for h in history]
            if current_ip not in recent_ips:
                risk_indicators.append("New IP address")
                risk_score += 0.3
            
            # Check for unusual user agent
            recent_agents = [json.loads(h).get('user_agent') for h in history]
            if user_agent not in recent_agents:
                risk_indicators.append("New device/browser")
                risk_score += 0.2
            
            # Check for rapid location changes
            if len(recent_ips) > 1:
                last_location = self.verify_ip_location(recent_ips[0])
                current_location = self.verify_ip_location(current_ip)
                
                if (last_location['country'] and current_location['country'] and
                    last_location['country'] != current_location['country']):
                    risk_indicators.append("Rapid location change")
                    risk_score += 0.4
        
        # Store current login
        login_data = {
            'ip': current_ip,
            'user_agent': user_agent,
            'timestamp': datetime.utcnow().isoformat()
        }
        self.redis_client.lpush(history_key, json.dumps(login_data))
        self.redis_client.ltrim(history_key, 0, 49)  # Keep last 50 logins
        
        # Determine action
        if risk_score >= 0.7:
            action = "require_2fa"
        elif risk_score >= 0.5:
            action = "send_alert"
        else:
            action = "allow"
        
        return {
            'risk_score': risk_score,
            'risk_level': self._get_risk_level(risk_score),
            'indicators': risk_indicators,
            'recommended_action': action,
            'require_verification': risk_score >= 0.5
        }
    
    def _get_risk_level(self, score: float) -> str:
        """Get risk level from score"""
        if score >= 0.8:
            return "critical"
        elif score >= 0.6:
            return "high"
        elif score >= 0.4:
            return "medium"
        elif score >= 0.2:
            return "low"
        else:
            return "minimal"
    
    # ============= Security Audit Logging =============
    
    def log_security_event(
        self,
        event_type: str,
        user_id: Optional[str],
        details: Dict,
        severity: str = "info"
    ):
        """Log security events for audit"""
        event = {
            'timestamp': datetime.utcnow().isoformat(),
            'type': event_type,
            'user_id': user_id,
            'severity': severity,
            'details': details
        }
        
        # Store in Redis with TTL based on severity
        ttl = {
            'critical': 2592000,  # 30 days
            'high': 604800,       # 7 days
            'medium': 259200,     # 3 days
            'low': 86400,         # 1 day
            'info': 43200         # 12 hours
        }.get(severity, 86400)
        
        key = f"security_log:{datetime.utcnow().strftime('%Y%m%d')}:{secrets.token_hex(8)}"
        self.redis_client.setex(key, ttl, json.dumps(event))
        
        # Alert on critical events
        if severity == 'critical':
            self._send_security_alert(event)
    
    def _send_security_alert(self, event: Dict):
        """Send alert for critical security events"""
        # This would send email/SMS/push notification
        # For demo, just logging
        print(f"SECURITY ALERT: {event}")
    
    def get_security_analytics(self, user_id: Optional[str] = None) -> Dict:
        """Get security analytics and insights"""
        analytics = {
            'total_events': 0,
            'events_by_type': {},
            'events_by_severity': {},
            'recent_critical': [],
            'risk_trends': []
        }
        
        # Get all security logs
        pattern = f"security_log:*"
        if user_id:
            pattern = f"security_log:*:{user_id}:*"
        
        for key in self.redis_client.scan_iter(pattern):
            event = json.loads(self.redis_client.get(key))
            
            analytics['total_events'] += 1
            
            # Count by type
            event_type = event['type']
            analytics['events_by_type'][event_type] = \
                analytics['events_by_type'].get(event_type, 0) + 1
            
            # Count by severity
            severity = event['severity']
            analytics['events_by_severity'][severity] = \
                analytics['events_by_severity'].get(severity, 0) + 1
            
            # Collect critical events
            if severity == 'critical':
                analytics['recent_critical'].append(event)
        
        return analytics
