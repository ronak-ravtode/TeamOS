import { app } from './app';
import { config } from './config';
import { prisma } from './db/prisma';

async function connectWithRetry(maxRetries = 5, delayMs = 2500): Promise<boolean> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await prisma.$connect();
      console.log('✅ Connected to Supabase PostgreSQL database via Prisma');
      return true;
    } catch (err: any) {
      console.warn(
        `⚠️ Database connection attempt ${attempt}/${maxRetries} failed: ${err.message}. Retrying in ${delayMs / 1000}s...`,
      );
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  return false;
}

async function bootstrap() {
  try {
    const server = app.listen(config.port, async () => {
      console.log(`🚀 Team OS API (Express + TypeScript) running at http://localhost:${config.port}/api`);
      console.log(`📡 Health check: http://localhost:${config.port}/api/health`);

      // Verify database connection with resilient retries (pooler cold start protection)
      const connected = await connectWithRetry();
      if (!connected) {
        console.error('❌ Could not establish initial database connection. Requests will retry on demand.');
      }
    });

    const shutdown = async (signal: string) => {
      console.log(`\n🛑 Received ${signal}. Gracefully shutting down...`);
      server.close(async () => {
        await prisma.$disconnect();
        console.log('🔒 Database connection closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();

