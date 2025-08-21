// tests/appointment.test.ts
import request from 'supertest';

// Use in-memory SQLite for tests — set BEFORE importing app/db
process.env.DB_PATH = ':memory:';

import { app } from '../src/app';
import { db } from '../src/config/db';

const base = new Date(Date.now() + 60 * 60 * 1000); // +1h from now
const isoPlus = (mins: number) =>
  new Date(base.getTime() + mins * 60 * 1000).toISOString();

// clear tables between tests
beforeEach(() => {
  db.exec('DELETE FROM appointments; DELETE FROM patients; DELETE FROM clinicians;');
});

afterAll(() => {
  try { db.close(); } catch {}
});

describe('POST /appointments (patient booking)', () => {
  test('201 creates an appointment', async () => {
    const res = await request(app)
      .post('/appointments')
      .set('X-Role', 'patient')
      .send({
        clinicianId: 'c1',
        patientId: 'p1',
        start: isoPlus(0),
        end: isoPlus(30),
      });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ clinicianId: 'c1', patientId: 'p1' });
    expect(new Date(res.body.start).getTime())
      .toBeLessThan(new Date(res.body.end).getTime());
  });

  test('409 rejects overlapping appointment for same clinician', async () => {
    // Seed: [0, 30)
    await request(app).post('/appointments')
      .set('X-Role', 'patient')
      .send({
        clinicianId: 'c1',
        patientId: 'p1',
        start: isoPlus(0),
        end: isoPlus(30),
      });

    // Overlap: [15, 45)
    const res = await request(app).post('/appointments')
      .set('X-Role', 'patient')
      .send({
        clinicianId: 'c1',
        patientId: 'p2',
        start: isoPlus(15),
        end: isoPlus(45),
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/overlap/i);
  });

  test('201 allows touching at endpoint (end == other.start)', async () => {
    // First: [0, 30)
    await request(app).post('/appointments')
      .set('X-Role', 'patient')
      .send({
        clinicianId: 'c1',
        patientId: 'p1',
        start: isoPlus(0),
        end: isoPlus(30),
      });

    // Touching: [30, 60)
    const res = await request(app).post('/appointments')
      .set('X-Role', 'patient')
      .send({
        clinicianId: 'c1',
        patientId: 'p3',
        start: isoPlus(30),
        end: isoPlus(60),
      });

    expect(res.status).toBe(201);
  });

  test('201 allows same slot for different clinician', async () => {
    // c1: [0, 30)
    await request(app).post('/appointments')
      .set('X-Role', 'patient')
      .send({
        clinicianId: 'c1',
        patientId: 'p1',
        start: isoPlus(0),
        end: isoPlus(30),
      });

    // c2 same time: [0, 30)
    const res = await request(app).post('/appointments')
      .set('X-Role', 'patient')
      .send({
        clinicianId: 'c2',
        patientId: 'p2',
        start: isoPlus(0),
        end: isoPlus(30),
      });

    expect(res.status).toBe(201);
  });

  test('400 when start/end are not valid ISO datetimes', async () => {
    const res = await request(app).post('/appointments')
      .set('X-Role', 'patient')
      .send({
        clinicianId: 'c1',
        patientId: 'p1',
        start: 'not-a-date',
        end: isoPlus(30),
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch("Invalid input");
  });

  test('400 when start is not strictly before end (zero-length)', async () => {
    const t = isoPlus(10);
    const res = await request(app).post('/appointments')
      .set('X-Role', 'patient')
      .send({
        clinicianId: 'c1',
        patientId: 'p1',
        start: t,
        end: t,
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch("Invalid input");
  });

  test('400 when appointment is in the past', async () => {
    const pastStart = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // -1h
    const pastEnd   = new Date(Date.now() - 30 * 60 * 1000).toISOString(); // -30m
    const res = await request(app).post('/appointments')
      .set('X-Role', 'patient')
      .send({
        clinicianId: 'c1',
        patientId: 'p1',
        start: pastStart,
        end: pastEnd,
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/past/i);
  });

  test('400 when start or end is missing', async () => {
    const res = await request(app).post('/appointments')
      .set('X-Role', 'patient')
      .send({
        clinicianId: 'c1',
        patientId: 'p1',
        start: isoPlus(0),
        // end missing
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch("Invalid input");
  });

  test('Invalid query params return 400', async () => {
    const res = await request(app)
      .get('/appointments')
      .set('X-Role', 'admin')
      .query({ foo: 'bar' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch("Invalid input");
  });

  test('201 when appointment is set by admin', async () => {
    const res = await request(app)
      .post('/appointments')
      .set('X-Role', 'admin')
      .send({
        clinicianId: 'c1',
        patientId: 'p1',
        start: isoPlus(0),
        end: isoPlus(30),
      });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ clinicianId: 'c1', patientId: 'p1' });
  });

  test('403 when user is not admin or patient', async () => {
    const res = await request(app)
      .post('/appointments')
      .set('X-Role', 'kian')
      .send({
        clinicianId: 'c1',
        patientId: 'p1',
        start: isoPlus(0),
        end: isoPlus(30),
      });

    expect(res.status).toBe(403);
  });
});

describe('GET /appointments (admin)', () => {
  beforeEach(async () => {
    // Seed some appointments
    await request(app).post('/appointments')
      .set('X-Role', 'patient')
      .send({ clinicianId: 'c1', patientId: 'p1', start: isoPlus(0),   end: isoPlus(30) });
    await request(app).post('/appointments')
      .set('X-Role', 'patient')
      .send({ clinicianId: 'c2', patientId: 'p2', start: isoPlus(60),  end: isoPlus(90) });
    await request(app).post('/appointments')
      .set('X-Role', 'patient')
      .send({ clinicianId: 'c1', patientId: 'p3', start: isoPlus(120), end: isoPlus(150) });
  });

  test('400 when to/from params are invalid', async () => {
    const res = await request(app)
      .get('/appointments')
      .set('X-Role', 'admin')
      .query({ from: 'not-a-date', to: 'also-not-a-date' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch("Invalid input");
  });

  test('400 when to param is before from param', async () => {
    const from = isoPlus(60);
    const to   = isoPlus(0);
    const res = await request(app)
      .get('/appointments')
      .set('X-Role', 'admin')
      .query({ from, to });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch("Invalid input");
  });

  test('returns all appointments', async () => {
    const res = await request(app)
      .get('/appointments')
      .set('X-Role', 'admin');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(3);
  });

  test('filters by from date', async () => {
    const from = isoPlus(60);
    const res = await request(app)
      .get('/appointments')
      .set('X-Role', 'admin')
      .query({ from });

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
    for (const appt of res.body) {
      expect(new Date(appt.start).getTime())
        .toBeGreaterThanOrEqual(new Date(from).getTime());
    }
  });

  test('filters by to date', async () => {
    const to = isoPlus(60);
    const res = await request(app)
      .get('/appointments')
      .set('X-Role', 'admin')
      .query({ to });

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    for (const appt of res.body) {
      expect(new Date(appt.end).getTime())
        .toBeLessThanOrEqual(new Date(to).getTime());
    }
  });

  test('filters by from and to date', async () => {
    const from = isoPlus(30);
    const to   = isoPlus(120);
    const res = await request(app)
      .get('/appointments')
      .set('X-Role', 'admin')
      .query({ from, to });

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    for (const appt of res.body) {
      expect(new Date(appt.start).getTime())
        .toBeGreaterThanOrEqual(new Date(from).getTime());
      expect(new Date(appt.end).getTime())
        .toBeLessThanOrEqual(new Date(to).getTime());
    }
  });

  test('403 when user is not admin', async () => {
    const res = await request(app)
      .get('/appointments')
      .set('X-Role', 'kian');

    expect(res.status).toBe(403);
  });

  test('400 when invalid query params are provided', async () => {
    const res = await request(app)
      .get('/appointments')
      .set('X-Role', 'admin')
      .query({ foo: 'bar' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch("Invalid input");
  });
});
