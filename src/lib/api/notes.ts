import { getApiUrl, getHeaders } from './config';
import { encryptAES, decryptAES } from '@/lib/utils/aes';
import { useSessionStore } from '@/store/sessionStore';
import { handleApiError, type ApiErrorResponse } from '@/lib/utils/api-error-handler';
import type { Note } from '@/types/schema';

export interface CreateNoteRequest {
  title: string;
  description: string;
  tag?: string;
}

export interface UpdateNoteRequest {
  title?: string;
  description?: string;
  tag?: string;
}

// Fetch all notes
export async function fetchAllNotes(): Promise<Note[]> {
  const response = await fetch(getApiUrl('notes/fetchallnotes'), {
    method: 'GET',
    headers: getHeaders(),
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 401) {
      const error: ApiErrorResponse = await response.json();
      if (handleApiError(response, error)) {
        throw new Error('Session expired');
      }
      throw new Error(error.error || 'Security pin not verified');
    }
    throw new Error('Failed to fetch notes');
  }

  const notes = await response.json();
  const secretKey = useSessionStore.getState().secretKey;
  
  // Map backend fields to frontend format and decrypt
  return notes.map((note: any) => {
    let title = note.title || '';
    let description = note.description || '';
    let tag = note.tag || '';
    
    // Decrypt if secret key is available
    if (secretKey) {
      try {
        title = decryptAES(title, secretKey);
        description = decryptAES(description, secretKey);
        tag = decryptAES(tag, secretKey);
      } catch (error) {
        console.error('Decryption error:', error);
      }
    }
    
    return {
      ...note,
      id: note._id || note.id,
      content: description,
      title,
      tag: tag || null,
      userId: note.user || note.userId,
      description: undefined,
      _id: undefined,
      user: undefined,
    };
  });
}

// Add a new note
export async function addNote(data: CreateNoteRequest): Promise<Note> {
  const secretKey = useSessionStore.getState().secretKey;
  
  // Encrypt data before sending
  let encryptedData = { ...data };
  if (secretKey) {
    encryptedData = {
      title: encryptAES(data.title, secretKey),
      description: encryptAES(data.description, secretKey),
      tag: data.tag ? encryptAES(data.tag, secretKey) : '',
    };
  }

  const response = await fetch(getApiUrl('notes/addnote'), {
    method: 'POST',
    headers: getHeaders(),
    credentials: 'include',
    body: JSON.stringify(encryptedData),
  });

  if (!response.ok) {
    if (response.status === 401) {
      const error: ApiErrorResponse = await response.json();
      if (handleApiError(response, error)) {
        throw new Error('Session expired');
      }
    }
    const error = await response.json();
    throw new Error(error.error || 'Failed to add note');
  }

  const note = await response.json();
  // Decrypt response
  if (secretKey) {
    return {
      ...note,
      id: note._id || note.id,
      title: decryptAES(note.title, secretKey),
      content: decryptAES(note.description, secretKey),
      tag: note.tag ? decryptAES(note.tag, secretKey) : null,
    };
  }
  return note;
}

// Update an existing note
export async function updateNote(id: string, data: UpdateNoteRequest): Promise<{ note: Note }> {
  const secretKey = useSessionStore.getState().secretKey;
  
  // Encrypt data before sending
  let encryptedData: any = {};
  if (secretKey) {
    if (data.title) encryptedData.title = encryptAES(data.title, secretKey);
    if (data.description) encryptedData.description = encryptAES(data.description, secretKey);
    if (data.tag !== undefined) encryptedData.tag = data.tag ? encryptAES(data.tag, secretKey) : '';
  } else {
    encryptedData = data;
  }

  const response = await fetch(getApiUrl(`notes/updatenote/${id}`), {
    method: 'PUT',
    headers: getHeaders(),
    credentials: 'include',
    body: JSON.stringify(encryptedData),
  });

  if (!response.ok) {
    if (response.status === 401) {
      const error: ApiErrorResponse = await response.json();
      if (handleApiError(response, error)) {
        throw new Error('Session expired');
      }
    }
    throw new Error('Failed to update note');
  }

  const result = await response.json();
  // Decrypt response
  if (secretKey && result.note) {
    result.note = {
      ...result.note,
      id: result.note._id || result.note.id,
      title: decryptAES(result.note.title, secretKey),
      content: decryptAES(result.note.description, secretKey),
      tag: result.note.tag ? decryptAES(result.note.tag, secretKey) : null,
    };
  }
  return result;
}

// Delete a note
export async function deleteNote(id: string): Promise<{ Success: string; note: Note }> {
  const response = await fetch(getApiUrl(`notes/deletenote/${id}`), {
    method: 'PUT',
    headers: getHeaders(),
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 401) {
      const error: ApiErrorResponse = await response.json();
      if (handleApiError(response, error)) {
        throw new Error('Session expired');
      }
    }
    throw new Error('Failed to delete note');
  }

  return await response.json();
}

// Save note coordinates (for positioning on board)
export async function saveNoteCoordinates(id: string, xPos: number, yPos: number): Promise<{ status: string; msg: string }> {
  const response = await fetch(getApiUrl(`notes/saveCord/${id}/${xPos}/${yPos}`), {
    method: 'POST',
    headers: getHeaders(),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to save coordinates');
  }

  return await response.json();
}

