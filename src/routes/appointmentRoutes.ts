
import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middlewares/validate';
import { requireRole } from '../middlewares/auth';
import * as appointmentController from '../controllers/appointmentController';
import { AppointmentCreateSchema } from '../entities/appointment';
import { IsoString } from '../utils/date';


const router = Router();

const getQuery = z.object({
  from: IsoString.optional(),
  to:   IsoString.optional(),
});

router.get('/appointments',
  requireRole(['admin']),
  validate({ query: getQuery }),
  appointmentController.get);

const createBody = z.object({
  clinicianId: z.string().min(1),
  patientId: z.string().min(1),
  start: IsoString,
  end: IsoString,
});

router.post(
  '/appointments',
  requireRole(['patient', 'admin']),
  validate({ body: AppointmentCreateSchema }),
  appointmentController.create);

export default router;
