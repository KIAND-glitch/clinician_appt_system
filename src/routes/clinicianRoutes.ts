import { Router } from 'express';
import { validate } from '../middlewares/validate';
import { requireRole } from '../middlewares/auth';
import { getAppointments } from '../controllers/clinicianController';
import { DateRangeQuerySchema, IdParamSchema } from '../types/getRequestValidation';

const router = Router();

router.get(
  '/clinicians/:id/appointments',
  requireRole(['clinician','admin']),
  validate({ params: IdParamSchema, query: DateRangeQuerySchema }),
  getAppointments,
);

export default router;
