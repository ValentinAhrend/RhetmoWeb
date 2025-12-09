import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

interface AppShellProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function AppShell({ title, subtitle, actions, children }: AppShellProps) {
  return (
    <div className="h-screen bg-slate-950 text-slate-50 overflow-hidden">
      <div className="flex h-full">
        <Sidebar />
        <div className="flex flex-1 flex-col h-full overflow-hidden">
          <TopBar title={title} subtitle={subtitle} actions={actions} />
          <main className="flex-1 overflow-auto px-4 py-6 md:px-8 md:py-10">
            <div className="mx-auto max-w-6xl space-y-8">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
