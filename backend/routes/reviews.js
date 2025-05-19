/*
 * backend/routes/reviews.js
 *
 * This file defines the Express routes for creating and fetching movie reviews.
 * It uses the Review model from Sequelize to persist and retrieve data in Postgres.
 */

// ── 1. Import Dependencies ────────────────────────────────────────────────
const express = require('express');            // Express framework
const { Review } = require('../models');      // Review model defined in models/index.js

// Create a new router instance to group review-related routes
const router = express.Router();

// ── 2. POST /api/reviews ─────────────────────────────────────────────────
// Create a new review. Expects JSON body: { movieTitle: string, reviewText: string }
router.post('/', async (req, res, next) => {
  try {
    // Extract fields from the request body
    const { movieTitle, reviewText } = req.body;

    // Validate input: both fields must be present
    if (!movieTitle || !reviewText) {
      return res
        .status(400)                      // Bad Request
        .json({ error: 'movieTitle and reviewText are required' });
    }

    // Create a new review record in the database
    // Sequelize handles SQL INSERT under the hood
    const newReview = await Review.create({ movieTitle, reviewText });

    // Respond with the created review and a 201 Created status
    res.status(201).json(newReview);
  } catch (err) {
    // Delegate any errors to Express error-handling middleware
    next(err);
  }
});

// ── 3. GET /api/reviews/:title ────────────────────────────────────────────
// Retrieve all reviews for a given movie title.
router.get('/:title', async (req, res, next) => {
  try {
    // Use the title parameter from the URL path
    const title = req.params.title;

    // Query the database for reviews matching this movieTitle
    const reviews = await Review.findAll({
      where: { movieTitle: title }
    });

    // Return the array of review objects as JSON
    res.json(reviews);
  } catch (err) {
    // Handle errors by passing to the error handler
    next(err);
  }
});

// ── 4. Export the Router ────────────────────────────────────────────────
// Other parts of the app will mount this under '/api/reviews'
module.exports = router;
