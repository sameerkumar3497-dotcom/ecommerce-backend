import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

const nodeEnv = process.env.NODE_ENV || 'development';

export const env = {
  nodeEnv,
  isProduction: nodeEnv === 'production',
  logLevel:
    process.env.LOG_LEVEL || (nodeEnv === 'production' ? 'info' : 'debug'),
  port: Number(process.env.PORT) || 3000,
  databaseUrl: process.env.DATABASE_URL as string,
  redisUrl: process.env.REDIS_URL as string,
  jwtAccessSecret: required('JWT_ACCESS_SECRET'),
  accessTokenTtlSeconds: 15 * 60,
  refreshTokenTtlDays: 7,
};
