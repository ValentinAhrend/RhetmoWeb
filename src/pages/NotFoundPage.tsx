import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-slate-100">
      <div className="glass-panel max-w-md rounded-3xl px-8 py-10 text-center">
        <p className="text-sm uppercase tracking-[0.15em] text-emerald-200/70">Lost in the transcript</p>
        <h1 className="mt-3 font-display text-3xl font-semibold text-white">Page not found</h1>
        <p className="mt-2 text-slate-300">The route you tried to reach is not wired yet.</p>
        <Link
          to="/dashboard"
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-emerald-400"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
