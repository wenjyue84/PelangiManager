import { 
  type User, type InsertUser, type Guest, type InsertGuest, type Capsule, type InsertCapsule, type Session,
  type MaintenanceProblem, type InsertMaintenanceProblem, type Setting, type InsertSetting, 
  type Notification, type InsertNotification, type SelfCheckin,
  users, guests, capsules, sessions, maintenanceProblems, settings, notifications 
} from "@shared/schema";

export interface IStorage {
  // User management methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
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
  
  // Maintenance problem methods
  createMaintenanceProblem(problem: InsertMaintenanceProblem): Promise<MaintenanceProblem>;
  getMaintenanceProblems(): Promise<MaintenanceProblem[]>;
  getActiveMaintenanceProblems(): Promise<MaintenanceProblem[]>;
  getCapsuleMaintenanceProblems(capsuleId: string): Promise<MaintenanceProblem[]>;
  resolveMaintenanceProblem(problemId: string, resolvedBy: string): Promise<MaintenanceProblem | undefined>;
  
  // Settings methods
  getSetting(key: string): Promise<Setting | undefined>;
  setSetting(setting: InsertSetting): Promise<Setting>;
  getAllSettings(): Promise<Setting[]>;
  
  // Notification methods
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotifications(userId?: string): Promise<Notification[]>;
  markNotificationAsRead(notificationId: string): Promise<boolean>;
  
  // Guest self-check-in methods
  createGuestLink(capsuleNumber: string, expiryHours?: number): Promise<{ token: string; expiryTime: Date }>;
  validateGuestLink(token: string): Promise<{ valid: boolean; capsuleNumber?: string }>;
  selfCheckinGuest(token: string, guestData: SelfCheckin): Promise<Guest | undefined>;
  getGuestByToken(token: string): Promise<Guest | undefined>;
}

// Import the database storage implementation
import { DatabaseStorage } from "./database-storage";

export const storage = new DatabaseStorage();