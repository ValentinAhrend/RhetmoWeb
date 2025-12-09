import { useState } from 'react';
import clsx from 'clsx';
import type { Tag, TranscriptSegment, TranscriptToken } from '@/types/sessions';
import type { ViewMode } from './ViewModeToggle';

interface TranscriptSegmentRowProps {
  segment: TranscriptSegment;
  activeView: ViewMode;
  active?: boolean;
  onSegmentClick?: (segmentId: string) => void;
  onTokenClick?: (tokenId: string) => void;
  withTimeline?: boolean;
}

function msToTimestamp(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

// Get highlight style based on token tags and current view mode
function getTokenHighlightStyle(tags: Tag[], view: ViewMode): {
  className: string;
  tooltip?: string;
  severity?: 'low' | 'medium' | 'high';
} | null {
  const fillerTag = tags.find(t => t.kind === 'filler');
  const hedgingTag = tags.find(t => t.kind === 'hedging');
  const structureTag = tags.find(t => t.kind === 'structure');
  const emphasisTag = tags.find(t => t.kind === 'good_emphasis');

  // Fillers view - highlight filler words
  if (view === 'fillers' && fillerTag) {
    return {
      className: 'bg-rose-500/40 text-white rounded px-0.5 -mx-0.5 decoration-rose-400 underline underline-offset-4 decoration-2',
      tooltip: fillerTag.label,
      severity: fillerTag.severity,
    };
  }

  // Structure view - highlight structural elements
  if (view === 'structure' && structureTag) {
    return {
      className: 'bg-emerald-500/30 text-emerald-100 rounded px-0.5 -mx-0.5',
      tooltip: structureTag.label,
      severity: structureTag.severity,
    };
  }

  // Default view shows all issues subtly
  if (view === 'default') {
    if (fillerTag) {
      return {
        className: 'text-rose-300 decoration-rose-400/60 underline underline-offset-4 decoration-wavy decoration-1',
        tooltip: fillerTag.label,
        severity: fillerTag.severity,
      };
    }
    if (hedgingTag) {
      return {
        className: 'text-amber-200 decoration-amber-400/50 underline underline-offset-4 decoration-dotted decoration-1',
        tooltip: hedgingTag.label,
        severity: hedgingTag.severity,
      };
    }
    if (emphasisTag) {
      return {
        className: 'text-emerald-300 font-medium',
        tooltip: emphasisTag.label,
        severity: emphasisTag.severity,
      };
    }
  }

  return null;
}

// Get segment-level styling based on tags and view
function getSegmentStyle(segment: TranscriptSegment, view: ViewMode, active: boolean) {
  if (segment.kind === 'pause') {
    return 'bg-slate-900/40 border-slate-700/30';
  }

  const hasTag = (kind: string) => segment.tags.some(t => t.kind === kind);
  const highSeverity = segment.tags.some(t => t.severity === 'high');
  const mediumSeverity = segment.tags.some(t => t.severity === 'medium');

  let base = 'bg-slate-900/20 border-slate-800/30';

  if (view === 'speed') {
    if (hasTag('fast')) base = 'bg-amber-950/30 border-amber-500/20';
    if (hasTag('slow')) base = 'bg-sky-950/30 border-sky-500/20';
  } else if (view === 'fillers' && hasTag('filler')) {
    base = 'bg-rose-950/20 border-rose-500/20';
  } else if (view === 'structure' && hasTag('structure')) {
    base = 'bg-emerald-950/20 border-emerald-500/20';
  }

  if (active) {
    base += ' ring-1 ring-emerald-400/50 bg-emerald-950/30';
  }

  if (highSeverity) {
    base += ' border-l-2 border-l-rose-400';
  } else if (mediumSeverity) {
    base += ' border-l-2 border-l-amber-400';
  }

  return base;
}

// Token tooltip component
function TokenTooltip({ token, highlight, onClose }: {
  token: TranscriptToken;
  highlight: ReturnType<typeof getTokenHighlightStyle>;
  onClose: () => void;
}) {
  const durationMs = token.endMs - token.startMs;

  return (
    <div
      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 animate-in fade-in slide-in-from-bottom-1 duration-150"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-xl p-3 min-w-[180px] max-w-[240px]">
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-white font-medium text-base">"{token.text}"</span>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition p-0.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {highlight?.tooltip && (
          <div className={clsx(
            'text-xs px-2 py-1 rounded-md mb-2 inline-block',
            highlight.severity === 'high' && 'bg-rose-500/20 text-rose-300',
            highlight.severity === 'medium' && 'bg-amber-500/20 text-amber-300',
            highlight.severity === 'low' && 'bg-slate-700 text-slate-300',
          )}>
            {highlight.tooltip}
          </div>
        )}

        <div className="flex gap-3 text-xs text-slate-400">
          <div>
            <span className="text-slate-500">Duration</span>
            <span className="ml-1 text-slate-300">{durationMs}ms</span>
          </div>
          <div>
            <span className="text-slate-500">At</span>
            <span className="ml-1 text-slate-300">{msToTimestamp(token.startMs)}</span>
          </div>
        </div>
      </div>
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800" />
    </div>
  );
}

export function TranscriptSegmentRow({
  segment,
  activeView,
  active,
  onSegmentClick,
  onTokenClick,
  withTimeline = false,
}: TranscriptSegmentRowProps) {
  const [selectedToken, setSelectedToken] = useState<TranscriptToken | null>(null);

  const segmentClass = clsx(
    'group relative rounded-xl border transition-all duration-200 cursor-pointer',
    getSegmentStyle(segment, activeView, !!active),
    'hover:bg-slate-800/30',
  );

  // Timeline indicator
  const timelineIndicator = withTimeline ? (
    <div className="absolute -left-6 top-0 bottom-0 flex items-start pt-4">
      <div className={clsx(
        'w-2.5 h-2.5 rounded-full transition-all duration-200',
        segment.kind === 'pause' ? 'bg-slate-500' :
        active ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' :
        segment.tags.some(t => t.severity === 'high') ? 'bg-rose-400' :
        segment.tags.some(t => t.severity === 'medium') ? 'bg-amber-400' :
        'bg-slate-600 group-hover:bg-emerald-400/70',
      )} />
    </div>
  ) : null;

  // Pause segment rendering
  if (segment.kind === 'pause') {
    const durationSec = ((segment.endMs - segment.startMs) / 1000).toFixed(1);
    const isLongPause = segment.tags.some(t => t.kind === 'long_pause');

    return (
      <div
        className={clsx(segmentClass, 'px-4 py-2')}
        onClick={() => onSegmentClick?.(segment.id)}
      >
        {timelineIndicator}
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-mono w-12">{msToTimestamp(segment.startMs)}</span>
          <div className="flex items-center gap-2">
            <span className={clsx(
              'text-xs px-2 py-0.5 rounded-full',
              isLongPause ? 'bg-slate-700 text-slate-300' : 'bg-slate-800 text-slate-400',
            )}>
              {isLongPause ? '⏸ Long pause' : '⏸ Pause'}
            </span>
            <span className="text-xs text-slate-500">{durationSec}s</span>
          </div>
        </div>
      </div>
    );
  }

  // Speech segment rendering
  const tokens = segment.tokens ?? [];

  return (
    <div
      className={clsx(segmentClass, 'px-4 py-3')}
      onClick={() => onSegmentClick?.(segment.id)}
    >
      {timelineIndicator}

      <div className="flex gap-3">
        {/* Timestamp */}
        <span className="text-xs text-slate-500 font-mono w-12 pt-1 flex-shrink-0">
          {msToTimestamp(segment.startMs)}
        </span>

        {/* Transcript text */}
        <div className="flex-1 min-w-0">
          <p className="text-[15px] leading-7 text-slate-200 font-light tracking-wide">
            {tokens.length > 0 ? (
              tokens.map((token, idx) => {
                const highlight = getTokenHighlightStyle(token.tags, activeView);
                const hasIssue = highlight !== null;
                const isSelected = selectedToken?.id === token.id;

                // Non-highlighted words render as plain text
                if (!hasIssue) {
                  return (
                    <span key={token.id}>
                      {token.text}
                      {idx < tokens.length - 1 && ' '}
                    </span>
                  );
                }

                // Highlighted words are interactive
                return (
                  <span key={token.id} className="relative inline">
                    <span
                      className={clsx(
                        'relative cursor-pointer transition-all duration-150',
                        highlight?.className,
                        isSelected && 'ring-1 ring-emerald-400/60 rounded bg-emerald-500/10',
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedToken(isSelected ? null : token);
                        onTokenClick?.(token.id);
                      }}
                    >
                      {token.text}
                    </span>
                    {idx < tokens.length - 1 && ' '}

                    {/* Tooltip for selected token */}
                    {isSelected && (
                      <TokenTooltip
                        token={token}
                        highlight={highlight}
                        onClose={() => setSelectedToken(null)}
                      />
                    )}
                  </span>
                );
              })
            ) : (
              <span>{segment.text}</span>
            )}
          </p>

          {/* Segment tags - only show on hover or when active */}
          {segment.tags.length > 0 && (active || activeView !== 'default') && (
            <div className="flex flex-wrap gap-1.5 mt-2 opacity-80">
              {segment.tags.map((tag) => (
                <span
                  key={tag.id}
                  className={clsx(
                    'text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wider',
                    tag.kind === 'fast' && 'bg-amber-500/15 text-amber-300/90 border border-amber-500/20',
                    tag.kind === 'slow' && 'bg-sky-500/15 text-sky-300/90 border border-sky-500/20',
                    tag.kind === 'filler' && 'bg-rose-500/15 text-rose-300/90 border border-rose-500/20',
                    tag.kind === 'structure' && 'bg-emerald-500/15 text-emerald-300/90 border border-emerald-500/20',
                    tag.kind === 'hedging' && 'bg-slate-500/15 text-slate-300/90 border border-slate-500/20',
                    tag.kind === 'long_pause' && 'bg-slate-500/15 text-slate-300/90 border border-slate-500/20',
                    !['fast', 'slow', 'filler', 'structure', 'hedging', 'long_pause'].includes(tag.kind) &&
                      'bg-slate-700/50 text-slate-300',
                  )}
                >
                  {tag.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
