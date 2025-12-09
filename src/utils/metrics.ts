import type { Session, TranscriptSegment } from '@/types/sessions';

function countWordsInText(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

function countWordsInSegment(segment: TranscriptSegment): number {
  if (segment.kind === 'pause') return 0;
  if (segment.tokens && segment.tokens.length) return segment.tokens.length;
  return countWordsInText(segment.text);
}

function countFillersInSegment(segment: TranscriptSegment): number {
  if (segment.kind === 'pause' || !segment.tokens) return 0;
  return segment.tokens.reduce(
    (sum, token) => sum + token.tags.filter((tag) => tag.kind === 'filler').length,
    0,
  );
}

function computeDurationSec(segments: TranscriptSegment[], fallbackSec?: number): number {
  if (!segments.length) return fallbackSec ?? 0;
  const { minStart, maxEnd } = segments.reduce(
    (acc, seg) => ({
      minStart: Math.min(acc.minStart, seg.startMs),
      maxEnd: Math.max(acc.maxEnd, seg.endMs),
    }),
    { minStart: Number.POSITIVE_INFINITY, maxEnd: 0 },
  );

  if (!Number.isFinite(minStart) || maxEnd <= minStart) {
    return fallbackSec ?? 0;
  }

  return (maxEnd - minStart) / 1000;
}

export function withDerivedMetrics(session: Session): Session {
  if (!session.analysis) return session;

  const { segments, metrics } = session.analysis;
  const durationSec = computeDurationSec(segments, session.durationSec);
  const totalWords = segments.reduce((sum, segment) => sum + countWordsInSegment(segment), 0);
  const avgWpm = durationSec > 0 ? (totalWords / durationSec) * 60 : 0;
  const fillerCount = segments.reduce((sum, segment) => sum + countFillersInSegment(segment), 0);
  const fillerPerMinute = durationSec > 0 ? fillerCount / (durationSec / 60) : 0;

  return {
    ...session,
    durationSec,
    analysis: {
      ...session.analysis,
      metrics: {
        ...metrics,
        durationSec,
        totalWords,
        avgWpm,
        fillerCount,
        fillerPerMinute,
      },
    },
  };
}
