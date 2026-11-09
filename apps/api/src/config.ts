import dotenv from 'dotenv';
import path from 'path';

// Load from apps/api/.env or root .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  databaseUrl:
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgrespassword@localhost:5432/teamos?schema=public',
  jwtAccessSecret:
    process.env.JWT_ACCESS_SECRET ||
    'super-secret-jwt-access-key-minimum-32-chars-long',
  jwtAccessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
  jwtRefreshSecret:
    process.env.JWT_REFRESH_SECRET ||
    'super-secret-jwt-refresh-key-minimum-32-chars-long',
  jwtRefreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  corsOrigin: process.env.CORS_ORIGIN || '*',
};

