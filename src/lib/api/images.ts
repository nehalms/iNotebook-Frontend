import { getApiUrl } from './config';
import { handleApiError, type ApiErrorResponse } from '@/lib/utils/api-error-handler';

// Enhance image
export async function enhanceImage(file: File, brightness: number, contrast: number): Promise<{ success: boolean; data?: { url: string }; error?: string; msg?: string }> {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('brightness', brightness.toString());
  formData.append('contrast', contrast.toString());

  const response = await fetch(getApiUrl('image/enhance'), {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  if (!response.ok) {
    if (response.status === 401) {
      const error: ApiErrorResponse = await response.json();
      if (handleApiError(response, error)) {
        throw new Error('Session expired');
      }
    }
  }
  const json = await response.json();
  if (json.error) {
    throw new Error(json.error);
  }
  return json;
}

// Round corners
export async function roundCorners(file: File, radius: number): Promise<{ success: boolean; data?: { url: string }; error?: string; msg?: string }> {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('radius', radius.toString());

  const response = await fetch(getApiUrl(`image/roundcorners?setMax=false&tl=${radius}&tr=${radius}&bl=${radius}&br=${radius}`), {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  if (!response.ok) {
    if (response.status === 401) {
      const error: ApiErrorResponse = await response.json();
      if (handleApiError(response, error)) {
        throw new Error('Session expired');
      }
    }
  }
  const json = await response.json();
  if (json.error) {
    throw new Error(json.error);
  }
  return json;
}

// Rotate image
export async function rotateImage(file: File, angle: number): Promise<{ success: boolean; data?: { url: string }; error?: string; msg?: string }> {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(getApiUrl(`image/rotate?angle=${angle}&hflip=false&vflip=false`), {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  if (!response.ok) {
    if (response.status === 401) {
      const error: ApiErrorResponse = await response.json();
      if (handleApiError(response, error)) {
        throw new Error('Session expired');
      }
    }
  }
  const json = await response.json();
  if (json.error) {
    throw new Error(json.error);
  }
  return json;
}

// Sharpen image
export async function sharpenImage(file: File, amount: number): Promise<{ success: boolean; data?: { url: string }; error?: string; msg?: string }> {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(getApiUrl(`image/sharpen?value=${amount}`), {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  if (!response.ok) {
    if (response.status === 401) {
      const error: ApiErrorResponse = await response.json();
      if (handleApiError(response, error)) {
        throw new Error('Session expired');
      }
    }
  }
  const json = await response.json();
  if (json.error) {
    throw new Error(json.error);
  }
  return json;
}

// Generative background
export async function generativeBackground(file: File, prompt: string): Promise<{ success: boolean; data?: { url: string }; error?: string; msg?: string }> {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('prompt', prompt);

  const response = await fetch(getApiUrl(`image/gen-bgr-rep?prompt=${encodeURIComponent(prompt)}`), {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  if (!response.ok) {
    if (response.status === 401) {
      const error: ApiErrorResponse = await response.json();
      if (handleApiError(response, error)) {
        throw new Error('Session expired');
      }
    }
  }
  const json = await response.json();
  if (json.error) {
    throw new Error(json.error);
  }
  return json;
}

