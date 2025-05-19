/*
 * frontend/index.js
 *
 * Implements the client-side logic for Movie Search & Reviews.
 * Uses native ES modules (type="module") and fetch() to interact with backend APIs.
 */

// ── 0. Global State ────────────────────────────────────────────────
// Track current search keyword, page number, and selected movie title
let currentKeyword = '';
let currentPage    = 1;
let currentTitle   = null;

// ── 1. Cache DOM Elements ─────────────────────────────────────────
const form       = document.getElementById('search-form');          // Search form element
const input      = document.getElementById('search-input');         // Text input for keywords
const errorDiv   = document.getElementById('error');                // Displays error messages
const resultsDiv = document.getElementById('results');              // Container for movie results
const pageDiv    = document.getElementById('pagination');           // Pagination controls
const reviewsDiv = document.getElementById('reviews-container');    // Container for reviews UI

// ── 2. Search Form Submission ───────────────────────────────────────
// When user submits the search form, reset state and perform the search
form.addEventListener('submit', async e => {
  e.preventDefault();                       // Prevent page reload
  currentKeyword = input.value.trim();      // Store the keyword
  currentPage    = 1;                       // Reset to first page
  currentTitle   = null;                    // Clear selected movie
  reviewsDiv.innerHTML = '';                // Clear any reviews UI

  if (!currentKeyword) return;              // Do nothing on empty input
  await doSearch(currentKeyword, currentPage);
});

// ── 3. Perform Search ───────────────────────────────────────────────
// Fetches movie list from /api/search, handles loading and errors
async function doSearch(keyword, page) {
  // Reset UI
  errorDiv.textContent   = '';
  reviewsDiv.innerHTML    = '';
  resultsDiv.innerHTML    = 'Loading…';
  pageDiv.innerHTML       = '';

  try {
    // Call backend search endpoint with keyword and page
    const res  = await fetch(`/api/search?q=${encodeURIComponent(keyword)}&page=${page}`);
    const data = await res.json();          // Parse JSON body

    // Handle HTTP errors
    if (!res.ok) throw new Error(data.error || 'Search failed');

    // Render results and pagination controls
    renderResults(data.results);
    renderPagination(data.totalResults, page);
  } catch (err) {
    // Show error message
    resultsDiv.innerHTML = '';
    errorDiv.textContent = err.message;
  }
}

// ── 4. Render Movie Results ────────────────────────────────────────
// Converts array of movie objects into HTML and injects into resultsDiv
function renderResults(movies) {
  if (!movies || movies.length === 0) {
    resultsDiv.innerHTML = '<p>No results found.</p>';
    return;
  }

  resultsDiv.innerHTML = movies.map(m => `
    <div class="movie">
      <img
        src="${m.Poster !== 'N/A' ? m.Poster : 'https://via.placeholder.com/100x150?text=No+Image'}"
        alt="Poster of ${m.Title}" />
      <div class="movie-info">
        <h3>${m.Title} (${m.Year})</h3>
        <p>Type: ${m.Type}</p>
        <div class="actions">
          <!-- Button to show & add reviews for this movie -->
          <button onclick="showReviews('${encodeURIComponent(m.Title)}')">
            View & Add Reviews
          </button>
        </div>
      </div>
    </div>
  `).join('');  // Join array into single string
}

// ── 5. Render Pagination Controls ─────────────────────────────────
// Creates page buttons and injects into pageDiv
function renderPagination(total, page) {
  const totalPages = Math.ceil(total / 10);  // OMDb returns 10 per page
  if (totalPages <= 1) return;

  const btns = [];
  for (let p = 1; p <= totalPages; p++) {
    // Disable current page button
    btns.push(
      `<button ${p===page?'disabled':''} onclick="goToPage(${p})">${p}</button>`
    );
  }
  pageDiv.innerHTML = btns.join('');
}

// Expose goToPage globally for inline onclick handlers
window.goToPage = p => {
  currentPage = p;
  doSearch(currentKeyword, p);
};

// ── 6. Show & Manage Reviews ────────────────────────────────────────
// showReviews replaces search UI with review form & list for selected movie
window.showReviews = async encodedTitle => {
  const title = decodeURIComponent(encodedTitle);
  currentTitle = title;

  // Clear search results UI
  resultsDiv.innerHTML = '';
  pageDiv.innerHTML    = '';
  errorDiv.textContent = '';

  // Render review form and fetch existing reviews
  renderReviewForm(title);
  await fetchAndRenderReviews(title);
};

// Renders the form to submit a new review
function renderReviewForm(title) {
  reviewsDiv.innerHTML = `
    <h2>Reviews for: ${title}</h2>
    <div class="review-form">
      <textarea id="review-text" placeholder="Write your review here..."></textarea><br/>
      <button id="submit-review">Submit Review</button>
    </div>
    <div id="reviews-list"><em>Loading reviews…</em></div>
  `;

  // Bind click handler for submit button
  document.getElementById('submit-review').onclick = submitReview;
}

// Fetches reviews from backend and displays them
async function fetchAndRenderReviews(title) {
  try {
    const res  = await fetch(`/api/reviews/${encodeURIComponent(title)}`);
    const list = await res.json();
    const container = document.getElementById('reviews-list');

    if (!list || list.length === 0) {
      container.innerHTML = '<p>No reviews yet. Be the first!</p>';
      return;
    }

    // Map each review to HTML
    container.innerHTML = list.map(r => `
      <div class="review">
        <p>${r.reviewText}</p>
        <small>Review #${r.id}</small>
      </div>
    `).join('');
  } catch (err) {
    document.getElementById('reviews-list').innerHTML =
      `<p style="color:red;">Error loading reviews.</p>`;
  }
}

// Handles sending a new review to the backend
async function submitReview() {
  const textEl    = document.getElementById('review-text');
  const reviewText = textEl.value.trim();

  // Do nothing if empty or no title selected
  if (!reviewText || !currentTitle) return;

  try {
    // POST the review to /api/reviews
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ movieTitle: currentTitle, reviewText })
    });

    if (!res.ok) throw new Error('Submit failed');

    // Clear textarea and reload reviews list
    textEl.value = '';
    await fetchAndRenderReviews(currentTitle);
  } catch (err) {
    alert(err.message);
  }
}
