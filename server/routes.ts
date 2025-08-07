import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertGuestSchema, checkoutGuestSchema, loginSchema, updateCapsuleProblemSchema,
  insertMaintenanceProblemSchema, insertSettingSchema, insertNotificationSchema,
  selfCheckinSchema
} from "@shared/schema";
import { z } from "zod";
import { randomUUID } from "crypto";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Setup endpoint for creating admin user (development only)
  app.post("/setup-admin", async (req, res) => {
    try {
      const { username, password, role } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ message: "User already exists" });
      }

      const user = await storage.createUser({
        username,
        password, // In production, this should be hashed
      });

      res.json({ message: "Admin user created successfully", userId: user.id });
    } catch (error) {
      res.status(500).json({ message: "Failed to create admin user" });
    }
  });
  
  // Authentication middleware
  const authenticateToken = async (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    try {
      const session = await storage.getSessionByToken(token);
      if (!session || session.expiresAt < new Date()) {
        return res.status(401).json({ message: 'Invalid or expired token' });
      }

      const user = await storage.getUser(session.userId);
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      req.user = user;
      next();
    } catch (error) {
      res.status(500).json({ message: 'Token validation failed' });
    }
  };

  // Login endpoint
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Create session
      const token = randomUUID();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      const session = await storage.createSession(user.id, token, expiresAt);

      res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", authenticateToken, async (req: any, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (token) {
        await storage.deleteSession(token);
      }
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      res.status(500).json({ message: "Logout failed" });
    }
  });

  // Get current user
  app.get("/api/auth/me", authenticateToken, async (req: any, res) => {
    res.json({ user: { id: req.user.id, username: req.user.username, role: req.user.role } });
  });
  
  // Get occupancy summary
  app.get("/api/occupancy", async (_req, res) => {
    try {
      const occupancy = await storage.getCapsuleOccupancy();
      res.json(occupancy);
    } catch (error) {
      res.status(500).json({ message: "Failed to get occupancy data" });
    }
  });

  // Get all checked-in guests
  app.get("/api/guests/checked-in", async (_req, res) => {
    try {
      const guests = await storage.getCheckedInGuests();
      res.json(guests);
    } catch (error) {
      res.status(500).json({ message: "Failed to get checked-in guests" });
    }
  });

  // Get guest history
  app.get("/api/guests/history", async (_req, res) => {
    try {
      const history = await storage.getGuestHistory();
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Failed to get guest history" });
    }
  });

  // Get available capsules
  app.get("/api/capsules/available", async (_req, res) => {
    try {
      const capsules = await storage.getAvailableCapsules();
      res.json(capsules);
    } catch (error) {
      res.status(500).json({ message: "Failed to get available capsules" });
    }
  });

  // Get all capsules with their status
  app.get("/api/capsules", async (_req, res) => {
    try {
      const capsules = await storage.getAllCapsules();
      res.json(capsules);
    } catch (error) {
      res.status(500).json({ message: "Failed to get capsules" });
    }
  });

  // Update capsule status (for maintenance/problems)
  app.patch("/api/capsules/:number", async (req, res) => {
    try {
      const { number } = req.params;
      const updates = req.body;
      const capsule = await storage.updateCapsule(number, updates);
      
      if (!capsule) {
        return res.status(404).json({ message: "Capsule not found" });
      }

      res.json(capsule);
    } catch (error) {
      res.status(500).json({ message: "Failed to update capsule" });
    }
  });

  // Get guests with checkout today (for daily notifications)
  app.get("/api/guests/checkout-today", async (_req, res) => {
    try {
      const guests = await storage.getGuestsWithCheckoutToday();
      res.json(guests);
    } catch (error) {
      res.status(500).json({ message: "Failed to get checkout notifications" });
    }
  });

  // Update guest information
  app.patch("/api/guests/:id", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const guest = await storage.updateGuest(id, updates);
      if (!guest) {
        return res.status(404).json({ message: "Guest not found" });
      }

      res.json(guest);
    } catch (error) {
      res.status(500).json({ message: "Failed to update guest" });
    }
  });

  // Get capsules with problems (for maintenance dashboard)
  app.get("/api/capsules/problems", async (_req, res) => {
    try {
      const capsules = await storage.getCapsulesWithProblems();
      res.json(capsules);
    } catch (error) {
      res.status(500).json({ message: "Failed to get capsule problems" });
    }
  });

  // Update capsule problems
  app.patch("/api/capsules/:number", async (req, res) => {
    try {
      const { number } = req.params;
      const updates = updateCapsuleProblemSchema.parse(req.body);
      
      // Problem tracking is now handled by the maintenance problems system
      if (!updates.problemDescription || updates.problemDescription.trim() === '') {
        updates.problemDescription = undefined;
      }
      
      const capsule = await storage.updateCapsule(number, updates);
      
      if (!capsule) {
        return res.status(404).json({ message: "Capsule not found" });
      }

      res.json(capsule);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update capsule" });
    }
  });

  // Check-in a guest
  app.post("/api/guests/checkin", authenticateToken, async (req: any, res) => {
    try {
      const validatedData = insertGuestSchema.parse(req.body);
      
      // Check if capsule is available
      const availableCapsules = await storage.getAvailableCapsules();
      const availableCapsuleNumbers = availableCapsules.map(c => c.number);
      if (!availableCapsuleNumbers.includes(validatedData.capsuleNumber)) {
        return res.status(400).json({ message: "Capsule is not available" });
      }

      const guest = await storage.createGuest(validatedData);
      res.status(201).json(guest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to check-in guest" });
    }
  });

  // Check-out a guest
  app.post("/api/guests/checkout", authenticateToken, async (req: any, res) => {
    try {
      const validatedData = checkoutGuestSchema.parse(req.body);
      const guest = await storage.checkoutGuest(validatedData.id);
      
      if (!guest) {
        return res.status(404).json({ message: "Guest not found or already checked out" });
      }

      res.json(guest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to check-out guest" });
    }
  });

  // Maintenance Problems API
  app.get("/api/maintenance-problems", authenticateToken, async (req, res) => {
    try {
      const problems = await storage.getMaintenanceProblems();
      res.json(problems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch maintenance problems" });
    }
  });

  app.get("/api/maintenance-problems/active", authenticateToken, async (req, res) => {
    try {
      const problems = await storage.getActiveMaintenanceProblems();
      res.json(problems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active maintenance problems" });
    }
  });

  app.post("/api/maintenance-problems", authenticateToken, async (req: any, res) => {
    try {
      const validatedData = insertMaintenanceProblemSchema.parse(req.body);
      const problem = await storage.createMaintenanceProblem({
        ...validatedData,
        reportedBy: req.user.id,
      });
      res.status(201).json(problem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create maintenance problem" });
    }
  });

  app.put("/api/maintenance-problems/:id/resolve", authenticateToken, async (req: any, res) => {
    try {
      const problemId = req.params.id;
      const problem = await storage.resolveMaintenanceProblem(problemId, req.user.id);
      
      if (!problem) {
        return res.status(404).json({ message: "Maintenance problem not found" });
      }

      res.json(problem);
    } catch (error) {
      res.status(500).json({ message: "Failed to resolve maintenance problem" });
    }
  });

  // Settings API
  app.get("/api/settings", authenticateToken, async (req, res) => {
    try {
      const settings = await storage.getAllSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.get("/api/settings/:key", authenticateToken, async (req, res) => {
    try {
      const setting = await storage.getSetting(req.params.key);
      if (!setting) {
        return res.status(404).json({ message: "Setting not found" });
      }
      res.json(setting);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch setting" });
    }
  });

  app.post("/api/settings", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertSettingSchema.parse(req.body);
      const setting = await storage.setSetting(validatedData);
      res.json(setting);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update setting" });
    }
  });

  // Notifications API
  app.get("/api/notifications", authenticateToken, async (req: any, res) => {
    try {
      const notifications = await storage.getNotifications(req.user.id);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.post("/api/notifications", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertNotificationSchema.parse(req.body);
      const notification = await storage.createNotification(validatedData);
      res.status(201).json(notification);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create notification" });
    }
  });

  app.put("/api/notifications/:id/read", authenticateToken, async (req, res) => {
    try {
      const success = await storage.markNotificationAsRead(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Notification not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Guest Self-Check-in API
  app.post("/api/guest-links", authenticateToken, async (req: any, res) => {
    try {
      const { capsuleNumber, expiryHours } = req.body;
      
      if (!capsuleNumber) {
        return res.status(400).json({ message: "Capsule number is required" });
      }

      const { token, expiryTime } = await storage.createGuestLink(capsuleNumber, expiryHours);
      
      // Create notification for staff
      await storage.createNotification({
        type: 'self_checkin',
        title: 'Guest Link Created',
        message: `Self-check-in link created for capsule ${capsuleNumber}`,
        userId: req.user.id,
      });

      res.json({
        token,
        expiryTime,
        link: `${req.protocol}://${req.get('host')}/guest-checkin/${token}`,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to create guest link" });
    }
  });

  app.get("/api/guest-links/:token/validate", async (req, res) => {
    try {
      const { token } = req.params;
      const validation = await storage.validateGuestLink(token);
      
      if (!validation.valid) {
        return res.status(404).json({ message: "Invalid or expired link" });
      }

      const guest = await storage.getGuestByToken(token);
      res.json({ valid: true, capsuleNumber: validation.capsuleNumber, guest });
    } catch (error) {
      res.status(500).json({ message: "Failed to validate guest link" });
    }
  });

  app.post("/api/guest-links/:token/checkin", async (req, res) => {
    try {
      const { token } = req.params;
      const validatedData = selfCheckinSchema.parse(req.body);
      
      const guest = await storage.selfCheckinGuest(token, validatedData);
      
      if (!guest) {
        return res.status(400).json({ message: "Invalid token or check-in failed" });
      }

      // Create notification for staff
      await storage.createNotification({
        type: 'self_checkin',
        title: 'Guest Self-Check-in',
        message: `${guest.name} completed self-check-in for capsule ${guest.capsuleNumber}`,
      });

      res.json(guest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to complete self-check-in" });
    }
  });

  app.get("/api/guest-links/:token/guest", async (req, res) => {
    try {
      const { token } = req.params;
      const guest = await storage.getGuestByToken(token);
      
      if (!guest) {
        return res.status(404).json({ message: "Guest not found" });
      }

      // Check if guest can still edit (within 1 hour)
      const canEdit = guest.canEditUntil && new Date() < new Date(guest.canEditUntil);
      
      res.json({ ...guest, canEdit });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch guest data" });
    }
  });

  app.put("/api/guest-links/:token/guest", async (req, res) => {
    try {
      const { token } = req.params;
      const guest = await storage.getGuestByToken(token);
      
      if (!guest) {
        return res.status(404).json({ message: "Guest not found" });
      }

      // Check if guest can still edit (within 1 hour)
      const canEdit = guest.canEditUntil && new Date() < new Date(guest.canEditUntil);
      if (!canEdit) {
        return res.status(403).json({ message: "Edit window has expired" });
      }

      const validatedData = selfCheckinSchema.parse(req.body);
      const updatedGuest = await storage.updateGuest(guest.id, validatedData);
      
      res.json(updatedGuest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update guest data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
