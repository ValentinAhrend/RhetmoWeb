import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { IssuesPanel } from '@/components/sessions/IssuesPanel';
import { MetricsPanel } from '@/components/sessions/MetricsPanel';
import { SessionInsights } from '@/components/sessions/SessionInsights';
import { SessionHeaderCard } from '@/components/sessions/SessionHeaderCard';
import { TranscriptViewer } from '@/components/sessions/TranscriptViewer';
import type { ViewMode } from '@/components/sessions/ViewModeToggle';
import { fetchSessionById } from '@/data/sessions';
import type { Session } from '@/types/sessions';

export function SessionDetailPage() {
  const { id } = useParams();
  const [session, setSession] = useState<Session | undefined>();
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('default');
  const [activeSegmentId, setActiveSegmentId] = useState<string | undefined>();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchSessionById(id).then((data) => {
      setSession(data);
      setLoading(false);
    });
  }, [id]);

  if (!id) {
    return <AppShell title="Session" subtitle="Missing ID">Invalid session id.</AppShell>;
  }

  if (loading) {
    return (
      <AppShell title="Loading session" subtitle="Fetching analysis">
        <div className="rounded-3xl border border-white/5 bg-white/5 p-6 text-slate-200">Loading session…</div>
      </AppShell>
    );
  }

  if (!session) {
    return (
      <AppShell title="Session" subtitle="Not found">
        <div className="rounded-3xl border border-white/5 bg-white/5 p-6 text-slate-200">Session not found.</div>
      </AppShell>
    );
  }

  const metrics = session.analysis?.metrics;
  const issues = session.analysis?.issues ?? [];
  const hasAnalysis = session.analysisStatus === 'ready' && !!session.analysis;

  return (
    <AppShell
      title={session.title}
      subtitle={`${session.context} • ${session.mode}`}
      actions={null}
    >
      <SessionHeaderCard session={session} />

      {hasAnalysis ? (
        <SessionInsights metrics={metrics!} issues={issues} />
      ) : (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-slate-300">
          Analysis pending — insights will unlock once processing finishes.
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm uppercase tracking-[0.15em] text-slate-400">Transcript & highlights</h2>
            {hasAnalysis ? (
              <p className="text-xs text-slate-400">Click a segment to align audio and coaching cues.</p>
            ) : null}
          </div>
          <TranscriptViewer
            session={session}
            activeView={viewMode}
            onViewChange={setViewMode}
            activeSegmentId={activeSegmentId}
            onSegmentClick={setActiveSegmentId}
          />
        </div>

        <div className="space-y-4">
          {hasAnalysis && metrics ? <MetricsPanel metrics={metrics} /> : null}
          {issues.length ? (
            <IssuesPanel issues={issues} onIssueClick={(_, segments) => setActiveSegmentId(segments[0])} />
          ) : (
            <div className="rounded-2xl border border-white/5 bg-white/5 p-4 text-sm text-slate-300">
              No issues flagged for this session yet.
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
