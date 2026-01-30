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
   * Generate recommendations from multiple playlists
   * Useful for combining different mood playlists, trusted curator playlists, etc.
   */
  async getRecommendationsFromMultiple(playlistUrls, options = {}) {
    // Get artists from all playlists
    const allSeedArtists = [];
    
    for (const url of playlistUrls) {
      const artists = await spotifyService.getPlaylistArtists(url);
      allSeedArtists.push(...artists);
    }

    // Remove duplicate artists across playlists
    const uniqueArtists = Array.from(
      new Map(allSeedArtists.map(a => [a.id, a])).values()
    );

    console.log(`Found ${uniqueArtists.length} unique artists across ${playlistUrls.length} playlists`);

    // Same process as single playlist from here
    const seedArtistNames = uniqueArtists.map(a => a.name);
    const similarArtists = await lastfmService.getSimilarArtistsForMultiple(seedArtistNames);
    
    const seedNamesLower = seedArtistNames.map(name => name.toLowerCase());
    const filtered = similarArtists.filter(artist => {
      const artistNameLower = artist.name.toLowerCase();
      return !seedNamesLower.includes(artistNameLower) && 
             artist.frequency >= (options.minFrequency || 1);
    });

    const recommendations = filtered.slice(0, (options.limit || 20));

    return {
      seedArtists: uniqueArtists,
      recommendations: recommendations,
      totalFound: filtered.length,
    };
  }
}

module.exports = new RecommendationEngine();
