import { 
  users, User, InsertUser, 
  categories, Category, InsertCategory,
  sounds, Sound, InsertSound,
  broadcastMessages, BroadcastMessage, InsertBroadcastMessage,
  chatMessages, ChatMessage, InsertChatMessage,
  cookieClickerData, CookieClickerData, InsertCookieClickerData,
  gameData, GameData, InsertGameData
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { hashPassword } from "./auth";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MemoryStore = createMemoryStore(session);

// Define data file paths
const DATA_DIR = path.join(__dirname, "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const CATEGORIES_FILE = path.join(DATA_DIR, "categories.json");
const SOUNDS_FILE = path.join(DATA_DIR, "sounds.json");
const MESSAGES_FILE = path.join(DATA_DIR, "messages.json");
const CHAT_MESSAGES_FILE = path.join(DATA_DIR, "chat_messages.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Define storage interface
export interface IStorage {
  // Session store
  sessionStore: session.Store;
  
  // Data persistence
  saveDataToFiles(): void;

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
  
  // Chat message operations
  getChatMessage(id: number): Promise<ChatMessage | undefined>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  deleteChatMessage(id: number): Promise<boolean>;
  getChatMessages(): Promise<ChatMessage[]>;
  softDeleteChatMessage(id: number): Promise<ChatMessage | undefined>;
  
  // Cookie Clicker operations
  getCookieClickerData(userId: number): Promise<CookieClickerData | undefined>;
  createCookieClickerData(data: InsertCookieClickerData): Promise<CookieClickerData>;
  updateCookieClickerData(userId: number, data: Partial<InsertCookieClickerData>): Promise<CookieClickerData | undefined>;
  grantCookies(userId: number, amount: number): Promise<CookieClickerData | undefined>;
  getAllCookieClickerData(): Promise<CookieClickerData[]>;
  
  // General game data operations
  getGameData(userId: number, gameType: string): Promise<GameData | undefined>;
  saveGameData(data: InsertGameData): Promise<GameData>;
  updateGameData(id: number, data: Partial<InsertGameData>): Promise<GameData | undefined>;
  getAllGameData(gameType?: string): Promise<GameData[]>;
  getHighScores(gameType: string, limit?: number): Promise<GameData[]>;
  getLeaderboardWithUserDetails(gameType: string, limit?: number): Promise<any[]>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private categories: Map<number, Category>;
  private sounds: Map<number, Sound>;
  private broadcastMessages: Map<number, BroadcastMessage>;
  private chatMessages: Map<number, ChatMessage>;
  private cookieClickerData: Map<number, CookieClickerData>;
  private gameData: Map<number, GameData>;
  sessionStore: session.Store;
  
  private userIdCounter: number;
  private categoryIdCounter: number;
  private soundIdCounter: number;
  private broadcastMessageIdCounter: number;
  private chatMessageIdCounter: number;
  private cookieClickerIdCounter: number;
  private gameDataIdCounter: number;

  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.sounds = new Map();
    this.broadcastMessages = new Map();
    this.chatMessages = new Map();
    this.cookieClickerData = new Map();
    this.gameData = new Map();
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // Prune expired entries every 24h
    });
    
    this.userIdCounter = 1;
    this.categoryIdCounter = 1;
    this.soundIdCounter = 1;
    this.broadcastMessageIdCounter = 1;
    this.chatMessageIdCounter = 1;
    this.cookieClickerIdCounter = 1;
    this.gameDataIdCounter = 1;
    
    // Initialize with admin account and load saved data
    this.initializeData();
  }
  
  // Save data to files
  saveDataToFiles() {
    try {
      // Save users
      const usersData = JSON.stringify(Array.from(this.users.values()), null, 2);
      fs.writeFileSync(USERS_FILE, usersData);
      
      // Save categories
      const categoriesData = JSON.stringify(Array.from(this.categories.values()), null, 2);
      fs.writeFileSync(CATEGORIES_FILE, categoriesData);
      
      // Save sounds
      const soundsData = JSON.stringify(Array.from(this.sounds.values()), null, 2);
      fs.writeFileSync(SOUNDS_FILE, soundsData);
      
      // Save broadcast messages
      const messagesData = JSON.stringify(Array.from(this.broadcastMessages.values()), null, 2);
      fs.writeFileSync(MESSAGES_FILE, messagesData);
      
      // Save chat messages
      const chatMessagesData = JSON.stringify(Array.from(this.chatMessages.values()), null, 2);
      fs.writeFileSync(CHAT_MESSAGES_FILE, chatMessagesData);
      
    } catch (error) {
      console.error("Error saving data to files:", error);
    }
  }
  
  // Load data from files
  private loadDataFromFiles() {
    try {
      // Load users
      if (fs.existsSync(USERS_FILE)) {
        const usersData = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
        usersData.forEach((user: User) => {
          this.users.set(user.id, user);
          if (user.id >= this.userIdCounter) {
            this.userIdCounter = user.id + 1;
          }
        });
      }
      
      // Load categories
      if (fs.existsSync(CATEGORIES_FILE)) {
        const categoriesData = JSON.parse(fs.readFileSync(CATEGORIES_FILE, 'utf-8'));
        categoriesData.forEach((category: Category) => {
          this.categories.set(category.id, category);
          if (category.id >= this.categoryIdCounter) {
            this.categoryIdCounter = category.id + 1;
          }
        });
      }
      
      // Load sounds
      if (fs.existsSync(SOUNDS_FILE)) {
        const soundsData = JSON.parse(fs.readFileSync(SOUNDS_FILE, 'utf-8'));
        soundsData.forEach((sound: Sound) => {
          this.sounds.set(sound.id, sound);
          if (sound.id >= this.soundIdCounter) {
            this.soundIdCounter = sound.id + 1;
          }
        });
      }
      
      // Load broadcast messages
      if (fs.existsSync(MESSAGES_FILE)) {
        const messagesData = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf-8'));
        messagesData.forEach((message: BroadcastMessage) => {
          this.broadcastMessages.set(message.id, message);
          if (message.id >= this.broadcastMessageIdCounter) {
            this.broadcastMessageIdCounter = message.id + 1;
          }
        });
      }
      
      // Load chat messages
      if (fs.existsSync(CHAT_MESSAGES_FILE)) {
        const chatMessagesData = JSON.parse(fs.readFileSync(CHAT_MESSAGES_FILE, 'utf-8'));
        chatMessagesData.forEach((message: ChatMessage) => {
          this.chatMessages.set(message.id, message);
          if (message.id >= this.chatMessageIdCounter) {
            this.chatMessageIdCounter = message.id + 1;
          }
        });
      }
      
      return true;
    } catch (error) {
      console.error("Error loading data from files:", error);
      return false;
    }
  }
  
  private async initializeData() {
    try {
      // First try to load data from files
      const dataLoaded = this.loadDataFromFiles();
      
      // If no data was loaded, seed with initial data
      if (!dataLoaded || this.users.size === 0) {
        await this.seedInitialData();
      }
    } catch (error) {
      console.error("Failed to initialize data:", error);
    }
  }

  private async seedInitialData() {
    // Create admin user with hashed password
    const hashedPassword = await hashPassword("alarms12");
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
    this.saveDataToFiles(); // Save after modification
    return user;
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    this.saveDataToFiles(); // Save after modification
    return updatedUser;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    const result = this.users.delete(id);
    if (result) {
      this.saveDataToFiles(); // Save after modification
    }
    return result;
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
    this.saveDataToFiles(); // Save after modification
    return category;
  }
  
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }
  
  async deleteCategory(id: number): Promise<boolean> {
    const exists = this.categories.has(id);
    if (exists) {
      this.categories.delete(id);
      this.saveDataToFiles(); // Save after modification
    }
    return exists;
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
    this.saveDataToFiles(); // Save after modification
    return sound;
  }
  
  async updateSound(id: number, soundData: Partial<InsertSound>): Promise<Sound | undefined> {
    const sound = await this.getSound(id);
    if (!sound) return undefined;
    
    const updatedSound = { ...sound, ...soundData };
    this.sounds.set(id, updatedSound);
    this.saveDataToFiles(); // Save after modification
    return updatedSound;
  }
  
  async deleteSound(id: number): Promise<boolean> {
    const result = this.sounds.delete(id);
    if (result) {
      this.saveDataToFiles(); // Save after modification
    }
    return result;
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
    this.saveDataToFiles(); // Save after modification
    return message;
  }
  
  async deleteBroadcastMessage(id: number): Promise<boolean> {
    const result = this.broadcastMessages.delete(id);
    if (result) {
      this.saveDataToFiles(); // Save after modification
    }
    return result;
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
      this.saveDataToFiles(); // Save after modification
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

  // Chat message operations
  async getChatMessage(id: number): Promise<ChatMessage | undefined> {
    return this.chatMessages.get(id);
  }
  
  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = this.chatMessageIdCounter++;
    const timestamp = new Date();
    
    const message: ChatMessage = { 
      ...insertMessage, 
      id, 
      timestamp,
      isDeleted: false
    };
    
    this.chatMessages.set(id, message);
    this.saveDataToFiles(); // Save after modification
    return message;
  }
  
  async deleteChatMessage(id: number): Promise<boolean> {
    const result = this.chatMessages.delete(id);
    if (result) {
      this.saveDataToFiles(); // Save after modification
    }
    return result;
  }
  
  async getChatMessages(): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }
  
  async softDeleteChatMessage(id: number): Promise<ChatMessage | undefined> {
    const message = await this.getChatMessage(id);
    if (!message) return undefined;
    
    const updatedMessage = { ...message, isDeleted: true };
    this.chatMessages.set(id, updatedMessage);
    this.saveDataToFiles(); // Save after modification
    return updatedMessage;
  }
  
  // Cookie Clicker operations
  async getCookieClickerData(userId: number): Promise<CookieClickerData | undefined> {
    // Find by userId, not by id
    return Array.from(this.cookieClickerData.values()).find(
      (data) => data.userId === userId
    );
  }

  async createCookieClickerData(data: InsertCookieClickerData): Promise<CookieClickerData> {
    const id = this.cookieClickerIdCounter++;
    const timestamp = new Date();
    
    const cookieData: CookieClickerData = {
      ...data,
      id,
      cookies: data.cookies || 0,
      clickPower: data.clickPower || 1,
      autoClickers: data.autoClickers || 0,
      grandmas: data.grandmas || 0,
      factories: data.factories || 0,
      background: data.background || "none",
      lastUpdated: timestamp
    };
    
    this.cookieClickerData.set(id, cookieData);
    return cookieData;
  }

  async updateCookieClickerData(userId: number, data: Partial<InsertCookieClickerData>): Promise<CookieClickerData | undefined> {
    const existingData = await this.getCookieClickerData(userId);
    
    if (!existingData) {
      // If no data exists for this user, create it
      if ('userId' in data) {
        return this.createCookieClickerData(data as InsertCookieClickerData);
      }
      return undefined;
    }
    
    const timestamp = new Date();
    const updatedData: CookieClickerData = {
      ...existingData,
      ...data,
      lastUpdated: timestamp
    };
    
    this.cookieClickerData.set(existingData.id, updatedData);
    return updatedData;
  }

  async grantCookies(userId: number, amount: number): Promise<CookieClickerData | undefined> {
    const existingData = await this.getCookieClickerData(userId);
    
    if (!existingData) {
      // If no data exists, create a new entry with the granted cookies
      return this.createCookieClickerData({
        userId,
        cookies: amount,
        clickPower: 1,
        autoClickers: 0,
        grandmas: 0,
        factories: 0,
        background: "none"
      });
    }
    
    const timestamp = new Date();
    const updatedData: CookieClickerData = {
      ...existingData,
      cookies: existingData.cookies + amount,
      lastUpdated: timestamp
    };
    
    this.cookieClickerData.set(existingData.id, updatedData);
    return updatedData;
  }

  async getAllCookieClickerData(): Promise<CookieClickerData[]> {
    return Array.from(this.cookieClickerData.values());
  }

  // General game data operations
  async getGameData(userId: number, gameType: string): Promise<GameData | undefined> {
    return Array.from(this.gameData.values()).find(
      (data) => data.userId === userId && data.gameType === gameType
    );
  }

  async saveGameData(data: InsertGameData): Promise<GameData> {
    const id = this.gameDataIdCounter++;
    const timestamp = new Date();
    
    const gameData: GameData = {
      ...data,
      id,
      lastPlayed: timestamp
    };
    
    this.gameData.set(id, gameData);
    return gameData;
  }

  async updateGameData(id: number, data: Partial<InsertGameData>): Promise<GameData | undefined> {
    const existingData = this.gameData.get(id);
    if (!existingData) return undefined;
    
    const timestamp = new Date();
    const updatedData: GameData = {
      ...existingData,
      ...data,
      lastPlayed: timestamp
    };
    
    this.gameData.set(id, updatedData);
    return updatedData;
  }

  async getAllGameData(gameType?: string): Promise<GameData[]> {
    const allData = Array.from(this.gameData.values());
    
    if (gameType) {
      return allData.filter(data => data.gameType === gameType);
    }
    
    return allData;
  }

  async getHighScores(gameType: string, limit: number = 10): Promise<GameData[]> {
    const gameData = await this.getAllGameData(gameType);
    
    return gameData
      .filter(data => data.highScore !== null && data.highScore !== undefined)
      .sort((a, b) => (b.highScore || 0) - (a.highScore || 0))
      .slice(0, limit);
  }
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    const PostgresSessionStore = connectPg(session);
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
  }

  // Placeholder method required by the interface (not needed for DB storage)
  saveDataToFiles(): void {
    // No-op in database storage
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return !!result;
  }

  async getUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  // Category operations
  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id));
    return category;
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, slug));
    return category;
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db
      .insert(categories)
      .values(insertCategory)
      .returning();
    return category;
  }

  async getCategories(): Promise<Category[]> {
    return db.select().from(categories);
  }
  
  async deleteCategory(id: number): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id));
    return !!result;
  }

  // Sound operations
  async getSound(id: number): Promise<Sound | undefined> {
    const [sound] = await db.select().from(sounds).where(eq(sounds.id, id));
    return sound;
  }

  async createSound(insertSound: InsertSound): Promise<Sound> {
    const [sound] = await db.insert(sounds).values(insertSound).returning();
    return sound;
  }

  async updateSound(id: number, soundData: Partial<InsertSound>): Promise<Sound | undefined> {
    const [updatedSound] = await db
      .update(sounds)
      .set(soundData)
      .where(eq(sounds.id, id))
      .returning();
    return updatedSound;
  }

  async deleteSound(id: number): Promise<boolean> {
    const result = await db.delete(sounds).where(eq(sounds.id, id));
    return !!result;
  }

  async getSounds(): Promise<Sound[]> {
    return db.select().from(sounds);
  }

  async getSoundsByCategory(categoryId: number): Promise<Sound[]> {
    return db
      .select()
      .from(sounds)
      .where(eq(sounds.categoryId, categoryId));
  }

  async getSoundsByAccessLevel(accessLevel: string): Promise<Sound[]> {
    if (accessLevel === "admin") {
      // Admin can access all sounds
      return this.getSounds();
    } else if (accessLevel === "limited") {
      // Limited users can access sounds with "all" or "limited" access level
      return db
        .select()
        .from(sounds)
        .where(eq(sounds.accessLevel, "all"))
        .union(
          db
            .select()
            .from(sounds)
            .where(eq(sounds.accessLevel, "limited"))
        );
    } else {
      // Basic users can only access sounds with "all" access level
      return db
        .select()
        .from(sounds)
        .where(eq(sounds.accessLevel, "all"));
    }
  }

  // Broadcast message operations
  async getBroadcastMessage(id: number): Promise<BroadcastMessage | undefined> {
    const [message] = await db
      .select()
      .from(broadcastMessages)
      .where(eq(broadcastMessages.id, id));
    return message;
  }

  async createBroadcastMessage(insertMessage: InsertBroadcastMessage): Promise<BroadcastMessage> {
    const [message] = await db
      .insert(broadcastMessages)
      .values({
        ...insertMessage,
        hasBeenRead: [] as number[]
      })
      .returning();
    return message;
  }

  async deleteBroadcastMessage(id: number): Promise<boolean> {
    const result = await db
      .delete(broadcastMessages)
      .where(eq(broadcastMessages.id, id));
    return !!result;
  }

  async getBroadcastMessages(): Promise<BroadcastMessage[]> {
    return db
      .select()
      .from(broadcastMessages)
      .orderBy(desc(broadcastMessages.createdAt));
  }

  async markBroadcastMessageAsRead(messageId: number, userId: number): Promise<BroadcastMessage | undefined> {
    const message = await this.getBroadcastMessage(messageId);
    if (!message) return undefined;

    // Check if user has already read this message
    const hasBeenRead = Array.isArray(message.hasBeenRead)
      ? message.hasBeenRead
      : [];

    if (!hasBeenRead.includes(userId)) {
      const updatedReadList = [...hasBeenRead, userId];

      const [updatedMessage] = await db
        .update(broadcastMessages)
        .set({ hasBeenRead: updatedReadList })
        .where(eq(broadcastMessages.id, messageId))
        .returning();

      return updatedMessage;
    }

    return message;
  }

  async getUnreadBroadcastMessages(userId: number): Promise<BroadcastMessage[]> {
    const messages = await this.getBroadcastMessages();
    return messages.filter(message => {
      const hasBeenRead = Array.isArray(message.hasBeenRead)
        ? message.hasBeenRead
        : [];
      return !hasBeenRead.includes(userId);
    });
  }

  // Chat message operations
  async getChatMessage(id: number): Promise<ChatMessage | undefined> {
    const [message] = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.id, id));
    return message;
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db
      .insert(chatMessages)
      .values({
        ...insertMessage,
        isDeleted: false
      })
      .returning();
    return message;
  }

  async deleteChatMessage(id: number): Promise<boolean> {
    const result = await db
      .delete(chatMessages)
      .where(eq(chatMessages.id, id));
    return !!result;
  }

  async getChatMessages(): Promise<ChatMessage[]> {
    return db
      .select()
      .from(chatMessages)
      .orderBy(chatMessages.timestamp);
  }

  async softDeleteChatMessage(id: number): Promise<ChatMessage | undefined> {
    const [updatedMessage] = await db
      .update(chatMessages)
      .set({ isDeleted: true })
      .where(eq(chatMessages.id, id))
      .returning();
    return updatedMessage;
  }

  // Cookie Clicker operations
  async getCookieClickerData(userId: number): Promise<CookieClickerData | undefined> {
    const [data] = await db
      .select()
      .from(cookieClickerData)
      .where(eq(cookieClickerData.userId, userId));
    return data;
  }

  async createCookieClickerData(data: InsertCookieClickerData): Promise<CookieClickerData> {
    const [cookieData] = await db
      .insert(cookieClickerData)
      .values(data)
      .returning();
    return cookieData;
  }

  async updateCookieClickerData(
    userId: number,
    data: Partial<InsertCookieClickerData>
  ): Promise<CookieClickerData | undefined> {
    // First check if data exists
    const existingData = await this.getCookieClickerData(userId);
    
    if (!existingData) {
      // If no data exists and we have userId in the data object, create new entry
      if ('userId' in data) {
        return this.createCookieClickerData(data as InsertCookieClickerData);
      }
      return undefined;
    }
    
    // Update existing data
    const [updatedData] = await db
      .update(cookieClickerData)
      .set({ ...data, lastUpdated: new Date() })
      .where(eq(cookieClickerData.userId, userId))
      .returning();
      
    return updatedData;
  }

  async grantCookies(userId: number, amount: number): Promise<CookieClickerData | undefined> {
    const existingData = await this.getCookieClickerData(userId);
    
    if (!existingData) {
      // If no data exists, create a new entry with the granted cookies
      return this.createCookieClickerData({
        userId,
        cookies: amount,
        clickPower: 1,
        autoClickers: 0,
        grandmas: 0,
        factories: 0,
        background: "none"
      });
    }
    
    // Update existing data
    const [updatedData] = await db
      .update(cookieClickerData)
      .set({
        cookies: existingData.cookies + amount,
        lastUpdated: new Date()
      })
      .where(eq(cookieClickerData.userId, userId))
      .returning();
      
    return updatedData;
  }

  async getAllCookieClickerData(): Promise<CookieClickerData[]> {
    return db.select().from(cookieClickerData);
  }

  // General game data operations
  async getGameData(userId: number, gameType: string): Promise<GameData | undefined> {
    const [data] = await db
      .select()
      .from(gameData)
      .where(
        and(
          eq(gameData.userId, userId),
          eq(gameData.gameType, gameType)
        )
      );
    return data;
  }

  async saveGameData(data: InsertGameData): Promise<GameData> {
    const [gameDataEntry] = await db
      .insert(gameData)
      .values(data)
      .returning();
    return gameDataEntry;
  }

  async updateGameData(id: number, data: Partial<InsertGameData>): Promise<GameData | undefined> {
    const [updatedData] = await db
      .update(gameData)
      .set({ ...data, lastPlayed: new Date() })
      .where(eq(gameData.id, id))
      .returning();
    return updatedData;
  }

  async getAllGameData(gameType?: string): Promise<GameData[]> {
    if (gameType) {
      return db
        .select()
        .from(gameData)
        .where(eq(gameData.gameType, gameType));
    }
    return db.select().from(gameData);
  }

  async getHighScores(gameType: string, limit: number = 10): Promise<GameData[]> {
    return db
      .select()
      .from(gameData)
      .where(eq(gameData.gameType, gameType))
      .orderBy(desc(gameData.highScore))
      .limit(limit);
  }
  
  async getLeaderboardWithUserDetails(gameType: string, limit: number = 10): Promise<any[]> {
    const highScores = await this.getHighScores(gameType, limit);
    
    // Get user details for each score entry
    const leaderboard = await Promise.all(
      highScores.map(async (entry) => {
        const user = await this.getUser(entry.userId);
        return {
          id: entry.id,
          userId: entry.userId,
          username: user?.username || "Unknown",
          fullName: user?.fullName || "Unknown User",
          score: entry.highScore || 0,
          gameType: entry.gameType,
          lastPlayed: entry.lastPlayed
        };
      })
    );
    
    return leaderboard;
  }
}

// Export a Database Storage instance now that we have DB support
export const storage = new DatabaseStorage();
