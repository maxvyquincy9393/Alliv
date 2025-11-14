import DOMPurify from 'dompurify';

export const sanitizeText = (value: string) => {
  if (!value) return '';
  return DOMPurify.sanitize(value, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
};

