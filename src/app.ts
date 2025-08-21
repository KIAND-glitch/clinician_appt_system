import express from 'express';
import cors from 'cors';
import appointmentRoutes from './routes/appointmentRoutes';
import clinicianRoutes from './routes/clinicianRoutes';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './docs/swagger';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use('/', appointmentRoutes);
  app.use('/', clinicianRoutes);

  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

  // 404
  app.use((_req, res) => res.status(404).json({ message: 'route does not exist' }));

  // Error handler
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (res.headersSent) return;
    const status = typeof err?.status === 'number' ? err.status : 500;
    res.status(status).json({ message: err?.message ?? 'internal error' });
  });

  return app;
}

export const app = createApp();
