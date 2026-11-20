import { DifficultyLevel, ModalityKey, ActivityCategory } from '../../../../shared/types';

export const PROMPTS = {
  /**
   * Concept Extraction Prompt:
   * Extracts grounded conceptual knowledge map from textbook text.
   */
  conceptExtraction(params: {
    className: string;
    subject: string;
    chapter: string;
    topic: string;
    excerpt: string;
  }): string {
    return `You are a Senior Educational Content Architect and Curriculum Specialist.
Extract a comprehensive, scientifically rigorous Concept Knowledge Map from the textbook excerpt below for students in ${params.className} (${params.subject}).

SOURCE MATERIAL:
Chapter: ${params.chapter}
Topic: ${params.topic}
Textbook Excerpt:
"""
${params.excerpt}
"""

GROUNDING RULE:
Extract concepts, definitions, relationships, sequences, and misconceptions STRICTLY grounded in the provided text. Do not invent external trivia.

Output ONLY valid JSON matching this schema:
{
  "topicTitle": "${params.topic}",
  "gradeLevel": "${params.className}",
  "subject": "${params.subject}",
  "mainConcepts": ["primary concepts taught"],
  "supportingConcepts": ["sub-concepts, secondary mechanisms"],
  "definitions": [
    { "term": "string", "definition": "clear, age-appropriate definition", "example": "optional example" }
  ],
  "keyTerminology": ["essential domain terms"],
  "processesAndMechanisms": [
    { "name": "process name", "steps": ["step 1", "step 2"], "significance": "why this matters" }
  ],
  "causeAndEffect": [
    { "cause": "factor or event", "effect": "direct outcome" }
  ],
  "sequencesAndStages": [
    { "sequenceName": "name of cycle or order", "orderedStages": ["stage 1", "stage 2", "stage 3"] }
  ],
  "comparisons": [
    { "itemA": "concept A", "itemB": "concept B", "differenceOrRelation": "how they compare" }
  ],
  "realWorldApplications": ["how this operates in daily life or technology"],
  "importantFacts": ["vital foundational facts"],
  "misconceptions": [
    { "misconception": "common flawed belief students hold", "correction": "scientific correction" }
  ],
  "learningObjectives": ["Specific measurable mastery targets"],
  "recommendedDiagrams": ["visual representations that clarify the concept"]
}`;
  },

  /**
   * Concept Explanation Prompt:
   * Generates a structured academic explanation adapted to grade.
   */
  conceptExplanation(params: {
    className: string;
    subject: string;
    chapter: string;
    topic: string;
    conceptMap: Record<string, unknown>;
  }): string {
    return `You are a Master Teacher and Learning Experience Designer.
Generate a structured, academically rigorous, yet engaging conceptual explanation for ${params.className} (${params.subject}) students on the topic "${params.topic}".

CONCEPT MAP DATA:
${JSON.stringify(params.conceptMap, null, 2)}

REQUIREMENTS:
- Intellectually sound and scientifically accurate for ${params.className}.
- Modern, mature tone: avoid babyish or condescending language.
- Structured into progressive logical sections with real-world connections.
- Output ONLY valid JSON:
{
  "title": "${params.topic} — Conceptual Masterclass",
  "gradeLevel": "${params.className}",
  "targetAudience": "Students in ${params.className}",
  "summary": "Clear, concise high-level synthesis of the topic.",
  "sections": [
    {
      "heading": "Section Title",
      "content": "Deep conceptual explanation breaking down how and why things work.",
      "realWorldConnection": "Practical application in everyday life or engineering/nature.",
      "keyTakeaway": "Single sentence core principle."
    }
  ],
  "vocabularyHighlights": [
    { "term": "key term", "meaning": "precise conceptual definition" }
  ],
  "reviewCheckpoints": [
    "Reflective inquiry question or thought prompt"
  ]
}`;
  },

  /**
   * 4-Modality Generation Prompt:
   * Generates the four independent representations grounded in the Concept Map.
   */
  fourModalities(params: {
    className: string;
    subject: string;
    chapter: string;
    topic: string;
    conceptMap: Record<string, unknown>;
  }): string {
    return `You are a Multimodal Learning Experience Designer.
Based on the Concept Map provided below for ${params.className} ${params.subject} on "${params.topic}", create FOUR DISTINCT, high-quality multimodal learning representations: Visual, Auditory, Read/Write, and Kinesthetic.

CONCEPT MAP:
${JSON.stringify(params.conceptMap, null, 2)}

MODALITY RULES:
1. VISUAL: Provide an annotated diagram or concept map specification with 3-6 interactive elements having coordinates (x, y between 10..90), labels, roles, and functional connections.
2. AUDITORY: Provide an engaging, professional spoken narration script and guided listening breakdown with audio segments and targeted listening comprehension questions.
3. READ/WRITE: Provide an intellectually engaging analytical passage, deep text comprehension questions, sentence reconstruction, and fill-in-the-gap reasoning exercises.
4. KINESTHETIC: Provide an interactive physical/digital simulation or model assembly design with movable components, target placement zones/slots, simulation variables (e.g. rate, amount, temperature, force), and cause-and-effect challenges. NOT multiple choice disguised as games.

Output ONLY valid JSON:
{
  "topicTitle": "${params.topic}",
  "gradeLevel": "${params.className}",
  "visual": {
    "title": "Visual Diagram Title",
    "diagramType": "annotated_diagram",
    "description": "Visual overview of the structural or process relationships",
    "elements": [
      { "id": "part_1", "label": "Label", "description": "Scientific function", "x": 50, "y": 20, "role": "Primary role" }
    ],
    "connections": [
      { "from": "part_1", "to": "part_2", "label": "transfers to" }
    ],
    "svgSpecification": {
      "viewBox": "0 0 100 100",
      "themeColor": "#7041C6",
      "instructions": "Tap components to inspect their structural roles."
    }
  },
  "auditory": {
    "title": "Auditory Analysis Title",
    "narrationScript": "Rich, spoken narrative clearly explaining the mechanisms for listening comprehension.",
    "speakerInstructions": "Engaging, conversational tone with pauses at key terminology.",
    "audioSegments": [
      { "index": 1, "title": "Segment Heading", "transcriptSnippet": "Audio text...", "soundCue": "chime", "keyListenFor": "Listen for the distinction between..." }
    ],
    "listeningQuestions": [
      { "prompt": "Question based on what was heard", "options": ["Option A", "Option B", "Option C"], "correctIndex": 0, "hint": "Recall the second segment", "explanation": "Detailed evidence from the narration." }
    ]
  },
  "readWrite": {
    "title": "Analytical Reading & Synthesis",
    "readingPassage": "Rich, informative passage requiring close reading and textual reasoning.",
    "analysisFocus": "Core analytical theme",
    "evidenceQuestions": [
      { "prompt": "Analytical question", "evidenceSentenceInPassage": "Quoted sentence from passage", "options": ["Option A", "Option B", "Option C"], "correctIndex": 0, "explanation": "Why this evidence proves the answer." }
    ],
    "sentenceBuilderTarget": ["Word1", "Word2", "Word3", "Word4"],
    "sentenceBuilderScrambled": ["Word3", "Word1", "Word4", "Word2"],
    "fillInTheBlanks": [
      { "sentenceWithBlank": "The primary role is ____.", "blankAnswer": "answer", "options": ["wrong1", "answer", "wrong2"], "explanation": "Explanation..." }
    ]
  },
  "kinesthetic": {
    "title": "Interactive Model & Simulation",
    "activityFormat": "model_assembly",
    "scenario": "Interactive scenario where student manipulates components or variables.",
    "interactiveComponents": [
      { "id": "comp_1", "name": "Component Name", "categoryOrSlot": "slot_1", "description": "What this does in the system", "behaviorOnInteract": "Snaps into position" }
    ],
    "slotsOrZones": [
      { "id": "slot_1", "label": "Target Zone", "expectedComponentId": "comp_1", "feedbackOnMatch": "Correctly anchored!" }
    ],
    "simulationVariables": [
      { "name": "variableA", "label": "Control Variable", "min": 1, "max": 3, "initial": 1, "optimalValue": 2, "unit": "units", "explanation": "Effect of adjusting this variable" }
    ],
    "challengeTasks": [
      { "taskPrompt": "Assemble the mechanism in functional order or balance the system.", "targetState": "Balanced", "successMessage": "System successfully harmonized!" }
    ]
  }
}`;
  },

  /**
   * Modality Activity Prompt with Age & Difficulty Adaptation.
   */
  modalityActivity(params: {
    className: string;
    subject: string;
    chapter: string;
    topic: string;
    subtopic?: string;
    modality: ModalityKey;
    category: ActivityCategory;
    difficulty: DifficultyLevel;
    excerptOrConcept: string;
  }): string {
    const modalityDetails: Record<ModalityKey, string> = {
      visual: 'Focus on diagram interpretation, spatial relationships, visual pattern analysis, or concept maps. Include learningInput.diagramTitle and learningInput.diagramParts with 3-5 items having {id, label, description, x, y}. GameType must be one of: "Diagram Detective", "Picture Memory Match", "Pattern Recognition", "Jigsaw Puzzle", "Visual Maze", "Picture Sequence Challenge", or "Question Set".',
      auditory: 'Focus on spoken narration analysis, audio cues, listening comprehension, and auditory sequence recall. Include learningInput.audioTranscript (rich, engaging audio script). GameType must be one of: "Audio Quiz", "Sound Detective", "Listen and Recall", "Sound Sequence", "Rhythm Detective", "Story Explorer", or "Question Set".',
      read_write: 'Focus on close reading, textual evidence, vocabulary synthesis, sentence building, and fill-in-the-gap reasoning. Include learningInput.readingPassage. GameType must be one of: "Sentence Builder", "Word Connect", "Crossword Challenge", "Missing Word", "Reading Detective", "Word Search", or "Question Set".',
      kinesthetic: 'Focus on interactive model assembly, variable experimentation, process sequencing, or component sorting. Include learningInput.interactiveModelParts (3-5 concrete movable components) or simulationVariables. GameType must be one of: "Model Builder", "Drag-and-Drop Challenge", "Virtual Experiment", "Object Sorting", "Mechanism Challenge", "Build in Order", or "Question Set".',
    };

    const difficultyGuidelines: Record<DifficultyLevel, string> = {
      Easy: 'DIFFICULTY: EASY. Focus on foundational concepts, straightforward step-by-step reasoning, clear hints, reduced cognitive overload, direct answers supported by clear clues.',
      Medium: 'DIFFICULTY: MEDIUM. Combine 2-3 related concepts, require interpretation and application, multi-step reasoning, moderate guidance.',
      Hard: 'DIFFICULTY: HARD. Introduce unfamiliar but grounded scenarios, require inference, synthesis, multi-step problem solving, analysis of cause-and-effect, and justification.',
    };

    const categoryDetails = params.category === 'question_sets'
      ? 'Generate 5 rigorous, diverse academic questions evaluating deep comprehension of the concepts.'
      : 'Design an interactive game mechanic tailored to the modality and topic, plus 3 challenging in-game questions.';

    return `You are a Senior Educational Game & Assessment Designer.
Generate a high-quality ${params.modality.toUpperCase()} activity for ${params.className} (${params.subject}) at ${params.difficulty} difficulty.

TOPIC: ${params.topic}${params.subtopic ? ` (Subtopic: ${params.subtopic})` : ''}
CHAPTER: ${params.chapter}

SOURCE MATERIAL / CONCEPT EXCERPT:
"""
${params.excerptOrConcept}
"""

MODALITY RULES:
${modalityDetails[params.modality]}

ADAPTATION GUIDELINES:
- Grade Level: ${params.className}. Adjust vocabulary, reading length, cognitive expectations, and contextual maturity to this grade level. Modern, polished tone — never childish.
- ${difficultyGuidelines[params.difficulty]}
- ${categoryDetails}

OUTPUT REQUIREMENTS:
- Name: Compelling, professional title reflecting both concept and activity.
- Each question must have 3-4 distinct options, a valid 0-based correctIndex, a helpful hint, and an academic explanation citing the concept.
- Output ONLY valid JSON:
{
  "name": "Title of the activity",
  "gameType": "Specific Game Type",
  "targetAbility": "Cognitive ability developed",
  "customization": {
    "gameTheme": "Theme name",
    "backgroundStyle": "Visual style",
    "objects": ["relevant", "topic", "objects"],
    "visualsDescription": "Clear description of visual elements",
    "mission": "Engaging student objective",
    "instructions": "Precise, clear instructions on how to interact",
    "vocabulary": ["term1", "term2"],
    "scenario": "Real-world or scientific context",
    "rewardSteps": ["Step 1", "Step 2"],
    "progressStages": ["Phase 1", "Phase 2", "Mastery"],
    "learningInput": {
      "diagramTitle": "Title if visual",
      "diagramParts": [
        { "id": "part1", "label": "Label", "description": "Function", "x": 50, "y": 30 }
      ],
      "audioTranscript": "Spoken script if auditory",
      "readingPassage": "Reading passage if read_write",
      "sentenceBuilderTarget": ["Word1", "Word2", "Word3"],
      "sentenceBuilderScrambled": ["Word2", "Word1", "Word3"],
      "interactiveModelParts": ["Component1", "Component2", "Component3"]
    },
    "learningExperience": {
      "visualType": "annotated_diagram",
      "title": "Topic Visual Layout",
      "description": "Visual breakdown",
      "instructions": "Inspect each node",
      "nodes": [{ "id": "node_1", "label": "Core", "description": "Description", "x": 50, "y": 30, "color": "#3B82F6" }],
      "connections": [{ "fromId": "node_1", "toId": "node_2", "label": "Links" }],
      "inspectionTasks": ["Inspect the core node"]
    }
  },
  "questions": [
    {
      "type": "academic",
      "prompt": "Rigorous question prompt",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "hint": "Constructive guidance",
      "explanation": "Definitive explanation connecting to source concept"
    }
  ]
}`;
  },

  /**
   * Assessment Generation Prompt:
   * Generates a balanced 4-modality assessment with multiple question formats and evaluation rubrics.
   */
  assessmentGeneration(params: {
    className: string;
    subject: string;
    chapter: string;
    topic: string;
    conceptMap: Record<string, unknown>;
    questionCount?: number;
    difficulty?: DifficultyLevel;
  }): string {
    const qCount = params.questionCount || 8;
    const diff = params.difficulty || 'Medium';

    return `You are an Educational Assessment Specialist and Psychometrician.
Generate a comprehensive, scientifically balanced assessment for ${params.className} (${params.subject}) on "${params.topic}" (Chapter: ${params.chapter}) at ${diff} difficulty.

CONCEPT KNOWLEDGE BASE:
${JSON.stringify(params.conceptMap, null, 2)}

ASSESSMENT DESIGN RULES:
1. Generate ${qCount} questions covering all four VARK modalities (at least 2 per modality).
2. Use diverse question formats:
   - "multiple_choice" (1 correct option)
   - "multiple_select" (2 or more correct options)
   - "true_false_justification" (True or False, plus required reason)
   - "fill_in_the_blank" (Precise term or numeric answer)
   - "ordering_sequence" (Ordering stages/events)
   - "matching_classification" (Classifying concepts or pairs)
   - "assertion_reasoning" (Assertion A and Reason R)
   - "short_answer_rubric" (Conceptual open response with a 3-tier scoring rubric)
3. Difficulty: ${diff}. Ensure questions test conceptual reasoning, application, analysis, and synthesis rather than superficial recall.
4. Distractors must represent common student misconceptions, not absurd non-sequiturs.
5. Provide precise marks (1 to 3 per question), hints, explanations, and learning objectives.

Output ONLY valid JSON:
{
  "name": "${params.topic} — Comprehensive Diagnostic & Mastery Assessment",
  "description": "Standardized 4-modality assessment evaluating conceptual understanding, structural mechanisms, and application.",
  "className": "${params.className}",
  "subject": "${params.subject}",
  "chapter": "${params.chapter}",
  "topic": "${params.topic}",
  "totalQuestions": ${qCount},
  "totalMarks": ${Math.round(qCount * 1.5)},
  "estimatedMinutes": ${Math.max(15, qCount * 2)},
  "modalityCoverage": {
    "visual": ${Math.ceil(qCount / 4)},
    "auditory": ${Math.floor(qCount / 4)},
    "read_write": ${Math.floor(qCount / 4)},
    "kinesthetic": ${Math.floor(qCount / 4)}
  },
  "questions": [
    {
      "questionType": "multiple_choice",
      "modality": "visual",
      "difficulty": "${diff}",
      "marks": 1,
      "prompt": "Question text...",
      "contextSnippet": "Optional context or diagram reference",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "correctIndex": 0,
      "hint": "Guidance hint",
      "explanation": "Detailed pedagogical explanation",
      "conceptTested": "Core concept",
      "learningObjective": "Mastery goal"
    },
    {
      "questionType": "short_answer_rubric",
      "modality": "read_write",
      "difficulty": "${diff}",
      "marks": 3,
      "prompt": "Open conceptual question requiring explanation and justification...",
      "correctAnswer": "Ideal student response containing key principles",
      "hint": "Consider both cause and effect",
      "explanation": "Comprehensive reference answer",
      "conceptTested": "Systemic mechanism",
      "learningObjective": "Explain and justify",
      "rubric": {
        "criteria": "Accuracy of explanation and identification of mechanisms",
        "fullMarksCondition": "Correctly identifies both mechanism and outcome with scientific terminology",
        "partialMarksCondition": "Identifies mechanism but lacks justification or terminology",
        "zeroMarksCondition": "Incorrect, irrelevant, or ungrounded claims"
      }
    }
  ]
}`;
  },
};
