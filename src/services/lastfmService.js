const axios = require('axios');

/**
 * Last.fm Service
 * Handles fetching similar artists from Last.fm API
 */

class LastFmService {
  constructor() {
    this.apiKey = process.env.LASTFM_API_KEY;
    this.baseUrl = 'http://ws.audioscrobbler.com/2.0/';
  }

  /**
   * Get similar artists for a given artist name
   * Returns array of similar artists with match scores
   * Last.fm returns a "match" score from 0-1 indicating similarity
   */
  async getSimilarArtists(artistName, limit = 10) {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          method: 'artist.getsimilar',
          artist: artistName,
          api_key: this.apiKey,
          format: 'json',
          limit: limit,
        },
      });

      // Last.fm returns data in a nested structure
      const similarArtists = response.data.similarartists?.artist || [];
      
      // Normalize the data structure
      return similarArtists.map(artist => ({
        name: artist.name,
        match: parseFloat(artist.match), // Similarity score 0-1
        url: artist.url,
      }));
    } catch (error) {
      console.error(`Error fetching similar artists for ${artistName}:`, error.response?.data || error.message);
      // Return empty array instead of throwing - some artists might not be in Last.fm
      return [];
    }
  }

  /**
   * Get similar artists for multiple artists
   * This is the core of our recommendation engine
   * Returns aggregated results from all input artists
   */
  async getSimilarArtistsForMultiple(artistNames) {
    // Make all API calls in parallel for speed
    const promises = artistNames.map(name => this.getSimilarArtists(name));
    const results = await Promise.all(promises);

    // Flatten all results into one array
    const allSimilarArtists = results.flat();

    // Count how many times each artist appears
    // Artists that appear multiple times are similar to more of your seed artists
    const artistFrequency = new Map();
    const artistScores = new Map();

    allSimilarArtists.forEach(artist => {
      const name = artist.name;
      
      if (!artistFrequency.has(name)) {
        artistFrequency.set(name, 0);
        artistScores.set(name, []);
      }
      
      artistFrequency.set(name, artistFrequency.get(name) + 1);
      artistScores.get(name).push(artist.match);
    });

    // Calculate aggregate score for each artist
    const aggregatedArtists = Array.from(artistFrequency.keys()).map(name => {
      const frequency = artistFrequency.get(name);
      const scores = artistScores.get(name);
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

      return {
        name: name,
        frequency: frequency,           // How many seed artists is this similar to
        averageMatch: avgScore,         // Average similarity score
        combinedScore: frequency * avgScore,  // Simple ranking metric
      };
    });

    // Sort by combined score (high frequency + high similarity = best match)
    return aggregatedArtists.sort((a, b) => b.combinedScore - a.combinedScore);
  }
}

module.exports = new LastFmService();
