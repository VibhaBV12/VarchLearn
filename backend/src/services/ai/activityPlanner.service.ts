import { DifficultyAdaptationService } from './difficultyAdaptation.service';
import { InterpretedActivityRequest } from './activityRequestInterpreter.service';

export interface ActivityPlan {
  interpreted: InterpretedActivityRequest;
  estimatedMinutes: number;
  starReward: number;
  generationPrompt: string;
  expectedElementCount: number;
  expectedZoneCount: number;
  cognitiveTarget: string;
}

export class ActivityPlanner {
  /**
   * Plans the activity structure, interaction boundaries, and generation instructions
   */
  public static plan(
    request: InterpretedActivityRequest,
    sourceContext?: string
  ): ActivityPlan {
    const profile = DifficultyAdaptationService.getAdaptationProfile(request.className, request.difficulty);
    const context = sourceContext?.trim() || `Subject: ${request.subject}\nTopic: ${request.topic}\nConcept: ${request.conceptTitle}`;

    const expectedElementCount = request.identifiedItems.length >= 2 ? request.identifiedItems.length : 4;
    const expectedZoneCount = expectedElementCount;

    const teacherDirective = request.pedagogicalIntent
      ? `TEACHER'S FREE-TEXT INSTRUCTION (MUST BE FAITHFULLY IMPLEMENTED):
"""
${request.pedagogicalIntent}
"""`
      : 'Generate an engaging, conceptually rigorous interactive activity.';

    const generationPrompt = `You are a Senior Educational Technologist, Learning Experience Designer, and Curriculum Architect.
Generate an executable Activity Specification for ${request.className} (${request.subject}) students on "${request.topic}".

${teacherDirective}

ACTIVITY METADATA:
- Modality: ${request.targetModality.toUpperCase()}
- Activity Type: ${request.resolvedActivityType}
- Grade Level: ${request.className}
- Difficulty Level: ${request.difficulty}
- Learning Objective: ${request.learningObjective}

SOURCE TEXTBOOK EXCERPT:
"""
${context}
"""

DESIGN RULES:
1. Two Distinct Phases:
   - Phase 1: Conceptual demonstration / learning content overview (not just a title; provide actual pedagogical content, diagram layout, narration script, or reading passage).
   - Phase 2: Concrete interactive task with availableElements, targetZones, correctSolution, hints, and immediate action feedback.
2. Grounded & Specific:
   - Use concrete terms from the excerpt${request.identifiedItems.length > 0 ? ` including: ${request.identifiedItems.join(', ')}` : ''}.
   - Do NOT produce a question set or generic MCQ in place of an activity!
3. Structured Correct Solution:
   - Provide an exact mathematical, sequential, or mapping solution that the student app engine can evaluate automatically.
4. Output STRICTLY valid JSON matching the ActivitySpecification schema:
{
  "schemaVersion": "2.0.0",
  "id": "act_${Date.now()}",
  "title": "Clear, engaging activity title",
  "description": "Student-facing activity mission",
  "subject": "${request.subject}",
  "grade": "${request.className}",
  "topic": "${request.topic}",
  "modality": "${request.targetModality}",
  "activityType": "${request.resolvedActivityType}",
  "difficulty": "${request.difficulty}",
  "learningObjective": "${request.learningObjective}",
  "studentInstructions": "Direct, step-by-step instructions on what to tap, drag, or sequence",
  "teacherPrompt": ${JSON.stringify(request.pedagogicalIntent)},
  "estimatedDurationMinutes": ${profile.estimatedMinutes},
  "starReward": ${profile.starReward},
  "learningContent": {
    "overview": "Clear explanation of the concept mechanisms",
    "demonstration": {
      "type": "${request.targetModality === 'visual' ? 'diagram_inspection' : request.targetModality === 'auditory' ? 'audio_narration' : request.targetModality === 'read_write' ? 'reading_notes' : 'simulation_preview'}",
      "data": { "key": "value" }
    },
    "keyTakeaway": "Core takeaway principle"
  },
  "interactionData": {
    "availableElements": [
      { "id": "elem_1", "label": "Item Label", "description": "Role", "color": "#3B82F6" }
    ],
    "targetZones": [
      { "id": "zone_1", "label": "Zone Label", "expectedElementId": "elem_1", "feedbackOnMatch": "Correct match!" }
    ],
    "correctSolution": {
      "type": "${request.resolvedActivityType.includes('sequenc') ? 'ordered_sequence' : request.resolvedActivityType.includes('sort') ? 'category_bins' : request.resolvedActivityType.includes('simulat') ? 'variable_state' : request.resolvedActivityType.includes('blank') ? 'text_fill' : 'element_mapping'}",
      "expectedSequence": ["elem_1", "elem_2"],
      "expectedPairs": [{ "elementId": "elem_1", "zoneId": "zone_1" }],
      "expectedCategories": { "category_1": ["elem_1"] },
      "expectedVariables": { "var_1": 2 },
      "expectedFills": { "blank_1": "answer" }
    },
    "validationRules": {
      "allowPartialCredit": true,
      "immediateFeedback": true
    }
  },
  "hints": ["First helpful hint", "Second deeper hint"],
  "feedback": {
    "correct": "Outstanding! You mastered the concept.",
    "incorrect": "Review the flow and try adjusting the components.",
    "partial": "Good progress! Check remaining elements."
  },
  "completionCriteria": {
    "minimumCorrectPercent": 75
  },
  "embeddedQuestions": [
    {
      "id": "emb_1",
      "prompt": "Reinforcement question directly confirming the activity interaction",
      "options": ["Correct conclusion", "Incorrect distractor", "Random distractor"],
      "correctIndex": 0,
      "explanation": "Explains why the interaction yielded this scientific result."
    }
  ]
}`;

    return {
      interpreted: request,
      estimatedMinutes: profile.estimatedMinutes,
      starReward: profile.starReward,
      generationPrompt,
      expectedElementCount,
      expectedZoneCount,
      cognitiveTarget: profile.cognitiveDepth,
    };
  }
}
