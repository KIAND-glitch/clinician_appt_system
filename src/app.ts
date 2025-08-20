import express from 'express';
import cors from 'cors';
import appointmentRoutes from './routes/appointmentRoutes';
import clinicianRoutes from './routes/clinicianRoutes';

export const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => res.json({ ok: true }));

app.use('/', appointmentRoutes);
app.use('/', clinicianRoutes);

app.use((err: any, _req: any, res: any, _next: any) => {
  const status = err?.status ?? 500;
  const message = err?.message ?? 'internal error';
  res.status(status).json({ message });
});
