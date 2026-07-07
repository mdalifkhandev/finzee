// FinZee AI™ — Splash / Entry Screen
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Colors, Typography } from '../constants/theme';
import FinZeeLogo from '../components/FinZeeLogo';
import { useAuth } from '../hooks/useAuth';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const { user, loading } = useAuth();
  const progressAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim  = useRef(new Animated.Value(0)).current;
  const taglineAnim  = useRef(new Animated.Value(0)).current;
  const glowAnim     = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    StatusBar.setBarStyle('light-content');
    Animated.timing(opacityAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.6, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
    Animated.timing(progressAnim, { toValue: 1, duration: 2600, useNativeDriver: false }).start();
    setTimeout(() => {
      Animated.timing(taglineAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    }, 400);
    const timer = setTimeout(() => {
      if (!loading) router.replace(user ? '/(tabs)/home' : '/login');
    }, 2800);
    return () => clearTimeout(timer);
  }, [loading, user]);

  const progressWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.dark} />
      <Animated.View style={[styles.glowCircle, { opacity: glowAnim }]} />
      <Animated.View style={[styles.content, { opacity: opacityAnim }]}>
        <View style={styles.emblem}>
          <LinearGradient colors={['#0d1226', '#1a2444']} style={styles.emblemInner}>
            <Text style={styles.emblemIcon}>◈</Text>
          </LinearGradient>
        </View>
        <FinZeeLogo variant="light" width={200} />
        <Animated.Text style={[styles.tagline, { opacity: taglineAnim }]}>
          Your AI-powered financial companion. Built to understand how you spend.
        </Animated.Text>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.dark, alignItems: 'center', justifyContent: 'center' },
  glowCircle:   { position: 'absolute', width: 320, height: 320, borderRadius: 160, backgroundColor: 'transparent', top: height * 0.5 - 220, left: width * 0.5 - 160, shadowColor: Colors.blue, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 80, elevation: 0 },
  content:      { alignItems: 'center', paddingHorizontal: 40 },
  emblem:       { width: 80, height: 80, borderRadius: 24, marginBottom: 22, shadowColor: Colors.blue, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 24, elevation: 0 },
  emblemInner:  { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  emblemIcon:   { fontSize: 36, color: '#60a5fa' },
  tagline:      { ...Typography.bodySm, color: 'rgba(255,255,255,0.42)', textAlign: 'center', letterSpacing: 0.3, lineHeight: 18, marginTop: 10, marginBottom: 38 },
  progressTrack:{ width: 52, height: 2, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 1, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 1, backgroundColor: '#60a5fa' },
});
