// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8900/api';

// Socket URLs for real-time features
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://inotebook-gameapi.onrender.com/ws';
export const BOOTSTRAP_URL = import.meta.env.VITE_BOOTSTRAP_URL || 'https://inotebook-gameapi.onrender.com/api';
export const C4_SOCKET_URL = import.meta.env.VITE_C4_SOCKET_URL || 'https://connect4api.onrender.com/ws';
export const C4_BOOTSTRAP_URL = import.meta.env.VITE_C4_BOOTSTRAP_URL || 'https://connect4api.onrender.com/api';

export const getApiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_BASE_URL}/${cleanEndpoint}`;
};

// Get headers with pin verification status
export const getHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  return headers;
};

