// FinZee AI™ — AI Coach Screen
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Animated, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Shadow, Radius, Gradients } from '../../constants/theme';
import FinZeeLogo from '../../components/FinZeeLogo';
import { useAuth } from '../../hooks/useAuth';
import { CONFIG } from '../../constants/config';
import type { AICoachResponse } from '../../types';

interface Message { id: string; role: 'ai' | 'user'; text: string; ts: Date; }

const QUICK_PROMPTS = [
  'Am I on track for my house goal?', 'Why did my score dip?', 'Help me stop impulse spending',
  "What should I do today?", 'How does my sleep affect spending?', 'Review my week with me',
];

const DEV_RESPONSES = [
  "You're on track for your house down payment — at your current rate you'll reach $60k by late 2027. Want me to model a faster path?",
  "Your score dipped because of Tuesday's stress spend and below-average sleep (6.2 hrs). One more impulse purchase would push you below 70.",
  "Best move today: pause any non-essential purchase over $50. You're at 78% of your discretionary budget with 19 days left in June.",
  "Your sleep data shows 6.2 hrs last night. On low-sleep days your discretionary spend is 34% higher. Stay mindful today.",
  "For Japan — you need $1,500 more. At $300/month you're 5 months out. I can find $50/week in your current spend to get there faster.",
  "On days you hit 8,000+ steps, your impulse purchases drop by 62%. Your body and wallet are more connected than you think.",
];

export default function CoachScreen() {
  const { user } = useAuth();
  const scrollRef = useRef<ScrollView>(null);
  const [input, setInput]     = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping]   = useState(false);
  const dotAnim = useRef(new Animated.Value(0)).current;
  const firstName = user?.displayName?.split(' ')[0] || 'there';

  useEffect(() => {
    setMessages([{ id: '0', role: 'ai', text: `Hi ${firstName}! Your financial wellness score is 78 today — you're in great shape. I spotted a stress spend on Tuesday. What's on your mind?`, ts: new Date() }]);
  }, [firstName]);

  useEffect(() => {
    if (typing) {
      Animated.loop(Animated.sequence([
        Animated.timing(dotAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(dotAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ])).start();
    } else { dotAnim.setValue(0); }
  }, [typing]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || !user) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: trimmed, ts: new Date() };
    setMessages(prev => [...prev, userMsg]); setInput(''); setTyping(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    try {
      let aiText = '';
      if (CONFIG.DEV_MODE || !CONFIG.API_BASE_URL) {
        await new Promise(r => setTimeout(r, 1400));
        aiText = DEV_RESPONSES[Math.floor(Math.random() * DEV_RESPONSES.length)];
      } else {
        const res = await fetch(`${CONFIG.API_BASE_URL}/api/ai/coach`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userQuestion: trimmed, userId: user.id, spendingSummary: { discretionaryPct: 78, budgetRemaining: 1200 }, recentInsights: ['Stress spend on Tuesday', 'Sleep below 7hrs 3 nights this week'] }),
        });
        const data: AICoachResponse = await res.json();
        aiText = data.coachingResponse;
      }
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'ai', text: aiText, ts: new Date() }]);
    } catch {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'ai', text: "I'm having trouble connecting right now. Please try again in a moment.", ts: new Date() }]);
    } finally {
      setTyping(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.aiAvatar}><LinearGradient colors={Gradients.blue} style={styles.aiAvatarGrad}><Text style={{ fontSize: 18 }}>◈</Text></LinearGradient></View>
          <View><Text style={styles.headerName}>FinZee AI Coach</Text><Text style={styles.headerStatus}>● Online — always here</Text></View>
        </View>
        <FinZeeLogo variant="blue" width={80} />
      </View>

      <ScrollView ref={scrollRef} style={styles.messages} contentContainerStyle={styles.messagesContent} showsVerticalScrollIndicator={false} onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
        {messages.map(msg => (
          <View key={msg.id} style={[styles.msgRow, msg.role === 'user' ? styles.msgRowUser : styles.msgRowAi]}>
            {msg.role === 'ai' && <View style={styles.msgAiAvatar}><LinearGradient colors={Gradients.blue} style={styles.msgAiAvatarGrad}><Text style={{ fontSize: 12 }}>◈</Text></LinearGradient></View>}
            <View style={[styles.bubble, msg.role === 'ai' ? styles.bubbleAi : styles.bubbleUser]}>
              <Text style={[styles.bubbleText, msg.role === 'user' && { color: '#fff' }]}>{msg.text}</Text>
            </View>
          </View>
        ))}
        {typing && (
          <View style={styles.msgRowAi}>
            <View style={styles.msgAiAvatar}><LinearGradient colors={Gradients.blue} style={styles.msgAiAvatarGrad}><Text style={{ fontSize: 12 }}>◈</Text></LinearGradient></View>
            <View style={[styles.bubble, styles.bubbleAi, styles.typingBubble]}>
              {[0, 1, 2].map(i => <Animated.View key={i} style={[styles.typingDot, { opacity: dotAnim, transform: [{ scale: dotAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.2] }) }] }]} />)}
            </View>
          </View>
        )}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickScroll} contentContainerStyle={styles.quickContent}>
        {QUICK_PROMPTS.map(p => (
          <TouchableOpacity key={p} style={styles.quickChip} onPress={() => sendMessage(p)}>
            <Text style={styles.quickChipText}>{p}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.inputBar}>
        <TextInput style={styles.input} value={input} onChangeText={setInput} placeholder="Ask FinZee anything…" placeholderTextColor={Colors.mute2} returnKeyType="send" multiline onSubmitEditing={() => sendMessage(input)} />
        <TouchableOpacity style={[styles.sendBtn, !input.trim() && { opacity: 0.5 }]} onPress={() => sendMessage(input)} disabled={!input.trim()}>
          <LinearGradient colors={Gradients.blue} style={styles.sendBtnGrad}><Text style={styles.sendArrow}>›</Text></LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:            { flex: 1, backgroundColor: Colors.bg },
  header:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.surface, paddingTop: Platform.OS === 'ios' ? 56 : 20, paddingBottom: 14, paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: Colors.border2, ...Shadow.sm },
  headerLeft:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  aiAvatar:        { width: 40, height: 40, borderRadius: 20 },
  aiAvatarGrad:    { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerName:      { fontSize: 15, fontWeight: '800', color: Colors.ink, letterSpacing: -0.3 },
  headerStatus:    { fontSize: 11, fontWeight: '600', color: Colors.green, marginTop: 1 },
  messages:        { flex: 1 },
  messagesContent: { padding: 16, gap: 14, paddingBottom: 8 },
  msgRow:          { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  msgRowAi:        { justifyContent: 'flex-start' },
  msgRowUser:      { justifyContent: 'flex-end' },
  msgAiAvatar:     { width: 28, height: 28, borderRadius: 14, flexShrink: 0 },
  msgAiAvatarGrad: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  bubble:          { maxWidth: '78%', padding: 12, borderRadius: 18 },
  bubbleAi:        { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border2, borderBottomLeftRadius: 4, ...Shadow.sm },
  bubbleUser:      { backgroundColor: Colors.blue, borderBottomRightRadius: 4, ...Shadow.sm },
  bubbleText:      { fontSize: 13, color: Colors.ink, lineHeight: 20 },
  typingBubble:    { flexDirection: 'row', gap: 4, paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center' },
  typingDot:       { width: 6, height: 6, backgroundColor: Colors.mute2, borderRadius: 3 },
  quickScroll:     { flexShrink: 0, maxHeight: 44 },
  quickContent:    { paddingHorizontal: 14, paddingVertical: 6, gap: 6 },
  quickChip:       { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.full, paddingHorizontal: 14, paddingVertical: 7 },
  quickChipText:   { fontSize: 11, fontWeight: '700', color: Colors.ink3 },
  inputBar:        { flexDirection: 'row', gap: 8, alignItems: 'flex-end', padding: 12, paddingBottom: Platform.OS === 'ios' ? 28 : 14, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border2 },
  input:           { flex: 1, backgroundColor: Colors.bg, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: Colors.ink, maxHeight: 100 },
  sendBtn:         { width: 42, height: 42, borderRadius: 21, flexShrink: 0 },
  sendBtnGrad:     { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  sendArrow:       { color: '#fff', fontSize: 24, marginLeft: 2 },
});
