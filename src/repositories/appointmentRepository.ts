import { db } from '../config/db';
import { randomUUID } from 'node:crypto';
import { Appointment, AppointmentCreate, AppointmentSchema } from '../entities/appointment';

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

export function createAppointment(input: AppointmentCreate): Appointment {
  const id = randomUUID() as string;
  const createdAt = new Date().toISOString();

  const appt: Appointment = {
    id,
    clinicianId: input.clinicianId,
    patientId: input.patientId,
    start: input.start,
    end: input.end,
    createdAt,
  };

  AppointmentSchema.parse(appt);

  db.prepare(
    `INSERT INTO appointments (id, clinician_id, patient_id, start, end, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, input.clinicianId, input.patientId, input.start, input.end, createdAt);

  return appt;
}


export function getAllAppointments(from: string, to?: string): Appointment[] {
  let sql = `
    SELECT
      id,
      clinician_id AS clinicianId,
      patient_id  AS patientId,
      start,
      end,
      created_at  AS createdAt
    FROM appointments
  `;

  const conds: string[] = ['start >= ?'];
  const params: string[] = [from];

  if (to) { 
    conds.push('end <= ?');
    params.push(to);
  }

  sql += ' WHERE ' + conds.join(' AND ') + ' ORDER BY start ASC';

  const rows = db.prepare(sql).all(...params) as Appointment[];
  return rows.map(r => AppointmentSchema.parse(r));
}
