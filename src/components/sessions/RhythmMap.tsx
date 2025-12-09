import clsx from 'clsx';
import { useMemo, useRef, useState } from 'react';
import { Flag, Sparkles } from 'lucide-react';
import type { SessionIssue, TranscriptSegment, Tag } from '@/types/sessions';

interface RhythmMapProps {
  segments: TranscriptSegment[];
  issues?: SessionIssue[]; // kept for future; not rendered as cues to avoid confusion
  activeSegmentId?: string;
  onSegmentClick?: (segmentId: string) => void;
}

type EventKind = 'filler' | 'pause' | 'hedging' | 'emphasis' | 'unclear' | 'complex';

type EventPoint = {
  id: string;
  timeMs: number;
  kind: EventKind;
  severity: 'low' | 'medium' | 'high';
  label: string;
  segmentId: string;
};

function paceColor(segment: TranscriptSegment) {
  if (segment.kind === 'pause') return 'bg-slate-700/50';
  const has = (kind: string) => segment.tags.some((t) => t.kind === kind);
  if (has('fast')) return 'bg-gradient-to-r from-amber-400 via-amber-300 to-amber-200';
  if (has('slow')) return 'bg-gradient-to-r from-sky-400 via-sky-300 to-sky-200';
  return 'bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-300';
}

function structureColor(segment: TranscriptSegment) {
  if (segment.kind === 'pause') return 'bg-slate-700/30';
  const has = (kind: string) => segment.tags.some((t) => t.kind === kind);
  if (has('structure') || has('good_emphasis'))
    return 'bg-emerald-400/60';
  if (has('hedging') || has('complex_sentence') || has('unclear_point'))
    return 'bg-indigo-400/60';
  return 'bg-white/10';
}

export function RhythmMap({ segments, issues = [], activeSegmentId, onSegmentClick }: RhythmMapProps) {
  const totalDuration = segments.length ? segments[segments.length - 1].endMs : 0;
  const [hoverPct, setHoverPct] = useState<number | null>(null);
  const [hoverEvent, setHoverEvent] = useState<{ point: EventPoint; left: number } | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);

  const events: EventPoint[] = useMemo(() => {
    if (!totalDuration) return [];

    const relevantKinds: EventKind[] = ['filler', 'hedging', 'emphasis', 'unclear', 'complex'];
    const list: EventPoint[] = [];
    segments.forEach((segment) => {
      const mid = segment.startMs + (segment.endMs - segment.startMs) / 2;
      if (segment.kind === 'pause') {
        const pauseTag = segment.tags.find((t) => t.kind === 'long_pause');
        list.push({
          id: `${segment.id}-pause`,
          timeMs: segment.startMs,
          kind: 'pause',
          severity: pauseTag?.severity ?? 'low',
          label: pauseTag?.label ?? 'Pause',
          segmentId: segment.id,
        });
      }
      // Segment-level tags that should be visualized as point events
      segment.tags.forEach((tag) => {
        if (tag.kind === 'filler') {
          list.push({
            id: `${segment.id}-${tag.id}`,
            timeMs: mid,
            kind: 'filler',
            severity: tag.severity,
            label: tag.label,
            segmentId: segment.id,
          });
        }
        if (tag.kind === 'hedging' || tag.kind === 'unclear_point' || tag.kind === 'complex_sentence' || tag.kind === 'good_emphasis') {
          const mapKind: Record<typeof tag.kind, EventKind> = {
            hedging: 'hedging',
            unclear_point: 'unclear',
            complex_sentence: 'complex',
            good_emphasis: 'emphasis',
          };
          const kind = mapKind[tag.kind];
          list.push({
            id: `${segment.id}-${tag.id}`,
            timeMs: mid,
            kind,
            severity: tag.severity,
            label: tag.label,
            segmentId: segment.id,
          });
        }
      });

      // Token-level tags
      const tokens = segment.kind === 'speech' ? segment.tokens : [];
      tokens.forEach((token) => {
        const tokenTime = token.startMs;
        token.tags.forEach((tag) => {
          if (tag.kind === 'filler') {
            list.push({
              id: `${token.id}-${tag.id}`,
              timeMs: tokenTime,
              kind: 'filler',
              severity: tag.severity,
              label: tag.label,
              segmentId: segment.id,
            });
          }
          if (tag.kind === 'hedging' || tag.kind === 'unclear_point' || tag.kind === 'complex_sentence' || tag.kind === 'good_emphasis') {
            const mapKind: Record<typeof tag.kind, EventKind> = {
              hedging: 'hedging',
              unclear_point: 'unclear',
              complex_sentence: 'complex',
              good_emphasis: 'emphasis',
            };
            const kind = mapKind[tag.kind];
            list.push({
              id: `${token.id}-${tag.id}`,
              timeMs: tokenTime,
              kind,
              severity: tag.severity,
              label: tag.label,
              segmentId: segment.id,
            });
          }
        });
      });
    });
    return list;
  }, [segments]);

  const severityColor = {
    high: 'bg-rose-400',
    medium: 'bg-amber-300',
    low: 'bg-emerald-300',
  } as const;

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || !totalDuration) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const pct = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    setHoverPct(pct);
  };

  const hoverTimeLabel =
    hoverPct !== null && totalDuration
      ? `${((hoverPct * totalDuration) / 1000).toFixed(1)}s`
      : undefined;

  return (
    <div className="rounded-2xl border border-white/5 bg-slate-950/70 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Rhythm map</p>
          <p className="text-sm text-slate-300">Pace, structure, pauses, fillers, and cues on one timeline</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-emerald-200">
          <Sparkles className="h-4 w-4" />
          <span>Hover for time · click to sync</span>
        </div>
      </div>

      <div
        ref={timelineRef}
        className="relative mt-4 space-y-3"
        onMouseMove={handleMove}
        onMouseLeave={() => {
          setHoverPct(null);
          setHoverEvent(null);
        }}
      >
        {hoverPct !== null ? (
          <div
            style={{ left: `${hoverPct * 100}%` }}
            className="pointer-events-none absolute inset-y-[-12px] w-px bg-emerald-300/70"
          >
            {hoverTimeLabel ? (
              <div className="absolute -left-6 -top-5 rounded-md bg-slate-800 px-2 py-0.5 text-[10px] text-emerald-100">
                {hoverTimeLabel}
              </div>
            ) : null}
          </div>
        ) : null}

        <Track
          label="Pace"
          segments={segments}
          colorFn={paceColor}
          totalDuration={totalDuration}
          activeSegmentId={activeSegmentId}
          onSegmentClick={onSegmentClick}
        />
        <Track
          label="Structure"
          segments={segments}
          colorFn={structureColor}
          totalDuration={totalDuration}
          activeSegmentId={activeSegmentId}
          onSegmentClick={onSegmentClick}
        />

        <EventsRow
          label="Pauses & events"
          events={events}
          totalDuration={totalDuration}
          severityColor={severityColor}
          onSegmentClick={onSegmentClick}
          onHover={(event) =>
            setHoverEvent(event ? { point: event, left: totalDuration ? (event.timeMs / totalDuration) * 100 : 0 } : null)
          }
        />
      </div>

      {/* Coaching cues timeline removed to reduce confusion; cues stay in the side panel. */}
      <Axis totalDuration={totalDuration} />
      <Legend />

      {hoverEvent ? (
        <div
          className="pointer-events-none absolute z-30 rounded-md bg-slate-800 px-3 py-2 text-xs text-slate-100 shadow-lg"
          style={{ left: `${hoverEvent.left}%`, top: '100%', transform: 'translate(-50%, 8px)' }}
        >
          <div className="flex items-center gap-2">
            <span className={clsx('h-2.5 w-2.5 rounded-full', hoverEvent.point.kind === 'filler' ? severityColor[hoverEvent.point.severity] : 'bg-white/70')} />
            <span className="font-semibold capitalize">{hoverEvent.point.kind}</span>
          </div>
          <p className="mt-1 text-slate-200">{hoverEvent.point.label}</p>
        </div>
      ) : null}
    </div>
  );
}

function Track({
  label,
  segments,
  colorFn,
  totalDuration,
  activeSegmentId,
  onSegmentClick,
}: {
  label: string;
  segments: TranscriptSegment[];
  colorFn: (segment: TranscriptSegment) => string;
  totalDuration: number;
  activeSegmentId?: string;
  onSegmentClick?: (segmentId: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-16 text-xs uppercase tracking-[0.14em] text-slate-400">{label}</div>
      <div className="relative flex h-7 flex-1 items-center overflow-hidden rounded-xl border border-white/5 bg-slate-900/60">
        {segments.map((segment) => {
          const left = totalDuration ? (segment.startMs / totalDuration) * 100 : 0;
          const width = totalDuration ? ((segment.endMs - segment.startMs) / totalDuration) * 100 : 0;
          const isActive = activeSegmentId === segment.id;
          return (
            <button
              key={segment.id}
              style={{ left: `${left}%`, width: `${width}%` }}
              className={clsx(
                'absolute inset-y-0 transition-all hover:brightness-110',
                colorFn(segment),
                isActive && 'ring-2 ring-emerald-300 shadow-soft',
              )}
              onClick={() => onSegmentClick?.(segment.id)}
              aria-label={`${label} segment ${segment.id}`}
            >
              {segment.kind === 'pause' ? <span className="absolute inset-0 bg-slate-900/50" /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EventsRow({
  label,
  events,
  totalDuration,
  severityColor,
  onSegmentClick,
  onHover,
}: {
  label: string;
  events: EventPoint[];
  totalDuration: number;
  severityColor: Record<'low' | 'medium' | 'high', string>;
  onSegmentClick?: (segmentId: string) => void;
  onHover?: (event: EventPoint | null) => void;
}) {
  const kindColor: Record<EventKind, string> = {
    pause: 'bg-slate-400/80',
    filler: severityColor.medium,
    hedging: 'bg-indigo-300',
    emphasis: 'bg-emerald-300',
    unclear: 'bg-amber-300',
    complex: 'bg-amber-200',
  };

  return (
    <div className="flex items-center gap-3">
      <div className="w-16 text-xs uppercase tracking-[0.14em] text-slate-400">{label}</div>
      <div className="relative flex h-10 flex-1 items-center rounded-xl border border-white/5 bg-slate-900/60">
        {events.map((event) => {
          const left = totalDuration ? (event.timeMs / totalDuration) * 100 : 0;
          return (
            <button
              key={event.id}
              style={{ left: `${left}%` }}
              className={clsx(
                'absolute -translate-x-1/2 rounded-full border border-white/30 transition hover:scale-110',
                event.kind === 'pause' ? 'h-4 w-4' : 'h-3.5 w-3.5',
                event.kind === 'filler' ? severityColor[event.severity] : kindColor[event.kind],
              )}
              onClick={() => onSegmentClick?.(event.segmentId)}
              onMouseEnter={() => onHover?.(event)}
              onMouseLeave={() => onHover?.(null)}
              aria-label={`${event.kind} at ${(event.timeMs / 1000).toFixed(1)}s`}
            />
          );
        })}
        {!events.length ? (
          <div className="absolute inset-0 grid place-items-center text-xs text-slate-500">No events flagged</div>
        ) : null}
      </div>
    </div>
  );
}

function IssueMarkers({
  segments,
  issues,
  totalDuration,
}: {
  segments: TranscriptSegment[];
  issues: SessionIssue[];
  totalDuration: number;
}) {
  if (!issues.length || !totalDuration) return null;

  const severityColor = {
    high: 'bg-rose-400',
    medium: 'bg-amber-300',
    low: 'bg-emerald-300',
  } as const;

  const markers = issues.map((issue) => {
    const firstSeg = segments.find((seg) => seg.id === issue.segmentIds[0]);
    const start = firstSeg ? (firstSeg.startMs / totalDuration) * 100 : 0;
    return { id: issue.id, start, severity: issue.severity, label: issue.kind };
  });

  return (
    <div className="relative mt-3 h-8 overflow-hidden rounded-xl border border-white/5 bg-slate-900/80 px-2">
      <div className="flex items-center gap-2 text-xs text-slate-300">
        <Flag className="h-4 w-4 text-emerald-200" />
        Coaching cues on timeline
      </div>
      {markers.map((marker) => (
        <div
          key={marker.id}
          style={{ left: `${marker.start}%` }}
          className={clsx(
            'absolute bottom-1 h-3 w-3 -translate-x-1/2 rotate-45 rounded-sm',
            severityColor[marker.severity],
          )}
          title={marker.label}
        />
      ))}
    </div>
  );
}

function Axis({ totalDuration }: { totalDuration: number }) {
  if (!totalDuration) return null;
  const ticks = 5;
  const values = Array.from({ length: ticks + 1 }, (_, i) => (totalDuration / 1000) * (i / ticks));
  return (
    <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
      <div className="w-16" />
      <div className="relative flex flex-1 items-center">
        <div className="absolute inset-0 border-t border-dashed border-white/10" />
        {values.map((seconds, i) => (
          <div key={i} style={{ left: `${(i / ticks) * 100}%` }} className="absolute -translate-x-1/2">
            <div className="h-2 w-px bg-white/30" />
            <div className="mt-1 text-[10px] text-slate-400">{seconds.toFixed(0)}s</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Legend() {
  const entries = [
    { color: 'bg-amber-400', label: 'Fast (pace band)' },
    { color: 'bg-sky-400', label: 'Slow (pace band)' },
    { color: 'bg-emerald-300', label: 'Structure / emphasis (band)' },
    { color: 'bg-indigo-300', label: 'Hedging / unclear (band)' },
    { color: 'bg-slate-500', label: 'Pause (event)' },
    { color: 'bg-rose-400', label: 'Filler (event)' },
    { color: 'bg-indigo-300', label: 'Hedging (event)' },
    { color: 'bg-emerald-300', label: 'Emphasis (event)' },
    { color: 'bg-amber-300', label: 'Unclear / complex (event)' },
  ];
  return (
    <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-300">
      {entries.map((entry) => (
        <span key={entry.label} className="inline-flex items-center gap-2 rounded-full bg-white/5 px-2.5 py-1">
          <span className={`h-3 w-3 rounded-full ${entry.color}`} />
          {entry.label}
        </span>
      ))}
    </div>
  );
}
