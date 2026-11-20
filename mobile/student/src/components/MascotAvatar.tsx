import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Ellipse, Path, Rect, Polygon } from 'react-native-svg';
import { MascotExpression, MascotId } from '../../../../shared/types';
import { MASCOT_META } from '../../../../shared/constants/theme';

interface MascotAvatarProps {
  mascotId: MascotId;
  expression?: MascotExpression;
  size?: number;
  speechBubble?: string;
}

export const MascotAvatar: React.FC<MascotAvatarProps> = ({
  mascotId,
  expression = 'happy',
  size = 88,
  speechBubble,
}) => {
  const meta = MASCOT_META[mascotId];

  const renderMouth = () => {
    switch (expression) {
      case 'excited':
      case 'celebrating':
        return <Path d="M40 60 Q50 72 60 60 Z" fill="#39245F" stroke="#39245F" strokeWidth={2} />;
      case 'surprised':
        return <Circle cx="50" cy="63" r="5" fill="#39245F" />;
      case 'thinking':
        return <Path d="M44 62 Q50 60 56 63" stroke="#39245F" strokeWidth={2.5} fill="none" strokeLinecap="round" />;
      case 'curious':
        return <Path d="M43 61 Q50 66 57 60" stroke="#39245F" strokeWidth={2.5} fill="none" strokeLinecap="round" />;
      case 'encouraging':
      case 'happy':
      default:
        return <Path d="M41 59 Q50 68 59 59" stroke="#39245F" strokeWidth={2.5} fill="none" strokeLinecap="round" />;
    }
  };

  const renderEyes = () => {
    if (expression === 'celebrating') {
      return (
        <>
          <Path d="M34 48 Q39 42 44 48" stroke="#24163D" strokeWidth={3} fill="none" strokeLinecap="round" />
          <Path d="M56 48 Q61 42 66 48" stroke="#24163D" strokeWidth={3} fill="none" strokeLinecap="round" />
        </>
      );
    }
    if (expression === 'encouraging') {
      return (
        <>
          <Circle cx="39" cy="47" r="4.5" fill="#24163D" />
          <Circle cx="37.5" cy="45.5" r="1.5" fill="#FFFFFF" />
          <Path d="M56 47 Q61 42 66 47" stroke="#24163D" strokeWidth={3} fill="none" strokeLinecap="round" />
        </>
      );
    }
    const pupilRadius = expression === 'surprised' ? 5.5 : 4.5;
    return (
      <>
        <Circle cx="39" cy="47" r={pupilRadius} fill="#24163D" />
        <Circle cx="61" cy="47" r={pupilRadius} fill="#24163D" />
        <Circle cx="37.5" cy="45.5" r="1.6" fill="#FFFFFF" />
        <Circle cx="59.5" cy="45.5" r="1.6" fill="#FFFFFF" />
      </>
    );
  };

  const renderCharacter = () => {
    switch (mascotId) {
      case 'vee':
        // Purple Cheerful Fox Explorer with Star Badge
        return (
          <Svg width={size} height={size} viewBox="0 0 100 100">
            <Circle cx="50" cy="54" r="40" fill="#F3EEFC" />
            {/* Ears */}
            <Polygon points="22,38 28,12 45,30" fill="#7041C6" />
            <Polygon points="26,35 30,18 40,30" fill="#FFB8E0" />
            <Polygon points="78,38 72,12 55,30" fill="#7041C6" />
            <Polygon points="74,35 70,18 60,30" fill="#FFB8E0" />
            {/* Head */}
            <Ellipse cx="50" cy="52" rx="30" ry="26" fill="#7041C6" />
            {/* Cheeks / Snout */}
            <Ellipse cx="50" cy="59" rx="22" ry="16" fill="#FFFFFF" />
            <Polygon points="47,54 53,54 50,58" fill="#39245F" />
            {renderEyes()}
            {renderMouth()}
            {/* Sparkles for Vee */}
            <Polygon points="84,18 86,23 91,25 86,27 84,32 82,27 77,25 82,23" fill="#FFB800" />
          </Svg>
        );
      case 'pixie':
        // Visual Explorer: Amber Cat with Round Glasses
        return (
          <Svg width={size} height={size} viewBox="0 0 100 100">
            <Circle cx="50" cy="54" r="40" fill="#FEF3C7" />
            <Polygon points="24,40 28,14 44,32" fill="#F59E0B" />
            <Polygon points="76,40 72,14 56,32" fill="#F59E0B" />
            <Ellipse cx="50" cy="53" rx="29" ry="25" fill="#F59E0B" />
            <Ellipse cx="50" cy="60" rx="20" ry="14" fill="#FFFBEB" />
            {/* Glasses */}
            <Circle cx="39" cy="47" r="9.5" fill="#FFFFFF" stroke="#39245F" strokeWidth="2.5" />
            <Circle cx="61" cy="47" r="9.5" fill="#FFFFFF" stroke="#39245F" strokeWidth="2.5" />
            <Path d="M48.5 47 L51.5 47" stroke="#39245F" strokeWidth="2.5" />
            {renderEyes()}
            {renderMouth()}
          </Svg>
        );
      case 'echo':
        // Auditory Explorer: Sky-Blue Bunny with Headphones
        return (
          <Svg width={size} height={size} viewBox="0 0 100 100">
            <Circle cx="50" cy="54" r="40" fill="#DBEAFE" />
            {/* Bunny Ears */}
            <Ellipse cx="36" cy="22" rx="7" ry="17" fill="#3B82F6" />
            <Ellipse cx="36" cy="22" rx="3.5" ry="12" fill="#93C5FD" />
            <Ellipse cx="64" cy="22" rx="7" ry="17" fill="#3B82F6" />
            <Ellipse cx="64" cy="22" rx="3.5" ry="12" fill="#93C5FD" />
            {/* Head */}
            <Ellipse cx="50" cy="54" rx="28" ry="24" fill="#3B82F6" />
            <Ellipse cx="50" cy="60" rx="19" ry="14" fill="#EFF6FF" />
            {/* Headphones */}
            <Path d="M20 52 C20 26, 80 26, 80 52" stroke="#39245F" strokeWidth="4.5" fill="none" />
            <Rect x="14" y="45" width="10" height="18" rx="5" fill="#7041C6" />
            <Rect x="76" y="45" width="10" height="18" rx="5" fill="#7041C6" />
            {renderEyes()}
            {renderMouth()}
          </Svg>
        );
      case 'winky':
        // Read/Write Explorer: Emerald Green Owl with Book
        return (
          <Svg width={size} height={size} viewBox="0 0 100 100">
            <Circle cx="50" cy="54" r="40" fill="#DCFCE7" />
            {/* Owl Ear Tufts */}
            <Polygon points="25,35 30,18 40,30" fill="#16A34A" />
            <Polygon points="75,35 70,18 60,30" fill="#16A34A" />
            <Ellipse cx="50" cy="54" rx="29" ry="26" fill="#22C55E" />
            {/* Eye circles */}
            <Circle cx="39" cy="47" r="10" fill="#FFFFFF" />
            <Circle cx="61" cy="47" r="10" fill="#FFFFFF" />
            {/* Beak */}
            <Polygon points="47,52 53,52 50,58" fill="#F59E0B" />
            {renderEyes()}
            {renderMouth()}
            {/* Little Book */}
            <Rect x="36" y="74" width="28" height="14" rx="3" fill="#7041C6" />
            <Path d="M50 74 L50 88" stroke="#FFFFFF" strokeWidth="2" />
          </Svg>
        );
      case 'bouncy':
      default:
        // Kinesthetic Explorer: Cyan Playful Elephant
        return (
          <Svg width={size} height={size} viewBox="0 0 100 100">
            <Circle cx="50" cy="54" r="40" fill="#CFFAFE" />
            {/* Big Ears */}
            <Ellipse cx="20" cy="52" rx="13" ry="18" fill="#06B6D4" />
            <Ellipse cx="20" cy="52" rx="8" ry="12" fill="#A5F3FC" />
            <Ellipse cx="80" cy="52" rx="13" ry="18" fill="#06B6D4" />
            <Ellipse cx="80" cy="52" rx="8" ry="12" fill="#A5F3FC" />
            {/* Head */}
            <Circle cx="50" cy="52" r="26" fill="#06B6D4" />
            <Ellipse cx="50" cy="58" rx="17" ry="13" fill="#ECFEFF" />
            {/* Cute Trunk */}
            <Path d="M47 55 Q46 70 55 72" stroke="#0891B2" strokeWidth="6" fill="none" strokeLinecap="round" />
            {renderEyes()}
            {renderMouth()}
          </Svg>
        );
    }
  };

  return (
    <View style={styles.wrapper}>
      {speechBubble ? (
        <View style={[styles.bubble, { borderColor: meta.primaryColor }]}>
          <Text style={styles.bubbleText}>{speechBubble}</Text>
        </View>
      ) : null}
      <View style={styles.svgContainer}>{renderCharacter()}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  svgContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 6,
    maxWidth: 230,
    shadowColor: '#39245F',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  bubbleText: {
    color: '#24163D',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
