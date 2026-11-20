import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ActivityItem } from '../../../../../shared/types';
import { VARCHLEARN_COLORS } from '../../../../../shared/constants/theme';
import { AudioPlayerBar } from './AudioPlayerBar';

interface GameProps {
  activity: ActivityItem;
  onComplete: (correct: number, total: number) => void;
}

// Sound Sequence & Rhythm Detective
const SoundSequenceGame: React.FC<GameProps> = ({ activity, onComplete }) => {
  const isRhythm = activity.gameType === 'Rhythm Detective';
  const target = isRhythm ? ['Clap', 'Drum', 'Clap'] : ['Low', 'Mid', 'High'];
  const transcript = isRhythm
    ? 'Listen to the rhythm: Clap, Drum, Clap!'
    : 'Listen to the musical tones: Low note, Middle note, High note!';
  const [tapped, setTapped] = useState<string[]>([]);

  const handleTap = (note: string) => {
    const next = [...tapped, note];
    setTapped(next);
    if (next.length === target.length) {
      const score = next.filter((v, i) => v === target[i]).length;
      setTimeout(() => onComplete(score, target.length), 350);
    }
  };

  return (
    <View style={styles.box}>
      <AudioPlayerBar transcript={transcript} label={isRhythm ? 'Hear the Rhythm' : 'Hear the Sequence'} />
      <Text style={styles.heading}>Tap the buttons in the exact order you heard:</Text>
      <Text style={styles.sub}>Your sequence: {tapped.join(' • ') || 'None yet'}</Text>
      <View style={styles.row}>
        {(isRhythm ? ['Clap', 'Drum', 'Rest'] : ['Low', 'Mid', 'High']).map((btn) => (
          <TouchableOpacity key={btn} style={styles.padBtn} onPress={() => handleTap(btn)}>
            <Text style={styles.padText}>{btn}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// Audio Quiz / Sound Detective / Listen & Recall / Story Explorer
const ListeningQuizGame: React.FC<GameProps> = ({ activity, onComplete }) => {
  const exp = activity.customization?.learningExperience as any;
  const transcript =
    exp?.narrationScript ||
    activity.customization.learningInput?.audioTranscript ||
    (activity.gameType === 'Sound Detective'
      ? 'Clue: A small feathered bird is singing tweet-tweet in the morning tree!'
      : 'Welcome to Echo’s Audio Challenge! Listen carefully to the spoken facts and pick the right answer.');

  const segments =
    exp?.segments ||
    activity.customization.learningInput?.audioSegments ||
    [];

  const questions = activity.questions?.length
    ? activity.questions
    : exp?.listeningExercises?.length
    ? exp.listeningExercises
    : activity.gameType === 'Sound Detective'
    ? [
        {
          id: 'sd-1',
          type: 'general' as const,
          prompt: 'Which sound did you hear in Echo’s clue?',
          options: ['Dog barking', 'Bird chirping', 'Cat meowing'],
          correctIndex: 1,
        },
      ]
    : activity.gameType === 'Story Explorer'
    ? [
        {
          id: 'se-1',
          type: 'general' as const,
          prompt: 'How did the clever crow make the water rise in the pitcher?',
          options: ['Dropped pebbles inside', 'Drank from a hose', 'Tipped it over'],
          correctIndex: 0,
        },
      ]
    : [
        {
          id: 'lr-1',
          type: 'academic' as const,
          prompt: 'According to the broadcast, which planet is known as the Red Planet?',
          options: ['Mercury', 'Mars', 'Saturn'],
          correctIndex: 1,
        },
      ];

  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const q = questions[qIdx];

  return (
    <View style={styles.box}>
      <AudioPlayerBar transcript={transcript} label={activity.name} segments={segments} />
      <Text style={styles.heading}>
        Question {qIdx + 1} of {questions.length}
      </Text>
      <View style={styles.card}>
        <Text style={styles.prompt}>{q.prompt}</Text>
      </View>
      <View style={styles.list}>
        {q.options.map((opt: string, i: number) => (
          <TouchableOpacity
            key={i}
            style={styles.optBtn}
            onPress={() => {
              const nextScore = i === q.correctIndex ? score + 1 : score;
              if (qIdx + 1 < questions.length) {
                setScore(nextScore);
                setQIdx(qIdx + 1);
              } else {
                onComplete(nextScore, questions.length);
              }
            }}
          >
            <Text style={styles.optText}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export const AuditoryGameRouter: React.FC<GameProps> = (props) => {
  if (
    props.activity.gameType === 'Sound Sequence' ||
    props.activity.gameType === 'Rhythm Detective'
  ) {
    return <SoundSequenceGame {...props} />;
  }
  return <ListeningQuizGame {...props} />;
};

const styles = StyleSheet.create({
  box: { gap: 14 },
  heading: {
    fontSize: 16,
    fontWeight: '800',
    color: VARCHLEARN_COLORS.darkPurple,
    textAlign: 'center',
  },
  sub: { textAlign: 'center', color: VARCHLEARN_COLORS.textSecondary, fontWeight: '600' },
  row: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  padBtn: {
    flex: 1,
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  padText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: VARCHLEARN_COLORS.borderLavender,
  },
  prompt: { fontSize: 15.5, fontWeight: '700', color: VARCHLEARN_COLORS.textPrimary },
  list: { gap: 10 },
  optBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 15,
    borderWidth: 1.5,
    borderColor: '#93C5FD',
  },
  optText: { fontSize: 15, fontWeight: '700', color: VARCHLEARN_COLORS.textPrimary },
});
