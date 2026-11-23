import React from 'react';
import { X, Sparkles, Clock, Tv, Flame } from 'lucide-react';

export default function WatchNextModal({ isOpen, movie, onClose, onStartWatching }) {
  if (!isOpen || !movie) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
            <Sparkles className="w-4 h-4" />
            <span>Top Recommendation For You</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
              {movie.movieCode}
            </span>
            <h3 className="text-2xl font-bold text-white mt-2">{movie.title}</h3>
            <p className="text-sm text-slate-400">
              {movie.genre} • {movie.releaseYear}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-800/70 border border-slate-700/70 text-center">
            <div>
              <div className="flex items-center justify-center gap-1 text-xs text-slate-400 mb-1">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <span>Priority</span>
              </div>
              <div className="text-base font-bold text-white">{movie.priority} / 5</div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-xs text-slate-400 mb-1">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                <span>Runtime</span>
              </div>
              <div className="text-base font-bold text-white">{movie.runtime}m</div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-xs text-slate-400 mb-1">
                <Tv className="w-3.5 h-3.5 text-emerald-400" />
                <span>Platform</span>
              </div>
              <div className="text-base font-bold text-white truncate">{movie.platform}</div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800"
            >
              Close
            </button>
            <button
              onClick={() => onStartWatching(movie._id)}
              className="px-5 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              Start Watching Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}