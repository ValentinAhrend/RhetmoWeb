import clsx from 'clsx';
import { AlertTriangle, ListTree } from 'lucide-react';
import type { SessionIssue } from '@/types/sessions';

const SEVERITY_STYLES: Record<SessionIssue['severity'], string> = {
  high: 'bg-rose-500/15 text-rose-100 border-rose-400/30',
  medium: 'bg-amber-500/15 text-amber-100 border-amber-300/30',
  low: 'bg-emerald-500/15 text-emerald-100 border-emerald-300/30',
};

export function IssuesPanel({
  issues,
  onIssueClick,
}: {
  issues: SessionIssue[];
  onIssueClick?: (issueId: string, segmentIds: string[]) => void;
}) {
  const sorted = [...issues].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 } as const;
    return order[a.severity] - order[b.severity];
  });

  return (
    <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
      <div className="flex items-center gap-2 text-sm text-slate-200">
        <ListTree className="h-4 w-4 text-emerald-300" />
        <span>Coaching cues</span>
      </div>
      <div className="mt-3 space-y-3">
        {sorted.map((issue) => (
          <button
            key={issue.id}
            onClick={() => onIssueClick?.(issue.id, issue.segmentIds)}
            className={clsx(
              'w-full rounded-xl border px-3 py-3 text-left transition hover:border-emerald-300/40 hover:bg-white/5',
              SEVERITY_STYLES[issue.severity],
            )}
          >
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em]">
              <AlertTriangle className="h-4 w-4" />
              <span>{issue.severity} · {issue.kind.replace('_', ' ')}</span>
            </div>
            <p className="mt-2 text-sm text-white">{issue.message}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
