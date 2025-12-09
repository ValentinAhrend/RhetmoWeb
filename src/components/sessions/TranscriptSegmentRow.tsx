import clsx from 'clsx';
import type { Tag, TranscriptSegment } from '@/types/sessions';
import type { ViewMode } from './ViewModeToggle';

interface TranscriptSegmentRowProps {
  segment: TranscriptSegment;
  activeView: ViewMode;
  active?: boolean;
  onSegmentClick?: (segmentId: string) => void;
  onTokenClick?: (tokenId: string) => void;
}

function msToSeconds(ms: number) {
  return (ms / 1000).toFixed(1) + 's';
}

function tokenHighlight(tags: Tag[], view: ViewMode) {
  if (view === 'fillers' && tags.some((t) => t.kind === 'filler')) {
    return 'bg-rose-500/25 text-rose-50';
  }
  if (view === 'structure' && tags.some((t) => t.kind === 'structure')) {
    return 'bg-emerald-500/25 text-emerald-50';
  }
  return '';
}

function segmentHighlight(segment: TranscriptSegment, view: ViewMode) {
  if (segment.kind === 'pause') {
    return view === 'pauses' ? 'bg-slate-500/25 text-slate-100' : 'text-slate-300';
  }
  const hasTag = (kind: string) => segment.tags.some((t) => t.kind === kind);
  if (view === 'speed' && hasTag('fast')) return 'bg-amber-500/20 text-amber-50';
  if (view === 'speed' && hasTag('slow')) return 'bg-sky-500/20 text-sky-50';
  if (view === 'fillers' && hasTag('filler')) return 'bg-rose-500/20 text-rose-50';
  if (view === 'structure' && hasTag('structure')) return 'bg-emerald-500/20 text-emerald-50';
  return '';
}

function segmentSeverityRing(segment: TranscriptSegment) {
  const high = segment.tags.some((t) => t.severity === 'high');
  const medium = segment.tags.some((t) => t.severity === 'medium');
  if (high) return 'ring-2 ring-rose-400/60';
  if (medium) return 'ring-1 ring-amber-300/60';
  return '';
}

export function TranscriptSegmentRow({
  segment,
  activeView,
  active,
  onSegmentClick,
  onTokenClick,
}: TranscriptSegmentRowProps) {
  const segmentClass = clsx(
    'group rounded-2xl border border-white/5 px-4 py-3 transition hover:border-emerald-400/30',
    segmentHighlight(segment, activeView),
    active && 'border-emerald-300/70 bg-emerald-500/10',
    segmentSeverityRing(segment),
  );

  if (segment.kind === 'pause') {
    const duration = msToSeconds(segment.endMs - segment.startMs);
    return (
      <div className={segmentClass} onClick={() => onSegmentClick?.(segment.id)}>
        <p className="text-sm text-slate-300">
          <span className="mr-2 text-xs uppercase tracking-[0.15em] text-slate-400">Pause</span>
          ({duration})
        </p>
      </div>
    );
  }

  const tokens = segment.tokens ?? [];
  return (
    <div className={segmentClass} onClick={() => onSegmentClick?.(segment.id)}>
      <div className="flex items-start gap-3">
        <div className="pt-0.5 text-xs text-slate-400">{msToSeconds(segment.startMs)}</div>
        <div className="flex-1 space-y-2">
          <p className="leading-7 text-slate-100">
            {tokens.length > 0
              ? tokens.map((token) => (
                  <button
                    key={token.id}
                    className={clsx('rounded-md px-0.5', tokenHighlight(token.tags, activeView))}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTokenClick?.(token.id);
                    }}
                  >
                    {token.text}
                  </button>
                ))
              : segment.text}
          </p>
          {segment.tags.length ? (
            <div className="flex flex-wrap gap-2 text-xs text-slate-300">
              {segment.tags.map((tag) => (
                <span
                  key={tag.id}
                  className={clsx(
                    'rounded-full border px-2 py-1',
                    tag.kind === 'fast' && 'border-amber-300/60 text-amber-100',
                    tag.kind === 'slow' && 'border-sky-300/60 text-sky-100',
                    tag.kind === 'filler' && 'border-rose-300/60 text-rose-100',
                    tag.kind === 'structure' && 'border-emerald-300/60 text-emerald-100',
                    tag.kind === 'hedging' && 'border-slate-300/60 text-slate-200',
                  )}
                >
                  {tag.label}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
