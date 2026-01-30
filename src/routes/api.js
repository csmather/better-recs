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
 * Generate recommendations from multiple playlists
 * 
 * Body: {
 *   playlistUrls: ["url1", "url2", ...],
 *   limit: 20,
 *   minFrequency: 2
 * }
 */
router.post('/recommendations/multiple', async (req, res) => {
  try {
    const { playlistUrls, limit, minFrequency } = req.body;

    if (!playlistUrls || !Array.isArray(playlistUrls) || playlistUrls.length === 0) {
      return res.status(400).json({ 
        error: 'playlistUrls array is required' 
      });
    }

    const result = await recommendationEngine.getRecommendationsFromMultiple(
      playlistUrls,
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
