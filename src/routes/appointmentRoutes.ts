
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
}).superRefine((val, ctx) => {
  if (val.from && val.to) {
    const f = Date.parse(val.from);
    const t = Date.parse(val.to);
    if (f > t) {
      ctx.addIssue({ code: 'custom', path: ['from'], message: 'from must be before to' });
    }
  }
});

router.get('/appointments',
  requireRole(['admin']),
  validate({ query: getQuery }),
  appointmentController.get);

router.post(
  '/appointments',
  requireRole(['patient', 'admin']),
  validate({ body: AppointmentCreateSchema }),
  appointmentController.create);

export default router;
