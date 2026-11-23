import pino from 'pino';
import { env } from './env';

export const logger = pino({
  level: env.logLevel,
  // Safety net: if any of these fields ever get logged, hide the value
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
      'password',
      'refreshToken',
      '*.password',
      '*.refreshToken',
    ],
    censor: '[REDACTED]',
  },
  // Pretty, colored output in development only
  ...(env.isProduction
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss',
            ignore: 'pid,hostname',
          },
        },
      }),
});
