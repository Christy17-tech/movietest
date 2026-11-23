import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';

const GENRES = ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Romance', 'Thriller'];
const PLATFORMS = ['Netflix', 'Prime Video', 'Hotstar', 'Theatre', 'Other'];
const CURRENT_YEAR = new Date().getFullYear();

export default function MovieFormModal({ isOpen, onClose, onSubmit, initialData, serverError }) {
  const isEditMode = Boolean(initialData);

  const [formData, setFormData] = useState({
    title: '',
    genre: 'Action',
    releaseYear: CURRENT_YEAR,
    runtime: 120,
    platform: 'Netflix',
    priority: 3,
  });

  const [validationError, setValidationError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        genre: initialData.genre,
        releaseYear: initialData.releaseYear,
        runtime: initialData.runtime,
        platform: initialData.platform,
        priority: initialData.priority,
      });
    } else {
      setFormData({
        title: '',
        genre: 'Action',
        releaseYear: CURRENT_YEAR,
        runtime: 120,
        platform: 'Netflix',
        priority: 3,
      });
    }
    setValidationError('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    if (!formData.title.trim()) return 'Title is required.';
    const year = Number(formData.releaseYear);
    if (!isEditMode && (isNaN(year) || year < 1950 || year > CURRENT_YEAR)) {
      return `Release Year must be between 1950 and ${CURRENT_YEAR}.`;
    }
    const runtime = Number(formData.runtime);
    if (isNaN(runtime) || runtime < 30 || runtime > 300) {
      return 'Runtime must be between 30 and 300 minutes.';
    }
    const priority = Number(formData.priority);
    if (isNaN(priority) || priority < 1 || priority > 5) {
      return 'Priority must be between 1 and 5.';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setValidationError(err);
      return;
    }
    setValidationError('');
    setSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setSubmitting(false);
    }
  };

  const displayError = validationError || serverError;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white">
              {isEditMode ? 'Edit Movie' : 'Add New Movie'}
            </h2>
            {isEditMode && (
              <p className="text-xs text-indigo-400 font-mono mt-0.5">
                {initialData.movieCode} • {initialData.releaseYear} (Locked)
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {displayError && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{displayError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Movie Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Inception"
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Genre *</label>
              <select
                value={formData.genre}
                onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
              >
                {GENRES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Release Year *
              </label>
              <input
                type="number"
                min={1950}
                max={CURRENT_YEAR}
                disabled={isEditMode}
                value={formData.releaseYear}
                onChange={(e) => setFormData({ ...formData, releaseYear: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Runtime (mins) *
              </label>
              <input
                type="number"
                min={30}
                max={300}
                value={formData.runtime}
                onChange={(e) => setFormData({ ...formData, runtime: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
              />
              <span className="text-[11px] text-slate-500">30 - 300 mins</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Platform *</label>
              <select
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Priority (1 = Lowest, 5 = Highest) *
            </label>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  type="button"
                  key={num}
                  onClick={() => setFormData({ ...formData, priority: num })}
                  className={`py-2 rounded-lg text-sm font-semibold border transition ${
                    Number(formData.priority) === num
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition disabled:opacity-50"
            >
              {submitting ? 'Saving...' : isEditMode ? 'Update Movie' : 'Add Movie'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}