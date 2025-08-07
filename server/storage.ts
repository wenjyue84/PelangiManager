import { type User, type InsertUser, type Guest, type InsertGuest } from "@shared/schema";
import { randomUUID } from "crypto";

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

export const storage = new MemStorage();
