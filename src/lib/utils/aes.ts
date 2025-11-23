// AES encryption utilities using CryptoJS
import CryptoJS from 'crypto-js';

// Encrypt text using AES
export function encryptAES(text: string, secretKey: string): string {
  if (!text || !secretKey) return text;
  try {
    return CryptoJS.AES.encrypt(text, secretKey).toString();
  } catch (error) {
    console.error('AES encryption failed:', error);
    return text;
  }
}

// Decrypt text using AES
export function decryptAES(encryptedText: string, secretKey: string): string {
  if (!encryptedText || !secretKey) return encryptedText;
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedText, secretKey);
    return bytes.toString(CryptoJS.enc.Utf8) || encryptedText;
  } catch (error) {
    console.error('AES decryption failed:', error);
    return encryptedText;
  }
}

