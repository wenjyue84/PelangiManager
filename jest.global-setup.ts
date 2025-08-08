export default async function globalSetup() {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
  
  // Any global setup for tests can be added here
  console.log('🧪 Jest Global Setup: Test environment initialized');
}