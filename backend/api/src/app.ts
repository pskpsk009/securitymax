import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { registerRoutes } from './routes';
import { swaggerSpec } from './docs/swagger';
import { env } from './config/env';

export const createApp = () => {
  const app = express();

  // Security headers (X-Content-Type-Options, X-Frame-Options, HSTS, etc.)
  app.use(helmet());

  // CORS — restrict to configured frontend origins
  app.use(cors({
    origin: env.corsOrigins,
    credentials: true,
  }));

  // Global rate limit — 100 requests per 15 minutes per IP
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
  }));

  app.use(express.json());

  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/docs.json', (_req, res) => {
    res.json(swaggerSpec);
  });

  registerRoutes(app);

  return app;
};
