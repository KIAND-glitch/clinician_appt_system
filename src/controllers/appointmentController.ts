import { Request, Response } from 'express';
import { createAppointmentForPatient, BadRequest, Conflict, CreateAppointmentInput } from '../services/appointmentService';

export async function create(req: Request, res: Response) {
  try {
    const input = req.body as CreateAppointmentInput;
    const created = await createAppointmentForPatient(input);
    return res.status(201).json(created);
  } catch (e: any) {
    if (e instanceof Conflict)   return res.status(409).json({ message: e.message });
    if (e instanceof BadRequest) return res.status(400).json({ message: e.message });
    console.error(e);
    return res.status(500).json({ message: 'internal error' });
  }
}
