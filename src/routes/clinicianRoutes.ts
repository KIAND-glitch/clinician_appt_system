import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middlewares/validate';
import { requireRole } from '../middlewares/auth';
import * as clinicianController from '../controllers/clinicianController';
import { IsoString } from '../utils/date';

const router = Router();

const getQuery = z.object({
  from: IsoString.optional(),
  to:   IsoString.optional(),
});
const clinicianParams = z.object({ id: z.string().min(1) });

router.get(
  '/clinicians/:id/appointments',
  requireRole(['clinician','admin']),
  validate({ params: clinicianParams, query: getQuery }),
  clinicianController.getAppointments,
);

export default router;
