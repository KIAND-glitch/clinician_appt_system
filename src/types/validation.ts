import { z } from 'zod';

export const DateTimeString = z.string().datetime({ offset: true });

export const DateRangeQuerySchema = z.object({
  from: DateTimeString.optional(),
  to:   DateTimeString.optional(),
}).strict().superRefine((val, ctx) => {
  if (val.from && val.to && Date.parse(val.from) > Date.parse(val.to)) {
    ctx.addIssue({ code: 'custom', path: ['from'], message: 'from must be before to' });
  }
});

export const IdParamSchema = z.object({ id: z.string().min(1, 'id is required') });

export type DateRangeQuery = z.infer<typeof DateRangeQuerySchema>;
export type IdParam = z.infer<typeof IdParamSchema>;
