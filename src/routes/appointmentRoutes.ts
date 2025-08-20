import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import * as controller from '../controllers/appointmentController';

const router = Router();

// Zod schema just for the POST body
const createBody = z.object({
  clinicianId: z.string().min(1),
  patientId: z.string().min(1),
  start: z.string(),
  end: z.string()
});

router.post('/appointments', validate({ body: createBody }), controller.create);

export default router;
