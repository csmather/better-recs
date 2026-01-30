# Project Context

## Background
Building a personal music recommendation engine because Spotify's algorithm doesn't work well for eclectic taste. The goal is to compete with Spotify's "prompted playlist" feature but with better results that reflect genuine craftsmanship over algorithmic mediocrity.

**Music taste profile:**
- Eclectic across genres: experimental electronic, Brazilian orchestral soul, ambient/IDM, post-punk, dreamy cloud rap, contemporary R&B
- Examples that would go in same playlist: Yasuaki Shimizu, Wes Montgomery, Hiroshi Yoshimura, Sosh & Takeda, Nujabes, Winter, Rei Harakami, Vegyn, John Glacier
- Values "well-crafted, unique, just-right" over genre conventions
- Best recs come from: trusted people's taste, NTS, Last.fm (better than Spotify's algorithm)
- Has 87K+ scrobbles across 8K+ artists on Last.fm (username: hey_scoob)

## Learning Goals
- **New to Node/Express/SQL** - want explanations as we build, not just code dumps
- Comfortable with HTML/JS/CSS, some React experience, created WordPress plugins and web dashboards
- Want to understand the "why" behind architectural decisions
- Learning incrementally: understand each piece before moving to the next

## Current State
- ✅ **Backend MVP complete**: Express server with Spotify + Last.fm integration
- ✅ Code structure organized: services (Spotify, Last.fm, recommendation engine) + routes
- ⏸️ **Needs API keys** added to .env file before testing
- 🔜 **Next steps**: Test with real playlist, then build simple frontend

## Architecture Decisions

**Tech Stack:**
- Node.js/Express (backend)
- Vanilla JS/HTML/CSS (frontend) - deferring React to keep it simple initially
- SQLite (database) - will add later when implementing feedback features
- Free APIs: Spotify Web API + Last.fm API

**Why these choices:**
- Express: industry standard, good for learning
- Vanilla JS first: more familiar, less overhead than React
- SQLite: simple file-based DB, no server needed
- Start simple, add complexity incrementally

## How It Works

**Core algorithm:**
1. Extract artists from Spotify playlist(s)
2. Query Last.fm for similar artists to each seed artist
3. Aggregate results: artists appearing multiple times (similar to many seed artists) rank higher
4. Score by: frequency × average similarity score
5. Filter out seed artists, return top recommendations

**Key insight:** Last.fm's collaborative filtering (based on co-listening behavior) captures cross-genre connections better than Spotify's genre-based approach.

## Development Approach

**Phase 1 (Current): Backend MVP**
- ✅ Single playlist → recommendations
- ✅ Multiple playlists → recommendations
- Test with curl before adding UI

**Phase 2: Simple Frontend**
- Basic HTML form for playlist URL input
- Display recommendations in a list
- No styling initially - functionality first

**Phase 3: Enhanced Features**
- Multiple playlist inputs
- Export recommendations as Spotify playlist
- Better UI/UX

**Phase 4: Feedback System**
- Add SQLite database
- Thumbs up/down on recommendations
- Adjust future recommendations based on feedback

**Phase 5: Advanced Features**
- Weighting different playlists
- Trusted curator integration (NTS, specific people)
- "More like this artist" exploration
- Discovery depth slider (safe → adventurous)

## Important Notes

- **No costs**: All APIs are free for non-commercial use
- **Learning priority**: Explain concepts before/during implementation
- **Incremental testing**: Test each piece works before moving on
- **Functionality first**: Polish UI/UX at the end
- **Personal use**: Building for own taste, not competing with Spotify's scale

## API Keys Needed

Before testing, add to `.env`:
1. **Spotify**: Client ID + Secret from https://developer.spotify.com/dashboard
2. **Last.fm**: API key from https://www.last.fm/api/account/create

## Testing Plan

1. Add API keys to `.env`
2. Start server: `npm start`
3. Test health: `curl http://localhost:3000/api/health`
4. Test with real playlist: `curl -X POST http://localhost:3000/api/recommendations -H "Content-Type: application/json" -d '{"playlistUrl":"SPOTIFY_PLAYLIST_URL"}'`
5. Verify results make sense for eclectic taste
6. Build frontend once backend is proven to work

## File Structure

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
├── .env                              # API keys (add yours here)
├── .env.example                      # Template
├── package.json                      # Dependencies
├── README.md                         # Setup instructions
└── PROJECT_CONTEXT.md               # This file
```

## Questions for Future Sessions

- Does the recommendation quality match expectations for eclectic taste?
- Are the similarity scores from Last.fm capturing the "well-crafted" quality?
- Should we adjust the scoring algorithm (frequency vs. similarity weight)?
- When to add database layer for feedback?
