import { nowUtcIso } from '../utils/date';
import { getAppointmentsByClinician } from '../repositories/clinicianRepository';
import type { Appointment } from '../entities/appointment';

export function getClinicianAppointments(clinicianId: string, from?: string, to?: string): Appointment[] {
  const effectiveFrom = from ?? nowUtcIso();
  return getAppointmentsByClinician(clinicianId, effectiveFrom, to).map(e => e.data);
}
