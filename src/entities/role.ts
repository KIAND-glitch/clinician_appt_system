import { z } from 'zod';

export const ROLES = ['patient', 'clinician', 'admin'] as const;
export type Role = typeof ROLES[number];
export const RoleSchema = z.enum(ROLES);
