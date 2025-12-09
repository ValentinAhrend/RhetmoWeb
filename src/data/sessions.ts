import { MOCK_SESSIONS, getMockSessionById } from '@/mock/mockSession';
import type { Session } from '@/mock/sessionTypes';

const delay = (ms = 160) => new Promise((resolve) => setTimeout(resolve, ms));

export async function listSessions(): Promise<Session[]> {
  await delay();
  return [...MOCK_SESSIONS].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function fetchSessionById(id: string): Promise<Session | undefined> {
  await delay();
  return getMockSessionById(id);
}
