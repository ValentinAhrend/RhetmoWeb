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
    title: `Session ${date.toLocaleDateString()}`, // Placeholder, will be replaced by analysis title
    mode: 'practice',
    context: 'other',
    createdAt: date.toISOString(),
    startedAt: date.toISOString(),
    durationSec: 0,
    analysisStatus: mapStatus(conv.status),
  };
}

/**
 * Fetch analysis for a specific conversation and merge into session
 */
async function enrichSessionWithAnalysis(session: Session, status: ApiConversationEntry['status']): Promise<Session> {
  // Only fetch analysis for finished sessions
  if (status !== 'finished') {
    return session;
  }

  try {
    const analysis = await fetchAnalyzedSession(session.id);
    if (analysis) {
      return {
        ...session,
        // Use AI-generated title if available
        title: analysis.title || session.title,
        durationSec: analysis.metrics?.durationSec ?? 0,
        analysis,
      };
    }
  } catch (error) {
    console.error(`Failed to fetch analysis for session ${session.id}:`, error);
  }

  return session;
}

/**
 * List all sessions - fetches from backend dynamic-handler
 */
export async function listSessions(): Promise<Session[]> {
  const sessions: Session[] = [];
  let backendSucceeded = false;

  // Fetch all conversations from backend
  if (USE_BACKEND) {
    try {
      console.log('[listSessions] Fetching conversations from backend...');
      const conversations = await fetchAllConversations();
      console.log(`[listSessions] Got ${conversations.length} conversations from backend`);
      
      if (conversations.length > 0) {
        backendSucceeded = true;
        
        // Convert to sessions and fetch analysis for finished ones (in parallel)
        const backendSessions = await Promise.all(
          conversations.map(async (conv) => {
            const session = conversationToSession(conv);
            const enrichedSession = await enrichSessionWithAnalysis(session, conv.status);
            return withDerivedMetrics(enrichedSession);
          })
        );
        
        sessions.push(...backendSessions);
        console.log(`[listSessions] Processed ${backendSessions.length} backend sessions`);
      }
    } catch (error) {
      console.error('[listSessions] Failed to fetch conversations:', error);
    }
  }

  // Only add mock sessions if backend failed or returned nothing
  // This prevents duplicate/stale data from showing
  if (!backendSucceeded) {
    console.log('[listSessions] Backend unavailable, using mock sessions');
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
        // Found in backend - get full details using conversation_id
        const analysis = await fetchAnalyzedSession(id);
        
        const date = new Date(conv.timestamp * 1000);
        // Use AI-generated title if available, fallback to date-based title
        const sessionTitle = analysis?.title || `Session ${date.toLocaleDateString()}`;
        const session: Session = {
          id: conv.conversation_id,
          userId: 'user-1',
          title: sessionTitle,
          mode: 'practice',
          context: 'other',
          createdAt: date.toISOString(),
          startedAt: date.toISOString(),
          durationSec: analysis?.metrics?.durationSec ?? 0,
          analysisStatus: mapStatus(conv.status),
          analysis: conv.status === 'finished' ? analysis ?? undefined : undefined,
        };
        return withDerivedMetrics(session);
      } else {
        // Conversation not in list, but try to fetch analysis directly
        // This handles cases where the conversation entry failed but analysis exists
        console.log(`[fetchSessionById] Conversation ${id} not in list, trying direct fetch...`);
        const analysis = await fetchAnalyzedSession(id);
        
        if (analysis) {
          console.log(`[fetchSessionById] Found analysis for ${id} directly`);
          const session: Session = {
            id,
            userId: 'user-1',
            title: analysis.title || `Session ${new Date().toLocaleDateString()}`,
            mode: 'practice',
            context: 'other',
            createdAt: new Date().toISOString(),
            startedAt: new Date().toISOString(),
            durationSec: analysis.metrics?.durationSec ?? 0,
            analysisStatus: 'ready',
            analysis,
          };
          return withDerivedMetrics(session);
        }
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
