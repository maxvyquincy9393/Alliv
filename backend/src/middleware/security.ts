import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss';
import crypto from 'crypto';
import { AppError } from '../utils/errors';

// Rate limiting configurations for different endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests',
      message: 'You have exceeded the rate limit. Please try again later.',
      retryAfter: req.rateLimit?.resetTime
    });
  }
});

export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

export const strictLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Very strict limit for sensitive operations
  message: 'Rate limit exceeded for sensitive operation',
  skipSuccessfulRequests: false,
});

// DDoS Protection Middleware
export const ddosProtection = (req: Request, res: Response, next: NextFunction) => {
  // Check for suspicious patterns
  const userAgent = req.headers['user-agent'];
  const referer = req.headers['referer'];
  
  // Block requests without user agent
  if (!userAgent) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  // Block known bad user agents
  const badAgents = ['bot', 'crawler', 'spider', 'scraper'];
  if (badAgents.some(agent => userAgent.toLowerCase().includes(agent))) {
    return res.status(403).json({ error: 'Automated access forbidden' });
  }
  
  next();
};

// XSS Protection and Input Sanitization
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Recursively sanitize all string inputs
  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      // Remove any HTML tags and scripts
      return xss(obj, {
        whiteList: {}, // No HTML tags allowed
        stripIgnoreTag: true,
        stripIgnoreTagBody: ['script']
      });
    } else if (Array.isArray(obj)) {
      return obj.map(item => sanitizeObject(item));
    } else if (obj !== null && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = sanitizeObject(obj[key]);
        }
      }
      return sanitized;
    }
    return obj;
  };
  
  // Sanitize body, query, and params
  if (req.body) req.body = sanitizeObject(req.body);
  if (req.query) req.query = sanitizeObject(req.query);
  if (req.params) req.params = sanitizeObject(req.params);
  
  next();
};

// SQL Injection Protection (for any SQL operations)
export const sqlInjectionProtection = (req: Request, res: Response, next: NextFunction) => {
  const suspiciousPatterns = [
    /(\bDROP\b|\bDELETE\b|\bINSERT\b|\bUPDATE\b|\bSELECT\b)/gi,
    /(-{2}|\/\*|\*\/)/g, // SQL comments
    /(\bOR\b|\bAND\b)\s+\d+\s*=\s*\d+/gi, // OR 1=1 patterns
    /['";\\]/g // Dangerous characters
  ];
  
  const checkForInjection = (str: string): boolean => {
    return suspiciousPatterns.some(pattern => pattern.test(str));
  };
  
  const validateObject = (obj: any): boolean => {
    if (typeof obj === 'string') {
      return !checkForInjection(obj);
    } else if (Array.isArray(obj)) {
      return obj.every(item => validateObject(item));
    } else if (obj !== null && typeof obj === 'object') {
      return Object.values(obj).every(value => validateObject(value));
    }
    return true;
  };
  
  // Check all inputs
  const inputs = [req.body, req.query, req.params];
  for (const input of inputs) {
    if (input && !validateObject(input)) {
      return res.status(400).json({ 
        error: 'Invalid input detected',
        message: 'Your request contains potentially harmful content'
      });
    }
  }
  
  next();
};

// CSRF Protection Token Generation
export const generateCSRFToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// CSRF Validation Middleware
export const validateCSRFToken = (req: Request, res: Response, next: NextFunction) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  const token = req.headers['x-csrf-token'] || req.body._csrf;
  const sessionToken = (req as any).session?.csrfToken;
  
  if (!token || !sessionToken || token !== sessionToken) {
    return res.status(403).json({ 
      error: 'Invalid CSRF token',
      message: 'Security validation failed'
    });
  }
  
  next();
};

// Content Security Policy
export const contentSecurityPolicy = helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
    styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    fontSrc: ["'self'", 'https://fonts.gstatic.com'],
    imgSrc: ["'self'", 'data:', 'https:'],
    connectSrc: ["'self'", 'wss:', 'https:'],
    frameSrc: ["'none'"],
    objectSrc: ["'none'"],
    upgradeInsecureRequests: []
  }
});

// Security Headers Middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Strict Transport Security
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy
  res.setHeader('Permissions-Policy', 'geolocation=(self), microphone=(), camera=()');
  
  next();
};

// IP Blocking Middleware
const blockedIPs = new Set<string>();
const ipAttempts = new Map<string, number>();

export const ipBlocking = (req: Request, res: Response, next: NextFunction) => {
  const clientIP = req.ip || req.connection.remoteAddress || '';
  
  // Check if IP is blocked
  if (blockedIPs.has(clientIP)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  // Track failed attempts
  if (res.statusCode >= 400) {
    const attempts = ipAttempts.get(clientIP) || 0;
    ipAttempts.set(clientIP, attempts + 1);
    
    // Block IP after 10 failed attempts
    if (attempts >= 10) {
      blockedIPs.add(clientIP);
      console.warn(`IP ${clientIP} has been blocked due to suspicious activity`);
    }
  }
  
  next();
};

// Request Size Limiting
export const requestSizeLimit = (req: Request, res: Response, next: NextFunction) => {
  const contentLength = parseInt(req.headers['content-length'] || '0');
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (contentLength > maxSize) {
    return res.status(413).json({ 
      error: 'Payload too large',
      message: 'Request size exceeds maximum allowed limit'
    });
  }
  
  next();
};

// Combined Security Middleware
export const applySecurity = [
  securityHeaders,
  contentSecurityPolicy,
  ddosProtection,
  requestSizeLimit,
  mongoSanitize(),
  sanitizeInput,
  sqlInjectionProtection
];
