import { getApiUrl } from './config';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  isAdminUser?: boolean;
  permissions?: string[];
  isPinSet?: boolean;
  requiresOTP?: boolean;
  message?: string;
  error?: string;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
}

export interface SignupResponse {
  success: boolean;
  permissions?: string[];
  isPinSet?: boolean;
  requiresOTP?: boolean;
  message?: string;
  error?: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  permissions: string[];
}

export interface GetUserResponse {
  status: number;
  user: User;
}

export interface GetStateResponse {
  status: number;
  data: {
    email: string;
    isAdminUser: boolean;
    permissions: string[];
    isPinSet: boolean;
    isPinVerified: boolean;
  };
}

// Login user
export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await fetch(getApiUrl('auth/login'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  const data_response = await response.json();

  // If response has requiresOTP, return it even if status is 400
  if (data_response.requiresOTP) {
    return data_response;
  }

  if (!response.ok) {
    throw new Error(data_response.error || 'Login failed');
  }

  return data_response;
}

// Create new user
export async function signup(data: SignupRequest): Promise<SignupResponse> {
  // Note: Data should already be encrypted before calling this function
  const response = await fetch(getApiUrl('auth/createuser'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  const data_response = await response.json();

  // If response has requiresOTP, return it even if status is 400
  if (data_response.requiresOTP) {
    return data_response;
  }

  if (!response.ok) {
    throw new Error(data_response.error || 'Signup failed');
  }

  return data_response;
}

// Get logged in user details
export async function getUser(): Promise<GetUserResponse> {
  const response = await fetch(getApiUrl('auth/getuser'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to get user');
  }

  return await response.json();
}

// Get user state
export async function getState(): Promise<GetStateResponse> {
  const response = await fetch(getApiUrl('auth/getstate'), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to get state');
  }

  return await response.json();
}

// Logout user
export async function logout(): Promise<{ success: boolean; msg: string }> {
  const response = await fetch(getApiUrl('auth/logout'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Logout failed');
  }

  return await response.json();
}

// Get password reset info
export async function getPassword(email: string): Promise<{ found: boolean; user?: User; error?: string }> {
  // Note: Email should be encrypted before calling this function
  const response = await fetch(getApiUrl('auth/getPassword'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ email }),
  });

  return await response.json();
}

// Update password
export async function updatePassword(id: string, email: string, password: string): Promise<{ success: boolean; user?: User; requiresOTP?: boolean; message?: string; error?: string }> {
  const response = await fetch(getApiUrl('auth/updatePassword'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ id, email, password }),
  });

  const data_response = await response.json();

  // If response has requiresOTP, return it even if status is 400
  if (data_response.requiresOTP) {
    return data_response;
  }

  if (!response.ok) {
    throw new Error(data_response.error || 'Failed to update password');
  }

  return data_response;
}

// Unified OTP send function for login, signup, and forgot-password
export async function sendOtp(
  email: string, 
  type: 'login' | 'signup' | 'forgot-password'
): Promise<{ success: boolean; message?: string; error?: string }> {
  // Note: Email should be encrypted before calling this function
  // Type is passed as path parameter since body is encrypted
  const response = await fetch(getApiUrl(`auth/sendotp/${type}`), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ email }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to send OTP');
  }

  return data;
}

// Unified OTP verify function
export async function verifyOtp(
  email: string,
  code: string
): Promise<{ success: boolean; verified: boolean; message?: string; type?: string; error?: string }> {
  // Note: Email and code should be encrypted before calling this function
  const response = await fetch(getApiUrl('auth/verifyotp'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ email, code }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to verify OTP');
  }

  return data;
}
