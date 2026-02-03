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
   *
   * @param {Array} artistsWithWeights - Array of { name, weight } objects
   *   weight is a decimal (0-1) representing playlist influence
   *   If just an array of strings, weights default to equal distribution
   */
  async getSimilarArtistsForMultiple(artistsWithWeights) {
    // Support both simple array of names and weighted objects
    const artists = artistsWithWeights.map(a =>
      typeof a === 'string' ? { name: a, weight: 1 / artistsWithWeights.length } : a
    );

    // Make all API calls in parallel for speed
    const promises = artists.map(a => this.getSimilarArtists(a.name));
    const results = await Promise.all(promises);

    // Track weighted scores for each similar artist
    const artistData = new Map();

    results.forEach((similarArtists, index) => {
      const seedWeight = artists[index].weight;

      similarArtists.forEach(similar => {
        const name = similar.name;

        if (!artistData.has(name)) {
          artistData.set(name, {
            frequency: 0,
            weightedScoreSum: 0,
            scores: [],
          });
        }

        const data = artistData.get(name);
        data.frequency += 1;
        // Weight the match score by the seed artist's playlist weight
        data.weightedScoreSum += similar.match * seedWeight;
        data.scores.push(similar.match);
      });
    });

    // Calculate aggregate score for each artist
    const aggregatedArtists = Array.from(artistData.keys()).map(name => {
      const data = artistData.get(name);
      const avgScore = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;

      return {
        name: name,
        frequency: data.frequency,           // How many seed artists is this similar to
        averageMatch: avgScore,              // Average similarity score (unweighted)
        combinedScore: data.weightedScoreSum, // Weighted score for ranking
      };
    });

    // Sort by combined score (weighted similarity = best match)
    return aggregatedArtists.sort((a, b) => b.combinedScore - a.combinedScore);
  }
}

module.exports = new LastFmService();
