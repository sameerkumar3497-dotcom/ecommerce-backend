import express from 'express';
import healthRouter from './routes/health.routes';
import authRouter from './routes/auth.routes';
import { errorHandler } from './middlewares/error.middleware';

export const app = express();
app.use(express.json());

app.use('/health', healthRouter);
app.use('/auth', authRouter);

app.use(errorHandler);
