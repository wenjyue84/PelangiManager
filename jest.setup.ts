import 'jest';

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

beforeAll(() => {
  // Only show console errors/warnings in verbose mode
  console.error = jest.fn();
  console.warn = jest.fn();
  console.log = jest.fn();
});

afterAll(() => {
  // Restore console methods
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  console.log = originalConsoleLog;
});

// Global test utilities
global.testUtils = {
  createMockGuest: () => ({
    id: 'test-guest-id',
    name: 'John Doe',
    capsuleNumber: 'A01',
    checkinTime: new Date('2024-01-01T10:00:00Z'),
    checkoutTime: null,
    expectedCheckoutDate: new Date('2024-01-02'),
    isCheckedIn: true,
    paymentAmount: '50.00',
    paymentMethod: 'cash' as const,
    paymentCollector: 'admin',
    isPaid: true,
    notes: 'Test guest',
    gender: 'male' as const,
    nationality: 'Malaysian',
    phoneNumber: '+60123456789',
    email: 'john@example.com',
    idNumber: '950101-01-1234',
    emergencyContact: 'Jane Doe',
    emergencyPhone: '+60123456788',
    age: '29',
    selfCheckinToken: null,
  }),

  createMockUser: () => ({
    id: 'test-user-id',
    email: 'admin@test.com',
    username: 'testadmin',
    password: 'hashedpassword',
    googleId: null,
    firstName: 'Test',
    lastName: 'Admin',
    profileImage: null,
    role: 'admin' as const,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  }),

  createMockCapsule: () => ({
    id: 'test-capsule-id',
    number: 'A01',
    section: 'front' as const,
    isAvailable: true,
  }),

  createMockSession: () => ({
    id: 'test-session-id',
    userId: 'test-user-id',
    token: 'test-session-token',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    createdAt: new Date(),
  }),

  createMockGuestToken: () => ({
    id: 'test-token-id',
    token: 'test-guest-token-123456',
    capsuleNumber: 'A01',
    guestName: 'John Doe',
    phoneNumber: '+60123456789',
    email: 'john@example.com',
    expectedCheckoutDate: '2024-01-02',
    createdBy: 'test-user-id',
    isUsed: false,
    usedAt: null,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    createdAt: new Date(),
  }),
};

// Declare global types for TypeScript
declare global {
  var testUtils: {
    createMockGuest: () => any;
    createMockUser: () => any;
    createMockCapsule: () => any;
    createMockSession: () => any;
    createMockGuestToken: () => any;
  };
}