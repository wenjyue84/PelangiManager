import { 
  type User, type InsertUser, type Guest, type InsertGuest, type Capsule, type InsertCapsule, type Session,
  type MaintenanceProblem, type InsertMaintenanceProblem, type Setting, type InsertSetting, 
  type Notification, type InsertNotification, type SelfCheckin,
  users, guests, capsules, sessions, maintenanceProblems, settings, notifications 
} from "@shared/schema";
import { randomUUID } from "crypto";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, ne, and, lte, isNotNull, isNull, desc, count, gte } from "drizzle-orm";
import type { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  private db;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    const sql = neon(process.env.DATABASE_URL);
    this.db = drizzle(sql);
  }

  // User management methods
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

  // Guest management methods
  async createGuest(insertGuest: InsertGuest): Promise<Guest> {
    const result = await this.db.insert(guests).values(insertGuest).returning();
    return result[0];
  }

  async getGuest(id: string): Promise<Guest | undefined> {
    const result = await this.db.select().from(guests).where(eq(guests.id, id)).limit(1);
    return result[0];
  }

  async getAllGuests(): Promise<Guest[]> {
    return await this.db.select().from(guests).orderBy(desc(guests.checkinTime));
  }

  async getCheckedInGuests(): Promise<Guest[]> {
    return await this.db.select().from(guests).where(eq(guests.isCheckedIn, true)).orderBy(desc(guests.checkinTime));
  }

  async getGuestHistory(): Promise<Guest[]> {
    return await this.db.select().from(guests).where(eq(guests.isCheckedIn, false)).orderBy(desc(guests.checkoutTime));
  }

  async checkoutGuest(id: string): Promise<Guest | undefined> {
    const result = await this.db
      .update(guests)
      .set({
        checkoutTime: new Date(),
        isCheckedIn: false,
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
    const today = new Date().toISOString().split('T')[0];
    return await this.db.select().from(guests).where(
      and(
        eq(guests.isCheckedIn, true),
        eq(guests.expectedCheckoutDate, today)
      )
    );
  }

  async getCapsuleOccupancy(): Promise<{ total: number; occupied: number; available: number; occupancyRate: number }> {
    const [occupancyResult] = await this.db
      .select({ count: count() })
      .from(guests)
      .where(eq(guests.isCheckedIn, true));

    const occupied = occupancyResult.count;
    const total = 22; // Fixed total capsules
    const available = total - occupied;
    const occupancyRate = Math.round((occupied / total) * 100);

    return { total, occupied, available, occupancyRate };
  }

  async getAvailableCapsules(): Promise<Capsule[]> {
    // Get occupied capsule numbers
    const occupiedCapsules = await this.db
      .select({ capsuleNumber: guests.capsuleNumber })
      .from(guests)
      .where(eq(guests.isCheckedIn, true));

    const occupiedNumbers = occupiedCapsules.map(c => c.capsuleNumber);

    // Get available capsules that are not occupied and don't have active problems
    const availableCapsules = await this.db
      .select()
      .from(capsules)
      .where(
        and(
          eq(capsules.isAvailable, true),
          isNull(capsules.problemDescription)
        )
      );

    return availableCapsules.filter(capsule => !occupiedNumbers.includes(capsule.number));
  }

  // Capsule management methods
  async getAllCapsules(): Promise<Capsule[]> {
    return await this.db.select().from(capsules).orderBy(capsules.number);
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

  async createCapsule(insertCapsule: InsertCapsule): Promise<Capsule> {
    const result = await this.db.insert(capsules).values(insertCapsule).returning();
    return result[0];
  }

  async getCapsulesWithProblems(): Promise<Capsule[]> {
    return await this.db.select().from(capsules).where(isNotNull(capsules.problemDescription));
  }

  // Maintenance problem methods
  async createMaintenanceProblem(problem: InsertMaintenanceProblem): Promise<MaintenanceProblem> {
    const result = await this.db.insert(maintenanceProblems).values(problem).returning();
    return result[0];
  }

  async getMaintenanceProblems(): Promise<MaintenanceProblem[]> {
    return await this.db.select().from(maintenanceProblems).orderBy(desc(maintenanceProblems.reportedAt));
  }

  async getActiveMaintenanceProblems(): Promise<MaintenanceProblem[]> {
    return await this.db
      .select()
      .from(maintenanceProblems)
      .where(eq(maintenanceProblems.status, 'active'))
      .orderBy(desc(maintenanceProblems.reportedAt));
  }

  async getCapsuleMaintenanceProblems(capsuleId: string): Promise<MaintenanceProblem[]> {
    return await this.db
      .select()
      .from(maintenanceProblems)
      .where(eq(maintenanceProblems.capsuleId, capsuleId))
      .orderBy(desc(maintenanceProblems.reportedAt));
  }

  async resolveMaintenanceProblem(problemId: string, resolvedBy: string): Promise<MaintenanceProblem | undefined> {
    const result = await this.db
      .update(maintenanceProblems)
      .set({
        status: 'resolved',
        resolvedBy: resolvedBy,
        resolvedAt: new Date(),
      })
      .where(eq(maintenanceProblems.id, problemId))
      .returning();
    return result[0];
  }

  // Settings methods
  async getSetting(key: string): Promise<Setting | undefined> {
    const result = await this.db.select().from(settings).where(eq(settings.key, key)).limit(1);
    return result[0];
  }

  async setSetting(setting: InsertSetting): Promise<Setting> {
    const result = await this.db
      .insert(settings)
      .values(setting)
      .onConflictDoUpdate({
        target: settings.key,
        set: {
          value: setting.value,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result[0];
  }

  async getAllSettings(): Promise<Setting[]> {
    return await this.db.select().from(settings).orderBy(settings.category, settings.key);
  }

  // Notification methods
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const result = await this.db.insert(notifications).values(notification).returning();
    return result[0];
  }

  async getNotifications(userId?: string): Promise<Notification[]> {
    if (userId) {
      return await this.db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt));
    }
    return await this.db.select().from(notifications).orderBy(desc(notifications.createdAt));
  }

  async markNotificationAsRead(notificationId: string): Promise<boolean> {
    const result = await this.db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId))
      .returning();
    return result.length > 0;
  }

  // Guest self-check-in methods
  async createGuestLink(capsuleNumber: string, expiryHours = 24): Promise<{ token: string; expiryTime: Date }> {
    const token = randomUUID();
    const expiryTime = new Date();
    expiryTime.setHours(expiryTime.getHours() + expiryHours);

    // Create a placeholder guest record with the link token
    await this.db.insert(guests).values({
      name: '',
      capsuleNumber,
      guestLinkToken: token,
      guestLinkExpiry: expiryTime,
      isCheckedIn: false,
      isPaid: false,
      paymentCollector: '',
      checkinSource: 'self',
    });

    return { token, expiryTime };
  }

  async validateGuestLink(token: string): Promise<{ valid: boolean; capsuleNumber?: string }> {
    const result = await this.db
      .select()
      .from(guests)
      .where(
        and(
          eq(guests.guestLinkToken, token),
          gte(guests.guestLinkExpiry, new Date())
        )
      )
      .limit(1);

    if (result.length > 0) {
      return { valid: true, capsuleNumber: result[0].capsuleNumber };
    }
    return { valid: false };
  }

  async selfCheckinGuest(token: string, guestData: SelfCheckin): Promise<Guest | undefined> {
    const now = new Date();
    const canEditUntil = new Date();
    canEditUntil.setHours(canEditUntil.getHours() + 1); // One-hour edit window

    const result = await this.db
      .update(guests)
      .set({
        name: guestData.name,
        nationality: guestData.nationality,
        gender: guestData.gender,
        icNumber: guestData.icNumber,
        passportNumber: guestData.passportNumber,
        icPhotoUrl: guestData.icPhotoUrl,
        passportPhotoUrl: guestData.passportPhotoUrl,
        notes: guestData.notes,
        checkinTime: now,
        isCheckedIn: true,
        canEditUntil,
        guestLinkToken: null, // Clear the token after use
        guestLinkExpiry: null,
      })
      .where(eq(guests.guestLinkToken, token))
      .returning();

    return result[0];
  }

  async getGuestByToken(token: string): Promise<Guest | undefined> {
    const result = await this.db
      .select()
      .from(guests)
      .where(eq(guests.guestLinkToken, token))
      .limit(1);
    return result[0];
  }
}