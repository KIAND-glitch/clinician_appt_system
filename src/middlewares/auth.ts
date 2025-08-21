import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { RoleSchema, type Role } from '../entities/role';

export const requireRole = (allowed: Role[]): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) => {
    const raw = (req.get('x-role') || '').toLowerCase();
    if (!raw) return res.status(403).json({ message: 'forbidden' });

    const parsed = RoleSchema.safeParse(raw);
    if (!parsed.success) return res.status(403).json({ message: 'forbidden' });
    if (!allowed.includes(parsed.data)) return res.status(403).json({ message: 'forbidden' });

    (req as any).role = parsed.data;
    next();
  };
