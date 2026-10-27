import { PlaylistStatus } from '../types';
import { extractPlaylistId } from './engine';

interface CacheEntry {
  count: number;
  title?: string;
  timestamp: number;
}

const CACHE_TTL_MS = 60 * 1000; // 60 seconds client-side cache
const memoryCache: Record<string, CacheEntry> = {};

export interface FetchPlaylistOptions {
  forceRefresh?: boolean;
  demoMode?: boolean;
  demoCount?: number;
}

export async function fetchPlaylistStatus(
  rawPlaylistId: string,
  apiKey: string,
  options: FetchPlaylistOptions = {}
): Promise<PlaylistStatus> {
  const { forceRefresh = false, demoMode = false, demoCount = 505 } = options;

  if (demoMode) {
    return {
      count: Math.max(0, demoCount),
      title: 'Demo Burn Queue (Simulated)',
      lastFetched: Date.now(),
      isCached: false,
      error: null,
    };
  }

  const cleanPlaylistId = extractPlaylistId(rawPlaylistId);

  if (!cleanPlaylistId) {
    return {
      count: 0,
      title: 'No Playlist Configured',
      lastFetched: Date.now(),
      isCached: false,
      error: 'Please enter a valid YouTube Playlist ID or URL in Settings.',
    };
  }

  if (cleanPlaylistId === 'WL' || cleanPlaylistId.toLowerCase() === 'watchlater') {
    return {
      count: 0,
      title: 'Watch Later Playlist (Blocked)',
      lastFetched: Date.now(),
      isCached: false,
      error:
        "YouTube's API forbids accessing the private 'Watch Later' (WL) playlist. Please create a custom Unlisted or Public playlist (e.g., 'Burn Queue') instead.",
    };
  }

  if (!apiKey || apiKey.trim() === '') {
    return {
      count: 0,
      title: 'API Key Missing',
      lastFetched: Date.now(),
      isCached: false,
      error:
        'YouTube Data API key is missing. Add your key in Settings or enable Demo Mode.',
    };
  }

  const now = Date.now();
  const cached = memoryCache[cleanPlaylistId];

  if (!forceRefresh && cached && now - cached.timestamp < CACHE_TTL_MS) {
    return {
      count: cached.count,
      title: cached.title,
      lastFetched: cached.timestamp,
      isCached: true,
      error: null,
    };
  }

  try {
    const url = `https://www.googleapis.com/youtube/v3/playlists?part=contentDetails,snippet&id=${encodeURIComponent(
      cleanPlaylistId
    )}&key=${encodeURIComponent(apiKey.trim())}`;

    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok) {
      const apiMessage = data?.error?.message || `YouTube API returned status ${res.status}`;
      return {
        count: cached ? cached.count : 0,
        title: cached?.title,
        lastFetched: now,
        isCached: false,
        error: `YouTube API Error: ${apiMessage}`,
      };
    }

    if (!data.items || data.items.length === 0) {
      return {
        count: cached ? cached.count : 0,
        title: cached?.title,
        lastFetched: now,
        isCached: false,
        error:
          'Playlist not found or set to Private. Ensure the playlist visibility is set to Unlisted or Public.',
      };
    }

    const item = data.items[0];
    const count = item?.contentDetails?.itemCount ?? 0;
    const title = item?.snippet?.title || 'YouTube Playlist';

    memoryCache[cleanPlaylistId] = {
      count,
      title,
      timestamp: now,
    };

    return {
      count,
      title,
      lastFetched: now,
      isCached: false,
      error: null,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network failure';
    return {
      count: cached ? cached.count : 0,
      title: cached?.title,
      lastFetched: now,
      isCached: false,
      error: `Failed to connect to YouTube: ${message}`,
    };
  }
}