import { pgTable, text, serial, integer, boolean, jsonb, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model with role information
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("user"),
  accessLevel: text("access_level").notNull().default("basic"),
  // possible values: "basic", "limited", "full"
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

// Sound category model
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
});

// Sound model
export const sounds = pgTable("sounds", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  filename: text("filename").notNull(),
  duration: text("duration").notNull(),
  categoryId: integer("category_id").default(1), // Default to category 1 if not specified
  accessLevel: text("access_level").notNull().default("all"),
  // possible values: "all", "limited", "admin"
});

export const insertSoundSchema = createInsertSchema(sounds).omit({
  id: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Sound = typeof sounds.$inferSelect;
export type InsertSound = z.infer<typeof insertSoundSchema>;

// Broadcast message model
export const broadcastMessages = pgTable("broadcast_messages", {
  id: serial("id").primaryKey(),
  message: text("message").notNull(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: integer("created_by").notNull(), // User ID who created the message
  priority: text("priority").notNull().default("normal"), // "low", "normal", "high", "urgent"
  expiresAt: timestamp("expires_at"), // Optional: when the message expires
  hasBeenRead: jsonb("has_been_read").default("[]").notNull(), // Array of user IDs who've read the message
});

export const insertBroadcastMessageSchema = createInsertSchema(broadcastMessages).omit({
  id: true,
  createdAt: true,
  hasBeenRead: true,
});

export type BroadcastMessage = typeof broadcastMessages.$inferSelect;
export type InsertBroadcastMessage = z.infer<typeof insertBroadcastMessageSchema>;

// Chat message model
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  userId: integer("user_id").notNull(), // User ID who sent the message
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  isDeleted: boolean("is_deleted").default(false).notNull(),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  timestamp: true,
  isDeleted: true,
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

// Extra validation schemas
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginData = z.infer<typeof loginSchema>;

// Game data models
export const cookieClickerData = pgTable("cookie_clicker_data", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // User ID who owns this game data
  cookies: real("cookies").notNull().default(0),
  clickPower: integer("click_power").notNull().default(1),
  autoClickers: integer("auto_clickers").notNull().default(0),
  grandmas: integer("grandmas").notNull().default(0),
  factories: integer("factories").notNull().default(0),
  background: text("background").notNull().default("none"),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

export const insertCookieClickerDataSchema = createInsertSchema(cookieClickerData).omit({
  id: true,
  lastUpdated: true,
});

export type CookieClickerData = typeof cookieClickerData.$inferSelect;
export type InsertCookieClickerData = z.infer<typeof insertCookieClickerDataSchema>;

// General game data model to track various game states and achievements
export const gameData = pgTable("game_data", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  gameType: text("game_type").notNull(), // e.g., "cookie_clicker", "snake", etc.
  data: jsonb("data").notNull(), // Flexible JSON data for different game types
  highScore: integer("high_score"), // Optional high score field
  lastPlayed: timestamp("last_played").defaultNow().notNull(),
});

export const insertGameDataSchema = createInsertSchema(gameData).omit({
  id: true,
  lastPlayed: true,
});

export type GameData = typeof gameData.$inferSelect;
export type InsertGameData = z.infer<typeof insertGameDataSchema>;

// Terms and Conditions acceptance log
export const termsAcceptanceLogs = pgTable("terms_acceptance_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  username: text("username").notNull(),
  acceptanceTime: timestamp("acceptance_time").defaultNow().notNull(),
  version: text("version").notNull(),
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
});

export const insertTermsAcceptanceLogSchema = createInsertSchema(termsAcceptanceLogs).omit({
  id: true,
  acceptanceTime: true,
});

export type TermsAcceptanceLog = typeof termsAcceptanceLogs.$inferSelect;
export type InsertTermsAcceptanceLog = z.infer<typeof insertTermsAcceptanceLogSchema>;
