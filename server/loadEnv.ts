/**
 * Load .env from project root before any other server code runs.
 * Ensures DATABASE_URL is set when StorageFactory creates the storage instance.
 */
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "..", ".env");
dotenv.config({ path: envPath });
