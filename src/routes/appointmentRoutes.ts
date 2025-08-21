
import { Router } from 'express';
import { validate } from '../middlewares/validate';
import { requireRole } from '../middlewares/auth';
import * as appointmentController from '../controllers/appointmentController';
import { AppointmentCreateSchema } from '../entities/appointment';
import { DateRangeQuerySchema } from '../types/validation';


const router = Router();

router.get('/appointments',
  requireRole(['admin']),
  validate({ query: DateRangeQuerySchema }),
  appointmentController.get);

router.post(
  '/appointments',
  requireRole(['patient', 'admin']),
  validate({ body: AppointmentCreateSchema }),
  appointmentController.create);

export default router;
