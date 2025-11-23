import { getApiUrl } from '@/lib/api/config';

// Get public key from sessionStorage or fetch from backend
export async function getPublicKey(): Promise<string> {
  let publicKey = sessionStorage.getItem('publicKey');
  
  if (!publicKey) {
    try {
      const response = await fetch(getApiUrl('auth/getpubKey'), {
        method: 'GET',
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        publicKey = data.key;
        sessionStorage.setItem('publicKey', publicKey);
      } else {
        throw new Error('Failed to fetch public key');
      }
    } catch (error) {
      console.error('Failed to fetch public key:', error);
      throw new Error('Failed to get encryption key');
    }
  }
  
  return publicKey;
}

// Encrypt message using RSA public key
export async function encryptMessage(message: string): Promise<string> {
  try {
    // Dynamic import to handle Vite compatibility
    const forge = await import('node-forge');
    const forgeModule = forge.default || forge;
    
    const publicKeyPem = await getPublicKey();
    const publicKey = forgeModule.pki.publicKeyFromPem(publicKeyPem);
    
    const encrypted = publicKey.encrypt(message, 'RSA-OAEP', {
      md: forgeModule.md.sha256.create(),
    });
    
    return forgeModule.util.encode64(encrypted);
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Encryption failed');
  }
}

