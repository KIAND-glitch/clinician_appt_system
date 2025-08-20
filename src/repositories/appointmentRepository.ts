
import { db } from '../config/db';
import { randomUUID } from 'node:crypto';
import { AppointmentEntity, Appointment, AppointmentSchema } from '../entities/appointment';

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

export function createAppointment(row: Omit<Appointment, 'id' | 'createdAt'>): AppointmentEntity {
	const id = randomUUID();
	const createdAt = new Date().toISOString();
	const data = { ...row, id, createdAt };
	AppointmentSchema.parse(data);
	db.prepare(
		`INSERT INTO appointments (id, clinician_id, patient_id, start, end, created_at)
		 VALUES (?, ?, ?, ?, ?, ?)`
	).run(id, row.clinicianId, row.patientId, row.start, row.end, createdAt);
	return new AppointmentEntity(data);
}

export function getAllAppointments(from?: string, to?: string): AppointmentEntity[] {
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
	const rows = db.prepare(query).all(...params);
	return rows.map((row: any) =>
		new AppointmentEntity(
			AppointmentSchema.parse({
				...row,
				clinicianId: row.clinician_id,
				patientId: row.patient_id,
				createdAt: row.created_at,
			})
		)
	);
}
