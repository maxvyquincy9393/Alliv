/**
 * Environment Configuration & Validation
 * 
 * Validates all required environment variables at startup.
 * App will fail fast with helpful error messages if config is invalid.
 */

interface EnvConfig {
  apiUrl: string;
  socketUrl: string;
  googleMapsApiKey: string;
  sentryDsn?: string;
  nodeEnv: string;
}

function validateEnv(): EnvConfig {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required variables
  const apiUrl = import.meta.env.VITE_API_URL;
  const socketUrl = import.meta.env.VITE_SOCKET_URL;
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  
  // Optional variables
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
  const nodeEnv = import.meta.env.MODE || 'development';

  // Validate required variables
  if (!apiUrl) {
    errors.push('VITE_API_URL is required');
  }
  if (!socketUrl) {
    errors.push('VITE_SOCKET_URL is required');
  }

  // Warn about missing optional variables
  if (!googleMapsApiKey) {
    warnings.push('VITE_GOOGLE_MAPS_API_KEY not set - map features will be disabled');
  }

  // Validate URL formats
  if (apiUrl) {
    try {
      const url = new URL(apiUrl);
      if (!url.protocol.startsWith('http')) {
        errors.push('VITE_API_URL must use http or https protocol');
      }
    } catch {
      errors.push('VITE_API_URL has invalid URL format');
    }
  }

  if (socketUrl) {
    try {
      const url = new URL(socketUrl);
      if (!url.protocol.startsWith('http') && !url.protocol.startsWith('ws')) {
        errors.push('VITE_SOCKET_URL must use http, https, ws, or wss protocol');
      }
    } catch {
      errors.push('VITE_SOCKET_URL has invalid URL format');
    }
  }

  // Production-specific validations
  if (nodeEnv === 'production') {
    if (apiUrl?.includes('localhost')) {
      errors.push('VITE_API_URL cannot use localhost in production');
    }
    if (socketUrl?.includes('localhost')) {
      errors.push('VITE_SOCKET_URL cannot use localhost in production');
    }
  }

  // Display warnings
  if (warnings.length > 0) {
    console.warn('\n⚠️  Configuration Warnings:');
    warnings.forEach(warning => console.warn(`  - ${warning}`));
  }

  // Fail if there are errors
  if (errors.length > 0) {
    console.error('\n❌ Configuration Error: Invalid environment variables\n');
    console.error('📋 Issues found:');
    errors.forEach(error => console.error(`  - ${error}`));
    console.error('\n💡 Create a .env file in the frontend/ directory with:');
    console.error('  VITE_API_URL=http://localhost:8080');
    console.error('  VITE_SOCKET_URL=http://localhost:8080');
    console.error('  VITE_GOOGLE_MAPS_API_KEY=your_api_key_here');
    throw new Error('Invalid environment configuration');
  }

  return {
    apiUrl: apiUrl!,
    socketUrl: socketUrl!,
    googleMapsApiKey: googleMapsApiKey || '',
    sentryDsn,
    nodeEnv
  };
}

// Validate and export configuration
export const config = validateEnv();

// Log successful validation
console.log('✅ Environment configuration validated');
if (config.nodeEnv === 'development') {
  console.log(`   API URL: ${config.apiUrl}`);
  console.log(`   Socket URL: ${config.socketUrl}`);
  console.log(`   Environment: ${config.nodeEnv}`);
}
