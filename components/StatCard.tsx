import type { Stat } from './types';

interface StatCardProps {
  stat: Stat;
}

export function StatCard({ stat }: StatCardProps) {
  return (
    <article className={`rounded-3xl border ${stat.accent} border-opacity-30 bg-slate-900/90 p-6 shadow-xl shadow-slate-950/20`}>
      <p className="text-sm text-slate-400">{stat.label}</p>
      <p className="mt-4 text-4xl font-semibold text-white">{stat.value}</p>
      <p className="mt-2 text-sm text-slate-500">{stat.metric}</p>
    </article>
  );
}
