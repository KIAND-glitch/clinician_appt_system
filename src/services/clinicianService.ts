import { nowUtcIso } from '../utils/date';
import { getAppointmentsByClinician, isClinician } from '../repositories/clinicianRepository';
import type { Appointment } from '../entities/appointment';

export function getClinicianAppointments(clinicianId: string, from?: string, to?: string): Appointment[] {
    const effectiveFrom = from ?? nowUtcIso();
    if (!isClinician(clinicianId)) return [];
    return getAppointmentsByClinician(clinicianId, effectiveFrom, to).map(e => e.data);
}
