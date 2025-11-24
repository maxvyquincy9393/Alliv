"""
Two-Factor Authentication Service

TOTP-based two-factor authentication with backup codes.
Supports Google Authenticator, Authy, and other TOTP apps.
"""
import logging
import secrets
import hashlib
from typing import Optional, List, Tuple
from datetime import datetime
import pyotp
import qrcode
import io
import base64

from ..config import settings

logger = logging.getLogger(__name__)


class TwoFactorAuth:
    """
    Two-Factor Authentication service using TOTP (Time-based One-Time Password).
    
    Features:
    - TOTP secret generation
    - QR code generation for authenticator apps
    - TOTP code verification
    - Backup codes generation and verification
    - Enable/disable 2FA
    """
    
    def __init__(self):
        self.issuer_name = getattr(settings, 'MFA_ISSUER_NAME', 'COLABMATCH')
    
    def generate_secret(self) -> str:
        """
        Generate a new TOTP secret for a user.
        
        Returns:
            Base32-encoded secret string
        """
        return pyotp.random_base32()
    
    def get_totp_uri(self, secret: str, user_email: str) -> str:
        """
        Generate TOTP provisioning URI for QR code.
        
        Args:
            secret: Base32-encoded TOTP secret
            user_email: User's email address
        
        Returns:
            TOTP URI string
        """
        totp = pyotp.TOTP(secret)
        return totp.provisioning_uri(
            name=user_email,
            issuer_name=self.issuer_name
        )
    
    def generate_qr_code(self, secret: str, user_email: str) -> str:
        """
        Generate QR code image as base64 string.
        
        Args:
            secret: Base32-encoded TOTP secret
            user_email: User's email address
        
        Returns:
            Base64-encoded PNG image
        """
        try:
            uri = self.get_totp_uri(secret, user_email)
            
            # Generate QR code
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=4,
            )
            qr.add_data(uri)
            qr.make(fit=True)
            
            # Create image
            img = qr.make_image(fill_color="black", back_color="white")
            
            # Convert to base64
            buffer = io.BytesIO()
            img.save(buffer, format='PNG')
            buffer.seek(0)
            img_base64 = base64.b64encode(buffer.getvalue()).decode()
            
            return f"data:image/png;base64,{img_base64}"
            
        except Exception as e:
            logger.error(f"Failed to generate QR code: {e}")
            return ""
    
    def verify_totp(self, secret: str, code: str, valid_window: int = 1) -> bool:
        """
        Verify a TOTP code.
        
        Args:
            secret: Base32-encoded TOTP secret
            code: 6-digit TOTP code from user
            valid_window: Number of time windows to check (default 1 = ±30 seconds)
        
        Returns:
            True if code is valid, False otherwise
        """
        try:
            if not code or len(code) != 6 or not code.isdigit():
                return False
            
            totp = pyotp.TOTP(secret)
            return totp.verify(code, valid_window=valid_window)
            
        except Exception as e:
            logger.error(f"TOTP verification error: {e}")
            return False
    
    def generate_backup_codes(self, count: int = 10) -> List[str]:
        """
        Generate backup codes for account recovery.
        
        Args:
            count: Number of backup codes to generate (default 10)
        
        Returns:
            List of backup codes
        """
        codes = []
        for _ in range(count):
            # Generate 8-character alphanumeric code
            code = secrets.token_hex(4).upper()
            # Format as XXXX-XXXX for readability
            formatted_code = f"{code[:4]}-{code[4:]}"
            codes.append(formatted_code)
        
        return codes
    
    def hash_backup_code(self, code: str) -> str:
        """
        Hash a backup code for secure storage.
        
        Args:
            code: Backup code to hash
        
        Returns:
            SHA256 hash of the code
        """
        return hashlib.sha256(code.encode()).hexdigest()
    
    def verify_backup_code(self, code: str, hashed_codes: List[str]) -> Tuple[bool, Optional[str]]:
        """
        Verify a backup code and return the hash if valid.
        
        Args:
            code: Backup code from user
            hashed_codes: List of hashed backup codes
        
        Returns:
            Tuple of (is_valid, matched_hash)
        """
        try:
            # Normalize code (remove spaces, hyphens, uppercase)
            normalized_code = code.replace("-", "").replace(" ", "").upper()
            code_hash = self.hash_backup_code(normalized_code)
            
            if code_hash in hashed_codes:
                return True, code_hash
            
            return False, None
            
        except Exception as e:
            logger.error(f"Backup code verification error: {e}")
            return False, None
    
    def get_current_totp(self, secret: str) -> str:
        """
        Get the current TOTP code (for testing/debugging only).
        
        Args:
            secret: Base32-encoded TOTP secret
        
        Returns:
            Current 6-digit TOTP code
        """
        totp = pyotp.TOTP(secret)
        return totp.now()


# Singleton instance
_two_factor_auth = TwoFactorAuth()


def get_two_factor_auth() -> TwoFactorAuth:
    """Get the singleton two-factor auth instance"""
    return _two_factor_auth
