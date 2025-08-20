
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
});

/**
 * @openapi
 * /appointments:
 *   get:
 *     summary: List appointments
 *     description: Return all appointments, optionally filtered by from/to ISO datetimes.
 *     tags:
 *       - appointments
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *         description: ISO datetime to filter appointments starting at or after this time
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *         description: ISO datetime to filter appointments ending at or before this time
 *     responses:
 *       200:
 *         description: A list of appointments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Appointment'
 */
router.get('/appointments',
  requireRole(['admin']),
  validate({ query: getQuery }),
  appointmentController.get);

/**
 * @openapi
 * /appointments:
 *   post:
 *     summary: Create an appointment
 *     tags:
 *       - appointments
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AppointmentCreate'
 *     responses:
 *       201:
 *         description: Appointment created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Appointment'
 */
const createBody = AppointmentCreateSchema;

router.post(
  '/appointments',
  requireRole(['patient', 'admin']),
  validate({ body: AppointmentCreateSchema }),
  appointmentController.create);

export default router;
