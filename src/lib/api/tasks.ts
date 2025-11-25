import { getApiUrl, getHeaders } from './config';
import { encryptAES, decryptAES } from '@/lib/utils/aes';
import { useSessionStore } from '@/store/sessionStore';
import { handleApiError, type ApiErrorResponse } from '@/lib/utils/api-error-handler';
import type { Task, Folder } from '@/types/schema';

export interface CreateTaskRequest {
  title: string;
  priority: string;
  subtasks: Array<{
    name: string;
    description: string;
    completed: boolean;
  }>;
}

export interface UpdateTaskRequest {
  title?: string;
  priority?: string;
  subtasks?: Array<{
    name: string;
    description: string;
    completed: boolean;
  }>;
}

export interface FetchTasksResponse {
  status: number;
  tasks: Task[];
  error?: string;
}

// Fetch all tasks
export async function fetchTasks(): Promise<FetchTasksResponse> {
  const response = await fetch(getApiUrl('tasks'), {
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
    throw new Error('Failed to fetch tasks');
  }

  const data = await response.json();
  const secretKey = useSessionStore.getState().secretKey;
  
  // Map backend task structure to frontend format and decrypt
  if (data.tasks) {
    data.tasks = data.tasks.map((task: any) => {
      // Decrypt task data
      let title = task.title || '';
      let priority = task.priority || '';
      let subtasks = task.subtasks || [];
      
      if (secretKey) {
        try {
          title = decryptAES(title, secretKey);
          priority = decryptAES(priority, secretKey);
          subtasks = subtasks.map((st: any) => ({
            ...st,
            name: decryptAES(st.name, secretKey),
            description: decryptAES(st.description, secretKey),
          }));
        } catch (error) {
          console.error('Decryption error:', error);
        }
      }
      
      // Determine status based on subtasks completion
      let status = 'pending';
      if (subtasks && subtasks.length > 0) {
        const completedCount = subtasks.filter((st: any) => st.completed).length;
        if (completedCount === subtasks.length) {
          status = 'completed';
        } else if (completedCount > 0) {
          status = 'in_progress';
        }
      }
      
      // Create description from subtasks
      const description = subtasks && subtasks.length > 0
        ? subtasks.map((st: any) => st.name).join(', ')
        : null;

      return {
        ...task,
        id: task._id || task.id,
        userId: task.user || task.userId,
        title,
        priority,
        status,
        description,
        folderId: null, // Backend doesn't have folderId in Task model
        dueDate: null,
        createdAt: task.createdDate || task.createdAt,
        updatedAt: task.createdDate || task.updatedAt,
        subtasks: subtasks, // Keep subtasks for editing
        _id: undefined,
        user: undefined,
        createdDate: undefined,
      } as any;
    });
  }

  return data;
}

// Add a new task
export async function addTask(data: CreateTaskRequest): Promise<{ status: number; msg: string; task: Task }> {
  const secretKey = useSessionStore.getState().secretKey;
  
  // Convert frontend task format to backend format and encrypt
  // Backend expects: { title, priority, subtasks: [{ name, description, completed }] }
  let backendData: any = {
    title: data.title,
    priority: data.priority,
    subtasks: data.subtasks.length > 0 
      ? data.subtasks 
      : [{ name: data.title, description: '', completed: false }],
  };
  
  // Encrypt data before sending
  if (secretKey) {
    backendData = {
      title: encryptAES(data.title, secretKey),
      priority: encryptAES(data.priority, secretKey),
      subtasks: backendData.subtasks.map((st: any) => ({
        ...st,
        name: encryptAES(st.name, secretKey),
        description: encryptAES(st.description || '', secretKey),
      })),
    };
  }

  const response = await fetch(getApiUrl('tasks/addTask'), {
    method: 'POST',
    headers: getHeaders(),
    credentials: 'include',
    body: JSON.stringify({ data: backendData }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      const error: ApiErrorResponse = await response.json();
      if (handleApiError(response, error)) {
        throw new Error('Session expired');
      }
    }
    const error = await response.json();
    throw new Error(error.errors?.[0]?.msg || error.error || 'Failed to add task');
  }

  return await response.json();
}

// Update an existing task
export async function updateTask(id: string, data: UpdateTaskRequest): Promise<{ status: number; msg: string }> {
  const secretKey = useSessionStore.getState().secretKey;
  
  // Convert frontend format to backend format and encrypt
  // Backend expects: { title, priority, subtasks }
  const backendData: any = {};
  if (data.title !== undefined) {
    backendData.title = secretKey ? encryptAES(data.title, secretKey) : data.title;
  }
  if (data.priority !== undefined) {
    backendData.priority = secretKey ? encryptAES(data.priority, secretKey) : data.priority;
  }
  if (data.subtasks !== undefined) {
    backendData.subtasks = secretKey
      ? data.subtasks.map((st: any) => ({
          ...st,
          name: encryptAES(st.name, secretKey),
          description: encryptAES(st.description || '', secretKey),
        }))
      : data.subtasks;
  } else if (data.status !== undefined) {
    // If status is provided, we need to update subtasks completion
    // This is a simplified approach - in a real app you'd fetch the task first
    // For now, we'll just pass the status as-is and let the backend handle it
    backendData.status = data.status;
  }

  const response = await fetch(getApiUrl(`tasks/updatetask/${id}`), {
    method: 'PUT',
    headers: getHeaders(),
    credentials: 'include',
    body: JSON.stringify({ data: backendData }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      const error: ApiErrorResponse = await response.json();
      if (handleApiError(response, error)) {
        throw new Error('Session expired');
      }
    }
    const error = await response.json();
    throw new Error(error.error || 'Failed to update task');
  }

  return await response.json();
}

// Delete a task
export async function deleteTask(id: string): Promise<{ status: number; msg: string }> {
  const response = await fetch(getApiUrl(`tasks/deletetask/${id}`), {
    method: 'DELETE',
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
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete task');
  }

  return await response.json();
}

