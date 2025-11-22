import {
  type User,
  type InsertUser,
  type Note,
  type InsertNote,
  type Folder,
  type InsertFolder,
  type Task,
  type InsertTask,
  type GameDetail,
  type InsertGameDetail,
  type Message,
  type InsertMessage,
  type LoginHistory,
  type InsertLoginHistory,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;

  // Notes
  getNote(id: string): Promise<Note | undefined>;
  getNotesByUser(userId: string): Promise<Note[]>;
  createNote(note: InsertNote): Promise<Note>;
  updateNote(id: string, note: Partial<InsertNote>): Promise<Note | undefined>;
  deleteNote(id: string): Promise<boolean>;

  // Folders
  getFolder(id: string): Promise<Folder | undefined>;
  getFoldersByUser(userId: string): Promise<Folder[]>;
  createFolder(folder: InsertFolder): Promise<Folder>;
  updateFolder(id: string, folder: Partial<InsertFolder>): Promise<Folder | undefined>;
  deleteFolder(id: string): Promise<boolean>;

  // Tasks
  getTask(id: string): Promise<Task | undefined>;
  getTasksByUser(userId: string): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<boolean>;

  // Games
  getGameDetail(id: string): Promise<GameDetail | undefined>;
  getGamesByUser(userId: string): Promise<GameDetail[]>;
  createGameDetail(game: InsertGameDetail): Promise<GameDetail>;
  getAllGameDetails(): Promise<GameDetail[]>;

  // Messages
  getMessage(id: string): Promise<Message | undefined>;
  getMessagesByUser(userId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  deleteMessage(id: string): Promise<boolean>;

  // Login History
  createLoginHistory(history: InsertLoginHistory): Promise<LoginHistory>;
  getLoginHistoryByUser(userId: string): Promise<LoginHistory[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private notes: Map<string, Note>;
  private folders: Map<string, Folder>;
  private tasks: Map<string, Task>;
  private gameDetails: Map<string, GameDetail>;
  private messages: Map<string, Message>;
  private loginHistory: Map<string, LoginHistory>;

  constructor() {
    this.users = new Map();
    this.notes = new Map();
    this.folders = new Map();
    this.tasks = new Map();
    this.gameDetails = new Map();
    this.messages = new Map();
    this.loginHistory = new Map();
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      isAdmin: insertUser.isAdmin || false,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Notes
  async getNote(id: string): Promise<Note | undefined> {
    return this.notes.get(id);
  }

  async getNotesByUser(userId: string): Promise<Note[]> {
    return Array.from(this.notes.values()).filter(
      (note) => note.userId === userId
    );
  }

  async createNote(insertNote: InsertNote): Promise<Note> {
    const id = randomUUID();
    const note: Note = {
      ...insertNote,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.notes.set(id, note);
    return note;
  }

  async updateNote(
    id: string,
    updateData: Partial<InsertNote>
  ): Promise<Note | undefined> {
    const note = this.notes.get(id);
    if (!note) return undefined;

    const updated: Note = {
      ...note,
      ...updateData,
      updatedAt: new Date(),
    };
    this.notes.set(id, updated);
    return updated;
  }

  async deleteNote(id: string): Promise<boolean> {
    return this.notes.delete(id);
  }

  // Folders
  async getFolder(id: string): Promise<Folder | undefined> {
    return this.folders.get(id);
  }

  async getFoldersByUser(userId: string): Promise<Folder[]> {
    return Array.from(this.folders.values()).filter(
      (folder) => folder.userId === userId
    );
  }

  async createFolder(insertFolder: InsertFolder): Promise<Folder> {
    const id = randomUUID();
    const folder: Folder = {
      ...insertFolder,
      id,
      createdAt: new Date(),
    };
    this.folders.set(id, folder);
    return folder;
  }

  async updateFolder(
    id: string,
    updateData: Partial<InsertFolder>
  ): Promise<Folder | undefined> {
    const folder = this.folders.get(id);
    if (!folder) return undefined;

    const updated: Folder = {
      ...folder,
      ...updateData,
    };
    this.folders.set(id, updated);
    return updated;
  }

  async deleteFolder(id: string): Promise<boolean> {
    return this.folders.delete(id);
  }

  // Tasks
  async getTask(id: string): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async getTasksByUser(userId: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (task) => task.userId === userId
    );
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = randomUUID();
    const task: Task = {
      ...insertTask,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(
    id: string,
    updateData: Partial<InsertTask>
  ): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;

    const updated: Task = {
      ...task,
      ...updateData,
      updatedAt: new Date(),
    };
    this.tasks.set(id, updated);
    return updated;
  }

  async deleteTask(id: string): Promise<boolean> {
    return this.tasks.delete(id);
  }

  // Games
  async getGameDetail(id: string): Promise<GameDetail | undefined> {
    return this.gameDetails.get(id);
  }

  async getGamesByUser(userId: string): Promise<GameDetail[]> {
    return Array.from(this.gameDetails.values()).filter(
      (game) => game.userId === userId
    );
  }

  async createGameDetail(insertGame: InsertGameDetail): Promise<GameDetail> {
    const id = randomUUID();
    const game: GameDetail = {
      ...insertGame,
      id,
      playedAt: new Date(),
    };
    this.gameDetails.set(id, game);
    return game;
  }

  async getAllGameDetails(): Promise<GameDetail[]> {
    return Array.from(this.gameDetails.values());
  }

  // Messages
  async getMessage(id: string): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  async getMessagesByUser(userId: string): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(
      (message) => message.userId === userId
    );
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = {
      ...insertMessage,
      id,
      createdAt: new Date(),
    };
    this.messages.set(id, message);
    return message;
  }

  async deleteMessage(id: string): Promise<boolean> {
    return this.messages.delete(id);
  }

  // Login History
  async createLoginHistory(
    insertHistory: InsertLoginHistory
  ): Promise<LoginHistory> {
    const id = randomUUID();
    const history: LoginHistory = {
      ...insertHistory,
      id,
      loginAt: new Date(),
    };
    this.loginHistory.set(id, history);
    return history;
  }

  async getLoginHistoryByUser(userId: string): Promise<LoginHistory[]> {
    return Array.from(this.loginHistory.values()).filter(
      (history) => history.userId === userId
    );
  }
}

export const storage = new MemStorage();
