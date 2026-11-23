const express = require('express');
const router = express.Router();
const Movie = require('../models/Movie');

const CURRENT_YEAR = new Date().getFullYear();

// Helper for standardized JSON response
const sendResponse = (res, statusCode, success, message, data = null) => {
  return res.status(statusCode).json({ success, message, data });
};

// 1. GET /api/movies/stats - Statistics Dashboard
router.get('/stats', async (req, res) => {
  try {
    const statusCountsAgg = await Movie.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const statusCounts = {
      'To Watch': 0,
      Watching: 0,
      Watched: 0,
    };
    statusCountsAgg.forEach((item) => {
      statusCounts[item._id] = item.count;
    });

    const watchedMetricsAgg = await Movie.aggregate([
      { $match: { status: 'Watched' } },
      {
        $group: {
          _id: null,
          totalMinutes: { $sum: '$runtime' },
          avgRating: { $avg: '$rating' },
        },
      },
    ]);

    const topGenreAgg = await Movie.aggregate([
      { $match: { status: 'Watched' } },
      { $group: { _id: '$genre', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: 1 },
    ]);

    const totalMinutes = watchedMetricsAgg[0]?.totalMinutes || 0;
    const totalHoursWatched = Number((totalMinutes / 60).toFixed(1));
    const avgRating = watchedMetricsAgg[0]?.avgRating
      ? Number(watchedMetricsAgg[0].avgRating.toFixed(1))
      : 0;
    const topWatchedGenre = topGenreAgg[0]?._id || 'N/A';

    return sendResponse(res, 200, true, 'Statistics fetched successfully', {
      statusCounts,
      totalHoursWatched,
      averageRating: avgRating,
      topWatchedGenre,
    });
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
});

// 2. GET /api/movies/watch-next - Highest priority To Watch, tie-break shortest runtime
router.get('/watch-next', async (req, res) => {
  try {
    const nextMovie = await Movie.findOne({ status: 'To Watch' }).sort({
      priority: -1,
      runtime: 1,
      createdAt: 1,
    });

    if (!nextMovie) {
      return sendResponse(
        res,
        404,
        false,
        'No movies in your "To Watch" list. Add some movies first!'
      );
    }

    return sendResponse(res, 200, true, 'Recommended movie found', nextMovie);
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
});

// 3. GET /api/movies - Filter, Search, Sort, Pagination
router.get('/', async (req, res) => {
  try {
    const { status, genre, search, page = 1 } = req.query;
    const limit = 6;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const skip = (pageNum - 1) * limit;

    const filter = {};
    if (status && status !== 'All') filter.status = status;
    if (genre && genre !== 'All') filter.genre = genre;
    if (search && search.trim() !== '') {
      filter.title = { $regex: search.trim(), $options: 'i' };
    }

    // Custom sorting: 'To Watch' movies prioritized first (sorted by Priority desc), then others by newest
    const pipeline = [
      { $match: filter },
      {
        $addFields: {
          isToWatch: { $cond: [{ $eq: ['$status', 'To Watch'] }, 1, 0] },
          sortPriority: { $cond: [{ $eq: ['$status', 'To Watch'] }, '$priority', -1] },
        },
      },
      {
        $sort: {
          isToWatch: -1,
          sortPriority: -1,
          createdAt: -1,
        },
      },
      {
        $facet: {
          movies: [{ $skip: skip }, { $limit: limit }, { $project: { isToWatch: 0, sortPriority: 0 } }],
          totalCount: [{ $count: 'count' }],
        },
      },
    ];

    const result = await Movie.aggregate(pipeline);
    const movies = result[0].movies;
    const totalMovies = result[0].totalCount[0]?.count || 0;
    const totalPages = Math.ceil(totalMovies / limit) || 1;

    return sendResponse(res, 200, true, 'Movies retrieved successfully', {
      movies,
      currentPage: pageNum,
      totalPages,
      totalMovies,
    });
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
});

// 4. POST /api/movies - Add Movie with auto-generated Movie Code & Duplicate Check
router.post('/', async (req, res) => {
  try {
    const { title, genre, releaseYear, runtime, platform, priority } = req.body;

    // Input Validation
    if (!title || !genre || !releaseYear || !runtime || !platform || !priority) {
      return sendResponse(res, 400, false, 'All fields are required');
    }

    const yearNum = Number(releaseYear);
    const runtimeNum = Number(runtime);
    const priorityNum = Number(priority);

    if (isNaN(yearNum) || yearNum < 1950 || yearNum > CURRENT_YEAR) {
      return sendResponse(
        res,
        400,
        false,
        `Release Year must be between 1950 and ${CURRENT_YEAR}`
      );
    }

    if (isNaN(runtimeNum) || runtimeNum < 30 || runtimeNum > 300) {
      return sendResponse(res, 400, false, 'Runtime must be between 30 and 300 minutes');
    }

    if (isNaN(priorityNum) || priorityNum < 1 || priorityNum > 5) {
      return sendResponse(res, 400, false, 'Priority must be between 1 and 5');
    }

    // Duplicate Check (Case-insensitive Title + Release Year)
    const escapedTitle = title.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const existingMovie = await Movie.findOne({
      title: { $regex: `^${escapedTitle}$`, $options: 'i' },
      releaseYear: yearNum,
    });

    if (existingMovie) {
      return sendResponse(
        res,
        409,
        false,
        `"${title.trim()}" (${yearNum}) already exists in your watchlist.`
      );
    }

    // Generate Movie Code: MV-<releaseYear>-<3-digit sequence>
    const lastMovieInYear = await Movie.findOne({ releaseYear: yearNum })
      .sort({ movieCode: -1 })
      .select('movieCode');

    let nextSeq = 1;
    if (lastMovieInYear && lastMovieInYear.movieCode) {
      const parts = lastMovieInYear.movieCode.split('-');
      const lastSeq = parseInt(parts[2], 10);
      if (!isNaN(lastSeq)) nextSeq = lastSeq + 1;
    }

    const movieCode = `MV-${yearNum}-${String(nextSeq).padStart(3, '0')}`;

    // Explicitly ignore any client-supplied movieCode, status, rating, or watchedDate
    const newMovie = await Movie.create({
      movieCode,
      title: title.trim(),
      genre,
      releaseYear: yearNum,
      runtime: runtimeNum,
      platform,
      priority: priorityNum,
      status: 'To Watch',
      rating: null,
      watchedDate: null,
    });

    return sendResponse(res, 201, true, 'Movie added successfully', newMovie);
  } catch (error) {
    if (error.code === 11000) {
      return sendResponse(
        res,
        409,
        false,
        'Duplicate movie detected (same Title and Release Year).'
      );
    }
    return sendResponse(res, 400, false, error.message);
  }
});

// 5. PUT /api/movies/:id - Edit Movie (Title, Genre, Runtime, Platform, Priority only)
router.put('/:id', async (req, res) => {
  try {
    const { title, genre, runtime, platform, priority } = req.body;
    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      return sendResponse(res, 404, false, 'Movie not found');
    }

    if (title !== undefined) {
      if (!title.trim()) return sendResponse(res, 400, false, 'Title cannot be empty');

      // Check duplicate if title changed
      const escapedTitle = title.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const duplicate = await Movie.findOne({
        _id: { $ne: movie._id },
        title: { $regex: `^${escapedTitle}$`, $options: 'i' },
        releaseYear: movie.releaseYear,
      });

      if (duplicate) {
        return sendResponse(
          res,
          409,
          false,
          `"${title.trim()}" (${movie.releaseYear}) already exists.`
        );
      }
      movie.title = title.trim();
    }

    if (genre !== undefined) movie.genre = genre;

    if (runtime !== undefined) {
      const runtimeNum = Number(runtime);
      if (isNaN(runtimeNum) || runtimeNum < 30 || runtimeNum > 300) {
        return sendResponse(res, 400, false, 'Runtime must be between 30 and 300 minutes');
      }
      movie.runtime = runtimeNum;
    }

    if (platform !== undefined) movie.platform = platform;

    if (priority !== undefined) {
      const priorityNum = Number(priority);
      if (isNaN(priorityNum) || priorityNum < 1 || priorityNum > 5) {
        return sendResponse(res, 400, false, 'Priority must be between 1 and 5');
      }
      movie.priority = priorityNum;
    }

    // Notice: movieCode and releaseYear are strictly NOT updated
    await movie.save();

    return sendResponse(res, 200, true, 'Movie updated successfully', movie);
  } catch (error) {
    return sendResponse(res, 400, false, error.message);
  }
});

// 6. PATCH /api/movies/:id/status - Status Workflow & Mandatory Rating Rule
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, rating } = req.body;
    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      return sendResponse(res, 404, false, 'Movie not found');
    }

    const currentStatus = movie.status;

    if (!status || !['To Watch', 'Watching', 'Watched'].includes(status)) {
      return sendResponse(res, 400, false, 'Invalid status value provided');
    }

    if (currentStatus === status) {
      return sendResponse(res, 400, false, `Movie is already in "${status}" status`);
    }

    // State Transition Rules
    const allowedTransitions = {
      'To Watch': ['Watching', 'Watched'],
      Watching: ['Watched', 'To Watch'],
      Watched: [], // Final state
    };

    if (!allowedTransitions[currentStatus].includes(status)) {
      return sendResponse(
        res,
        400,
        false,
        `Invalid status transition: Cannot change from "${currentStatus}" to "${status}".`
      );
    }

    // Rating Rules
    if (status === 'Watched') {
      const ratingNum = Number(rating);
      if (rating === undefined || rating === null || isNaN(ratingNum) || ratingNum < 1 || ratingNum > 10) {
        return sendResponse(
          res,
          400,
          false,
          'A rating between 1 and 10 is mandatory when marking a movie as Watched.'
        );
      }
      movie.rating = ratingNum;
      movie.watchedDate = new Date();
    } else {
      // Moving between To Watch and Watching: reject if rating is supplied
      if (rating !== undefined && rating !== null) {
        return sendResponse(
          res,
          400,
          false,
          'Rating can only be assigned when a movie is in Watched status.'
        );
      }
    }

    movie.status = status;
    await movie.save();

    return sendResponse(res, 200, true, `Status updated to "${status}"`, movie);
  } catch (error) {
    return sendResponse(res, 400, false, error.message);
  }
});

// 7. PATCH /api/movies/:id/rating - Edit Rating (Only for Watched movies)
router.patch('/:id/rating', async (req, res) => {
  try {
    const { rating } = req.body;
    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      return sendResponse(res, 404, false, 'Movie not found');
    }

    if (movie.status !== 'Watched') {
      return sendResponse(
        res,
        400,
        false,
        'Rating can only be set or edited for movies in "Watched" status.'
      );
    }

    const ratingNum = Number(rating);
    if (rating === undefined || rating === null || isNaN(ratingNum) || ratingNum < 1 || ratingNum > 10) {
      return sendResponse(res, 400, false, 'Rating must be between 1 and 10');
    }

    movie.rating = ratingNum;
    await movie.save();

    return sendResponse(res, 200, true, 'Rating updated successfully', movie);
  } catch (error) {
    return sendResponse(res, 400, false, error.message);
  }
});

// 8. DELETE /api/movies/:id - Delete Movie (Forbidden if status === 'Watching')
router.delete('/:id', async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      return sendResponse(res, 404, false, 'Movie not found');
    }

    if (movie.status === 'Watching') {
      return sendResponse(
        res,
        400,
        false,
        'Cannot delete a movie that is currently in "Watching" status.'
      );
    }

    await Movie.findByIdAndDelete(req.params.id);

    return sendResponse(res, 200, true, 'Movie deleted successfully', null);
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
});

module.exports = router;