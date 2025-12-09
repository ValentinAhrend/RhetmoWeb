import { Bell, User } from 'lucide-react';
import type { ReactNode } from 'react';

interface TopBarProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function TopBar({ title, subtitle, actions }: TopBarProps) {
  return (
    <header className="sticky top-0 z-20 flex flex-col gap-4 border-b border-white/5 bg-slate-950/70 px-4 py-4 backdrop-blur-xl md:flex-row md:items-center md:justify-between md:px-8">
      <div>
        <h1 className="font-display text-2xl font-semibold leading-tight text-white md:text-3xl">
          {title}
        </h1>
        {subtitle ? <p className="text-sm text-slate-300/90">{subtitle}</p> : null}
      </div>

      <div className="flex items-center gap-3">
        {actions}
        <button className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:border-white/20 hover:bg-white/10">
          <Bell className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100">
          <User className="h-4 w-4" />
          <span>Tobias</span>
        </div>
      </div>
    </header>
  );
}
