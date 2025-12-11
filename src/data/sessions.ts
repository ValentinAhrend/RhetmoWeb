import { MOCK_SESSIONS, getMockSessionById } from '@/mock/mockSession';
import { fetchLiveSession, fetchAnalyzedSession, fetchAllConversations } from '@/api/index';
import type { ApiConversationEntry } from '@/api/index';
import type { Session } from '@/types/sessions';
import { withDerivedMetrics } from '@/utils/metrics';

// Configuration: Set to true to use real backend, false for mock data only
const USE_BACKEND = true;

// Special ID for live/current session from backend
export const LIVE_SESSION_ID = 'live-session';

const delay = (ms = 160) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Convert API status to internal analysisStatus
 */
function mapStatus(status: ApiConversationEntry['status']): Session['analysisStatus'] {
  switch (status) {
    case 'recording': return 'processing';
    case 'processing': return 'processing';
    case 'finished': return 'ready';
    default: return 'pending';
  }
}

/**
 * Create a session shell from conversation entry (for list view)
 */
function conversationToSession(conv: ApiConversationEntry): Session {
  const date = new Date(conv.timestamp * 1000);
  return {
    id: conv.conversation_id,
    userId: 'user-1',
    title: `Session ${date.toLocaleDateString()}`,
    mode: 'practice',
    context: 'other',
    createdAt: date.toISOString(),
    startedAt: date.toISOString(),
    durationSec: 0,
    analysisStatus: mapStatus(conv.status),
  };
}

/**
 * List all sessions - fetches from backend dynamic-handler
 */
export async function listSessions(): Promise<Session[]> {
  const sessions: Session[] = [];

  // Fetch all conversations from backend
  if (USE_BACKEND) {
    try {
      const conversations = await fetchAllConversations();
      const backendSessions = conversations.map(conversationToSession);
      sessions.push(...backendSessions.map(withDerivedMetrics));
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    }
  }

  // Add mock sessions for development/testing (only if no backend sessions)
  if (sessions.length === 0) {
    await delay();
    const mockSessions = MOCK_SESSIONS.map(withDerivedMetrics);
    sessions.push(...mockSessions);
  }

  // Sort by creation date (newest first)
  return sessions.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Fetch a single session by ID
 */
export async function fetchSessionById(id: string): Promise<Session | undefined> {
  // First check if it's a backend session
  if (USE_BACKEND) {
    try {
      // Check if the ID exists in our conversation list
      const conversations = await fetchAllConversations();
      const conv = conversations.find(c => c.conversation_id === id);
      
      if (conv) {
        // Found in backend - get full details
        // Use quick-handler for analysis data (currently returns latest, may need backend update)
        const analysis = await fetchAnalyzedSession();
        
        const date = new Date(conv.timestamp * 1000);
        const session: Session = {
          id: conv.conversation_id,
          userId: 'user-1',
          title: `Session ${date.toLocaleDateString()}`,
          mode: 'practice',
          context: 'other',
          createdAt: date.toISOString(),
          startedAt: date.toISOString(),
          durationSec: analysis?.metrics?.durationSec ?? 0,
          analysisStatus: mapStatus(conv.status),
          analysis: conv.status === 'finished' ? analysis ?? undefined : undefined,
        };
        return withDerivedMetrics(session);
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
