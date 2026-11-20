import { DifficultyLevel } from '../../../../shared/types';

export interface AdaptationProfile {
  vocabularyLevel: 'foundational' | 'intermediate' | 'advanced_rigorous';
  cognitiveDepth: 'recall_guided' | 'application_multi_step' | 'analysis_synthesis_inference';
  guidanceLevel: 'explicit_step_by_step' | 'moderate_hints' | 'minimal_independent';
  starReward: number;
  estimatedMinutes: number;
  questionComplexity: string;
}

export class DifficultyAdaptationService {
  /**
   * Evaluates numerical grade from string like "Class 5" or "Grade 8"
   */
  public static parseGradeLevel(className: string): number {
    const match = className.match(/\d+/);
    return match ? parseInt(match[0], 10) : 6;
  }

  /**
   * Generates a concrete adaptation profile based on grade and difficulty
   */
  public static getAdaptationProfile(className: string, difficulty: DifficultyLevel): AdaptationProfile {
    const grade = this.parseGradeLevel(className);

    let starReward = 15;
    let estimatedMinutes = 5;

    if (difficulty === 'Easy') {
      starReward = 10;
      estimatedMinutes = 5;
    } else if (difficulty === 'Medium') {
      starReward = 15;
      estimatedMinutes = 6;
    } else if (difficulty === 'Hard') {
      starReward = 20;
      estimatedMinutes = 8;
    }

    // High school grades take slightly longer for rigorous problem-solving
    if (grade >= 8) {
      estimatedMinutes += 2;
    }

    let vocabularyLevel: AdaptationProfile['vocabularyLevel'] = 'intermediate';
    let cognitiveDepth: AdaptationProfile['cognitiveDepth'] = 'application_multi_step';
    let guidanceLevel: AdaptationProfile['guidanceLevel'] = 'moderate_hints';

    if (difficulty === 'Easy') {
      vocabularyLevel = grade >= 8 ? 'intermediate' : 'foundational';
      cognitiveDepth = 'recall_guided';
      guidanceLevel = 'explicit_step_by_step';
    } else if (difficulty === 'Hard') {
      vocabularyLevel = 'advanced_rigorous';
      cognitiveDepth = 'analysis_synthesis_inference';
      guidanceLevel = 'minimal_independent';
    }

    const questionComplexity = `Grade ${grade} at ${difficulty} level: requires ${
      difficulty === 'Easy'
        ? 'direct conceptual identification and guided reasoning.'
        : difficulty === 'Medium'
        ? 'interpreting multiple interacting principles and applying them.'
        : 'analytical deduction, evaluating counter-scenarios, and justifying scientific conclusions.'
    }`;

    return {
      vocabularyLevel,
      cognitiveDepth,
      guidanceLevel,
      starReward,
      estimatedMinutes,
      questionComplexity,
    };
  }

  /**
   * Adapts question prompt and explanation depth depending on difficulty level
   */
  public static enrichQuestionWithDifficulty(
    prompt: string,
    difficulty: DifficultyLevel,
    gradeLevel: number
  ): string {
    if (difficulty === 'Easy') {
      return prompt;
    }
    if (difficulty === 'Medium') {
      return gradeLevel >= 8
        ? `Analyze the following scenario: ${prompt}`
        : `Consider how the parts work together: ${prompt}`;
    }
    // Hard
    return gradeLevel >= 8
      ? `Evaluate the systemic evidence and infer: ${prompt}`
      : `Based on scientific cause-and-effect, deduce: ${prompt}`;
  }
}
