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
}).superRefine((val, ctx) => {
  if (val.from && val.to) {
    const f = Date.parse(val.from);
    const t = Date.parse(val.to);
    if (f > t) ctx.addIssue({ code: 'custom', path: ['from'], message: 'from must be before to' });
  }
});
const clinicianParams = z.object({ id: z.string().min(1) });

router.get(
  '/clinicians/:id/appointments',
  requireRole(['clinician','admin']),
  validate({ params: clinicianParams, query: getQuery }),
  clinicianController.getAppointments,
);

export default router;
