import React, { useState, useEffect } from 'react';
import { X, Star } from 'lucide-react';

export default function RatingModal({ isOpen, movie, mode, onClose, onConfirm }) {
  // mode: 'complete' (transitioning to Watched) | 'edit' (editing existing Watched rating)
  const [rating, setRating] = useState(8);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (movie?.rating) {
      setRating(movie.rating);
    } else {
      setRating(8);
    }
  }, [movie, isOpen]);

  if (!isOpen || !movie) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onConfirm(movie._id, Number(rating));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white">
            {mode === 'complete' ? 'Mark as Watched' : 'Update Rating'}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <p className="text-sm text-slate-300">
              How would you rate <span className="font-semibold text-white">{movie.title}</span>?
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {mode === 'complete'
                ? 'A rating from 1 to 10 is required to complete this movie.'
                : 'Select a new rating between 1 and 10.'}
            </p>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <button
                type="button"
                key={num}
                onClick={() => setRating(num)}
                className={`py-2.5 rounded-lg text-sm font-bold border flex items-center justify-center gap-1 transition ${
                  Number(rating) === num
                    ? 'bg-amber-500 border-amber-400 text-slate-950'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'
                }`}
              >
                {num}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-center gap-2 text-amber-400 font-semibold text-lg">
            <Star className="w-5 h-5 fill-amber-400" />
            <span>{rating} / 10</span>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Rating'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}