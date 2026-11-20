import { z } from 'zod';
import { ActivityCategory, DifficultyLevel, ModalityKey } from '../../../shared/types';
import { ActivityGenerationService } from './ai/activityGeneration.service';
import { generatedActivitySchema, activityQuestionSchema } from './ai/generationSchemas';
import { PROMPTS } from './ai/promptTemplates';

export interface AiGenerationInput {
  className: string;
  subject: string;
  chapter: string;
  topic: string;
  subtopic?: string;
  modality: ModalityKey;
  category: ActivityCategory;
  difficulty: DifficultyLevel;
  chapterContext?: string;
  forceRefresh?: boolean;
}

export interface GeneratedActivityPayload {
  name: string;
  gameType: string;
  targetAbility: string;
  estimatedMinutes: number;
  starReward: number;
  generationSource: 'ai_groq' | 'ai_gemini' | 'development_fallback';
  isDevelopmentFallback: boolean;
  customization: Record<string, unknown>;
  questions: {
    type: 'academic' | 'general';
    prompt: string;
    options: string[];
    correctIndex: number;
    hint?: string;
    explanation?: string;
  }[];
}

export const groqResponseSchema = generatedActivitySchema;
export const geminiResponseSchema = generatedActivitySchema; // Backward compatibility alias

export function buildVarkGroqPrompt(input: AiGenerationInput): string {
  return PROMPTS.modalityActivity({
    className: input.className,
    subject: input.subject,
    chapter: input.chapter,
    topic: input.topic,
    subtopic: input.subtopic,
    modality: input.modality,
    category: input.category,
    difficulty: input.difficulty,
    excerptOrConcept: input.chapterContext || `Subject: ${input.subject}\nChapter: ${input.chapter}\nTopic: ${input.topic}`,
  });
}
export const buildVarkGeminiPrompt = buildVarkGroqPrompt; // Backward compatibility alias

export async function generateModalityActivity(
  input: AiGenerationInput
): Promise<GeneratedActivityPayload> {
  const result = await ActivityGenerationService.generateActivity({
    className: input.className,
    subject: input.subject,
    chapter: input.chapter,
    topic: input.topic,
    subtopic: input.subtopic,
    modality: input.modality,
    category: input.category,
    difficulty: input.difficulty,
    chapterContext: input.chapterContext,
    forceRefresh: input.forceRefresh,
  });

  const isFallback = result.source.includes('fallback');

  return {
    name: result.activity.name,
    gameType: result.activity.gameType,
    targetAbility: result.activity.targetAbility,
    estimatedMinutes: result.activity.estimatedMinutes,
    starReward: result.activity.starReward,
    generationSource: isFallback ? 'development_fallback' : 'ai_groq',
    isDevelopmentFallback: isFallback,
    customization: result.activity.customization as Record<string, unknown>,
    questions: result.activity.questions,
  };
}
