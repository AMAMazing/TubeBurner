export type BurnMode = 'daily' | 'weekly';

export interface BurnConfig {
  mode: BurnMode;
  startCount: number;
  startDate: string; // ISO date string (YYYY-MM-DD)
  targetYear: number; // e.g. 2026, 2027
  burnRate: number; // e.g. 10/day or 50/week
  weekResetDay: number; // 0 for Sunday, 1 for Monday, etc.
  apiKey?: string;
  playlistId?: string;
  demoMode?: boolean;
  demoPlaylistCount?: number;
}

export type PacingStatus = 'Ahead of Pace' | 'On Track' | 'Behind Pace';

export interface EngineResult {
  mode: BurnMode;
  daysElapsed: number;
  weeksElapsed: number;
  daysIntoCurrentWeek: number;
  targetCount: number;
  dailyPacingGuide: number;
  isUnlocked: boolean;
  isPacingUnlocked: boolean;
  videosLeftToUnlock: number;
  videosLeftTodayForPace: number;
  pacingStatus: PacingStatus;
  estimatedDaysToZero: number;
  projectedCompletionDate: Date | null;
  targetYearDeadline: Date;
  willFinishByTargetYear: boolean;
  requiredRateForTargetYear: number;
  percentBurned: number;
  currentCount: number;
  startCount: number;
}

export interface RewardItem {
  id: string;
  title: string;
  category: string;
  description?: string;
  url?: string;
  isCompleted?: boolean;
  createdAt: number;
}

export interface PlaylistStatus {
  count: number;
  title?: string;
  lastFetched: number;
  isCached?: boolean;
  error?: string | null;
}