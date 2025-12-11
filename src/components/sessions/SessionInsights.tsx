import clsx from 'clsx';
import type { ReactNode } from 'react';
import { Activity, Sparkles, Waves } from 'lucide-react';
import type { SessionIssue, SessionMetricsSummary } from '@/types/sessions';

interface SessionInsightsProps {
  metrics: SessionMetricsSummary;
  issues: SessionIssue[];
}

type Tone = 'positive' | 'caution' | 'risk';

type Insight = {
  title: string;
  value: string;
  detail: string;
  icon: ReactNode;
  tone: Tone;
};

const toneStyles: Record<Tone, string> = {
  positive: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-50',
  caution: 'border-amber-300/40 bg-amber-500/10 text-amber-50',
  risk: 'border-rose-400/40 bg-rose-500/10 text-rose-50',
};

function deriveInsights(metrics: SessionMetricsSummary): Insight[] {
  const paceBand = { min: 140, max: 160 };
  const paceTone: Tone = metrics.avgWpm > paceBand.max + 15 ? 'risk' : metrics.avgWpm > paceBand.max ? 'caution' : metrics.avgWpm < paceBand.min ? 'caution' : 'positive';
  const paceDetail =
    metrics.avgWpm > paceBand.max
      ? 'Above target band — build in brief pauses to lower pace.'
      : metrics.avgWpm < paceBand.min
      ? 'Below target band — tighten phrasing to keep attention.'
      : 'In a healthy band — maintain this cadence.';

  const fillerTone: Tone = metrics.fillerPerMinute > 4 ? 'risk' : metrics.fillerPerMinute > 2 ? 'caution' : 'positive';
  const fillerDetail =
    metrics.fillerPerMinute > 4
      ? 'High filler density — swap fillers for short breaths.'
      : metrics.fillerPerMinute > 2
      ? 'Moderate fillers — try a beat of silence instead.'
      : 'Low fillers — keep this clarity.';

  return [
    {
      title: 'Pace window',
      value: `${metrics.avgWpm.toFixed(0)} WPM`,
      detail: paceDetail,
      icon: <Activity className="h-5 w-5" />,
      tone: paceTone,
    },
    {
      title: 'Fillers per min',
      value: metrics.fillerPerMinute.toFixed(1),
      detail: fillerDetail,
      icon: <Waves className="h-5 w-5" />,
      tone: fillerTone,
    },
  ];
}

function topIssues(issues: SessionIssue[], limit = 3) {
  const severityOrder = { high: 0, medium: 1, low: 2 } as const;
  return [...issues]
    .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
    .slice(0, limit);
}

export function SessionInsights({ metrics, issues }: SessionInsightsProps) {
  const insights = deriveInsights(metrics);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {insights.map((insight) => (
        <div
          key={insight.title}
          className={clsx(
            'relative overflow-hidden rounded-2xl border px-4 py-4 shadow-soft transition hover:translate-y-[-1px] hover:shadow-lg',
            toneStyles[insight.tone],
          )}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.12em] text-white/80">{insight.title}</p>
            <span className="rounded-full bg-white/10 p-2 text-white/90">{insight.icon}</span>
          </div>
          <p className="mt-2 font-display text-2xl font-semibold text-white">{insight.value}</p>
          <p className="text-sm text-white/80">{insight.detail}</p>
          <div className="mt-3 flex items-center gap-2 text-xs text-white/70">
            <Sparkles className="h-4 w-4" />
            <span>Personalized from practice</span>
          </div>
        </div>
      ))}
    </div>
  );
}
