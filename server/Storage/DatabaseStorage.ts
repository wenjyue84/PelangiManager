import { type User, type InsertUser, type Guest, type InsertGuest, type Capsule, type InsertCapsule, type Session, type GuestToken, type InsertGuestToken, type CapsuleProblem, type InsertCapsuleProblem, type AdminNotification, type InsertAdminNotification, type AppSetting, type InsertAppSetting, type PaginationParams, type PaginatedResponse, type Expense, type InsertExpense, type UpdateExpense, users, guests, capsules, sessions, guestTokens, capsuleProblems, adminNotifications, appSettings, expenses } from "../../shared/schema";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, ne, and, lte, isNotNull, isNull, count } from "drizzle-orm";
import { IStorage } from "./IStorage";

// Database Storage Implementation
export class DatabaseStorage implements IStorage {
  private db;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    const sql = neon(process.env.DATABASE_URL);
    this.db = drizzle(sql);
  }

  // Helper function for pagination
  private paginate<T>(items: T[], pagination?: PaginationParams): PaginatedResponse<T> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const paginatedItems = items.slice(startIndex, endIndex);
    const total = items.length;
    const totalPages = Math.ceil(total / limit);
    const hasMore = page < totalPages;
    
    return {
      data: paginatedItems,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore,
      },
    };
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
    // Handle checkInDate to checkinTime conversion
    const { checkInDate, ...insertData } = insertGuest;
    if (checkInDate) {
      // Parse YYYY-MM-DD format and set time to current time
      const [year, month, day] = checkInDate.split('-').map(Number);
      const now = new Date();
      insertData.checkinTime = new Date(year, month - 1, day, now.getHours(), now.getMinutes(), now.getSeconds());
    }

    const result = await this.db.insert(guests).values(insertData).returning();
    return result[0];
  }

  async getGuest(id: string): Promise<Guest | undefined> {
    const result = await this.db.select().from(guests).where(eq(guests.id, id)).limit(1);
    return result[0];
  }

  async getAllGuests(pagination?: PaginationParams): Promise<PaginatedResponse<Guest>> {
    const allGuests = await this.db.select().from(guests);
    return this.paginate(allGuests, pagination);
  }

  async getCheckedInGuests(pagination?: PaginationParams): Promise<PaginatedResponse<Guest>> {
    const checkedInGuests = await this.db.select().from(guests).where(eq(guests.isCheckedIn, true));
    return this.paginate(checkedInGuests, pagination);
  }

  async getGuestHistory(pagination?: PaginationParams): Promise<PaginatedResponse<Guest>> {
    const guestHistory = await this.db.select().from(guests).where(eq(guests.isCheckedIn, false));
    return this.paginate(guestHistory, pagination);
  }

  async checkoutGuest(id: string): Promise<Guest | undefined> {
    const result = await this.db.update(guests).set({
      checkoutTime: new Date(),
      isCheckedIn: false,
    }).where(eq(guests.id, id)).returning();

    // Mark capsule as needing cleaning after checkout
    if (result[0]?.capsuleNumber) {
      await this.db.update(capsules).set({
        cleaningStatus: "to_be_cleaned",
        isAvailable: true,
      }).where(eq(capsules.number, result[0].capsuleNumber));
    }

    return result[0];
  }

  async updateGuest(id: string, updates: Partial<Guest>): Promise<Guest | undefined> {
    const result = await this.db.update(guests).set(updates).where(eq(guests.id, id)).returning();
    return result[0];
  }

  async getGuestsWithCheckoutToday(): Promise<Guest[]> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    return await this.db.select().from(guests).where(
      and(
        eq(guests.isCheckedIn, true),
        eq(guests.expectedCheckoutDate, today)
      )
    );
  }

  async getCapsuleOccupancy(): Promise<{ total: number; occupied: number; available: number; occupancyRate: number }> {
    const checkedInGuestsResponse = await this.getCheckedInGuests();
    const occupied = checkedInGuestsResponse.pagination.total;
    const totalCapsules = 22;
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
    const occupiedCapsules = new Set(checkedInGuests.data.map(guest => guest.capsuleNumber));

    const availableCapsules = await this.db.select().from(capsules).where(
      and(
        eq(capsules.isAvailable, true),
        eq(capsules.cleaningStatus, "cleaned")
      )
    );

    return availableCapsules.filter(capsule => !occupiedCapsules.has(capsule.number));
  }

  async getUncleanedAvailableCapsules(): Promise<Capsule[]> {
    const checkedInGuests = await this.getCheckedInGuests();
    const occupiedCapsules = new Set(checkedInGuests.data.map(guest => guest.capsuleNumber));

    const uncleanedCapsules = await this.db.select().from(capsules).where(
      and(
        eq(capsules.isAvailable, true),
        eq(capsules.cleaningStatus, "to_be_cleaned")
      )
    );

    return uncleanedCapsules.filter(capsule => !occupiedCapsules.has(capsule.number));
  }

  async getAllCapsules(): Promise<Capsule[]> {
    return await this.db.select().from(capsules);
  }

  async getCapsule(number: string): Promise<Capsule | undefined> {
    const result = await this.db.select().from(capsules).where(eq(capsules.number, number)).limit(1);
    return result[0];
  }

  async getCapsuleById(id: string): Promise<Capsule | undefined> {
    const result = await this.db.select().from(capsules).where(eq(capsules.id, id)).limit(1);
    return result[0];
  }

  async updateCapsule(number: string, updates: Partial<Capsule>): Promise<Capsule | undefined> {
    const result = await this.db.update(capsules).set(updates).where(eq(capsules.number, number)).returning();
    return result[0];
  }

  async markCapsuleCleaned(capsuleNumber: string, cleanedBy: string): Promise<Capsule | undefined> {
    const result = await this.db.update(capsules).set({
      cleaningStatus: "cleaned",
      lastCleanedAt: new Date(),
      lastCleanedBy: cleanedBy,
    }).where(eq(capsules.number, capsuleNumber)).returning();
    return result[0];
  }

  async markCapsuleNeedsCleaning(capsuleNumber: string): Promise<Capsule | undefined> {
    const result = await this.db.update(capsules).set({
      cleaningStatus: "to_be_cleaned",
      lastCleanedAt: null,
      lastCleanedBy: null,
    }).where(eq(capsules.number, capsuleNumber)).returning();
    return result[0];
  }

  async getCapsulesByCleaningStatus(status: "cleaned" | "to_be_cleaned"): Promise<Capsule[]> {
    return await this.db.select().from(capsules).where(eq(capsules.cleaningStatus, status));
  }

  async createCapsule(capsule: InsertCapsule): Promise<Capsule> {
    const result = await this.db.insert(capsules).values(capsule).returning();
    return result[0];
  }

  async deleteCapsule(number: string): Promise<boolean> {
    try {
      // Delete related problems first
      await this.db.delete(capsuleProblems).where(eq(capsuleProblems.capsuleNumber, number));
      
      const result = await this.db.delete(capsules).where(eq(capsules.number, number)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting capsule:", error);
      return false;
    }
  }

  async getGuestsByCapsule(capsuleNumber: string): Promise<Guest[]> {
    return await this.db.select().from(guests).where(
      and(
        eq(guests.capsuleNumber, capsuleNumber),
        eq(guests.isCheckedIn, true)
      )
    );
  }

  async getGuestByCapsuleAndName(capsuleNumber: string, name: string): Promise<Guest | undefined> {
    const result = await this.db.select().from(guests).where(
      and(
        eq(guests.capsuleNumber, capsuleNumber),
        eq(guests.name, name),
        eq(guests.isCheckedIn, true)
      )
    ).limit(1);
    return result[0];
  }

  async getGuestByToken(token: string): Promise<Guest | undefined> {
    const result = await this.db.select().from(guests).where(eq(guests.selfCheckinToken, token)).limit(1);
    return result[0];
  }

  // Capsule problem methods for DatabaseStorage
  async createCapsuleProblem(problem: InsertCapsuleProblem): Promise<CapsuleProblem> {
    const result = await this.db.insert(capsuleProblems).values(problem).returning();
    return result[0];
  }

  async getCapsuleProblems(capsuleNumber: string): Promise<CapsuleProblem[]> {
    return await this.db.select().from(capsuleProblems).where(eq(capsuleProblems.capsuleNumber, capsuleNumber)).orderBy(capsuleProblems.reportedAt);
  }

  async getActiveProblems(pagination?: PaginationParams): Promise<PaginatedResponse<CapsuleProblem>> {
    const activeProblems = await this.db.select().from(capsuleProblems).where(eq(capsuleProblems.isResolved, false)).orderBy(capsuleProblems.reportedAt);
    return this.paginate(activeProblems, pagination);
  }

  async getAllProblems(pagination?: PaginationParams): Promise<PaginatedResponse<CapsuleProblem>> {
    const allProblems = await this.db.select().from(capsuleProblems).orderBy(capsuleProblems.reportedAt);
    return this.paginate(allProblems, pagination);
  }

  async resolveProblem(problemId: string, resolvedBy: string, notes?: string): Promise<CapsuleProblem | undefined> {
    const result = await this.db.update(capsuleProblems).set({
      isResolved: true,
      resolvedBy,
      resolvedAt: new Date(),
      notes: notes || null,
    }).where(eq(capsuleProblems.id, problemId)).returning();
    return result[0];
  }

  async deleteProblem(problemId: string): Promise<boolean> {
    try {
      const result = await this.db.delete(capsuleProblems).where(eq(capsuleProblems.id, problemId)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting problem:", error);
      return false;
    }
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
    const result = await this.db.update(guestTokens).set({
      isUsed: true,
      usedAt: new Date(),
    }).where(eq(guestTokens.token, token)).returning();
    return result[0];
  }

  async deleteGuestToken(id: string): Promise<boolean> {
    try {
      const result = await this.db.delete(guestTokens).where(eq(guestTokens.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting guest token:", error);
      return false;
    }
  }

  async getActiveGuestTokens(pagination?: PaginationParams): Promise<PaginatedResponse<GuestToken>> {
    const now = new Date();
    const activeTokens = await this.db.select().from(guestTokens).where(
      and(
        eq(guestTokens.isUsed, false),
        isNotNull(guestTokens.expiresAt)
      )
    ).orderBy(guestTokens.createdAt);

    // Filter out expired tokens (this could be done in SQL but keeping it simple)
    const nonExpiredTokens = activeTokens.filter(token => 
      token.expiresAt && token.expiresAt > now
    );

    return this.paginate(nonExpiredTokens, pagination);
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

  async getAdminNotifications(pagination?: PaginationParams): Promise<PaginatedResponse<AdminNotification>> {
    const allNotifications = await this.db.select().from(adminNotifications).orderBy(adminNotifications.createdAt);
    return this.paginate(allNotifications, pagination);
  }

  async getUnreadAdminNotifications(pagination?: PaginationParams): Promise<PaginatedResponse<AdminNotification>> {
    const unreadNotifications = await this.db.select().from(adminNotifications).where(eq(adminNotifications.isRead, false)).orderBy(adminNotifications.createdAt);
    return this.paginate(unreadNotifications, pagination);
  }

  async markNotificationAsRead(id: string): Promise<AdminNotification | undefined> {
    const result = await this.db.update(adminNotifications).set({
      isRead: true,
    }).where(eq(adminNotifications.id, id)).returning();
    return result[0];
  }

  async markAllNotificationsAsRead(): Promise<void> {
    await this.db.update(adminNotifications).set({
      isRead: true,
    }).where(eq(adminNotifications.isRead, false));
  }

  // App settings methods for DatabaseStorage
  async getSetting(key: string): Promise<AppSetting | undefined> {
    const result = await this.db.select().from(appSettings).where(eq(appSettings.key, key)).limit(1);
    return result[0];
  }

  async setSetting(key: string, value: string, description?: string, updatedBy?: string): Promise<AppSetting> {
    // Validate input parameters
    if (!key || typeof key !== 'string' || key.trim() === '') {
      throw new Error('Setting key is required and must be a non-empty string');
    }
    
    if (value === null || value === undefined) {
      throw new Error('Setting value is required');
    }

    const trimmedKey = key.trim();
    const stringValue = String(value);
    
    const existing = await this.getSetting(trimmedKey);
    
    if (existing) {
      const result = await this.db.update(appSettings).set({
        value: stringValue,
        description: description || existing.description,
        updatedBy,
        updatedAt: new Date(),
      }).where(eq(appSettings.key, trimmedKey)).returning();
      return result[0];
    } else {
      const result = await this.db.insert(appSettings).values({
        key: trimmedKey,
        value: stringValue,
        description: description || null,
        updatedBy: updatedBy || null,
      }).returning();
      return result[0];
    }
  }

  async getAllSettings(): Promise<AppSetting[]> {
    return await this.db.select().from(appSettings);
  }

  async getGuestTokenExpirationHours(): Promise<number> {
    const setting = await this.getSetting("guestTokenExpirationHours");
    return setting ? parseInt(setting.value) : 24; // Default to 24 hours
  }

  async getAppSetting(key: string): Promise<AppSetting | undefined> {
    return this.getSetting(key);
  }

  async upsertAppSetting(setting: InsertAppSetting): Promise<AppSetting> {
    return this.setSetting(setting.key, setting.value, setting.description, setting.updatedBy);
  }

  async getAllAppSettings(): Promise<AppSetting[]> {
    return this.getAllSettings();
  }

  async deleteAppSetting(key: string): Promise<boolean> {
    const result = await this.db.delete(appSettings).where(eq(appSettings.key, key)).returning();
    return result.length > 0;
  }

  // Expense management methods for DatabaseStorage
  async getExpenses(pagination?: PaginationParams): Promise<PaginatedResponse<Expense>> {
    if (!pagination) {
      const data = await this.db.select().from(expenses).orderBy(expenses.createdAt);
      return {
        data,
        pagination: {
          page: 1,
          limit: data.length,
          total: data.length,
          totalPages: 1,
          hasMore: false,
        },
      };
    }

    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;

    // Get total count and paginated data
    const [totalResult, data] = await Promise.all([
      this.db.select({ count: count() }).from(expenses),
      this.db.select().from(expenses)
        .orderBy(expenses.createdAt)
        .limit(limit)
        .offset(offset),
    ]);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / limit);
    const hasMore = page < totalPages;

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore,
      },
    };
  }

  async addExpense(expense: InsertExpense & { createdBy: string }): Promise<Expense> {
    const result = await this.db.insert(expenses).values({
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
      subcategory: expense.subcategory || null,
      date: expense.date,
      notes: expense.notes || null,
      receiptPhotoUrl: expense.receiptPhotoUrl || null,
      itemPhotoUrl: expense.itemPhotoUrl || null,
      createdBy: expense.createdBy,
    }).returning();
    return result[0];
  }

  async updateExpense(expense: UpdateExpense): Promise<Expense | undefined> {
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Only include fields that are actually being updated
    if (expense.description !== undefined) updateData.description = expense.description;
    if (expense.amount !== undefined) updateData.amount = expense.amount;
    if (expense.category !== undefined) updateData.category = expense.category;
    if (expense.subcategory !== undefined) updateData.subcategory = expense.subcategory;
    if (expense.date !== undefined) updateData.date = expense.date;
    if (expense.notes !== undefined) updateData.notes = expense.notes;
    if (expense.receiptPhotoUrl !== undefined) updateData.receiptPhotoUrl = expense.receiptPhotoUrl;
    if (expense.itemPhotoUrl !== undefined) updateData.itemPhotoUrl = expense.itemPhotoUrl;

    const result = await this.db.update(expenses).set(updateData).where(eq(expenses.id, expense.id)).returning();
    return result[0];
  }

  async deleteExpense(id: string): Promise<boolean> {
    const result = await this.db.delete(expenses).where(eq(expenses.id, id)).returning();
    return result.length > 0;
  }
}
