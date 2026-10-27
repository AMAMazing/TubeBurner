import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Flame, RefreshCw, Settings } from 'lucide-react-native';
import { BurnConfig } from '../types';

interface HeaderProps {
  config: BurnConfig;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  lastSyncedText?: string;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  onRefresh,
  isRefreshing = false,
  lastSyncedText,
}) => {
  const router = useRouter();
  const pathname = usePathname();

  const isSettingsActive = pathname === '/settings';

  const badgeText =
    config.mode === 'daily'
      ? `Daily: ${config.burnRate}/day • Goal: ${config.targetYear}`
      : `Weekly: ${config.burnRate}/wk • Goal: ${config.targetYear}`;

  return (
    <View style={styles.headerContainer}>
      <View style={styles.headerContent}>
        <TouchableOpacity
          style={styles.brandRow}
          onPress={() => router.push('/')}
          activeOpacity={0.8}
        >
          <View style={styles.iconCircle}>
            <Flame size={22} color="#f97316" />
          </View>
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.brandTitle}>TubeBurner</Text>
              {config.demoMode && (
                <View style={styles.demoBadge}>
                  <Text style={styles.demoBadgeText}>DEMO</Text>
                </View>
              )}
            </View>
            <View style={styles.modeBadge}>
              <Text style={styles.modeBadgeText}>{badgeText}</Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.actionsRow}>
          {onRefresh && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onRefresh}
              disabled={isRefreshing}
              accessibilityLabel="Refresh Playlist Count"
            >
              {isRefreshing ? (
                <ActivityIndicator size="small" color="#a1a1aa" />
              ) : (
                <RefreshCw size={18} color="#a1a1aa" />
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.navButton, isSettingsActive && styles.navButtonActive]}
            onPress={() => router.push('/settings')}
            accessibilityLabel="Settings"
          >
            <Settings size={18} color={isSettingsActive ? '#38bdf8' : '#a1a1aa'} />
            <Text style={[styles.navButtonText, isSettingsActive && styles.navButtonTextActive]}>
              Config
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      {lastSyncedText ? (
        <View style={styles.syncMetaRow}>
          <Text style={styles.syncMetaText}>{lastSyncedText}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    width: '100%',
    backgroundColor: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  headerContent: {
    maxWidth: 960,
    width: '100%',
    marginHorizontal: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandTitle: {
    color: '#f4f4f5',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  demoBadge: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  demoBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  modeBadge: {
    marginTop: 2,
  },
  modeBadgeText: {
    color: '#a1a1aa',
    fontSize: 12,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  navButtonActive: {
    borderColor: '#3f3f46',
    backgroundColor: '#27272a',
  },
  navButtonText: {
    color: '#a1a1aa',
    fontSize: 13,
    fontWeight: '600',
  },
  navButtonTextActive: {
    color: '#f4f4f5',
  },
  syncMetaRow: {
    maxWidth: 960,
    width: '100%',
    marginHorizontal: 'auto',
    marginTop: 6,
    alignItems: 'flex-end',
  },
  syncMetaText: {
    color: '#71717a',
    fontSize: 11,
  },
});