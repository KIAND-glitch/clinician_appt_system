// tests/race-determinism.test.ts
import request from 'supertest';
import { app } from '../src/app';
import { db } from '../src/config/db';

process.env.DB_PATH = ':memory:';

jest.setTimeout(20000);

const clinicianId = 'c-determinism';
const patientIdsBase = ['p1', 'p2', 'p3', 'p4'];

// Fixed slot 1 hour from "now"
const slotStart = new Date(Date.now() + 60 * 60 * 1000).toISOString();
const slotEnd   = new Date(Date.now() + 90 * 60 * 1000).toISOString();

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function cleanup() {
  db.exec('DELETE FROM appointments; DELETE FROM patients; DELETE FROM clinicians;');
}

async function raceOnce(trial: number): Promise<string> {
  // Randomise patient submission order to reduce bias.
  const patientIds = shuffle(patientIdsBase);

  // Fire all four requests "concurrently".
  const results = await Promise.all(
    patientIds.map((patientId) =>
      request(app)
        .post('/appointments')
        .set('X-Role', 'patient')
        .send({ clinicianId, patientId, start: slotStart, end: slotEnd })
    )
  );

  const count201 = results.filter(r => r.status === 201).length;
  const count409 = results.filter(r => r.status === 409).length;

  expect(count201).toBe(1);
  expect(count409).toBe(3);

  // Identify the winner
  const winnerResp = results.find(r => r.status === 201);
  if (!winnerResp) throw new Error('No winner found (expected exactly one 201).');

  const winnerPatientId = winnerResp.body?.patientId;
  expect(typeof winnerPatientId).toBe('string');

  // Sanity-check DB has exactly one row for this slot
  const { c } = db.prepare(
    `SELECT COUNT(*) AS c FROM appointments WHERE clinician_id = ? AND start = ? AND end = ?`
  ).get(clinicianId, slotStart, slotEnd) as { c: number };
  expect(c).toBe(1);

  // Clean slate for next trial
  await cleanup();

  return winnerPatientId as string;
}

beforeAll(async () => {
  await cleanup();
});

afterEach(async () => {
  await cleanup();
});

test('four concurrent patients; repeat 4 trials; log winners to observe determinism', async () => {
  const trials = 4;
  const winners: string[] = [];

  for (let t = 1; t <= trials; t++) {
    const winner = await raceOnce(t);
    winners.push(winner);
  }

  // Always exactly 4 winners recorded
  expect(winners).toHaveLength(trials);

  // eslint-disable-next-line no-console
  // console.log('Race winners by trial:', winners);
});
