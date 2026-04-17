// dark-themed loading state for the globe view
// pulsing ring animation with status text

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  withSequence,
} from 'react-native-reanimated';
import { Palette, FontSize, FontWeight, Spacing } from '@/constants/theme';

interface GlobeLoaderProps {
  message?: string;
}

export default function GlobeLoader({ message = 'Loading validators...' }: GlobeLoaderProps) {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0.3);
  const rotation = useSharedValue(0);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.8, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );

    opacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );

    rotation.value = withRepeat(
      withTiming(360, { duration: 3000, easing: Easing.linear }),
      -1,
    );
  }, [scale, opacity, rotation]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }));

  const dotStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.container}>
      {/* outer rotating ring */}
      <Animated.View style={[styles.ring, ringStyle]}>
        {/* ring is rendered via border */}
      </Animated.View>

      {/* center glow dot */}
      <Animated.View style={[styles.dot, dotStyle]} />

      {/* status text */}
      <Animated.Text style={[styles.text, { opacity }]}>
        {message}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Palette.void,
  },
  ring: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: Palette.cyan,
    borderTopColor: 'transparent',
    position: 'absolute',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Palette.cyan,
    position: 'absolute',
  },
  text: {
    marginTop: 70,
    color: Palette.silver,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
