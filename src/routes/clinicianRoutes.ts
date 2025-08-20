import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middlewares/validate';
import * as clinicianController from '../controllers/clinicianController';

const router = Router();

const isIsoDate = (val: string) => !isNaN(Date.parse(val));
const getQuery = z.object({
  from: z.string().optional().refine(val => !val || isIsoDate(val), { message: 'Invalid ISO date' }),
  to: z.string().optional().refine(val => !val || isIsoDate(val), { message: 'Invalid ISO date' }),
});
const clinicianParams = z.object({ id: z.string().min(1) });

router.get('/clinicians/:id/appointments', validate({ params: clinicianParams, query: getQuery }), clinicianController.getAppointments);

export default router;
