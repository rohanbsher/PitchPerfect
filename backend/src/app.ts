import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import { config } from './config/env.js';
import { registerRateLimiting } from './api/middleware/rateLimit.middleware.js';

// Import routes
import { authRoutes } from './api/routes/auth.routes.js';
import { aiRoutes } from './api/routes/ai.routes.js';
import { ttsRoutes } from './api/routes/tts.routes.js';

/**
 * Build and configure the Fastify application
 */
export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: config.server.isDev ? 'debug' : 'info',
      transport: config.server.isDev
        ? {
            target: 'pino-pretty',
            options: {
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
    },
    trustProxy: true, // Required for rate limiting behind reverse proxy
  });

  // Security headers
  await app.register(helmet, {
    contentSecurityPolicy: false, // Disable CSP for API
  });

  // CORS
  await app.register(cors, {
    origin: config.cors.origin === '*' ? true : config.cors.origin.split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // JWT authentication
  await app.register(jwt, {
    secret: config.jwt.secret,
    sign: {
      expiresIn: config.jwt.expiresIn,
    },
  });

  // Rate limiting
  await registerRateLimiting(app);

  // Health check endpoint
  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  }));

  // API routes
  await app.register(authRoutes, { prefix: '/api/v1/auth' });
  await app.register(aiRoutes, { prefix: '/api/v1/ai' });
  await app.register(ttsRoutes, { prefix: '/api/v1/tts' });

  // Global error handler
  app.setErrorHandler((error, request, reply) => {
    app.log.error(error);

    // Handle validation errors
    if (error.validation) {
      return reply.status(400).send({
        success: false,
        error: 'Validation Error',
        message: error.message,
      });
    }

    // Handle JWT errors
    if (error.code === 'FST_JWT_NO_AUTHORIZATION_IN_HEADER') {
      return reply.status(401).send({
        success: false,
        error: 'Unauthorized',
        message: 'No authorization header provided',
      });
    }

    // Default error response
    const statusCode = error.statusCode || 500;
    return reply.status(statusCode).send({
      success: false,
      error: statusCode >= 500 ? 'Internal Server Error' : error.name,
      message: config.server.isDev ? error.message : 'An error occurred',
    });
  });

  // 404 handler
  app.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      success: false,
      error: 'Not Found',
      message: `Route ${request.method} ${request.url} not found`,
    });
  });

  return app;
}
