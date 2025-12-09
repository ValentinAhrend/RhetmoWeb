import { MOCK_SESSIONS, getMockSessionById } from '@/mock/mockSession';
import type { Session } from '@/types/sessions';
import { withDerivedMetrics } from '@/utils/metrics';

const delay = (ms = 160) => new Promise((resolve) => setTimeout(resolve, ms));

export async function listSessions(): Promise<Session[]> {
  await delay();
  return [...MOCK_SESSIONS]
    .map(withDerivedMetrics)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function fetchSessionById(id: string): Promise<Session | undefined> {
  await delay();
  const session = getMockSessionById(id);
  return session ? withDerivedMetrics(session) : undefined;
}
