import { z } from 'zod';

export const studentRegisterSchema = z.object({
  name: z.string().min(2).max(60),
  username: z.string().min(3).max(40).regex(/^[a-zA-Z0-9_]+$/),
  className: z.string().min(2).max(40),
  password: z.string().min(6).max(100),
  recoveryPin: z.string().regex(/^\d{4}$/, 'Recovery PIN must be 4 digits'),
});

export const studentLoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const verifyPinSchema = z.object({
  username: z.string().min(1),
  recoveryPin: z.string().regex(/^\d{4}$/),
});

export const resetPasswordSchema = z.object({
  username: z.string().min(1),
  recoveryPin: z.string().regex(/^\d{4}$/),
  newPassword: z.string().min(6).max(100),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6).max(100),
});

export const changePinSchema = z.object({
  currentPin: z.string().regex(/^\d{4}$/),
  newPin: z.string().regex(/^\d{4}$/),
});

export const classSchema = z.object({
  name: z.string().min(2).max(50),
  section: z.string().min(1).max(10).default('A'),
  gradeLevel: z.number().int().min(1).max(12),
  subjects: z.array(z.string()).default(['Science', 'Mathematics', 'English', 'Social Studies']),
});

export const createActivitySchema = z.object({
  name: z.string().min(2),
  modality: z.enum(['visual', 'auditory', 'read_write', 'kinesthetic']),
  category: z.enum(['games_puzzles', 'question_sets']),
  gameType: z.string().min(2),
  className: z.string().min(2),
  subject: z.string().min(2),
  chapter: z.string().default('Chapter 1'),
  topic: z.string().min(2),
  subtopic: z.string().optional(),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).default('Medium'),
  targetAbility: z.string().default('Modality-targeted learning'),
  scoringMethod: z.enum(['time_and_correctness', 'correctness_only']).default('correctness_only'),
  estimatedMinutes: z.number().int().min(1).max(60).default(5),
  starReward: z.number().int().min(1).max(100).default(12),
  customization: z.record(z.any()),
});

export const generateAiActivitySchema = z.object({
  className: z.string().min(2),
  subject: z.string().min(2),
  chapter: z.string().min(1),
  topic: z.string().min(2),
  subtopic: z.string().optional(),
  modality: z.enum(['visual', 'auditory', 'read_write', 'kinesthetic']),
  category: z.enum(['games_puzzles', 'question_sets']),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).default('Medium'),
  textbookId: z.string().optional(),
  textbookSource: z.string().optional(),
  chapterContext: z.string().optional(),
});

export const createAssessmentSchema = z.object({
  name: z.string().min(2),
  description: z.string().default('4-modality learning discovery assessment'),
  targetClassIds: z.array(z.string()).min(1),
  status: z.enum(['Draft', 'Published']).default('Draft'),
  allowRetake: z.boolean().default(true),
  retakeCondition: z.string().default('Permitted once per term upon Admin review'),
  activities: z
    .array(
      z.object({
        activityId: z.string(),
        order: z.number().int().min(1),
        scoringMethod: z.enum(['time_and_correctness', 'correctness_only']),
      })
    )
    .min(4),
});
