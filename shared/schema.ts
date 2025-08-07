import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("staff"), // 'admin' or 'staff'
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
  gender: text("gender"), // Optional field
  nationality: text("nationality"), // Optional field
  icNumber: text("ic_number"),
  passportNumber: text("passport_number"),
  icPhotoUrl: text("ic_photo_url"),
  passportPhotoUrl: text("passport_photo_url"),
  checkinSource: text("checkin_source").default("staff"), // 'staff' or 'self'
  guestLinkToken: text("guest_link_token"),
  guestLinkExpiry: timestamp("guest_link_expiry"),
  canEditUntil: timestamp("can_edit_until")
});

export const capsules = pgTable("capsules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  number: text("number").notNull().unique(),
  section: text("section").notNull(), // 'back', 'middle', 'front'
  isAvailable: boolean("is_available").notNull().default(true),
  problemDescription: text("problem_description"),
  problemReportedAt: timestamp("problem_reported_at"),
  problemResolvedAt: timestamp("problem_resolved_at"),
});

export const maintenanceProblems = pgTable("maintenance_problems", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  capsuleId: varchar("capsule_id").references(() => capsules.id),
  description: text("description").notNull(),
  reportedBy: varchar("reported_by").references(() => users.id),
  reportedAt: timestamp("reported_at").defaultNow(),
  resolvedBy: varchar("resolved_by").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  status: text("status").default("active"), // 'active' or 'resolved'
});

export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").unique().notNull(),
  value: text("value"),
  category: text("category").default("general"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // 'self_checkin', 'maintenance', 'checkout_reminder'
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  userId: varchar("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertGuestSchema = createInsertSchema(guests).omit({
  id: true,
  checkinTime: true,
  checkoutTime: true,
  isCheckedIn: true,
  guestLinkToken: true,
  guestLinkExpiry: true,
  canEditUntil: true,
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
  icNumber: z.string().optional(),
  passportNumber: z.string().optional(),
  icPhotoUrl: z.string().optional(),
  passportPhotoUrl: z.string().optional(),
  checkinSource: z.enum(["staff", "self"]).optional().default("staff"),
});

export const insertMaintenanceProblemSchema = createInsertSchema(maintenanceProblems).omit({
  id: true,
  reportedAt: true,
  resolvedAt: true,
}).extend({
  capsuleId: z.string().min(1, "Capsule is required"),
  description: z.string().min(1, "Problem description is required"),
  reportedBy: z.string().min(1, "Reporter is required"),
});

export const insertSettingSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true,
}).extend({
  key: z.string().min(1, "Setting key is required"),
  value: z.string().optional(),
  category: z.string().optional().default("general"),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
}).extend({
  type: z.enum(["self_checkin", "maintenance", "checkout_reminder"]),
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
  userId: z.string().optional(),
});

export const selfCheckinSchema = z.object({
  name: z.string().min(1, "Name is required"),
  nationality: z.string().min(1, "Nationality is required"),
  gender: z.enum(["male", "female", "other"]).optional(),
  icNumber: z.string().optional(),
  passportNumber: z.string().optional(),
  icPhotoUrl: z.string().optional(),
  passportPhotoUrl: z.string().optional(),
  notes: z.string().optional(),
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
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const updateCapsuleProblemSchema = z.object({
  problemDescription: z.string().optional(),
  isAvailable: z.boolean().optional(),
});

export const bulkGuestImportSchema = z.array(
  insertGuestSchema.extend({
    checkinTime: z.string().optional(), // ISO date string
  })
);

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
export type UpdateCapsuleProblem = z.infer<typeof updateCapsuleProblemSchema>;
export type BulkGuestImport = z.infer<typeof bulkGuestImportSchema>;
export type MaintenanceProblem = typeof maintenanceProblems.$inferSelect;
export type InsertMaintenanceProblem = z.infer<typeof insertMaintenanceProblemSchema>;
export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type SelfCheckin = z.infer<typeof selfCheckinSchema>;
