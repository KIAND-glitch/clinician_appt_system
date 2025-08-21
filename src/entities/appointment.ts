import { z } from 'zod';

const IsoString = z.string().refine(v => !Number.isNaN(Date.parse(v)), { message: 'Invalid input' });

export const AppointmentCreateSchema = z.object({
  clinicianId: z.string().min(1),
  patientId: z.string().min(1),
  start: IsoString,
  end: IsoString,
}).strict().superRefine((val, ctx) => {
  const s = Date.parse(val.start);
  const e = Date.parse(val.end);
  if (!(s < e)) {
    ctx.addIssue({ code: 'custom', path: ['start'], message: 'Invalid input' });
  }
});

export const AppointmentSchema = z.object({
  id: z.uuid(),
  clinicianId: z.string().min(1),
  patientId: z.string().min(1),
  start: IsoString,
  end: IsoString,
  createdAt: IsoString,
});

export type AppointmentCreate = z.infer<typeof AppointmentCreateSchema>;
export type Appointment = z.infer<typeof AppointmentSchema>;
