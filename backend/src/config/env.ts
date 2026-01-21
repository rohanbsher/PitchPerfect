import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Environment schema validation
const envSchema = z.object({
  // Server
  PORT: z.string().default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // API Keys (server-side only - never exposed to client)
  ANTHROPIC_API_KEY: z.string().min(1, 'ANTHROPIC_API_KEY is required'),
  ELEVENLABS_API_KEY: z.string().optional(),

  // Redis (optional - falls back to in-memory rate limiting)
  REDIS_URL: z.string().optional(),

  // CORS
  CORS_ORIGIN: z.string().default('*'),
});

// Parse and validate environment
const parseEnv = () => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('Invalid environment variables:');
    result.error.issues.forEach((issue) => {
      console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    });
    process.exit(1);
  }

  return result.data;
};

export const env = parseEnv();

// Export typed config
export const config = {
  server: {
    port: parseInt(env.PORT, 10),
    isDev: env.NODE_ENV === 'development',
    isProd: env.NODE_ENV === 'production',
  },
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
  },
  api: {
    anthropic: env.ANTHROPIC_API_KEY,
    elevenlabs: env.ELEVENLABS_API_KEY,
  },
  redis: {
    url: env.REDIS_URL,
  },
  cors: {
    origin: env.CORS_ORIGIN,
  },
} as const;
