import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Lock, Unlock, ExternalLink, CircleAlert, CircleCheck } from 'lucide-react-native';
import { EngineResult } from '../types';
import { extractPlaylistId } from '../services/engine';

interface StatusCardProps {
  engine: EngineResult;
  playlistId?: string;
  onOpenPlaylist?: () => void;
}

export const StatusCard: React.FC<StatusCardProps> = ({
  engine,
  playlistId,
  onOpenPlaylist,
}) => {
  const isUnlocked = engine.isUnlocked;
  const cleanId = extractPlaylistId(playlistId || '');

  const handleOpenPlaylist = () => {
    if (onOpenPlaylist) {
      onOpenPlaylist();
      return;
    }
    if (cleanId) {
      const url = `https://www.youtube.com/playlist?list=${cleanId}`;
      Linking.openURL(url);
    }
  };

  return (
    <View style={[styles.card, isUnlocked ? styles.cardUnlocked : styles.cardLocked]}>
      <View style={styles.topRow}>
        <View
          style={[
            styles.iconWrapper,
            isUnlocked ? styles.iconWrapperUnlocked : styles.iconWrapperLocked,
          ]}
        >
          {isUnlocked ? (
            <Unlock size={28} color="#10b981" />
          ) : (
            <Lock size={28} color="#f43f5e" />
          )}
        </View>

        <View style={styles.badgeContainer}>
          {isUnlocked ? (
            <View style={styles.statusPillUnlocked}>
              <CircleCheck size={13} color="#10b981" />
              <Text style={styles.statusPillTextUnlocked}>TARGET MET</Text>
            </View>
          ) : (
            <View style={styles.statusPillLocked}>
              <CircleAlert size={13} color="#f43f5e" />
              <Text style={styles.statusPillTextLocked}>BURN REQUIRED</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.mainContent}>
        {isUnlocked ? (
          <>
            <Text style={styles.heroTitleUnlocked}>REWARDS UNLOCKED!</Text>
            <Text style={styles.heroSubtitle}>
              You are currently at {engine.currentCount} videos, beating your ceiling of{' '}
              {engine.targetCount}. All Gatekeeper rewards are ready to enjoy!
            </Text>
          </>
        ) : (
          <>
            <View style={styles.heroNumberRow}>
              <Text style={styles.heroCount}>{engine.videosLeftToUnlock}</Text>
              <Text style={styles.heroCountUnit}>
                {engine.videosLeftToUnlock === 1 ? 'VIDEO' : 'VIDEOS'}
              </Text>
            </View>
            <Text style={styles.heroTitleLocked}>TO UNLOCK REWARDS</Text>
            <Text style={styles.heroSubtitle}>
              Current: {engine.currentCount} • Active Target Ceiling: {engine.targetCount}
              {engine.mode === 'weekly' ? ` • Today's Pace: ${engine.dailyPacingGuide}` : ''}
            </Text>
          </>
        )}
      </View>

      {cleanId ? (
        <View style={styles.actionFooter}>
          <TouchableOpacity
            style={styles.playlistButton}
            onPress={handleOpenPlaylist}
            activeOpacity={0.8}
          >
            <Text style={styles.playlistButtonText}>Open YouTube Playlist</Text>
            <ExternalLink size={14} color="#e4e4e7" />
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 24,
    backgroundColor: '#18181b',
    borderWidth: 2,
    marginVertical: 12,
  },
  cardLocked: {
    borderColor: 'rgba(244, 63, 94, 0.4)',
  },
  cardUnlocked: {
    borderColor: 'rgba(16, 185, 129, 0.5)',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapperLocked: {
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
  },
  iconWrapperUnlocked: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  badgeContainer: {
    flexDirection: 'row',
  },
  statusPillLocked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusPillTextLocked: {
    color: '#fb7185',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statusPillUnlocked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusPillTextUnlocked: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  mainContent: {
    alignItems: 'flex-start',
  },
  heroNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  heroCount: {
    color: '#f43f5e',
    fontSize: 52,
    fontWeight: '900',
    lineHeight: 56,
  },
  heroCountUnit: {
    color: '#fda4af',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroTitleLocked: {
    color: '#f4f4f5',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginTop: 2,
  },
  heroTitleUnlocked: {
    color: '#10b981',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    color: '#a1a1aa',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  actionFooter: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
  },
  playlistButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#27272a',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  playlistButtonText: {
    color: '#f4f4f5',
    fontSize: 13,
    fontWeight: '600',
  },
});