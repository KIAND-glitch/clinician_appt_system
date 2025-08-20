import { parseIsoToUtcString, isStrictlyBefore, nowUtcIso } from '../utils/date';
import { ensureClinician, ensurePatient, hasOverlap, createAppointment, getAllAppointments } from '../models/appointments';
import { Appointment } from '../types/types';

export class BadRequest extends Error { status = 400; }
export class Conflict extends Error { status = 409; }

export type CreateAppointmentInput = {
  clinicianId: string;
  patientId: string;
  start: string;
  end: string;
};

export function getAppointmentsInRange(from?: string, to?: string): Appointment[] {
  return getAllAppointments(from, to);
}

export function createAppointmentForPatient(input: CreateAppointmentInput): Appointment {
  const startIso = parseIsoToUtcString(input.start);
  const endIso   = parseIsoToUtcString(input.end);
  if (!startIso || !endIso) {
    throw new BadRequest('start and end must be valid ISO datetimes');
  }
  if (!isStrictlyBefore(startIso, endIso)) {
    throw new BadRequest('start must be strictly before end');
  }
  // reject past
  if (!isStrictlyBefore(nowUtcIso(), startIso)) {
    throw new BadRequest('appointments in the past are not allowed');
  }

  ensurePatient(input.patientId);
  ensureClinician(input.clinicianId);

  if (hasOverlap(input.clinicianId, startIso, endIso)) {
    throw new Conflict('overlapping appointment for clinician');
  }

  try {
    return createAppointment({
      clinicianId: input.clinicianId,
      patientId: input.patientId,
      start: startIso,
      end: endIso
    });
  } catch (e: any) {
    if (e.code === 'OVERLAP') {
      throw new Conflict('overlapping appointment for clinician');
    }
    throw e;
  }
}
