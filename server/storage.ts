import { 
  users, User, InsertUser, 
  categories, Category, InsertCategory,
  sounds, Sound, InsertSound,
  broadcastMessages, BroadcastMessage, InsertBroadcastMessage
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { hashPassword } from "./auth";

const MemoryStore = createMemoryStore(session);

// Define storage interface
export interface IStorage {
  // Session store
  sessionStore: session.Store;

  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getUsers(): Promise<User[]>;

  // Category operations
  getCategory(id: number): Promise<Category | undefined>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  getCategories(): Promise<Category[]>;

  // Sound operations
  getSound(id: number): Promise<Sound | undefined>;
  createSound(sound: InsertSound): Promise<Sound>;
  updateSound(id: number, sound: Partial<InsertSound>): Promise<Sound | undefined>;
  deleteSound(id: number): Promise<boolean>;
  getSounds(): Promise<Sound[]>;
  getSoundsByCategory(categoryId: number): Promise<Sound[]>;
  getSoundsByAccessLevel(accessLevel: string): Promise<Sound[]>;
  
  // Broadcast message operations
  getBroadcastMessage(id: number): Promise<BroadcastMessage | undefined>;
  createBroadcastMessage(message: InsertBroadcastMessage): Promise<BroadcastMessage>;
  deleteBroadcastMessage(id: number): Promise<boolean>;
  getBroadcastMessages(): Promise<BroadcastMessage[]>;
  markBroadcastMessageAsRead(messageId: number, userId: number): Promise<BroadcastMessage | undefined>;
  getUnreadBroadcastMessages(userId: number): Promise<BroadcastMessage[]>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private categories: Map<number, Category>;
  private sounds: Map<number, Sound>;
  private broadcastMessages: Map<number, BroadcastMessage>;
  sessionStore: session.Store;
  
  private userIdCounter: number;
  private categoryIdCounter: number;
  private soundIdCounter: number;
  private broadcastMessageIdCounter: number;

  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.sounds = new Map();
    this.broadcastMessages = new Map();
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // Prune expired entries every 24h
    });
    
    this.userIdCounter = 1;
    this.categoryIdCounter = 1;
    this.soundIdCounter = 1;
    this.broadcastMessageIdCounter = 1;
    
    // Initialize with admin account
    this.initializeData();
  }
  
  private async initializeData() {
    try {
      await this.seedInitialData();
    } catch (error) {
      console.error("Failed to initialize data:", error);
    }
  }

  private async seedInitialData() {
    // Create admin user with hashed password
    const hashedPassword = await hashPassword("admin123");
    this.createUser({
      username: "admin",
      password: hashedPassword,
      fullName: "Administrator",
      role: "admin",
      accessLevel: "full"
    });

    // Create default categories
    const categories = [
      { name: "Sound Effects", slug: "effects" },
      { name: "Music", slug: "music" },
      { name: "Voices", slug: "voices" }
    ];
    
    categories.forEach(category => {
      this.createCategory(category);
    });
  }

  // User CRUD operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    // Ensure role and accessLevel have default values
    const user: User = { 
      ...insertUser, 
      id,
      role: insertUser.role || "user",
      accessLevel: insertUser.accessLevel || "basic" 
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }
  
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Category CRUD operations
  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }
  
  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    return Array.from(this.categories.values()).find(
      (category) => category.slug === slug
    );
  }
  
  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.categoryIdCounter++;
    const category: Category = { ...insertCategory, id };
    this.categories.set(id, category);
    return category;
  }
  
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  // Sound CRUD operations
  async getSound(id: number): Promise<Sound | undefined> {
    return this.sounds.get(id);
  }
  
  async createSound(insertSound: InsertSound): Promise<Sound> {
    const id = this.soundIdCounter++;
    const sound: Sound = { 
      ...insertSound, 
      id,
      accessLevel: insertSound.accessLevel || "all"
    };
    this.sounds.set(id, sound);
    return sound;
  }
  
  async updateSound(id: number, soundData: Partial<InsertSound>): Promise<Sound | undefined> {
    const sound = await this.getSound(id);
    if (!sound) return undefined;
    
    const updatedSound = { ...sound, ...soundData };
    this.sounds.set(id, updatedSound);
    return updatedSound;
  }
  
  async deleteSound(id: number): Promise<boolean> {
    return this.sounds.delete(id);
  }
  
  async getSounds(): Promise<Sound[]> {
    return Array.from(this.sounds.values());
  }
  
  async getSoundsByCategory(categoryId: number): Promise<Sound[]> {
    return Array.from(this.sounds.values()).filter(
      (sound) => sound.categoryId === categoryId
    );
  }
  
  async getSoundsByAccessLevel(accessLevel: string): Promise<Sound[]> {
    return Array.from(this.sounds.values()).filter((sound) => {
      if (accessLevel === "admin") {
        return true; // Admin can access all sounds
      } else if (accessLevel === "limited") {
        return sound.accessLevel === "all" || sound.accessLevel === "limited";
      } else {
        return sound.accessLevel === "all";
      }
    });
  }

  // Broadcast message operations
  async getBroadcastMessage(id: number): Promise<BroadcastMessage | undefined> {
    return this.broadcastMessages.get(id);
  }
  
  async createBroadcastMessage(insertMessage: InsertBroadcastMessage): Promise<BroadcastMessage> {
    const id = this.broadcastMessageIdCounter++;
    const timestamp = new Date();
    
    // Ensure priority has a default value if not provided
    const message: BroadcastMessage = { 
      ...insertMessage, 
      id, 
      createdAt: timestamp,
      priority: insertMessage.priority || "normal",
      expiresAt: insertMessage.expiresAt || null,
      hasBeenRead: []
    };
    
    this.broadcastMessages.set(id, message);
    return message;
  }
  
  async deleteBroadcastMessage(id: number): Promise<boolean> {
    return this.broadcastMessages.delete(id);
  }
  
  async getBroadcastMessages(): Promise<BroadcastMessage[]> {
    return Array.from(this.broadcastMessages.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  async markBroadcastMessageAsRead(messageId: number, userId: number): Promise<BroadcastMessage | undefined> {
    const message = await this.getBroadcastMessage(messageId);
    if (!message) return undefined;
    
    // Check if the user has already read this message
    const hasBeenRead = Array.isArray(message.hasBeenRead) ? message.hasBeenRead : [];
    
    if (!hasBeenRead.includes(userId)) {
      const updatedMessage = { 
        ...message, 
        hasBeenRead: [...hasBeenRead, userId] 
      };
      this.broadcastMessages.set(messageId, updatedMessage);
      return updatedMessage;
    }
    
    return message;
  }
  
  async getUnreadBroadcastMessages(userId: number): Promise<BroadcastMessage[]> {
    return (await this.getBroadcastMessages())
      .filter(message => {
        const hasBeenRead = Array.isArray(message.hasBeenRead) ? message.hasBeenRead : [];
        return !hasBeenRead.includes(userId);
      });
  }
}

export const storage = new MemStorage();
