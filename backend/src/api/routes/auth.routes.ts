import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { validateBody } from '../middleware/validation.middleware.js';
import { createRateLimiter } from '../middleware/rateLimit.middleware.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

// Request schemas
const registerSchema = z.object({
  deviceId: z.string().min(1, 'Device ID is required'),
});

const refreshSchema = z.object({
  deviceId: z.string().min(1, 'Device ID is required'),
});

// Type declarations
type RegisterBody = z.infer<typeof registerSchema>;
type RefreshBody = z.infer<typeof refreshSchema>;

/**
 * Authentication routes
 * Handles anonymous user registration and token refresh
 */
export async function authRoutes(app: FastifyInstance): Promise<void> {
  /**
   * POST /register
   * Create a new anonymous user (identified by device ID)
   * Returns a JWT token for API access
   */
  app.post<{ Body: RegisterBody }>(
    '/register',
    {
      preHandler: [
        createRateLimiter('auth/register'),
        validateBody(registerSchema),
      ],
    },
    async (request, reply) => {
      const { deviceId } = request.body;

      // Generate a unique user ID
      const userId = uuidv4();

      // Generate JWT token
      const token = app.jwt.sign({
        userId,
        deviceId,
      });

      // Calculate expiration time
      const decoded = app.jwt.decode<{ exp: number }>(token);
      const expiresAt = decoded?.exp
        ? new Date(decoded.exp * 1000).toISOString()
        : null;

      app.log.info({ userId, deviceId }, 'New user registered');

      return reply.status(201).send({
        success: true,
        data: {
          userId,
          token,
          expiresAt,
        },
      });
    }
  );

  /**
   * POST /refresh
   * Refresh an existing JWT token
   * Requires valid (but potentially expired) token
   */
  app.post<{ Body: RefreshBody }>(
    '/refresh',
    {
      preHandler: [
        createRateLimiter('auth/refresh'),
        validateBody(refreshSchema),
      ],
    },
    async (request, reply) => {
      const { deviceId } = request.body;
      const authHeader = request.headers.authorization;

      if (!authHeader?.startsWith('Bearer ')) {
        return reply.status(401).send({
          success: false,
          error: 'Unauthorized',
          message: 'No token provided',
        });
      }

      const oldToken = authHeader.slice(7);

      try {
        // Decode the old token (even if expired)
        const decoded = app.jwt.decode<{
          userId: string;
          deviceId: string;
        }>(oldToken);

        if (!decoded) {
          return reply.status(401).send({
            success: false,
            error: 'Unauthorized',
            message: 'Invalid token',
          });
        }

        // Verify device ID matches
        if (decoded.deviceId !== deviceId) {
          return reply.status(401).send({
            success: false,
            error: 'Unauthorized',
            message: 'Device ID mismatch',
          });
        }

        // Generate new token with same user ID
        const token = app.jwt.sign({
          userId: decoded.userId,
          deviceId,
        });

        const newDecoded = app.jwt.decode<{ exp: number }>(token);
        const expiresAt = newDecoded?.exp
          ? new Date(newDecoded.exp * 1000).toISOString()
          : null;

        app.log.info({ userId: decoded.userId }, 'Token refreshed');

        return reply.send({
          success: true,
          data: {
            userId: decoded.userId,
            token,
            expiresAt,
          },
        });
      } catch (error) {
        return reply.status(401).send({
          success: false,
          error: 'Unauthorized',
          message: 'Failed to refresh token',
        });
      }
    }
  );

  /**
   * GET /me
   * Get current user info from token
   */
  app.get(
    '/me',
    {
      preHandler: [authMiddleware],
    },
    async (request, reply) => {
      return reply.send({
        success: true,
        data: {
          userId: request.userId,
          deviceId: request.deviceId,
        },
      });
    }
  );
}
