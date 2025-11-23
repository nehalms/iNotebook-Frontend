// Type definitions extracted from shared schema for frontend use

export type User = {
  _id: string;
  username: string;
  email: string;
  password: string;
  isAdmin: boolean;
  createdAt: Date | string;
};

export type Note = {
  id: string;
  userId: string;
  title: string;
  content: string;
  isEncrypted: boolean;
  tag: string | null;
  date: Date | string;
};

export type Folder = {
  id: string;
  userId: string;
  name: string;
  parentId: string | null;
  createdAt: Date | string;
};

export type Task = {
  id: string;
  userId: string;
  folderId: string | null;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  subtasks?: Array<{ name: string; description: string; completed: boolean }>;
};

export type GameDetail = {
  id: string;
  userId: string;
  gameName: string;
  score: number;
  result: string;
  playedAt: Date | string;
};

export type Message = {
  id: string;
  userId: string;
  content: string;
  isEncrypted: boolean;
  createdAt: Date | string;
};

export type LoginHistory = {
  id: string;
  userId: string;
  ipAddress: string | null;
  userAgent: string | null;
  loginAt: Date | string;
};

