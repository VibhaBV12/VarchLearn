import { ModalityKey } from '../types';

export interface ModalityActivitySpec {
  gameType: string;
  modality: ModalityKey;
  description: string;
  cognitiveTarget: string;
}

export const MODALITY_ACTIVITIES: Record<ModalityKey, ModalityActivitySpec[]> = {
  visual: [
    {
      gameType: 'Jigsaw Puzzle',
      modality: 'visual',
      description: 'Assemble visual puzzle tiles to reveal an educational diagram or scene.',
      cognitiveTarget: 'Spatial reasoning & part-to-whole visual recognition',
    },
    {
      gameType: 'Pattern Recognition',
      modality: 'visual',
      description: 'Spot the missing shape, color, or visual sequence in a pattern matrix.',
      cognitiveTarget: 'Visual pattern detection & logical sequencing',
    },
    {
      gameType: 'Visual Maze',
      modality: 'visual',
      description: 'Navigate a branching visual maze by following picture landmarks.',
      cognitiveTarget: 'Spatial planning & visual scanning',
    },
    {
      gameType: 'Picture Memory Match',
      modality: 'visual',
      description: 'Flip cards to match identical or conceptually paired images.',
      cognitiveTarget: 'Visual working memory & detail recall',
    },
    {
      gameType: 'Diagram Detective',
      modality: 'visual',
      description: 'Explore an interactive labeled diagram first, then identify its parts.',
      cognitiveTarget: 'Diagram interpretation & visual labeling',
    },
    {
      gameType: 'Picture Sequence Challenge',
      modality: 'visual',
      description: 'Arrange illustrated story or process frames in the correct visual order.',
      cognitiveTarget: 'Visual storytelling & step-by-step observation',
    },
  ],
  auditory: [
    {
      gameType: 'Sound Detective',
      modality: 'auditory',
      description: 'Listen to spoken clues or real-world audio clips and identify the source.',
      cognitiveTarget: 'Auditory discrimination & listening comprehension',
    },
    {
      gameType: 'Listen and Recall',
      modality: 'auditory',
      description: 'Hear a short spoken fact list or explanation and recall key details.',
      cognitiveTarget: 'Auditory working memory',
    },
    {
      gameType: 'Sound Sequence',
      modality: 'auditory',
      description: 'Listen to a series of tones or spoken steps and reproduce the order.',
      cognitiveTarget: 'Sequential auditory processing',
    },
    {
      gameType: 'Audio Quiz',
      modality: 'auditory',
      description: 'Listen to an audio explanation with replay controls and answer questions.',
      cognitiveTarget: 'Spoken explanation comprehension',
    },
    {
      gameType: 'Rhythm Detective',
      modality: 'auditory',
      description: 'Hear a rhythmic beat pattern and match or continue the rhythm.',
      cognitiveTarget: 'Rhythmic pattern & tempo recognition',
    },
    {
      gameType: 'Story Explorer',
      modality: 'auditory',
      description: 'Listen to an interactive narrated mini-story and answer comprehension prompts.',
      cognitiveTarget: 'Narrative listening & inference',
    },
  ],
  read_write: [
    {
      gameType: 'Word Connect',
      modality: 'read_write',
      description: 'Connect letters or pair vocabulary words with their written meanings.',
      cognitiveTarget: 'Vocabulary & semantic association',
    },
    {
      gameType: 'Sentence Builder',
      modality: 'read_write',
      description: 'Arrange shuffled word tiles into a grammatically accurate sentence.',
      cognitiveTarget: 'Syntax, grammar & written expression',
    },
    {
      gameType: 'Crossword Challenge',
      modality: 'read_write',
      description: 'Read written clues and fill in interlocking word grids.',
      cognitiveTarget: 'Spelling, definition recall & reading clues',
    },
    {
      gameType: 'Missing Word',
      modality: 'read_write',
      description: 'Read a passage and select or type the exact missing vocabulary word.',
      cognitiveTarget: 'Contextual reading comprehension',
    },
    {
      gameType: 'Reading Detective',
      modality: 'read_write',
      description: 'Read a short passage and answer text-evidence questions.',
      cognitiveTarget: 'Reading comprehension & detail extraction',
    },
    {
      gameType: 'Word Search',
      modality: 'read_write',
      description: 'Find key subject vocabulary words hidden inside a letter grid.',
      cognitiveTarget: 'Orthographic recognition & spelling',
    },
  ],
  kinesthetic: [
    {
      gameType: 'Drag-and-Drop Challenge',
      modality: 'kinesthetic',
      description: 'Move and place objects into their functional zones on a canvas.',
      cognitiveTarget: 'Hands-on spatial mapping & categorization',
    },
    {
      gameType: 'Virtual Experiment',
      modality: 'kinesthetic',
      description: 'Adjust variables, mix components, and observe simulated outcomes.',
      cognitiveTarget: 'Experimental cause-and-effect manipulation',
    },
    {
      gameType: 'Model Builder',
      modality: 'kinesthetic',
      description: 'Assemble individual structural parts into a complete working model.',
      cognitiveTarget: 'Structural assembly & mechanical understanding',
    },
    {
      gameType: 'Object Sorting',
      modality: 'kinesthetic',
      description: 'Physically sort interactive items into bins based on properties.',
      cognitiveTarget: 'Tactile classification & grouping',
    },
    {
      gameType: 'Mechanism Challenge',
      modality: 'kinesthetic',
      description: 'Connect gears, levers, or process stages so a system operates.',
      cognitiveTarget: 'Process mechanics & cause-effect chains',
    },
    {
      gameType: 'Build in Order',
      modality: 'kinesthetic',
      description: 'Construct a multi-step object or lifecycle by stacking stages in order.',
      cognitiveTarget: 'Procedural construction & sequencing',
    },
  ],
};

export const ALL_CLASSES = ['Class 4', 'Class 5', 'Class 6'];
export const ALL_SUBJECTS = ['Science', 'Mathematics', 'English', 'Social Studies'];
