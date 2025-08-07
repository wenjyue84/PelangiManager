import { type User, type InsertUser, type Guest, type InsertGuest, type Capsule, type InsertCapsule, type Session, type GuestToken, type InsertGuestToken, type CapsuleProblem, type InsertCapsuleProblem, type AdminNotification, type InsertAdminNotification, type AppSetting, type InsertAppSetting, users, guests, capsules, sessions, guestTokens, capsuleProblems, adminNotifications, appSettings } from "@shared/schema";
import { randomUUID } from "crypto";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, ne, and, lte, isNotNull } from "drizzle-orm";

export interface IStorage {
  // User management methods
  getUser(id: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  
  // Session management methods
  createSession(userId: string, token: string, expiresAt: Date): Promise<Session>;
  getSessionByToken(token: string): Promise<Session | undefined>;
  deleteSession(token: string): Promise<boolean>;
  cleanExpiredSessions(): Promise<void>;
  
  // Guest management methods
  createGuest(guest: InsertGuest): Promise<Guest>;
  getGuest(id: string): Promise<Guest | undefined>;
  getAllGuests(): Promise<Guest[]>;
  getCheckedInGuests(): Promise<Guest[]>;
  getGuestHistory(): Promise<Guest[]>;
  checkoutGuest(id: string): Promise<Guest | undefined>;
  updateGuest(id: string, updates: Partial<Guest>): Promise<Guest | undefined>;
  getGuestsWithCheckoutToday(): Promise<Guest[]>;
  getCapsuleOccupancy(): Promise<{ total: number; occupied: number; available: number; occupancyRate: number }>;
  getAvailableCapsules(): Promise<Capsule[]>;
  
  // Capsule management methods
  getAllCapsules(): Promise<Capsule[]>;
  getCapsule(number: string): Promise<Capsule | undefined>;
  updateCapsule(number: string, updates: Partial<Capsule>): Promise<Capsule | undefined>;
  createCapsule(capsule: InsertCapsule): Promise<Capsule>;
  
  // Capsule problem management
  createCapsuleProblem(problem: InsertCapsuleProblem): Promise<CapsuleProblem>;
  getCapsuleProblems(capsuleNumber: string): Promise<CapsuleProblem[]>;
  getActiveProblems(): Promise<CapsuleProblem[]>;
  getAllProblems(): Promise<CapsuleProblem[]>;
  resolveProblem(problemId: string, resolvedBy: string, notes?: string): Promise<CapsuleProblem | undefined>;

  // Guest token management methods
  createGuestToken(token: InsertGuestToken): Promise<GuestToken>;
  getGuestToken(token: string): Promise<GuestToken | undefined>;
  markTokenAsUsed(token: string): Promise<GuestToken | undefined>;
  cleanExpiredTokens(): Promise<void>;

  // Admin notification methods
  createAdminNotification(notification: InsertAdminNotification): Promise<AdminNotification>;
  getAdminNotifications(): Promise<AdminNotification[]>;
  getUnreadAdminNotifications(): Promise<AdminNotification[]>;
  markNotificationAsRead(id: string): Promise<AdminNotification | undefined>;
  markAllNotificationsAsRead(): Promise<void>;

  // App settings methods
  getSetting(key: string): Promise<AppSetting | undefined>;
  setSetting(key: string, value: string, description?: string, updatedBy?: string): Promise<AppSetting>;
  getAllSettings(): Promise<AppSetting[]>;
  getGuestTokenExpirationHours(): Promise<number>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private guests: Map<string, Guest>;
  private capsules: Map<string, Capsule>;
  private sessions: Map<string, Session>;
  private guestTokens: Map<string, GuestToken>;
  private capsuleProblems: Map<string, CapsuleProblem>;
  private adminNotifications: Map<string, AdminNotification>;
  private appSettings: Map<string, AppSetting>;
  private totalCapsules = 22; // C1-C6 (6) + C25-C26 (2) + C11-C24 (14)

  constructor() {
    this.users = new Map();
    this.guests = new Map();
    this.capsules = new Map();
    this.sessions = new Map();
    this.guestTokens = new Map();
    this.capsuleProblems = new Map();
    this.adminNotifications = new Map();
    this.appSettings = new Map();
    
    // Initialize capsules, admin user, and sample guests
    this.initializeCapsules();
    this.initializeDefaultUsers();
    this.initializeDefaultSettings();
    this.initializeSampleGuests();
  }

  private initializeDefaultUsers() {
    // Create default admin user
    const adminUser: User = {
      id: randomUUID(),
      email: "admin@pelangi.com",
      username: "admin",
      password: "admin123", // In production, this should be hashed
      googleId: null,
      firstName: "Admin",
      lastName: "User",
      profileImage: null,
      role: "staff",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(adminUser.id, adminUser);
    console.log("Initialized default admin user with email:", adminUser.email);
  }

  private initializeSampleGuests() {
    const sampleGuests = [
      { name: "Keong", capsule: "C1", phone: "017-6632979", checkin: "2025-08-07T15:00:00", checkout: "2025-08-08", nights: 1 },
      { name: "Prem", capsule: "C4", phone: "019-7418889", checkin: "2025-08-07T15:00:00", checkout: "2025-08-08", nights: 1 },
      { name: "Jeevan", capsule: "C5", phone: "010-5218906", checkin: "2025-08-07T15:00:00", checkout: "2025-08-08", nights: 1 },
      { name: "Ahmad", capsule: "C25", phone: "012-3456789", checkin: "2025-08-06T15:00:00", checkout: "2025-08-08", nights: 2 },
      { name: "Wei Ming", capsule: "C26", phone: "011-9876543", checkin: "2025-08-07T15:00:00", checkout: "2025-08-09", nights: 2 },
      { name: "Raj", capsule: "C11", phone: "013-2468135", checkin: "2025-08-07T15:00:00", checkout: "2025-08-08", nights: 1 },
      { name: "Hassan", capsule: "C12", phone: "014-3579246", checkin: "2025-08-06T15:00:00", checkout: "2025-08-08", nights: 2 },
      { name: "Li Wei", capsule: "C13", phone: "015-4681357", checkin: "2025-08-07T15:00:00", checkout: "2025-08-10", nights: 3 },
      { name: "Muthu", capsule: "C14", phone: "016-5792468", checkin: "2025-08-07T15:00:00", checkout: "2025-08-08", nights: 1 },
      { name: "Chen", capsule: "C15", phone: "017-6813579", checkin: "2025-08-06T15:00:00", checkout: "2025-08-09", nights: 3 },
      { name: "Kumar", capsule: "C17", phone: "018-8135792", checkin: "2025-08-07T15:00:00", checkout: "2025-08-08", nights: 1 },
      { name: "Farid", capsule: "C18", phone: "019-9246813", checkin: "2025-08-06T15:00:00", checkout: "2025-08-08", nights: 2 },
      { name: "Ibrahim", capsule: "C21", phone: "012-3579135", checkin: "2025-08-07T15:00:00", checkout: "2025-08-08", nights: 1 },
      { name: "Wong", capsule: "C22", phone: "013-4681246", checkin: "2025-08-06T15:00:00", checkout: "2025-08-08", nights: 2 },
    ];

    sampleGuests.forEach(guest => {
      const guestRecord: Guest = {
        id: randomUUID(),
        name: guest.name,
        capsuleNumber: guest.capsule,
        checkinTime: new Date(guest.checkin),
        checkoutTime: null,
        expectedCheckoutDate: guest.checkout,
        isCheckedIn: true,
        paymentAmount: `${guest.nights * 35}`, // RM35 per night
        paymentMethod: "cash",
        paymentCollector: "Admin",
        isPaid: true,
        notes: null,
        gender: null,
        nationality: null,
        phoneNumber: guest.phone,
        email: null,
        idNumber: null,
        emergencyContact: null,
        emergencyPhone: null,
        age: null,
      };
      
      this.guests.set(guestRecord.id, guestRecord);
      
      // Mark capsule as occupied
      const capsule = this.capsules.get(guest.capsule);
      if (capsule) {
        capsule.isAvailable = false;
        this.capsules.set(guest.capsule, capsule);
      }
    });

    console.log(`Initialized ${sampleGuests.length} sample guests`);
  }

  private initializeCapsules() {
    // Back section: C1-C6
    for (let i = 1; i <= 6; i++) {
      const capsule: Capsule = {
        id: randomUUID(),
        number: `C${i}`,
        section: 'back',
        isAvailable: true,
        problemDescription: null,
        problemReportedAt: null,
        problemResolvedAt: null,
      };
      this.capsules.set(capsule.number, capsule);
    }
    
    // Middle section: C25, C26
    for (const num of [25, 26]) {
      const capsule: Capsule = {
        id: randomUUID(),
        number: `C${num}`,
        section: 'middle',
        isAvailable: true,
        problemDescription: null,
        problemReportedAt: null,
        problemResolvedAt: null,
      };
      this.capsules.set(capsule.number, capsule);
    }
    
    // Front section: C11-C24
    for (let i = 11; i <= 24; i++) {
      const capsule: Capsule = {
        id: randomUUID(),
        number: `C${i}`,
        section: 'front',
        isAvailable: true,
        problemDescription: null,
        problemReportedAt: null,
        problemResolvedAt: null,
      };
      this.capsules.set(capsule.number, capsule);
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.googleId === googleId,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      role: insertUser.role || "staff",
      username: insertUser.username || null,
      password: insertUser.password || null,
      googleId: insertUser.googleId || null,
      firstName: insertUser.firstName || null,
      lastName: insertUser.lastName || null,
      profileImage: insertUser.profileImage || null,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) {
      return undefined;
    }

    const updatedUser: User = {
      ...user,
      ...updates,
      updatedAt: new Date(),
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  // Session management methods
  async createSession(userId: string, token: string, expiresAt: Date): Promise<Session> {
    const session: Session = {
      id: randomUUID(),
      userId,
      token,
      expiresAt,
      createdAt: new Date(),
    };
    this.sessions.set(token, session);
    return session;
  }

  async getSessionByToken(token: string): Promise<Session | undefined> {
    return this.sessions.get(token);
  }

  async deleteSession(token: string): Promise<boolean> {
    return this.sessions.delete(token);
  }

  async cleanExpiredSessions(): Promise<void> {
    const now = new Date();
    const sessionsArray = Array.from(this.sessions.entries());
    for (const [token, session] of sessionsArray) {
      if (session.expiresAt < now) {
        this.sessions.delete(token);
      }
    }
  }

  async createGuest(insertGuest: InsertGuest): Promise<Guest> {
    const id = randomUUID();
    const guest: Guest = {
      ...insertGuest,
      id,
      checkinTime: new Date(),
      checkoutTime: null,
      isCheckedIn: true,
      expectedCheckoutDate: insertGuest.expectedCheckoutDate || null,
      paymentAmount: insertGuest.paymentAmount || null,
      paymentMethod: insertGuest.paymentMethod || "cash",
      paymentCollector: insertGuest.paymentCollector || null,
      isPaid: insertGuest.isPaid || false,
      notes: insertGuest.notes || null,
      gender: insertGuest.gender || null,
      nationality: insertGuest.nationality || null,
      phoneNumber: insertGuest.phoneNumber || null,
      email: insertGuest.email || null,
      idNumber: insertGuest.idNumber || null,
      emergencyContact: insertGuest.emergencyContact || null,
      emergencyPhone: insertGuest.emergencyPhone || null,
      age: insertGuest.age || null,
    };
    this.guests.set(id, guest);
    return guest;
  }

  async getGuest(id: string): Promise<Guest | undefined> {
    return this.guests.get(id);
  }

  async getAllGuests(): Promise<Guest[]> {
    return Array.from(this.guests.values());
  }

  async getCheckedInGuests(): Promise<Guest[]> {
    return Array.from(this.guests.values()).filter(guest => guest.isCheckedIn);
  }

  async getGuestHistory(): Promise<Guest[]> {
    return Array.from(this.guests.values()).filter(guest => !guest.isCheckedIn);
  }

  async checkoutGuest(id: string): Promise<Guest | undefined> {
    const guest = this.guests.get(id);
    if (guest && guest.isCheckedIn) {
      const updatedGuest: Guest = {
        ...guest,
        checkoutTime: new Date(),
        isCheckedIn: false,
      };
      this.guests.set(id, updatedGuest);
      return updatedGuest;
    }
    return undefined;
  }

  async updateGuest(id: string, updates: Partial<Guest>): Promise<Guest | undefined> {
    const guest = this.guests.get(id);
    if (guest) {
      const updatedGuest = { ...guest, ...updates };
      this.guests.set(id, updatedGuest);
      return updatedGuest;
    }
    return undefined;
  }

  async getGuestsWithCheckoutToday(): Promise<Guest[]> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    return Array.from(this.guests.values()).filter(
      guest => guest.isCheckedIn && 
      guest.expectedCheckoutDate === today
    );
  }

  async getCapsuleOccupancy(): Promise<{ total: number; occupied: number; available: number; occupancyRate: number }> {
    const checkedInGuests = await this.getCheckedInGuests();
    const occupied = checkedInGuests.length;
    const available = this.totalCapsules - occupied;
    const occupancyRate = Math.round((occupied / this.totalCapsules) * 100);

    return {
      total: this.totalCapsules,
      occupied,
      available,
      occupancyRate,
    };
  }

  async getAvailableCapsules(): Promise<Capsule[]> {
    const checkedInGuests = await this.getCheckedInGuests();
    const occupiedCapsules = new Set(checkedInGuests.map(guest => guest.capsuleNumber));
    
    return Array.from(this.capsules.values()).filter(
      capsule => capsule.isAvailable && !occupiedCapsules.has(capsule.number)
    );
  }

  async getAllCapsules(): Promise<Capsule[]> {
    return Array.from(this.capsules.values());
  }

  async getCapsule(number: string): Promise<Capsule | undefined> {
    return this.capsules.get(number);
  }

  async updateCapsule(number: string, updates: Partial<Capsule>): Promise<Capsule | undefined> {
    const capsule = this.capsules.get(number);
    if (capsule) {
      const updatedCapsule = { ...capsule, ...updates };
      this.capsules.set(number, updatedCapsule);
      
      // Check if we're marking capsule as available again (problem resolved)
      if (updates.isAvailable === true && !capsule.isAvailable) {
        // Auto-resolve any active problems for this capsule
        const problems = Array.from(this.capsuleProblems.values()).filter(
          p => p.capsuleNumber === number && !p.isResolved
        );
        for (const problem of problems) {
          problem.isResolved = true;
          problem.resolvedAt = new Date();
          problem.resolvedBy = "System";
          problem.notes = "Auto-resolved when capsule marked as available";
        }
      }
      
      return updatedCapsule;
    }
    return undefined;
  }

  async createCapsule(insertCapsule: InsertCapsule): Promise<Capsule> {
    const id = randomUUID();
    const capsule: Capsule = { 
      ...insertCapsule, 
      id,
    };
    this.capsules.set(capsule.number, capsule);
    return capsule;
  }

  // Capsule problem management
  async createCapsuleProblem(problem: InsertCapsuleProblem): Promise<CapsuleProblem> {
    const id = randomUUID();
    const capsuleProblem: CapsuleProblem = {
      id,
      capsuleNumber: problem.capsuleNumber,
      description: problem.description,
      reportedBy: problem.reportedBy,
      reportedAt: problem.reportedAt || new Date(),
      isResolved: false,
      resolvedBy: null,
      resolvedAt: null,
      notes: null,
    };
    this.capsuleProblems.set(id, capsuleProblem);
    
    // Mark capsule as unavailable
    const capsule = this.capsules.get(problem.capsuleNumber);
    if (capsule) {
      capsule.isAvailable = false;
      this.capsules.set(problem.capsuleNumber, capsule);
    }
    
    return capsuleProblem;
  }

  async getCapsuleProblems(capsuleNumber: string): Promise<CapsuleProblem[]> {
    return Array.from(this.capsuleProblems.values())
      .filter(p => p.capsuleNumber === capsuleNumber)
      .sort((a, b) => b.reportedAt.getTime() - a.reportedAt.getTime());
  }

  async getActiveProblems(): Promise<CapsuleProblem[]> {
    return Array.from(this.capsuleProblems.values())
      .filter(p => !p.isResolved)
      .sort((a, b) => b.reportedAt.getTime() - a.reportedAt.getTime());
  }

  async getAllProblems(): Promise<CapsuleProblem[]> {
    return Array.from(this.capsuleProblems.values())
      .sort((a, b) => b.reportedAt.getTime() - a.reportedAt.getTime());
  }

  async resolveProblem(problemId: string, resolvedBy: string, notes?: string): Promise<CapsuleProblem | undefined> {
    const problem = this.capsuleProblems.get(problemId);
    if (problem) {
      problem.isResolved = true;
      problem.resolvedBy = resolvedBy;
      problem.resolvedAt = new Date();
      problem.notes = notes || null;
      this.capsuleProblems.set(problemId, problem);
      
      // Check if there are any other active problems for this capsule
      const activeProblems = Array.from(this.capsuleProblems.values())
        .filter(p => p.capsuleNumber === problem.capsuleNumber && !p.isResolved);
      
      // If no other active problems, mark capsule as available
      if (activeProblems.length === 0) {
        const capsule = this.capsules.get(problem.capsuleNumber);
        if (capsule) {
          capsule.isAvailable = true;
          this.capsules.set(problem.capsuleNumber, capsule);
        }
      }
      
      return problem;
    }
    return undefined;
  }

  // Guest token management methods
  async createGuestToken(insertToken: InsertGuestToken): Promise<GuestToken> {
    const token: GuestToken = {
      id: randomUUID(),
      token: insertToken.token,
      capsuleNumber: insertToken.capsuleNumber,
      guestName: insertToken.guestName,
      phoneNumber: insertToken.phoneNumber,
      email: insertToken.email || null,
      expectedCheckoutDate: insertToken.expectedCheckoutDate || null,
      createdBy: insertToken.createdBy,
      isUsed: false,
      usedAt: null,
      expiresAt: insertToken.expiresAt,
      createdAt: new Date(),
    };
    this.guestTokens.set(token.token, token);
    return token;
  }

  async getGuestToken(token: string): Promise<GuestToken | undefined> {
    return this.guestTokens.get(token);
  }

  async markTokenAsUsed(token: string): Promise<GuestToken | undefined> {
    const guestToken = this.guestTokens.get(token);
    if (guestToken) {
      const updatedToken = { ...guestToken, isUsed: true, usedAt: new Date() };
      this.guestTokens.set(token, updatedToken);
      return updatedToken;
    }
    return undefined;
  }

  async cleanExpiredTokens(): Promise<void> {
    const now = new Date();
    for (const [token, tokenData] of this.guestTokens) {
      if (tokenData.expiresAt < now) {
        this.guestTokens.delete(token);
      }
    }
  }

  // Admin notification methods
  async createAdminNotification(notification: InsertAdminNotification): Promise<AdminNotification> {
    const id = randomUUID();
    const adminNotification: AdminNotification = {
      id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      guestId: notification.guestId || null,
      capsuleNumber: notification.capsuleNumber || null,
      isRead: false,
      createdAt: new Date(),
    };
    this.adminNotifications.set(id, adminNotification);
    return adminNotification;
  }

  async getAdminNotifications(): Promise<AdminNotification[]> {
    return Array.from(this.adminNotifications.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getUnreadAdminNotifications(): Promise<AdminNotification[]> {
    return Array.from(this.adminNotifications.values())
      .filter(n => !n.isRead)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async markNotificationAsRead(id: string): Promise<AdminNotification | undefined> {
    const notification = this.adminNotifications.get(id);
    if (notification) {
      const updatedNotification = { ...notification, isRead: true };
      this.adminNotifications.set(id, updatedNotification);
      return updatedNotification;
    }
    return undefined;
  }

  async markAllNotificationsAsRead(): Promise<void> {
    for (const [id, notification] of this.adminNotifications) {
      if (!notification.isRead) {
        notification.isRead = true;
        this.adminNotifications.set(id, notification);
      }
    }
  }

  // App settings methods
  async getSetting(key: string): Promise<AppSetting | undefined> {
    return this.appSettings.get(key);
  }

  async setSetting(key: string, value: string, description?: string, updatedBy?: string): Promise<AppSetting> {
    const setting: AppSetting = {
      id: randomUUID(),
      key,
      value,
      description: description || null,
      updatedBy: updatedBy || null,
      updatedAt: new Date(),
    };
    this.appSettings.set(key, setting);
    return setting;
  }

  async getAllSettings(): Promise<AppSetting[]> {
    return Array.from(this.appSettings.values());
  }

  async getGuestTokenExpirationHours(): Promise<number> {
    const setting = await this.getSetting('guestTokenExpirationHours');
    return setting ? parseInt(setting.value) : 24; // Default to 24 hours
  }

  private initializeDefaultSettings(): void {
    // Initialize default settings
    this.setSetting('guestTokenExpirationHours', '24', 'Hours before guest check-in tokens expire');
  }
}

// Database Storage Implementation
class DatabaseStorage implements IStorage {
  private db;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    const sql = neon(process.env.DATABASE_URL);
    this.db = drizzle(sql);
  }

  async getUser(id: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.googleId, googleId)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return await this.db.select().from(users);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const result = await this.db.update(users).set(updates).where(eq(users.id, id)).returning();
    return result[0];
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await this.db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  // Session management methods
  async createSession(userId: string, token: string, expiresAt: Date): Promise<Session> {
    const result = await this.db.insert(sessions).values({
      userId,
      token,
      expiresAt,
    }).returning();
    return result[0];
  }

  async getSessionByToken(token: string): Promise<Session | undefined> {
    const result = await this.db.select().from(sessions).where(eq(sessions.token, token)).limit(1);
    return result[0];
  }

  async deleteSession(token: string): Promise<boolean> {
    const result = await this.db.delete(sessions).where(eq(sessions.token, token)).returning();
    return result.length > 0;
  }

  async cleanExpiredSessions(): Promise<void> {
    await this.db.delete(sessions).where(lte(sessions.expiresAt, new Date()));
  }

  async createGuest(insertGuest: InsertGuest): Promise<Guest> {
    const result = await this.db.insert(guests).values(insertGuest).returning();
    return result[0];
  }

  async getGuest(id: string): Promise<Guest | undefined> {
    const result = await this.db.select().from(guests).where(eq(guests.id, id)).limit(1);
    return result[0];
  }

  async getAllGuests(): Promise<Guest[]> {
    return await this.db.select().from(guests);
  }

  async getCheckedInGuests(): Promise<Guest[]> {
    return await this.db.select().from(guests).where(eq(guests.isCheckedIn, true));
  }

  async getGuestHistory(): Promise<Guest[]> {
    return await this.db.select().from(guests).where(eq(guests.isCheckedIn, false));
  }

  async checkoutGuest(id: string): Promise<Guest | undefined> {
    const result = await this.db
      .update(guests)
      .set({ 
        checkoutTime: new Date(),
        isCheckedIn: false 
      })
      .where(eq(guests.id, id))
      .returning();
    
    return result[0];
  }

  async updateGuest(id: string, updates: Partial<Guest>): Promise<Guest | undefined> {
    const result = await this.db
      .update(guests)
      .set(updates)
      .where(eq(guests.id, id))
      .returning();
    
    return result[0];
  }

  async getGuestsWithCheckoutToday(): Promise<Guest[]> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    return await this.db
      .select()
      .from(guests)
      .where(and(
        eq(guests.isCheckedIn, true),
        eq(guests.expectedCheckoutDate, today)
      ));
  }

  async getCapsuleOccupancy(): Promise<{ total: number; occupied: number; available: number; occupancyRate: number }> {
    const checkedInGuests = await this.getCheckedInGuests();
    const occupied = checkedInGuests.length;
    const totalCapsules = 22; // C1-C6 (6) + C25-C26 (2) + C11-C24 (14) = 22 total
    const available = totalCapsules - occupied;
    const occupancyRate = Math.round((occupied / totalCapsules) * 100);

    return {
      total: totalCapsules,
      occupied,
      available,
      occupancyRate,
    };
  }

  async getAvailableCapsules(): Promise<Capsule[]> {
    const checkedInGuests = await this.getCheckedInGuests();
    const occupiedCapsules = new Set(checkedInGuests.map(guest => guest.capsuleNumber));
    
    const availableCapsules = await this.db
      .select()
      .from(capsules)
      .where(eq(capsules.isAvailable, true));
    
    return availableCapsules.filter(capsule => !occupiedCapsules.has(capsule.number));
  }

  async getAllCapsules(): Promise<Capsule[]> {
    return await this.db.select().from(capsules);
  }

  async getCapsule(number: string): Promise<Capsule | undefined> {
    const result = await this.db.select().from(capsules).where(eq(capsules.number, number)).limit(1);
    return result[0];
  }

  async updateCapsule(number: string, updates: Partial<Capsule>): Promise<Capsule | undefined> {
    const result = await this.db
      .update(capsules)
      .set(updates)
      .where(eq(capsules.number, number))
      .returning();
    
    return result[0];
  }

  async createCapsule(capsule: InsertCapsule): Promise<Capsule> {
    const result = await this.db.insert(capsules).values(capsule).returning();
    return result[0];
  }

  // Capsule problem methods for DatabaseStorage
  async createCapsuleProblem(problem: InsertCapsuleProblem): Promise<CapsuleProblem> {
    const result = await this.db.insert(capsuleProblems).values(problem).returning();
    return result[0];
  }

  async getCapsuleProblems(capsuleNumber: string): Promise<CapsuleProblem[]> {
    return await this.db
      .select()
      .from(capsuleProblems)
      .where(eq(capsuleProblems.capsuleNumber, capsuleNumber))
      .orderBy(capsuleProblems.reportedAt);
  }

  async getActiveProblems(): Promise<CapsuleProblem[]> {
    return await this.db
      .select()
      .from(capsuleProblems)
      .where(eq(capsuleProblems.isResolved, false))
      .orderBy(capsuleProblems.reportedAt);
  }

  async getAllProblems(): Promise<CapsuleProblem[]> {
    return await this.db
      .select()
      .from(capsuleProblems)
      .orderBy(capsuleProblems.reportedAt);
  }

  async resolveProblem(problemId: string, resolvedBy: string, notes?: string): Promise<CapsuleProblem | undefined> {
    const result = await this.db
      .update(capsuleProblems)
      .set({ 
        isResolved: true, 
        resolvedBy, 
        resolvedAt: new Date(), 
        notes: notes || null 
      })
      .where(eq(capsuleProblems.id, problemId))
      .returning();
    
    return result[0];
  }

  // Guest token methods for DatabaseStorage
  async createGuestToken(token: InsertGuestToken): Promise<GuestToken> {
    const result = await this.db.insert(guestTokens).values(token).returning();
    return result[0];
  }

  async getGuestToken(token: string): Promise<GuestToken | undefined> {
    const result = await this.db.select().from(guestTokens).where(eq(guestTokens.token, token)).limit(1);
    return result[0];
  }

  async markTokenAsUsed(token: string): Promise<GuestToken | undefined> {
    const result = await this.db
      .update(guestTokens)
      .set({ isUsed: true, usedAt: new Date() })
      .where(eq(guestTokens.token, token))
      .returning();
    
    return result[0];
  }

  async cleanExpiredTokens(): Promise<void> {
    const now = new Date();
    await this.db.delete(guestTokens).where(lte(guestTokens.expiresAt, now));
  }

  // Admin notification methods for DatabaseStorage
  async createAdminNotification(notification: InsertAdminNotification): Promise<AdminNotification> {
    const result = await this.db.insert(adminNotifications).values(notification).returning();
    return result[0];
  }

  async getAdminNotifications(): Promise<AdminNotification[]> {
    return await this.db
      .select()
      .from(adminNotifications)
      .orderBy(adminNotifications.createdAt);
  }

  async getUnreadAdminNotifications(): Promise<AdminNotification[]> {
    return await this.db
      .select()
      .from(adminNotifications)
      .where(eq(adminNotifications.isRead, false))
      .orderBy(adminNotifications.createdAt);
  }

  async markNotificationAsRead(id: string): Promise<AdminNotification | undefined> {
    const result = await this.db
      .update(adminNotifications)
      .set({ isRead: true })
      .where(eq(adminNotifications.id, id))
      .returning();
    
    return result[0];
  }

  async markAllNotificationsAsRead(): Promise<void> {
    await this.db
      .update(adminNotifications)
      .set({ isRead: true })
      .where(eq(adminNotifications.isRead, false));
  }

  // App settings methods for DatabaseStorage
  async getSetting(key: string): Promise<AppSetting | undefined> {
    const result = await this.db.select().from(appSettings).where(eq(appSettings.key, key)).limit(1);
    return result[0];
  }

  async setSetting(key: string, value: string, description?: string, updatedBy?: string): Promise<AppSetting> {
    // First try to update existing setting
    const existing = await this.getSetting(key);
    if (existing) {
      const result = await this.db
        .update(appSettings)
        .set({ value, description: description || existing.description, updatedBy, updatedAt: new Date() })
        .where(eq(appSettings.key, key))
        .returning();
      return result[0];
    } else {
      // Create new setting
      const result = await this.db
        .insert(appSettings)
        .values({ key, value, description: description || null, updatedBy: updatedBy || null })
        .returning();
      return result[0];
    }
  }

  async getAllSettings(): Promise<AppSetting[]> {
    return await this.db.select().from(appSettings);
  }

  async getGuestTokenExpirationHours(): Promise<number> {
    const setting = await this.getSetting('guestTokenExpirationHours');
    return setting ? parseInt(setting.value) : 24; // Default to 24 hours
  }
}

// Use memory storage for now to avoid database migration issues
export const storage = new MemStorage();
