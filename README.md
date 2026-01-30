# Better Recs

A music recommendation engine that generates personalized recommendations based on Spotify playlists and Last.fm similarity data.

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure API Keys

Copy `.env.example` to `.env` and fill in your API credentials:

```bash
cp .env.example .env
```

Then edit `.env` with your keys:
- **Spotify**: Get Client ID and Secret from https://developer.spotify.com/dashboard
- **Last.fm**: Get API key from https://www.last.fm/api/account/create

### 3. Start the Server
```bash
npm start
```

Server will run on `http://localhost:3000`

## API Endpoints

### Health Check
```
GET /api/health
```

Returns server status.

### Single Playlist Recommendations
```
POST /api/recommendations
Content-Type: application/json

{
  "playlistUrl": "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M",
  "limit": 20,          // optional, default 20
  "minFrequency": 1     // optional, minimum appearances needed
}
```

Returns recommendations based on artists in the playlist.

### Multiple Playlist Recommendations
```
POST /api/recommendations/multiple
Content-Type: application/json

{
  "playlistUrls": [
    "https://open.spotify.com/playlist/...",
    "https://open.spotify.com/playlist/..."
  ],
  "limit": 20,
  "minFrequency": 2
}
```

Returns recommendations based on artists across multiple playlists.

## Testing with cURL

### Single playlist:
```bash
curl -X POST http://localhost:3000/api/recommendations \
  -H "Content-Type: application/json" \
  -d '{"playlistUrl":"https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M"}'
```

### Multiple playlists:
```bash
curl -X POST http://localhost:3000/api/recommendations/multiple \
  -H "Content-Type: application/json" \
  -d '{"playlistUrls":["url1","url2"]}'
```

## How It Works

1. **Extract Artists**: Fetches all tracks from the Spotify playlist and extracts unique artists
2. **Find Similar**: Queries Last.fm for similar artists to each seed artist
3. **Aggregate**: Combines results, counting frequency (artists similar to multiple seed artists rank higher)
4. **Score**: Ranks by combined frequency × similarity score
5. **Filter**: Removes seed artists and returns top recommendations

## Project Structure

```
better-recs/
├── src/
│   ├── routes/
│   │   └── api.js                    # API endpoint definitions
│   ├── services/
│   │   ├── spotifyService.js         # Spotify API integration
│   │   ├── lastfmService.js          # Last.fm API integration
│   │   └── recommendationEngine.js   # Core recommendation logic
│   └── server.js                     # Express server setup
├── .env                              # Your API keys (not committed)
├── .env.example                      # Template for API keys
├── package.json                      # Dependencies
└── README.md                         # This file
```

## Next Steps

- Add frontend UI for easier testing
- Implement user feedback (thumbs up/down)
- Add weighting for multiple playlists
- Store user preferences in database
