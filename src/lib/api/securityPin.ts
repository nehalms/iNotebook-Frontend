import { getApiUrl } from './config';
import { encryptMessage } from '@/lib/utils/encryption';

export interface SetPinRequest {
  pin: string;
}

export interface SetPinResponse {
  status: number;
  msg: string;
  error?: string;
}

export interface VerifyPinRequest {
  pin: string;
}

export interface VerifyPinResponse {
  status: number;
  msg: string;
  error?: string;
}

// Set security pin
export async function setSecurityPin(pin: string): Promise<SetPinResponse> {
  const encryptedPin = await encryptMessage(pin);

  const response = await fetch(getApiUrl('pin/set'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ pin: encryptedPin }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to set pin');
  }

  return await response.json();
}

// Verify security pin
export async function verifySecurityPin(pin: string): Promise<VerifyPinResponse> {
  const encryptedPin = await encryptMessage(pin);

  const response = await fetch(getApiUrl('pin/verify'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ pin: encryptedPin }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to verify pin');
  }

  return await response.json();
}

