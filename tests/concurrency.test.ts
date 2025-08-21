// tests/concurrency.test.ts
import request from 'supertest';
process.env.DB_PATH = ':memory:'; // single-process DB
import { app } from '../src/app';
import { db } from '../src/config/db';

const slotStart = new Date(Date.now() + 60 * 60 * 1000).toISOString();
const slotEnd   = new Date(Date.now() + 60 * 60 * 1000 + 30 * 60 * 1000).toISOString();

beforeEach(() => {
  db.exec('DELETE FROM appointments; DELETE FROM patients; DELETE FROM clinicians;');
});

test('concurrent posts: only one succeeds, rest 409', async () => {
  const N = 8;
  const body = { clinicianId: 'c-race', patientId: 'p-race', start: slotStart, end: slotEnd };

  const results = await Promise.all(
    Array.from({ length: N }, () =>
      request(app).post('/appointments').set('X-Role', 'patient').send(body)
    )
  );

  const count201 = results.filter(r => r.status === 201).length;
  const count409 = results.filter(r => r.status === 409).length;
  expect(count201).toBe(1);
  expect(count409).toBe(N - 1);

  // Verify DB contains exactly one matching row
  const { c } = db
    .prepare(
      `SELECT COUNT(*) AS c FROM appointments
       WHERE clinician_id = ? AND start = ? AND end = ?`
    )
    .get('c-race', slotStart, slotEnd) as { c: number };

  expect(c).toBe(1);
});

test('concurrent same slot for different clinicians: all succeed', async () => {
  const clinicians = ['c1', 'c2', 'c3', 'c4'];
  const results = await Promise.all(
    clinicians.map(clinicianId =>
      request(app).post('/appointments').set('X-Role', 'patient').send({
        clinicianId, patientId: `p-${clinicianId}`, start: slotStart, end: slotEnd,
      })
    )
  );
  expect(results.every(r => r.status === 201)).toBe(true);

  const { c } = db
    .prepare(
      `SELECT COUNT(*) AS c FROM appointments
       WHERE start = ? AND end = ?`
    )
    .get(slotStart, slotEnd) as { c: number };
  expect(c).toBe(clinicians.length);
});
