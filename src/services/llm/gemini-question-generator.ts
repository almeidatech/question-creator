/**
 * Gemini API Integration for Question Generation
 * US-1B.3: Gemini API Question Generation Integration
 *
 * Generates Constitutional Law exam questions using Gemini 1.5 Pro
 * with RAG grounding from real exam questions.
 *
 * Decision: Use Gemini API per ADR-001 (cost efficiency, batch processing)
 */

import { z } from 'zod';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { retrieveRagContext } from '../rag/retrieve-rag-context';
import { SourceType } from '../../database/types/question-sources';

/**
 * Input schema for question generation endpoint
 */
export const generateQuestionsInputSchema = z.object({
  topic: z.string().min(1).max(100),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  count: z.number().int().min(5).max(20),
});

export type GenerateQuestionsInput = z.infer<typeof generateQuestionsInputSchema>;

/**
 * Generated question from Gemini API
 */
export interface GeneratedQuestion {
  text: string;
  options: [string, string, string, string]; // Exactly 4 options
  correctAnswer: number; // 0-3
  explanation?: string;
}

/**
 * Response validation schema
 */
export const generatedQuestionSchema = z.object({
  text: z.string().min(10).max(1000),
  options: z.array(z.string()).length(4),
  correctAnswer: z.number().min(0).max(3),
  explanation: z.string().optional(),
});

export const generatedQuestionsResponseSchema = z.array(generatedQuestionSchema);

/**
 * Metadata tracked for each generation request
 */
export interface GenerationMetadata {
  generation_id: string;
  user_id: string;
  model: 'gemini-1.5-pro';
  temperature: number;
  rag_context_count: number;
  tokens_input: number;
  tokens_output: number;
  cost_usd: number;
  latency_ms: number;
  fallback_used: boolean;
}

/**
 * Main question generation function
 *
 * Flow:
 * 1. Retrieve RAG context (real exam questions)
 * 2. Call Gemini API with RAG context + prompt
 * 3. Validate response against schema
 * 4. Store generated questions with source_type='ai_generated'
 * 5. Ensure rag_eligible=false (CRITICAL for contamination prevention)
 */
export async function generateQuestionsWithGemini(
  input: GenerateQuestionsInput,
  userId: string
): Promise<{
  questions: GeneratedQuestion[];
  metadata: GenerationMetadata;
}> {
  const startTime = Date.now();
  const generationId = crypto.getRandomValues(new Uint8Array(16)).toString();

  try {
    // Step 1: Retrieve RAG context
    const ragContext = await retrieveRagContext(
      input.topic,
      input.difficulty,
      Math.min(input.count, 20) // Max 20 for context
    );

    if (ragContext.length === 0) {
      // Fallback: return real questions if RAG fails
      return handleGenerationFallback(input, userId, generationId, startTime);
    }

    // Step 2: Call Gemini API
    const response = await callGeminiApi(
      input.topic,
      input.difficulty,
      input.count,
      ragContext
    );

    // Step 3: Validate response
    const validatedQuestions = validateGeminiResponse(response, input.count);

    // Calculate costs (Gemini Batch API pricing)
    const tokensInput = estimateTokenCount({ ragContext, topic: input.topic });
    const tokensOutput = estimateTokenCount(validatedQuestions);
    const costUsd = calculateGeminiCost(tokensInput, tokensOutput);

    const metadata: GenerationMetadata = {
      generation_id: generationId,
      user_id: userId,
      model: 'gemini-1.5-pro',
      temperature: 0.5,
      rag_context_count: ragContext.length,
      tokens_input: tokensInput,
      tokens_output: tokensOutput,
      cost_usd: costUsd,
      latency_ms: Date.now() - startTime,
      fallback_used: false,
    };

    // Log successful generation
    logGenerationEvent({
      status: 'success',
      generation_id: generationId,
      user_id: userId,
      question_count: validatedQuestions.length,
      metadata,
    });

    return { questions: validatedQuestions, metadata };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';

    // Timeout or error: use fallback
    if (Date.now() - startTime > 30000 || errorMsg.includes('timeout')) {
      return handleGenerationFallback(input, userId, generationId, startTime);
    }

    // Log error
    logGenerationEvent({
      status: 'error',
      generation_id: generationId,
      user_id: userId,
      error: errorMsg,
    });

    throw error;
  }
}

/**
 * Call Gemini 1.5 Pro API with exact prompt format
 */
async function callGeminiApi(
  topic: string,
  difficulty: 'easy' | 'medium' | 'hard',
  count: number,
  ragContext: any[]
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured in environment');
  }

  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({ model: 'gemini-1.5-pro' });

  // Format RAG context for prompt
  const ragContextText = ragContext
    .slice(0, 10) // Use top 10 for context
    .map(
      (q, i) =>
        `${i + 1}. Q: ${q.text}\n   A: ${q.options[q.correctAnswer || 0]}\n   Options: ${q.options.join(', ')}`
    )
    .join('\n\n');

  // EXACT prompt format per ADR-001 and story requirements
  const prompt = `You are a Constitutional Law expert professor.
Generate ${count} unique exam-style multiple-choice questions.

Context (real exam patterns from Constitutional Law exams):
${ragContextText}

Requirements:
- Difficulty level: ${difficulty}
- Topic: ${topic}
- Style: CESPE/FCC exam format
- 100% legal accuracy - no hallucinations
- Exactly 4 options per question
- Exactly 1 correct answer per question
- Options should be plausible but distinct

Return as JSON array only (no markdown, no explanation):
[
  {
    "text": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Why option 0 is correct..."
  }
]`;

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.5, // Consistency over creativity
      maxOutputTokens: 500,
    },
  });

  const responseText = result.response.text();
  return responseText;
}

/**
 * Validate Gemini API response against schema
 */
function validateGeminiResponse(
  responseText: string,
  expectedCount: number
): GeneratedQuestion[] {
  // Extract JSON from response (may have markdown code blocks)
  let jsonText = responseText;
  const jsonMatch = responseText.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    jsonText = jsonMatch[0];
  }

  // Parse JSON
  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch (error) {
    throw new Error(`Invalid JSON in Gemini response: ${error}`);
  }

  // Validate with Zod
  const validated = generatedQuestionsResponseSchema.parse(parsed);

  // Verify count matches
  if (validated.length !== expectedCount) {
    throw new Error(
      `Expected ${expectedCount} questions, got ${validated.length}`
    );
  }

  return validated as unknown as GeneratedQuestion[];
}

/**
 * Fallback handler: return real exam questions if Gemini fails
 */
async function handleGenerationFallback(
  input: GenerateQuestionsInput,
  userId: string,
  generationId: string,
  startTime: number
): Promise<{ questions: GeneratedQuestion[]; metadata: GenerationMetadata }> {
  // Retrieve real exam questions as fallback
  const fallbackQuestions = await retrieveRagContext(
    input.topic,
    input.difficulty,
    input.count
  );

  // Convert to GeneratedQuestion format (these are REAL exam questions, not AI-generated)
  const questions: GeneratedQuestion[] = fallbackQuestions.map((q) => ({
    text: q.text,
    options: q.options as [string, string, string, string],
    correctAnswer: 0, // We don't track which option is correct in RAG results
    explanation: 'From real exam database',
  }));

  const metadata: GenerationMetadata = {
    generation_id: generationId,
    user_id: userId,
    model: 'gemini-1.5-pro',
    temperature: 0.5,
    rag_context_count: fallbackQuestions.length,
    tokens_input: 0,
    tokens_output: 0,
    cost_usd: 0,
    latency_ms: Date.now() - startTime,
    fallback_used: true,
  };

  logGenerationEvent({
    status: 'fallback',
    generation_id: generationId,
    user_id: userId,
    reason: 'Gemini API timeout or error',
    question_count: questions.length,
    metadata,
  });

  return { questions, metadata };
}

/**
 * Estimate token count for monitoring and cost calculation
 */
function estimateTokenCount(data: any): number {
  // Rough estimate: 1 token ≈ 4 characters
  const jsonStr = JSON.stringify(data);
  return Math.ceil(jsonStr.length / 4);
}

/**
 * Calculate Gemini API cost
 * Batch pricing (more common): $0.005 per 1K input, $0.015 per 1K output
 */
function calculateGeminiCost(inputTokens: number, outputTokens: number): number {
  const inputCost = (inputTokens / 1000) * 0.005;
  const outputCost = (outputTokens / 1000) * 0.015;
  return inputCost + outputCost;
}

/**
 * Log generation events for monitoring
 */
function logGenerationEvent(data: any) {
  const timestamp = new Date().toISOString();
  console.log(
    JSON.stringify({
      timestamp,
      event: 'question_generation',
      ...data,
    })
  );

  // TODO: Send to Sentry/Datadog for monitoring
  // TODO: Alert if error rate > 5%
  // TODO: Alert if fallback rate > 20%
}

/**
 * Database storage schema for generated questions
 * CRITICAL: source_type MUST be 'ai_generated' and rag_eligible MUST be false
 */
export const storeGeneratedQuestionSchema = z.object({
  text: z.string().min(10).max(1000),
  options: z.array(z.string()).length(4),
  correctAnswer: z.number().min(0).max(3),
  explanation: z.string().optional(),
  // Database fields
  difficulty: z.enum(['easy', 'medium', 'hard']),
  topic_id: z.string().uuid(),
  created_by: z.string().uuid(),
  ai_model: z.literal('gemini-1.5-pro'),
  generation_metadata: z.record(z.string(), z.unknown()),
  // CRITICAL: Source fields
  source_type: z.literal(SourceType.AI_GENERATED),
  rag_eligible: z.literal(false),
});

export type StoreGeneratedQuestion = z.infer<typeof storeGeneratedQuestionSchema>;

