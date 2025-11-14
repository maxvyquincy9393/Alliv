import crypto from 'crypto';
import bcrypt from 'bcryptjs';

// Environment variables for encryption
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const IV_LENGTH = 16;
const SALT_ROUNDS = 12;

// AES-256-GCM encryption for sensitive data
export class DataEncryption {
  private static algorithm = 'aes-256-gcm';
  private static key = Buffer.from(ENCRYPTION_KEY, 'hex');

  /**
   * Encrypt sensitive data using AES-256-GCM
   */
  static encrypt(text: string): { encrypted: string; iv: string; authTag: string } {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  /**
   * Decrypt data encrypted with AES-256-GCM
   */
  static decrypt(encryptedData: { encrypted: string; iv: string; authTag: string }): string {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.key,
      Buffer.from(encryptedData.iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Hash sensitive data for comparison (one-way)
   */
  static hash(data: string): string {
    return crypto
      .createHash('sha256')
      .update(data)
      .digest('hex');
  }

  /**
   * Generate secure random token
   */
  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Encrypt field for database storage
   */
  static encryptField(value: any): string {
    if (typeof value !== 'string') {
      value = JSON.stringify(value);
    }
    
    const encrypted = this.encrypt(value);
    return JSON.stringify(encrypted);
  }

  /**
   * Decrypt field from database
   */
  static decryptField(encryptedValue: string): any {
    try {
      const encrypted = JSON.parse(encryptedValue);
      const decrypted = this.decrypt(encrypted);
      
      try {
        return JSON.parse(decrypted);
      } catch {
        return decrypted;
      }
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }
}

// Password utilities with bcrypt
export class PasswordSecurity {
  /**
   * Hash password with bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    // Add additional entropy
    const pepper = process.env.PASSWORD_PEPPER || 'default-pepper';
    const pepperedPassword = password + pepper;
    
    return bcrypt.hash(pepperedPassword, SALT_ROUNDS);
  }

  /**
   * Verify password against hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    const pepper = process.env.PASSWORD_PEPPER || 'default-pepper';
    const pepperedPassword = password + pepper;
    
    return bcrypt.compare(pepperedPassword, hash);
  }

  /**
   * Check password strength
   */
  static checkPasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
    score: number;
  } {
    const errors: string[] = [];
    let score = 0;

    // Length check
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    } else if (password.length >= 12) {
      score += 2;
    } else {
      score += 1;
    }

    // Uppercase check
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    } else {
      score += 1;
    }

    // Lowercase check
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    } else {
      score += 1;
    }

    // Number check
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    } else {
      score += 1;
    }

    // Special character check
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    } else {
      score += 2;
    }

    // Common password check
    const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein'];
    if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
      errors.push('Password is too common');
      score = 0;
    }

    return {
      isValid: errors.length === 0,
      errors,
      score: Math.min(score, 10)
    };
  }

  /**
   * Generate secure password
   */
  static generateSecurePassword(length: number = 16): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    const allChars = uppercase + lowercase + numbers + special;
    let password = '';
    
    // Ensure at least one character from each category
    password += uppercase[crypto.randomInt(uppercase.length)];
    password += lowercase[crypto.randomInt(lowercase.length)];
    password += numbers[crypto.randomInt(numbers.length)];
    password += special[crypto.randomInt(special.length)];
    
    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += allChars[crypto.randomInt(allChars.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => crypto.randomInt(2) - 1).join('');
  }
}

// Token management for sessions and authentication
export class TokenManager {
  /**
   * Generate JWT-like token
   */
  static generateToken(payload: any, expiresIn: number = 3600): string {
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };
    
    const now = Date.now();
    const exp = now + (expiresIn * 1000);
    
    const tokenPayload = {
      ...payload,
      iat: now,
      exp: exp
    };
    
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(tokenPayload)).toString('base64url');
    
    const signature = crypto
      .createHmac('sha256', ENCRYPTION_KEY)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');
    
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  /**
   * Verify and decode token
   */
  static verifyToken(token: string): any {
    const [encodedHeader, encodedPayload, signature] = token.split('.');
    
    if (!encodedHeader || !encodedPayload || !signature) {
      throw new Error('Invalid token format');
    }
    
    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', ENCRYPTION_KEY)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');
    
    if (signature !== expectedSignature) {
      throw new Error('Invalid token signature');
    }
    
    // Decode and check expiration
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString());
    
    if (payload.exp && payload.exp < Date.now()) {
      throw new Error('Token expired');
    }
    
    return payload;
  }

  /**
   * Generate refresh token
   */
  static generateRefreshToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }
}

// Secure data sanitization
export class DataSanitizer {
  /**
   * Remove sensitive fields from object
   */
  static sanitizeOutput(data: any, sensitiveFields: string[] = ['password', 'token', 'secret']): any {
    if (!data) return data;
    
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeOutput(item, sensitiveFields));
    }
    
    if (typeof data === 'object') {
      const sanitized = { ...data };
      
      for (const field of sensitiveFields) {
        if (field in sanitized) {
          delete sanitized[field];
        }
      }
      
      // Recursively sanitize nested objects
      for (const key in sanitized) {
        if (typeof sanitized[key] === 'object') {
          sanitized[key] = this.sanitizeOutput(sanitized[key], sensitiveFields);
        }
      }
      
      return sanitized;
    }
    
    return data;
  }

  /**
   * Mask sensitive data for logging
   */
  static maskSensitiveData(data: string, type: 'email' | 'phone' | 'credit_card' = 'email'): string {
    switch (type) {
      case 'email':
        return data.replace(/^(.{2}).*(@.*)$/, '$1***$2');
      case 'phone':
        return data.replace(/^(\d{3}).*(\d{2})$/, '$1*****$2');
      case 'credit_card':
        return data.replace(/^(\d{4}).*(\d{4})$/, '$1********$2');
      default:
        return '***';
    }
  }
}

export default {
  DataEncryption,
  PasswordSecurity,
  TokenManager,
  DataSanitizer
};
