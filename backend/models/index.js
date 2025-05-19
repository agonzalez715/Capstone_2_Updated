/*
 * backend/models/index.js
 *
 * This file sets up the connection to the Postgres database using Sequelize,
 * defines the Review model schema, and synchronizes the model with the database.
 */

// ── 0. Load environment variables ───────────────────────────────────────────
// Use 'dotenv' to read the .env file and populate process.env
// We explicitly point to backend/.env to ensure it's loaded correctly.
const path = require('path');
require('dotenv').config({
  path: path.join(__dirname, '.env')  // __dirname = backend/ folder
});

// ── 1. Import Sequelize and DataTypes ───────────────────────────────────────
// Sequelize is the ORM, DataTypes defines column types for models
const { Sequelize, DataTypes } = require('sequelize');

// ── 2. Initialize Sequelize instance ────────────────────────────────────────
// Connect to the database using the DATABASE_URL from .env
// logging: false silences SQL output; set to console.log for debugging
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',   // Using Postgres as the database
  logging: false         // Disable SQL query logging; change to console.log to see raw SQL
});

// ── 3. Define the Review model ───────────────────────────────────────────────
// This creates a table named "Reviews" (pluralized automatically) with two columns
const Review = sequelize.define('Review', {
  movieTitle: {
    type: DataTypes.STRING,  // Variable-length string for the movie title
    allowNull: false         // Title is required (NOT NULL)
  },
  reviewText: {
    type: DataTypes.TEXT,    // Longer text field for the review body
    allowNull: false         // Review text is required
  }
}, {
  // Optional model settings:
  timestamps: true,         // Adds createdAt and updatedAt fields
  underscored: true         // Uses snake_case column names instead of camelCase
});

// ── 4. Synchronize model with the database ────────────────────────────────────
// sequelize.sync() will create the table if it doesn't exist
// In production, consider using migrations instead of sync()
sequelize.sync()
  .then(() => console.log('✔️  Database & tables synced'))
  .catch(err => console.error('❌  DB sync error:', err));

// ── 5. Export the Sequelize instance and models ───────────────────────────────
// Other parts of the app can import { sequelize, Review } to query or modify reviews
module.exports = {
  sequelize,  // The database connection
  Review      // The Review model for CRUD operations
};
