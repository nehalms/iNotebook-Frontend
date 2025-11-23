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
  };
}

// Login user
export async function login(data: LoginRequest, verified: boolean = false): Promise<LoginResponse> {
  const response = await fetch(getApiUrl(`auth/login${verified ? '?verified=true' : ''}`), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Login failed');
  }

  return await response.json();
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

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Signup failed');
  }

  return await response.json();
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
export async function updatePassword(id: string, email: string, password: string): Promise<{ success: boolean; user: User }> {
  const response = await fetch(getApiUrl('auth/updatePassword'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ id, email, password }),
  });

  if (!response.ok) {
    throw new Error('Failed to update password');
  }

  return await response.json();
}

