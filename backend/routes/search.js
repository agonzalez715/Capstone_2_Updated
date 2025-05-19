/*
 * backend/routes/search.js
 *
 * Defines the search endpoint that proxies requests to the OMDb API.
 * Supports keyword-based search with pagination.
 */

// ── 1. Import Dependencies ──────────────────────────────────────────────
const express = require('express');   // Express framework for routing
const axios   = require('axios');     // HTTP client for calling external APIs

// Create a new router instance
const router = express.Router();

// ── 2. GET /api/search ─────────────────────────────────────────────────
// Query parameters:
//   q    = the search keyword (required)
//   page = page number for paginated results (optional, defaults to 1)
router.get('/', async (req, res, next) => {
  // Extract 'q' and 'page' from the query string
  const keyword = req.query.q;
  const page    = req.query.page || 1;

  // Validate that the keyword is provided
  if (!keyword) {
    // Missing search term: respond with HTTP 400 Bad Request
    return res
      .status(400)
      .json({ error: 'Missing query param q' });
  }

  try {
    // Make a GET request to OMDb's search endpoint
    const response = await axios.get('http://www.omdbapi.com/', {
      params: {
        apikey: process.env.OMDB_API_KEY,  // API key from your .env file
        s:      keyword,                   // 's' parameter triggers a fuzzy search
        page:   page                       // which result page to fetch (1-100)
      }
    });

    // OMDb returns { Response: 'False', Error: 'Movie not found!' } on no matches
    if (response.data.Response === 'False') {
      // No matches: respond with HTTP 404 Not Found and the OMDb error message
      return res
        .status(404)
        .json({ error: response.data.Error });
    }

    // Successful search: return an object with the results array and total count
    return res.json({
      results:      response.data.Search,                   // array of movie objects
      totalResults: parseInt(response.data.totalResults, 10) // convert string to integer
    });
  } catch (err) {
    // Unexpected error (network issues, OMDb downtime, etc.)
    // Forward the error to Express's default error handler
    return next(err);
  }
});

// ── 3. Export the router ─────────────────────────────────────────────────
module.exports = router;
