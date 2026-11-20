import { MascotId, ModalityKey } from '../types';

export const VARCHLEARN_COLORS = {
  primary: '#7041C6',
  primaryLight: '#8E64D8',
  primarySoft: '#A987E4',
  primaryDark: '#532B9E',
  darkPurple: '#39245F',
  white: '#FFFFFF',
  lightLavender: '#F3EEFC',
  lavenderTint: '#FAF8FF',
  borderLavender: '#E2D6F8',
  textPrimary: '#24163D',
  textSecondary: '#64587A',
  textMuted: '#8F84A6',
  success: '#22C55E',
  successBg: '#DCFCE7',
  warning: '#F59E0B',
  warningBg: '#FEF3C7',
  danger: '#EF4444',
  dangerBg: '#FEE2E2',
  info: '#3B82F6',
  infoBg: '#DBEAFE',
  starGold: '#FFB800',
  pathGreen: '#7AD068',
  pathGreenDark: '#54A844',
  pathTrail: '#F7E7B4',
  pathTrailBorder: '#E4C878',
} as const;

export const MODALITY_META: Record<
  ModalityKey,
  {
    key: ModalityKey;
    technicalName: string;
    studentName: string;
    mascotId: MascotId;
    mascotName: string;
    color: string;
    bgColor: string;
    borderColor: string;
    iconName: string;
    tagline: string;
  }
> = {
  visual: {
    key: 'visual',
    technicalName: 'Visual',
    studentName: 'Picture Explorer',
    mascotId: 'pixie',
    mascotName: 'Pixie',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    borderColor: '#FCD34D',
    iconName: 'eye',
    tagline: 'Explore pictures, patterns, diagrams & mazes!',
  },
  auditory: {
    key: 'auditory',
    technicalName: 'Auditory',
    studentName: 'Sound Explorer',
    mascotId: 'echo',
    mascotName: 'Echo',
    color: '#3B82F6',
    bgColor: '#DBEAFE',
    borderColor: '#93C5FD',
    iconName: 'headphones',
    tagline: 'Listen closely to sounds, rhythms & stories!',
  },
  read_write: {
    key: 'read_write',
    technicalName: 'Read/Write',
    studentName: 'Word Explorer',
    mascotId: 'winky',
    mascotName: 'Winky',
    color: '#22C55E',
    bgColor: '#DCFCE7',
    borderColor: '#86EFAC',
    iconName: 'book-open',
    tagline: 'Build sentences, solve word puzzles & read!',
  },
  kinesthetic: {
    key: 'kinesthetic',
    technicalName: 'Kinesthetic',
    studentName: 'Action Explorer',
    mascotId: 'bouncy',
    mascotName: 'Bouncy',
    color: '#06B6D4',
    bgColor: '#CFFAFE',
    borderColor: '#67E8F9',
    iconName: 'hand',
    tagline: 'Build models, sort objects & run experiments!',
  },
};

export const MASCOT_META: Record<
  MascotId,
  {
    id: MascotId;
    name: string;
    role: string;
    primaryColor: string;
    accentColor: string;
    personality: string;
    defaultGreeting: string;
  }
> = {
  vee: {
    id: 'vee',
    name: 'Vee',
    role: 'Main VarchLearn Guide',
    primaryColor: '#7041C6',
    accentColor: '#FFB800',
    personality: 'Friendly, funny, cheerful, and encouraging',
    defaultGreeting: "Hi explorer! Ready for today's adventure?",
  },
  pixie: {
    id: 'pixie',
    name: 'Pixie',
    role: 'Visual Explorer',
    primaryColor: '#F59E0B',
    accentColor: '#FEF3C7',
    personality: 'Observant, artistic, loves spotting hidden details',
    defaultGreeting: 'Look closely—there are clues in every picture!',
  },
  echo: {
    id: 'echo',
    name: 'Echo',
    role: 'Sound Explorer',
    primaryColor: '#3B82F6',
    accentColor: '#DBEAFE',
    personality: 'Musical, attentive, loves listening to every sound',
    defaultGreeting: 'Put on your listening ears and catch every note!',
  },
  winky: {
    id: 'winky',
    name: 'Winky',
    role: 'Word Explorer',
    primaryColor: '#22C55E',
    accentColor: '#DCFCE7',
    personality: 'Curious, clever, loves stories and word puzzles',
    defaultGreeting: 'Every word is a key to a brand new world!',
  },
  bouncy: {
    id: 'bouncy',
    name: 'Bouncy',
    role: 'Action Explorer',
    primaryColor: '#06B6D4',
    accentColor: '#CFFAFE',
    personality: 'Energetic, hands-on, loves building and testing',
    defaultGreeting: "Let's build, move, and try it out together!",
  },
};
