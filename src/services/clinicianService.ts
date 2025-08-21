import { nowUtcIso } from '../utils/date';
import { getAppointmentsByClinician, clinicianExists } from '../repositories/clinicianRepository';
import type { Appointment } from '../entities/appointment';

export class NotFound extends Error { status = 404; }

export function getClinicianAppointments(clinicianId: string, from?: string, to?: string): Appointment[] {
    const effectiveFrom = from ?? nowUtcIso();
    if (!clinicianExists(clinicianId)) throw new NotFound('Clinician not found');
    return getAppointmentsByClinician(clinicianId, effectiveFrom, to);
}
