import React from 'react';
import Svg, { Path, Circle, Rect, Text as SvgText } from 'react-native-svg';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../constants/theme';

interface FinZeeLogoProps {
  variant?: 'light' | 'dark' | 'blue';
  width?: number;
}

export default function FinZeeLogo({ variant = 'dark', width = 180 }: FinZeeLogoProps) {
  const letterColor =
    variant === 'light' ? '#ffffff' :
    variant === 'blue'  ? Colors.blue :
    Colors.ink;

  const aiColor = Colors.blue;
  const ratio   = 340 / 72;
  const height  = width / ratio;

  return (
    <View style={styles.wrap}>
      <Svg width={width} height={height} viewBox="0 0 340 72" fill="none">
        <Path d="M8 14 C8 9 11 6 16 6 L16 13 C13 13 14 15 14 18 L14 30 L23 30 L23 37 L14 37 L14 62 L8 62 Z" fill={letterColor} />
        <Circle cx="36" cy="9" r="4.5" fill={letterColor} />
        <Rect x="32.5" y="18" width="7" height="44" rx="3.5" fill={letterColor} />
        <Path d="M50 62 L50 18 L57 18 L57 25 C60 19 65 16 72 16 C80 16 86 22 86 31 L86 62 L79 62 L79 33 C79 28 76 24 71 24 C66 24 57 28 57 37 L57 62 Z" fill={letterColor} />
        <Path d="M96 18 L124 18 L124 25 L106 54 L124 54 L124 62 L94 62 L94 55 L112 26 L96 26 Z" fill={letterColor} />
        <Path d="M132 39 C132 26 139 15 150 15 C161 15 168 25 168 38 L168 43 L139 43 C140 51 143 56 150 56 C155 56 158 53 160 50 L167 54 C163 60 157 63 150 63 C139 63 132 52 132 39 Z M139 37 L161 37 C160 31 157 22 150 22 C143 22 140 30 139 37 Z" fill={letterColor} />
        <Path d="M176 39 C176 26 183 15 194 15 C205 15 212 25 212 38 L212 43 L183 43 C184 51 187 56 194 56 C199 56 202 53 204 50 L211 54 C207 60 201 63 194 63 C183 63 176 52 176 39 Z M183 37 L205 37 C204 31 201 22 194 22 C187 22 184 30 183 37 Z" fill={letterColor} />
        <Path d="M228 62 L241 15 L249 15 L262 62 L255 62 L245 27 L235 62 Z" fill={aiColor} />
        <Rect x="232" y="46" width="26" height="7" fill={aiColor} />
        <Rect x="268" y="15" width="7" height="47" rx="3" fill={aiColor} />
        <SvgText x="279" y="22" fontSize="10" fill={aiColor} fontWeight="700">TM</SvgText>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
});
