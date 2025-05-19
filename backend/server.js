// backend/server.js

// 0. Load .env into process.env, explicitly pointing at backend/.env
const path = require('path');
const envPath = path.join(__dirname, '.env');
console.log(`⮕ Loading .env from: ${envPath}`);
require('dotenv').config({ path: envPath });

// 0a. Verify the key loaded
console.log('⚙️  OMDb API key:', process.env.OMDB_API_KEY);

const express = require('express');
const app     = express();
const PORT    = process.env.PORT || 3000;

// ── Logger Middleware ────────────────────────────────────────
// Logs every incoming request: method and URL
app.use((req, res, next) => {
  console.log(`⮕ ${req.method} ${req.url}`);
  next();
});

// ── 1. JSON Body Parsing ─────────────────────────────────────
app.use(express.json());

// ── 2. Mount API Routes ──────────────────────────────────────
// Make sure you have a routes/search.js exporting an Express router
app.use('/api/search', require('./routes/search'));
app.use('/api/reviews', require('./routes/reviews'));

// ── 3. Serve React Static Assets ─────────────────────────────
app.use(express.static(path.join(__dirname, '../frontend')));

// ── 4. SPA Fallback Middleware (Catch-All) ────────────────────
// Any request not handled above will return your index.html
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ── 5. Start the Server ───────────────────────────────────────
app.listen(PORT, () => {
  console.log(`➡️  Server running at http://localhost:${PORT}`);
});