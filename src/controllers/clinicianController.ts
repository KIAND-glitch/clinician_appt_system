import type { Request, Response } from 'express';
import { getClinicianAppointments, NotFound } from '../services/clinicianService';

export function getAppointments(req: Request, res: Response) {
	try {
		const { id } = req.params as { id: string };
		const { from, to } = req.query as { from?: string; to?: string };
		const list = getClinicianAppointments(id, from, to);
		res.json(list);
	} catch (e: any) {
		if (e instanceof NotFound) return res.status(404).json({ message: e.message });
		console.error(e);
		res.status(500).json({ error: 'Internal server error' });
	}
}
