
import { getAppointmentsInRange } from '../services/appointmentService';
import { Request, Response } from 'express';
import { createAppointmentForPatient, BadRequest, Conflict } from '../services/appointmentService';
import { AppointmentCreate } from '../entities/appointment';

export function createAppointment(req: Request, res: Response) {
  try {
    const input = req.body as AppointmentCreate;
    const created = createAppointmentForPatient(input);
    return res.status(201).json(created);
  } catch (e: any) {
    if (e instanceof Conflict)   return res.status(409).json({ message: e.message });
    if (e instanceof BadRequest) return res.status(400).json({ message: e.message });
    console.error(e);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export function getAppointments(req: Request, res: Response) {
  try {
    const { from, to } = req.query as { from?: string; to?: string };
    const appointments = getAppointmentsInRange(from, to);
    return res.json(appointments);
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
