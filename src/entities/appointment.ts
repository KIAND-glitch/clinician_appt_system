
import { z } from 'zod';

const isIsoDate = (val: string) => !isNaN(Date.parse(val));

export const AppointmentSchema = z
    .object({
        id: z.string().uuid(),
        clinicianId: z.string().min(1),
        patientId: z.string().min(1),
        start: z.string().refine(isIsoDate, { message: 'Invalid ISO date' }),
        end: z.string().refine(isIsoDate, { message: 'Invalid ISO date' }),
        createdAt: z.string().refine(isIsoDate, { message: 'Invalid ISO date' }),
    })
    .superRefine((val, ctx) => {
        const s = new Date(val.start).getTime();
        const e = new Date(val.end).getTime();
        const now = Date.now();
        if (!(s < e)) {
            ctx.addIssue({ code: 'custom', path: ['start'], message: 'start must be strictly before end' });
        }
        if (s <= now) {
            ctx.addIssue({ code: 'custom', path: ['start'], message: 'start must be in the future' });
        }
    });

export type Appointment = z.infer<typeof AppointmentSchema>;

export class AppointmentEntity {
	constructor(public readonly data: Appointment) {}
}
