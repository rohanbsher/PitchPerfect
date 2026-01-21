import { FastifyRequest, FastifyReply } from 'fastify';

// Extend FastifyRequest to include user data
declare module 'fastify' {
  interface FastifyRequest {
    userId?: string;
    deviceId?: string;
  }
}

/**
 * JWT Authentication middleware
 * Validates JWT token and extracts user/device information
 */
export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    // Verify JWT token (fastify-jwt handles this)
    const decoded = await request.jwtVerify<{
      userId: string;
      deviceId: string;
      iat: number;
      exp: number;
    }>();

    // Attach user info to request
    request.userId = decoded.userId;
    request.deviceId = decoded.deviceId;
  } catch (error) {
    reply.status(401).send({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    });
  }
}

/**
 * Optional auth middleware - doesn't fail if no token present
 * Useful for endpoints that work with or without auth
 */
export async function optionalAuthMiddleware(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  try {
    const decoded = await request.jwtVerify<{
      userId: string;
      deviceId: string;
      iat: number;
      exp: number;
    }>();

    request.userId = decoded.userId;
    request.deviceId = decoded.deviceId;
  } catch {
    // No token or invalid token - that's okay for optional auth
    request.userId = undefined;
    request.deviceId = undefined;
  }
}
