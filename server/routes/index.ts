import { Express } from "express";
import authRoutes from "./auth";
import guestRoutes from "./guests";
import guestTokenRoutes from "./guest-tokens";
import capsuleRoutes from "./capsules";
import adminRoutes from "./admin";
import problemRoutes from "./problems";
import settingsRoutes from "./settings";
import expenseRoutes from "./expenses";
import objectRoutes from "./objects";
import dashboardRoutes from "./dashboard";
<<<<<<< HEAD
import testRoutes from "./tests";
=======
>>>>>>> 69ba485cefd6e0d7fab3d7a2d39f873e678bb69d

export function registerRoutes(app: Express) {
  // Register auth routes
  app.use("/api/auth", authRoutes);
  
  // Register guest routes
  app.use("/api/guests", guestRoutes);
  
  // Register guest token routes
  app.use("/api/guest-tokens", guestTokenRoutes);
  
  // Register capsule routes
  app.use("/api/capsules", capsuleRoutes);
  // Register admin routes
  app.use("/api/admin", adminRoutes);
  // Register problem tracking routes
  app.use("/api/problems", problemRoutes);
  // Register settings routes
  app.use("/api/settings", settingsRoutes);
  
  // Register expense routes
  app.use("/api/expenses", expenseRoutes);
  
  // Register object storage routes (includes both /api/objects and /objects paths)
  app.use("", objectRoutes);
  
  // Register dashboard routes (includes /api/dashboard, /api/occupancy, /api/calendar)
  app.use("/api", dashboardRoutes);
  
  // Register test routes
  app.use("/api/tests", testRoutes);
}