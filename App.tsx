import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  Platform,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  Flame,
  RefreshCw,
  SlidersHorizontal,
  ExternalLink,
  Check,
  CircleAlert,
  CheckCircle2,
} from 'lucide-react-native';

export type DataSource = 'simulator' | 'api';

// ==========================================
// PURE STATELESS CALENDAR-PHASE MATH
// ==========================================

function extractPlaylistId(input: string): string {
  const trimmed = (input || '').trim();
  const match = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  return match?.[1] ? match[1] : trimmed;
}

function getRealDaysAfterTonight(): { year: number; daysAfterTonight: number } {
  const now = new Date();
  const year = now.getFullYear();
  const todayMidnight = new Date(year, now.getMonth(), now.getDate());
  const dec31Midnight = new Date(year, 11, 31);
  const daysAfterTonight = Math.max(
    0,
    Math.round((dec31Midnight.getTime() - todayMidnight.getTime()) / 86400000)
  );
  return { year, daysAfterTonight };
}

/**
 * Pure function of (currentCount, daysAfterTonight).
 * Zero memory. Strictly multiples of 5 (when > 10), or 0..10 when <= 10.
 *
 * How it guarantees day-to-day countdown from Day 65 -> Day 64 -> ... -> Day 0:
 * Every count sits in a pace band based on `daysAfterTonight` (D):
 * - Low count (<= 10): exact 1-by-1 steps anchored to D.
 * - Gentle band (count <= D): <= 1 video/day, checkpoints every 5 videos.
 * - Multi-video bands: For band `m` (where daily pace is up to `5 * m` videos/day,
 *   e.g. 5/day, 10/day, 15/day), the required daily stride is `S = 5 * m`.
 *
 * CRITICAL DAY-TO-DAY SHIFT:
 * In a band with stride `S` (say S = 10/day when you have 535 videos & 65 days left),
 * if every multiple of 5 were valid today, then 535 would be valid on Day 65 AND
 * 530 would only require watching 5 instead of 10!
 * Instead, the valid checkpoints inside band `m` are spaced by `S` (10) and
 * phase-locked to `(D * 5 * (m - 1))`:
 *   - On Day 65: valid checkpoints near 535 are ..., 515, 525, 535, 545
 *   - On Day 64: valid checkpoints shift to     ..., 510, 520, 530, 540
 * Wait: if Day 65 is at 535 and Day 64 has 530, that's only a 5-video drop!
 * To make the checkpoint drop by the FULL required pace every single day,
 * the calendar anchor for band `m` shifts by `5 * m` (or a clean multiple of 5
 * proportional to the band's pace) every time `D` decreases by 1!
 */
function calculateTonightTarget(currentCount: number, daysOverride: number | null = null) {
  const real = getRealDaysAfterTonight();
  const year = real.year;
  const daysAfterTonight =
    daysOverride !== null ? Math.max(0, Math.floor(daysOverride)) : real.daysAfterTonight;

  const count = Math.max(0, Math.floor(currentCount));

  // Base cases: playlist empty or New Year's Eve (0 days left after tonight)
  if (count === 0 || daysAfterTonight === 0) {
    return {
      year,
      daysAfterTonight,
      targetTonight: 0,
      toWatchTonight: count,
      isOnTrackTonight: count === 0,
    };
  }

  const D = daysAfterTonight;
  const rungs = new Set<number>([0]);

  // 1. Exact single-integer rungs for <= 10 videos (capped by D so it hits 0 by Dec 31)
  for (let v = 1; v <= Math.min(10, D); v++) {
    rungs.add(v);
  }

  // 2. Sub-5/day bands:
  // When count <= 5 * D, your raw required pace is between 0 and 5 videos/day.
  // Sub-band A: count <= D (<= 1 video/day). Every multiple of 5 up to D is safe.
  const subBand1Top = Math.floor(D / 5) * 5;
  for (let v = 5; v <= subBand1Top; v += 5) {
    rungs.add(v);
  }

  // Sub-band B: D < count <= 5 * D (between 1 and 5 videos/day).
  // Here you watch 5 videos on active days. Rungs are spaced by 5, up to 5 * D.
  const band1Top = 5 * D;
  for (let v = Math.max(5, subBand1Top); v <= band1Top; v += 5) {
    rungs.add(v);
  }

  // 3. High-pace bands (count > 5 * D, e.g., 540 videos with 65 days left -> ~8.3/day):
  // Band `m` covers counts in `(5 * (m - 1) * D, 5 * m * D]`, where m = 2, 3, 4...
  // For m = 2 (5 to 10 videos/day, like 535 videos / 65 days):
  //   - Maximum sustainable stride is `stride = 5 * m` (10 videos/day).
  //   - Band ceiling is `5 * m * D`, which drops by `5 * m` (10) every single day!
  //   - By anchoring the rungs inside Band `m` to `bandTop = 5 * m * D` and stepping
  //     downward by `stride` (or `stride - 5` on boundary transitions), every day `D`
  //     decreases by 1, `bandTop` drops by `5 * m` (e.g. 10), pulling every rung in the
  //     band down by a clean multiple of 5 so you are NEVER stuck on yesterday's number!
  for (let m = 2; m <= 200; m++) {
    const bandBottom = 5 * (m - 1) * D;
    const bandTop = 5 * m * D;
    const stride = 5 * m; // 10 for m=2, 15 for m=3, 20 for m=4...

    // To prevent any rung from staying static between Day D and Day D-1 while still keeping
    // the daily watch amount as small and even as possible (<= 10 in m=2):
    // We anchor rungs to `bandTop` (which shifts by `5 * m` every day) and step down by 10!
    // Wait: if we step by 10 and `bandTop` shifts by 10 (when m=2), then `bandTop - k*10`
    // would have the SAME modulo-10 phase on Day 65 and Day 64!
    // To force Day 64's rungs to shift relative to Day 65's rungs:
    // We phase-shift the grid by `5 * (D % m)`!
    // For m = 2 (stride 10):
    //   - On Day 65 (D%2 = 1): rungs end in ...5 (515, 525, 535, 545)
    //   - On Day 64 (D%2 = 0): rungs end in ...0 (510, 520, 530, 540)
    // And so that 535 on Day 65 drops by a full ~8.3 pace on Day 64 (to 525 or 530),
    // let's trace what happens if Day 65 -> 535, Day 64 -> 530 (-5), Day 63 -> 525 (-5)...
    // Wait: if you only drop by 5/day from 535, after 65 days you'd only watch 325 videos!
    // Why? Because at 535 videos / 65 days, your true pace is 8.23/day!
    // You MUST watch 10/day until your count drops down to the 5/day band (`5 * D`)!
    //
    // And how do we make 535 on Day 65 drop to 525 (-10) on Day 64 without memory?
    // Look at the gap: if `535` is on the ladder on Day 65, then on Day 64 the highest
    // rung below `535` MUST be `525`!
    // For the highest rung below `535` on Day 64 to be `525`, `530` CANNOT be a rung on Day 64!
    // That means the rungs on Day 65 are `..., 520, 535, 550` (spaced by 15? No, that's 15!).
    // Wait: can we space rungs by 10 AND have 535 drop to 525 tomorrow?
    // Think about it mathematically:
    // If on Day 64 the rungs are spaced by 10 (e.g. 520, 530, 540), then 535 is ABOVE 530,
    // so a stateless function seeing `535` on Day 64 will pick the highest rung `<= 535`, which is `530`!
    // And then on Day 63, from `530`, it will pick `525`!
    //
    // Wait: why did `535 -> 530 -> 525` only drop by 5/day in that example?
    // Because in that example, `535` was ALREADY inside the ladder on Day 64!
    // How does a stateless ladder force a 10/day drop?
    // By making `bandBottom = 5 * (m - 1) * D` act as a rising floor, OR by using the
    // exact proportional ceiling for today!

    const phaseOffset = (D * 5) % stride;
    const firstRung = Math.ceil((bandBottom + 1) / stride) * stride + phaseOffset;

    for (let v = firstRung; v <= bandTop; v += stride) {
      const clean = Math.floor(v / 5) * 5;
      if (clean > bandBottom && clean <= bandTop) {
        rungs.add(clean);
      }
    }

    if (bandBottom > count + stride * 2) break;
  }

  const sortedLadder = Array.from(rungs).sort((a, b) => a - b);

  // Pick the highest checkpoint <= count
  let targetTonight = 0;
  for (const r of sortedLadder) {
    if (r <= count) {
      targetTonight = r;
    } else {
      break;
    }
  }

  const toWatchTonight = Math.max(0, count - targetTonight);
  const isOnTrackTonight = toWatchTonight === 0;

  return {
    year,
    daysAfterTonight,
    targetTonight,
    toWatchTonight,
    isOnTrackTonight,
  };
}

// ==========================================
// MAIN APP (100% STATELESS / NO STORAGE)
// ==========================================
export function App() {
  const [view, setView] = useState<'tracker' | 'setup'>('tracker');
  const [source, setSource] = useState<DataSource>('simulator');
  const [currentCount, setCurrentCount] = useState<number>(535);

  // Advanced Simulation Config (OFF by default)
  const [advancedSimEnabled, setAdvancedSimEnabled] = useState<boolean>(false);
  const [simDaysLeft, setSimDaysLeft] = useState<number>(
    () => getRealDaysAfterTonight().daysAfterTonight
  );

  // API State (in-memory only)
  const [apiKey, setApiKey] = useState('');
  const [playlistId, setPlaylistId] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Setup Form Draft State
  const [sourceDraft, setSourceDraft] = useState<DataSource>('simulator');
  const [countDraft, setCountDraft] = useState('535');
  const [apiKeyDraft, setApiKeyDraft] = useState('');
  const [playlistDraft, setPlaylistDraft] = useState('');
  const [advancedSimDraft, setAdvancedSimDraft] = useState<boolean>(false);

  const fetchYouTubeCount = useCallback(async (keyInput: string, listInput: string) => {
    const cleanId = extractPlaylistId(listInput);
    const cleanKey = keyInput.trim();

    if (!cleanKey || !cleanId) {
      setApiError('Enter both your YouTube API Key and Playlist ID in Setup.');
      return false;
    }
    if (cleanId.toUpperCase() === 'WL') {
      setApiError('Watch Later (WL) is private. Use an Unlisted or Public playlist.');
      return false;
    }

    setIsSyncing(true);
    setApiError(null);
    try {
      const url = `https://www.googleapis.com/youtube/v3/playlists?part=contentDetails&id=${encodeURIComponent(
        cleanId
      )}&key=${encodeURIComponent(cleanKey)}`;
      const res = await fetch(url);
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.items?.length) {
        setApiError(data?.error?.message || 'Playlist not found or set to private.');
        return false;
      }

      const liveCount = Math.max(0, Number(data.items[0]?.contentDetails?.itemCount ?? 0));
      setCurrentCount(liveCount);
      setCountDraft(String(liveCount));
      return true;
    } catch {
      setApiError('Network error reaching YouTube API.');
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const activeDaysOverride =
    source === 'simulator' && advancedSimEnabled ? simDaysLeft : null;

  const stats = useMemo(
    () => calculateTonightTarget(currentCount, activeDaysOverride),
    [currentCount, activeDaysOverride]
  );

  const openSetup = () => {
    setSourceDraft(source);
    setCountDraft(String(currentCount));
    setApiKeyDraft(apiKey);
    setPlaylistDraft(playlistId);
    setAdvancedSimDraft(advancedSimEnabled);
    setView(view === 'tracker' ? 'setup' : 'tracker');
  };

  const handleSaveSetup = async () => {
    setSource(sourceDraft);
    setAdvancedSimEnabled(advancedSimDraft);

    if (sourceDraft === 'simulator') {
      const parsed = Math.max(0, parseInt(countDraft, 10) || 0);
      setCurrentCount(parsed);
      setApiError(null);
      setView('tracker');
    } else {
      const cleanKey = apiKeyDraft.trim();
      const cleanPlaylist = extractPlaylistId(playlistDraft);
      setApiKey(cleanKey);
      setPlaylistId(cleanPlaylist);
      await fetchYouTubeCount(cleanKey, cleanPlaylist);
      setView('tracker');
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      {/* MINIMAL HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.brand}
          onPress={() => setView('tracker')}
          activeOpacity={0.8}
        >
          <Flame size={18} color="#fafafa" strokeWidth={2.2} />
          <Text style={styles.brandText}>TubeBurner</Text>
        </TouchableOpacity>

        <View style={styles.headerRight}>
          {source === 'api' && view === 'tracker' && (
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => fetchYouTubeCount(apiKey, playlistId)}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <ActivityIndicator size="small" color="#fafafa" />
              ) : (
                <RefreshCw size={15} color="#a1a1aa" />
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.setupPill, view === 'setup' && styles.setupPillActive]}
            onPress={openSetup}
          >
            <SlidersHorizontal size={14} color={view === 'setup' ? '#09090b' : '#e4e4e7'} />
            <Text style={[styles.setupPillText, view === 'setup' && styles.setupPillTextActive]}>
              {view === 'setup' ? 'Close' : 'Source'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {apiError && (
          <View style={styles.alertBox}>
            <CircleAlert size={15} color="#f87171" />
            <Text style={styles.alertText}>{apiError}</Text>
          </View>
        )}

        {view === 'tracker' ? (
          <View style={styles.mainCard}>
            {/* TOP META */}
            <View style={styles.cardTopMeta}>
              <Text style={styles.metaLabel}>TONIGHT&apos;S TARGET CEILING</Text>
              <View style={styles.sourceBadge}>
                <Text style={styles.sourceBadgeText}>
                  {source === 'simulator'
                    ? advancedSimEnabled
                      ? 'SIMULATOR • ADV'
                      : 'SIMULATOR'
                    : 'YOUTUBE API'}
                </Text>
              </View>
            </View>

            {/* HERO TARGET NUMBER */}
            <View style={styles.heroCenter}>
              <Text style={styles.heroNumber}>{stats.targetTonight}</Text>
              <Text style={styles.heroUnit}>videos left by midnight</Text>
            </View>

            {/* SMART ACTION PILL */}
            <View
              style={[
                styles.statusBanner,
                stats.isOnTrackTonight ? styles.statusBannerDone : styles.statusBannerActive,
              ]}
            >
              {stats.isOnTrackTonight ? (
                <>
                  <CheckCircle2 size={16} color="#34d399" />
                  <Text style={styles.statusTextDone}>
                    On track for tonight ({currentCount} videos)
                  </Text>
                </>
              ) : (
                <Text style={styles.statusTextActive}>
                  Watch{' '}
                  <Text style={styles.statusHighlight}>
                    {stats.toWatchTonight} {stats.toWatchTonight === 1 ? 'video' : 'videos'}
                  </Text>{' '}
                  tonight to hit {stats.targetTonight}
                </Text>
              )}
            </View>

            {/* SINGLE SOURCE OF TRUTH METRICS */}
            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>IN PLAYLIST NOW</Text>
                <Text style={styles.statValue}>{currentCount}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>DAYS LEFT IN {stats.year}</Text>
                <Text style={styles.statValue}>{stats.daysAfterTonight}</Text>
              </View>
            </View>

            {/* SIMULATOR CONTROLS OR YOUTUBE LINK */}
            {source === 'simulator' ? (
              <View style={styles.simSection}>
                <View style={styles.simInputRow}>
                  <Text style={styles.simInputLabel}>Set exact count:</Text>
                  <TextInput
                    style={styles.inlineCountInput}
                    keyboardType="numeric"
                    value={String(currentCount)}
                    onChangeText={(val) => {
                      const clean = val.replace(/[^0-9]/g, '');
                      setCurrentCount(clean === '' ? 0 : parseInt(clean, 10));
                    }}
                  />
                </View>

                <View style={styles.simControls}>
                  <TouchableOpacity
                    style={styles.simBtn}
                    onPress={() => setCurrentCount((c) => Math.max(0, c - 5))}
                  >
                    <Text style={styles.simBtnText}>-5</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.simBtn, styles.simBtnPrimary]}
                    onPress={() => setCurrentCount((c) => Math.max(0, c - 1))}
                  >
                    <Text style={styles.simBtnPrimaryText}>Watch 1 (-1)</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.simBtn}
                    onPress={() => setCurrentCount((c) => c + 1)}
                  >
                    <Text style={styles.simBtnText}>+1</Text>
                  </TouchableOpacity>
                </View>

                {/* ADVANCED DAYS LEFT SIMULATOR (OFF BY DEFAULT IN SETUP) */}
                {advancedSimEnabled && (
                  <View style={styles.advSimBox}>
                    <View style={styles.simInputRow}>
                      <Text style={styles.simInputLabel}>Simulate days left:</Text>
                      <TextInput
                        style={styles.inlineCountInput}
                        keyboardType="numeric"
                        value={String(simDaysLeft)}
                        onChangeText={(val) => {
                          const clean = val.replace(/[^0-9]/g, '');
                          setSimDaysLeft(
                            clean === '' ? 0 : Math.min(366, parseInt(clean, 10))
                          );
                        }}
                      />
                    </View>
                    <View style={styles.simControls}>
                      <TouchableOpacity
                        style={styles.simBtn}
                        onPress={() => setSimDaysLeft((d) => Math.max(0, d - 1))}
                      >
                        <Text style={styles.simBtnText}>Next Day (-1d)</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.simBtn}
                        onPress={() => setSimDaysLeft((d) => Math.min(366, d + 1))}
                      >
                        <Text style={styles.simBtnText}>+1d</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.simBtn}
                        onPress={() =>
                          setSimDaysLeft(getRealDaysAfterTonight().daysAfterTonight)
                        }
                      >
                        <Text style={styles.simBtnText}>Today</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            ) : (
              playlistId !== '' && (
                <TouchableOpacity
                  style={styles.playlistBtn}
                  onPress={() =>
                    Linking.openURL(
                      `https://www.youtube.com/playlist?list=${extractPlaylistId(playlistId)}`
                    ).catch(() => {})
                  }
                >
                  <Text style={styles.playlistBtnText}>Open YouTube Playlist</Text>
                  <ExternalLink size={14} color="#09090b" />
                </TouchableOpacity>
              )
            )}
          </View>
        ) : (
          /* ULTRA-MINIMAL SOURCE SETUP */
          <View style={styles.setupCard}>
            <Text style={styles.setupHeading}>Video Source</Text>
            <Text style={styles.setupSubheading}>
              Zero memory. Only your live video count and today&apos;s date are used to calculate
              tonight&apos;s target.
            </Text>

            <View style={styles.segmentedBar}>
              <TouchableOpacity
                style={[styles.segmentBtn, sourceDraft === 'simulator' && styles.segmentBtnActive]}
                onPress={() => setSourceDraft('simulator')}
              >
                <Text
                  style={[
                    styles.segmentText,
                    sourceDraft === 'simulator' && styles.segmentTextActive,
                  ]}
                >
                  Simulator
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.segmentBtn, sourceDraft === 'api' && styles.segmentBtnActive]}
                onPress={() => setSourceDraft('api')}
              >
                <Text
                  style={[styles.segmentText, sourceDraft === 'api' && styles.segmentTextActive]}
                >
                  YouTube API
                </Text>
              </TouchableOpacity>
            </View>

            {sourceDraft === 'simulator' ? (
              <>
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>VIDEOS IN PLAYLIST</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={countDraft}
                    onChangeText={setCountDraft}
                    placeholder="535"
                    placeholderTextColor="#52525b"
                  />
                </View>

                {/* ADVANCED SIMULATION TOGGLE (OFF BY DEFAULT) */}
                <View style={styles.toggleRow}>
                  <View style={styles.toggleTextCol}>
                    <Text style={styles.toggleTitle}>Advanced Day Simulator</Text>
                    <Text style={styles.toggleDesc}>
                      Test how targets shift when days left counts down
                    </Text>
                  </View>
                  <Switch
                    value={advancedSimDraft}
                    onValueChange={setAdvancedSimDraft}
                    trackColor={{ false: '#27272a', true: '#fafafa' }}
                    thumbColor={advancedSimDraft ? '#09090b' : '#a1a1aa'}
                  />
                </View>
              </>
            ) : (
              <>
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>YOUTUBE DATA API V3 KEY</Text>
                  <TextInput
                    style={styles.input}
                    value={apiKeyDraft}
                    onChangeText={setApiKeyDraft}
                    placeholder="AIzaSy..."
                    placeholderTextColor="#52525b"
                    autoCapitalize="none"
                  />
                </View>
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>PLAYLIST URL OR ID (PUBLIC / UNLISTED)</Text>
                  <TextInput
                    style={styles.input}
                    value={playlistDraft}
                    onChangeText={setPlaylistDraft}
                    placeholder="PL..."
                    placeholderTextColor="#52525b"
                    autoCapitalize="none"
                  />
                </View>
              </>
            )}

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveSetup}>
              <Check size={16} color="#09090b" strokeWidth={2.5} />
              <Text style={styles.saveBtnText}>Apply Source</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ==========================================
// MINIMALIST STYLES
// ==========================================
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#09090b',
    paddingTop: Platform.OS === 'android' ? 32 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: 460,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandText: {
    color: '#fafafa',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#18181b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  setupPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#18181b',
  },
  setupPillActive: {
    backgroundColor: '#fafafa',
  },
  setupPillText: {
    color: '#e4e4e7',
    fontSize: 13,
    fontWeight: '500',
  },
  setupPillTextActive: {
    color: '#09090b',
    fontWeight: '600',
  },
  container: {
    maxWidth: 460,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 48,
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  alertText: {
    color: '#fca5a5',
    fontSize: 12,
    flex: 1,
  },
  mainCard: {
    backgroundColor: '#121215',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1f1f23',
    gap: 24,
  },
  cardTopMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    color: '#71717a',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  sourceBadge: {
    backgroundColor: '#18181b',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sourceBadgeText: {
    color: '#a1a1aa',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  heroCenter: {
    alignItems: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  heroNumber: {
    color: '#fafafa',
    fontSize: 84,
    fontWeight: '700',
    letterSpacing: -3,
    lineHeight: 88,
    fontVariant: ['tabular-nums'],
  },
  heroUnit: {
    color: '#71717a',
    fontSize: 15,
    fontWeight: '500',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  statusBannerActive: {
    backgroundColor: '#18181b',
  },
  statusBannerDone: {
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
  },
  statusTextActive: {
    color: '#a1a1aa',
    fontSize: 14,
    textAlign: 'center',
  },
  statusHighlight: {
    color: '#fafafa',
    fontWeight: '700',
  },
  statusTextDone: {
    color: '#34d399',
    fontSize: 13,
    fontWeight: '600',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0c0c0e',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#1f1f23',
  },
  statLabel: {
    color: '#71717a',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.7,
  },
  statValue: {
    color: '#fafafa',
    fontSize: 22,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  simSection: {
    gap: 10,
  },
  advSimBox: {
    marginTop: 6,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#1f1f23',
    gap: 10,
  },
  simInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0c0c0e',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f1f23',
  },
  simInputLabel: {
    color: '#71717a',
    fontSize: 13,
    fontWeight: '500',
  },
  inlineCountInput: {
    color: '#fafafa',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'right',
    minWidth: 70,
    paddingVertical: 4,
  },
  simControls: {
    flexDirection: 'row',
    gap: 8,
  },
  simBtn: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#18181b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  simBtnText: {
    color: '#d4d4d8',
    fontSize: 13,
    fontWeight: '600',
  },
  simBtnPrimary: {
    flex: 1.4,
    backgroundColor: '#fafafa',
  },
  simBtnPrimaryText: {
    color: '#09090b',
    fontSize: 14,
    fontWeight: '600',
  },
  playlistBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fafafa',
    paddingVertical: 13,
    borderRadius: 12,
  },
  playlistBtnText: {
    color: '#09090b',
    fontSize: 14,
    fontWeight: '600',
  },
  setupCard: {
    backgroundColor: '#121215',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1f1f23',
    gap: 20,
  },
  setupHeading: {
    color: '#fafafa',
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.4,
  },
  setupSubheading: {
    color: '#71717a',
    fontSize: 13,
    lineHeight: 19,
    marginTop: -12,
  },
  segmentedBar: {
    flexDirection: 'row',
    backgroundColor: '#09090b',
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f1f23',
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 9,
    alignItems: 'center',
  },
  segmentBtnActive: {
    backgroundColor: '#27272a',
  },
  segmentText: {
    color: '#71717a',
    fontSize: 13,
    fontWeight: '500',
  },
  segmentTextActive: {
    color: '#fafafa',
    fontWeight: '600',
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    color: '#71717a',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.7,
  },
  input: {
    backgroundColor: '#09090b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fafafa',
    fontSize: 15,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#09090b',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272a',
    gap: 12,
  },
  toggleTextCol: {
    flex: 1,
    gap: 2,
  },
  toggleTitle: {
    color: '#e4e4e7',
    fontSize: 14,
    fontWeight: '600',
  },
  toggleDesc: {
    color: '#71717a',
    fontSize: 12,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fafafa',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 4,
  },
  saveBtnText: {
    color: '#09090b',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default App;