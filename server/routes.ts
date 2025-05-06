import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAdmin, isAuthenticated, hashPassword, comparePasswords, recordPlaintextPassword, plaintextPasswords, loadPasswordsFromFile } from "./auth";
import { 
  loginSchema, 
  insertUserSchema, 
  insertCategorySchema, 
  insertSoundSchema,
  insertBroadcastMessageSchema,
  insertChatMessageSchema,
  insertGameDataSchema,
  insertTermsAcceptanceLogSchema
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
  
  // Dedicated keepalive endpoint for preventing Replit from sleeping
  app.get("/api/keepalive", (req, res) => {
    res.status(200).json({ 
      status: "active",
      message: "Application is being kept alive",
      timestamp: new Date().toISOString()
    });
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
  
  // Create or update admin user with password "alarms12"
  const setupAdminUser = async () => {
    try {
      const admin = await storage.getUserByUsername("admin");
      const hashedPassword = await hashPassword("alarms12");
      
      if (admin) {
        // Update existing admin user
        await storage.updateUser(admin.id, { 
          password: hashedPassword,
          role: "admin",
          accessLevel: "full" 
        });
        console.log("Admin password updated to 'alarms12' and role set to 'admin'");
      } else {
        // Create admin user if it doesn't exist
        await storage.createUser({
          username: "admin",
          password: hashedPassword,
          fullName: "Administrator",
          role: "admin",
          accessLevel: "full"
        });
        console.log("Admin user created with password 'alarms12'");
      }
    } catch (error) {
      console.error("Failed to setup admin user:", error);
    }
  };
  
  // Execute the admin setup
  await setupAdminUser();
  
  // Load plaintext passwords from file
  loadPasswordsFromFile();
  
  // Record admin password
  recordPlaintextPassword("admin", "alarms12");
  
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
      
      // Record the plaintext password for admin use
      recordPlaintextPassword(username, password);
      
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
      // Include passwords in response for admins
      res.json(users);
    } catch (error) {
      next(error);
    }
  });
  
  // Endpoint to get plaintext passwords (admin only)
  app.get("/api/users/plaintext-passwords", isAdmin, (req, res) => {
    const passwordData = Array.from(plaintextPasswords.entries()).map(([username, password]) => ({
      username,
      password
    }));
    res.json(passwordData);
  });
  
  app.put("/api/users/:id", isAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // If password is being updated, hash it and save plaintext
      if (req.body.password) {
        // Get the user for their username
        const user = await storage.getUser(id);
        if (user) {
          // Save plaintext password
          recordPlaintextPassword(user.username, req.body.password);
        }
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
        categoryId: req.body.categoryId ? parseInt(req.body.categoryId) : 1, // Default to category 1 if not provided
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
  
  // Endpoint to delete all categories (no auth required, for scripts)
  app.delete('/api/categories/delete-all', async (req, res, next) => {
    try {
      // Get all categories
      const categories = await storage.getCategories();
      
      // Update all sounds to have no category
      const sounds = await storage.getSounds();
      for (const sound of sounds) {
        await storage.updateSound(sound.id, { categoryId: null });
      }
      
      console.log(`Updated ${sounds.length} sounds to have no category`);
      
      // Delete all categories
      let deletedCount = 0;
      for (const category of categories) {
        await storage.deleteCategory(category.id);
        deletedCount++;
      }
      
      res.status(200).json({
        success: true,
        message: `All ${deletedCount} categories deleted successfully`,
        soundsUpdated: sounds.length
      });
    } catch (error) {
      next(error);
    }
  });

  // Special endpoint for direct category creation from scripts (no auth required)
  app.post('/api/categories/create-direct', async (req, res, next) => {
    try {
      const { name, slug, description, color } = req.body;
      
      if (!name || !slug) {
        return res.status(400).json({ message: "Name and slug are required" });
      }
      
      // Create category data
      const categoryData = {
        name,
        slug,
        description: description || '',
        color: color || '#CCCCCC'
      };
      
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      next(error);
    }
  });

  // Endpoint to get all sounds directly (no auth required, for scripts)
  app.get('/api/sounds/all-direct', async (req, res, next) => {
    try {
      const sounds = await storage.getSounds();
      res.json(sounds);
    } catch (error) {
      next(error);
    }
  });

  // Endpoint to delete a sound directly (no auth required, for scripts)
  app.delete('/api/sounds/delete-direct/:id', async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid sound ID" });
      }
      
      const sound = await storage.getSound(id);
      if (!sound) {
        return res.status(404).json({ message: "Sound not found" });
      }
      
      // Delete the file if it exists
      try {
        const filePath = path.join(__dirname, 'public', 'sounds', sound.filename);
        if (fs.existsSync(filePath)) {
          await unlink(filePath);
        }
      } catch (fileError) {
        console.error(`Error deleting sound file for ID ${id}:`, fileError);
        // Continue with database deletion even if file deletion fails
      }
      
      const success = await storage.deleteSound(id);
      if (!success) {
        return res.status(500).json({ message: "Failed to delete sound from database" });
      }
      
      res.status(200).json({ success: true, message: "Sound deleted successfully" });
    } catch (error) {
      next(error);
    }
  });

  // Endpoint to update a sound's category (no auth required, for scripts)
  app.put('/api/sounds/update-category/:id', async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid sound ID" });
      }
      
      const { categoryId } = req.body;
      if (categoryId === undefined) {
        return res.status(400).json({ message: "categoryId is required" });
      }
      
      const sound = await storage.updateSound(id, { categoryId });
      if (!sound) {
        return res.status(404).json({ message: "Sound not found" });
      }
      
      res.json(sound);
    } catch (error) {
      next(error);
    }
  });

  // Special endpoint for direct sound registration from scripts (no auth required)
  app.post('/api/sounds/direct-import', async (req, res, next) => {
    try {
      const { name, filename, category } = req.body;
      
      if (!name || !filename) {
        return res.status(400).json({ message: "Filename and name are required" });
      }
      
      // Create sound data
      const soundData = {
        name,
        filename,
        duration: "0.0", // Default duration
        categoryId: 1, // Default category ID
        accessLevel: "all"
      };
      
      const sound = await storage.createSound(soundData);
      res.status(201).json(sound);
    } catch (error) {
      next(error);
    }
  });

  // Endpoint to get list of downloaded sounds
  app.get('/api/sounds/downloaded', isAdmin, async (req, res, next) => {
    try {
      const downloadDir = path.join(__dirname, 'public', 'sounds', 'downloaded');
      
      // Ensure directory exists
      if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(downloadDir, { recursive: true });
        return res.json({ sounds: [] });
      }
      
      // Get all MP3 files in download directory
      const files = fs.readdirSync(downloadDir).filter(file => file.endsWith('.mp3'));
      
      // Get all registered sounds to check which downloads are already registered
      const registeredSounds = await storage.getSounds();
      
      // Format results
      const sounds = files.map(filename => {
        // Clean up name from filename (remove timestamp, etc.)
        const filenameWithoutTimestamp = filename.replace(/_\d+\.mp3$/, '');
        const name = filenameWithoutTimestamp
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        
        // Check if sound is already registered
        const isRegistered = registeredSounds.some(sound => sound.filename === filename);
        const registeredSound = registeredSounds.find(sound => sound.filename === filename);
        
        return {
          filename,
          name,
          registered: isRegistered,
          id: registeredSound?.id
        };
      });
      
      res.json({ sounds });
    } catch (error) {
      next(error);
    }
  });
  
  // Import downloaded sound endpoint
  app.post('/api/sounds/import', isAdmin, async (req, res, next) => {
    try {
      const { filename, name, duration, categoryId, accessLevel } = req.body;
      
      if (!filename || !name) {
        return res.status(400).json({ message: "Filename and name are required" });
      }
      
      // Validate that the file exists in downloaded directory
      const downloadedPath = path.join(__dirname, 'public', 'sounds', 'downloaded', filename);
      if (!fs.existsSync(downloadedPath)) {
        return res.status(404).json({ message: "Sound file not found in downloaded directory" });
      }
      
      // Copy file to main sounds directory
      const destPath = path.join(__dirname, 'public', 'sounds', filename);
      fs.copyFileSync(downloadedPath, destPath);
      
      // Create sound in database
      const soundData = {
        name,
        filename,
        duration: duration || "0.0",
        categoryId: categoryId ? parseInt(categoryId) : 1, // Default to category 1 if not provided
        accessLevel: accessLevel || "all"
      };
      
      const validation = insertSoundSchema.safeParse(soundData);
      if (!validation.success) {
        // Delete copied file if validation fails
        if (fs.existsSync(destPath)) {
          await unlink(destPath);
        }
        return res.status(400).json({ message: "Invalid sound data", errors: validation.error.errors });
      }
      
      const sound = await storage.createSound(soundData);
      res.status(201).json(sound);
    } catch (error) {
      next(error);
    }
  });
  
  // Game-related routes

  // Cookie Clicker data endpoints
  app.get('/api/games/cookie-clicker', isAuthenticated, async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Get cookie clicker data for current user
      const cookieData = await storage.getCookieClickerData(req.user.id);
      
      if (!cookieData) {
        // If no data exists, create initial data
        const initialData = await storage.createCookieClickerData({
          userId: req.user.id,
          cookies: 0,
          clickPower: 1,
          autoClickers: 0,
          grandmas: 0,
          factories: 0,
          background: "none"
        });
        return res.json(initialData);
      }
      
      return res.json(cookieData);
    } catch (error) {
      next(error);
    }
  });
  
  app.post('/api/games/cookie-clicker/save', isAuthenticated, async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { cookies, clickPower, autoClickers, grandmas, factories, background } = req.body;
      
      // Update cookie clicker data
      const updatedData = await storage.updateCookieClickerData(req.user.id, {
        cookies: cookies !== undefined ? cookies : undefined,
        clickPower: clickPower !== undefined ? clickPower : undefined,
        autoClickers: autoClickers !== undefined ? autoClickers : undefined,
        grandmas: grandmas !== undefined ? grandmas : undefined,
        factories: factories !== undefined ? factories : undefined,
        background: background !== undefined ? background : undefined
      });
      
      if (!updatedData) {
        // If no existing data, create new data
        const newData = await storage.createCookieClickerData({
          userId: req.user.id,
          cookies: cookies || 0,
          clickPower: clickPower || 1,
          autoClickers: autoClickers || 0,
          grandmas: grandmas || 0,
          factories: factories || 0,
          background: background || "none"
        });
        return res.status(201).json(newData);
      }
      
      return res.json(updatedData);
    } catch (error) {
      next(error);
    }
  });
  
  // Admin can gift cookies or resources to users
  app.post('/api/games/cookie-clicker/gift', isAdmin, async (req, res, next) => {
    try {
      const { username, giftType, amount } = req.body;
      
      if (!username || !giftType || !amount) {
        return res.status(400).json({ 
          message: "Missing required fields: username, giftType, and amount are required" 
        });
      }
      
      // Find target user
      const targetUser = await storage.getUserByUsername(username);
      if (!targetUser) {
        return res.status(404).json({ message: `User '${username}' not found` });
      }
      
      // Process the gift based on gift type
      let updatedData;
      
      if (giftType === 'cookies') {
        // Grant cookies to the user
        updatedData = await storage.grantCookies(targetUser.id, parseFloat(amount));
      } else {
        // For other resource types, get current data first
        const userData = await storage.getCookieClickerData(targetUser.id);
        
        if (!userData) {
          // Create new data if none exists
          const initialData = {
            userId: targetUser.id,
            cookies: 0,
            clickPower: 1,
            autoClickers: 0,
            grandmas: 0,
            factories: 0,
            background: "none"
          };
          
          // Add the gifted resource
          if (giftType === 'clickPower') {
            initialData.clickPower = parseInt(amount);
          } else if (giftType === 'autoClickers') {
            initialData.autoClickers = parseInt(amount);
          } else if (giftType === 'grandmas') {
            initialData.grandmas = parseInt(amount);
          } else if (giftType === 'factories') {
            initialData.factories = parseInt(amount);
          }
          
          updatedData = await storage.createCookieClickerData(initialData);
        } else {
          // Update existing data with the gifted resource
          const updateObj: any = {};
          
          if (giftType === 'clickPower') {
            updateObj.clickPower = userData.clickPower + parseInt(amount);
          } else if (giftType === 'autoClickers') {
            updateObj.autoClickers = userData.autoClickers + parseInt(amount);
          } else if (giftType === 'grandmas') {
            updateObj.grandmas = userData.grandmas + parseInt(amount);
          } else if (giftType === 'factories') {
            updateObj.factories = userData.factories + parseInt(amount);
          }
          
          updatedData = await storage.updateCookieClickerData(targetUser.id, updateObj);
        }
      }
      
      res.status(200).json({ 
        message: `Successfully gifted ${amount} ${giftType} to user ${username}`,
        success: true,
        data: updatedData
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Reset cookie clicker data to initial state
  app.post('/api/games/cookie-clicker/reset', isAuthenticated, async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Reset the user's cookie clicker data to initial values
      const resetData = await storage.updateCookieClickerData(req.user.id, {
        cookies: 0,
        clickPower: 1,
        autoClickers: 0,
        grandmas: 0,
        factories: 0,
        background: "none"
      });
      
      if (!resetData) {
        // If somehow no data exists, create initial data
        const initialData = await storage.createCookieClickerData({
          userId: req.user.id,
          cookies: 0,
          clickPower: 1,
          autoClickers: 0,
          grandmas: 0,
          factories: 0,
          background: "none"
        });
        return res.status(201).json(initialData);
      }
      
      return res.json(resetData);
    } catch (error) {
      next(error);
    }
  });
  
  // Generic leaderboard endpoint moved to the end of the file

  // High scores and leaderboard endpoint (legacy - kept for backward compatibility)
  app.get('/api/games/cookie-clicker/leaderboard', async (req, res, next) => {
    try {
      // Get all cookie clicker data
      const allData = await storage.getAllCookieClickerData();
      
      // Sort by cookies in descending order
      const leaderboard = allData
        .sort((a, b) => b.cookies - a.cookies)
        .slice(0, 10); // Get top 10
      
      // Enhance with user information
      const enhancedLeaderboard = await Promise.all(
        leaderboard.map(async (entry) => {
          const user = await storage.getUser(entry.userId);
          if (user) {
            const { password, ...safeUser } = user;
            return {
              ...entry,
              user: safeUser
            };
          }
          return entry;
        })
      );
      
      res.json(enhancedLeaderboard);
    } catch (error) {
      next(error);
    }
  });
  
  // Debug endpoint for cookie clicker leaderboard
  app.get('/api/debug/cookie-clicker-leaderboard', async (req, res, next) => {
    try {
      // Get raw cookie clicker data
      const cookieData = await storage.getAllCookieClickerData();
      const firstUser = cookieData.length > 0 ? await storage.getUser(cookieData[0].userId) : null;
      
      // Try to directly create a leaderboard entry for testing
      let manualLeaderboardEntry = null;
      if (firstUser) {
        manualLeaderboardEntry = {
          id: cookieData[0].id,
          userId: cookieData[0].userId,
          username: firstUser.username,
          fullName: firstUser.fullName || 'Unknown',
          score: cookieData[0].cookies || 0,
          gameType: 'cookie-clicker',
          lastPlayed: cookieData[0].lastUpdated
        };
      }
      
      // Try to manually get the leaderboard
      let directLeaderboard = [];
      try {
        directLeaderboard = await storage.getLeaderboardWithUserDetails('cookie-clicker', 10);
      } catch (leaderboardError) {
        console.error('Error getting leaderboard:', leaderboardError);
      }
      
      // Return debug info
      res.json({
        rawCookieData: cookieData,
        cookieDataCount: cookieData.length,
        firstUser: firstUser ? { id: firstUser.id, username: firstUser.username, fullName: firstUser.fullName } : null,
        manualLeaderboardEntry,
        directLeaderboard,
        message: "Use this endpoint to debug the cookie clicker leaderboard"
      });
    } catch (error) {
      console.error('Debug endpoint error:', error);
      res.status(500).json({ error: String(error) });
    }
  });
  
  // General game data endpoints
  app.get('/api/games/:gameType/data', isAuthenticated, async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const gameType = req.params.gameType;
      
      // Get game data for current user and game type
      const gameData = await storage.getGameData(req.user.id, gameType);
      
      if (!gameData) {
        return res.status(404).json({ message: "No game data found" });
      }
      
      return res.json(gameData);
    } catch (error) {
      next(error);
    }
  });
  
  app.post('/api/games/:gameType/save', isAuthenticated, async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const gameType = req.params.gameType;
      const { data, highScore } = req.body;
      
      // Check if data already exists
      const existingData = await storage.getGameData(req.user.id, gameType);
      
      if (existingData) {
        // Update existing data
        const updatedData = await storage.updateGameData(existingData.id, {
          data,
          highScore: highScore !== undefined ? highScore : existingData.highScore
        });
        
        return res.json(updatedData);
      } else {
        // Create new game data
        const newData = await storage.saveGameData({
          userId: req.user.id,
          gameType,
          data,
          highScore: highScore || null
        });
        
        return res.status(201).json(newData);
      }
    } catch (error) {
      next(error);
    }
  });
  
  // Game-specific endpoints for our new games
  
  // Tic-Tac-Toe game
  app.get('/api/games/tictactoe', isAuthenticated, async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Get game data for current user
      const gameData = await storage.getGameData(req.user.id, 'tictactoe');
      
      if (!gameData) {
        return res.json({
          data: {
            wins: 0,
            losses: 0,
            draws: 0
          },
          lastPlayed: new Date().toISOString()
        });
      }
      
      return res.json(gameData);
    } catch (error) {
      next(error);
    }
  });
  
  app.post('/api/games/tictactoe/save', isAuthenticated, async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { data } = req.body;
      
      // Check if data already exists
      const existingData = await storage.getGameData(req.user.id, 'tictactoe');
      
      if (existingData) {
        // Update existing data
        const updatedData = await storage.updateGameData(existingData.id, {
          data,
          lastPlayed: new Date()
        });
        
        return res.json(updatedData);
      } else {
        // Create new game data
        const newData = await storage.saveGameData({
          userId: req.user.id,
          gameType: 'tictactoe',
          data,
          highScore: null
        });
        
        return res.status(201).json(newData);
      }
    } catch (error) {
      next(error);
    }
  });
  
  // Snake game
  app.get('/api/games/snake', isAuthenticated, async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Get game data for current user
      const gameData = await storage.getGameData(req.user.id, 'snake');
      
      if (!gameData) {
        return res.json({
          highScore: 0,
          lastPlayed: new Date().toISOString()
        });
      }
      
      return res.json(gameData);
    } catch (error) {
      next(error);
    }
  });
  
  app.post('/api/games/snake/save', isAuthenticated, async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { highScore } = req.body;
      
      // Check if data already exists
      const existingData = await storage.getGameData(req.user.id, 'snake');
      
      if (existingData) {
        // Update existing data if the new score is higher
        if (highScore > existingData.highScore) {
          const updatedData = await storage.updateGameData(existingData.id, {
            highScore,
            lastPlayed: new Date()
          });
          
          return res.json(updatedData);
        }
        return res.json(existingData);
      } else {
        // Create new game data
        const newData = await storage.saveGameData({
          userId: req.user.id,
          gameType: 'snake',
          data: {},
          highScore
        });
        
        return res.status(201).json(newData);
      }
    } catch (error) {
      next(error);
    }
  });
  
  // Math Puzzle game
  app.get('/api/games/math-puzzle', isAuthenticated, async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Get game data for current user
      const gameData = await storage.getGameData(req.user.id, 'math-puzzle');
      
      if (!gameData) {
        return res.json({
          highScore: 0,
          lastPlayed: new Date().toISOString()
        });
      }
      
      return res.json(gameData);
    } catch (error) {
      next(error);
    }
  });
  
  app.post('/api/games/math-puzzle/save', isAuthenticated, async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { highScore } = req.body;
      
      // Check if data already exists
      const existingData = await storage.getGameData(req.user.id, 'math-puzzle');
      
      if (existingData) {
        // Update existing data if the new score is higher
        if (highScore > existingData.highScore) {
          const updatedData = await storage.updateGameData(existingData.id, {
            highScore,
            lastPlayed: new Date()
          });
          
          return res.json(updatedData);
        }
        return res.json(existingData);
      } else {
        // Create new game data
        const newData = await storage.saveGameData({
          userId: req.user.id,
          gameType: 'math-puzzle',
          data: {},
          highScore
        });
        
        return res.status(201).json(newData);
      }
    } catch (error) {
      next(error);
    }
  });
  
  app.get('/api/games/:gameType/highscores', async (req, res, next) => {
    try {
      const gameType = req.params.gameType;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      // Get high scores for the game type
      const highScores = await storage.getHighScores(gameType, limit);
      
      // Enhance with user information
      const enhancedHighScores = await Promise.all(
        highScores.map(async (entry) => {
          const user = await storage.getUser(entry.userId);
          if (user) {
            const { password, ...safeUser } = user;
            return {
              ...entry,
              user: safeUser
            };
          }
          return entry;
        })
      );
      
      res.json(enhancedHighScores);
    } catch (error) {
      next(error);
    }
  });

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

  // Edit sound name endpoint - accessible to any authenticated user
  app.put('/api/sounds/:id/rename', isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid sound ID" });
      }
      
      const { name } = req.body;
      if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ message: "Sound name is required" });
      }
      
      const sound = await storage.updateSound(id, { name: name.trim() });
      if (!sound) {
        return res.status(404).json({ message: "Sound not found" });
      }
      
      res.json(sound);
    } catch (error) {
      next(error);
    }
  });

  // Game leaderboards endpoint
  app.get('/api/leaderboard/:gameType', async (req, res, next) => {
    try {
      const { gameType } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      console.log(`DEBUG: leaderboard request for gameType=${gameType}, limit=${limit}`);
      
      // Special handling for cookie-clicker with direct approach
      if (gameType === 'cookie-clicker') {
        try {
          // Get cookie clicker data directly
          const cookieData = await storage.getAllCookieClickerData();
          console.log(`DEBUG: cookie-clicker data count: ${cookieData.length}`);
          
          // Sort by cookies in descending order
          const sortedData = cookieData
            .sort((a, b) => b.cookies - a.cookies)
            .slice(0, limit);
          
          // Enhance with user information
          const leaderboardData = await Promise.all(
            sortedData.map(async (entry) => {
              try {
                const user = await storage.getUser(entry.userId);
                if (!user) return null; // Skip if user not found
                
                return {
                  id: entry.id,
                  userId: entry.userId,
                  username: user.username,
                  fullName: user.fullName || "", // Handle cases where fullName might be missing
                  score: entry.cookies || 0,
                  gameType: 'cookie-clicker',
                  lastPlayed: entry.lastUpdated
                };
              } catch (error) {
                console.error(`Error processing leaderboard entry for userId=${entry.userId}:`, error);
                return null; // Skip this entry if there was an error
              }
            })
          );
          
          // Filter out null entries and return
          const result = leaderboardData.filter(entry => entry !== null);
          console.log(`DEBUG: returning ${result.length} cookie-clicker leaderboard entries`);
          return res.status(200).json(result);
        } catch (cookieError) {
          console.error('Cookie-clicker leaderboard error:', cookieError);
          return res.status(500).json({ error: 'Error generating cookie-clicker leaderboard' });
        }
      } else if (gameType === 'word-scramble') {
        try {
          // Get all game data for word-scramble
          const allGameData = await storage.getAllGameData(gameType);
          console.log(`DEBUG: word-scramble data count: ${allGameData.length}`);
          
          // Sort by high score in descending order and take top entries
          const sortedData = allGameData
            .sort((a, b) => (b.highScore || 0) - (a.highScore || 0))
            .slice(0, limit);
          
          // Enhance with user information
          const leaderboardData = await Promise.all(
            sortedData.map(async (entry) => {
              try {
                const user = await storage.getUser(entry.userId);
                if (!user) return null; // Skip if user not found
                
                return {
                  id: entry.id,
                  userId: entry.userId,
                  username: user.username,
                  fullName: user.fullName || "", // Handle cases where fullName might be missing
                  score: entry.highScore || 0,
                  gameType: 'word-scramble',
                  lastPlayed: entry.lastPlayed
                };
              } catch (error) {
                console.error(`Error processing word-scramble leaderboard entry for userId=${entry.userId}:`, error);
                return null; // Skip this entry on error
              }
            })
          );
          
          // Filter out null entries and return
          const result = leaderboardData.filter(entry => entry !== null);
          console.log(`DEBUG: returning ${result.length} word-scramble leaderboard entries`);
          return res.status(200).json(result);
        } catch (wordScrambleError) {
          console.error('Word-scramble leaderboard error:', wordScrambleError);
          return res.status(500).json({ error: 'Error generating word-scramble leaderboard' });
        }
      } else {
        // For other game types, use the standard storage method
        try {
          const leaderboard = await storage.getLeaderboardWithUserDetails(gameType, limit);
          return res.status(200).json(leaderboard);
        } catch (otherGameError) {
          console.error(`Leaderboard error for ${gameType}:`, otherGameError);
          return res.status(500).json({ error: `Error generating ${gameType} leaderboard` });
        }
      }
    } catch (error) {
      console.error('Leaderboard endpoint error:', error);
      next(error);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
