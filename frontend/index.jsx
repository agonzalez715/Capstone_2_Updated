/*
 * frontend/index.jsx
 *
 * React front end for Movie Search & Reviews.
 * Uses React hooks for state and effect, and mounts into <div id="root">.
 */

// Import React hooks from the global React object
const { useState, useEffect } = React;

// Main App component function
function App() {
  // ── State Hooks ───────────────────────────────────────
  // keyword: current search input
  const [keyword, setKeyword]       = useState('');
  // page: current pagination page number
  const [page, setPage]             = useState(1);
  // movies: list of movie search results
  const [movies, setMovies]         = useState([]);
  // totalResults: total count of search hits from OMDb
  const [totalResults, setTotal]    = useState(0);
  // error: any error message to display to the user
  const [error, setError]           = useState('');
  // selected: title of the currently selected movie for reviews
  const [selected, setSelected]     = useState(null);
  // reviews: list of persisted reviews for the selected movie
  const [reviews, setReviews]       = useState([]);
  // reviewText: controlled input value for the review textarea
  const [reviewText, setReviewText] = useState('');

  // ── Effect Hook ───────────────────────────────────────
  // When `selected` changes (user picks a movie), fetch its reviews
  useEffect(() => {
    if (selected) {
      fetchReviews(selected);
    }
  }, [selected]);

  // ── Handler: Search Form Submit ─────────────────────────
  const handleSearch = async (e) => {
    e.preventDefault();            // Prevent default form reload
    if (!keyword.trim()) return;   // Do nothing on empty input
    setError('');                   // Clear previous errors
    setSelected(null);             // Reset review view
    await fetchMovies(keyword, 1); // Perform search on page 1
  };

  // ── Function: Fetch Movies from /api/search ─────────────
  const fetchMovies = async (q, p) => {
    setError('');    // Clear errors
    setMovies([]);   // Clear previous results
    setTotal(0);     // Reset total count
    try {
      // Call backend search endpoint
      const res  = await fetch(
        `/api/search?q=${encodeURIComponent(q)}&page=${p}`
      );
      const data = await res.json();          // Parse JSON response
      if (!res.ok) {
        // If HTTP status is not OK, throw an error to catch block
        throw new Error(data.error || 'Search failed');
      }
      // Update state with results and total count
      setMovies(data.results);
      setTotal(data.totalResults);
      setPage(p);
    } catch (err) {
      // On error, display message
      setError(err.message);
    }
  };

  // ── Function: Render Pagination Controls ────────────────
  const renderPagination = () => {
    const totalPages = Math.ceil(totalResults / 10);
    if (totalPages <= 1) return null; // No pagination if only one page

    // Build an array of page buttons
    const buttons = [];
    for (let p = 1; p <= totalPages; p++) {
      buttons.push(
        <button
          key={p}
          disabled={p === page}               // Disable current page button
          onClick={() => fetchMovies(keyword, p)} // Fetch that page on click
        >
          {p}
        </button>
      );
    }
    // Wrap buttons in a container div
    return <div className="pagination">{buttons}</div>;
  };

  // ── Handler: Select Movie for Reviews ───────────────────
  const selectMovie = (title) => {
    setSelected(title);     // Store selected movie title
    setReviewText('');      // Clear the review textarea
  };

  // ── Function: Fetch Reviews for Selected Movie ─────────
  const fetchReviews = async (title) => {
    try {
      const res  = await fetch(
        `/api/reviews/${encodeURIComponent(title)}`
      );
      const list = await res.json(); // List of review objects
      setReviews(list);              // Update reviews state
    } catch (err) {
      setError('Failed to load reviews.');
    }
  };

  // ── Handler: Submit New Review ─────────────────────────
  const submitReview = async () => {
    if (!reviewText.trim()) return; // Do nothing on empty textarea
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({
          movieTitle: selected,
          reviewText: reviewText
        })
      });
      if (!res.ok) throw new Error('Submit failed');
      setReviewText('');    // Clear textarea
      fetchReviews(selected); // Refresh review list
    } catch (err) {
      setError(err.message);
    }
  };

  // ── Handler: Delete a Review ───────────────────────────
  const deleteReview = async (id) => {
    if (!confirm('Delete this review?')) return;
    try {
      const res = await fetch(`/api/reviews/${id}`, {
        method: 'DELETE'
      });
      if (res.status !== 204) throw new Error('Delete failed');
      fetchReviews(selected); // Refresh list after deletion
    } catch (err) {
      setError(err.message);
    }
  };

  // ── JSX: Component Render ──────────────────────────────
  return (
    <div>
      {/* App Heading */}
      <h1>Movie Search & Reviews</h1>

      {/* Search Form: show only when no movie is selected */}
      {!selected && (
        <form onSubmit={handleSearch}>
          <input
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="Enter movie keyword"
          />
          <button type="submit">Search</button>
        </form>
      )}

      {/* Error Message Display */}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Movie Result Cards: show only when not reviewing */}
      {!selected && movies.map(m => (
        <div className="movie" key={m.imdbID}>
          <img
            src={
              m.Poster !== 'N/A'
                ? m.Poster
                : 'https://via.placeholder.com/100x150?text=No+Image'
            }
            alt={`Poster of ${m.Title}`}
          />
          <div className="movie-info">
            <h3>{m.Title} ({m.Year})</h3>
            <button onClick={() => selectMovie(m.Title)}>
              View & Add Reviews
            </button>
          </div>
        </div>
      ))}

      {/* Pagination Controls: only show during search mode */}
      {!selected && renderPagination()}

      {/* Reviews Section: show only when a movie is selected */}
      {selected && (
        <div id="reviews-container">
          {/* Back button to return to search results */}
          <button onClick={() => setSelected(null)}>
            ← Back to Search
          </button>
          <h2>Reviews for: {selected}</h2>

          {/* Review Submission Form */}
          <textarea
            value={reviewText}
            onChange={e => setReviewText(e.target.value)}
            placeholder="Write your review here..."
          />
          <button onClick={submitReview}>Submit Review</button>

          {/* Existing Reviews List or Empty State */}
          {reviews.length === 0
            ? <p>No reviews yet. Be the first!</p>
            : reviews.map(r => (
              <div className="review" key={r.id}>
                <p>{r.reviewText}</p>
                <small>Review #{r.id}</small><br/>
                <button onClick={() => deleteReview(r.id)}>
                  Delete
                </button>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

// Mount the App component into the root DOM node
ReactDOM.createRoot(document.getElementById('root')).render(<App />);