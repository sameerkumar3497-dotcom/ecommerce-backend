import { randomUUID } from 'node:crypto';
import express from 'express';
import { pinoHttp } from 'pino-http';
import { logger } from './config/logger';
import healthRouter from './routes/health.routes';
import authRouter from './routes/auth.routes';
import adminRouter from './routes/admin.routes';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';

export const app = express();

// Must be first, so every later step (including body parsing errors) can log
app.use(
  pinoHttp({
    logger,
    // Reuse the caller's request ID if it sent a sensible one, otherwise make one
    genReqId: (req, res) => {
      const incoming = req.headers['x-request-id'];
      const id =
        typeof incoming === 'string' &&
        incoming.length > 0 &&
        incoming.length <= 100
          ? incoming
          : randomUUID();
      res.setHeader('X-Request-Id', id);
      return id;
    },
    // Health checks run constantly and would flood the logs
    autoLogging: { ignore: (req) => req.url === '/health' },
    // 5xx = error, 4xx = warn, everything else = info
    customLogLevel: (_req, res, err) => {
      if (err || res.statusCode >= 500) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
    // Keep each line short and never log headers or bodies
    serializers: {
      req: (req) => ({ id: req.id, method: req.method, url: req.url }),
      res: (res) => ({ statusCode: res.statusCode }),
    },
  }),
);

app.use(express.json());

app.use('/health', healthRouter);
app.use('/auth', authRouter);
app.use('/admin', adminRouter);

app.use(notFoundHandler);
app.use(errorHandler);
