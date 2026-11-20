import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { ActivityItem } from '../../../../../shared/types';
import { VARCHLEARN_COLORS } from '../../../../../shared/constants/theme';
import { PrimaryButton } from '../PrimaryButton';

interface GameProps {
  activity: ActivityItem;
  onComplete: (correct: number, total: number) => void;
}

// 1. Sentence Builder (matches reference image: "Arrange the words correctly!")
const SentenceBuilderGame: React.FC<GameProps> = ({ activity, onComplete }) => {
  const passage = activity.customization.learningInput?.readingPassage;
  const target =
    activity.customization.learningInput?.sentenceBuilderTarget &&
    activity.customization.learningInput.sentenceBuilderTarget.length >= 3
      ? activity.customization.learningInput.sentenceBuilderTarget
      : ['Green', 'leaves', 'make', 'food'];

  const bank =
    activity.customization.learningInput?.sentenceBuilderScrambled &&
    activity.customization.learningInput.sentenceBuilderScrambled.length >= 3
      ? activity.customization.learningInput.sentenceBuilderScrambled
      : ['make', 'Green', 'food', 'leaves'];

  const [placed, setPlaced] = useState<string[]>([]);

  const handlePick = (word: string) => {
    if (placed.includes(word)) return;
    setPlaced([...placed, word]);
  };

  const handleCheck = () => {
    const isCorrect = placed.join(' ') === target.join(' ');
    onComplete(isCorrect ? 1 : 0, 1);
  };

  return (
    <View style={styles.box}>
      {passage ? (
        <View style={styles.passageCard}>
          <Text style={styles.passageTitle}>Read Winky's Note:</Text>
          <Text style={styles.passageText}>{passage}</Text>
        </View>
      ) : null}
      <Text style={styles.heading}>Arrange the words correctly!</Text>
      <View style={styles.slotsRow}>
        {target.map((_: string, i: number) => (
          <TouchableOpacity
            key={i}
            style={styles.slotBox}
            onPress={() => {
              if (placed[i]) {
                setPlaced(placed.filter((_: string, idx: number) => idx !== i));
              }
            }}
          >
            <Text style={styles.slotText}>{placed[i] || '____'}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.tilesRow}>
        {bank.map((w: string) => {
          const used = placed.includes(w);
          return (
            <TouchableOpacity
              key={w}
              disabled={used}
              onPress={() => handlePick(w)}
              style={[styles.wordTile, used && styles.wordTileUsed]}
            >
              <Text style={styles.wordTileText}>{w}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <PrimaryButton
        title="Check"
        disabled={placed.length < target.length}
        onPress={handleCheck}
      />
    </View>
  );
};

// 2. Word Connect
const WordConnectGame: React.FC<GameProps> = ({ activity, onComplete }) => {
  const exp = activity.customization?.learningExperience as any;
  const pairs =
    exp?.termPairs && exp.termPairs.length >= 2
      ? exp.termPairs.map((tp: any) => ({ word: tp.term, meaning: tp.definition }))
      : exp?.vocabularyNotes && exp.vocabularyNotes.length >= 2
      ? exp.vocabularyNotes.map((vn: any) => ({ word: vn.term, meaning: vn.definition }))
      : [
          { word: 'Sprout', meaning: 'A baby plant starting to grow' },
          { word: 'Observe', meaning: 'To look carefully at something' },
          { word: 'Bright', meaning: 'Full of light' },
        ];
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [matched, setMatched] = useState<string[]>([]);

  const handleMeaning = (wordKey: string) => {
    if (!selectedWord) return;
    if (selectedWord === wordKey && !matched.includes(wordKey)) {
      const next = [...matched, wordKey];
      setMatched(next);
      setSelectedWord(null);
      if (next.length === pairs.length) {
        setTimeout(() => onComplete(pairs.length, pairs.length), 300);
      }
    } else {
      setSelectedWord(null);
    }
  };

  return (
    <View style={styles.box}>
      <Text style={styles.heading}>Tap a word, then tap its matching meaning!</Text>
      <View style={styles.connectCols}>
        <View style={styles.col}>
          {pairs.map((p: any) => (
            <TouchableOpacity
              key={p.word}
              disabled={matched.includes(p.word)}
              onPress={() => setSelectedWord(p.word)}
              style={[
                styles.connectBtn,
                selectedWord === p.word && styles.connectSelected,
                matched.includes(p.word) && styles.connectDone,
              ]}
            >
              <Text style={styles.connectText}>{p.word}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.col}>
          {[...pairs].reverse().map((p: any) => (
            <TouchableOpacity
              key={p.word}
              disabled={matched.includes(p.word)}
              onPress={() => handleMeaning(p.word)}
              style={[styles.connectBtn, matched.includes(p.word) && styles.connectDone]}
            >
              <Text style={styles.connectMeaning}>{p.meaning}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

// 3. Crossword Challenge
const CrosswordChallengeGame: React.FC<GameProps> = ({ onComplete }) => {
  const [ans1, setAns1] = useState('');
  const [ans2, setAns2] = useState('');

  const handleSubmit = () => {
    let score = 0;
    if (ans1.trim().toUpperCase() === 'ROOT') score++;
    if (ans2.trim().toUpperCase() === 'LEAF') score++;
    onComplete(score, 2);
  };

  return (
    <View style={styles.box}>
      <Text style={styles.heading}>Read the clues and type the 4-letter plant words!</Text>
      <View style={styles.passageCard}>
        <Text style={styles.passageTitle}>1 Across (4 letters): Absorbs water underground</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Type 4-letter word (ROOT)"
          value={ans1}
          onChangeText={setAns1}
          autoCapitalize="characters"
          maxLength={4}
        />
        <Text style={[styles.passageTitle, { marginTop: 10 }]}>
          2 Down (4 letters): Green part that uses sunlight
        </Text>
        <TextInput
          style={styles.textInput}
          placeholder="Type 4-letter word (LEAF)"
          value={ans2}
          onChangeText={setAns2}
          autoCapitalize="characters"
          maxLength={4}
        />
      </View>
      <PrimaryButton title="Submit Crossword" onPress={handleSubmit} />
    </View>
  );
};

// 4. Missing Word
const MissingWordGame: React.FC<GameProps> = ({ activity, onComplete }) => {
  const exp = activity.customization?.learningExperience as any;
  const blankItem = exp?.fillInBlanks?.[0];
  const [picked, setPicked] = useState<string | null>(null);

  const sentence = blankItem?.sentenceWithBlank || 'Green leaves need water, air, and ______ to make food for the plant.';
  const answer = blankItem?.blankAnswer || 'sunlight';
  const options = blankItem?.options?.length ? blankItem.options : ['sunlight', 'pebbles', 'plastic'];

  return (
    <View style={styles.box}>
      <Text style={styles.heading}>Pick the missing word:</Text>
      <View style={styles.passageCard}>
        <Text style={styles.passageText}>
          {sentence.includes('____') ? (
            <>
              {sentence.split(/____+/)[0]}
              <Text style={{ fontWeight: '900', color: VARCHLEARN_COLORS.primary }}>
                {picked || '______'}
              </Text>
              {sentence.split(/____+/)[1] || ''}
            </>
          ) : (
            sentence
          )}
        </Text>
      </View>
      <View style={styles.tilesRow}>
        {options.map((o: string) => (
          <TouchableOpacity
            key={o}
            onPress={() => setPicked(o)}
            style={[styles.wordTile, picked === o && styles.connectSelected]}
          >
            <Text style={styles.wordTileText}>{o}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <PrimaryButton
        title="Check"
        disabled={!picked}
        onPress={() => onComplete(picked && picked.toLowerCase() === answer.toLowerCase() ? 1 : 0, 1)}
      />
    </View>
  );
};

// 5. Reading Detective
const ReadingDetectiveGame: React.FC<GameProps> = ({ activity, onComplete }) => {
  const exp = activity.customization?.learningExperience as any;
  const passage =
    exp?.structuredPassage ||
    activity.customization.learningInput?.readingPassage ||
    'Every morning at 7 AM, Maya visits the school rooftop garden and measures the tallest tomato sprout.';
  const q = activity.questions?.[0];
  const prompt = q?.prompt || 'When does Maya visit the rooftop garden?';
  const options = q?.options || ['At 7 AM', 'At midnight', 'Only on Sundays'];
  const correctIdx = q?.correctIndex ?? 0;

  return (
    <View style={styles.box}>
      <View style={styles.passageCard}>
        <Text style={styles.passageTitle}>Read the Passage Carefully:</Text>
        <Text style={styles.passageText}>{passage}</Text>
      </View>
      <Text style={styles.heading}>{prompt}</Text>
      {options.map((opt: string, idx: number) => (
        <TouchableOpacity
          key={opt}
          style={styles.connectBtn}
          onPress={() => onComplete(idx === correctIdx ? 1 : 0, 1)}
        >
          <Text style={styles.connectText}>{opt}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// 6. Word Search
const WordSearchGame: React.FC<GameProps> = ({ onComplete }) => {
  const grid = [
    ['L', 'E', 'A', 'F', 'X'],
    ['R', 'O', 'O', 'T', 'Q'],
    ['S', 'U', 'N', 'M', 'Z'],
  ];
  const words = ['LEAF', 'ROOT', 'SUN'];
  const [found, setFound] = useState<string[]>([]);

  const toggleRowWord = (rowIdx: number) => {
    const w = words[rowIdx];
    if (!found.includes(w)) {
      const next = [...found, w];
      setFound(next);
      if (next.length === words.length) {
        setTimeout(() => onComplete(words.length, words.length), 350);
      }
    }
  };

  return (
    <View style={styles.box}>
      <Text style={styles.heading}>Tap each row where you spot: {words.join(', ')}</Text>
      <View style={styles.wsGrid}>
        {grid.map((row, rIdx) => {
          const isFound = found.includes(words[rIdx]);
          return (
            <TouchableOpacity
              key={rIdx}
              onPress={() => toggleRowWord(rIdx)}
              style={[styles.wsRow, isFound && styles.connectDone]}
            >
              {row.map((ch, cIdx) => (
                <View key={cIdx} style={styles.wsCell}>
                  <Text style={styles.wsLetter}>{ch}</Text>
                </View>
              ))}
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.sub}>Found: {found.join(', ') || 'None yet'}</Text>
    </View>
  );
};

export const ReadWriteGameRouter: React.FC<GameProps> = (props) => {
  switch (props.activity.gameType) {
    case 'Sentence Builder':
      return <SentenceBuilderGame {...props} />;
    case 'Word Connect':
      return <WordConnectGame {...props} />;
    case 'Crossword Challenge':
      return <CrosswordChallengeGame {...props} />;
    case 'Missing Word':
      return <MissingWordGame {...props} />;
    case 'Reading Detective':
      return <ReadingDetectiveGame {...props} />;
    case 'Word Search':
    default:
      return <WordSearchGame {...props} />;
  }
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
  passageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    gap: 6,
  },
  passageTitle: { fontWeight: '800', color: '#166534', fontSize: 13.5 },
  passageText: { fontSize: 15, lineHeight: 22, color: VARCHLEARN_COLORS.textPrimary },
  slotsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  slotBox: {
    minWidth: 74,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: VARCHLEARN_COLORS.primary,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  slotText: { fontWeight: '800', color: VARCHLEARN_COLORS.darkPurple },
  tilesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  wordTile: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: VARCHLEARN_COLORS.borderLavender,
  },
  wordTileUsed: { opacity: 0.35 },
  wordTileText: { fontWeight: '700', fontSize: 15, color: VARCHLEARN_COLORS.textPrimary },
  connectCols: { flexDirection: 'row', gap: 10 },
  col: { flex: 1, gap: 10 },
  connectBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: VARCHLEARN_COLORS.borderLavender,
  },
  connectSelected: { borderColor: VARCHLEARN_COLORS.primary, backgroundColor: VARCHLEARN_COLORS.lightLavender },
  connectDone: { borderColor: '#22C55E', backgroundColor: '#DCFCE7' },
  connectText: { fontWeight: '800', color: VARCHLEARN_COLORS.darkPurple, fontSize: 15 },
  connectMeaning: { fontSize: 12.5, color: VARCHLEARN_COLORS.textSecondary, fontWeight: '600' },
  textInput: {
    backgroundColor: VARCHLEARN_COLORS.lavenderTint,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 3,
    borderWidth: 1,
    borderColor: VARCHLEARN_COLORS.borderLavender,
  },
  wsGrid: { gap: 8, alignItems: 'center' },
  wsRow: {
    flexDirection: 'row',
    gap: 8,
    padding: 6,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: VARCHLEARN_COLORS.borderLavender,
  },
  wsCell: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  wsLetter: { fontSize: 18, fontWeight: '800', color: VARCHLEARN_COLORS.darkPurple },
});
