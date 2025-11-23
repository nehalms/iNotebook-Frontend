import { getApiUrl } from './config';
import { handleApiError, type ApiErrorResponse } from '@/lib/utils/api-error-handler';

export interface EncryptMessageRequest {
  secretMsg: string;
  coverMsg: string;
  password: string;
}

export interface EncryptMessageResponse {
  success: boolean;
  msg: string;
}

export interface DecryptMessageRequest {
  msg: string;
  password: string;
}

export interface DecryptMessageResponse {
  success: boolean;
  msg: string;
}

// Encrypt a message
export async function encryptMessage(data: EncryptMessageRequest): Promise<EncryptMessageResponse> {
  const response = await fetch(getApiUrl('msg/encrypt'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    if (response.status === 401) {
      const error: ApiErrorResponse = await response.json();
      if (handleApiError(response, error)) {
        throw new Error('Session expired');
      }
    }
    throw new Error('Failed to encrypt message');
  }

  return await response.json();
}

// Decrypt a message
export async function decryptMessage(data: DecryptMessageRequest): Promise<DecryptMessageResponse> {
  const response = await fetch(getApiUrl('msg/decrypt'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    if (response.status === 401) {
      const error: ApiErrorResponse = await response.json();
      if (handleApiError(response, error)) {
        throw new Error('Session expired');
      }
    }
    throw new Error('Failed to decrypt message');
  }

  return await response.json();
}

