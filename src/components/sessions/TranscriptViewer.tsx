import { useMemo, useState } from 'react';
import { Headphones } from 'lucide-react';
import { TranscriptSegmentRow } from './TranscriptSegmentRow';
import { RhythmMap } from './RhythmMap';
import type { ViewMode } from './ViewModeToggle';
import { ViewModeToggle } from './ViewModeToggle';
import type { Session, TranscriptSegment } from '@/types/sessions';

interface TranscriptViewerProps {
  session: Session;
  activeView: ViewMode;
  onViewChange: (mode: ViewMode) => void;
  onSegmentClick?: (segmentId: string) => void;
  onTokenClick?: (tokenId: string) => void;
  activeSegmentId?: string;
}

export function TranscriptViewer({
  session,
  activeView,
  onViewChange,
  onSegmentClick,
  onTokenClick,
  activeSegmentId,
}: TranscriptViewerProps) {
  const [localSegment, setLocalSegment] = useState<string | undefined>();
  const selectedSegment = activeSegmentId ?? localSegment;

  const segments: TranscriptSegment[] = useMemo(() => session.analysis?.segments ?? [], [session]);
  const issues = session.analysis?.issues ?? [];

  // Count highlights for the legend
  const highlightCounts = useMemo(() => {
    const counts = { fillers: 0, fast: 0, slow: 0, pauses: 0 };
    segments.forEach(seg => {
      if (seg.kind === 'pause' && seg.tags.some(t => t.kind === 'long_pause')) counts.pauses++;
      seg.tags.forEach(tag => {
        if (tag.kind === 'filler') counts.fillers++;
        if (tag.kind === 'fast') counts.fast++;
        if (tag.kind === 'slow') counts.slow++;
      });
    });
    return counts;
  }, [segments]);

  if (!session.analysis) {
    return (
      <div className="rounded-2xl border border-white/5 bg-white/5 p-6 text-slate-300">
        Analysis pending. Once ready, transcript, pacing, and filler highlights will appear here.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ViewModeToggle value={activeView} onChange={onViewChange} />
        <div className="flex items-center gap-2">
          {session.audioUrl && (
            <button className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-emerald-400/40 hover:bg-emerald-500/10 hover:text-white">
              <Headphones className="h-4 w-4" />
              Play audio
            </button>
          )}
        </div>
      </div>

      {/* Quick highlight legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-3">
          {highlightCounts.fillers > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              {highlightCounts.fillers} fillers
            </span>
          )}
          {highlightCounts.fast > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              {highlightCounts.fast} fast
            </span>
          )}
          {highlightCounts.slow > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              {highlightCounts.slow} slow
            </span>
          )}
        </div>
      </div>

      {/* Rhythm map */}
      <RhythmMap
        segments={segments}
        issues={issues}
        activeSegmentId={selectedSegment}
        onSegmentClick={(id) => {
          setLocalSegment(id);
          onSegmentClick?.(id);
        }}
      />

      {/* Main transcript container */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-b from-slate-900/80 to-slate-950/90 backdrop-blur-sm">
        {/* Subtle ambient glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(52,211,153,0.04),transparent_50%)]" />

        {/* Timeline and content */}
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[26px] top-4 bottom-4 w-px bg-gradient-to-b from-slate-700 via-slate-800 to-transparent" />

          {/* Transcript segments */}
          <div className="space-y-1 p-4 pl-10">
            {segments.map((segment) => (
              <TranscriptSegmentRow
                key={segment.id}
                segment={segment}
                activeView={activeView}
                active={segment.id === selectedSegment}
                withTimeline
                onSegmentClick={(id) => {
                  setLocalSegment(id);
                  onSegmentClick?.(id);
                }}
                onTokenClick={onTokenClick}
              />
            ))}
          </div>
        </div>

        {/* Bottom fade */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-slate-950/80 to-transparent" />
      </div>
    </div>
  );
}
