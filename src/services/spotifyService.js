const axios = require('axios');

/**
 * Spotify Service
 * Handles authentication and data fetching from Spotify API
 */

class SpotifyService {
  constructor() {
    this.clientId = process.env.SPOTIFY_CLIENT_ID;
    this.clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Get Spotify access token using Client Credentials flow
   * This gives us read-only access to public playlists
   */
  async getAccessToken() {
    // If we have a valid token, reuse it
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      // Spotify requires Basic Auth with base64-encoded credentials
      const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      
      const response = await axios.post(
        'https://accounts.spotify.com/api/token',
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.accessToken = response.data.access_token;
      // Token expires in 3600 seconds (1 hour), we'll refresh 5 min before
      this.tokenExpiry = Date.now() + (response.data.expires_in - 300) * 1000;
      
      return this.accessToken;
    } catch (error) {
      console.error('Error getting Spotify access token:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with Spotify');
    }
  }

  /**
   * Extract playlist ID from Spotify URL
   * Handles formats like:
   * - https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M
   * - spotify:playlist:37i9dQZF1DXcBWIGoYBM5M
   */
  extractPlaylistId(playlistUrl) {
    const patterns = [
      /playlist\/([a-zA-Z0-9]+)/,  // URL format
      /playlist:([a-zA-Z0-9]+)/,   // URI format
    ];

    for (const pattern of patterns) {
      const match = playlistUrl.match(pattern);
      if (match) {
        return match[1];
      }
    }

    // If no pattern matches, assume it's already a playlist ID
    return playlistUrl;
  }

  /**
   * Get all tracks from a playlist
   * Returns array of track objects with artist information
   */
  async getPlaylistTracks(playlistUrl) {
    try {
      const token = await this.getAccessToken();
      const playlistId = this.extractPlaylistId(playlistUrl);

      const response = await axios.get(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      // Extract track and artist info
      const tracks = response.data.items.map(item => ({
        name: item.track.name,
        artists: item.track.artists.map(artist => ({
          id: artist.id,
          name: artist.name,
        })),
      }));

      return tracks;
    } catch (error) {
      console.error('Error fetching playlist:', error.response?.data || error.message);
      throw new Error('Failed to fetch playlist from Spotify');
    }
  }

  /**
   * Get unique artists from playlist
   * Returns array of artist objects: [{ id, name }, ...]
   */
  async getPlaylistArtists(playlistUrl) {
    const tracks = await this.getPlaylistTracks(playlistUrl);
    
    // Flatten all artists and remove duplicates
    const artistMap = new Map();
    
    tracks.forEach(track => {
      track.artists.forEach(artist => {
        if (!artistMap.has(artist.id)) {
          artistMap.set(artist.id, artist);
        }
      });
    });

    return Array.from(artistMap.values());
  }
}

module.exports = new SpotifyService();
