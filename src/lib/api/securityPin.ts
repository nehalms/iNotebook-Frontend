import { getApiUrl } from './config';
import { encryptMessage } from '@/lib/utils/encryption';

export interface SetPinResponse {
  status: number;
  msg: string;
  error?: string;
}

export interface VerifyPinResponse {
  status: number;
  msg: string;
  error?: string;
}

export interface DisablePinResponse {
  status: number;
  msg: string;
  error?: string;
}

export interface SendOtpResponse {
  status: number;
  msg: string;
  error?: string;
}

export interface VerifyOtpResponse {
  status: number;
  verified: boolean;
  msg: string;
  error?: string;
}

// Send OTP for enabling security pin
export async function sendEnablePinOtp(): Promise<SendOtpResponse> {
  const response = await fetch(getApiUrl('pin/enable/otp'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to send OTP');
  }

  return data;
}

// Send OTP for disabling security pin
export async function sendDisablePinOtp(): Promise<SendOtpResponse> {
  const response = await fetch(getApiUrl('pin/disable/otp'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to send OTP');
  }

  return data;
}

// Verify OTP for enable/disable
export async function verifyPinOtp(code: string, action: 'enable' | 'disable'): Promise<VerifyOtpResponse> {
  const encryptedCode = await encryptMessage(code);
  const encryptedAction = await encryptMessage(action);

  const response = await fetch(getApiUrl('pin/verify-otp'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ 
      code: encryptedCode, 
      action: encryptedAction 
    }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to verify OTP');
  }

  return data;
}

// Set security pin (after OTP verification)
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

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to set pin');
  }

  return data;
}

// Verify security pin (for login)
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

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to verify pin');
  }

  return data;
}

// Disable security pin (after OTP verification)
export async function disableSecurityPin(): Promise<DisablePinResponse> {
  const response = await fetch(getApiUrl('pin/disable'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to disable pin');
  }

  return data;
}

// Send OTP for forgot security pin
export async function sendForgotPinOtp(): Promise<SendOtpResponse> {
  const response = await fetch(getApiUrl('pin/forgot/otp'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to send OTP');
  }

  return data;
}