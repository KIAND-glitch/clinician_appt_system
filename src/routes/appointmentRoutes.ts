
import { Router } from 'express';
import { validate } from '../middlewares/validate';
import { requireRole } from '../middlewares/auth';
import { getAppointments, createAppointment } from '../controllers/appointmentController';
import { AppointmentCreateSchema } from '../entities/appointment';
import { DateRangeQuerySchema } from '../types/getRequestValidation';

const router = Router();

router.get(
  '/appointments',
  requireRole(['admin']),
  validate({ query: DateRangeQuerySchema }),
  getAppointments
);

router.post(
  '/appointments',
  requireRole(['patient', 'admin']),
  validate({ body: AppointmentCreateSchema }),
  createAppointment
);

export default router;
