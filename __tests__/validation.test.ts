import { describe, it, expect } from '@jest/globals';
import { 
  insertGuestSchema, 
  insertUserSchema, 
  loginSchema,
  guestSelfCheckinSchema,
  createTokenSchema,
  phoneNumberSchema,
  emailSchema,
  capsuleNumberSchema,
  nameSchema,
  validationUtils
} from '../shared/schema.js';
import { ZodError } from 'zod';

describe('Validation Schemas', () => {
  describe('Guest Validation', () => {
    const validGuestData = {
      name: 'John Doe',
      capsuleNumber: 'A01',
      paymentAmount: '50.00',
      paymentMethod: 'cash' as const,
      paymentCollector: 'admin',
      isPaid: true,
      notes: 'Test guest',
      expectedCheckoutDate: '2024-12-31',
      gender: 'male' as const,
      nationality: 'Malaysian',
      phoneNumber: '+60123456789',
      email: 'john@example.com',
      idNumber: '950101-01-1234',
      emergencyContact: 'Jane Doe',
      emergencyPhone: '+60123456788',
      age: '29',
    };

    it('should validate correct guest data', () => {
      const result = insertGuestSchema.safeParse(validGuestData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid names', () => {
      const invalidNames = [
        '', // empty
        'A', // too short
        'John123', // contains numbers
        'John@Doe', // contains symbols
        'x'.repeat(101), // too long
      ];

      invalidNames.forEach(name => {
        const result = insertGuestSchema.safeParse({
          ...validGuestData,
          name
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors.some(e => e.path.includes('name'))).toBe(true);
        }
      });
    });

    it('should reject invalid capsule numbers', () => {
      const invalidCapsules = [
        '', // empty
        'A1', // too short
        'AA01', // invalid format
        '1A01', // starts with number
        'a01', // lowercase
      ];

      invalidCapsules.forEach(capsuleNumber => {
        const result = insertGuestSchema.safeParse({
          ...validGuestData,
          capsuleNumber
        });
        expect(result.success).toBe(false);
      });
    });

    it('should validate payment amounts correctly', () => {
      const validAmounts = ['0', '50.00', '999.99', '1234.56'];
      const invalidAmounts = ['', '-10', 'abc', '10000.00', '10.001'];

      validAmounts.forEach(paymentAmount => {
        const result = insertGuestSchema.safeParse({
          ...validGuestData,
          paymentAmount
        });
        expect(result.success).toBe(true);
      });

      invalidAmounts.forEach(paymentAmount => {
        const result = insertGuestSchema.safeParse({
          ...validGuestData,
          paymentAmount
        });
        expect(result.success).toBe(false);
      });
    });

    it('should validate phone numbers correctly', () => {
      const validPhones = [
        '+60123456789',
        '+1234567890',
        '0123456789',
        '+60 12 345 6789',
      ];

      const invalidPhones = [
        '123', // too short
        'x'.repeat(21), // too long
        'abcdefghijk', // non-numeric
      ];

      validPhones.forEach(phoneNumber => {
        const result = insertGuestSchema.safeParse({
          ...validGuestData,
          phoneNumber
        });
        expect(result.success).toBe(true);
      });

      invalidPhones.forEach(phoneNumber => {
        const result = insertGuestSchema.safeParse({
          ...validGuestData,
          phoneNumber
        });
        expect(result.success).toBe(false);
      });
    });

    it('should validate email addresses correctly', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.org',
        'user+tag@example.co.uk',
      ];

      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        'test.example.com',
      ];

      validEmails.forEach(email => {
        const result = insertGuestSchema.safeParse({
          ...validGuestData,
          email
        });
        expect(result.success).toBe(true);
      });

      invalidEmails.forEach(email => {
        const result = insertGuestSchema.safeParse({
          ...validGuestData,
          email
        });
        expect(result.success).toBe(false);
      });
    });

    it('should validate age range correctly', () => {
      const validAges = ['16', '25', '65', '120'];
      const invalidAges = ['15', '121', 'abc', '25.5'];

      validAges.forEach(age => {
        const result = insertGuestSchema.safeParse({
          ...validGuestData,
          age
        });
        expect(result.success).toBe(true);
      });

      invalidAges.forEach(age => {
        const result = insertGuestSchema.safeParse({
          ...validGuestData,
          age
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('User Validation', () => {
    const validUserData = {
      email: 'admin@test.com',
      username: 'testadmin',
      password: 'TestPass123!',
      firstName: 'Test',
      lastName: 'Admin',
      role: 'admin' as const,
    };

    it('should validate correct user data', () => {
      const result = insertUserSchema.safeParse(validUserData);
      expect(result.success).toBe(true);
    });

    it('should reject weak passwords', () => {
      const weakPasswords = [
        '123456', // too weak
        'password', // common pattern
        'short', // too short
        'NOLOWERCASE123!', // no lowercase
        'nouppercase123!', // no uppercase
        'NoNumbers!', // no numbers
        'NoSpecial123', // no special characters
      ];

      weakPasswords.forEach(password => {
        const result = insertUserSchema.safeParse({
          ...validUserData,
          password
        });
        expect(result.success).toBe(false);
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'not-an-email',
        '@domain.com',
        'user@',
        'spaces in@email.com',
      ];

      invalidEmails.forEach(email => {
        const result = insertUserSchema.safeParse({
          ...validUserData,
          email
        });
        expect(result.success).toBe(false);
      });
    });

    it('should reject invalid usernames', () => {
      const invalidUsernames = [
        'ab', // too short
        'x'.repeat(31), // too long
        'user name', // contains space
        'user@name', // invalid characters
      ];

      invalidUsernames.forEach(username => {
        const result = insertUserSchema.safeParse({
          ...validUserData,
          username
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Self Check-in Validation', () => {
    const validSelfCheckinData = {
      nameAsInDocument: 'John Doe',
      phoneNumber: '+60123456789',
      gender: 'male' as const,
      nationality: 'Malaysian',
      icNumber: '950101-01-1234',
      icDocumentUrl: 'https://example.com/ic.jpg',
      paymentMethod: 'cash' as const,
    };

    it('should validate correct self check-in data', () => {
      const result = guestSelfCheckinSchema.safeParse(validSelfCheckinData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid IC numbers', () => {
      const invalidICs = [
        '12345', // too short
        '950131-01-1234', // invalid date (31st of month 13)
        '951301-01-1234', // invalid month (13)
        'abcdef-01-1234', // non-numeric
      ];

      invalidICs.forEach(icNumber => {
        const result = guestSelfCheckinSchema.safeParse({
          ...validSelfCheckinData,
          icNumber,
          passportNumber: undefined,
          passportDocumentUrl: undefined,
        });
        expect(result.success).toBe(false);
      });
    });

    it('should require either IC or passport', () => {
      const noIdResult = guestSelfCheckinSchema.safeParse({
        nameAsInDocument: 'John Doe',
        phoneNumber: '+60123456789',
        gender: 'male' as const,
        nationality: 'Malaysian',
        paymentMethod: 'cash' as const,
      });
      expect(noIdResult.success).toBe(false);
    });

    it('should accept passport instead of IC', () => {
      const passportData = {
        nameAsInDocument: 'John Doe',
        phoneNumber: '+60123456789',
        gender: 'male' as const,
        nationality: 'American',
        passportNumber: 'A1234567',
        passportDocumentUrl: 'https://example.com/passport.jpg',
        paymentMethod: 'cash' as const,
      };

      const result = guestSelfCheckinSchema.safeParse(passportData);
      expect(result.success).toBe(true);
    });
  });

  describe('Token Creation Validation', () => {
    const validTokenData = {
      capsuleNumber: 'A01',
      guestName: 'John Doe',
      phoneNumber: '+60123456789',
      email: 'john@example.com',
      expectedCheckoutDate: '2024-12-31',
      expiresInHours: 24,
    };

    it('should validate correct token data', () => {
      const result = createTokenSchema.safeParse(validTokenData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid expiration times', () => {
      const invalidHours = [0, -1, 169]; // 0, negative, over max

      invalidHours.forEach(expiresInHours => {
        const result = createTokenSchema.safeParse({
          ...validTokenData,
          expiresInHours
        });
        expect(result.success).toBe(false);
      });
    });

    it('should reject invalid checkout dates', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const invalidDate = yesterday.toISOString().split('T')[0];

      const result = createTokenSchema.safeParse({
        ...validTokenData,
        expectedCheckoutDate: invalidDate
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Individual Field Schemas', () => {
    describe('Phone Number Schema', () => {
      it('should validate correct phone numbers', () => {
        const validNumbers = [
          '+60123456789',
          '+1234567890',
          '0123456789',
        ];

        validNumbers.forEach(phone => {
          const result = phoneNumberSchema.safeParse(phone);
          expect(result.success).toBe(true);
        });
      });

      it('should reject invalid phone numbers', () => {
        const invalidNumbers = [
          '123', // too short
          'x'.repeat(21), // too long
          'abc123def', // non-numeric
        ];

        invalidNumbers.forEach(phone => {
          const result = phoneNumberSchema.safeParse(phone);
          expect(result.success).toBe(false);
        });
      });
    });

    describe('Email Schema', () => {
      it('should validate and normalize emails', () => {
        const testCases = [
          { input: 'TEST@EXAMPLE.COM', expected: 'test@example.com' },
          { input: '  user@domain.org  ', expected: 'user@domain.org' },
        ];

        testCases.forEach(({ input, expected }) => {
          const result = emailSchema.safeParse(input);
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data).toBe(expected);
          }
        });
      });
    });

    describe('Capsule Number Schema', () => {
      it('should validate and normalize capsule numbers', () => {
        const testCases = [
          { input: 'a01', expected: 'A01' },
          { input: 'B02', expected: 'B02' },
          { input: 'c03', expected: 'C03' },
        ];

        testCases.forEach(({ input, expected }) => {
          const result = capsuleNumberSchema.safeParse(input);
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data).toBe(expected);
          }
        });
      });
    });

    describe('Name Schema', () => {
      it('should validate and normalize names', () => {
        const testCases = [
          { input: '  John Doe  ', expected: 'John Doe' },
          { input: 'Mary-Jane O\'Connor', expected: 'Mary-Jane O\'Connor' },
        ];

        testCases.forEach(({ input, expected }) => {
          const result = nameSchema.safeParse(input);
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data).toBe(expected);
          }
        });
      });

      it('should reject invalid name formats', () => {
        const invalidNames = [
          'A', // too short
          'John123', // contains numbers
          'John@Doe', // contains symbols
          'x'.repeat(101), // too long
        ];

        invalidNames.forEach(name => {
          const result = nameSchema.safeParse(name);
          expect(result.success).toBe(false);
        });
      });
    });
  });
});

describe('Validation Utilities', () => {
  describe('Malaysian IC Validation', () => {
    it('should validate correct Malaysian IC numbers', () => {
      const validICs = [
        '950101-01-1234', // Valid format
        '001225-14-5678', // Valid format
        '121212-03-9999', // Valid format
      ];

      validICs.forEach(ic => {
        expect(validationUtils.isValidMalaysianIC(ic)).toBe(true);
      });
    });

    it('should reject invalid Malaysian IC numbers', () => {
      const invalidICs = [
        '950131-01-1234', // Invalid date (31st day of 1st month is valid, but let's test 31st of non-31-day month)
        '951301-01-1234', // Invalid month (13)
        '950230-01-1234', // Invalid date (Feb 30th)
        'abcdef-01-1234', // Non-numeric
        '95010-01-1234', // Wrong format
      ];

      invalidICs.forEach(ic => {
        expect(validationUtils.isValidMalaysianIC(ic)).toBe(false);
      });
    });
  });

  describe('Password Strength Validation', () => {
    it('should validate strong passwords', () => {
      const strongPasswords = [
        'MyStr0ng!Pass',
        'C0mplex@Password123',
        'Secure#Pass2024',
      ];

      strongPasswords.forEach(password => {
        expect(validationUtils.isStrongPassword(password)).toBe(true);
      });
    });

    it('should reject weak passwords', () => {
      const weakPasswords = [
        '123456', // Too simple
        'password', // Common pattern
        'MyPassword', // No numbers or special chars
        'Pass123', // Too short
      ];

      weakPasswords.forEach(password => {
        expect(validationUtils.isStrongPassword(password)).toBe(false);
      });
    });
  });

  describe('Email Format Validation', () => {
    it('should validate correct email formats', () => {
      const validEmails = [
        'user@example.com',
        'test.email@domain.org',
        'user+tag@company.co.uk',
      ];

      validEmails.forEach(email => {
        expect(validationUtils.isValidEmail(email)).toBe(true);
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user.domain.com',
      ];

      invalidEmails.forEach(email => {
        expect(validationUtils.isValidEmail(email)).toBe(false);
      });
    });
  });
});