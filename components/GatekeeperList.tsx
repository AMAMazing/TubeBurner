import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Lock, Unlock, Check, ExternalLink, CirclePlus, ShieldAlert, Sparkles } from 'lucide-react-native';
import { RewardItem } from '../types';

interface GatekeeperListProps {
  rewards: RewardItem[];
  isUnlocked: boolean;
  onToggleComplete?: (id: string) => void;
  onManageRewards?: () => void;
}

export const GatekeeperList: React.FC<GatekeeperListProps> = ({
  rewards,
  isUnlocked,
  onToggleComplete,
  onManageRewards,
}) => {
  const router = useRouter();

  const handleOpenLink = (url?: string) => {
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      Linking.openURL(url);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <View>
          <View style={styles.titleRow}>
            <Text style={styles.sectionTitle}>The Reward Gatekeeper</Text>
            {isUnlocked ? (
              <View style={styles.statusUnlockedBadge}>
                <Sparkles size={12} color="#10b981" />
                <Text style={styles.statusUnlockedText}>UNLOCKED</Text>
              </View>
            ) : (
              <View style={styles.statusLockedBadge}>
                <Lock size={12} color="#f43f5e" />
                <Text style={styles.statusLockedText}>LOCKED</Text>
              </View>
            )}
          </View>
          <Text style={styles.sectionSubtitle}>
            {isUnlocked
              ? 'Pacing threshold conquered. Enjoy your entertainment guilt-free.'
              : 'Keep burning down videos to earn your entertainment back.'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.manageButton}
          onPress={() => (onManageRewards ? onManageRewards() : router.push('/rewards'))}
          activeOpacity={0.8}
        >
          <CirclePlus size={14} color="#38bdf8" />
          <Text style={styles.manageButtonText}>Manage</Text>
        </TouchableOpacity>
      </View>

      {!isUnlocked && (
        <View style={styles.lockNoticeBanner}>
          <ShieldAlert size={16} color="#f43f5e" />
          <Text style={styles.lockNoticeText}>
            Rewards are visually blurred and held in escrow until your playlist count drops to or
            below the current target ceiling.
          </Text>
        </View>
      )}

      {rewards.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No rewards queued yet.</Text>
          <TouchableOpacity
            style={styles.addFirstButton}
            onPress={() => router.push('/rewards')}
          >
            <Text style={styles.addFirstButtonText}>+ Add First Reward</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.rewardList}>
          {rewards.map((reward) => {
            const isCompleted = !!reward.isCompleted;

            return (
              <View
                key={reward.id}
                style={[
                  styles.rewardCard,
                  isUnlocked ? styles.rewardCardUnlocked : styles.rewardCardLocked,
                  isCompleted && styles.rewardCardCompleted,
                ]}
              >
                {!isUnlocked && (
                  <View style={styles.lockOverlay}>
                    <View style={styles.lockBadge}>
                      <Lock size={14} color="#fda4af" />
                      <Text style={styles.lockBadgeText}>LOCKED</Text>
                    </View>
                  </View>
                )}

                <View style={[styles.rewardContent, !isUnlocked && styles.rewardContentBlurred]}>
                  <View style={styles.rewardTopRow}>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>{reward.category}</Text>
                    </View>

                    {isUnlocked && onToggleComplete && (
                      <TouchableOpacity
                        style={[
                          styles.checkbox,
                          isCompleted && styles.checkboxActive,
                        ]}
                        onPress={() => onToggleComplete(reward.id)}
                        accessibilityLabel="Mark reward consumed"
                      >
                        {isCompleted && <Check size={14} color="#09090b" />}
                      </TouchableOpacity>
                    )}
                  </View>

                  <Text
                    style={[
                      styles.rewardTitle,
                      isCompleted && styles.rewardTitleCompleted,
                    ]}
                  >
                    {reward.title}
                  </Text>

                  {reward.description ? (
                    <Text style={styles.rewardDescription}>{reward.description}</Text>
                  ) : null}

                  {isUnlocked && reward.url ? (
                    <TouchableOpacity
                      style={styles.urlLink}
                      onPress={() => handleOpenLink(reward.url)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.urlLinkText}>Open Link</Text>
                      <ExternalLink size={12} color="#10b981" />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
    gap: 10,
    flexWrap: 'wrap',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    color: '#f4f4f5',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    color: '#a1a1aa',
    fontSize: 13,
    marginTop: 3,
  },
  statusUnlockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusUnlockedText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusLockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusLockedText: {
    color: '#f43f5e',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  manageButtonText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '600',
  },
  lockNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.25)',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  lockNoticeText: {
    flex: 1,
    color: '#fda4af',
    fontSize: 12,
    lineHeight: 18,
  },
  emptyState: {
    backgroundColor: '#18181b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#71717a',
    fontSize: 14,
    marginBottom: 12,
  },
  addFirstButton: {
    backgroundColor: '#27272a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addFirstButtonText: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '600',
  },
  rewardList: {
    gap: 12,
  },
  rewardCard: {
    position: 'relative',
    borderRadius: 12,
    backgroundColor: '#18181b',
    borderWidth: 1,
    overflow: 'hidden',
  },
  rewardCardUnlocked: {
    borderColor: '#27272a',
  },
  rewardCardLocked: {
    borderColor: 'rgba(244, 63, 94, 0.25)',
    backgroundColor: '#141416',
  },
  rewardCardCompleted: {
    opacity: 0.6,
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(9, 9, 11, 0.65)',
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(244, 63, 94, 0.2)',
    borderColor: 'rgba(244, 63, 94, 0.4)',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  lockBadgeText: {
    color: '#fda4af',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  rewardContent: {
    padding: 16,
  },
  rewardContentBlurred: {
    opacity: 0.25,
  },
  rewardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: '#27272a',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryBadgeText: {
    color: '#a1a1aa',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#3f3f46',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  rewardTitle: {
    color: '#f4f4f5',
    fontSize: 16,
    fontWeight: '700',
  },
  rewardTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#71717a',
  },
  rewardDescription: {
    color: '#a1a1aa',
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  urlLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  urlLinkText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '600',
  },
});