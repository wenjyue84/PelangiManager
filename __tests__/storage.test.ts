import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { MemStorage } from '../server/storage';
import type { 
  InsertGuest, 
  InsertUser, 
  InsertCapsule,
  InsertGuestToken,
  InsertCapsuleProblem,
  Guest,
  User,
  Capsule
} from '../shared/schema.js';

describe('Storage Operations', () => {
  let storage: MemStorage;

  beforeEach(() => {
    storage = new MemStorage();
  });

  describe('User Management', () => {
    const mockUser: InsertUser = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'hashedpassword',
      firstName: 'Test',
      lastName: 'User',
      role: 'admin',
    };

    it('should create a user successfully', async () => {
      const user = await storage.createUser(mockUser);
      
      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.email).toBe(mockUser.email);
      expect(user.username).toBe(mockUser.username);
      expect(user.role).toBe(mockUser.role);
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
    });

    it('should retrieve a user by ID', async () => {
      const createdUser = await storage.createUser(mockUser);
      const retrievedUser = await storage.getUser(createdUser.id);
      
      expect(retrievedUser).toBeDefined();
      expect(retrievedUser?.id).toBe(createdUser.id);
      expect(retrievedUser?.email).toBe(mockUser.email);
    });

    it('should retrieve a user by username', async () => {
      const createdUser = await storage.createUser(mockUser);
      const retrievedUser = await storage.getUserByUsername(mockUser.username!);
      
      expect(retrievedUser).toBeDefined();
      expect(retrievedUser?.id).toBe(createdUser.id);
      expect(retrievedUser?.username).toBe(mockUser.username);
    });

    it('should retrieve a user by email', async () => {
      const createdUser = await storage.createUser(mockUser);
      const retrievedUser = await storage.getUserByEmail(mockUser.email);
      
      expect(retrievedUser).toBeDefined();
      expect(retrievedUser?.id).toBe(createdUser.id);
      expect(retrievedUser?.email).toBe(mockUser.email);
    });

    it('should update a user', async () => {
      const createdUser = await storage.createUser(mockUser);
      const updates = { firstName: 'Updated', lastName: 'Name' };
      const updatedUser = await storage.updateUser(createdUser.id, updates);
      
      expect(updatedUser).toBeDefined();
      expect(updatedUser?.firstName).toBe(updates.firstName);
      expect(updatedUser?.lastName).toBe(updates.lastName);
      expect(updatedUser?.updatedAt.getTime()).toBeGreaterThan(createdUser.createdAt.getTime());
    });

    it('should delete a user', async () => {
      const createdUser = await storage.createUser(mockUser);
      const deleted = await storage.deleteUser(createdUser.id);
      
      expect(deleted).toBe(true);
      
      const retrievedUser = await storage.getUser(createdUser.id);
      expect(retrievedUser).toBeUndefined();
    });

    it('should return undefined for non-existent user', async () => {
      const user = await storage.getUser('non-existent-id');
      expect(user).toBeUndefined();
    });
  });

  describe('Guest Management', () => {
    const mockGuest: InsertGuest = {
      name: 'John Doe',
      capsuleNumber: 'A01',
      paymentAmount: '50.00',
      paymentMethod: 'cash',
      paymentCollector: 'admin',
      isPaid: true,
      expectedCheckoutDate: '2024-12-31',
      gender: 'male',
      nationality: 'Malaysian',
      phoneNumber: '+60123456789',
      email: 'john@example.com',
      age: '29',
    };

    it('should create a guest successfully', async () => {
      const guest = await storage.createGuest(mockGuest);
      
      expect(guest).toBeDefined();
      expect(guest.id).toBeDefined();
      expect(guest.name).toBe(mockGuest.name);
      expect(guest.capsuleNumber).toBe(mockGuest.capsuleNumber);
      expect(guest.isCheckedIn).toBe(true);
      expect(guest.checkinTime).toBeDefined();
    });

    it('should retrieve a guest by ID', async () => {
      const createdGuest = await storage.createGuest(mockGuest);
      const retrievedGuest = await storage.getGuest(createdGuest.id);
      
      expect(retrievedGuest).toBeDefined();
      expect(retrievedGuest?.id).toBe(createdGuest.id);
      expect(retrievedGuest?.name).toBe(mockGuest.name);
    });

    it('should get all checked-in guests', async () => {
      await storage.createGuest({ ...mockGuest, capsuleNumber: 'A01' });
      await storage.createGuest({ ...mockGuest, name: 'Jane Doe', capsuleNumber: 'A02' });
      
      const checkedInGuests = await storage.getCheckedInGuests();
      
      expect(checkedInGuests.data).toHaveLength(2);
      expect(checkedInGuests.data.every(guest => guest.isCheckedIn)).toBe(true);
    });

    it('should checkout a guest', async () => {
      const createdGuest = await storage.createGuest(mockGuest);
      const checkedOutGuest = await storage.checkoutGuest(createdGuest.id);
      
      expect(checkedOutGuest).toBeDefined();
      expect(checkedOutGuest?.isCheckedIn).toBe(false);
      expect(checkedOutGuest?.checkoutTime).toBeDefined();
    });

    it('should update guest information', async () => {
      const createdGuest = await storage.createGuest(mockGuest);
      const updates = { phoneNumber: '+60987654321', notes: 'Updated notes' };
      const updatedGuest = await storage.updateGuest(createdGuest.id, updates);
      
      expect(updatedGuest).toBeDefined();
      expect(updatedGuest?.phoneNumber).toBe(updates.phoneNumber);
      expect(updatedGuest?.notes).toBe(updates.notes);
    });

    it('should get guest history with pagination', async () => {
      // Create some guests and check some out
      const guest1 = await storage.createGuest({ ...mockGuest, capsuleNumber: 'A01' });
      const guest2 = await storage.createGuest({ ...mockGuest, name: 'Jane Doe', capsuleNumber: 'A02' });
      
      await storage.checkoutGuest(guest1.id);
      
      const history = await storage.getGuestHistory({ page: 1, limit: 10 });
      
      expect(history.data).toHaveLength(2);
      expect(history.pagination.total).toBe(2);
      expect(history.pagination.page).toBe(1);
      expect(history.pagination.limit).toBe(10);
      expect(history.pagination.totalPages).toBe(1);
    });
  });

  describe('Capsule Management', () => {
    const mockCapsule: InsertCapsule = {
      number: 'A01',
      section: 'front',
      isAvailable: true,
    };

    beforeEach(async () => {
      // Initialize some capsules
      await storage.createCapsule(mockCapsule);
      await storage.createCapsule({ ...mockCapsule, number: 'A02' });
      await storage.createCapsule({ ...mockCapsule, number: 'B01', section: 'middle' });
    });

    it('should create a capsule successfully', async () => {
      const capsule = await storage.createCapsule({
        number: 'C01',
        section: 'back',
        isAvailable: true,
      });
      
      expect(capsule).toBeDefined();
      expect(capsule.id).toBeDefined();
      expect(capsule.number).toBe('C01');
      expect(capsule.section).toBe('back');
      expect(capsule.isAvailable).toBe(true);
    });

    it('should get available capsules', async () => {
      const availableCapsules = await storage.getAvailableCapsules();
      
      expect(availableCapsules).toHaveLength(3);
      expect(availableCapsules.every(capsule => capsule.isAvailable)).toBe(true);
    });

    it('should calculate occupancy correctly', async () => {
      // Check in a guest to occupy one capsule
      await storage.createGuest({
        name: 'John Doe',
        capsuleNumber: 'A01',
        paymentAmount: '50.00',
        paymentMethod: 'cash',
        paymentCollector: 'admin',
        isPaid: true,
      });
      
      const occupancy = await storage.getCapsuleOccupancy();
      
      expect(occupancy.total).toBe(3);
      expect(occupancy.occupied).toBe(1);
      expect(occupancy.available).toBe(2);
      expect(occupancy.occupancyRate).toBeCloseTo(33.33, 1);
    });

    it('should update capsule status', async () => {
      const updatedCapsule = await storage.updateCapsule('A01', { isAvailable: false });
      
      expect(updatedCapsule).toBeDefined();
      expect(updatedCapsule?.isAvailable).toBe(false);
    });
  });

  describe('Session Management', () => {
    let userId: string;

    beforeEach(async () => {
      const user = await storage.createUser({
        email: 'session@test.com',
        username: 'sessionuser',
        password: 'password',
        role: 'admin',
      });
      userId = user.id;
    });

    it('should create a session', async () => {
      const token = 'test-session-token';
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      const session = await storage.createSession(userId, token, expiresAt);
      
      expect(session).toBeDefined();
      expect(session.userId).toBe(userId);
      expect(session.token).toBe(token);
      expect(session.expiresAt).toEqual(expiresAt);
    });

    it('should retrieve session by token', async () => {
      const token = 'test-session-token';
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      await storage.createSession(userId, token, expiresAt);
      const retrievedSession = await storage.getSessionByToken(token);
      
      expect(retrievedSession).toBeDefined();
      expect(retrievedSession?.token).toBe(token);
      expect(retrievedSession?.userId).toBe(userId);
    });

    it('should delete a session', async () => {
      const token = 'test-session-token';
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      await storage.createSession(userId, token, expiresAt);
      const deleted = await storage.deleteSession(token);
      
      expect(deleted).toBe(true);
      
      const retrievedSession = await storage.getSessionByToken(token);
      expect(retrievedSession).toBeUndefined();
    });

    it('should clean expired sessions', async () => {
      const expiredToken = 'expired-token';
      const validToken = 'valid-token';
      const expiredDate = new Date(Date.now() - 1000); // 1 second ago
      const validDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
      
      await storage.createSession(userId, expiredToken, expiredDate);
      await storage.createSession(userId, validToken, validDate);
      
      await storage.cleanExpiredSessions();
      
      const expiredSession = await storage.getSessionByToken(expiredToken);
      const validSession = await storage.getSessionByToken(validToken);
      
      expect(expiredSession).toBeUndefined();
      expect(validSession).toBeDefined();
    });
  });

  describe('Guest Token Management', () => {
    let userId: string;

    beforeEach(async () => {
      const user = await storage.createUser({
        email: 'token@test.com',
        username: 'tokenuser',
        password: 'password',
        role: 'admin',
      });
      userId = user.id;
    });

    const mockGuestToken: InsertGuestToken = {
      token: 'test-guest-token-123456',
      capsuleNumber: 'A01',
      guestName: 'John Doe',
      phoneNumber: '+60123456789',
      email: 'john@example.com',
      expectedCheckoutDate: '2024-12-31',
      createdBy: '', // Will be set in tests
      isUsed: false,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };

    it('should create a guest token', async () => {
      const tokenData = { ...mockGuestToken, createdBy: userId };
      const token = await storage.createGuestToken(tokenData);
      
      expect(token).toBeDefined();
      expect(token.token).toBe(tokenData.token);
      expect(token.capsuleNumber).toBe(tokenData.capsuleNumber);
      expect(token.createdBy).toBe(userId);
      expect(token.isUsed).toBe(false);
    });

    it('should retrieve active tokens', async () => {
      const tokenData = { ...mockGuestToken, createdBy: userId };
      await storage.createGuestToken(tokenData);
      
      const activeTokens = await storage.getActiveGuestTokens();
      
      expect(activeTokens.data).toHaveLength(1);
      expect(activeTokens.data[0].isUsed).toBe(false);
    });

    it('should find token by token string', async () => {
      const tokenData = { ...mockGuestToken, createdBy: userId };
      await storage.createGuestToken(tokenData);
      
      const foundToken = await storage.getGuestToken(tokenData.token);
      
      expect(foundToken).toBeDefined();
      expect(foundToken?.token).toBe(tokenData.token);
    });

    it('should mark token as used', async () => {
      const tokenData = { ...mockGuestToken, createdBy: userId };
      const createdToken = await storage.createGuestToken(tokenData);
      
      const usedToken = await storage.markGuestTokenUsed(createdToken.id);
      
      expect(usedToken).toBeDefined();
      expect(usedToken?.isUsed).toBe(true);
      expect(usedToken?.usedAt).toBeDefined();
    });
  });

  describe('Capsule Problem Management', () => {
    const mockProblem: InsertCapsuleProblem = {
      capsuleNumber: 'A01',
      description: 'Air conditioning not working',
      reportedBy: 'admin',
      isResolved: false,
    };

    it('should create a capsule problem', async () => {
      const problem = await storage.createCapsuleProblem(mockProblem);
      
      expect(problem).toBeDefined();
      expect(problem.id).toBeDefined();
      expect(problem.capsuleNumber).toBe(mockProblem.capsuleNumber);
      expect(problem.description).toBe(mockProblem.description);
      expect(problem.isResolved).toBe(false);
      expect(problem.reportedAt).toBeDefined();
    });

    it('should get problems for a specific capsule', async () => {
      await storage.createCapsuleProblem(mockProblem);
      await storage.createCapsuleProblem({
        ...mockProblem,
        description: 'Light not working',
      });
      
      const problems = await storage.getCapsuleProblems('A01');
      
      expect(problems).toHaveLength(2);
      expect(problems.every(p => p.capsuleNumber === 'A01')).toBe(true);
    });

    it('should get active problems', async () => {
      await storage.createCapsuleProblem(mockProblem);
      const resolvedProblem = await storage.createCapsuleProblem({
        ...mockProblem,
        description: 'Resolved issue',
      });
      
      // Resolve one problem
      await storage.resolveProblem(resolvedProblem.id, 'maintenance', 'Fixed the issue');
      
      const activeProblems = await storage.getActiveProblems();
      
      expect(activeProblems.data).toHaveLength(1);
      expect(activeProblems.data[0].isResolved).toBe(false);
    });

    it('should resolve a problem', async () => {
      const createdProblem = await storage.createCapsuleProblem(mockProblem);
      const resolvedProblem = await storage.resolveProblem(
        createdProblem.id,
        'maintenance',
        'Fixed the air conditioning'
      );
      
      expect(resolvedProblem).toBeDefined();
      expect(resolvedProblem?.isResolved).toBe(true);
      expect(resolvedProblem?.resolvedBy).toBe('maintenance');
      expect(resolvedProblem?.notes).toBe('Fixed the air conditioning');
      expect(resolvedProblem?.resolvedAt).toBeDefined();
    });
  });

  describe('Business Logic Calculations', () => {
    beforeEach(async () => {
      // Set up test capsules
      const capsules = [
        { number: 'A01', section: 'front' },
        { number: 'A02', section: 'front' },
        { number: 'B01', section: 'middle' },
        { number: 'B02', section: 'middle' },
        { number: 'C01', section: 'back' },
      ];

      for (const capsule of capsules) {
        await storage.createCapsule({
          number: capsule.number,
          section: capsule.section,
          isAvailable: true,
        });
      }
    });

    it('should calculate occupancy rates correctly', async () => {
      // Check in guests to 2 out of 5 capsules
      await storage.createGuest({
        name: 'Guest 1',
        capsuleNumber: 'A01',
        paymentAmount: '50.00',
        paymentMethod: 'cash',
        paymentCollector: 'admin',
        isPaid: true,
      });

      await storage.createGuest({
        name: 'Guest 2',
        capsuleNumber: 'B01',
        paymentAmount: '50.00',
        paymentMethod: 'cash',
        paymentCollector: 'admin',
        isPaid: true,
      });

      const occupancy = await storage.getCapsuleOccupancy();
      
      expect(occupancy.total).toBe(5);
      expect(occupancy.occupied).toBe(2);
      expect(occupancy.available).toBe(3);
      expect(occupancy.occupancyRate).toBeCloseTo(40.0, 1);
    });

    it('should return empty available capsules when all occupied', async () => {
      // Occupy all capsules
      const capsuleNumbers = ['A01', 'A02', 'B01', 'B02', 'C01'];
      
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

      const availableCapsules = await storage.getAvailableCapsules();
      expect(availableCapsules).toHaveLength(0);

      const occupancy = await storage.getCapsuleOccupancy();
      expect(occupancy.occupancyRate).toBe(100.0);
    });

    it('should handle checkout and make capsules available again', async () => {
      const guest = await storage.createGuest({
        name: 'Temporary Guest',
        capsuleNumber: 'A01',
        paymentAmount: '50.00',
        paymentMethod: 'cash',
        paymentCollector: 'admin',
        isPaid: true,
      });

      // Verify capsule is occupied
      let occupancy = await storage.getCapsuleOccupancy();
      expect(occupancy.occupied).toBe(1);
      expect(occupancy.available).toBe(4);

      // Check out the guest
      await storage.checkoutGuest(guest.id);

      // Verify capsule is available again
      occupancy = await storage.getCapsuleOccupancy();
      expect(occupancy.occupied).toBe(0);
      expect(occupancy.available).toBe(5);
    });
  });
});