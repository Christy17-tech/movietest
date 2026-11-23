import React from 'react';
import { Film, PlayCircle, CheckCircle2, Clock, Star, Award } from 'lucide-react';

export default function StatsDashboard({ stats }) {
  if (!stats) return null;

  const { statusCounts, totalHoursWatched, averageRating, topWatchedGenre } = stats;

  const cards = [
    {
      label: 'To Watch',
      value: statusCounts['To Watch'] ?? 0,
      icon: Film,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
    },
    {
      label: 'Watching',
      value: statusCounts['Watching'] ?? 0,
      icon: PlayCircle,
      color: 'text-sky-400',
      bg: 'bg-sky-500/10 border-sky-500/20',
    },
    {
      label: 'Watched',
      value: statusCounts['Watched'] ?? 0,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      label: 'Hours Watched',
      value: `${totalHoursWatched} hrs`,
      icon: Clock,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10 border-indigo-500/20',
    },
    {
      label: 'Avg Rating',
      value: averageRating > 0 ? `${averageRating} / 10` : 'N/A',
      icon: Star,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10 border-yellow-500/20',
    },
    {
      label: 'Top Watched Genre',
      value: topWatchedGenre,
      icon: Award,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10 border-rose-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className={`p-4 rounded-xl border ${card.bg} backdrop-blur-sm flex flex-col justify-between transition-transform hover:scale-[1.02]`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                {card.label}
              </span>
              <Icon className={`w-4 h-4 ${card.color}`} />
            </div>
            <div className="text-xl font-bold text-slate-100 truncate">{card.value}</div>
          </div>
        );
      })}
    </div>
  );
}