import { Palette } from '@/constants/theme';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export function TabBarBackground() {
  const R = 28; // Radius of the concave corner

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Base background of the tab bar, shifted down by R */}
      <View style={{ position: 'absolute', top: R, left: 0, right: 0, bottom: 0, backgroundColor: Palette.graphite }} />
      
      {/* Left concave horn (now inside bounds, top: 0) */}
      <View style={{ position: 'absolute', top: 0, left: 0, width: R, height: R }}>
        <Svg width={R} height={R} viewBox={`0 0 ${R} ${R}`}>
          <Path 
            d={`M 0 0 A ${R} ${R} 0 0 0 ${R} ${R} L 0 ${R} Z`} 
            fill={Palette.graphite} 
          />
        </Svg>
      </View>

      {/* Right concave horn (now inside bounds, top: 0) */}
      <View style={{ position: 'absolute', top: 0, right: 0, width: R, height: R }}>
        <Svg width={R} height={R} viewBox={`0 0 ${R} ${R}`}>
          <Path 
            d={`M ${R} 0 A ${R} ${R} 0 0 1 0 ${R} L ${R} ${R} Z`} 
            fill={Palette.graphite} 
          />
        </Svg>
      </View>
    </View>
  );
}
