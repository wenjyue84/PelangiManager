import { ConfigService, ConfigUtils } from "./config";
import { type IStorage } from "./storage";

// Global configuration manager instance
let configService: ConfigService | null = null;
let configUtils: ConfigUtils | null = null;

/**
 * Initialize the configuration service
 */
export async function initializeConfig(storage: IStorage): Promise<void> {
  configService = new ConfigService(storage);
  configUtils = new ConfigUtils(configService);
  
  // Initialize default settings in the database
  await configService.initializeDefaults('system');
  
  console.log('✅ Configuration service initialized');
}

/**
 * Get the configuration service instance
 */
export function getConfig(): ConfigService {
  if (!configService) {
    throw new Error('Configuration service not initialized. Call initializeConfig() first.');
  }
  return configService;
}

/**
 * Get the configuration utilities instance
 */
export function getConfigUtils(): ConfigUtils {
  if (!configUtils) {
    throw new Error('Configuration utilities not initialized. Call initializeConfig() first.');
  }
  return configUtils;
}

/**
 * Common configuration getters for frequently used values
 */
export class AppConfig {
  private static config: ConfigService | null = null;
  private static utils: ConfigUtils | null = null;

  static initialize(config: ConfigService, utils: ConfigUtils) {
    this.config = config;
    this.utils = utils;
  }

  // Token and Session Settings
  static async getTokenExpirationHours(): Promise<number> {
    return this.config!.get('guestTokenExpirationHours');
  }

  static async getSessionExpirationHours(): Promise<number> {
    return this.config!.get('sessionExpirationHours');
  }

  static async getTokenExpirationMs(): Promise<number> {
    return this.utils!.getTokenExpirationMs();
  }

  static async getSessionExpirationMs(): Promise<number> {
    return this.utils!.getSessionExpirationMs();
  }

  // System Settings
  static async getDefaultUserRole(): Promise<string> {
    return this.config!.get('defaultUserRole');
  }

  static async getMaxGuestStayDays(): Promise<number> {
    return this.config!.get('maxGuestStayDays');
  }

  // Payment Settings
  static async getDefaultPaymentMethod(): Promise<string> {
    return this.config!.get('defaultPaymentMethod');
  }

  static async getMaxPaymentAmount(): Promise<number> {
    return this.config!.get('maxPaymentAmount');
  }

  // Capsule Settings
  static async getTotalCapsules(): Promise<number> {
    return this.config!.get('totalCapsules');
  }

  static async getCapsuleSections(): Promise<string[]> {
    return this.config!.get('capsuleSections');
  }

  static async getCapsuleNumberFormat(): Promise<string> {
    return this.config!.get('capsuleNumberFormat');
  }

  // Cache and Performance
  static async getCacheTimeMinutes(): Promise<number> {
    return this.config!.get('cacheTimeMinutes');
  }

  static async getQueryRefreshIntervalSeconds(): Promise<number> {
    return this.config!.get('queryRefreshIntervalSeconds');
  }

  static async getCacheDurationMs(): Promise<number> {
    return this.utils!.getCacheDurationMs();
  }

  static async getQueryRefreshIntervalMs(): Promise<number> {
    return this.utils!.getQueryRefreshIntervalMs();
  }

  // Pagination Settings
  static async getDefaultPageSize(): Promise<number> {
    return this.config!.get('defaultPageSize');
  }

  static async getMaxPageSize(): Promise<number> {
    return this.config!.get('maxPageSize');
  }

  // Business Rules
  static async getMinGuestAge(): Promise<number> {
    return this.config!.get('minGuestAge');
  }

  static async getMaxGuestAge(): Promise<number> {
    return this.config!.get('maxGuestAge');
  }

  static async isValidAge(age: number): Promise<boolean> {
    return this.utils!.isValidAge(age);
  }

  // Contact Information
  static async getDefaultAdminEmail(): Promise<string> {
    return this.config!.get('defaultAdminEmail');
  }

  static async getSupportEmail(): Promise<string> {
    return this.config!.get('supportEmail');
  }

  static async getSupportPhone(): Promise<string> {
    return this.config!.get('supportPhone');
  }

  // Application Settings
  static async getHostelName(): Promise<string> {
    return this.config!.get('hostelName');
  }

  static async getTimezone(): Promise<string> {
    return this.config!.get('timezone');
  }

  // Notification Settings
  static async getNotificationRetentionDays(): Promise<number> {
    return this.config!.get('notificationRetentionDays');
  }
}

/**
 * Configuration middleware for Express routes
 */
export function configMiddleware() {
  return (req: any, res: any, next: any) => {
    // Attach config to request object
    req.config = getConfig();
    req.configUtils = getConfigUtils();
    req.AppConfig = AppConfig;
    next();
  };
}

/**
 * Helper function to get all configuration as JSON for API responses
 */
export async function getConfigForAPI(): Promise<{
  settings: any;
  metadata: any[];
}> {
  const config = getConfig();
  const settings = await config.getAll();
  const metadata = await config.getAllWithMetadata();
  
  return {
    settings,
    metadata,
  };
}

/**
 * Validation helper for configuration updates
 */
export async function validateConfigUpdate(
  updates: Record<string, any>
): Promise<{ valid: boolean; errors: string[] }> {
  const config = getConfig();
  const errors: string[] = [];
  
  try {
    // This will validate all the updates against the schema
    await config.updateMultiple(updates, 'validation');
    return { valid: true, errors: [] };
  } catch (error: any) {
    if (error.errors && Array.isArray(error.errors)) {
      error.errors.forEach((err: any) => {
        errors.push(`${err.path?.join('.')}: ${err.message}`);
      });
    } else {
      errors.push(error.message || 'Invalid configuration update');
    }
    
    return { valid: false, errors };
  }
}