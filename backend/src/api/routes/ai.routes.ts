import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { validateBody } from '../middleware/validation.middleware.js';
import { createRateLimiter } from '../middleware/rateLimit.middleware.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import {
  generateRealTimeCoachingTip,
  claudeConversation,
  generatePostSessionFeedback,
  getNextExerciseRecommendation,
  generateRangeAnalysisReport,
  generateRangeSafetyCoaching,
  type RealTimeCoachingRequest,
  type ConversationRequest,
  type FeedbackRequest,
  type RecommendationRequest,
  type RangeAnalysisRequest,
  type RangeSafetyRequest,
} from '../../services/claude.service.js';

// Request schemas
const coachingSchema = z.object({
  consecutiveLowScores: z.number().min(0),
  currentAccuracy: z.number().min(0).max(100),
  targetNote: z.string().min(1),
  userRange: z.object({
    lowest: z.string(),
    highest: z.string(),
  }),
});

const conversationSchema = z.object({
  query: z.string().min(1),
  appState: z.object({
    currentScreen: z.string(),
    isExerciseActive: z.boolean(),
    currentExercise: z.string().optional(),
    exerciseState: z.string().optional(),
    isBreathing: z.boolean(),
  }),
  userProgress: z.object({
    streak: z.number(),
    longestStreak: z.number(),
    totalSessions: z.number(),
    totalPracticeMinutes: z.number(),
    averageAccuracy: z.number(),
    vocalRange: z.object({
      low: z.string(),
      high: z.string(),
    }),
    recentSessions: z.array(
      z.object({
        date: z.string(),
        exercise: z.string(),
        accuracy: z.number(),
      })
    ),
    exercisesCompleted: z.number(),
  }),
  conversationHistory: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    })
  ),
});

const noteAttemptSchema = z.object({
  targetFrequency: z.number(),
  actualFrequency: z.number(),
  accuracy: z.number(),
  timestamp: z.number().optional(),
});

const sessionRecordSchema = z.object({
  id: z.string(),
  date: z.string(),
  exerciseId: z.string(),
  exerciseName: z.string(),
  duration: z.number(),
  accuracy: z.number(),
  notesAttempted: z.number(),
  notesHit: z.number(),
  lowestNote: z.string().optional(),
  highestNote: z.string().optional(),
  noteAttempts: z.array(noteAttemptSchema),
});

const feedbackSchema = z.object({
  sessionRecord: sessionRecordSchema,
  recentSessions: z.array(sessionRecordSchema),
});

const recommendationSchema = z.object({
  recentSessions: z.array(sessionRecordSchema),
  userVocalRange: z.object({
    lowest: z.string(),
    highest: z.string(),
  }),
});

const rangeAnalysisSchema = z.object({
  rangeAnalysis: z.object({
    currentRange: z.object({
      lowest: z.string(),
      highest: z.string(),
    }),
    comfortableRange: z.object({
      lowest: z.string(),
      highest: z.string(),
      spanSemitones: z.number(),
    }),
    strongestNote: z
      .object({
        note: z.string(),
        accuracy: z.number(),
      })
      .nullable(),
    expansion: z.object({
      last30Days: z.object({
        semitones: z.number(),
        direction: z.string(),
      }),
      allTime: z.object({
        semitones: z.number(),
      }),
    }),
    weaknesses: z.array(
      z.object({
        frequencyBand: z.string(),
        averageAccuracy: z.number(),
        notes: z.array(z.string()),
      })
    ),
    extendedRange: z.object({
      lower: z.object({ note: z.string() }).nullable(),
      upper: z.object({ note: z.string() }).nullable(),
    }),
  }),
  recentSessions: z.array(sessionRecordSchema),
});

const rangeSafetySchema = z.object({
  targetNote: z.string(),
  targetFrequency: z.number(),
  comfortableRange: z.object({
    lowest: z.string(),
    highest: z.string(),
  }),
  currentAccuracy: z.number(),
});

/**
 * AI Proxy Routes
 * Secure proxy for Claude API calls with rate limiting
 */
export async function aiRoutes(app: FastifyInstance): Promise<void> {
  /**
   * POST /coaching
   * Real-time coaching tip during exercise
   */
  app.post<{ Body: RealTimeCoachingRequest }>(
    '/coaching',
    {
      preHandler: [
        authMiddleware,
        createRateLimiter('ai/coaching'),
        validateBody(coachingSchema),
      ],
    },
    async (request, reply) => {
      const tip = await generateRealTimeCoachingTip(request.body);

      if (!tip) {
        return reply.status(503).send({
          success: false,
          error: 'Service Unavailable',
          message: 'Unable to generate coaching tip',
        });
      }

      return reply.send({
        success: true,
        data: { tip },
      });
    }
  );

  /**
   * POST /conversation
   * Voice assistant conversation
   */
  app.post<{ Body: ConversationRequest }>(
    '/conversation',
    {
      preHandler: [
        authMiddleware,
        createRateLimiter('ai/conversation'),
        validateBody(conversationSchema),
      ],
    },
    async (request, reply) => {
      try {
        const response = await claudeConversation(request.body);

        return reply.send({
          success: true,
          data: { response },
        });
      } catch (error) {
        app.log.error(error, 'Conversation error');
        return reply.status(503).send({
          success: false,
          error: 'Service Unavailable',
          message: 'Unable to process conversation',
        });
      }
    }
  );

  /**
   * POST /feedback
   * Post-session feedback with technique tips
   */
  app.post<{ Body: FeedbackRequest }>(
    '/feedback',
    {
      preHandler: [
        authMiddleware,
        createRateLimiter('ai/feedback'),
        validateBody(feedbackSchema),
      ],
    },
    async (request, reply) => {
      const feedback = await generatePostSessionFeedback(request.body);

      if (!feedback) {
        return reply.status(503).send({
          success: false,
          error: 'Service Unavailable',
          message: 'Unable to generate feedback',
        });
      }

      return reply.send({
        success: true,
        data: feedback,
      });
    }
  );

  /**
   * POST /recommendation
   * Next exercise recommendation
   */
  app.post<{ Body: RecommendationRequest }>(
    '/recommendation',
    {
      preHandler: [
        authMiddleware,
        createRateLimiter('ai/recommendation'),
        validateBody(recommendationSchema),
      ],
    },
    async (request, reply) => {
      const recommendation = await getNextExerciseRecommendation(request.body);

      if (!recommendation) {
        return reply.status(503).send({
          success: false,
          error: 'Service Unavailable',
          message: 'Unable to generate recommendation',
        });
      }

      return reply.send({
        success: true,
        data: recommendation,
      });
    }
  );

  /**
   * POST /range-analysis
   * Comprehensive vocal range analysis
   */
  app.post<{ Body: RangeAnalysisRequest }>(
    '/range-analysis',
    {
      preHandler: [
        authMiddleware,
        createRateLimiter('ai/range-analysis'),
        validateBody(rangeAnalysisSchema),
      ],
    },
    async (request, reply) => {
      const analysis = await generateRangeAnalysisReport(request.body);

      if (!analysis) {
        return reply.status(503).send({
          success: false,
          error: 'Service Unavailable',
          message: 'Unable to generate range analysis',
        });
      }

      return reply.send({
        success: true,
        data: analysis,
      });
    }
  );

  /**
   * POST /range-safety
   * Range safety coaching for notes outside comfortable range
   */
  app.post<{ Body: RangeSafetyRequest }>(
    '/range-safety',
    {
      preHandler: [
        authMiddleware,
        createRateLimiter('ai/coaching'),
        validateBody(rangeSafetySchema),
      ],
    },
    async (request, reply) => {
      const tip = await generateRangeSafetyCoaching(request.body);

      if (!tip) {
        return reply.status(503).send({
          success: false,
          error: 'Service Unavailable',
          message: 'Unable to generate safety tip',
        });
      }

      return reply.send({
        success: true,
        data: { tip },
      });
    }
  );
}
