import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import * as http from 'http';
import { IncomingMessage, ServerResponse } from 'http';

// Track application uptime
const startTime = new Date();
let lastHeartbeat = new Date();
let isServerRunning = false;

// Format uptime into days, hours, minutes, seconds
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / (24 * 60 * 60));
  seconds -= days * 24 * 60 * 60;
  const hours = Math.floor(seconds / (60 * 60));
  seconds -= hours * 60 * 60;
  const minutes = Math.floor(seconds / 60);
  seconds -= minutes * 60;
  
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

// Function to start the server
async function startServer() {
  if (isServerRunning) {
    log("Server is already running, no need to restart", "system");
    return;
  }

  try {
    const app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));

    app.use((req, res, next) => {
      const start = Date.now();
      const path = req.path;
      let capturedJsonResponse: Record<string, any> | undefined = undefined;

      const originalResJson = res.json;
      res.json = function (bodyJson, ...args) {
        capturedJsonResponse = bodyJson;
        return originalResJson.apply(res, [bodyJson, ...args]);
      };

      res.on("finish", () => {
        const duration = Date.now() - start;
        if (path.startsWith("/api")) {
          let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
          if (capturedJsonResponse) {
            logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
          }

          if (logLine.length > 80) {
            logLine = logLine.slice(0, 79) + "…";
          }

          log(logLine);
        }
      });

      next();
    });

    // Add server heartbeat endpoint
    app.get('/api/heartbeat', (_req, res) => {
      const now = new Date();
      lastHeartbeat = now;
      const uptime = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      const uptimeFormatted = formatUptime(uptime);
      
      res.json({
        status: 'healthy',
        uptime: uptimeFormatted,
        startTime: startTime.toISOString(),
        currentTime: now.toISOString()
      });
    });

    const server = await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      
      log(`Error handled: ${message}`, "error");
      res.status(status).json({ message });
      
      // Don't throw the error, just log it to prevent crashing
      console.error("Error in request:", err);
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Use environment port in production, default to 5000 in development
    // this serves both the API and the client.
    const mainPort = process.env.PORT ? parseInt(process.env.PORT) : 5000;
    const alternatePort = 5152; // Secondary port requested by user (only used in development)
    
    server.listen({
      port: mainPort,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`Main server running on port ${mainPort}`);
      
      // Only create a secondary server in development mode
      if (app.get("env") === "development") {
        // Create a secondary server on the alternate port      
        const createProxyServer = () => {
          const secondaryServer = http.createServer((req: IncomingMessage, res: ServerResponse) => {
            // Simple proxy to forward requests to the main server
            const options = {
              hostname: 'localhost',
              port: mainPort,
              path: req.url,
              method: req.method,
              headers: req.headers
            };
            
            const proxy = http.request(options, function(proxyRes: IncomingMessage) {
              res.writeHead(proxyRes.statusCode!, proxyRes.headers);
              proxyRes.pipe(res, { end: true });
            });
            
            req.pipe(proxy, { end: true });
          });
          
          secondaryServer.listen(alternatePort, "0.0.0.0", () => {
            log(`Secondary server running on port ${alternatePort}`, "system");
          });
        };
        
        // Create the proxy server
        createProxyServer();
      }
      
      log(`Application started at ${startTime.toISOString()} and running 24/7`, "system");
      console.log("===================================================================");
      console.log(`🎯 Access your application at: http://localhost:${mainPort}`);
      console.log(`🎯 Alternate access at: http://localhost:${alternatePort}`);
      console.log(`🌐 On Replit, access via: https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`);
      console.log(`📱 For improved school access, try the Replit mobile app!`);
      console.log("===================================================================");
      isServerRunning = true;
    });

    // Handle server shutdown gracefully
    const gracefulShutdown = () => {
      log("Received shutdown signal, saving data before exit...", "system");
      storage.saveDataToFiles();
      
      server.close(() => {
        log("Server shut down gracefully", "system");
        isServerRunning = false;
        
        // Attempt to restart server after shutdown
        setTimeout(() => {
          log("Attempting to restart server after shutdown...", "system");
          startServer();
        }, 5000);
      });
    };

    // Setup auto-save interval for data persistence
    const autoSaveInterval = setInterval(() => {
      storage.saveDataToFiles();
      log('Auto-saved data to persistent storage', 'system');
    }, 5 * 60 * 1000); // Auto-save every 5 minutes

    // Health check interval to ensure server is responsive
    const healthCheckInterval = setInterval(() => {
      const now = new Date();
      const timeSinceLastHeartbeat = now.getTime() - lastHeartbeat.getTime();
      
      // Ping self to keep the application alive
      fetch(`http://localhost:${mainPort}/api/heartbeat`)
        .then(() => log("Self-ping to keep server alive", "system"))
        .catch(err => log(`Self-ping failed: ${err.message}`, "error"));
      
      // If no heartbeat received in 10 minutes, restart server (reduced from 15)
      if (timeSinceLastHeartbeat > 10 * 60 * 1000) {
        log("No heartbeat detected for 10 minutes, restarting server...", "system");
        clearInterval(healthCheckInterval);
        clearInterval(autoSaveInterval);
        gracefulShutdown();
      }
    }, 3 * 60 * 1000); // Check every 3 minutes (reduced from 5)

    // Heartbeat logger to track continuous operation
    const uptimeLoggerInterval = setInterval(() => {
      const now = new Date();
      const uptime = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      log(`Server uptime: ${formatUptime(uptime)}`, 'system');
    }, 60 * 60 * 1000); // Log uptime every hour

    // Watch for exit signals
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

    return server;
  } catch (err) {
    log(`Error starting server: ${err}`, "error");
    console.error("Failed to start server:", err);
    
    isServerRunning = false;
    
    // Attempt to restart server after error
    setTimeout(() => {
      log("Attempting to restart server after error...", "system");
      startServer();
    }, 10000); // Wait 10 seconds before trying again
  }
}

// Handle unexpected errors to prevent crashes
process.on('uncaughtException', (err) => {
  log(`Uncaught exception: ${err.message}`, 'error');
  console.error('Uncaught Exception:', err);
  
  // If server crashed due to exception, restart it
  if (isServerRunning) {
    isServerRunning = false;
    setTimeout(() => {
      log("Attempting to restart server after uncaught exception...", "system");
      startServer();
    }, 5000);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  log(`Unhandled promise rejection: ${reason}`, 'error');
  console.error('Unhandled Promise Rejection:', reason);
  
  // Server continues running despite rejection
  // These are usually non-fatal
});

// Start the server
startServer().catch((err) => {
  console.error("Critical server startup failure:", err);
  log(`Critical server startup failure: ${err}`, "error");
  
  // Always try to restart after failure
  setTimeout(() => {
    log("Attempting final restart after critical failure...", "system");
    startServer().catch(console.error);
  }, 15000); // Wait 15 seconds before final restart attempt
});
