import { type User, type InsertUser, type Guest, type InsertGuest, users, guests } from "@shared/schema";
import { randomUUID } from "crypto";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Guest management methods
  createGuest(guest: InsertGuest): Promise<Guest>;
  getGuest(id: string): Promise<Guest | undefined>;
  getAllGuests(): Promise<Guest[]>;
  getCheckedInGuests(): Promise<Guest[]>;
  getGuestHistory(): Promise<Guest[]>;
  checkoutGuest(id: string): Promise<Guest | undefined>;
  getCapsuleOccupancy(): Promise<{ total: number; occupied: number; available: number; occupancyRate: number }>;
  getAvailableCapsules(): Promise<string[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private guests: Map<string, Guest>;
  private totalCapsules = 24; // A-01 to A-08, B-01 to B-08, C-01 to C-08

  constructor() {
    this.users = new Map();
    this.guests = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createGuest(insertGuest: InsertGuest): Promise<Guest> {
    const id = randomUUID();
    const guest: Guest = {
      ...insertGuest,
      id,
      checkinTime: new Date(),
      checkoutTime: null,
      isCheckedIn: true,
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

  async getAvailableCapsules(): Promise<string[]> {
    const allCapsules = [];
    
    // Generate capsule numbers A-01 to A-08, B-01 to B-08, C-01 to C-08
    for (const section of ['A', 'B', 'C']) {
      for (let i = 1; i <= 8; i++) {
        allCapsules.push(`${section}-${i.toString().padStart(2, '0')}`);
      }
    }

    const checkedInGuests = await this.getCheckedInGuests();
    const occupiedCapsules = new Set(checkedInGuests.map(guest => guest.capsuleNumber));

    return allCapsules.filter(capsule => !occupiedCapsules.has(capsule));
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

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(insertUser).returning();
    return result[0];
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

  async getCapsuleOccupancy(): Promise<{ total: number; occupied: number; available: number; occupancyRate: number }> {
    const checkedInGuests = await this.getCheckedInGuests();
    const occupied = checkedInGuests.length;
    const totalCapsules = 24;
    const available = totalCapsules - occupied;
    const occupancyRate = Math.round((occupied / totalCapsules) * 100);

    return {
      total: totalCapsules,
      occupied,
      available,
      occupancyRate,
    };
  }

  async getAvailableCapsules(): Promise<string[]> {
    const allCapsules = [];
    
    // Generate capsule numbers A-01 to A-08, B-01 to B-08, C-01 to C-08
    for (const section of ['A', 'B', 'C']) {
      for (let i = 1; i <= 8; i++) {
        allCapsules.push(`${section}-${i.toString().padStart(2, '0')}`);
      }
    }

    const checkedInGuests = await this.getCheckedInGuests();
    const occupiedCapsules = new Set(checkedInGuests.map(guest => guest.capsuleNumber));

    return allCapsules.filter(capsule => !occupiedCapsules.has(capsule));
  }
}

// Use database storage if DATABASE_URL is available, otherwise use memory storage
export const storage = process.env.DATABASE_URL 
  ? new DatabaseStorage() 
  : new MemStorage();
