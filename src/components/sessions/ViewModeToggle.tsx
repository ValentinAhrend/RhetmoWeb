import clsx from 'clsx';
import { ListChecks, MessageCircle, PauseCircle, Rabbit, Waves } from 'lucide-react';
import type { ReactNode } from 'react';

export type ViewMode = 'default' | 'speed' | 'fillers' | 'pauses' | 'structure';

const OPTIONS: { value: ViewMode; label: string; icon: ReactNode }[] = [
  { value: 'default', label: 'Overview', icon: <MessageCircle className="h-4 w-4" /> },
  { value: 'speed', label: 'Pace', icon: <Rabbit className="h-4 w-4" /> },
  { value: 'fillers', label: 'Fillers', icon: <Waves className="h-4 w-4" /> },
  { value: 'pauses', label: 'Pauses', icon: <PauseCircle className="h-4 w-4" /> },
  { value: 'structure', label: 'Structure', icon: <ListChecks className="h-4 w-4" /> },
];

export function ViewModeToggle({ value, onChange }: { value: ViewMode; onChange: (mode: ViewMode) => void }) {
  return (
    <div className="inline-flex gap-2 rounded-full border border-white/5 bg-white/5 p-1">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={clsx(
            'flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition',
            option.value === value
              ? 'bg-emerald-500 text-slate-950 shadow-soft'
              : 'text-slate-200 hover:bg-white/5',
          )}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  );
}
