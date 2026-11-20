import crypto from 'crypto';
import { ENV } from '../../config/env';
import { AppError } from '../../middleware/errorHandler';

interface CacheEntry {
  response: string;
  createdAt: number;
}

// In-memory cache for generated responses to prevent redundant API calls
const generationCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface GroqCallConfig {
  temperature?: number;
  maxOutputTokens?: number;
  useCache?: boolean;
}

export class AiProviderService {
  private static hashKey(content: string, model: string): string {
    return crypto.createHash('sha256').update(`${model}::${content}`).digest('hex');
  }

  /**
   * Primary entry point to call Groq API with caching, validation, and error handling.
   */
  public static async generateJson<T>(
    prompt: string,
    config: GroqCallConfig = {}
  ): Promise<{ data: T; isCached: boolean; model: string }> {
    const model = ENV.groqModel || 'llama-3.3-70b-versatile';
    const useCache = config.useCache !== false;
    const cacheKey = this.hashKey(prompt, model);

    // 1. Check in-memory cache
    if (useCache && generationCache.has(cacheKey)) {
      const entry = generationCache.get(cacheKey)!;
      if (Date.now() - entry.createdAt < CACHE_TTL_MS) {
        try {
          const parsed = JSON.parse(entry.response) as T;
          return { data: parsed, isCached: true, model };
        } catch {
          generationCache.delete(cacheKey);
        }
      } else {
        generationCache.delete(cacheKey);
      }
    }

    // 2. Check if fallback provider is forced
    if (ENV.aiProvider === 'fallback') {
      throw new AppError('AI Provider is set to fallback mode in environment configuration.', 400);
    }

    // 3. Validate GROQ_API_KEY
    if (!ENV.groqApiKey) {
      throw new AppError(
        'GROQ_API_KEY is not configured in backend/.env. Please add your Groq API key and restart the backend.',
        500
      );
    }

    // 4. Groq OpenAI-compatible Chat Completions endpoint
    const endpoint = 'https://api.groq.com/openai/v1/chat/completions';

    let attempts = 0;
    const maxAttempts = 2;
    let lastError: Error | null = null;
    let rawText = '';

    while (attempts < maxAttempts) {
      attempts++;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${ENV.groqApiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: 'system',
                content:
                  'You are a senior educational curriculum architect and assessment specialist. Return ONLY a single raw valid JSON object matching the requested schema with no surrounding prose or markdown ticks.',
              },
              {
                role: 'user',
                content: prompt,
              },
            ],
            response_format: { type: 'json_object' },
            temperature: config.temperature ?? 0.3,
            max_completion_tokens: config.maxOutputTokens ?? 4096,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.status === 401) {
          throw new AppError(
            'Invalid or unauthorized GROQ_API_KEY. Please verify your Groq API key in backend/.env.',
            401
          );
        }

        if (response.status === 429) {
          if (attempts < maxAttempts) {
            await new Promise((res) => setTimeout(res, 1500));
            continue;
          }
          throw new AppError('Groq API rate limit exceeded. Please wait a moment and try again.', 429);
        }

        if (!response.ok) {
          const errBody = await response.text().catch(() => '');
          throw new AppError(
            `Groq API error (${response.status}): ${errBody.slice(0, 220) || response.statusText}`,
            502
          );
        }

        const json = (await response.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
          error?: { message?: string; type?: string; code?: string };
        };

        rawText = json.choices?.[0]?.message?.content || '';
        if (!rawText.trim()) {
          throw new AppError('Groq returned an empty response. Please retry with clearer topic context.', 502);
        }

        break;
      } catch (err: any) {
        lastError = err;
        if (err instanceof AppError && (err.statusCode === 401 || err.statusCode === 429)) {
          if (err.statusCode === 429 && attempts < maxAttempts) {
            await new Promise((res) => setTimeout(res, 1500));
            continue;
          }
          throw err;
        }
        if (err?.name === 'AbortError') {
          throw new AppError('Groq API request timed out after 30 seconds.', 504);
        }
        if (attempts >= maxAttempts) {
          throw err instanceof AppError
            ? err
            : new AppError(`Failed to reach Groq API: ${err?.message || 'Network error'}`, 502);
        }
      }
    }

    if (!rawText) {
      throw lastError || new AppError('Failed to obtain response from Groq API.', 502);
    }

    // 5. Clean and parse JSON
    const cleanJson = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    let parsed: T;
    try {
      parsed = JSON.parse(cleanJson) as T;
    } catch (err: any) {
      throw new AppError(
        `Groq returned unparseable JSON: ${err?.message || 'Syntax error'}. Response preview: ${cleanJson.slice(0, 150)}`,
        502
      );
    }

    // 6. Cache successful generation
    if (useCache) {
      generationCache.set(cacheKey, {
        response: cleanJson,
        createdAt: Date.now(),
      });
    }

    return { data: parsed, isCached: false, model };
  }

  /**
   * Clear cache for testing or administration
   */
  public static clearCache(): void {
    generationCache.clear();
  }

  /**
   * Get cache stats for diagnostics
   */
  public static getCacheStats(): { size: number } {
    return { size: generationCache.size };
  }
}
