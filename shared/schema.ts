import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
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
  categoryId: integer("category_id").notNull(),
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

// Extra validation schemas
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginData = z.infer<typeof loginSchema>;
