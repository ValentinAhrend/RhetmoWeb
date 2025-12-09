import clsx from 'clsx';
import type { SessionContext } from '@/types/sessions';

const CONTEXT_COLOR: Record<SessionContext, string> = {
  pitch: 'bg-emerald-500/15 text-emerald-200',
  interview: 'bg-amber-500/15 text-amber-200',
  meeting: 'bg-sky-500/15 text-sky-200',
  exam: 'bg-indigo-500/15 text-indigo-200',
  language_practice: 'bg-purple-500/15 text-purple-200',
  other: 'bg-slate-500/15 text-slate-200',
};

export function SessionContextBadge({ context }: { context: SessionContext }) {
  const label = context.split('_').join(' ');
  return (
    <span className={clsx('tag-pill capitalize', CONTEXT_COLOR[context])}>
      {label}
    </span>
  );
}
