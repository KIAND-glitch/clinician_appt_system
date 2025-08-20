import { db } from '../config/db';
import { AppointmentEntity, AppointmentSchema } from '../entities/appointment';

export function isClinician(clinicianId: string): boolean {
    const row = db.prepare('SELECT 1 FROM clinicians WHERE id = ?').get(clinicianId);
    return !!row;
}

export function getAppointmentsByClinician(clinicianId: string, from?: string, to?: string): AppointmentEntity[] {
    let query = 'SELECT * FROM appointments WHERE clinician_id = ?';
    const params: any[] = [clinicianId];
    if (from && to) {
        query += ' AND start >= ? AND end <= ?';
        params.push(from, to);
    } else if (from) {
        query += ' AND start >= ?';
        params.push(from);
    } else if (to) {
        query += ' AND end <= ?';
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