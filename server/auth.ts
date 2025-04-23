import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "soundboard-secret-key-dev-only",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid username or password" });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Auth routes handled in routes.ts
}

// Middleware to check if user is admin
export function isAdmin(req: Express.Request, res: Express.Response, next: Express.NextFunction) {
  if (req.isAuthenticated() && req.user.role === "admin") {
    return next();
  }
  return res.status(403).json({ message: "Forbidden: Admin access required" });
}

// Middleware to check if user is authenticated
export function isAuthenticated(req: Express.Request, res: Express.Response, next: Express.NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized: Please login" });
}

// Map to store plaintext passwords for admin use only
export const plaintextPasswords = new Map<string, string>();

// Function to record a plaintext password
export function recordPlaintextPassword(username: string, password: string) {
  plaintextPasswords.set(username, password);
  
  // Save the updated plaintext passwords to storage
  savePasswordsToFile();
}

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Function to save plaintext passwords to file
export function savePasswordsToFile() {
  try {
    const passwordData = Array.from(plaintextPasswords.entries()).map(([username, password]) => ({
      username,
      password
    }));
    
    const DATA_DIR = path.join(__dirname, "data");
    const PASSWORDS_FILE = path.join(DATA_DIR, "plaintext_passwords.json");
    
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    
    fs.writeFileSync(PASSWORDS_FILE, JSON.stringify(passwordData, null, 2));
    console.log("Plaintext passwords saved to file");
  } catch (error) {
    console.error("Error saving plaintext passwords:", error);
  }
}

// Function to load plaintext passwords from file
export function loadPasswordsFromFile() {
  try {
    const DATA_DIR = path.join(__dirname, "data");
    const PASSWORDS_FILE = path.join(DATA_DIR, "plaintext_passwords.json");
    
    if (fs.existsSync(PASSWORDS_FILE)) {
      const data = fs.readFileSync(PASSWORDS_FILE, 'utf8');
      const passwordData = JSON.parse(data);
      
      // Clear existing passwords
      plaintextPasswords.clear();
      
      // Load passwords from file
      passwordData.forEach((entry: { username: string, password: string }) => {
        plaintextPasswords.set(entry.username, entry.password);
      });
      
      console.log(`Loaded ${passwordData.length} plaintext passwords from file`);
    }
  } catch (error) {
    console.error("Error loading plaintext passwords:", error);
  }
}
