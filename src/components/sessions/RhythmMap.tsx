import clsx from 'clsx';
import { useMemo, useRef, useState } from 'react';
import type { SessionIssue, TranscriptSegment } from '@/types/sessions';

interface RhythmMapProps {
  segments: TranscriptSegment[];
  issues?: SessionIssue[];
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

// Pace states for visualization
type PaceState = 'fast' | 'normal' | 'slow' | 'pause';

function getPaceState(segment: TranscriptSegment): PaceState {
  if (segment.kind === 'pause') return 'pause';
  const has = (kind: string) => segment.tags.some((t) => t.kind === kind);
  if (has('fast')) return 'fast';
  if (has('slow')) return 'slow';
  return 'normal';
}

// Structure states for visualization  
type StructureState = 'strong' | 'neutral' | 'weak' | 'pause';

function getStructureState(segment: TranscriptSegment): StructureState {
  if (segment.kind === 'pause') return 'pause';
  const has = (kind: string) => segment.tags.some((t) => t.kind === kind);
  if (has('structure') || has('good_emphasis')) return 'strong';
  if (has('hedging') || has('complex_sentence') || has('unclear_point')) return 'weak';
  return 'neutral';
}

export function RhythmMap({ segments, issues = [], activeSegmentId, onSegmentClick }: RhythmMapProps) {
  const totalDuration = segments.length ? segments[segments.length - 1].endMs : 0;
  const [hoverPct, setHoverPct] = useState<number | null>(null);
  const [hoverEvent, setHoverEvent] = useState<EventPoint | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);

  const events: EventPoint[] = useMemo(() => {
    if (!totalDuration) return [];

    const list: EventPoint[] = [];
    segments.forEach((segment) => {
      const mid = segment.startMs + (segment.endMs - segment.startMs) / 2;
      
      // Long pauses as events
      if (segment.kind === 'pause') {
        const pauseTag = segment.tags.find((t) => t.kind === 'long_pause');
        if (pauseTag) {
          list.push({
            id: `${segment.id}-pause`,
            timeMs: segment.startMs,
            kind: 'pause',
            severity: pauseTag.severity,
            label: pauseTag.label,
            segmentId: segment.id,
          });
        }
      }

      // Segment-level tags
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
        if (['hedging', 'unclear_point', 'complex_sentence', 'good_emphasis'].includes(tag.kind)) {
          const mapKind: Record<string, EventKind> = {
            hedging: 'hedging',
            unclear_point: 'unclear',
            complex_sentence: 'complex',
            good_emphasis: 'emphasis',
          };
          list.push({
            id: `${segment.id}-${tag.id}`,
            timeMs: mid,
            kind: mapKind[tag.kind],
            severity: tag.severity,
            label: tag.label,
            segmentId: segment.id,
          });
        }
      });

      // Token-level tags
      const tokens = segment.kind === 'speech' ? segment.tokens : [];
      tokens.forEach((token) => {
        token.tags.forEach((tag) => {
          if (tag.kind === 'filler') {
            list.push({
              id: `${token.id}-${tag.id}`,
              timeMs: token.startMs,
              kind: 'filler',
              severity: tag.severity,
              label: tag.label,
              segmentId: segment.id,
            });
          }
        });
      });
    });
    return list;
  }, [segments, totalDuration]);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || !totalDuration) return;
    const rect = timelineRef.current.getBoundingClientRect();
    // Account for the label width (60px) + gap (12px) = 72px offset
    const labelOffset = 72;
    const trackWidth = rect.width - labelOffset;
    const mouseX = e.clientX - rect.left - labelOffset;
    const pct = Math.min(Math.max(mouseX / trackWidth, 0), 1);
    setHoverPct(pct);
  };

  const hoverTimeMs = hoverPct !== null && totalDuration ? hoverPct * totalDuration : null;
  const hoverTimeLabel = hoverTimeMs !== null ? formatTime(hoverTimeMs) : undefined;

  // Find hovered segment
  const hoveredSegment = hoverTimeMs !== null 
    ? segments.find(s => s.startMs <= hoverTimeMs && s.endMs >= hoverTimeMs)
    : null;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-slate-900/50 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-medium text-slate-200">Session Timeline</h3>
          <span className="text-xs text-slate-500">{formatTime(totalDuration)} total</span>
        </div>
        <div className="flex items-center gap-4 text-[10px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" /> Fast
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> Good
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-400" /> Slow
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-400" /> Issue
          </span>
        </div>
      </div>

      {/* Timeline tracks */}
      <div
        ref={timelineRef}
        className="relative space-y-2"
        onMouseMove={handleMove}
        onMouseLeave={() => {
          setHoverPct(null);
          setHoverEvent(null);
        }}
      >
        {/* Hover line */}
        {hoverPct !== null && (
          <div
            style={{ left: `calc(72px + (100% - 72px) * ${hoverPct})` }}
            className="pointer-events-none absolute top-0 bottom-0 z-20 w-px bg-white/40"
          >
            <div className="absolute left-1/2 -translate-x-1/2 -top-6 rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-[10px] text-white whitespace-nowrap">
              {hoverTimeLabel}
            </div>
          </div>
        )}

        {/* Pace Track */}
        <PaceTrack
          segments={segments}
          totalDuration={totalDuration}
          activeSegmentId={activeSegmentId}
          onSegmentClick={onSegmentClick}
        />

        {/* Structure Track */}
        <StructureTrack
          segments={segments}
          totalDuration={totalDuration}
          activeSegmentId={activeSegmentId}
          onSegmentClick={onSegmentClick}
        />

        {/* Events Track */}
        <EventsTrack
          events={events}
          totalDuration={totalDuration}
          onSegmentClick={onSegmentClick}
          onHover={setHoverEvent}
          hoveredEvent={hoverEvent}
        />
      </div>

      {/* Time axis */}
      <TimeAxis totalDuration={totalDuration} />

      {/* Hover tooltip for events */}
      {hoverEvent && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          <span className={clsx(
            'w-2 h-2 rounded-full',
            hoverEvent.kind === 'filler' && 'bg-rose-400',
            hoverEvent.kind === 'pause' && 'bg-slate-400',
            hoverEvent.kind === 'emphasis' && 'bg-emerald-400',
            hoverEvent.kind === 'hedging' && 'bg-amber-400',
            ['unclear', 'complex'].includes(hoverEvent.kind) && 'bg-amber-400',
          )} />
          <span className="text-slate-300 font-medium capitalize">{hoverEvent.kind}</span>
          <span className="text-slate-500">at {formatTime(hoverEvent.timeMs)}</span>
          <span className="text-slate-400">— {hoverEvent.label}</span>
        </div>
      )}
    </div>
  );
}

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return min > 0 ? `${min}:${sec.toString().padStart(2, '0')}` : `${sec}s`;
}

// Pace visualization track
function PaceTrack({
  segments,
  totalDuration,
  activeSegmentId,
  onSegmentClick,
}: {
  segments: TranscriptSegment[];
  totalDuration: number;
  activeSegmentId?: string;
  onSegmentClick?: (segmentId: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-[60px] text-[11px] font-medium text-slate-400 text-right">Pace</span>
      <div className="relative flex-1 h-6 rounded-md overflow-hidden bg-slate-800/60">
        {segments.map((segment) => {
          const left = totalDuration ? (segment.startMs / totalDuration) * 100 : 0;
          const width = totalDuration ? ((segment.endMs - segment.startMs) / totalDuration) * 100 : 0;
          const paceState = getPaceState(segment);
          const isActive = activeSegmentId === segment.id;

          return (
            <button
              key={segment.id}
              style={{ left: `${left}%`, width: `${width}%` }}
              className={clsx(
                'absolute inset-y-0 transition-all duration-150',
                paceState === 'fast' && 'bg-amber-500/80',
                paceState === 'normal' && 'bg-emerald-500/60',
                paceState === 'slow' && 'bg-sky-500/70',
                paceState === 'pause' && 'bg-slate-700/50',
                isActive && 'ring-1 ring-white/60 z-10',
                'hover:brightness-125',
              )}
              onClick={() => onSegmentClick?.(segment.id)}
            />
          );
        })}
        {/* Subtle segment dividers */}
        {segments.slice(0, -1).map((segment) => {
          const left = totalDuration ? (segment.endMs / totalDuration) * 100 : 0;
          return (
            <div
              key={`div-${segment.id}`}
              style={{ left: `${left}%` }}
              className="absolute inset-y-0 w-px bg-slate-900/60"
            />
          );
        })}
      </div>
    </div>
  );
}

// Structure visualization track
function StructureTrack({
  segments,
  totalDuration,
  activeSegmentId,
  onSegmentClick,
}: {
  segments: TranscriptSegment[];
  totalDuration: number;
  activeSegmentId?: string;
  onSegmentClick?: (segmentId: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-[60px] text-[11px] font-medium text-slate-400 text-right">Clarity</span>
      <div className="relative flex-1 h-4 rounded-md overflow-hidden bg-slate-800/40">
        {segments.map((segment) => {
          const left = totalDuration ? (segment.startMs / totalDuration) * 100 : 0;
          const width = totalDuration ? ((segment.endMs - segment.startMs) / totalDuration) * 100 : 0;
          const structureState = getStructureState(segment);
          const isActive = activeSegmentId === segment.id;

          return (
            <button
              key={segment.id}
              style={{ left: `${left}%`, width: `${width}%` }}
              className={clsx(
                'absolute inset-y-0 transition-all duration-150',
                structureState === 'strong' && 'bg-emerald-400/50',
                structureState === 'neutral' && 'bg-slate-600/40',
                structureState === 'weak' && 'bg-rose-400/40',
                structureState === 'pause' && 'bg-slate-800/30',
                isActive && 'ring-1 ring-white/50 z-10',
                'hover:brightness-125',
              )}
              onClick={() => onSegmentClick?.(segment.id)}
            />
          );
        })}
      </div>
    </div>
  );
}

// Events/markers track
function EventsTrack({
  events,
  totalDuration,
  onSegmentClick,
  onHover,
  hoveredEvent,
}: {
  events: EventPoint[];
  totalDuration: number;
  onSegmentClick?: (segmentId: string) => void;
  onHover?: (event: EventPoint | null) => void;
  hoveredEvent: EventPoint | null;
}) {
  const eventKindConfig: Record<EventKind, { color: string; icon: string }> = {
    filler: { color: 'bg-rose-400', icon: '•' },
    pause: { color: 'bg-slate-400', icon: '॥' },
    hedging: { color: 'bg-amber-400', icon: '~' },
    emphasis: { color: 'bg-emerald-400', icon: '★' },
    unclear: { color: 'bg-amber-400', icon: '?' },
    complex: { color: 'bg-amber-400', icon: '⚡' },
  };

  // Group overlapping events (within 2% of timeline)
  const groupedEvents = useMemo(() => {
    if (!totalDuration) return [];
    const sorted = [...events].sort((a, b) => a.timeMs - b.timeMs);
    const groups: EventPoint[][] = [];
    
    sorted.forEach(event => {
      const lastGroup = groups[groups.length - 1];
      if (lastGroup) {
        const lastEvent = lastGroup[lastGroup.length - 1];
        const gap = ((event.timeMs - lastEvent.timeMs) / totalDuration) * 100;
        if (gap < 2) {
          lastGroup.push(event);
          return;
        }
      }
      groups.push([event]);
    });
    
    return groups;
  }, [events, totalDuration]);

  return (
    <div className="flex items-center gap-3">
      <span className="w-[60px] text-[11px] font-medium text-slate-400 text-right">Events</span>
      <div className="relative flex-1 h-6 rounded-md bg-slate-800/30 border border-slate-700/30">
        {groupedEvents.map((group, groupIdx) => {
          const firstEvent = group[0];
          const left = totalDuration ? (firstEvent.timeMs / totalDuration) * 100 : 0;
          const isHovered = group.some(e => e.id === hoveredEvent?.id);
          const hasMultiple = group.length > 1;
          
          // Determine dominant type for styling
          const hasFiller = group.some(e => e.kind === 'filler');
          const hasHighSeverity = group.some(e => e.severity === 'high');
          
          return (
            <button
              key={`group-${groupIdx}`}
              style={{ left: `${left}%` }}
              className={clsx(
                'absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-150',
                'flex items-center justify-center',
                hasMultiple ? 'w-5 h-5 rounded-md' : 'w-3 h-3 rounded-full',
                hasFiller ? 'bg-rose-400' : 
                hasHighSeverity ? 'bg-amber-400' :
                eventKindConfig[firstEvent.kind].color,
                isHovered && 'ring-2 ring-white/60 scale-125 z-10',
                'hover:scale-110',
              )}
              onClick={() => onSegmentClick?.(firstEvent.segmentId)}
              onMouseEnter={() => onHover?.(firstEvent)}
              onMouseLeave={() => onHover?.(null)}
            >
              {hasMultiple && (
                <span className="text-[9px] font-bold text-slate-900">{group.length}</span>
              )}
            </button>
          );
        })}
        
        {events.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-600">
            No events detected
          </div>
        )}
      </div>
    </div>
  );
}

// Time axis
function TimeAxis({ totalDuration }: { totalDuration: number }) {
  if (!totalDuration) return null;
  
  const tickCount = 6;
  const ticks = Array.from({ length: tickCount }, (_, i) => ({
    pct: i / (tickCount - 1),
    time: (totalDuration * i) / (tickCount - 1),
  }));

  return (
    <div className="flex items-center gap-3 mt-2">
      <span className="w-[60px]" />
      <div className="relative flex-1 h-4">
        {/* Tick marks */}
        {ticks.map((tick, i) => (
          <div
            key={i}
            style={{ left: `${tick.pct * 100}%` }}
            className="absolute top-0 -translate-x-1/2"
          >
            <div className="w-px h-1.5 bg-slate-700" />
            <span className="absolute top-2 left-1/2 -translate-x-1/2 text-[9px] text-slate-600 whitespace-nowrap">
              {formatTime(tick.time)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
