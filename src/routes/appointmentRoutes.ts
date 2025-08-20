
import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middlewares/validate';
import * as controller from '../controllers/appointmentController';


const router = Router();

// Zod schema for GET query params
const isIsoDate = (val: string) => !isNaN(Date.parse(val));
const getQuery = z.object({
  from: z.string().optional().refine(val => !val || isIsoDate(val), { message: 'Invalid ISO date' }),
  to: z.string().optional().refine(val => !val || isIsoDate(val), { message: 'Invalid ISO date' }),
});

router.get('/appointments', validate({ query: getQuery }), controller.get);

// Zod schema for the POST body
const createBody = z.object({
  clinicianId: z.string().min(1),
  patientId: z.string().min(1),
  start: z.string().refine(isIsoDate, { message: 'Invalid ISO date' }),
  end: z.string().refine(isIsoDate, { message: 'Invalid ISO date' })
});

router.post('/appointments', validate({ body: createBody }), controller.create);

export default router;
