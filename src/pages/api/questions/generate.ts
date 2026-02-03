/**
 * API Route: POST /api/questions/generate
 * US-1B.3: Gemini API Question Generation Integration
 *
 * Generates 5-20 new study questions grounded in real exam patterns
 * Rate limited: 10 requests/minute per user
 */

import { z } from 'zod';
import { generateQuestionsWithGemini, generateQuestionsInputSchema } from '../../../services/llm/gemini-question-generator';
import { withCaching } from '../../../services/cache/redis-cache-service';

/**
 * Rate limiting state (in-memory for MVP, upgrade to Redis for production)
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

/**
 * POST /api/questions/generate
 *
 * Request body:
 * {
 *   topic: string (1-100 chars)
 *   difficulty: 'easy' | 'medium' | 'hard'
 *   count: 5-20
 * }
 *
 * Response (200 OK):
 * {
 *   questions: [
 *     {
 *       text: string
 *       options: [string, string, string, string]
 *       correctAnswer: 0-3
 *       explanation?: string
 *     }
 *   ],
 *   metadata: {
 *     generation_id: string
 *     model: 'gemini-1.5-pro'
 *     latency_ms: number
 *     cost_usd: number
 *     fallback_used: boolean
 *   }
 * }
 *
 * Errors:
 * - 400: Invalid input
 * - 429: Rate limit exceeded
 * - 500: Internal server error
 * - 503: Service unavailable (Gemini API down)
 */
export async function generateQuestionsHandler(req: any, res: any) {
  // Check method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Authentication (from middleware)
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Validate input
  const input = generateQuestionsInputSchema.safeParse(req.body);
  if (!input.success) {
    return res.status(400).json({
      error: 'Invalid request body',
      details: input.error.flatten(),
    });
  }

  // Rate limiting: 10 requests/minute per user
  const rateLimitKey = `generate:${userId}`;
  const now = Date.now();
  const userLimit = rateLimitMap.get(rateLimitKey);

  if (userLimit && userLimit.resetTime > now) {
    if (userLimit.count >= 10) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: '10 requests per minute per user',
        retry_after: Math.ceil((userLimit.resetTime - now) / 1000),
      });
    }
  } else {
    // Reset rate limit window
    rateLimitMap.set(rateLimitKey, {
      count: 0,
      resetTime: now + 60000, // 1 minute
    });
  }

  // Increment rate limit counter
  const current = rateLimitMap.get(rateLimitKey)!;
  current.count += 1;

  try {
    const startTime = Date.now();

    // Use caching middleware
    const result = await withCaching(
      userId,
      input.data.topic,
      input.data.difficulty,
      input.data.count,
      async () => {
        // Call Gemini API (or fallback)
        return await generateQuestionsWithGemini(input.data, userId);
      }
    );

    const latencyMs = Date.now() - startTime;

    // Validate latency
    if (latencyMs > 3000) {
      console.warn(`Slow generation detected: ${latencyMs}ms for user ${userId}`);
    }

    // Response
    return res.status(200).json({
      questions: result.questions,
      metadata: {
        ...result.metadata,
        latency_ms: latencyMs,
      },
    });
  } catch (error) {
    console.error('Error generating questions:', error);

    const errorMsg = error instanceof Error ? error.message : 'Unknown error';

    // Check if Gemini API is down (service unavailable)
    if (errorMsg.includes('429') || errorMsg.includes('quota')) {
      return res.status(429).json({
        error: 'Service rate limited',
        message: 'Gemini API rate limit exceeded, try again in a moment',
      });
    }

    if (errorMsg.includes('503') || errorMsg.includes('unavailable')) {
      return res.status(503).json({
        error: 'Service unavailable',
        message: 'Question generation service temporarily unavailable',
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to generate questions',
    });
  }
}

export default generateQuestionsHandler;

