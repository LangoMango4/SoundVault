import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAdmin, isAuthenticated, hashPassword, comparePasswords } from "./auth";
import { 
  loginSchema, 
  insertUserSchema, 
  insertCategorySchema, 
  insertSoundSchema,
  insertBroadcastMessageSchema,
  insertChatMessageSchema
} from "@shared/schema";
import passport from "passport";
import multer from "multer";
import path from "path";
import fs from "fs";
import { promisify } from "util";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const unlink = promisify(fs.unlink);

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup auth
  setupAuth(app);
  
  // Simple ping endpoint to check connectivity
  app.get("/api/ping", (req, res) => {
    res.status(200).json({ status: "online" });
  });
  
  // Heartbeat endpoint for 24/7 uptime monitoring
  const startTime = new Date();
  app.get("/api/heartbeat", (req, res) => {
    const uptime = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = uptime % 60;
    
    res.status(200).json({ 
      status: "healthy", 
      uptime: `${days}d ${hours}h ${minutes}m ${seconds}s`,
      startedAt: startTime.toISOString(),
      serverTime: new Date().toISOString(),
      memory: process.memoryUsage()
    });
  });
  
  // Heartbeat POST endpoint for more detailed health checks
  app.post("/api/heartbeat", (req, res) => {
    // Save data to persistent storage whenever heartbeat is received
    storage.saveDataToFiles();
    res.status(200).json({ status: "ok", message: "Data saved successfully" });
  });
  
  // Update admin password to "alarms12" and ensure role is "admin" if the user exists
  const updateAdminPassword = async () => {
    try {
      const admin = await storage.getUserByUsername("admin");
      if (admin) {
        const hashedPassword = await hashPassword("alarms12");
        await storage.updateUser(admin.id, { 
          password: hashedPassword,
          role: "admin",
          accessLevel: "full" 
        });
        console.log("Admin password updated to 'alarms12' and role set to 'admin'");
      }
    } catch (error) {
      console.error("Failed to update admin password:", error);
    }
  };
  
  // Execute the admin password update
  await updateAdminPassword();
  
  // Configure multer for audio file uploads
  const audioStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadDir = path.join(__dirname, 'public', 'sounds');
      // Ensure directory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });
  
  const upload = multer({
    storage: audioStorage,
    fileFilter: function (req, file, cb) {
      // Accept audio files only
      if (!file.originalname.match(/\.(mp3|wav|ogg|m4a)$/)) {
        return cb(new Error('Only audio files are allowed!'), false);
      }
      cb(null, true);
    }
  });

  // Auth routes
  app.post("/api/login", (req, res, next) => {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ message: "Invalid credentials", errors: validation.error.errors });
    }
    
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Invalid credentials" });
      
      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        return res.status(200).json(user);
      });
    })(req, res, next);
  });
  
  app.post("/api/register", isAdmin, async (req, res, next) => {
    try {
      const validation = insertUserSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid user data", errors: validation.error.errors });
      }
      
      const { username, password, ...rest } = req.body;
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Hash password
      const hashedPassword = await hashPassword(password);
      
      // Create user
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        ...rest
      });
      
      const { password: _, ...safeUser } = user;
      return res.status(201).json(safeUser);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });
  
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
  
  // User routes - only accessible by admin
  app.get("/api/users", isAdmin, async (req, res, next) => {
    try {
      const users = await storage.getUsers();
      // Remove passwords from response
      const safeUsers = users.map(({ password, ...user }) => user);
      res.json(safeUsers);
    } catch (error) {
      next(error);
    }
  });
  
  app.put("/api/users/:id", isAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // If password is being updated, hash it
      if (req.body.password) {
        req.body.password = await hashPassword(req.body.password);
      }
      
      const updatedUser = await storage.updateUser(id, req.body);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...safeUser } = updatedUser;
      res.json(safeUser);
    } catch (error) {
      next(error);
    }
  });
  
  app.delete("/api/users/:id", isAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Prevent deleting the admin user
      const user = await storage.getUser(id);
      if (user?.role === "admin") {
        return res.status(403).json({ message: "Cannot delete admin user" });
      }
      
      const success = await storage.deleteUser(id);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });
  
  // Category routes
  app.get("/api/categories", async (req, res, next) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/categories", isAdmin, async (req, res, next) => {
    try {
      const validation = insertCategorySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid category data", errors: validation.error.errors });
      }
      
      const category = await storage.createCategory(req.body);
      res.status(201).json(category);
    } catch (error) {
      next(error);
    }
  });
  
  // Sound routes
  app.get("/api/sounds", isAuthenticated, async (req, res, next) => {
    try {
      let sounds;
      
      // Filter by category if provided
      if (req.query.category) {
        const category = await storage.getCategoryBySlug(req.query.category as string);
        if (category) {
          sounds = await storage.getSoundsByCategory(category.id);
        } else {
          sounds = [];
        }
      } else {
        sounds = await storage.getSounds();
      }
      
      // Filter by user access level
      const accessLevel = req.user?.accessLevel || "basic";
      if (req.user?.role !== "admin") {
        sounds = sounds.filter(sound => {
          if (accessLevel === "full") {
            return sound.accessLevel === "all" || sound.accessLevel === "limited";
          } else {
            return sound.accessLevel === "all";
          }
        });
      }
      
      res.json(sounds);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/sounds", isAdmin, upload.single('file'), async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Sound file is required" });
      }
      
      const soundData = {
        name: req.body.name,
        filename: req.file.filename,
        duration: req.body.duration || "0.0",
        categoryId: parseInt(req.body.categoryId),
        accessLevel: req.body.accessLevel || "all"
      };
      
      const validation = insertSoundSchema.safeParse(soundData);
      if (!validation.success) {
        // Delete uploaded file if validation fails
        if (req.file) {
          await unlink(req.file.path);
        }
        return res.status(400).json({ message: "Invalid sound data", errors: validation.error.errors });
      }
      
      const sound = await storage.createSound(soundData);
      res.status(201).json(sound);
    } catch (error) {
      // Delete uploaded file if error occurs
      if (req.file) {
        await unlink(req.file.path);
      }
      next(error);
    }
  });
  
  app.delete("/api/sounds/:id", isAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid sound ID" });
      }
      
      const sound = await storage.getSound(id);
      if (!sound) {
        return res.status(404).json({ message: "Sound not found" });
      }
      
      // Delete the file
      const filePath = path.join(__dirname, 'public', 'sounds', sound.filename);
      if (fs.existsSync(filePath)) {
        await unlink(filePath);
      }
      
      const success = await storage.deleteSound(id);
      if (!success) {
        return res.status(404).json({ message: "Sound not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });
  
  // Serve sound files
  app.use('/api/sounds/files', isAuthenticated, express.static(path.join(__dirname, 'public', 'sounds')));

  // Broadcast message routes
  app.get("/api/messages", isAuthenticated, async (req, res, next) => {
    try {
      let messages;
      
      // Get unread messages for the current user if the query param is set
      if (req.query.unread === "true" && req.user) {
        messages = await storage.getUnreadBroadcastMessages(req.user.id);
      } else {
        messages = await storage.getBroadcastMessages();
      }
      
      res.json(messages);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/messages", isAdmin, async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const messageData = {
        ...req.body,
        createdBy: req.user.id
      };
      
      const validation = insertBroadcastMessageSchema.safeParse(messageData);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid message data", 
          errors: validation.error.errors 
        });
      }
      
      const message = await storage.createBroadcastMessage(messageData);
      res.status(201).json(message);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/messages/:id/read", isAuthenticated, async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid message ID" });
      }
      
      const message = await storage.markBroadcastMessageAsRead(id, req.user.id);
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }
      
      res.json(message);
    } catch (error) {
      next(error);
    }
  });
  
  app.delete("/api/messages/:id", isAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid message ID" });
      }
      
      const success = await storage.deleteBroadcastMessage(id);
      if (!success) {
        return res.status(404).json({ message: "Message not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // Chat message routes
  app.get("/api/chat", isAuthenticated, async (req, res, next) => {
    try {
      const messages = await storage.getChatMessages();
      
      // Enhance messages with user information
      const enhancedMessages = await Promise.all(
        messages.map(async (message) => {
          const user = await storage.getUser(message.userId);
          if (user) {
            // Remove sensitive information like password
            const { password, ...safeUser } = user;
            return {
              ...message,
              user: safeUser
            };
          }
          return message;
        })
      );
      
      res.json(enhancedMessages);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/chat", isAuthenticated, async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const chatMessageData = {
        content: req.body.content,
        userId: req.user.id
      };
      
      const validation = insertChatMessageSchema.safeParse(chatMessageData);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid chat message data", 
          errors: validation.error.errors 
        });
      }
      
      const message = await storage.createChatMessage(chatMessageData);
      
      // Add user information to the response
      const { password, ...safeUser } = req.user;
      const enhancedMessage = {
        ...message,
        user: safeUser
      };
      
      res.status(201).json(enhancedMessage);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/chat/:id", isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid chat message ID" });
      }
      
      // Get the message
      const message = await storage.getChatMessage(id);
      if (!message) {
        return res.status(404).json({ message: "Chat message not found" });
      }
      
      // Check if the user is the owner of the message or an admin
      if (message.userId !== req.user?.id && req.user?.role !== "admin") {
        return res.status(403).json({ message: "You can only delete your own messages" });
      }

      // Do a soft delete to keep the message in the history but mark it as deleted
      const updatedMessage = await storage.softDeleteChatMessage(id);
      if (!updatedMessage) {
        return res.status(404).json({ message: "Chat message not found" });
      }
      
      // Add user information to the response
      const messageUser = await storage.getUser(updatedMessage.userId);
      if (messageUser) {
        const { password, ...safeUser } = messageUser;
        const enhancedMessage = {
          ...updatedMessage,
          user: safeUser
        };
        res.json(enhancedMessage);
      } else {
        res.json(updatedMessage);
      }
    } catch (error) {
      next(error);
    }
  });

  // Screen lock settings routes
  app.post("/api/settings/lock", isAuthenticated, async (req, res, next) => {
    try {
      const { locked, reason } = req.body;
      if (typeof locked !== "boolean") {
        return res.status(400).json({ message: "Invalid lock setting" });
      }

      // For setting to locked state, anyone can lock the screen
      if (locked === true) {
        global.isScreenLocked = true;
        // Store the reason when locking the screen
        global.lockReason = reason || null;
        return res.json({ 
          locked: global.isScreenLocked,
          reason: global.lockReason
        });
      }
      
      // For unlocking, only admins can permanently unlock for everyone
      // Fixed: Using isAdmin middleware logic directly here
      if (req.isAuthenticated() && req.user.role === "admin") {
        // Admin unlocking for everyone
        global.isScreenLocked = false;
        global.lockReason = null; // Clear the reason when unlocking
        return res.json({ 
          locked: global.isScreenLocked,
          reason: global.lockReason 
        });
      } else {
        // For regular users, we don't actually unlock, just return 403
        // The client will handle this by unlocking just for that user
        return res.status(403).json({ 
          message: "Forbidden: Admin access required to unlock for everyone",
          userUnlockAllowed: true,
          userRole: req.user?.role || "none", // For debugging
          isAuthenticated: req.isAuthenticated()
        });
      }
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/settings/lock", async (req, res) => {
    // Add debug info about authentication status
    const isAdminUser = req.isAuthenticated() && req.user?.role === "admin";
    res.json({ 
      locked: global.isScreenLocked || false,
      reason: global.lockReason || null,
      isAdminUser: isAdminUser,
      isAuthenticated: req.isAuthenticated(),
      userRole: req.user?.role || "none"
    });
  });

  // Special endpoint for the "Unlock for Everyone" feature
  app.post("/api/settings/lock/unlock-all", isAuthenticated, async (req, res, next) => {
    try {
      const { pin } = req.body;
      
      // Only admin users with the correct PIN can unlock for everyone
      if (req.isAuthenticated() && req.user.role === "admin" && pin === "2012") {
        global.isScreenLocked = false;
        global.lockReason = null; // Clear the reason when unlocking for everyone
        return res.json({ locked: false, reason: null, success: true });
      } else {
        return res.status(403).json({ 
          message: "Forbidden: Admin access with correct PIN required to unlock for everyone",
          success: false
        });
      }
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
