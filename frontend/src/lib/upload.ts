import imageCompression from 'browser-image-compression';

export interface UploadOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
}

const DEFAULT_OPTIONS: UploadOptions = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1024,
  useWebWorker: true,
};

export async function compressImage(
  file: File,
  options: UploadOptions = {}
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  try {
    const compressedFile = await imageCompression(file, opts);
    return compressedFile;
  } catch (error) {
    console.error('Error compressing image:', error);
    throw error;
  }
}

export async function uploadImage(file: File): Promise<string> {
  // In a real app, upload to Cloudinary/S3/etc
  // For now, return a data URL
  
  try {
    const compressed = await compressImage(file);
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          // Mock: simulate cloud upload delay
          setTimeout(() => {
            resolve(reader.result as string);
          }, 500);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(compressed);
    });
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
}

export function validateImage(file: File): { valid: boolean; error?: string } {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Please upload a JPEG, PNG, or WebP image',
    };
  }
  
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'Image must be less than 10MB',
    };
  }
  
  return { valid: true };
}