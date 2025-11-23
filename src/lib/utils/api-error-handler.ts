import { useSessionStore } from '@/store/sessionStore';

export interface ApiErrorResponse {
  sessionexpired?: boolean;
  error?: string;
  message?: string;
  statusCode?: number;
}

/**
 * Checks if the API response indicates token expiry
 * and handles redirecting to login if needed
 */
export function handleApiError(response: Response, data?: ApiErrorResponse): boolean {
  // Check for 401 status or sessionexpired flag
  if (response.status === 401 || data?.sessionexpired) {
    useSessionStore.getState().logout();
    // Redirect to login
    window.location.href = '/login';
    return true;
  }
  return false;
}

/**
 * Wrapper for fetch that handles token expiry automatically
 */
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
  });

  // If 401, try to parse error response
  if (response.status === 401) {
    try {
      const clonedResponse = response.clone();
      const data: ApiErrorResponse = await clonedResponse.json();
      if (data.sessionexpired) {
        handleApiError(response, data);
        throw new Error('Session expired');
      }
    } catch (e) {
      // If parsing fails, still handle as token expiry
      if (e instanceof Error && e.message === 'Session expired') {
        throw e;
      }
      handleApiError(response);
      throw new Error('Session expired');
    }
  }

  return response;
}

