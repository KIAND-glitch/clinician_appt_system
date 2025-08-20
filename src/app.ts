import express from 'express';
import cors from 'cors';
import appointmentRoutes from './routes/appointmentRoutes';
import clinicianRoutes from './routes/clinicianRoutes';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use('/', appointmentRoutes);
  app.use('/', clinicianRoutes);

  app.use((_req, _res, next) => next({ status: 404, message: 'route does not exist' }));

  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (res.headersSent) return;
    const status = typeof err?.status === 'number' ? err.status : 500;
    const message = typeof err?.message === 'string' ? err.message : 'internal error';
    res.status(status).json({ message });
  });

  return app;
}

export const app = createApp();
