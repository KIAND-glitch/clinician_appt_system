import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middlewares/validate';
import { requireRole } from '../middlewares/auth';
import * as clinicianController from '../controllers/clinicianController';
import { DateRangeQuerySchema, IdParamSchema } from '../types/validation';

const router = Router();

router.get(
  '/clinicians/:id/appointments',
  requireRole(['clinician','admin']),
  validate({ params: IdParamSchema, query: DateRangeQuerySchema }),
  clinicianController.getAppointments,
);

export default router;
