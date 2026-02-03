const spotifyService = require('./spotifyService');
const lastfmService = require('./lastfmService');

/**
 * Recommendation Engine
 * Combines Spotify and Last.fm data to generate recommendations
 */

class RecommendationEngine {
  /**
   * Generate recommendations from a Spotify playlist
   * 
   * Flow:
   * 1. Get artists from Spotify playlist
   * 2. Query Last.fm for similar artists to each seed artist
   * 3. Aggregate and rank results
   * 4. Filter out artists already in the seed playlist
   */
  async getRecommendations(playlistUrl, options = {}) {
    const {
      limit = 20,           // How many recommendations to return
      minFrequency = 1,     // Minimum times an artist must appear to be included
    } = options;

    try {
      console.log('Fetching artists from playlist...');
      // Step 1: Get seed artists from Spotify playlist
      const seedArtists = await spotifyService.getPlaylistArtists(playlistUrl);
      console.log(`Found ${seedArtists.length} unique artists in playlist`);

      // Extract just the names for Last.fm
      const seedArtistNames = seedArtists.map(a => a.name);

      console.log('Fetching similar artists from Last.fm...');
      // Step 2: Get similar artists from Last.fm
      const similarArtists = await lastfmService.getSimilarArtistsForMultiple(seedArtistNames);
      console.log(`Found ${similarArtists.length} similar artists`);

      // Step 3: Filter out seed artists (don't recommend what's already in the playlist)
      const seedNamesLower = seedArtistNames.map(name => name.toLowerCase());
      const filtered = similarArtists.filter(artist => {
        const artistNameLower = artist.name.toLowerCase();
        return !seedNamesLower.includes(artistNameLower) && 
               artist.frequency >= minFrequency;
      });

      // Step 4: Return top results
      const recommendations = filtered.slice(0, limit);

      return {
        seedArtists: seedArtists,
        recommendations: recommendations,
        totalFound: filtered.length,
      };
    } catch (error) {
      console.error('Error generating recommendations:', error.message);
      throw error;
    }
  }

  /**
   * Generate recommendations from multiple playlists with optional weights
   * Useful for combining different mood playlists, trusted curator playlists, etc.
   *
   * @param {Array} playlists - Array of playlist URLs (strings) OR { url, weight } objects
   *   If weights provided, they should sum to 100 (will be normalized to decimals)
   *   If no weights, defaults to equal distribution
   */
  async getRecommendationsFromMultiple(playlists, options = {}) {
    // Normalize input: support both string URLs and { url, weight } objects
    const playlistsWithWeights = playlists.map((p, i) => {
      if (typeof p === 'string') {
        return { url: p, weight: 100 / playlists.length };
      }
      return p;
    });

    // Normalize weights to decimals (input is 0-100, convert to 0-1)
    const totalWeight = playlistsWithWeights.reduce((sum, p) => sum + p.weight, 0);
    playlistsWithWeights.forEach(p => {
      p.weight = p.weight / totalWeight; // Normalize so weights sum to 1
    });

    // Get artists from all playlists with their weights
    // Track artist weights: if an artist appears in multiple playlists, combine weights
    const artistWeightMap = new Map(); // artist id -> { artist, weight }

    for (const playlist of playlistsWithWeights) {
      const artists = await spotifyService.getPlaylistArtists(playlist.url);
      console.log(`Playlist (weight ${(playlist.weight * 100).toFixed(0)}%): ${artists.length} artists`);

      for (const artist of artists) {
        if (artistWeightMap.has(artist.id)) {
          // Artist in multiple playlists: add the weights
          artistWeightMap.get(artist.id).weight += playlist.weight;
        } else {
          artistWeightMap.set(artist.id, {
            ...artist,
            weight: playlist.weight,
          });
        }
      }
    }

    const uniqueArtists = Array.from(artistWeightMap.values());
    console.log(`Found ${uniqueArtists.length} unique artists across ${playlists.length} playlists`);

    // Create weighted artist list for Last.fm
    const weightedArtists = uniqueArtists.map(a => ({
      name: a.name,
      weight: a.weight,
    }));

    const similarArtists = await lastfmService.getSimilarArtistsForMultiple(weightedArtists);

    const seedNamesLower = uniqueArtists.map(a => a.name.toLowerCase());
    const filtered = similarArtists.filter(artist => {
      const artistNameLower = artist.name.toLowerCase();
      return !seedNamesLower.includes(artistNameLower) &&
             artist.frequency >= (options.minFrequency || 1);
    });

    const recommendations = filtered.slice(0, (options.limit || 20));

    return {
      seedArtists: uniqueArtists.map(a => ({ id: a.id, name: a.name })), // Don't expose weights
      playlistWeights: playlistsWithWeights.map(p => ({ url: p.url, weight: Math.round(p.weight * 100) })),
      recommendations: recommendations,
      totalFound: filtered.length,
    };
  }
}

module.exports = new RecommendationEngine();
