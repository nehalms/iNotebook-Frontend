import { getApiUrl } from './config';
import { encryptMessage } from '@/lib/utils/encryption';

export interface SendEmailRequest {
  email: string | string[];
  cc?: string[];
  subject: string;
  text?: string;
}

export interface SendEmailResponse {
  success: boolean;
  data?: any;
}

export interface VerifyOtpRequest {
  email: string;
  code: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  verified: boolean;
  msg?: string;
  status?: number;
}

// Send OTP email
export async function sendOtpEmail(data: SendEmailRequest, toAdmin: boolean = false): Promise<SendEmailResponse> {
  const response = await fetch(getApiUrl(`mail/send${toAdmin ? '?toAdmin=true' : ''}`), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to send email');
  }

  return await response.json();
}

// Verify OTP
export async function verifyOtp(data: VerifyOtpRequest): Promise<VerifyOtpResponse> {
  // Encrypt email and code before sending
  const encryptedEmail = await encryptMessage(data.email);
  const encryptedCode = await encryptMessage(data.code.toString());

  const response = await fetch(getApiUrl('mail/verify'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      email: encryptedEmail,
      code: encryptedCode,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to verify OTP');
  }

  return await response.json();
}

