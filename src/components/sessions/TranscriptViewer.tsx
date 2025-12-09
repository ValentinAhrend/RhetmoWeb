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

  if (!session.analysis) {
    return (
      <div className="rounded-3xl border border-white/5 bg-white/5 p-6 text-slate-300">
        Analysis pending. Once ready, transcript, pacing, and filler highlights will appear here.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ViewModeToggle value={activeView} onChange={onViewChange} />
        {session.audioUrl ? (
          <button className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-100 transition hover:border-emerald-300/40 hover:bg-emerald-500/10">
            <Headphones className="h-4 w-4" />
            Audio ready
          </button>
        ) : null}
      </div>

      <RhythmMap
        segments={segments}
        issues={issues}
        activeSegmentId={selectedSegment}
        onSegmentClick={(id) => {
          setLocalSegment(id);
          onSegmentClick?.(id);
        }}
      />
      <Legend activeView={activeView} />

      <div className="space-y-3">
        {segments.map((segment) => (
          <TranscriptSegmentRow
            key={segment.id}
            segment={segment}
            activeView={activeView}
            active={segment.id === selectedSegment}
            onSegmentClick={(id) => {
              setLocalSegment(id);
              onSegmentClick?.(id);
            }}
            onTokenClick={onTokenClick}
          />
        ))}
      </div>
    </div>
  );
}

function Legend({ activeView }: { activeView: ViewMode }) {
  const entries =
    activeView === 'speed'
      ? [
          { label: 'Fast', color: 'bg-amber-400' },
          { label: 'Slow', color: 'bg-sky-400' },
        ]
      : activeView === 'fillers'
      ? [{ label: 'Filler words', color: 'bg-rose-400' }]
      : activeView === 'pauses'
      ? [{ label: 'Long pauses', color: 'bg-slate-200' }]
      : activeView === 'structure'
      ? [{ label: 'Structure cues', color: 'bg-emerald-400' }]
      : [
          { label: 'Fast', color: 'bg-amber-400' },
          { label: 'Fillers', color: 'bg-rose-400' },
          { label: 'Pauses', color: 'bg-slate-200' },
        ];

  return (
    <div className="flex flex-wrap gap-3 text-xs text-slate-300">
      {entries.map((entry) => (
        <span key={entry.label} className="inline-flex items-center gap-2 rounded-full bg-white/5 px-2.5 py-1">
          <span className={`h-3 w-3 rounded-full ${entry.color}`} />
          {entry.label}
        </span>
      ))}
    </div>
  );
}
