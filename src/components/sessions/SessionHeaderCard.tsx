import { Calendar, Clock3, Headphones, Timer } from 'lucide-react';
import { SessionContextBadge } from './SessionContextBadge';
import { SessionStatusBadge } from './SessionStatusBadge';
import type { Session } from '@/types/sessions';

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function SessionHeaderCard({ session }: { session: Session }) {
  const duration = session.durationSec ?? session.analysis?.metrics.durationSec;
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/5 bg-white/5 p-5 md:flex-row md:items-center md:justify-between">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <SessionContextBadge context={session.context} />
          <span className="tag-pill bg-slate-500/15 text-slate-200">{session.mode}</span>
          <SessionStatusBadge status={session.analysisStatus} />
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-200">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-emerald-300" />
            <span>{formatDate(session.createdAt)}</span>
          </div>
          {duration ? (
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-amber-300" />
              <span>{duration}s</span>
            </div>
          ) : null}
          {session.audioUrl ? (
            <div className="flex items-center gap-2">
              <Headphones className="h-4 w-4 text-emerald-300" />
              <span>Audio attached</span>
            </div>
          ) : null}
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm text-slate-300">
        <Clock3 className="h-5 w-5 text-amber-200" />
        <span>{session.analysisStatus === 'ready' ? 'Analysis ready' : 'Analysis queued'}</span>
      </div>
    </div>
  );
}
