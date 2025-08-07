import { type User, type InsertUser, type Guest, type InsertGuest, type Capsule, type InsertCapsule, type Session, users, guests, capsules, sessions } from "@shared/schema";
import { randomUUID } from "crypto";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, ne, and, lte, isNotNull } from "drizzle-orm";

export interface IStorage {
  // User management methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
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
  getCapsulesWithProblems(): Promise<Capsule[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private guests: Map<string, Guest>;
  private capsules: Map<string, Capsule>;
  private sessions: Map<string, Session>;
  private totalCapsules = 22; // C1-C6 (6) + C25-C26 (2) + C11-C24 (14)

  constructor() {
    this.users = new Map();
    this.guests = new Map();
    this.capsules = new Map();
    this.sessions = new Map();
    
    // Initialize capsules, admin user, and sample guests
    this.initializeCapsules();
    this.initializeDefaultUsers();
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
        paymentCollector: "Alston",
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
      return updatedCapsule;
    }
    return undefined;
  }

  async createCapsule(insertCapsule: InsertCapsule): Promise<Capsule> {
    const id = randomUUID();
    const capsule: Capsule = { 
      ...insertCapsule, 
      id,
      problemDescription: insertCapsule.problemDescription || null,
      problemReportedAt: null,
      problemResolvedAt: null,
    };
    this.capsules.set(capsule.number, capsule);
    return capsule;
  }

  async getCapsulesWithProblems(): Promise<Capsule[]> {
    return Array.from(this.capsules.values()).filter(
      capsule => capsule.problemDescription !== null
    );
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

  async getCapsulesWithProblems(): Promise<Capsule[]> {
    return await this.db
      .select()
      .from(capsules)
      .where(isNotNull(capsules.problemDescription));
  }
}

// Use memory storage for now to avoid database migration issues
export const storage = new MemStorage();
