import { buildApp } from './app.js';
import { config } from './config/env.js';

/**
 * Start the server
 */
async function start(): Promise<void> {
  try {
    const app = await buildApp();

    // Listen on all interfaces (required for containers)
    await app.listen({
      port: config.server.port,
      host: '0.0.0.0',
    });

    console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   PitchPerfect API Server                                  ║
║                                                            ║
║   Status:  Running                                         ║
║   Port:    ${config.server.port.toString().padEnd(46)}║
║   Env:     ${config.server.isDev ? 'Development' : 'Production'}                                   ║
║                                                            ║
║   Endpoints:                                               ║
║   - GET  /health              Health check                 ║
║   - POST /api/v1/auth/register   Create user               ║
║   - POST /api/v1/auth/refresh    Refresh token             ║
║   - POST /api/v1/ai/coaching     Real-time coaching        ║
║   - POST /api/v1/ai/conversation Voice assistant           ║
║   - POST /api/v1/ai/feedback     Post-session feedback     ║
║   - POST /api/v1/ai/recommendation Exercise suggestion     ║
║   - POST /api/v1/ai/range-analysis Vocal range analysis    ║
║   - POST /api/v1/tts/speak       Text-to-speech            ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
    `);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Start the server
start();
