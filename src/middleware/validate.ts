import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';

type AnySchema = z.ZodType<any, any, any>;

type Schema = {
  body?: AnySchema;
  query?: AnySchema;
  params?: AnySchema;
};

export function validate(schema: Schema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const bad = (details: unknown) =>
      res.status(400).json({ message: 'Invalid input', details });

    if (schema.body) {
      const r = schema.body.safeParse(req.body);
      if (!r.success) return bad(r.error.flatten());
      if (req.body && typeof req.body === 'object') Object.assign(req.body as any, r.data);
      else (req as any).body = r.data;
    }

    if (schema.query) {
      const r = schema.query.safeParse(req.query);
      if (!r.success) return bad(r.error.flatten());
      Object.assign(req.query as any, r.data);
    }

    if (schema.params) {
      const r = schema.params.safeParse(req.params);
      if (!r.success) return bad(r.error.flatten());
      Object.assign(req.params as any, r.data);
    }

    next();
  };
}
