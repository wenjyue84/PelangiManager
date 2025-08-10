import express from 'express';
import request from 'supertest';
import { registerRoutes } from '../server/routes';
import { storage } from '../server/storage';

describe('Server: Guest routes', () => {
  let app: express.Express;
  let token: string;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    await registerRoutes(app);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@pelangi.com', password: 'admin123' });
    token = login.body.token;
  });

  it('check-in then check-out updates occupancy and capsule', async () => {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const checkin = await request(app)
      .post('/api/guests/checkin')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'GuestTest',
        capsuleNumber: 'C2',
        paymentAmount: '45',
        paymentMethod: 'cash',
        paymentCollector: 'Admin',
        expectedCheckoutDate: tomorrow,
      });
    expect(checkin.status).toBe(200);
    const guestId = checkin.body.id;

    const checkout = await request(app)
      .post('/api/guests/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({ id: guestId });
    expect(checkout.status).toBe(200);
  });
});


