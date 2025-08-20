import type { Request, Response, NextFunction } from 'express';

export type Role = 'patient' | 'clinician' | 'admin';

export function requireRole(allowed: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = (req.header('X-Role') || req.header('x-role') || '').toLowerCase();
    if (!allowed.map(r => r.toLowerCase()).includes(role)) {
      return res.status(403).json({ message: 'forbidden' });
    }
    next();
  };
}
