import app from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { prisma } from './config/db';

const PORT = parseInt(env.PORT, 10) || 5000;

const server = app.listen(PORT, async () => {
  logger.info(`🚀 Server running in [${env.NODE_ENV}] mode on port ${PORT}`);
  logger.info(`📡 Health Check: http://localhost:${PORT}${env.API_PREFIX}/health`);
});

// Graceful Shutdown handling
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    logger.info('HTTP server closed.');
    await prisma.$disconnect();
    logger.info('Database connection closed.');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason: Error) => {
  logger.error('Unhandled Rejection at Promise:', reason);
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception thrown:', error);
  process.exit(1);
});
