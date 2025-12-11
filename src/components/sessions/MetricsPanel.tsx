import { Activity, Clock, HeartPulse, Move, Type } from 'lucide-react';
import clsx from 'clsx';
import type { SessionMetricsSummary } from '@/types/sessions';

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

// Movement optimal range boundaries (0-1 scale)
const MOVEMENT_MIN_OPTIMAL = 0.3;
const MOVEMENT_MAX_OPTIMAL = 0.7;

function getMovementTone(score: number): 'low' | 'optimal' | 'high' {
  if (score < MOVEMENT_MIN_OPTIMAL) return 'low';
  if (score > MOVEMENT_MAX_OPTIMAL) return 'high';
  return 'optimal';
}

export function MetricsPanel({ metrics }: { metrics: SessionMetricsSummary }) {
  const movementScore = metrics.movementScore ?? 0.5;
  const movementTone = getMovementTone(movementScore);

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
        
        {/* Movement Score - spans 2 columns */}
        {metrics.movementScore !== undefined && (
          <div className="col-span-2 rounded-xl border border-white/5 bg-white/5 px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-slate-400">
                <Move className="h-4 w-4 text-sky-300" />
                Body Movement
              </p>
              <span className={clsx(
                'text-xs px-2 py-0.5 rounded-full',
                movementTone === 'optimal' && 'bg-emerald-500/20 text-emerald-300',
                movementTone === 'low' && 'bg-amber-500/20 text-amber-300',
                movementTone === 'high' && 'bg-amber-500/20 text-amber-300',
              )}>
                {movementTone === 'optimal' ? 'Optimal' : movementTone === 'low' ? 'Too Little' : 'Too Much'}
              </span>
            </div>
            
            {/* Movement Slider Visualization */}
            <div className="relative h-6 flex items-center">
              {/* Track background */}
              <div className="absolute inset-x-0 h-1 rounded-full bg-slate-700/50" />
              
              {/* Optimal zone highlight */}
              <div 
                className="absolute h-1 rounded-full bg-emerald-500/25"
                style={{ 
                  left: `${MOVEMENT_MIN_OPTIMAL * 100}%`, 
                  width: `${(MOVEMENT_MAX_OPTIMAL - MOVEMENT_MIN_OPTIMAL) * 100}%` 
                }}
              />
              
              {/* Left boundary marker */}
              <div 
                className="absolute w-1.5 h-1.5 rounded-full bg-slate-500/80"
                style={{ left: `${MOVEMENT_MIN_OPTIMAL * 100}%`, transform: 'translateX(-50%)' }}
              />
              
              {/* Right boundary marker */}
              <div 
                className="absolute w-1.5 h-1.5 rounded-full bg-slate-500/80"
                style={{ left: `${MOVEMENT_MAX_OPTIMAL * 100}%`, transform: 'translateX(-50%)' }}
              />
              
              {/* Current score indicator */}
              <div 
                className="absolute w-3 h-3 rounded-full bg-emerald-400 shadow-sm shadow-emerald-500/40"
                style={{ left: `${movementScore * 100}%`, transform: 'translateX(-50%)' }}
              />
            </div>
          </div>
        )}
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
