import { NavLink } from 'react-router-dom';
import { Activity, Cog, Target } from 'lucide-react';

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
    <aside className="hidden lg:flex h-screen w-64 flex-col border-r border-white/5 bg-slate-950/70 px-5 py-6 backdrop-blur-xl sticky top-0">
      <div className="flex items-center gap-3 px-2">
        <img src="/brand/rhetmoLogoWhite.svg" alt="Rhemto logo" className="h-10 w-auto" />
      </div>

      <div className="mt-8 space-y-1">
        {navItems.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </div>
    </aside>
  );
}
