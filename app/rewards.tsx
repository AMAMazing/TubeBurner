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
import { ArrowLeft, Plus, Trash2, Check, Gift, Sparkles } from 'lucide-react-native';
import { RewardItem } from '../types';
import { loadRewards, addReward, deleteReward, toggleRewardComplete } from '../services/storage';

const PRESET_CATEGORIES = ['TV Series', 'Gaming', 'Relaxation', 'Movie', 'Reading', 'Guilt-Free'];

export default function RewardsScreen() {
  const router = useRouter();
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('TV Series');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    async function init() {
      const stored = await loadRewards();
      setRewards(stored);
      setIsLoading(false);
    }
    init();
  }, []);

  const handleAddReward = async () => {
    if (!title.trim()) return;
    const updated = await addReward({
      title: title.trim(),
      category: category.trim() || 'General',
      description: description.trim() || undefined,
      url: url.trim() || undefined,
      isCompleted: false,
    });
    setRewards(updated);
    setTitle('');
    setDescription('');
    setUrl('');
    setIsAdding(false);
  };

  const handleDelete = async (id: string) => {
    const updated = await deleteReward(id);
    setRewards(updated);
  };

  const handleToggle = async (id: string) => {
    const updated = await toggleRewardComplete(id);
    setRewards(updated);
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
        <Text style={styles.topBarTitle}>Manage Gatekeeper</Text>
        <TouchableOpacity
          style={styles.newButton}
          onPress={() => setIsAdding(!isAdding)}
          activeOpacity={0.8}
        >
          <Plus size={16} color="#ffffff" />
          <Text style={styles.newButtonText}>{isAdding ? 'Close' : 'New'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          {/* Header Explanation */}
          <View style={styles.introCard}>
            <View style={styles.introHeaderRow}>
              <Gift size={20} color="#10b981" />
              <Text style={styles.introTitle}>Your Incentive Escrow Queue</Text>
            </View>
            <Text style={styles.introBody}>
              Add shows, games, books, or activities you want to enjoy without backlog guilt.
              These rewards remain locked behind the Gatekeeper until your YouTube playlist size
              drops below your active target threshold!
            </Text>
          </View>

          {/* Add Reward Form */}
          {isAdding && (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Add New Reward</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Reward Title *</Text>
                <TextInput
                  style={styles.textInput}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g. Arcane Season 2, Elden Ring DLC..."
                  placeholderTextColor="#52525b"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Category</Text>
                <View style={styles.categoryPills}>
                  {PRESET_CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.catPill,
                        category === cat && styles.catPillActive,
                      ]}
                      onPress={() => setCategory(cat)}
                    >
                      <Text
                        style={[
                          styles.catPillText,
                          category === cat && styles.catPillTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description (optional)</Text>
                <TextInput
                  style={styles.textInput}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Notes or rules for enjoying this reward"
                  placeholderTextColor="#52525b"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Link / URL (optional)</Text>
                <TextInput
                  style={styles.textInput}
                  value={url}
                  onChangeText={setUrl}
                  placeholder="https://..."
                  placeholderTextColor="#52525b"
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleAddReward}
                activeOpacity={0.8}
              >
                <Plus size={16} color="#ffffff" />
                <Text style={styles.submitBtnText}>Add to Gatekeeper Queue</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Rewards List */}
          <View style={styles.listSection}>
            <Text style={styles.listHeading}>Queued Rewards ({rewards.length})</Text>

            {rewards.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No rewards queued yet.</Text>
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={() => setIsAdding(true)}
                >
                  <Text style={styles.addBtnText}>+ Create Reward</Text>
                </TouchableOpacity>
              </View>
            ) : (
              rewards.map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.rewardRowCard,
                    item.isCompleted && styles.rewardRowCompleted,
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.checkBtn,
                      item.isCompleted && styles.checkBtnActive,
                    ]}
                    onPress={() => handleToggle(item.id)}
                  >
                    {item.isCompleted && <Check size={14} color="#09090b" />}
                  </TouchableOpacity>

                  <View style={styles.rewardMetaCol}>
                    <View style={styles.badgeRow}>
                      <View style={styles.catBadge}>
                        <Text style={styles.catBadgeText}>{item.category}</Text>
                      </View>
                    </View>
                    <Text
                      style={[
                        styles.itemTitle,
                        item.isCompleted && styles.itemTitleCompleted,
                      ]}
                    >
                      {item.title}
                    </Text>
                    {item.description ? (
                      <Text style={styles.itemDesc}>{item.description}</Text>
                    ) : null}
                  </View>

                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(item.id)}
                    accessibilityLabel="Delete reward"
                  >
                    <Trash2 size={16} color="#f43f5e" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
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
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  newButtonText: {
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
  introCard: {
    backgroundColor: '#18181b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 16,
  },
  introHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  introTitle: {
    color: '#f4f4f5',
    fontSize: 15,
    fontWeight: '700',
  },
  introBody: {
    color: '#a1a1aa',
    fontSize: 13,
    lineHeight: 18,
  },
  formCard: {
    backgroundColor: '#18181b',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#38bdf8',
    padding: 18,
  },
  formTitle: {
    color: '#f4f4f5',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 14,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    color: '#e4e4e7',
    fontSize: 12,
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
  categoryPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catPill: {
    backgroundColor: '#27272a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  catPillActive: {
    backgroundColor: '#10b981',
    borderColor: '#059669',
  },
  catPillText: {
    color: '#a1a1aa',
    fontSize: 12,
    fontWeight: '600',
  },
  catPillTextActive: {
    color: '#ffffff',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#38bdf8',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 6,
  },
  submitBtnText: {
    color: '#09090b',
    fontSize: 14,
    fontWeight: '700',
  },
  listSection: {
    marginTop: 8,
  },
  listHeading: {
    color: '#a1a1aa',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  emptyCard: {
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
  addBtn: {
    backgroundColor: '#27272a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '600',
  },
  rewardRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#18181b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 14,
    marginBottom: 10,
  },
  rewardRowCompleted: {
    opacity: 0.5,
  },
  checkBtn: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#3f3f46',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBtnActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  rewardMetaCol: {
    flex: 1,
  },
  badgeRow: {
    marginBottom: 4,
  },
  catBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#27272a',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  catBadgeText: {
    color: '#a1a1aa',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  itemTitle: {
    color: '#f4f4f5',
    fontSize: 15,
    fontWeight: '700',
  },
  itemTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#71717a',
  },
  itemDesc: {
    color: '#a1a1aa',
    fontSize: 12,
    marginTop: 2,
  },
  deleteBtn: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
  },
});