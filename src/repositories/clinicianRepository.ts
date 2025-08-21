import { db } from '../config/db';
import { Appointment, AppointmentSchema } from '../entities/appointment';

export function clinicianExists(clinicianId: string): boolean {
    const row = db.prepare('SELECT 1 FROM clinicians WHERE id = ?').get(clinicianId);
    return !!row;
}

export function getAppointmentsByClinician(
  clinicianId: string,
  from: string,
  to?: string
): Appointment[] {
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

  const conds: string[] = ['clinician_id = ?', 'start >= ?'];
  const params: string[] = [clinicianId, from];

  if (to) { 
    conds.push('end <= ?'); 
    params.push(to); 
  }

  sql += ' WHERE ' + conds.join(' AND ') + ' ORDER BY start ASC';

  const rows = db.prepare(sql).all(...params) as Appointment[];
  return rows.map(r => AppointmentSchema.parse(r));
}