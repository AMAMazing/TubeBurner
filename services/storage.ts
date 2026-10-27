import AsyncStorage from '@react-native-async-storage/async-storage';
import { BurnConfig, RewardItem } from '../types';

const STORAGE_KEYS = {
  CONFIG: 'tubeburner_config_v1',
  REWARDS: 'tubeburner_rewards_v1',
};

export const DEFAULT_CONFIG: BurnConfig = {
  mode: 'daily',
  startCount: 530,
  startDate: '2026-01-01',
  targetYear: 2026,
  burnRate: 10,
  weekResetDay: 1, // Monday
  apiKey: process.env.EXPO_PUBLIC_YOUTUBE_API_KEY || '',
  playlistId: process.env.EXPO_PUBLIC_PLAYLIST_ID || '',
  demoMode: true,
  demoPlaylistCount: 505,
};

export const DEFAULT_REWARDS: RewardItem[] = [
  {
    id: 'rew_1',
    title: 'The Bear (Season 3)',
    category: 'TV Series',
    description: 'Binge the chaos kitchen drama guilt-free.',
    url: 'https://www.hulu.com',
    isCompleted: false,
    createdAt: Date.now() - 3600000 * 24 * 3,
  },
  {
    id: 'rew_2',
    title: 'The Rehearsal',
    category: 'TV Series',
    description: 'Nathan Fielder mastermind comedy.',
    url: '',
    isCompleted: false,
    createdAt: Date.now() - 3600000 * 24 * 2,
  },
  {
    id: 'rew_3',
    title: 'Cyberpunk 2077: Phantom Liberty',
    category: 'Gaming',
    description: 'Dive into Dogtown with full focus.',
    url: '',
    isCompleted: false,
    createdAt: Date.now() - 3600000 * 24 * 1,
  },
  {
    id: 'rew_4',
    title: 'Guilt-Free Movie Night',
    category: 'Relaxation',
    description: 'Popcorn, dim lights, and zero backlog anxiety.',
    url: '',
    isCompleted: false,
    createdAt: Date.now(),
  },
];

export async function loadConfig(): Promise<BurnConfig> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.CONFIG);
    if (!raw) {
      return { ...DEFAULT_CONFIG };
    }
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
    };
  } catch (error) {
    console.error('Failed to load TubeBurner config from storage:', error);
    return { ...DEFAULT_CONFIG };
  }
}

export async function saveConfig(config: BurnConfig): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  } catch (error) {
    console.error('Failed to save TubeBurner config to storage:', error);
  }
}

export async function loadRewards(): Promise<RewardItem[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.REWARDS);
    if (!raw) {
      return [...DEFAULT_REWARDS];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return [...DEFAULT_REWARDS];
  } catch (error) {
    console.error('Failed to load TubeBurner rewards from storage:', error);
    return [...DEFAULT_REWARDS];
  }
}

export async function saveRewards(rewards: RewardItem[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.REWARDS, JSON.stringify(rewards));
  } catch (error) {
    console.error('Failed to save TubeBurner rewards to storage:', error);
  }
}

export async function addReward(
  item: Omit<RewardItem, 'id' | 'createdAt'>
): Promise<RewardItem[]> {
  const current = await loadRewards();
  const newItem: RewardItem = {
    ...item,
    id: 'rew_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    createdAt: Date.now(),
  };
  const updated = [newItem, ...current];
  await saveRewards(updated);
  return updated;
}

export async function deleteReward(id: string): Promise<RewardItem[]> {
  const current = await loadRewards();
  const updated = current.filter((r) => r.id !== id);
  await saveRewards(updated);
  return updated;
}

export async function toggleRewardComplete(id: string): Promise<RewardItem[]> {
  const current = await loadRewards();
  const updated = current.map((r) =>
    r.id === id ? { ...r, isCompleted: !r.isCompleted } : r
  );
  await saveRewards(updated);
  return updated;
}

export async function resetToDemo(): Promise<{
  config: BurnConfig;
  rewards: RewardItem[];
}> {
  const config = { ...DEFAULT_CONFIG, demoMode: true, demoPlaylistCount: 505 };
  const rewards = [...DEFAULT_REWARDS];
  await saveConfig(config);
  await saveRewards(rewards);
  return { config, rewards };
}