import { NavLink } from 'react-router-dom';
import { Activity, Cog, Mic2, Target } from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Sessions', icon: Activity },
  { to: '/goals', label: 'Goals', icon: Target },
  { to: '/settings', label: 'Settings', icon: Cog },
];

function NavItem({ to, label, icon: Icon }: (typeof navItems)[number]) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          'flex items-center gap-3 rounded-xl px-3 py-2 transition-colors',
          'hover:bg-white/5',
          isActive ? 'bg-white/10 text-amber-200' : 'text-slate-200/80',
        ].join(' ')
      }
    >
      <Icon className="h-5 w-5" strokeWidth={1.75} />
      <span className="text-sm font-semibold tracking-wide">{label}</span>
    </NavLink>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden lg:flex h-screen w-64 flex-col border-r border-white/5 bg-slate-950/70 px-5 py-6 backdrop-blur-xl">
      <div className="flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400/70 to-amber-300/80 text-slate-900 shadow-soft">
          <Mic2 className="h-6 w-6" />
        </div>
        <div>
          <p className="font-display text-lg font-semibold text-white">PulseSpeak</p>
          <p className="text-xs uppercase tracking-[0.15em] text-emerald-200/80">Coach</p>
        </div>
      </div>

      <div className="mt-8 space-y-1">
        {navItems.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </div>
    </aside>
  );
}
