import clsx from 'clsx';
import type { Session } from '@/types/sessions';

const STATUS_STYLES: Record<Session['analysisStatus'], { bg: string; dot: string; label: string }> = {
  ready: { bg: 'bg-emerald-500/15 text-emerald-200', dot: 'bg-emerald-400', label: 'Ready' },
  pending: { bg: 'bg-amber-500/15 text-amber-200', dot: 'bg-amber-400', label: 'Pending' },
  processing: { bg: 'bg-sky-500/15 text-sky-200', dot: 'bg-sky-400', label: 'Processing' },
  failed: { bg: 'bg-rose-500/15 text-rose-200', dot: 'bg-rose-400', label: 'Failed' },
};

export function SessionStatusBadge({ status }: { status: Session['analysisStatus'] }) {
  const style = STATUS_STYLES[status];
  return (
    <span className={clsx('inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold', style.bg)}>
      <span className={clsx('h-2.5 w-2.5 rounded-full', style.dot)} />
      {style.label}
    </span>
  );
}
