import React from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { InterventionStage, PurchaseEvaluation } from '../hooks/use-purchase-intervention';

interface PurchaseInterventionModalProps {
  visible: boolean;
  stage: InterventionStage;
  evaluation: PurchaseEvaluation | null;
  onProceed: () => void;
  onWait: () => void;
  onClose: () => void;
}

const STEPS: { key: InterventionStage; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'behavior', label: 'Behavior Analysis', icon: 'analytics-outline' },
  { key: 'goal-impact', label: 'Goal Impact Analysis', icon: 'flag-outline' },
  { key: 'intervention', label: 'Intervention', icon: 'bulb-outline' },
  { key: 'decision', label: 'Decision', icon: 'checkmark-done-outline' },
];

const STAGE_ORDER: InterventionStage[] = ['behavior', 'goal-impact', 'intervention', 'decision'];

function stageIndex(stage: InterventionStage) {
  return STAGE_ORDER.indexOf(stage);
}

export function PurchaseInterventionModal({
  visible,
  stage,
  evaluation,
  onProceed,
  onWait,
  onClose,
}: PurchaseInterventionModalProps) {
  const currentIndex = stageIndex(stage);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Ionicons name="shield-checkmark" size={28} color="#00E5FF" />
            <Text style={styles.title}>FinZee AI is evaluating this purchase…</Text>
          </View>

          <View style={styles.steps}>
            {STEPS.map((step, idx) => {
              const isDone = currentIndex > idx;
              const isActive = currentIndex === idx;
              return (
                <View key={step.key} style={styles.stepRow}>
                  <View
                    style={[
                      styles.stepIcon,
                      isDone && styles.stepIconDone,
                      isActive && styles.stepIconActive,
                    ]}>
                    {isActive ? (
                      <ActivityIndicator size="small" color="#0D1117" />
                    ) : (
                      <Ionicons
                        name={isDone ? 'checkmark' : step.icon}
                        size={16}
                        color={isDone || isActive ? '#0D1117' : '#8B949E'}
                      />
                    )}
                  </View>
                  <Text style={[styles.stepLabel, (isDone || isActive) && styles.stepLabelActive]}>
                    {step.label}
                  </Text>
                </View>
              );
            })}
          </View>

          {evaluation && currentIndex >= 1 && (
            <View style={styles.resultBlock}>
              <Text style={styles.resultTitle}>Behavior Analysis</Text>
              <Text style={styles.resultText}>
                {evaluation.behavior.recentPurchaseCount} similar trades recently · activity{' '}
                {evaluation.behavior.categorySpendChange >= 0 ? '+' : ''}
                {evaluation.behavior.categorySpendChange}% vs. usual
              </Text>
            </View>
          )}

          {evaluation && currentIndex >= 2 && (
            <View style={styles.resultBlock}>
              <Text style={styles.resultTitle}>Goal Impact Analysis</Text>
              <Text style={styles.resultText}>
                Impact on "{evaluation.goalImpact.goalName}" ({evaluation.goalImpact.goalProgress}% funded)
                {evaluation.goalImpact.monthsDelayed > 0
                  ? ` — could delay it by ${evaluation.goalImpact.monthsDelayed} month${evaluation.goalImpact.monthsDelayed > 1 ? 's' : ''}.`
                  : ' — minimal impact.'}
              </Text>
            </View>
          )}

          {evaluation && currentIndex >= 3 && (
            <View
              style={[
                styles.resultBlock,
                evaluation.intervention.level === 'warning' && styles.interventionWarning,
                evaluation.intervention.level === 'caution' && styles.interventionCaution,
              ]}>
              <Text style={styles.resultTitle}>Intervention</Text>
              <Text style={styles.resultText}>{evaluation.intervention.message}</Text>
              <Text style={styles.suggestionText}>💡 {evaluation.intervention.suggestion}</Text>
            </View>
          )}

          {stage === 'decision' && evaluation && (
            <View style={styles.actions}>
              {evaluation.intervention.level !== 'none' ? (
                <>
                  <TouchableOpacity style={styles.primaryBtn} onPress={onWait}>
                    <Text style={styles.primaryBtnText}>Wait & Reconsider</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.secondaryBtn} onPress={onProceed}>
                    <Text style={styles.secondaryBtnText}>Proceed Anyway</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity style={styles.primaryBtn} onPress={onProceed}>
                  <Text style={styles.primaryBtnText}>Continue</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(13, 17, 23, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#161B22',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#30363D',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  title: {
    color: '#F0F6FC',
    fontSize: 16,
    fontWeight: '600',
    flexShrink: 1,
  },
  steps: {
    gap: 10,
    marginBottom: 16,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0D1117',
    borderWidth: 1,
    borderColor: '#30363D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIconDone: {
    backgroundColor: '#00FF88',
    borderColor: '#00FF88',
  },
  stepIconActive: {
    backgroundColor: '#00E5FF',
    borderColor: '#00E5FF',
  },
  stepLabel: {
    color: '#8B949E',
    fontSize: 14,
  },
  stepLabelActive: {
    color: '#F0F6FC',
    fontWeight: '500',
  },
  resultBlock: {
    backgroundColor: '#0D1117',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#30363D',
    padding: 12,
    marginBottom: 10,
  },
  interventionCaution: {
    borderColor: '#FFB800',
    backgroundColor: 'rgba(255, 184, 0, 0.08)',
  },
  interventionWarning: {
    borderColor: '#FF4444',
    backgroundColor: 'rgba(255, 68, 68, 0.08)',
  },
  resultTitle: {
    color: '#F0F6FC',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  resultText: {
    color: '#8B949E',
    fontSize: 13,
    lineHeight: 18,
  },
  suggestionText: {
    color: '#F0F6FC',
    fontSize: 13,
    marginTop: 6,
  },
  actions: {
    marginTop: 8,
    gap: 8,
  },
  primaryBtn: {
    backgroundColor: '#00E5FF',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#0D1117',
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#30363D',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#8B949E',
    fontWeight: '600',
    fontSize: 15,
  },
});
