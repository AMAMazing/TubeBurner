import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Calendar, TrendingDown, Target, Zap, CircleCheck, TriangleAlert } from 'lucide-react-native';
import { EngineResult, BurnConfig } from '../types';
import { formatDateString } from '../services/engine';

interface PacingProgressProps {
  engine: EngineResult;
  config: BurnConfig;
}

export const PacingProgress: React.FC<PacingProgressProps> = ({ engine, config }) => {
  const completionDateText = formatDateString(engine.projectedCompletionDate);
  const rateLabel = config.mode === 'daily' ? `${config.burnRate}/day` : `${config.burnRate}/wk`;
  const requiredRateLabel =
    config.mode === 'daily'
      ? `${engine.requiredRateForTargetYear}/day`
      : `${engine.requiredRateForTargetYear}/wk`;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Text style={styles.sectionTitle}>Pacing & Burn Progress</Text>
          <Text style={styles.sectionSubtitle}>
            Tracked toward target deadline: Dec 31, {config.targetYear}
          </Text>
        </View>
        <View style={styles.percentBadge}>
          <Text style={styles.percentText}>{engine.percentBurned}%</Text>
          <Text style={styles.percentSub}>BURNED</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarBackground}>
        <View style={[styles.progressBarFill, { width: `${engine.percentBurned}%` }]} />
      </View>
      <View style={styles.progressLabelRow}>
        <Text style={styles.progressLabel}>Start: {engine.startCount} videos</Text>
        <Text style={styles.progressLabel}>Goal: 0 videos</Text>
      </View>

      {/* 4 Metric Pills */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <View style={styles.metricIconRow}>
            <TrendingDown size={14} color="#a1a1aa" />
            <Text style={styles.metricLabel}>Current Count</Text>
          </View>
          <Text style={styles.metricValue}>{engine.currentCount}</Text>
          <Text style={styles.metricHint}>in playlist</Text>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricIconRow}>
            <Target size={14} color="#a1a1aa" />
            <Text style={styles.metricLabel}>Target Ceiling</Text>
          </View>
          <Text style={[styles.metricValue, { color: '#38bdf8' }]}>{engine.targetCount}</Text>
          <Text style={styles.metricHint}>allowed today</Text>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricIconRow}>
            <Zap size={14} color="#a1a1aa" />
            <Text style={styles.metricLabel}>Burn Rate</Text>
          </View>
          <Text style={[styles.metricValue, { color: '#fbbf24' }]}>{rateLabel}</Text>
          <Text style={styles.metricHint}>{config.mode === 'daily' ? 'Daily descent' : 'Weekly sprint'}</Text>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricIconRow}>
            <Calendar size={14} color="#a1a1aa" />
            <Text style={styles.metricLabel}>Est. Finish</Text>
          </View>
          <Text style={[styles.metricValue, { fontSize: 15 }]}>{completionDateText}</Text>
          <Text style={styles.metricHint}>at current rate</Text>
        </View>
      </View>

      {/* Mid-Week Pacing Guide (Weekly Mode) */}
      {config.mode === 'weekly' && (
        <View style={styles.weeklyPaceBox}>
          <View style={styles.weeklyPaceRow}>
            <Text style={styles.weeklyPaceTitle}>Today's Sprint Mid-Pace:</Text>
            <View
              style={[
                styles.pacingPill,
                engine.pacingStatus === 'Ahead of Pace'
                  ? styles.pacingPillAhead
                  : engine.pacingStatus === 'On Track'
                  ? styles.pacingPillTrack
                  : styles.pacingPillBehind,
              ]}
            >
              <Text
                style={[
                  styles.pacingPillText,
                  engine.pacingStatus === 'Ahead of Pace'
                    ? styles.pacingTextAhead
                    : engine.pacingStatus === 'On Track'
                    ? styles.pacingTextTrack
                    : styles.pacingTextBehind,
                ]}
              >
                {engine.pacingStatus}
              </Text>
            </View>
          </View>
          <Text style={styles.weeklyPaceDescription}>
            Day {engine.daysIntoCurrentWeek + 1} of 7 in Sprint #{engine.weeksElapsed + 1}. Aim for{' '}
            <Text style={styles.boldWhite}>{engine.dailyPacingGuide} videos</Text> today to maintain
            an even weekly cadence.
          </Text>
        </View>
      )}

      {/* Target Year Feasibility Banner */}
      <View
        style={[
          styles.feasibilityBanner,
          engine.willFinishByTargetYear ? styles.feasibilitySuccess : styles.feasibilityWarning,
        ]}
      >
        <View style={styles.feasibilityIconRow}>
          {engine.willFinishByTargetYear ? (
            <CircleCheck size={18} color="#10b981" />
          ) : (
            <TriangleAlert size={18} color="#f59e0b" />
          )}
          <Text
            style={[
              styles.feasibilityTitle,
              engine.willFinishByTargetYear
                ? styles.feasibilityTitleSuccess
                : styles.feasibilityTitleWarning,
            ]}
          >
            {engine.willFinishByTargetYear
              ? `On track to finish before Dec 31, ${config.targetYear}!`
              : `At risk of missing ${config.targetYear} completion target`}
          </Text>
        </View>
        <Text style={styles.feasibilityBody}>
          {engine.willFinishByTargetYear
            ? `At ${rateLabel}, you are projected to reach 0 videos by ${completionDateText}. Keep up the great pace!`
            : `Projected finish is ${completionDateText}. Increase your burn rate to ${requiredRateLabel} to reach 0 by the end of ${config.targetYear}.`}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#18181b',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#27272a',
    marginVertical: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  titleGroup: {
    flex: 1,
  },
  sectionTitle: {
    color: '#f4f4f5',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    color: '#71717a',
    fontSize: 12,
    marginTop: 2,
  },
  percentBadge: {
    alignItems: 'flex-end',
    backgroundColor: '#27272a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  percentText: {
    color: '#10b981',
    fontSize: 18,
    fontWeight: '800',
  },
  percentSub: {
    color: '#a1a1aa',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  progressBarBackground: {
    height: 10,
    backgroundColor: '#27272a',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 5,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  progressLabel: {
    color: '#71717a',
    fontSize: 11,
    fontWeight: '500',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    minWidth: 130,
    backgroundColor: '#27272a',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  metricIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  metricLabel: {
    color: '#a1a1aa',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  metricValue: {
    color: '#f4f4f5',
    fontSize: 20,
    fontWeight: '800',
  },
  metricHint: {
    color: '#71717a',
    fontSize: 11,
    marginTop: 2,
  },
  weeklyPaceBox: {
    backgroundColor: '#27272a',
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#38bdf8',
  },
  weeklyPaceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    flexWrap: 'wrap',
    gap: 8,
  },
  weeklyPaceTitle: {
    color: '#f4f4f5',
    fontSize: 13,
    fontWeight: '600',
  },
  weeklyPaceDescription: {
    color: '#a1a1aa',
    fontSize: 12,
    lineHeight: 18,
  },
  boldWhite: {
    color: '#f4f4f5',
    fontWeight: '700',
  },
  pacingPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pacingPillAhead: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  pacingPillTrack: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  pacingPillBehind: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
  },
  pacingPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  pacingTextAhead: {
    color: '#34d399',
  },
  pacingTextTrack: {
    color: '#38bdf8',
  },
  pacingTextBehind: {
    color: '#fb7185',
  },
  feasibilityBanner: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
  },
  feasibilitySuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  feasibilityWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  feasibilityIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  feasibilityTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  feasibilityTitleSuccess: {
    color: '#10b981',
  },
  feasibilityTitleWarning: {
    color: '#f59e0b',
  },
  feasibilityBody: {
    color: '#d4d4d8',
    fontSize: 12,
    lineHeight: 18,
  },
});