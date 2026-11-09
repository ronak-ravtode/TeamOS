import dotenv from 'dotenv';
import path from 'path';

// Guarantee environment variables are loaded before PrismaClient initializes
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();


