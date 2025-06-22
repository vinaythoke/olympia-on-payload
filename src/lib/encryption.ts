import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-secret-key';

if (process.env.NODE_ENV === 'production' && ENCRYPTION_KEY === 'default-secret-key') {
  console.warn('Warning: Using default encryption key in production. Please set a strong ENCRYPTION_KEY environment variable.');
}

export const encrypt = (text: string): string => {
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
};

export const decrypt = (ciphertext: string): string => {
  const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}; 