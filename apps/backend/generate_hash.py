from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
hash_value = pwd_context.hash("pass123")
print(f"Password hash for 'pass123':")
print(hash_value)
