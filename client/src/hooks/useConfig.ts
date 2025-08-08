import { useQuery } from '@tanstack/react-query';

export interface AppConfig {
  // Token and Session Settings
  guestTokenExpirationHours: number;
  sessionExpirationHours: number;
  
  // System Settings
  defaultUserRole: string;
  maxGuestStayDays: number;
  
  // Payment Settings
  defaultPaymentMethod: string;
  maxPaymentAmount: number;
  
  // Capsule Settings
  totalCapsules: number;
  capsuleSections: string[];
  capsuleNumberFormat: string;
  
  // Notification Settings
  notificationRetentionDays: number;
  
  // Cache and Performance Settings
  cacheTimeMinutes: number;
  queryRefreshIntervalSeconds: number;
  
  // Data Pagination Settings
  defaultPageSize: number;
  maxPageSize: number;
  
  // Business Rules
  minGuestAge: number;
  maxGuestAge: number;
  
  // Contact Information
  defaultAdminEmail: string;
  supportEmail: string;
  supportPhone: string;
  
  // Application Settings
  hostelName: string;
  timezone: string;
}

// Default configuration values (fallback if API is unavailable)
const DEFAULT_CONFIG: AppConfig = {
  guestTokenExpirationHours: 24,
  sessionExpirationHours: 24,
  defaultUserRole: 'staff',
  maxGuestStayDays: 30,
  defaultPaymentMethod: 'cash',
  maxPaymentAmount: 9999.99,
  totalCapsules: 24,
  capsuleSections: ['front', 'middle', 'back'],
  capsuleNumberFormat: 'A01',
  notificationRetentionDays: 30,
  cacheTimeMinutes: 5,
  queryRefreshIntervalSeconds: 30,
  defaultPageSize: 20,
  maxPageSize: 100,
  minGuestAge: 16,
  maxGuestAge: 120,
  defaultAdminEmail: 'admin@pelangicapsule.com',
  supportEmail: 'support@pelangicapsule.com',
  supportPhone: '+60123456789',
  hostelName: 'Pelangi Capsule Hostel',
  timezone: 'Asia/Kuala_Lumpur',
};

/**
 * Hook to fetch and cache application configuration
 */
export function useConfig() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/admin/config'],
    queryFn: async () => {
      const response = await fetch('/api/admin/config');
      if (!response.ok) {
        throw new Error('Failed to fetch configuration');
      }
      const result = await response.json();
      return result.settings as AppConfig;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
  });

  return {
    config: data || DEFAULT_CONFIG,
    isLoading,
    error,
  };
}

/**
 * Hook to get specific configuration values with defaults
 */
export function useConfigValue<K extends keyof AppConfig>(key: K): AppConfig[K] {
  const { config } = useConfig();
  return config[key];
}

/**
 * Hook to get query refresh interval in milliseconds
 */
export function useQueryRefreshInterval(): number {
  const intervalSeconds = useConfigValue('queryRefreshIntervalSeconds');
  return intervalSeconds * 1000;
}

/**
 * Hook to get cache time in milliseconds
 */
export function useCacheTime(): number {
  const cacheMinutes = useConfigValue('cacheTimeMinutes');
  return cacheMinutes * 60 * 1000;
}

/**
 * Hook to get pagination settings
 */
export function usePaginationConfig() {
  const defaultPageSize = useConfigValue('defaultPageSize');
  const maxPageSize = useConfigValue('maxPageSize');
  
  return {
    defaultPageSize,
    maxPageSize,
  };
}

/**
 * Hook to get age validation range
 */
export function useAgeValidation() {
  const minAge = useConfigValue('minGuestAge');
  const maxAge = useConfigValue('maxGuestAge');
  
  return {
    minAge,
    maxAge,
    isValidAge: (age: number) => age >= minAge && age <= maxAge,
  };
}

/**
 * Hook to get payment configuration
 */
export function usePaymentConfig() {
  const defaultMethod = useConfigValue('defaultPaymentMethod');
  const maxAmount = useConfigValue('maxPaymentAmount');
  
  return {
    defaultPaymentMethod: defaultMethod,
    maxPaymentAmount: maxAmount,
    paymentMethods: ['cash', 'tng', 'bank', 'platform'] as const,
  };
}

/**
 * Hook to get capsule configuration
 */
export function useCapsuleConfig() {
  const totalCapsules = useConfigValue('totalCapsules');
  const sections = useConfigValue('capsuleSections');
  const numberFormat = useConfigValue('capsuleNumberFormat');
  
  return {
    totalCapsules,
    sections,
    numberFormat,
    // Helper function to validate capsule number format
    isValidCapsuleNumber: (number: string) => {
      const pattern = numberFormat.replace(/[A-Z]/g, '[A-Z]').replace(/\d/g, '\\d');
      return new RegExp(`^${pattern}$`).test(number);
    },
  };
}

/**
 * Hook to get contact information
 */
export function useContactInfo() {
  const adminEmail = useConfigValue('defaultAdminEmail');
  const supportEmail = useConfigValue('supportEmail');
  const supportPhone = useConfigValue('supportPhone');
  
  return {
    adminEmail,
    supportEmail,
    supportPhone,
  };
}

/**
 * Hook to get application information
 */
export function useAppInfo() {
  const hostelName = useConfigValue('hostelName');
  const timezone = useConfigValue('timezone');
  
  return {
    hostelName,
    timezone,
  };
}