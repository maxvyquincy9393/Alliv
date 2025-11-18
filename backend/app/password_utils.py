"""
Reusable password hashing helpers shared across the backend.
"""
from __future__ import annotations

import hashlib
import logging
from typing import Final

import bcrypt
from passlib.hash import argon2

logger = logging.getLogger(__name__)

BCRYPT_PREFIXES: Final = ("$2a$", "$2b$", "$2y$")
BCRYPT_ROUNDS: Final = 12


def _prepare_secret(password: str) -> bytes:
    """
    Prepare the password bytes for bcrypt hashing.

    Bcrypt only considers the first 72 bytes. To avoid silent truncation we hash
    longer inputs with SHA-256 before feeding them into bcrypt. This mirrors the
    widely used bcrypt-sha256 approach while still emitting standard $2b$ hashes.
    """
    if not isinstance(password, str):
        raise TypeError("Password must be a string")
    
    secret = password.encode("utf-8")
    if len(secret) <= 72:
        return secret
    
    logger.warning(
        "Password exceeds bcrypt 72-byte limit; applying SHA-256 before hashing."
    )
    return hashlib.sha256(secret).digest()


def hash_password(password: str) -> str:
    """Hash password using bcrypt with a per-password salt."""
    secret = _prepare_secret(password)
    salt = bcrypt.gensalt(rounds=BCRYPT_ROUNDS)
    hashed = bcrypt.hashpw(secret, salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against stored hash (bcrypt first, Argon2 fallback)."""
    if not hashed_password:
        return False
    
    try:
        if hashed_password.startswith(BCRYPT_PREFIXES):
            secret = _prepare_secret(plain_password)
            return bcrypt.checkpw(secret, hashed_password.encode("utf-8"))
        
        if hashed_password.startswith("$argon2"):
            return argon2.verify(plain_password, hashed_password)
    except Exception as exc:
        logger.warning("Password verification failed: %s", exc)
        return False
    
    return False


