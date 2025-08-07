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

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
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
