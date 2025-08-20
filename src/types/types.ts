export type Role = 'patient' | 'clinician' | 'admin';


export interface Appointment {
    id: string;
    clinicianId: string;
    patientId: string;
    start: string;
    end: string;
    createdAt: string;
}