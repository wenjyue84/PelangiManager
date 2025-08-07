import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const guests = pgTable("guests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  capsuleNumber: text("capsule_number").notNull(),
  checkinTime: timestamp("checkin_time").notNull().defaultNow(),
  checkoutTime: timestamp("checkout_time"),
  isCheckedIn: boolean("is_checked_in").notNull().default(true),
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
});

export const checkoutGuestSchema = z.object({
  id: z.string().min(1, "Guest ID is required"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Guest = typeof guests.$inferSelect;
export type InsertGuest = z.infer<typeof insertGuestSchema>;
export type CheckoutGuest = z.infer<typeof checkoutGuestSchema>;
