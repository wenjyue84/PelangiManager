import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  username: text("username"),
  password: text("password"), // nullable for OAuth users
  googleId: text("google_id").unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImage: text("profile_image"),
  role: text("role").notNull().default("staff"), // 'admin' or 'staff'
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Sessions table for authentication
export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const guests = pgTable("guests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  capsuleNumber: text("capsule_number").notNull(),
  checkinTime: timestamp("checkin_time").notNull().defaultNow(),
  checkoutTime: timestamp("checkout_time"),
  expectedCheckoutDate: date("expected_checkout_date"),
  isCheckedIn: boolean("is_checked_in").notNull().default(true),
  paymentAmount: text("payment_amount"),
  paymentMethod: text("payment_method").default("cash"),
  paymentCollector: text("payment_collector"),
  isPaid: boolean("is_paid").notNull().default(false),
  notes: text("notes"),
  gender: text("gender"),
  nationality: text("nationality"),
  phoneNumber: text("phone_number"),
  email: text("email"),
  idNumber: text("id_number"), // Passport/IC number
  emergencyContact: text("emergency_contact"),
  emergencyPhone: text("emergency_phone"),
  age: text("age"),
  selfCheckinToken: text("self_checkin_token"), // Link back to the token used for self check-in
});

export const capsules = pgTable("capsules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  number: text("number").notNull().unique(),
  section: text("section").notNull(), // 'back', 'middle', 'front'
  isAvailable: boolean("is_available").notNull().default(true),
});

// Separate table for tracking all capsule problems
export const capsuleProblems = pgTable("capsule_problems", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  capsuleNumber: text("capsule_number").notNull(),
  description: text("description").notNull(),
  reportedBy: text("reported_by").notNull(), // Username of staff who reported
  reportedAt: timestamp("reported_at").notNull().defaultNow(),
  isResolved: boolean("is_resolved").notNull().default(false),
  resolvedBy: text("resolved_by"), // Username of staff who resolved
  resolvedAt: timestamp("resolved_at"),
  notes: text("notes"), // Resolution notes
});

// Guest check-in tokens for self-service check-in
export const guestTokens = pgTable("guest_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  token: text("token").notNull().unique(),
  capsuleNumber: text("capsule_number").notNull(),
  guestName: text("guest_name").notNull(),
  phoneNumber: text("phone_number").notNull(),
  email: text("email"),
  expectedCheckoutDate: text("expected_checkout_date"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  isUsed: boolean("is_used").notNull().default(false),
  usedAt: timestamp("used_at"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Admin notifications for various events
export const adminNotifications = pgTable("admin_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // 'self_checkin', 'checkout', 'maintenance', etc.
  title: text("title").notNull(),
  message: text("message").notNull(),
  guestId: varchar("guest_id"), // Optional reference to guest
  capsuleNumber: text("capsule_number"), // Optional capsule reference
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  email: z.string().email("Valid email is required"),
  username: z.string().optional(),
  password: z.string().optional(),
  googleId: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  profileImage: z.string().optional(),
});

export const insertGuestSchema = createInsertSchema(guests).omit({
  id: true,
  checkinTime: true,
  checkoutTime: true,
  isCheckedIn: true,
}).extend({
  name: z.string().min(1, "Guest name is required"),
  capsuleNumber: z.string().min(1, "Capsule number is required"),
  paymentAmount: z.string().optional(),
  paymentMethod: z.enum(["cash", "tng", "bank", "platform"]).optional().default("cash"),
  paymentCollector: z.string().min(1, "Payment collector is required"),
  isPaid: z.boolean().default(false),
  notes: z.string().optional(),
  expectedCheckoutDate: z.string().optional(),
  gender: z.string().optional(),
  nationality: z.string().optional(),
  phoneNumber: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  idNumber: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  age: z.string().optional(),
});

export const insertCapsuleSchema = createInsertSchema(capsules).omit({
  id: true,
}).extend({
  number: z.string().min(1, "Capsule number is required"),
  section: z.enum(["back", "middle", "front"], {
    required_error: "Section is required",
  }),
  isAvailable: z.boolean().default(true),
  problemDescription: z.string().optional(),
});

export const checkoutGuestSchema = z.object({
  id: z.string().min(1, "Guest ID is required"),
});

// Authentication schemas
export const loginSchema = z.object({
  email: z.string().min(1, "Username or email is required"), // Allow username or email
  password: z.string().min(1, "Password is required"),
});

export const googleAuthSchema = z.object({
  token: z.string().min(1, "Google token is required"),
});

export const createCapsuleProblemSchema = z.object({
  capsuleNumber: z.string().min(1, "Capsule number is required"),
  description: z.string().min(1, "Problem description is required"),
  reportedBy: z.string().min(1, "Reporter is required"),
});

export const resolveProblemSchema = z.object({
  resolvedBy: z.string().min(1, "Resolver is required"),
  notes: z.string().optional(),
});

export const bulkGuestImportSchema = z.array(
  insertGuestSchema.extend({
    checkinTime: z.string().optional(), // ISO date string
  })
);

// Guest self-check-in schema (simplified)
export const guestSelfCheckinSchema = z.object({
  nameAsInDocument: z.string().min(1, "Full name as in IC/passport is required"),
  gender: z.enum(["male", "female"], { required_error: "Gender is required" }),
  nationality: z.string().min(1, "Nationality is required"),
  icNumber: z.string().optional(),
  passportNumber: z.string().optional(),
  icDocumentUrl: z.string().optional(),
  passportDocumentUrl: z.string().optional(),
  paymentMethod: z.enum(["cash", "card", "online_transfer"], { required_error: "Payment method is required" }),
}).refine((data) => data.icNumber || data.passportNumber, {
  message: "Either IC number or passport number is required",
  path: ["icNumber"],
}).refine((data) => {
  if (data.icNumber && !data.icDocumentUrl) return false;
  if (data.passportNumber && !data.passportDocumentUrl) return false;
  return true;
}, {
  message: "Document photo is required",
  path: ["icDocumentUrl"],
});

// Token creation schema with guest info
export const createTokenSchema = z.object({
  capsuleNumber: z.string().min(1, "Capsule number is required"),
  guestName: z.string().min(1, "Guest name is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  email: z.string().email().optional(),
  expectedCheckoutDate: z.string().optional(),
  expiresInHours: z.number().min(1).max(168).default(24), // 1-168 hours (1 week max)
});

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Guest = typeof guests.$inferSelect;
export type InsertGuest = z.infer<typeof insertGuestSchema>;
export type CheckoutGuest = z.infer<typeof checkoutGuestSchema>;
export type Capsule = typeof capsules.$inferSelect;
export type InsertCapsule = z.infer<typeof insertCapsuleSchema>;
export type Session = typeof sessions.$inferSelect;
export type LoginRequest = z.infer<typeof loginSchema>;
export type CreateCapsuleProblem = z.infer<typeof createCapsuleProblemSchema>;
export type ResolveProblem = z.infer<typeof resolveProblemSchema>;
export type CapsuleProblem = typeof capsuleProblems.$inferSelect;
export type InsertCapsuleProblem = typeof capsuleProblems.$inferInsert;
export type BulkGuestImport = z.infer<typeof bulkGuestImportSchema>;
export type GuestToken = typeof guestTokens.$inferSelect;
export type InsertGuestToken = typeof guestTokens.$inferInsert;
export type AdminNotification = typeof adminNotifications.$inferSelect;
export type InsertAdminNotification = typeof adminNotifications.$inferInsert;
export type GuestSelfCheckin = z.infer<typeof guestSelfCheckinSchema>;
export type CreateToken = z.infer<typeof createTokenSchema>;

// Admin notification schema for validation
export const insertAdminNotificationSchema = createInsertSchema(adminNotifications).omit({ 
  id: true, 
  createdAt: true 
});

// App settings table
export const appSettings = pgTable("app_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedBy: varchar("updated_by"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type AppSetting = typeof appSettings.$inferSelect;
export type InsertAppSetting = typeof appSettings.$inferInsert;

// Settings schemas
export const updateSettingsSchema = z.object({
  guestTokenExpirationHours: z.number().min(1).max(168, "Maximum 168 hours (7 days)").default(24),
});

export type UpdateSettings = z.infer<typeof updateSettingsSchema>;
