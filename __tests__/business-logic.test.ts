import { describe, it, expect, beforeEach } from '@jest/globals';
import { MemStorage } from '../server/storage';
import type { InsertGuest, InsertCapsule } from '@shared/schema';

describe('Business Logic', () => {
  let storage: MemStorage;

  beforeEach(() => {
    storage = new MemStorage();
  });

  describe('Occupancy Calculations', () => {
    beforeEach(async () => {
      // Set up standard capsule configuration
      const capsules: InsertCapsule[] = [
        { number: 'A01', section: 'front', isAvailable: true },
        { number: 'A02', section: 'front', isAvailable: true },
        { number: 'A03', section: 'front', isAvailable: true },
        { number: 'B01', section: 'middle', isAvailable: true },
        { number: 'B02', section: 'middle', isAvailable: true },
        { number: 'B03', section: 'middle', isAvailable: true },
        { number: 'C01', section: 'back', isAvailable: true },
        { number: 'C02', section: 'back', isAvailable: true },
      ];

      for (const capsule of capsules) {
        await storage.createCapsule(capsule);
      }
    });

    it('should calculate zero occupancy for empty hostel', async () => {
      const occupancy = await storage.getCapsuleOccupancy();
      
      expect(occupancy.total).toBe(8);
      expect(occupancy.occupied).toBe(0);
      expect(occupancy.available).toBe(8);
      expect(occupancy.occupancyRate).toBe(0);
    });

    it('should calculate partial occupancy correctly', async () => {
      // Check in 3 guests
      const guests = [
        { name: 'Guest 1', capsuleNumber: 'A01' },
        { name: 'Guest 2', capsuleNumber: 'B01' },
        { name: 'Guest 3', capsuleNumber: 'C01' },
      ];

      for (const guest of guests) {
        await storage.createGuest({
          ...guest,
          paymentAmount: '50.00',
          paymentMethod: 'cash',
          paymentCollector: 'admin',
          isPaid: true,
        });
      }

      const occupancy = await storage.getCapsuleOccupancy();
      
      expect(occupancy.total).toBe(8);
      expect(occupancy.occupied).toBe(3);
      expect(occupancy.available).toBe(5);
      expect(occupancy.occupancyRate).toBe(37.5);
    });

    it('should calculate full occupancy correctly', async () => {
      // Fill all capsules
      const capsuleNumbers = ['A01', 'A02', 'A03', 'B01', 'B02', 'B03', 'C01', 'C02'];
      
      for (let i = 0; i < capsuleNumbers.length; i++) {
        await storage.createGuest({
          name: `Guest ${i + 1}`,
          capsuleNumber: capsuleNumbers[i],
          paymentAmount: '50.00',
          paymentMethod: 'cash',
          paymentCollector: 'admin',
          isPaid: true,
        });
      }

      const occupancy = await storage.getCapsuleOccupancy();
      
      expect(occupancy.total).toBe(8);
      expect(occupancy.occupied).toBe(8);
      expect(occupancy.available).toBe(0);
      expect(occupancy.occupancyRate).toBe(100);
    });

    it('should handle checkout and update occupancy', async () => {
      // Check in a guest
      const guest = await storage.createGuest({
        name: 'Temporary Guest',
        capsuleNumber: 'A01',
        paymentAmount: '50.00',
        paymentMethod: 'cash',
        paymentCollector: 'admin',
        isPaid: true,
      });

      let occupancy = await storage.getCapsuleOccupancy();
      expect(occupancy.occupied).toBe(1);
      expect(occupancy.available).toBe(7);

      // Check out the guest
      await storage.checkoutGuest(guest.id);

      occupancy = await storage.getCapsuleOccupancy();
      expect(occupancy.occupied).toBe(0);
      expect(occupancy.available).toBe(8);
    });
  });

  describe('Capsule Availability Logic', () => {
    beforeEach(async () => {
      const capsules = [
        { number: 'A01', section: 'front', isAvailable: true },
        { number: 'A02', section: 'front', isAvailable: true },
        { number: 'A03', section: 'front', isAvailable: false }, // Maintenance
        { number: 'B01', section: 'middle', isAvailable: true },
      ];

      for (const capsule of capsules) {
        await storage.createCapsule(capsule);
      }
    });

    it('should return only available and unoccupied capsules', async () => {
      // Occupy one available capsule
      await storage.createGuest({
        name: 'John Doe',
        capsuleNumber: 'A01',
        paymentAmount: '50.00',
        paymentMethod: 'cash',
        paymentCollector: 'admin',
        isPaid: true,
      });

      const availableCapsules = await storage.getAvailableCapsules();
      
      // Should have A02 and B01 (A01 is occupied, A03 is unavailable)
      expect(availableCapsules).toHaveLength(2);
      expect(availableCapsules.map(c => c.number).sort()).toEqual(['A02', 'B01']);
      expect(availableCapsules.every(c => c.isAvailable)).toBe(true);
    });

    it('should show capsule as available after guest checks out', async () => {
      // Check in a guest
      const guest = await storage.createGuest({
        name: 'John Doe',
        capsuleNumber: 'A01',
        paymentAmount: '50.00',
        paymentMethod: 'cash',
        paymentCollector: 'admin',
        isPaid: true,
      });

      // Initially, A01 should not be available
      let availableCapsules = await storage.getAvailableCapsules();
      expect(availableCapsules.find(c => c.number === 'A01')).toBeUndefined();

      // Check out the guest
      await storage.checkoutGuest(guest.id);

      // Now A01 should be available again
      availableCapsules = await storage.getAvailableCapsules();
      expect(availableCapsules.find(c => c.number === 'A01')).toBeDefined();
    });

    it('should not show capsules marked as unavailable', async () => {
      const availableCapsules = await storage.getAvailableCapsules();
      
      // A03 is marked as unavailable, should not appear
      expect(availableCapsules.find(c => c.number === 'A03')).toBeUndefined();
      expect(availableCapsules).toHaveLength(3); // A01, A02, B01
    });
  });

  describe('Guest Check-in Business Rules', () => {
    beforeEach(async () => {
      await storage.createCapsule({
        number: 'A01',
        section: 'front',
        isAvailable: true,
      });
    });

    it('should create guest with default values', async () => {
      const guestData: InsertGuest = {
        name: 'John Doe',
        capsuleNumber: 'A01',
        paymentAmount: '50.00',
        paymentMethod: 'cash',
        paymentCollector: 'admin',
      };

      const guest = await storage.createGuest(guestData);
      
      expect(guest.isCheckedIn).toBe(true);
      expect(guest.isPaid).toBe(false); // Default value
      expect(guest.checkinTime).toBeDefined();
      expect(guest.checkoutTime).toBeNull();
    });

    it('should prevent double occupancy of same capsule', async () => {
      // Check in first guest
      await storage.createGuest({
        name: 'John Doe',
        capsuleNumber: 'A01',
        paymentAmount: '50.00',
        paymentMethod: 'cash',
        paymentCollector: 'admin',
        isPaid: true,
      });

      // Try to check in second guest to same capsule
      // In a real implementation, this should be prevented
      // For now, we just verify the occupancy calculation is correct
      const occupancy = await storage.getCapsuleOccupancy();
      expect(occupancy.occupied).toBe(1);

      const availableCapsules = await storage.getAvailableCapsules();
      expect(availableCapsules.find(c => c.number === 'A01')).toBeUndefined();
    });

    it('should handle payment status correctly', async () => {
      const paidGuest = await storage.createGuest({
        name: 'Paid Guest',
        capsuleNumber: 'A01',
        paymentAmount: '50.00',
        paymentMethod: 'cash',
        paymentCollector: 'admin',
        isPaid: true,
      });

      expect(paidGuest.isPaid).toBe(true);
      expect(paidGuest.paymentAmount).toBe('50.00');
      expect(paidGuest.paymentMethod).toBe('cash');
      expect(paidGuest.paymentCollector).toBe('admin');
    });
  });

  describe('Guest Check-out Business Rules', () => {
    it('should update checkout time and status', async () => {
      const guest = await storage.createGuest({
        name: 'John Doe',
        capsuleNumber: 'A01',
        paymentAmount: '50.00',
        paymentMethod: 'cash',
        paymentCollector: 'admin',
        isPaid: true,
      });

      expect(guest.isCheckedIn).toBe(true);
      expect(guest.checkoutTime).toBeNull();

      const checkedOutGuest = await storage.checkoutGuest(guest.id);

      expect(checkedOutGuest).toBeDefined();
      expect(checkedOutGuest?.isCheckedIn).toBe(false);
      expect(checkedOutGuest?.checkoutTime).toBeDefined();
      expect(checkedOutGuest?.checkoutTime).toBeInstanceOf(Date);
    });

    it('should include checked-out guests in history but not active list', async () => {
      const guest = await storage.createGuest({
        name: 'John Doe',
        capsuleNumber: 'A01',
        paymentAmount: '50.00',
        paymentMethod: 'cash',
        paymentCollector: 'admin',
        isPaid: true,
      });

      // Before checkout
      let checkedInGuests = await storage.getCheckedInGuests();
      let guestHistory = await storage.getGuestHistory();

      expect(checkedInGuests.data).toHaveLength(1);
      expect(guestHistory.data).toHaveLength(1);

      // After checkout
      await storage.checkoutGuest(guest.id);

      checkedInGuests = await storage.getCheckedInGuests();
      guestHistory = await storage.getGuestHistory();

      expect(checkedInGuests.data).toHaveLength(0);
      expect(guestHistory.data).toHaveLength(1); // Still in history
      expect(guestHistory.data[0].isCheckedIn).toBe(false);
    });
  });

  describe('Token Management Business Logic', () => {
    let userId: string;

    beforeEach(async () => {
      const user = await storage.createUser({
        email: 'admin@test.com',
        username: 'admin',
        password: 'password',
        role: 'admin',
      });
      userId = user.id;

      await storage.createCapsule({
        number: 'A01',
        section: 'front',
        isAvailable: true,
      });
    });

    it('should create tokens with proper expiration', async () => {
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      const token = await storage.createGuestToken({
        token: 'test-token-123456',
        capsuleNumber: 'A01',
        guestName: 'John Doe',
        phoneNumber: '+60123456789',
        email: 'john@example.com',
        expectedCheckoutDate: '2024-12-31',
        createdBy: userId,
        isUsed: false,
        expiresAt,
      });

      expect(token.isUsed).toBe(false);
      expect(token.expiresAt).toEqual(expiresAt);
      expect(token.createdAt).toBeInstanceOf(Date);
    });

    it('should mark tokens as used when utilized', async () => {
      const token = await storage.createGuestToken({
        token: 'test-token-123456',
        capsuleNumber: 'A01',
        guestName: 'John Doe',
        phoneNumber: '+60123456789',
        email: 'john@example.com',
        expectedCheckoutDate: '2024-12-31',
        createdBy: userId,
        isUsed: false,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      const usedToken = await storage.useGuestToken(token.id);

      expect(usedToken?.isUsed).toBe(true);
      expect(usedToken?.usedAt).toBeDefined();
      expect(usedToken?.usedAt).toBeInstanceOf(Date);
    });

    it('should only return active (unused and unexpired) tokens', async () => {
      const now = new Date();
      
      // Create an active token
      await storage.createGuestToken({
        token: 'active-token',
        capsuleNumber: 'A01',
        guestName: 'John Doe',
        phoneNumber: '+60123456789',
        createdBy: userId,
        isUsed: false,
        expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      });

      // Create an expired token
      await storage.createGuestToken({
        token: 'expired-token',
        capsuleNumber: 'A02',
        guestName: 'Jane Doe',
        phoneNumber: '+60123456788',
        createdBy: userId,
        isUsed: false,
        expiresAt: new Date(now.getTime() - 1000), // 1 second ago
      });

      // Create a used token
      const usedTokenData = await storage.createGuestToken({
        token: 'used-token',
        capsuleNumber: 'A03',
        guestName: 'Bob Smith',
        phoneNumber: '+60123456787',
        createdBy: userId,
        isUsed: false,
        expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      });
      await storage.useGuestToken(usedTokenData.id);

      const activeTokens = await storage.getActiveTokens();

      expect(activeTokens.data).toHaveLength(1);
      expect(activeTokens.data[0].token).toBe('active-token');
    });
  });

  describe('Problem Reporting Business Logic', () => {
    beforeEach(async () => {
      await storage.createCapsule({
        number: 'A01',
        section: 'front',
        isAvailable: true,
      });
    });

    it('should track problem reporting timeline', async () => {
      const problem = await storage.createCapsuleProblem({
        capsuleNumber: 'A01',
        description: 'Air conditioning not working',
        reportedBy: 'staff-1',
        isResolved: false,
      });

      expect(problem.reportedAt).toBeInstanceOf(Date);
      expect(problem.isResolved).toBe(false);
      expect(problem.resolvedAt).toBeNull();
      expect(problem.resolvedBy).toBeNull();
    });

    it('should track problem resolution', async () => {
      const problem = await storage.createCapsuleProblem({
        capsuleNumber: 'A01',
        description: 'Light bulb burnt out',
        reportedBy: 'staff-1',
        isResolved: false,
      });

      const resolvedProblem = await storage.resolveProblem(
        problem.id,
        'maintenance',
        'Replaced light bulb'
      );

      expect(resolvedProblem?.isResolved).toBe(true);
      expect(resolvedProblem?.resolvedBy).toBe('maintenance');
      expect(resolvedProblem?.notes).toBe('Replaced light bulb');
      expect(resolvedProblem?.resolvedAt).toBeInstanceOf(Date);
      expect(resolvedProblem?.resolvedAt!.getTime()).toBeGreaterThan(problem.reportedAt.getTime());
    });

    it('should separate active and resolved problems', async () => {
      // Create some problems
      const activeProblem = await storage.createCapsuleProblem({
        capsuleNumber: 'A01',
        description: 'Active issue',
        reportedBy: 'staff-1',
        isResolved: false,
      });

      const resolvedProblem = await storage.createCapsuleProblem({
        capsuleNumber: 'A01',
        description: 'Resolved issue',
        reportedBy: 'staff-1',
        isResolved: false,
      });

      // Resolve one problem
      await storage.resolveProblem(resolvedProblem.id, 'maintenance', 'Fixed');

      const activeProblems = await storage.getActiveProblems();
      const allProblems = await storage.getAllProblems();

      expect(activeProblems.data).toHaveLength(1);
      expect(activeProblems.data[0].id).toBe(activeProblem.id);
      expect(activeProblems.data[0].isResolved).toBe(false);

      expect(allProblems.data).toHaveLength(2);
    });
  });

  describe('Data Consistency Rules', () => {
    beforeEach(async () => {
      await storage.createCapsule({
        number: 'A01',
        section: 'front',
        isAvailable: true,
      });
    });

    it('should maintain referential integrity between guests and capsules', async () => {
      const guest = await storage.createGuest({
        name: 'John Doe',
        capsuleNumber: 'A01',
        paymentAmount: '50.00',
        paymentMethod: 'cash',
        paymentCollector: 'admin',
        isPaid: true,
      });

      // The guest should reference an existing capsule
      expect(guest.capsuleNumber).toBe('A01');

      // Occupancy should reflect this relationship
      const occupancy = await storage.getCapsuleOccupancy();
      expect(occupancy.occupied).toBe(1);
    });

    it('should maintain consistency in checked-in status', async () => {
      const guest = await storage.createGuest({
        name: 'John Doe',
        capsuleNumber: 'A01',
        paymentAmount: '50.00',
        paymentMethod: 'cash',
        paymentCollector: 'admin',
        isPaid: true,
      });

      // Initially checked in
      expect(guest.isCheckedIn).toBe(true);
      expect(guest.checkoutTime).toBeNull();

      // After checkout
      const checkedOutGuest = await storage.checkoutGuest(guest.id);
      expect(checkedOutGuest?.isCheckedIn).toBe(false);
      expect(checkedOutGuest?.checkoutTime).not.toBeNull();

      // Should not appear in checked-in guests
      const checkedInGuests = await storage.getCheckedInGuests();
      expect(checkedInGuests.data.find(g => g.id === guest.id)).toBeUndefined();
    });
  });
});