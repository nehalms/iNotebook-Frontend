import { getApiUrl } from './config';

export interface SecretKeyResponse {
  status: string;
  secretKey: string;
}

export async function getSecretKey(): Promise<string> {
  const response = await fetch(getApiUrl('aes/secretKey'), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch secret key');
  }

  const data: SecretKeyResponse = await response.json();
  
  if (data.status === 'success') {
    let decryptKey = '';
    Array.from(data.secretKey).forEach((char) => {
      decryptKey += String.fromCharCode(char.charCodeAt(0) / 541);
    });
    return decryptKey;
  }

  throw new Error('Failed to get secret key');
}

