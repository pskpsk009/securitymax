import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { registerRoutes } from './routes';
import { swaggerSpec } from './docs/swagger';

export const createApp = () => {
  const app = express();

  app.use(cors({ origin: true }));
  app.use(express.json());

  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/docs.json', (_req, res) => {
    res.json(swaggerSpec);
  });

  registerRoutes(app);

  return app;
};
