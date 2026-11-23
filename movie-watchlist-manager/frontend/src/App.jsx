import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Plus,
  Search,
  Sparkles,
  Film,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import StatsDashboard from './components/StatsDashboard';
import MovieCard from './components/MovieCard';
import MovieFormModal from './components/MovieFormModal';
import RatingModal from './components/RatingModal';
import WatchNextModal from './components/WatchNextModal';

const API_BASE = 'http://localhost:5000/api/movies';
const GENRES = ['All', 'Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Romance', 'Thriller'];
const STATUSES = ['All', 'To Watch', 'Watching', 'Watched'];

export default function App() {
  const [movies, setMovies] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [statusFilter, setStatusFilter] = useState('All');
  const [genreFilter, setGenreFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMovies, setTotalMovies] = useState(0);

  // Modals & Notifications
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);
  const [formServerError, setFormServerError] = useState('');

  const [ratingModal, setRatingModal] = useState({
    isOpen: false,
    movie: null,
    mode: 'complete',
  });

  const [watchNextModal, setWatchNextModal] = useState({
    isOpen: false,
    movie: null,
  });

  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchStats = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/stats`);
      if (res.data.success) setStats(res.data.data);
    } catch (err) {
      console.error('Failed to fetch stats', err);
    }
  }, []);

  const fetchMovies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_BASE, {
        params: {
          status: statusFilter,
          genre: genreFilter,
          search: searchQuery,
          page,
        },
      });
      if (res.data.success) {
        setMovies(res.data.data.movies);
        setTotalPages(res.data.data.totalPages);
        setTotalMovies(res.data.data.totalMovies);
      }
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Error loading movies');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, genreFilter, searchQuery, page]);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const refreshAll = () => {
    fetchMovies();
    fetchStats();
  };

  // Add or Edit Movie
  const handleFormSubmit = async (formData) => {
    setFormServerError('');
    try {
      if (editingMovie) {
        const res = await axios.put(`${API_BASE}/${editingMovie._id}`, {
          title: formData.title,
          genre: formData.genre,
          runtime: Number(formData.runtime),
          platform: formData.platform,
          priority: Number(formData.priority),
        });
        showToast('success', res.data.message);
      } else {
        const res = await axios.post(API_BASE, {
          ...formData,
          releaseYear: Number(formData.releaseYear),
          runtime: Number(formData.runtime),
          priority: Number(formData.priority),
        });
        showToast('success', res.data.message);
      }
      setIsFormOpen(false);
      setEditingMovie(null);
      refreshAll();
    } catch (err) {
      setFormServerError(err.response?.data?.message || 'Operation failed');
    }
  };

  // Status Change Handler
  const handleStatusChange = async (movie, nextStatus) => {
    if (nextStatus === 'Watched') {
      setRatingModal({ isOpen: true, movie, mode: 'complete' });
      return;
    }

    try {
      const res = await axios.patch(`${API_BASE}/${movie._id}/status`, {
        status: nextStatus,
      });
      showToast('success', res.data.message);
      refreshAll();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Status update failed');
    }
  };

  // Rating Modal Confirm (both for moving to Watched and editing existing rating)
  const handleRatingConfirm = async (movieId, ratingValue) => {
    try {
      if (ratingModal.mode === 'complete') {
        const res = await axios.patch(`${API_BASE}/${movieId}/status`, {
          status: 'Watched',
          rating: ratingValue,
        });
        showToast('success', res.data.message);
      } else {
        const res = await axios.patch(`${API_BASE}/${movieId}/rating`, {
          rating: ratingValue,
        });
        showToast('success', res.data.message);
      }
      setRatingModal({ isOpen: false, movie: null, mode: 'complete' });
      refreshAll();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to save rating');
    }
  };

  // Delete Movie
  const handleDelete = async (movie) => {
    if (movie.status === 'Watching') return;
    const confirmed = window.confirm(
      `Are you sure you want to delete "${movie.title}" (${movie.movieCode})?`
    );
    if (!confirmed) return;

    try {
      const res = await axios.delete(`${API_BASE}/${movie._id}`);
      showToast('success', res.data.message);
      if (movies.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        refreshAll();
      }
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Delete failed');
    }
  };

  // Watch Next Recommendation
  const handleWatchNext = async () => {
    try {
      const res = await axios.get(`${API_BASE}/watch-next`);
      if (res.data.success) {
        setWatchNextModal({ isOpen: true, movie: res.data.data });
      }
    } catch (err) {
      showToast('error', err.response?.data?.message || 'No recommendation available');
    }
  };

  const handleStartWatchingRecommended = async (movieId) => {
    try {
      const res = await axios.patch(`${API_BASE}/${movieId}/status`, {
        status: 'Watching',
      });
      setWatchNextModal({ isOpen: false, movie: null });
      showToast('success', res.data.message);
      refreshAll();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Could not update status');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Toast Banner */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl border text-sm font-medium transition-all ${
            toast.type === 'error'
              ? 'bg-rose-950/95 border-rose-500/40 text-rose-200'
              : 'bg-emerald-950/95 border-emerald-500/40 text-emerald-200'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
              <Film className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">CineTrack</h1>
              <p className="text-xs text-slate-400">Personal Movie Watchlist Manager</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleWatchNext}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-indigo-500/30 text-indigo-300 text-sm font-medium transition"
            >
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>What should I watch next?</span>
            </button>

            <button
              onClick={() => {
                setEditingMovie(null);
                setFormServerError('');
                setIsFormOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Movie</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Statistics Dashboard */}
        <StatsDashboard stats={stats} />

        {/* Search & Filters */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search movies by title..."
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Status & Genre Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400 font-medium">Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                {STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400 font-medium">Genre:</label>
              <select
                value={genreFilter}
                onChange={(e) => {
                  setGenreFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                {GENRES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Movies Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, idx) => (
              <div
                key={idx}
                className="h-64 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse"
              />
            ))}
          </div>
        ) : movies.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/40 border border-slate-800/80 rounded-2xl">
            <Film className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-300">No movies found</h3>
            <p className="text-sm text-slate-500 mt-1">
              Try adjusting your filters or add a new movie to your watchlist.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {movies.map((movie) => (
                <MovieCard
                  key={movie._id}
                  movie={movie}
                  onEdit={(m) => {
                    setEditingMovie(m);
                    setFormServerError('');
                    setIsFormOpen(true);
                  }}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                  onEditRating={(m) =>
                    setRatingModal({ isOpen: true, movie: m, mode: 'edit' })
                  }
                />
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 rounded-xl px-5 py-3">
              <span className="text-xs text-slate-400">
                Showing page <strong className="text-white">{page}</strong> of{' '}
                <strong className="text-white">{totalPages}</strong> ({totalMovies} total movies)
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Modals */}
      <MovieFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingMovie(null);
          setFormServerError('');
        }}
        onSubmit={handleFormSubmit}
        initialData={editingMovie}
        serverError={formServerError}
      />

      <RatingModal
        isOpen={ratingModal.isOpen}
        movie={ratingModal.movie}
        mode={ratingModal.mode}
        onClose={() => setRatingModal({ isOpen: false, movie: null, mode: 'complete' })}
        onConfirm={handleRatingConfirm}
      />

      <WatchNextModal
        isOpen={watchNextModal.isOpen}
        movie={watchNextModal.movie}
        onClose={() => setWatchNextModal({ isOpen: false, movie: null })}
        onStartWatching={handleStartWatchingRecommended}
      />
    </div>
  );
}