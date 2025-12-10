import { MOCK_SESSIONS, getMockSessionById } from '@/mock/mockSession';
import { fetchLiveSession, fetchAnalyzedSession } from '@/api/index';
import type { Session } from '@/types/sessions';
import { withDerivedMetrics } from '@/utils/metrics';

// Configuration: Set to true to use real backend, false for mock data only
const USE_BACKEND = true;

// Special ID for live/current session from backend
export const LIVE_SESSION_ID = 'live-session';

const delay = (ms = 160) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * List all sessions - combines mock sessions with live backend session if available
 */
export async function listSessions(): Promise<Session[]> {
  const sessions: Session[] = [];

  // Try to fetch live session from backend
  if (USE_BACKEND) {
    try {
      const liveSession = await fetchLiveSession();
      if (liveSession) {
        // Add the live session with a special marker
        sessions.push({
          ...withDerivedMetrics(liveSession),
          id: liveSession.id, // Keep original ID from backend
        });
      }
    } catch (error) {
      console.error('Failed to fetch live session:', error);
    }
  }

  // Add mock sessions for development/testing
  await delay();
  const mockSessions = MOCK_SESSIONS.map(withDerivedMetrics);
  sessions.push(...mockSessions);

  // Sort by creation date (newest first)
  return sessions.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Fetch a single session by ID
 */
export async function fetchSessionById(id: string): Promise<Session | undefined> {
  // Check if this is a live session request
  if (USE_BACKEND && id === LIVE_SESSION_ID) {
    try {
      const liveSession = await fetchLiveSession();
      if (liveSession) {
        return withDerivedMetrics(liveSession);
      }
    } catch (error) {
      console.error('Failed to fetch live session:', error);
    }
  }

  // Try to fetch from backend by matching ID
  if (USE_BACKEND) {
    try {
      const liveSession = await fetchLiveSession();
      if (liveSession && liveSession.id === id) {
        return withDerivedMetrics(liveSession);
      }
    } catch (error) {
      console.error('Failed to fetch session from backend:', error);
    }
  }

  // Fall back to mock data
  await delay();
  const session = getMockSessionById(id);
  return session ? withDerivedMetrics(session) : undefined;
}

/**
 * Fetch the latest live/in-progress session from backend
 */
export async function fetchCurrentLiveSession(): Promise<Session | null> {
  if (!USE_BACKEND) return null;
  
  try {
    const liveSession = await fetchLiveSession();
    if (liveSession) {
      return withDerivedMetrics(liveSession);
    }
  } catch (error) {
    console.error('Failed to fetch current live session:', error);
  }
  
  return null;
}

/**
 * Fetch analyzed session data (completed analysis)
 */
export async function fetchLatestAnalysis(): Promise<Session | null> {
  if (!USE_BACKEND) return null;

  try {
    const analysis = await fetchAnalyzedSession();
    if (analysis) {
      // Create a session object from the analysis
      const session: Session = {
        id: 'analyzed-session',
        userId: 'user-1',
        title: 'Latest Analysis',
        mode: 'practice',
        context: 'other',
        createdAt: new Date().toISOString(),
        analysisStatus: 'ready',
        analysis,
      };
      return withDerivedMetrics(session);
    }
  } catch (error) {
    console.error('Failed to fetch latest analysis:', error);
  }

  return null;
}
