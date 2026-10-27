import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { BurnConfig, EngineResult, PlaylistStatus } from '../types';
import { loadConfig, DEFAULT_CONFIG } from '../services/storage';
import { fetchPlaylistStatus } from '../services/youtube';
import { calculateEngineResult } from '../services/engine';
import { Header } from '../components/Header';
import { StatusCard } from '../components/StatusCard';
import { PacingProgress } from '../components/PacingProgress';

export default function DashboardScreen() {
  const [config, setConfig] = useState<BurnConfig>(DEFAULT_CONFIG);
  const [playlistStatus, setPlaylistStatus] = useState<PlaylistStatus>({
    count: 505,
    title: 'Burn Queue',
    lastFetched: Date.now(),
    isCached: false,
    error: null,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const refreshData = useCallback(async (currentConfig?: BurnConfig, force = false) => {
    const cfg = currentConfig || config;
    setIsRefreshing(true);
    try {
      const status = await fetchPlaylistStatus(cfg.playlistId || '', cfg.apiKey || '', {
        forceRefresh: force,
        demoMode: cfg.demoMode,
        demoCount: cfg.demoPlaylistCount ?? 505,
      });
      setPlaylistStatus(status);
    } catch (err) {
      console.error('Error fetching playlist status:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [config]);

  const loadAll = useCallback(async () => {
    try {
      const storedConfig = await loadConfig();
      setConfig(storedConfig);
      await refreshData(storedConfig, false);
    } finally {
      setIsInitialLoading(false);
    }
  }, [refreshData]);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll])
  );

  const engine: EngineResult = calculateEngineResult(config, playlistStatus.count);

  const lastSyncedDate = new Date(playlistStatus.lastFetched);
  const lastSyncedText = `Last synced: ${lastSyncedDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })}${playlistStatus.isCached ? ' (cached)' : ''}`;

  if (isInitialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#FFFFFF" />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Header
        config={config}
        onRefresh={() => refreshData(config, true)}
        isRefreshing={isRefreshing}
        lastSyncedText={lastSyncedText}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => refreshData(config, true)}
            tintColor="#FFFFFF"
          />
        }
      >
        <View style={styles.container}>
          {/* Minimalist Error Callout */}
          {playlistStatus.error && !config.demoMode && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorTitle}>Connection Notice</Text>
              <Text style={styles.errorMessage}>{playlistStatus.error}</Text>
            </View>
          )}

          {/* Primary Status Card */}
          <StatusCard
            engine={engine}
            playlistId={config.playlistId}
          />

          {/* Clean Pacing Metrics */}
          <PacingProgress engine={engine} config={config} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000000', // Deep Apple Black for maximum contrast and sleekness
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 60,
  },
  container: {
    maxWidth: 600, // Narrower max-width for a focused, clean layout
    width: '100%',
    marginHorizontal: 'auto',
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 24,
  },
  errorBanner: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)', // Glassmorphic red tint
    borderColor: 'rgba(255, 59, 48, 0.2)',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 16,
  },
  errorTitle: {
    color: '#FF453A',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  errorMessage: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: -0.1,
  },
});