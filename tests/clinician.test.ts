import request from 'supertest';

// Use in-memory DB before importing app/db
process.env.DB_PATH = ':memory:';

import { app } from '../src/app';
import { db } from '../src/config/db';

const base = new Date(Date.now() + 60 * 60 * 1000); // +1h from now
const isoPlus = (mins: number) => new Date(base.getTime() + mins * 60 * 1000).toISOString();

beforeEach(() => {
  db.exec('DELETE FROM appointments; DELETE FROM patients; DELETE FROM clinicians;');
});

afterAll(() => {
  try { db.close(); } catch {}
});

describe('GET /clinicians/:id/appointments', () => {
    beforeEach(async () => {
        // Seed c1 with two future appointments: [0,30) and [30,60)
        await request(app).post('/appointments').set('X-Role', 'patient').send({
            clinicianId: 'c1', patientId: 'p101', start: isoPlus(0), end: isoPlus(30)
        });
        await request(app).post('/appointments').set('X-Role', 'patient').send({
            clinicianId: 'c1', patientId: 'p102', start: isoPlus(30), end: isoPlus(60)
        });
        // Seed c2 with one future appointment
        await request(app).post('/appointments').set('X-Role', 'patient').send({
            clinicianId: 'c2', patientId: 'p201', start: isoPlus(15), end: isoPlus(45)
        });
    });

    test("returns only the clinician's appointments ordered by start", async () => {
        const res = await request(app).get('/clinicians/c1/appointments').set('X-Role', 'clinician');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(2);
        expect(res.body.every((a: any) => a.clinicianId === 'c1')).toBe(true);
        expect(new Date(res.body[0].start).getTime()).toBeLessThan(new Date(res.body[1].start).getTime());
    });

    test('filters by from date (start >= from)', async () => {
        const from = isoPlus(30);
        const res = await request(app).get('/clinicians/c1/appointments').set('X-Role', 'clinician').query({ from });
        expect(res.status).toBe(200);
        expect(res.body.length).toBe(1);
        expect(new Date(res.body[0].start).getTime()).toBeGreaterThanOrEqual(new Date(from).getTime());
    });

    test('filters by to date (end <= to)', async () => {
        const to = isoPlus(30);
        const res = await request(app).get('/clinicians/c1/appointments').set('X-Role', 'clinician').query({ to });
        expect(res.status).toBe(200);
        expect(res.body.length).toBe(1);
        expect(new Date(res.body[0].end).getTime()).toBeLessThanOrEqual(new Date(to).getTime());
    });

    test('filters by from and to date window', async () => {
        const from = isoPlus(15);
        const to = isoPlus(45);
        // c2 has an appointment [15,45) which fits the window
        const res = await request(app).get('/clinicians/c2/appointments').set('X-Role', 'clinician').query({ from, to });
        expect(res.status).toBe(200);
        expect(res.body.length).toBe(1);
        expect(new Date(res.body[0].start).getTime()).toBeGreaterThanOrEqual(new Date(from).getTime());
        expect(new Date(res.body[0].end).getTime()).toBeLessThanOrEqual(new Date(to).getTime());
    });

    test('400 on invalid from ISO date', async () => {
        const res = await request(app).get('/clinicians/c1/appointments').set('X-Role', 'clinician').query({ from: 'not-a-date' });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch("Invalid input");
    });

    test('400 when invalid query params are provided', async () => {
        const res = await request(app)
            .get('/clinicians/c1/appointments')
            .set('X-Role', 'clinician')
            .query({ foo: 'bar' });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch("Invalid input");
    });

    test('404 when clinician does not exist', async () => {
        const res = await request(app)
            .get('/clinicians/c999/appointments')
            .set('X-Role', 'clinician');
        expect(res.status).toBe(404);
        expect(res.body.message).toMatch("Clinician not found");
    });

    test('403 when user is not admin or clinician', async () => {
        const res = await request(app)
            .get('/clinicians/c1/appointments')
            .set('X-Role', 'patient');
        expect(res.status).toBe(403);
    });
});
