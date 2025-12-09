import { Activity, Clock, HeartPulse, Thermometer, Type } from 'lucide-react';
import type { SessionMetricsSummary } from '@/types/sessions';

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

export function MetricsPanel({ metrics }: { metrics: SessionMetricsSummary }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm uppercase tracking-[0.15em] text-slate-400">Session metrics</p>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm text-slate-100">
        <Metric label="Duration" icon={<Clock className="h-4 w-4 text-emerald-300" />}>
          {formatDuration(Math.round(metrics.durationSec))}
        </Metric>
        <Metric label="Total words" icon={<Type className="h-4 w-4 text-amber-300" />}>
          {metrics.totalWords}
        </Metric>
        <Metric label="Avg WPM" icon={<Activity className="h-4 w-4 text-emerald-300" />}>
          {metrics.avgWpm.toFixed(1)}
        </Metric>
        <Metric label="Fillers/min" icon={<Type className="h-4 w-4 text-rose-300" />}>
          {metrics.fillerPerMinute.toFixed(1)} ({metrics.fillerCount} total)
        </Metric>
        {metrics.avgHeartRate ? (
          <Metric label="Avg HR" icon={<HeartPulse className="h-4 w-4 text-emerald-300" />}>
            {metrics.avgHeartRate} bpm
          </Metric>
        ) : null}
        {metrics.peakHeartRate ? (
          <Metric label="Peak HR" icon={<HeartPulse className="h-4 w-4 text-amber-300" />}>
            {metrics.peakHeartRate} bpm
          </Metric>
        ) : null}
        {metrics.movementScore !== undefined ? (
          <Metric label="Movement" icon={<Thermometer className="h-4 w-4 text-sky-300" />}>
            {(metrics.movementScore * 100).toFixed(0)}%
          </Metric>
        ) : null}
        {metrics.stressSpeedIndex !== undefined ? (
          <Metric label="Stress-speed" icon={<Thermometer className="h-4 w-4 text-amber-300" />}>
            {(metrics.stressSpeedIndex * 100).toFixed(0)}%
          </Metric>
        ) : null}
      </div>
    </div>
  );
}

function Metric({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/5 px-3 py-2">
      <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-slate-400">
        {icon}
        {label}
      </p>
      <p className="mt-1 text-base font-semibold text-white">{children}</p>
    </div>
  );
}
