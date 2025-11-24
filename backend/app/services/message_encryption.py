"""
Message Encryption Service

Encrypts messages at rest for privacy and GDPR compliance.
Uses AES-256-CBC with per-conversation key derivation.
"""
import logging
import os
import base64
from typing import Dict, Optional
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

from ..config import settings

logger = logging.getLogger(__name__)


class MessageEncryption:
    """
    Service for encrypting and decrypting chat messages.
    
    Features:
    - AES-256-CBC encryption
    - Per-conversation key derivation
    - Automatic padding/unpadding
    - IV generation for each message
    
    Security:
    - Messages encrypted at rest in database
    - Each conversation has unique derived key
    - IV prevents pattern detection
    """
    
    def __init__(self):
        self.master_key = self._get_master_key()
        self.enabled = self.master_key is not None
    
    def _get_master_key(self) -> Optional[bytes]:
        """Get master encryption key from settings"""
        try:
            key_b64 = getattr(settings, 'MESSAGE_ENCRYPTION_KEY', None)
            
            if not key_b64:
                logger.warning("[WARN] MESSAGE_ENCRYPTION_KEY not configured - message encryption disabled")
                return None
            
            # Decode base64 key
            key_bytes = base64.b64decode(key_b64)
            
            if len(key_bytes) != 32:
                logger.error("MESSAGE_ENCRYPTION_KEY must be 32 bytes (256 bits)")
                return None
            
            return key_bytes
            
        except Exception as e:
            logger.error(f"Failed to load message encryption key: {e}")
            return None
    
    @staticmethod
    def generate_key() -> str:
        """
        Generate a new encryption key.
        Run once and store in MESSAGE_ENCRYPTION_KEY env variable.
        
        Returns:
            Base64-encoded 32-byte key
        """
        key = os.urandom(32)
        return base64.b64encode(key).decode()
    
    def derive_conversation_key(self, conversation_id: str) -> bytes:
        """
        Derive a unique key for each conversation.
        
        Args:
            conversation_id: Conversation ID used as salt
        
        Returns:
            32-byte derived key
        """
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=conversation_id.encode(),
            iterations=100000,
            backend=default_backend()
        )
        return kdf.derive(self.master_key)
    
    def _pad(self, data: bytes) -> bytes:
        """PKCS7 padding"""
        padding_length = 16 - (len(data) % 16)
        padding = bytes([padding_length] * padding_length)
        return data + padding
    
    def _unpad(self, data: bytes) -> bytes:
        """Remove PKCS7 padding"""
        padding_length = data[-1]
        return data[:-padding_length]
    
    def encrypt_message(self, plaintext: str, conversation_id: str) -> Dict[str, str]:
        """
        Encrypt a message for storage.
        
        Args:
            plaintext: Message text to encrypt
            conversation_id: Conversation ID
        
        Returns:
            Dictionary with 'ciphertext' and 'iv' (both base64-encoded)
        """
        if not self.enabled:
            # If encryption disabled, return plaintext (for backward compatibility)
            logger.warning("Message encryption disabled - storing plain text")
            return {
                'ciphertext': base64.b64encode(plaintext.encode()).decode(),
                'iv': '',
                'encrypted': False
            }
        
        try:
            # Derive conversation-specific key
            conv_key = self.derive_conversation_key(conversation_id)
            
            # Generate random IV
            iv = os.urandom(16)
            
            # Create cipher
            cipher = Cipher(
                algorithms.AES(conv_key),
                modes.CBC(iv),
                backend=default_backend()
            )
            encryptor = cipher.encryptor()
            
            # Pad and encrypt
            padded = self._pad(plaintext.encode())
            ciphertext = encryptor.update(padded) + encryptor.finalize()
            
            return {
                'ciphertext': base64.b64encode(ciphertext).decode(),
                'iv': base64.b64encode(iv).decode(),
                'encrypted': True
            }
            
        except Exception as e:
            logger.error(f"Message encryption failed: {e}")
            # Fallback to plain text with warning
            return {
                'ciphertext': base64.b64encode(plaintext.encode()).decode(),
                'iv': '',
                'encrypted': False
            }
    
    def decrypt_message(self, encrypted_data: Dict[str, str], conversation_id: str) -> str:
        """
        Decrypt a message from storage.
        
        Args:
            encrypted_data: Dictionary with 'ciphertext' and 'iv'
            conversation_id: Conversation ID
        
        Returns:
            Decrypted plaintext message
        """
        # Check if message was actually encrypted
        if not encrypted_data.get('encrypted', True):
            # Plain text message
            try:
                return base64.b64decode(encrypted_data['ciphertext']).decode()
            except:
                return encrypted_data['ciphertext']
        
        if not self.enabled:
            logger.warning("Attempting to decrypt but encryption is disabled")
            try:
                return base64.b64decode(encrypted_data['ciphertext']).decode()
            except:
                return encrypted_data['ciphertext']
        
        try:
            # Derive conversation-specific key
            conv_key = self.derive_conversation_key(conversation_id)
            
            # Decode base64
            iv = base64.b64decode(encrypted_data['iv'])
            ciphertext = base64.b64decode(encrypted_data['ciphertext'])
            
            # Create cipher
            cipher = Cipher(
                algorithms.AES(conv_key),
                modes.CBC(iv),
                backend=default_backend()
            )
            decryptor = cipher.decryptor()
            
            # Decrypt and unpad
            padded = decryptor.update(ciphertext) + decryptor.finalize()
            plaintext = self._unpad(padded)
            
            return plaintext.decode()
            
        except Exception as e:
            logger.error(f"Message decryption failed: {e}")
            # Return error indicator
            return "[Decryption failed]"
    
    def is_enabled(self) -> bool:
        """Check if encryption is enabled"""
        return self.enabled
    
    def get_status(self) -> Dict:
        """Get encryption service status"""
        return {
            "enabled": self.enabled,
            "algorithm": "AES-256-CBC",
            "key_derivation": "PBKDF2-HMAC-SHA256",
            "iterations": 100000
        }


# Singleton instance
_message_encryption = MessageEncryption()


def get_message_encryption() -> MessageEncryption:
    """Get the singleton message encryption instance"""
    return _message_encryption
