import { createAppointmentForPatient } from '../src/services/appointmentService';

// Clinicians and patients
const clinicians = ['c1', 'c2', 'c3'];
const patients = ['p1', 'p2', 'p3'];

// Start 1 hour in the future
const base = new Date(Date.UTC(2025, 7, 24, 0, 0, 0, 0)); // August is month 7 (0-based)

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60000);
}

function toIsoString(date: Date) {
  return date.toISOString();
}

function seedAppointments() {
  const appointments = [
    // C1 appointments: 0-30, 60-90, 120-150
    {
      clinicianId: clinicians[0], patientId: patients[0],
      start: toIsoString(addMinutes(base, 0)), end: toIsoString(addMinutes(base, 30)),
    },
    {
      clinicianId: clinicians[0], patientId: patients[1],
      start: toIsoString(addMinutes(base, 60)), end: toIsoString(addMinutes(base, 90)),
    },
    {
      clinicianId: clinicians[0], patientId: patients[2],
      start: toIsoString(addMinutes(base, 120)), end: toIsoString(addMinutes(base, 150)),
    },
    // C2 appointments: 15-45, 100-130
    {
      clinicianId: clinicians[1], patientId: patients[1],
      start: toIsoString(addMinutes(base, 15)), end: toIsoString(addMinutes(base, 45)),
    },
    {
      clinicianId: clinicians[1], patientId: patients[2],
      start: toIsoString(addMinutes(base, 100)), end: toIsoString(addMinutes(base, 130)),
    },
    // C3 appointments: 10-40, 70-100, 140-170
    {
      clinicianId: clinicians[2], patientId: patients[2],
      start: toIsoString(addMinutes(base, 10)), end: toIsoString(addMinutes(base, 40)),
    },
    {
      clinicianId: clinicians[2], patientId: patients[0],
      start: toIsoString(addMinutes(base, 70)), end: toIsoString(addMinutes(base, 100)),
    },
    {
      clinicianId: clinicians[2], patientId: patients[1],
      start: toIsoString(addMinutes(base, 140)), end: toIsoString(addMinutes(base, 170)),
    },
  ];

  appointments.forEach((appt, idx) => {
    try {
      const created = createAppointmentForPatient(appt);
      console.log(`Created appointment #${idx + 1}:`, created);
    } catch (e) {
      if (e instanceof Error) {
        console.error(`Failed to create appointment #${idx + 1}:`, e.message);
      } else {
        console.error(`Failed to create appointment #${idx + 1}:`, e);
      }
    }
  });
}

seedAppointments();
