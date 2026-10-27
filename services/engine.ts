import { BurnConfig, EngineResult, PacingStatus } from '../types';

export function normalizeToMidnight(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function parseISODateToMidnight(isoString: string): Date {
  const parts = isoString.split('-');
  if (parts.length >= 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }
  const fallback = new Date(isoString);
  return normalizeToMidnight(isNaN(fallback.getTime()) ? new Date() : fallback);
}

export function extractPlaylistId(rawInput: string): string {
  const trimmed = rawInput.trim();
  if (!trimmed) return '';

  try {
    if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) {
      const url = new URL(trimmed);
      const listParam = url.searchParams.get('list');
      if (listParam) return listParam;
    }
  } catch {
    // If URL parsing fails, continue to regex
  }

  const listMatch = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  if (listMatch && listMatch[1]) {
    return listMatch[1];
  }

  return trimmed;
}

export function calculateEngineResult(
  config: BurnConfig,
  currentCount: number,
  customNow?: Date
): EngineResult {
  const now = customNow ? new Date(customNow) : new Date();
  const localMidnightNow = normalizeToMidnight(now);
  const localMidnightStart = parseISODateToMidnight(config.startDate);

  const diffMs = localMidnightNow.getTime() - localMidnightStart.getTime();
  const daysElapsed = Math.max(0, Math.floor(diffMs / 86400000));
  const weeksElapsed = Math.floor(daysElapsed / 7);
  const daysIntoCurrentWeek = daysElapsed % 7;

  const startCount = Math.max(0, config.startCount);
  const safeCount = Math.max(0, currentCount);
  const burnRate = Math.max(1, config.burnRate);

  let targetCount = 0;
  let dailyPacingGuide = 0;
  let isUnlocked = false;
  let isPacingUnlocked = false;
  let videosLeftToUnlock = 0;
  let videosLeftTodayForPace = 0;
  let pacingStatus: PacingStatus = 'On Track';
  let estimatedDaysToZero = Infinity;

  if (config.mode === 'daily') {
    targetCount = Math.max(0, startCount - ((daysElapsed + 1) * burnRate));
    isUnlocked = safeCount <= targetCount;
    videosLeftToUnlock = Math.max(0, safeCount - targetCount);
    estimatedDaysToZero = burnRate > 0 ? Math.ceil(safeCount / burnRate) : Infinity;

    dailyPacingGuide = targetCount;
    isPacingUnlocked = isUnlocked;
    videosLeftTodayForPace = videosLeftToUnlock;

    if (safeCount < targetCount) {
      pacingStatus = 'Ahead of Pace';
    } else if (safeCount === targetCount) {
      pacingStatus = 'On Track';
    } else {
      pacingStatus = 'Behind Pace';
    }
  } else {
    // Weekly Sprint Mode
    targetCount = Math.max(0, startCount - ((weeksElapsed + 1) * burnRate));
    dailyPacingGuide = Math.max(
      0,
      Math.round(
        startCount -
          weeksElapsed * burnRate -
          ((daysIntoCurrentWeek + 1) / 7) * burnRate
      )
    );

    isUnlocked = safeCount <= targetCount;
    isPacingUnlocked = safeCount <= dailyPacingGuide;
    videosLeftToUnlock = Math.max(0, safeCount - targetCount);
    videosLeftTodayForPace = Math.max(0, safeCount - dailyPacingGuide);

    if (safeCount < dailyPacingGuide) {
      pacingStatus = 'Ahead of Pace';
    } else if (safeCount === dailyPacingGuide) {
      pacingStatus = 'On Track';
    } else {
      pacingStatus = 'Behind Pace';
    }

    estimatedDaysToZero =
      burnRate > 0 ? Math.ceil((safeCount / burnRate) * 7) : Infinity;
  }

  const projectedCompletionDate =
    isFinite(estimatedDaysToZero) && estimatedDaysToZero > 0
      ? new Date(localMidnightNow.getTime() + estimatedDaysToZero * 86400000)
      : safeCount === 0
      ? localMidnightNow
      : null;

  const targetYear = config.targetYear || 2026;
  const targetYearDeadline = new Date(targetYear, 11, 31, 23, 59, 59, 999);
  const willFinishByTargetYear =
    projectedCompletionDate !== null &&
    projectedCompletionDate.getTime() <= targetYearDeadline.getTime();

  const daysRemainingToDeadline = Math.max(
    1,
    Math.ceil((targetYearDeadline.getTime() - localMidnightNow.getTime()) / 86400000)
  );

  let requiredRateForTargetYear = 1;
  if (config.mode === 'daily') {
    requiredRateForTargetYear = Math.max(
      1,
      Math.ceil(safeCount / daysRemainingToDeadline)
    );
  } else {
    const weeksRemaining = Math.max(1, daysRemainingToDeadline / 7);
    requiredRateForTargetYear = Math.max(
      1,
      Math.ceil(safeCount / weeksRemaining)
    );
  }

  const burned = startCount - safeCount;
  const percentBurned =
    startCount > 0
      ? Math.min(100, Math.max(0, Math.round((burned / startCount) * 100)))
      : 100;

  return {
    mode: config.mode,
    daysElapsed,
    weeksElapsed,
    daysIntoCurrentWeek,
    targetCount,
    dailyPacingGuide,
    isUnlocked,
    isPacingUnlocked,
    videosLeftToUnlock,
    videosLeftTodayForPace,
    pacingStatus,
    estimatedDaysToZero,
    projectedCompletionDate,
    targetYearDeadline,
    willFinishByTargetYear,
    requiredRateForTargetYear,
    percentBurned,
    currentCount: safeCount,
    startCount,
  };
}

export function formatDateString(d: Date | null): string {
  if (!d) return 'N/A';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}