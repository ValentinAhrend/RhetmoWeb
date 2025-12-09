import { ArrowRight, Clock, HeartPulse, Mic2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SessionContextBadge } from './SessionContextBadge';
import { SessionStatusBadge } from './SessionStatusBadge';
import type { Session } from '@/types/sessions';

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function SessionListItem({ session }: { session: Session }) {
  const metrics = session.analysis?.metrics;
  return (
    <Link
      to={`/sessions/${session.id}`}
      className="group relative block overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-5 transition hover:border-emerald-400/40 hover:bg-white/8"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/80 to-amber-400/70 text-slate-950 shadow-soft">
            <Mic2 className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <div>
            <p className="font-display text-lg font-semibold text-white">{session.title}</p>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Clock className="h-4 w-4" />
              <span>{formatDate(session.createdAt)}</span>
            </div>
          </div>
        </div>
        <SessionStatusBadge status={session.analysisStatus} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <SessionContextBadge context={session.context} />
        <span className="tag-pill bg-slate-500/15 text-slate-200">
          {session.mode === 'practice' ? 'Practice' : 'Live'}
        </span>
        {metrics ? (
          <span className="tag-pill bg-amber-500/15 text-amber-200">{Math.round(metrics.avgWpm)} WPM avg</span>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-200 sm:grid-cols-4">
        <div className="rounded-xl border border-white/5 bg-white/5 px-3 py-2">
          <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Duration</p>
          <p className="font-semibold text-white">
            {session.durationSec ?? metrics?.durationSec ? `${session.durationSec ?? metrics?.durationSec}s` : '—'}
          </p>
        </div>
        <div className="rounded-xl border border-white/5 bg-white/5 px-3 py-2">
          <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Avg WPM</p>
          <p className="font-semibold text-white">{metrics ? metrics.avgWpm.toFixed(1) : '—'}</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-white/5 px-3 py-2">
          <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Fillers/min</p>
          <p className="font-semibold text-white">{metrics ? metrics.fillerPerMinute.toFixed(1) : '—'}</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-white/5 px-3 py-2">
          <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Avg HR</p>
          <div className="flex items-center gap-2">
            <HeartPulse className="h-4 w-4 text-emerald-300" />
            <p className="font-semibold text-white">{metrics?.avgHeartRate ?? '—'} bpm</p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-emerald-100/80 opacity-0 transition group-hover:opacity-100">
        <ArrowRight className="h-4 w-4" />
        <span>Dive into transcript</span>
      </div>
    </Link>
  );
}
