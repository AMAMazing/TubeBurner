import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Key, ListVideo, TriangleAlert, ShieldCheck, Check, Sparkles } from 'lucide-react-native';
import { BurnConfig, BurnMode } from '../types';
import { loadConfig, saveConfig, DEFAULT_CONFIG } from '../services/storage';
import { extractPlaylistId } from '../services/engine';

export default function SettingsScreen() {
  const router = useRouter();
  const [config, setConfig] = useState<BurnConfig>(DEFAULT_CONFIG);
  const [apiKey, setApiKey] = useState('');
  const [playlistInput, setPlaylistInput] = useState('');
  const [mode, setMode] = useState<BurnMode>('daily');
  const [burnRate, setBurnRate] = useState('10');
  const [targetYear, setTargetYear] = useState('2026');
  const [startCount, setStartCount] = useState('530');
  const [startDate, setStartDate] = useState('2026-01-01');
  const [demoMode, setDemoMode] = useState(true);
  const [isSavedNotice, setIsSavedNotice] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const stored = await loadConfig();
      setConfig(stored);
      setApiKey(stored.apiKey || '');
      setPlaylistInput(stored.playlistId || '');
      setMode(stored.mode || 'daily');
      setBurnRate((stored.burnRate ?? 10).toString());
      setTargetYear((stored.targetYear ?? 2026).toString());
      setStartCount((stored.startCount ?? 530).toString());
      setStartDate(stored.startDate ?? '2026-01-01');
      setDemoMode(!!stored.demoMode);
      setIsLoading(false);
    }
    init();
  }, []);

  const handlePlaylistInputChange = (text: string) => {
    setPlaylistInput(text);
  };

  const handleSave = async () => {
    const cleanId = extractPlaylistId(playlistInput);
    const parsedRate = Math.max(1, parseInt(burnRate, 10) || 10);
    const parsedYear = parseInt(targetYear, 10) || 2026;
    const parsedStartCount = Math.max(0, parseInt(startCount, 10) || 0);

    const updated: BurnConfig = {
      ...config,
      apiKey: (apiKey || '').trim(),
      playlistId: cleanId,
      mode,
      burnRate: parsedRate,
      targetYear: parsedYear,
      startCount: parsedStartCount,
      startDate: (startDate || '').trim() || new Date().toISOString().split('T')[0],
      demoMode,
    };

    await saveConfig(updated);
    setConfig(updated);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 2500);
  };

  const handleResetBaselineToToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setStartDate(today);
  };

  const handleLoadDemoMode = async () => {
    setDemoMode(true);
    setStartCount('530');
    setStartDate('2026-01-01');
    setTargetYear('2026');
    setBurnRate('10');
    setMode('daily');

    const updated: BurnConfig = {
      ...config,
      demoMode: true,
      demoPlaylistCount: 505,
      startCount: 530,
      startDate: '2026-01-01',
      targetYear: 2026,
      burnRate: 10,
      mode: 'daily',
    };
    await saveConfig(updated);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 2500);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <ArrowLeft size={18} color="#f4f4f5" />
          <Text style={styles.backButtonText}>Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Configuration</Text>
        <TouchableOpacity
          style={styles.saveHeaderButton}
          onPress={handleSave}
          activeOpacity={0.8}
        >
          <Check size={16} color="#ffffff" />
          <Text style={styles.saveHeaderText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          {isSavedNotice && (
            <View style={styles.savedBanner}>
              <Check size={16} color="#10b981" />
              <Text style={styles.savedBannerText}>Configuration saved successfully!</Text>
            </View>
          )}

          {/* Quick Demo Mode Card */}
          <View style={styles.sectionCard}>
            <View style={styles.cardHeader}>
              <Sparkles size={18} color="#3b82f6" />
              <Text style={styles.cardTitle}>Interactive Demo Mode</Text>
            </View>
            <Text style={styles.cardSubtitle}>
              Test TubeBurner instantly without needing your own YouTube API key.
            </Text>
            <View style={styles.demoActionRow}>
              <TouchableOpacity
                style={[
                  styles.toggleBtn,
                  demoMode ? styles.toggleBtnActive : styles.toggleBtnInactive,
                ]}
                onPress={() => setDemoMode(!demoMode)}
              >
                <Text style={styles.toggleBtnText}>
                  {demoMode ? 'Demo Mode: ON' : 'Demo Mode: OFF'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.resetDemoBtn}
                onPress={handleLoadDemoMode}
              >
                <Text style={styles.resetDemoText}>Load Preset Demo</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* YouTube Connection Section */}
          <View style={styles.sectionCard}>
            <View style={styles.cardHeader}>
              <Key size={18} color="#f97316" />
              <Text style={styles.cardTitle}>YouTube API v3 Connection</Text>
            </View>

            {/* API Key */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>YouTube Data API Key</Text>
              <TextInput
                style={styles.textInput}
                value={apiKey}
                onChangeText={setApiKey}
                placeholder="AIzaSy..."
                placeholderTextColor="#52525b"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <View style={styles.privacyNoteRow}>
                <ShieldCheck size={14} color="#10b981" />
                <Text style={styles.privacyNoteText}>
                  Stored 100% locally in your browser storage. Never sent to any third-party server.
                </Text>
              </View>
            </View>

            {/* Playlist ID */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Playlist ID or Full URL</Text>
              <TextInput
                style={styles.textInput}
                value={playlistInput}
                onChangeText={handlePlaylistInputChange}
                placeholder="PLxxxxxx or https://www.youtube.com/playlist?list=..."
                placeholderTextColor="#52525b"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={styles.inputHint}>
                Paste either the raw playlist ID (e.g. PLrAXtmErZgOdP...) or full YouTube URL.
              </Text>
            </View>

            {/* Critical UX Helper Warning */}
            <View style={styles.warningBox}>
              <View style={styles.warningHeaderRow}>
                <TriangleAlert size={16} color="#f59e0b" />
                <Text style={styles.warningTitle}>Watch Later (WL) Limitation</Text>
              </View>
              <Text style={styles.warningBody}>
                Important: Your playlist must be set to <Text style={styles.boldWhite}>Unlisted</Text> or{' '}
                <Text style={styles.boldWhite}>Public</Text>. YouTube's native 'Watch Later' (`WL`)
                playlist is strictly blocked by Google's official API. Create a custom playlist
                (e.g., 'Burn Queue') instead and add your videos there.
              </Text>
            </View>
          </View>

          {/* Pacing & Goal Section */}
          <View style={styles.sectionCard}>
            <View style={styles.cardHeader}>
              <ListVideo size={18} color="#38bdf8" />
              <Text style={styles.cardTitle}>Pacing & Cadence Engine</Text>
            </View>

            {/* Burn Mode Segmented Control */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Burn Cadence Mode</Text>
              <View style={styles.segmentedRow}>
                <TouchableOpacity
                  style={[
                    styles.segmentBtn,
                    mode === 'daily' && styles.segmentBtnActive,
                  ]}
                  onPress={() => setMode('daily')}
                >
                  <Text
                    style={[
                      styles.segmentBtnText,
                      mode === 'daily' && styles.segmentBtnTextActive,
                    ]}
                  >
                    Daily Burn (X / day)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.segmentBtn,
                    mode === 'weekly' && styles.segmentBtnActive,
                  ]}
                  onPress={() => setMode('weekly')}
                >
                  <Text
                    style={[
                      styles.segmentBtnText,
                      mode === 'weekly' && styles.segmentBtnTextActive,
                    ]}
                  >
                    Weekly Sprint (X / week)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Burn Rate */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {mode === 'daily' ? 'Daily Burn Rate (videos / day)' : 'Weekly Sprint Rate (videos / week)'}
              </Text>
              <TextInput
                style={styles.textInput}
                value={burnRate}
                onChangeText={setBurnRate}
                keyboardType="numeric"
                placeholder={mode === 'daily' ? '10' : '50'}
                placeholderTextColor="#52525b"
              />
            </View>

            {/* Target Completion Year */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Target Completion Year</Text>
              <View style={styles.yearPillsRow}>
                {['2026', '2027', '2028'].map((year) => (
                  <TouchableOpacity
                    key={year}
                    style={[
                      styles.yearPill,
                      targetYear === year && styles.yearPillActive,
                    ]}
                    onPress={() => setTargetYear(year)}
                  >
                    <Text
                      style={[
                        styles.yearPillText,
                        targetYear === year && styles.yearPillTextActive,
                      ]}
                    >
                      {year}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Starting Baseline */}
            <View style={styles.baselineGrid}>
              <View style={styles.baselineInputCol}>
                <Text style={styles.inputLabel}>Start Count</Text>
                <TextInput
                  style={styles.textInput}
                  value={startCount}
                  onChangeText={setStartCount}
                  keyboardType="numeric"
                  placeholder="530"
                  placeholderTextColor="#52525b"
                />
              </View>

              <View style={styles.baselineInputCol}>
                <Text style={styles.inputLabel}>Start Date (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.textInput}
                  value={startDate}
                  onChangeText={setStartDate}
                  placeholder="2026-01-01"
                  placeholderTextColor="#52525b"
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.resetBaselineBtn}
              onPress={handleResetBaselineToToday}
            >
              <Text style={styles.resetBaselineText}>
                Reset Start Baseline Date to Today
              </Text>
            </TouchableOpacity>
          </View>

          {/* Save Action */}
          <TouchableOpacity
            style={styles.saveBigButton}
            onPress={handleSave}
            activeOpacity={0.8}
          >
            <Check size={20} color="#ffffff" />
            <Text style={styles.saveBigButtonText}>Save Configuration</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#09090b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#09090b',
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backButtonText: {
    color: '#f4f4f5',
    fontSize: 14,
    fontWeight: '600',
  },
  topBarTitle: {
    color: '#f4f4f5',
    fontSize: 16,
    fontWeight: '700',
  },
  saveHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  saveHeaderText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  container: {
    maxWidth: 720,
    width: '100%',
    marginHorizontal: 'auto',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },
  savedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10b981',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  savedBannerText: {
    color: '#34d399',
    fontSize: 13,
    fontWeight: '600',
  },
  sectionCard: {
    backgroundColor: '#18181b',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  cardTitle: {
    color: '#f4f4f5',
    fontSize: 16,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: '#71717a',
    fontSize: 12,
    marginBottom: 16,
  },
  demoActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  toggleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  toggleBtnActive: {
    backgroundColor: '#1e3a8a',
    borderColor: '#3b82f6',
  },
  toggleBtnInactive: {
    backgroundColor: '#27272a',
    borderColor: '#3f3f46',
  },
  toggleBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  resetDemoBtn: {
    backgroundColor: '#27272a',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  resetDemoText: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: '#e4e4e7',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#27272a',
    borderColor: '#3f3f46',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#f4f4f5',
    fontSize: 14,
  },
  inputHint: {
    color: '#71717a',
    fontSize: 11,
    marginTop: 4,
  },
  privacyNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  privacyNoteText: {
    color: '#10b981',
    fontSize: 11,
    flex: 1,
  },
  warningBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 6,
  },
  warningHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  warningTitle: {
    color: '#f59e0b',
    fontSize: 12,
    fontWeight: '700',
  },
  warningBody: {
    color: '#d4d4d8',
    fontSize: 12,
    lineHeight: 18,
  },
  boldWhite: {
    color: '#f4f4f5',
    fontWeight: '700',
  },
  segmentedRow: {
    flexDirection: 'row',
    gap: 8,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
    alignItems: 'center',
  },
  segmentBtnActive: {
    backgroundColor: '#f97316',
    borderColor: '#ea580c',
  },
  segmentBtnText: {
    color: '#a1a1aa',
    fontSize: 13,
    fontWeight: '600',
  },
  segmentBtnTextActive: {
    color: '#ffffff',
  },
  yearPillsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  yearPill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  yearPillActive: {
    backgroundColor: '#38bdf8',
    borderColor: '#0284c7',
  },
  yearPillText: {
    color: '#a1a1aa',
    fontSize: 13,
    fontWeight: '700',
  },
  yearPillTextActive: {
    color: '#09090b',
  },
  baselineGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  baselineInputCol: {
    flex: 1,
  },
  resetBaselineBtn: {
    backgroundColor: '#27272a',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetBaselineText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '600',
  },
  saveBigButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 8,
  },
  saveBigButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
});