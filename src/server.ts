import { app } from './app';
import { env } from './config/env';
import { logger } from './config/logger';

app.listen(env.port, () => {
  logger.info(`Server running on port ${env.port}`);
});

// Log crashes in the same structured format
process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'Unhandled promise rejection');
});

process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception, shutting down');
  process.exit(1);
});
