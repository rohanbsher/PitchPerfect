import { FastifyRequest, FastifyReply } from 'fastify';
import { ZodSchema, ZodError } from 'zod';

/**
 * Create a validation middleware from a Zod schema
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return async function validationMiddleware(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const parsed = schema.parse(request.body);
      // Replace body with parsed (and potentially transformed) data
      request.body = parsed;
    } catch (error) {
      if (error instanceof ZodError) {
        reply.status(400).send({
          success: false,
          error: 'Validation Error',
          message: 'Invalid request body',
          details: error.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        });
      } else {
        reply.status(400).send({
          success: false,
          error: 'Validation Error',
          message: 'Invalid request body',
        });
      }
    }
  };
}

/**
 * Create a query validation middleware from a Zod schema
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return async function validationMiddleware(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const parsed = schema.parse(request.query);
      request.query = parsed as typeof request.query;
    } catch (error) {
      if (error instanceof ZodError) {
        reply.status(400).send({
          success: false,
          error: 'Validation Error',
          message: 'Invalid query parameters',
          details: error.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        });
      } else {
        reply.status(400).send({
          success: false,
          error: 'Validation Error',
          message: 'Invalid query parameters',
        });
      }
    }
  };
}

/**
 * Create a params validation middleware from a Zod schema
 */
export function validateParams<T>(schema: ZodSchema<T>) {
  return async function validationMiddleware(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const parsed = schema.parse(request.params);
      request.params = parsed as typeof request.params;
    } catch (error) {
      if (error instanceof ZodError) {
        reply.status(400).send({
          success: false,
          error: 'Validation Error',
          message: 'Invalid path parameters',
          details: error.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        });
      } else {
        reply.status(400).send({
          success: false,
          error: 'Validation Error',
          message: 'Invalid path parameters',
        });
      }
    }
  };
}
