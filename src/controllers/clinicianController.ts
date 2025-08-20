import type { Request, Response } from 'express';
import { getClinicianAppointments } from '../services/clinicianService';

export function getAppointments(req: Request, res: Response) {
	const { id } = req.params as any;
	const { from, to } = req.query as any;
	const list = getClinicianAppointments(id, from, to);
	res.json(list);
}
