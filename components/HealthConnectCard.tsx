import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useHealth } from '../hooks/use-health';

export function HealthConnectCard() {
  const { isSupported, status, snapshot, error, connect, disconnect, providerName } = useHealth();

  if (!isSupported) {
    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Ionicons name="heart-outline" size={24} color="#8B949E" />
          <Text style={styles.title}>Health Data</Text>
        </View>
        <Text style={styles.helperText}>
          Apple Health (iOS) and Health Connect (Android) are only available in a development or production
          build — not Expo Go.
        </Text>
      </View>
    );
  }

  if (status === 'disconnected' || status === 'error') {
    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Ionicons name="heart-outline" size={24} color="#FF4444" />
          <Text style={styles.title}>Connect {providerName}</Text>
        </View>
        <Text style={styles.helperText}>
          Link {providerName} so FinZee AI can factor your activity, sleep, and stress signals into its coaching —
          like pausing to check in before a purchase when you've been running on empty.
        </Text>
        {error && <Text style={styles.errorText}>{error}</Text>}
        <TouchableOpacity style={styles.connectBtn} onPress={connect}>
          <Ionicons name="link-outline" size={18} color="#0D1117" />
          <Text style={styles.connectBtnText}>Connect {providerName}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (status === 'connecting') {
    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <ActivityIndicator size="small" color="#00E5FF" />
          <Text style={styles.title}>Connecting to {providerName}…</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Ionicons name="heart" size={24} color="#FF4444" />
        <Text style={styles.title}>{providerName}</Text>
        <View style={styles.connectedPill}>
          <Text style={styles.connectedPillText}>Connected</Text>
        </View>
      </View>

      {snapshot ? (
        <View style={styles.metricsGrid}>
          <Metric icon="footsteps-outline" label="Steps today" value={snapshot.steps.toLocaleString()} />
          <Metric icon="flame-outline" label="Active energy" value={`${snapshot.activeEnergyBurned} kcal`} />
          <Metric
            icon="pulse-outline"
            label="Resting heart rate"
            value={snapshot.restingHeartRate ? `${snapshot.restingHeartRate} bpm` : '—'}
          />
          <Metric
            icon="moon-outline"
            label="Sleep last night"
            value={snapshot.sleepHours ? `${snapshot.sleepHours} hrs` : '—'}
          />
          <Metric icon="leaf-outline" label="Mindful minutes" value={`${snapshot.mindfulMinutes} min`} />
        </View>
      ) : (
        <Text style={styles.helperText}>No health data found for today yet.</Text>
      )}

      <TouchableOpacity style={styles.disconnectBtn} onPress={disconnect}>
        <Text style={styles.disconnectBtnText}>Disconnect</Text>
      </TouchableOpacity>
    </View>
  );
}

function Metric({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Ionicons name={icon} size={20} color="#00E5FF" />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#30363D',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  title: {
    color: '#F0F6FC',
    fontSize: 16,
    fontWeight: '600',
    flexShrink: 1,
  },
  connectedPill: {
    marginLeft: 'auto',
    backgroundColor: 'rgba(0, 255, 136, 0.12)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  connectedPillText: {
    color: '#00FF88',
    fontSize: 12,
    fontWeight: '600',
  },
  helperText: {
    color: '#8B949E',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  errorText: {
    color: '#FF4444',
    fontSize: 12,
    marginBottom: 8,
  },
  connectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#00E5FF',
    borderRadius: 10,
    paddingVertical: 12,
  },
  connectBtnText: {
    color: '#0D1117',
    fontWeight: '700',
    fontSize: 15,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metric: {
    width: '47%',
    backgroundColor: '#0D1117',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#30363D',
    padding: 12,
    alignItems: 'flex-start',
    gap: 6,
  },
  metricValue: {
    color: '#F0F6FC',
    fontSize: 16,
    fontWeight: '700',
  },
  metricLabel: {
    color: '#8B949E',
    fontSize: 12,
  },
  disconnectBtn: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  disconnectBtnText: {
    color: '#8B949E',
    fontWeight: '600',
    fontSize: 14,
  },
});
