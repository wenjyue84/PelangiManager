import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertGuestSchema, checkoutGuestSchema, loginSchema, createCapsuleProblemSchema, resolveProblemSchema, googleAuthSchema, insertUserSchema, guestSelfCheckinSchema, createTokenSchema, updateSettingsSchema } from "@shared/schema";
import { z } from "zod";
import { randomUUID } from "crypto";
import { OAuth2Client } from "google-auth-library";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Google OAuth client
  const googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  
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
        email: username, // Using username as email for backward compatibility
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
      console.log("Login attempt:", req.body);
      const { email, password } = loginSchema.parse(req.body);
      
      // Try to find user by email first, then by username
      let user = await storage.getUserByEmail(email);
      if (!user) {
        user = await storage.getUserByUsername(email); // Allow login with username in email field
      }
      console.log("User found:", user ? "Yes" : "No");
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Create session
      const token = randomUUID();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      const session = await storage.createSession(user.id, token, expiresAt);

      res.json({ token, user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role } });
    } catch (error) {
      console.error("Login error:", error);
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

  // Google OAuth login
  app.post("/api/auth/google", async (req, res) => {
    try {
      const { token } = googleAuthSchema.parse(req.body);
      
      // Verify the Google token
      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      
      const payload = ticket.getPayload();
      if (!payload) {
        return res.status(401).json({ message: "Invalid Google token" });
      }

      const { sub: googleId, email, given_name: firstName, family_name: lastName, picture: profileImage } = payload;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Check if user exists
      let user = await storage.getUserByGoogleId(googleId);
      if (!user) {
        // Check if user exists with same email
        user = await storage.getUserByEmail(email);
        if (user) {
          // Link Google account to existing user
          // This would require updating the user with Google ID
          return res.status(400).json({ message: "User with this email already exists. Please login with email/password first." });
        } else {
          // Create new user
          user = await storage.createUser({
            email,
            googleId,
            firstName: firstName || undefined,
            lastName: lastName || undefined,
            profileImage: profileImage || undefined,
            role: "staff"
          });
        }
      }

      // Create session
      const sessionToken = randomUUID();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      await storage.createSession(user.id, sessionToken, expiresAt);

      res.json({ 
        token: sessionToken, 
        user: { 
          id: user.id, 
          email: user.email, 
          firstName: user.firstName, 
          lastName: user.lastName, 
          profileImage: user.profileImage,
          role: user.role 
        } 
      });
    } catch (error) {
      console.error("Google auth error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Google authentication failed" });
    }
  });

  // Get current user
  app.get("/api/auth/me", authenticateToken, async (req: any, res) => {
    res.json({ user: { id: req.user.id, email: req.user.email, firstName: req.user.firstName, lastName: req.user.lastName, role: req.user.role } });
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

  // Get active guest tokens (reserved capsules)
  app.get("/api/guest-tokens/active", async (_req, res) => {
    try {
      const activeTokens = await storage.getActiveGuestTokens();
      res.json(activeTokens);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active tokens" });
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

  // Get all problems
  app.get("/api/problems", authenticateToken, async (req, res) => {
    try {
      const problems = await storage.getAllProblems();
      res.json(problems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch problems" });
    }
  });

  // Get active problems only
  app.get("/api/problems/active", authenticateToken, async (req, res) => {
    try {
      const problems = await storage.getActiveProblems();
      res.json(problems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active problems" });
    }
  });

  // Get problems for specific capsule
  app.get("/api/capsules/:number/problems", authenticateToken, async (req, res) => {
    try {
      const { number } = req.params;
      const problems = await storage.getCapsuleProblems(number);
      res.json(problems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch capsule problems" });
    }
  });

  // Report new problem
  app.post("/api/problems", authenticateToken, async (req: any, res) => {
    try {
      const validatedData = createCapsuleProblemSchema.parse(req.body);
      
      // Check if capsule already has an active problem
      const existingProblems = await storage.getCapsuleProblems(validatedData.capsuleNumber);
      const hasActiveProblem = existingProblems.some(p => !p.isResolved);
      
      if (hasActiveProblem) {
        return res.status(400).json({ 
          message: "This capsule already has an active problem. Please resolve it first." 
        });
      }
      
      const problem = await storage.createCapsuleProblem({
        ...validatedData,
        reportedBy: req.user.username || req.user.email || "Unknown",
      });
      
      res.json(problem);
    } catch (error: any) {
      console.error("Error creating problem:", error);
      res.status(400).json({ message: error.message || "Failed to create problem" });
    }
  });

  // Resolve problem
  app.patch("/api/problems/:id/resolve", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      
      const resolvedBy = req.user.username || req.user.email || "Unknown";
      const problem = await storage.resolveProblem(id, resolvedBy, notes);
      
      if (!problem) {
        return res.status(404).json({ message: "Problem not found" });
      }

      res.json(problem);
    } catch (error: any) {
      console.error("Error resolving problem:", error);
      res.status(400).json({ message: error.message || "Failed to resolve problem" });
    }
  });

  // Admin notification routes
  app.get("/api/admin/notifications", authenticateToken, async (req, res) => {
    try {
      const notifications = await storage.getAdminNotifications();
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get("/api/admin/notifications/unread", authenticateToken, async (req, res) => {
    try {
      const notifications = await storage.getUnreadAdminNotifications();
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch unread notifications" });
    }
  });

  app.patch("/api/admin/notifications/:id/read", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const notification = await storage.markNotificationAsRead(id);
      
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }

      res.json(notification);
    } catch (error) {
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.patch("/api/admin/notifications/read-all", authenticateToken, async (req, res) => {
    try {
      await storage.markAllNotificationsAsRead();
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  // Settings routes
  app.get("/api/settings", authenticateToken, async (req, res) => {
    try {
      const guestTokenExpirationHours = await storage.getGuestTokenExpirationHours();
      res.json({
        guestTokenExpirationHours,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.patch("/api/settings", authenticateToken, async (req: any, res) => {
    try {
      const validatedData = updateSettingsSchema.parse(req.body);
      const updatedBy = req.user.username || req.user.email || "Unknown";
      
      // Update guest token expiration setting
      await storage.setSetting(
        'guestTokenExpirationHours',
        validatedData.guestTokenExpirationHours.toString(),
        'Hours before guest check-in tokens expire',
        updatedBy
      );

      res.json({
        message: "Settings updated successfully",
        guestTokenExpirationHours: validatedData.guestTokenExpirationHours,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update settings" });
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

  // User Management API endpoints
  // Get all users
  app.get("/api/users", authenticateToken, async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to get users" });
    }
  });

  // Create new user
  app.post("/api/users", authenticateToken, async (req: any, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user with email already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(409).json({ message: "User with this email already exists" });
      }
      
      // Check if user with username already exists
      if (userData.username) {
        const existingUsername = await storage.getUserByUsername(userData.username);
        if (existingUsername) {
          return res.status(409).json({ message: "User with this username already exists" });
        }
      }

      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error) {
      console.error("Create user error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Update user
  app.patch("/api/users/:id", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      // Remove empty password field
      if (updates.password === "") {
        delete updates.password;
      }
      
      const user = await storage.updateUser(id, updates);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Delete user
  app.delete("/api/users/:id", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteUser(id);
      
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Guest token management routes
  app.post("/api/guest-tokens", authenticateToken, async (req: any, res) => {
    try {
      const validatedData = createTokenSchema.parse(req.body);
      const userId = req.user.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }

      // Generate unique token
      const tokenValue = randomUUID();
      const expiresAt = new Date();
      const expirationHours = await storage.getGuestTokenExpirationHours();
      expiresAt.setHours(expiresAt.getHours() + expirationHours);

      const token = await storage.createGuestToken({
        token: tokenValue,
        capsuleNumber: validatedData.capsuleNumber,
        guestName: validatedData.guestName,
        phoneNumber: validatedData.phoneNumber,
        email: validatedData.email,
        expectedCheckoutDate: validatedData.expectedCheckoutDate,
        createdBy: userId,
        expiresAt,
      });

      res.json({
        token: token.token,
        link: `${req.protocol}://${req.get('host')}/guest-checkin?token=${token.token}`,
        capsuleNumber: token.capsuleNumber,
        guestName: token.guestName,
        expiresAt: token.expiresAt,
      });
    } catch (error: any) {
      console.error("Error creating guest token:", error);
      res.status(400).json({ message: error.message || "Failed to create guest token" });
    }
  });

  // Validate guest token (public route)
  app.get("/api/guest-tokens/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const guestToken = await storage.getGuestToken(token);

      if (!guestToken) {
        return res.status(404).json({ message: "Token not found" });
      }

      if (guestToken.isUsed) {
        return res.status(400).json({ message: "Token already used" });
      }

      if (new Date() > guestToken.expiresAt) {
        return res.status(400).json({ message: "Token expired" });
      }

      res.json({
        capsuleNumber: guestToken.capsuleNumber,
        guestName: guestToken.guestName,
        phoneNumber: guestToken.phoneNumber,
        email: guestToken.email,
        expectedCheckoutDate: guestToken.expectedCheckoutDate,
        expiresAt: guestToken.expiresAt,
      });
    } catch (error: any) {
      console.error("Error validating guest token:", error);
      res.status(500).json({ message: "Failed to validate token" });
    }
  });

  // Guest self-check-in (public route)
  app.post("/api/guest-checkin/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const guestToken = await storage.getGuestToken(token);

      if (!guestToken) {
        return res.status(404).json({ message: "Invalid token" });
      }

      if (guestToken.isUsed) {
        return res.status(400).json({ message: "Token already used" });
      }

      if (new Date() > guestToken.expiresAt) {
        return res.status(400).json({ message: "Token expired" });
      }

      const validatedGuestData = guestSelfCheckinSchema.parse(req.body);

      // Create guest with token's capsule and self-check-in data
      const guest = await storage.createGuest({
        name: validatedGuestData.nameAsInDocument,
        capsuleNumber: guestToken.capsuleNumber,
        phoneNumber: guestToken.phoneNumber,
        email: guestToken.email || undefined,
        gender: validatedGuestData.gender,
        nationality: validatedGuestData.nationality,
        idNumber: validatedGuestData.icNumber || validatedGuestData.passportNumber || undefined,
        expectedCheckoutDate: guestToken.expectedCheckoutDate || undefined,
        paymentAmount: "0", // Will be updated at front desk
        paymentMethod: validatedGuestData.paymentMethod,
        paymentCollector: "Self Check-in",
        isPaid: false,
        selfCheckinToken: token, // Store the token for edit access
        notes: `IC: ${validatedGuestData.icNumber || 'N/A'}, Passport: ${validatedGuestData.passportNumber || 'N/A'}${validatedGuestData.icDocumentUrl ? `, IC Doc: ${validatedGuestData.icDocumentUrl}` : ''}${validatedGuestData.passportDocumentUrl ? `, Passport Doc: ${validatedGuestData.passportDocumentUrl}` : ''}`,
      });

      // Mark token as used
      await storage.markTokenAsUsed(token);

      // Create admin notification for self-check-in
      await storage.createAdminNotification({
        type: "self_checkin",
        title: "New Self Check-In",
        message: `${validatedGuestData.nameAsInDocument} has completed self check-in to capsule ${guestToken.capsuleNumber}. Payment method: ${validatedGuestData.paymentMethod}`,
        guestId: guest.id,
        capsuleNumber: guestToken.capsuleNumber,
        isRead: false,
      });

      res.json({
        message: "Check-in successful",
        guest: guest,
        capsuleNumber: guestToken.capsuleNumber,
        editToken: token, // Provide token for editing within 1 hour
        editExpiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      });
    } catch (error: any) {
      console.error("Error processing guest check-in:", error);
      res.status(400).json({ message: error.message || "Failed to complete check-in" });
    }
  });

  // Guest self-edit route (within 1 hour of check-in)
  app.get("/api/guest-edit/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const guestToken = await storage.getGuestToken(token);

      if (!guestToken) {
        return res.status(404).json({ message: "Invalid edit link" });
      }

      if (!guestToken.isUsed) {
        return res.status(400).json({ message: "Check-in not completed yet" });
      }

      // Check if edit window has expired (1 hour after check-in)
      const oneHourAfterUsed = new Date(guestToken.usedAt!.getTime() + 60 * 60 * 1000);
      if (new Date() > oneHourAfterUsed) {
        return res.status(400).json({ message: "Edit window has expired" });
      }

      // Find the guest associated with this token
      const guests = await storage.getAllGuests();
      const guest = guests.find(g => g.selfCheckinToken === token);

      if (!guest) {
        return res.status(404).json({ message: "Guest not found" });
      }

      res.json({
        guest: guest,
        capsuleNumber: guestToken.capsuleNumber,
        editExpiresAt: oneHourAfterUsed,
      });
    } catch (error: any) {
      console.error("Error validating edit token:", error);
      res.status(500).json({ message: "Failed to validate edit token" });
    }
  });

  // Update guest information (within 1 hour of check-in)
  app.put("/api/guest-edit/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const guestToken = await storage.getGuestToken(token);

      if (!guestToken) {
        return res.status(404).json({ message: "Invalid edit link" });
      }

      if (!guestToken.isUsed) {
        return res.status(400).json({ message: "Check-in not completed yet" });
      }

      // Check if edit window has expired (1 hour after check-in)
      const oneHourAfterUsed = new Date(guestToken.usedAt!.getTime() + 60 * 60 * 1000);
      if (new Date() > oneHourAfterUsed) {
        return res.status(400).json({ message: "Edit window has expired" });
      }

      // Find the guest associated with this token
      const guests = await storage.getAllGuests();
      const guest = guests.find(g => g.selfCheckinToken === token);

      if (!guest) {
        return res.status(404).json({ message: "Guest not found" });
      }

      const validatedGuestData = guestSelfCheckinSchema.parse(req.body);

      // Update guest information
      const updatedGuest = await storage.updateGuest(guest.id, {
        name: validatedGuestData.nameAsInDocument,
        gender: validatedGuestData.gender,
        nationality: validatedGuestData.nationality,
        idNumber: validatedGuestData.icNumber || validatedGuestData.passportNumber || undefined,
        paymentMethod: validatedGuestData.paymentMethod,
        notes: `IC: ${validatedGuestData.icNumber || 'N/A'}, Passport: ${validatedGuestData.passportNumber || 'N/A'}${validatedGuestData.icDocumentUrl ? `, IC Doc: ${validatedGuestData.icDocumentUrl}` : ''}${validatedGuestData.passportDocumentUrl ? `, Passport Doc: ${validatedGuestData.passportDocumentUrl}` : ''}`,
      });

      res.json({
        message: "Information updated successfully",
        guest: updatedGuest,
      });
    } catch (error: any) {
      console.error("Error updating guest information:", error);
      res.status(400).json({ message: error.message || "Failed to update information" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
