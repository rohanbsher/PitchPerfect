import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { validateBody } from '../middleware/validation.middleware.js';
import { createRateLimiter } from '../middleware/rateLimit.middleware.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import {
  generateSpeech,
  isAvailable,
  getVoices,
  type SpeakRequest,
} from '../../services/elevenlabs.service.js';

// Request schemas
const speakSchema = z.object({
  text: z.string().min(1).max(5000),
  voice: z.enum(['rachel', 'josh', 'bella', 'elli', 'sam']).optional(),
});

/**
 * TTS Proxy Routes
 * Secure proxy for ElevenLabs API calls with rate limiting
 */
export async function ttsRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /status
   * Check if TTS is available
   */
  app.get('/status', async (_request, reply) => {
    return reply.send({
      success: true,
      data: {
        available: isAvailable(),
        voices: getVoices(),
      },
    });
  });

  /**
   * POST /speak
   * Generate speech from text
   */
  app.post<{ Body: SpeakRequest }>(
    '/speak',
    {
      preHandler: [
        authMiddleware,
        createRateLimiter('tts/speak'),
        validateBody(speakSchema),
      ],
    },
    async (request, reply) => {
      if (!isAvailable()) {
        return reply.status(503).send({
          success: false,
          error: 'Service Unavailable',
          message: 'TTS service not configured',
        });
      }

      const result = await generateSpeech(request.body);

      if (!result) {
        return reply.status(503).send({
          success: false,
          error: 'Service Unavailable',
          message: 'Failed to generate speech',
        });
      }

      // Return audio data as base64
      return reply.send({
        success: true,
        data: {
          audio: result.audioData,
          contentType: result.contentType,
        },
      });
    }
  );

  /**
   * POST /speak/stream
   * Stream speech audio directly (for clients that support streaming)
   */
  app.post<{ Body: SpeakRequest }>(
    '/speak/stream',
    {
      preHandler: [
        authMiddleware,
        createRateLimiter('tts/speak'),
        validateBody(speakSchema),
      ],
    },
    async (request, reply) => {
      if (!isAvailable()) {
        return reply.status(503).send({
          success: false,
          error: 'Service Unavailable',
          message: 'TTS service not configured',
        });
      }

      const result = await generateSpeech(request.body);

      if (!result) {
        return reply.status(503).send({
          success: false,
          error: 'Service Unavailable',
          message: 'Failed to generate speech',
        });
      }

      // Return audio directly as binary
      const audioBuffer = Buffer.from(result.audioData, 'base64');
      return reply
        .header('Content-Type', result.contentType)
        .header('Content-Length', audioBuffer.length)
        .send(audioBuffer);
    }
  );
}
