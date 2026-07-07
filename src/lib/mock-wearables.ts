import { subDays, format, startOfDay, addHours } from "date-fns";

export interface HeartRateReading {
  timestamp: Date;
  bpm: number;
  zone: "rest" | "light" | "moderate" | "high" | "peak";
}

export interface SleepData {
  date: Date;
  duration: number; // hours
  quality: number; // 0-100
  deepSleep: number; // hours
  remSleep: number; // hours
  lightSleep: number; // hours
  awakeTime: number; // minutes
}

export interface StressReading {
  timestamp: Date;
  level: number; // 0-100
  category: "low" | "medium" | "high" | "very_high";
}

export interface ActivityData {
  date: Date;
  steps: number;
  calories: number;
  activeMinutes: number;
  distance: number; // km
}

export interface SpendingCorrelation {
  date: Date;
  stressLevel: number;
  sleepQuality: number;
  spendingAmount: number;
  category: string;
}

function getHeartRateZone(bpm: number): HeartRateReading["zone"] {
  if (bpm < 60) return "rest";
  if (bpm < 100) return "light";
  if (bpm < 140) return "moderate";
  if (bpm < 170) return "high";
  return "peak";
}

function getStressCategory(level: number): StressReading["category"] {
  if (level < 25) return "low";
  if (level < 50) return "medium";
  if (level < 75) return "high";
  return "very_high";
}

export function generateMockHeartRate(days: number = 7): HeartRateReading[] {
  const readings: HeartRateReading[] = [];
  const now = new Date();

  for (let d = 0; d < days; d++) {
    const day = subDays(now, d);
    // Generate readings every 30 minutes
    for (let h = 0; h < 24; h++) {
      const timestamp = addHours(startOfDay(day), h);
      // Simulate realistic heart rate patterns
      let baseBpm = 65;
      if (h >= 6 && h <= 8) baseBpm = 75; // Morning
      if (h >= 9 && h <= 17) baseBpm = 80; // Work hours
      if (h >= 18 && h <= 20) baseBpm = 90; // Evening activity
      if (h >= 22 || h <= 5) baseBpm = 58; // Sleep

      const bpm = Math.round(baseBpm + (Math.random() - 0.5) * 20);
      readings.push({
        timestamp,
        bpm,
        zone: getHeartRateZone(bpm),
      });
    }
  }

  return readings.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

export function generateMockSleep(days: number = 14): SleepData[] {
  const data: SleepData[] = [];

  for (let d = 1; d <= days; d++) {
    const date = subDays(new Date(), d);
    const duration = 5.5 + Math.random() * 3; // 5.5-8.5 hours
    const quality = Math.round(50 + Math.random() * 50); // 50-100

    data.push({
      date,
      duration: Math.round(duration * 10) / 10,
      quality,
      deepSleep: Math.round(duration * 0.2 * 10) / 10,
      remSleep: Math.round(duration * 0.25 * 10) / 10,
      lightSleep: Math.round(duration * 0.45 * 10) / 10,
      awakeTime: Math.round(10 + Math.random() * 30),
    });
  }

  return data.sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function generateMockStress(days: number = 7): StressReading[] {
  const readings: StressReading[] = [];
  const now = new Date();

  for (let d = 0; d < days; d++) {
    const day = subDays(now, d);
    // Generate readings every 2 hours
    for (let h = 6; h < 23; h += 2) {
      const timestamp = addHours(startOfDay(day), h);
      // Simulate stress patterns - higher during work hours
      let baseStress = 30;
      if (h >= 9 && h <= 12) baseStress = 55; // Morning work
      if (h >= 14 && h <= 17) baseStress = 60; // Afternoon work
      if (h >= 18) baseStress = 35; // Evening

      const level = Math.round(Math.max(0, Math.min(100, baseStress + (Math.random() - 0.5) * 40)));
      readings.push({
        timestamp,
        level,
        category: getStressCategory(level),
      });
    }
  }

  return readings.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

export function generateMockActivity(days: number = 14): ActivityData[] {
  const data: ActivityData[] = [];

  for (let d = 1; d <= days; d++) {
    const date = subDays(new Date(), d);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const baseSteps = isWeekend ? 8000 : 6000;

    const steps = Math.round(baseSteps + (Math.random() - 0.3) * 6000);
    data.push({
      date,
      steps: Math.max(2000, steps),
      calories: Math.round(steps * 0.04 + 1800),
      activeMinutes: Math.round(steps / 100),
      distance: Math.round((steps / 1300) * 10) / 10,
    });
  }

  return data.sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function generateSpendingCorrelations(days: number = 14): SpendingCorrelation[] {
  const categories = ["Food & Dining", "Shopping", "Entertainment", "Transport", "Groceries"];
  const data: SpendingCorrelation[] = [];

  for (let d = 1; d <= days; d++) {
    const date = subDays(new Date(), d);
    const stressLevel = Math.round(30 + Math.random() * 50);
    const sleepQuality = Math.round(50 + Math.random() * 50);

    // Higher stress = more impulsive spending
    // Lower sleep quality = more comfort spending
    const stressMultiplier = 1 + (stressLevel - 50) / 100;
    const sleepMultiplier = 1 + (100 - sleepQuality) / 200;

    const baseSpending = 20 + Math.random() * 80;
    const spendingAmount = Math.round(baseSpending * stressMultiplier * sleepMultiplier * 100) / 100;

    data.push({
      date,
      stressLevel,
      sleepQuality,
      spendingAmount,
      category: categories[Math.floor(Math.random() * categories.length)],
    });
  }

  return data.sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function getWearableSummary() {
  const heartRate = generateMockHeartRate(1);
  const sleep = generateMockSleep(1)[0];
  const stress = generateMockStress(1);
  const activity = generateMockActivity(1)[0];

  const avgHeartRate = Math.round(
    heartRate.reduce((sum, r) => sum + r.bpm, 0) / heartRate.length
  );
  const avgStress = Math.round(
    stress.reduce((sum, r) => sum + r.level, 0) / stress.length
  );

  return {
    currentHeartRate: heartRate[heartRate.length - 1]?.bpm || 72,
    avgHeartRate,
    sleepHours: sleep?.duration || 7.2,
    sleepQuality: sleep?.quality || 78,
    stressLevel: avgStress,
    steps: activity?.steps || 7500,
    calories: activity?.calories || 2100,
  };
}
