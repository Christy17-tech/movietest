import React from 'react';
import { Clock, Tv, Star, Edit2, Trash2, Flame, Calendar } from 'lucide-react';

const STATUS_STYLES = {
  'To Watch': 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  Watching: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  Watched: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
};

const VALID_NEXT_STATUSES = {
  'To Watch': ['Watching', 'Watched'],
  Watching: ['Watched', 'To Watch'],
  Watched: [],
};

export default function MovieCard({
  movie,
  onEdit,
  onDelete,
  onStatusChange,
  onEditRating,
}) {
  const nextStatuses = VALID_NEXT_STATUSES[movie.status] || [];
  const isDeleteDisabled = movie.status === 'Watching';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition shadow-lg">
      <div>
        {/* Top Header: Movie Code & Status Badge */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-slate-800 text-indigo-300 border border-slate-700">
            {movie.movieCode}
          </span>
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
              STATUS_STYLES[movie.status]
            }`}
          >
            {movie.status}
          </span>
        </div>

        {/* Title & Genre */}
        <h3 className="text-lg font-bold text-white leading-snug mb-1">{movie.title}</h3>
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-4">
          <span className="px-2 py-0.5 rounded bg-slate-800/90 text-slate-300 font-medium">
            {movie.genre}
          </span>
          <span>•</span>
          <span>{movie.releaseYear}</span>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-2.5 text-xs text-slate-300 bg-slate-800/40 p-3 rounded-xl border border-slate-800/80 mb-4">
          <div className="flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-orange-400 shrink-0" />
            <span>
              Priority: <strong className="text-white">{movie.priority}/5</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>{movie.runtime} mins</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Tv className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="truncate">{movie.platform}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            {movie.status === 'Watched' && movie.rating ? (
              <button
                onClick={() => onEditRating(movie)}
                title="Click to edit rating"
                className="font-bold text-amber-300 hover:underline flex items-center gap-1"
              >
                {movie.rating}/10
              </button>
            ) : (
              <span className="text-slate-500">Not rated</span>
            )}
          </div>
        </div>

        {movie.status === 'Watched' && movie.watchedDate && (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-4">
            <Calendar className="w-3 h-3 text-emerald-400" />
            <span>Watched on {new Date(movie.watchedDate).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {/* Bottom Controls: Status Dropdown + Edit/Delete */}
      <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
        {nextStatuses.length > 0 ? (
          <select
            value=""
            onChange={(e) => {
              if (e.target.value) onStatusChange(movie, e.target.value);
            }}
            className="flex-1 bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-2 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="" disabled>
              Move to...
            </option>
            {nextStatuses.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        ) : (
          <span className="flex-1 text-xs font-medium text-emerald-400/80 italic">
            Completed (Final)
          </span>
        )}

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onEdit(movie)}
            title="Edit Movie"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(movie)}
            disabled={isDeleteDisabled}
            title={
              isDeleteDisabled
                ? 'Cannot delete while status is Watching'
                : 'Delete Movie'
            }
            className={`p-2 rounded-lg transition ${
              isDeleteDisabled
                ? 'bg-slate-800/40 text-slate-600 cursor-not-allowed'
                : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300'
            }`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}