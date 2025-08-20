
import { z } from 'zod';

export const AppointmentSchema = z.object({
	id: z.string().uuid(),
	clinicianId: z.string().min(1),
	patientId: z.string().min(1),
	start: z.string().datetime({ offset: true }),
	end: z.string().datetime({ offset: true }),
	createdAt: z.string().datetime({ offset: true }),
});

export type Appointment = z.infer<typeof AppointmentSchema>;

export class AppointmentEntity {
	constructor(public readonly data: Appointment) {}

	// Example domain method
	durationMinutes(): number {
		return (new Date(this.data.end).getTime() - new Date(this.data.start).getTime()) / 60000;
	}
}
