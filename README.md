# CineTrack - Movie Watchlist Manager

CineTrack is a full-stack personal movie watchlist application for organizing movies,
tracking viewing progress, rating watched titles, and discovering what to watch next.

The project combines a React and Vite frontend with an Express and MongoDB backend.

## Features

- Add, edit, and delete movies
- Track movies as **To Watch**, **Watching**, or **Watched**
- Filter the watchlist by status and genre
- Search movies by title
- Navigate paginated movie results
- Assign priority values from 1 to 5
- Record ratings from 1 to 10 for watched movies
- Enforce valid movie status transitions
- Prevent duplicate title and release-year combinations
- Get a priority-based "Watch Next" recommendation
- View watchlist statistics, including:
  - Movies by status
  - Total hours watched
  - Average rating
  - Top watched genre
- Receive clear success and error notifications

## Tech Stack

### Frontend

- React 19
- Vite 8
- Axios
- Tailwind CSS 4
- Lucide React icons
- Oxlint

### Backend

- Node.js
- Express 5
- MongoDB
- Mongoose 9
- CORS
- dotenv

## Project Structure

```text
movietest/
└── movie-watchlist-manager/
    ├── backend/
    │   ├── models/
    │   │   └── Movie.js
    │   ├── routes/
    │   │   └── movieRoutes.js
    │   ├── .env
    │   ├── package.json
    │   └── server.js
    └── frontend/
        ├── public/
        ├── src/
        │   ├── components/
        │   ├── App.jsx
        │   └── main.jsx
        ├── index.html
        ├── package.json
        └── vite.config.js
```

## Prerequisites

Install the following before running the project:

- Node.js 20 or newer
- npm
- A MongoDB database, such as MongoDB Atlas or a local MongoDB server

## Installation

Clone the repository and enter the project directory:

```bash
git clone <repository-url>
cd movietest/movie-watchlist-manager
```

### 1. Configure the backend

Create or update `backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/cinetrack
```

For MongoDB Atlas, use the connection string from your Atlas cluster:

```env
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>/<database>
```

Replace the placeholder values and keep credentials out of source control.

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Install frontend dependencies

Open a second terminal:

```bash
cd movietest/movie-watchlist-manager/frontend
npm install
```

## Running the Application

Start the backend from `movie-watchlist-manager/backend`:

```bash
npm start
```

The backend package does not currently define an `npm start` script. Start the server directly:

```bash
node server.js
```

For automatic restarts during development, use Nodemon:

```bash
npx nodemon server.js
```

The API is available at `http://localhost:5000`.

Start the frontend from `movie-watchlist-manager/frontend`:

```bash
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`.

## API Reference

The API uses JSON request and response bodies.

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/` | Check API status |
| `GET` | `/api/movies` | List movies with filtering, search, and pagination |
| `GET` | `/api/movies/stats` | Retrieve watchlist statistics |
| `GET` | `/api/movies/watch-next` | Recommend the next highest-priority movie |
| `POST` | `/api/movies` | Create a movie |
| `PUT` | `/api/movies/:id` | Edit editable movie details |
| `PATCH` | `/api/movies/:id/status` | Change a movie's status |
| `PATCH` | `/api/movies/:id/rating` | Update a watched movie's rating |
| `DELETE` | `/api/movies/:id` | Delete a movie |

### Standard response

Successful and error responses use the same top-level structure:

```json
{
  "success": true,
  "message": "Description of the result",
  "data": {}
}
```

### Movie list query parameters

| Parameter | Example | Description |
| --- | --- | --- |
| `status` | `Watching` | Filter by `To Watch`, `Watching`, or `Watched` |
| `genre` | `Action` | Filter by genre |
| `search` | `batman` | Perform a case-insensitive title search |
| `page` | `2` | Select a result page; six movies are returned per page |

## Movie Rules

### Allowed values

- **Genres:** Action, Comedy, Drama, Horror, Sci-Fi, Romance, Thriller
- **Platforms:** Netflix, Prime Video, Hotstar, Theatre, Other
- **Statuses:** To Watch, Watching, Watched
- **Release year:** 1950 through the current year
- **Runtime:** 30 to 300 minutes
- **Priority:** 1 to 5
- **Rating:** 1 to 10

### Status workflow

```text
To Watch -> Watching -> Watched
To Watch -> Watched
Watching -> To Watch
```

- Watched is a final state and cannot be changed.
- Marking a movie as Watched requires a rating.
- Movies marked as Watching cannot be deleted.
- Release year and movie code cannot be changed after creation.
- Duplicate titles are rejected only when they share the same release year.

## Movie Codes

New movies receive an immutable code in the format:

```text
MV-<release-year>-<3-digit-sequence>
```

Example: `MV-2025-001`

## Available Frontend Commands

Run these commands from `movie-watchlist-manager/frontend`:

```bash
npm run dev      # Start the Vite development server
npm run build    # Create a production build
npm run preview  # Preview the production build
npm run lint     # Run Oxlint
```

## Troubleshooting

### MongoDB connection fails

- Verify that `MONGO_URI` is set correctly in `backend/.env`.
- Confirm that the database server is running.
- For MongoDB Atlas, allow the current network IP in Network Access.
- Verify the database username and password.

### Frontend cannot reach the API

- Confirm the backend is running on port `5000`.
- Open `http://localhost:5000` and verify that the API is responding.
- If the backend port is changed, update `API_BASE` in `frontend/src/App.jsx`.

### Port 5000 is already in use
https://movietest-1.onrender.com/
