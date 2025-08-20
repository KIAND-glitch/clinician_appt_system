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

/**
 * @openapi
 * /clinicians/{id}/appointments:
 *   get:
 *     summary: List a clinician's upcoming appointments
 *     tags:
 *       - clinicians
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: A list of appointments for the clinician
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Appointment'
 */
router.get(
  '/clinicians/:id/appointments',
  requireRole(['clinician','admin']),
  validate({ params: clinicianParams, query: getQuery }),
  clinicianController.getAppointments,
);

export default router;
