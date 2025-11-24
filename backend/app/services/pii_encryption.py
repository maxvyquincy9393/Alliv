"""
PII Encryption Service

Encrypts and decrypts Personally Identifiable Information (PII) for GDPR compliance.
Uses Fernet (symmetric encryption) for secure storage of sensitive user data.
"""
import logging
import base64
from typing import Optional, Dict, Any
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2

from ..config import settings

logger = logging.getLogger(__name__)


class PIIEncryption:
    """
    Service for encrypting and decrypting PII fields.
    
    Features:
    - Symmetric encryption using Fernet
    - Field-level encryption
    - Automatic key derivation from master key
    - Safe error handling
    
    PII Fields:
    - email
    - phone_number
    - full_address
    - government_id (if applicable)
    """
    
    def __init__(self):
        self.cipher = self._initialize_cipher()
        self.pii_fields = ['email', 'phoneNumber', 'phone', 'address', 'fullAddress']
    
    def _initialize_cipher(self) -> Optional[Fernet]:
        """Initialize Fernet cipher with encryption key"""
        try:
            # Get encryption key from settings
            encryption_key = getattr(settings, 'PII_ENCRYPTION_KEY', None)
            
            if not encryption_key:
                logger.warning("[WARN] PII_ENCRYPTION_KEY not configured - PII encryption disabled")
                return None
            
            # Decode base64 key
            key_bytes = base64.urlsafe_b64decode(encryption_key)
            
            return Fernet(key_bytes)
            
        except Exception as e:
            logger.error(f"Failed to initialize PII encryption: {e}")
            return None
    
    @staticmethod
    def generate_key() -> str:
        """
        Generate a new encryption key.
        This should be run once and stored in environment variables.
        
        Returns:
            Base64-encoded encryption key
        """
        key = Fernet.generate_key()
        return base64.urlsafe_b64encode(key).decode()
    
    def encrypt_field(self, value: str) -> str:
        """
        Encrypt a single PII field.
        
        Args:
            value: Plain text value to encrypt
        
        Returns:
            Encrypted value (base64-encoded)
        """
        if not value:
            return value
        
        if not self.cipher:
            logger.warning("PII encryption not available - storing plain text")
            return value
        
        try:
            encrypted = self.cipher.encrypt(value.encode())
            return encrypted.decode()
        except Exception as e:
            logger.error(f"Failed to encrypt field: {e}")
            return value  # Fallback to plain text
    
    def decrypt_field(self, encrypted_value: str) -> str:
        """
        Decrypt a single PII field.
        
        Args:
            encrypted_value: Encrypted value to decrypt
        
        Returns:
            Decrypted plain text value
        """
        if not encrypted_value:
            return encrypted_value
        
        if not self.cipher:
            # If no cipher, assume it's plain text
            return encrypted_value
        
        try:
            # Try to decrypt
            decrypted = self.cipher.decrypt(encrypted_value.encode())
            return decrypted.decode()
        except Exception as e:
            # If decryption fails, it might be plain text (legacy data)
            logger.warning(f"Failed to decrypt field (might be plain text): {e}")
            return encrypted_value
    
    def encrypt_pii_fields(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Encrypt all PII fields in a dictionary.
        
        Args:
            data: Dictionary containing user data
        
        Returns:
            Dictionary with encrypted PII fields
        """
        if not self.cipher:
            return data
        
        encrypted_data = data.copy()
        
        for field in self.pii_fields:
            if field in encrypted_data and encrypted_data[field]:
                encrypted_data[field] = self.encrypt_field(str(encrypted_data[field]))
                logger.debug(f"Encrypted PII field: {field}")
        
        return encrypted_data
    
    def decrypt_pii_fields(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Decrypt all PII fields in a dictionary.
        
        Args:
            data: Dictionary containing encrypted user data
        
        Returns:
            Dictionary with decrypted PII fields
        """
        if not self.cipher:
            return data
        
        decrypted_data = data.copy()
        
        for field in self.pii_fields:
            if field in decrypted_data and decrypted_data[field]:
                decrypted_data[field] = self.decrypt_field(str(decrypted_data[field]))
                logger.debug(f"Decrypted PII field: {field}")
        
        return decrypted_data
    
    def is_encrypted(self, value: str) -> bool:
        """
        Check if a value appears to be encrypted.
        
        Args:
            value: Value to check
        
        Returns:
            True if value appears encrypted, False otherwise
        """
        if not value or not self.cipher:
            return False
        
        try:
            # Try to decrypt - if it works, it's encrypted
            self.cipher.decrypt(value.encode())
            return True
        except:
            return False
    
    def migrate_field_to_encrypted(self, plain_value: str) -> str:
        """
        Migrate a plain text field to encrypted format.
        Useful for migrating existing data.
        
        Args:
            plain_value: Plain text value
        
        Returns:
            Encrypted value
        """
        if self.is_encrypted(plain_value):
            logger.info("Field already encrypted, skipping")
            return plain_value
        
        return self.encrypt_field(plain_value)
    
    def get_encryption_status(self) -> Dict[str, Any]:
        """
        Get encryption service status.
        
        Returns:
            Dictionary with encryption status
        """
        return {
            "enabled": self.cipher is not None,
            "algorithm": "Fernet (AES-128-CBC)",
            "pii_fields": self.pii_fields
        }


# Singleton instance
_pii_encryption = PIIEncryption()


def get_pii_encryption() -> PIIEncryption:
    """Get the singleton PII encryption instance"""
    return _pii_encryption
