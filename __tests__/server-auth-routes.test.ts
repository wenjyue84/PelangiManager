import express from 'express';
import request from 'supertest';
import { registerRoutes } from '../server/routes';
import { storage } from '../server/storage';

describe('Server: Auth routes', () => {
  let app: express.Express;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    await registerRoutes(app);
  });

  it('login with default admin succeeds', async () => {
    // Ensure admin exists in MemStorage init
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@pelangi.com', password: 'admin123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });

  it('login fails with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@pelangi.com', password: 'wrong' });
    expect(res.status).toBe(401);
  });
});


