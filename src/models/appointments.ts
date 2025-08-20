import { db } from '../config/db';
import { randomUUID } from 'node:crypto';
import { Appointment } from '../types/types';

export function ensurePatient(id: string) {
  db.prepare('INSERT OR IGNORE INTO patients (id) VALUES (?)').run(id);
}

export function ensureClinician(id: string) {
  db.prepare('INSERT OR IGNORE INTO clinicians (id) VALUES (?)').run(id);
}

export function hasOverlap(clinicianId: string, start: string, end: string): boolean {
  const row = db.prepare(
    `SELECT 1 FROM appointments
     WHERE clinician_id = ? AND ? < end AND ? > start
     LIMIT 1`
  ).get(clinicianId, start, end);
  return !!row;
}

export function createAppointment(row: Omit<Appointment, 'id' | 'createdAt'>): Appointment {
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  try {
    db.prepare(
      `INSERT INTO appointments (id, clinician_id, patient_id, start, end, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(id, row.clinicianId, row.patientId, row.start, row.end, createdAt);
  } catch (e: any) {
    if (typeof e.message === 'string' && e.message.includes('overlap')) {
      const err: any = new Error('overlap');
      err.code = 'OVERLAP';
      throw err;
    }
    throw e;
  }
  return { id, clinicianId: row.clinicianId, patientId: row.patientId, start: row.start, end: row.end, createdAt };
}

export function getAllAppointments(from?: string, to?: string): Appointment[] {
  let query = 'SELECT * FROM appointments';
  const params: string[] = [];
  if (from && to) {
    query += ' WHERE start >= ? AND end <= ?';
    params.push(from, to);
  } else if (from) {
    query += ' WHERE start >= ?';
    params.push(from);
  } else if (to) {
    query += ' WHERE end <= ?';
    params.push(to);
  }
  query += ' ORDER BY start ASC';
  return db.prepare(query).all(...params) as Appointment[];
}