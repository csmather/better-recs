const express = require('express');
const router = express.Router();
const recommendationEngine = require('../services/recommendationEngine');

/**
 * POST /api/recommendations
 * Generate recommendations from a single playlist
 * 
 * Body: {
 *   playlistUrl: "https://open.spotify.com/playlist/...",
 *   limit: 20,        // optional, default 20
 *   minFrequency: 1   // optional, default 1
 * }
 */
router.post('/recommendations', async (req, res) => {
  try {
    const { playlistUrl, limit, minFrequency } = req.body;

    if (!playlistUrl) {
      return res.status(400).json({ 
        error: 'playlistUrl is required' 
      });
    }

    const result = await recommendationEngine.getRecommendations(playlistUrl, {
      limit,
      minFrequency,
    });

    res.json(result);
  } catch (error) {
    console.error('Error in recommendations route:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to generate recommendations' 
    });
  }
});

/**
 * POST /api/recommendations/multiple
 * Generate recommendations from multiple playlists with optional weights
 *
 * Body (option 1 - simple):
 * {
 *   playlistUrls: ["url1", "url2", ...],
 *   limit: 20,
 *   minFrequency: 2
 * }
 *
 * Body (option 2 - weighted):
 * {
 *   playlists: [
 *     { url: "url1", weight: 60 },
 *     { url: "url2", weight: 40 }
 *   ],
 *   limit: 20,
 *   minFrequency: 2
 * }
 *
 * Weights should sum to 100. If not provided, defaults to equal distribution.
 */
router.post('/recommendations/multiple', async (req, res) => {
  try {
    const { playlistUrls, playlists, limit, minFrequency } = req.body;

    // Support both formats: simple array of URLs or weighted playlists
    let playlistInput;
    if (playlists && Array.isArray(playlists) && playlists.length > 0) {
      // Weighted format: [{ url, weight }, ...]
      playlistInput = playlists;
    } else if (playlistUrls && Array.isArray(playlistUrls) && playlistUrls.length > 0) {
      // Simple format: ["url1", "url2", ...] - weights will default to equal
      playlistInput = playlistUrls;
    } else {
      return res.status(400).json({
        error: 'Either playlistUrls array or playlists array with weights is required'
      });
    }

    const result = await recommendationEngine.getRecommendationsFromMultiple(
      playlistInput,
      { limit, minFrequency }
    );

    res.json(result);
  } catch (error) {
    console.error('Error in multiple recommendations route:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate recommendations'
    });
  }
});

/**
 * GET /api/health
 * Simple health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
