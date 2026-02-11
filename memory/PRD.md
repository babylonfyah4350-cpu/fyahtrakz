# FyahTrakz - Music Streaming Platform PRD

## Original Problem Statement
Build a Music Streaming app similar to Spotify with:
1. Artist-uploaded music
2. All core features (Basic playback, Playlists, Search)
3. JWT-based custom authentication for "Listeners" and "Artists"
4. Music recommendations
5. Dark theme with fire-themed color scheme (orange/gold gradient)
6. Stripe monetization: AUD$2.99 per song upload for artists, AUD$14.99/month subscription for listeners
7. Comprehensive admin panel
8. Custom FyahTrakz branding

## Architecture Overview

### Backend (FastAPI + MongoDB)
- **Authentication**: JWT-based auth with bcrypt password hashing
- **User Types**: Listener, Artist, Admin accounts
- **Data Models**: Users, Songs, Albums, Playlists, Listening History, Subscriptions, Payments
- **Payment Integration**: Stripe via emergentintegrations library

### Frontend (React + Tailwind CSS)
- **Design System**: Dark theme with orange/gold fire-themed gradient
- **Components**: Shadcn/UI components, custom Player, Sidebar
- **State Management**: React Context (Auth, Player)

## User Personas

### Listener
- Browse and discover music (requires AUD$14.99/month subscription)
- Create and manage playlists
- Search for songs, artists, albums
- Get personalized recommendations
- Track listening history

### Artist
- Upload songs with cover art (AUD$2.99 per song credit)
- Create albums
- View dashboard with stats (plays, songs, albums)
- Manage artist profile with bio and genre

### Admin
- User management (view/ban users, manage subscriptions/credits)
- Content moderation (approve/remove songs)
- Financial dashboard (view payments, revenue)
- Platform settings (change pricing, toggle features)
- Analytics (user stats, top content)

## Core Requirements

### P0 Features ✅
- [x] User registration (Listener/Artist with separate registration pages)
- [x] JWT authentication (Login/Logout)
- [x] Music player with controls (Play, Pause, Skip, Volume, Shuffle, Repeat)
- [x] Song upload for artists (with credit system)
- [x] Search functionality (Songs, Artists, Albums, Playlists)
- [x] Playlist CRUD operations
- [x] Dark theme UI with fire branding
- [x] Stripe payment integration
- [x] Admin panel with full functionality

### P1 Features ✅
- [x] Artist dashboard with stats
- [x] Music recommendations based on listening history
- [x] Browse artists page
- [x] Album support
- [x] Listening history tracking
- [x] Genre browsing
- [x] **Separate artist registration page** with bio and genre preferences
- [x] **Admin password change** functionality

### P2 Features (Backlog)
- [ ] Artist landing page for marketing
- [ ] Social features (Follow artists, share playlists)
- [ ] Lyrics display
- [ ] Advanced playlist features (collaborative)
- [ ] Mobile responsive improvements
- [ ] Music discovery features (playlists by mood)

## What's Been Implemented

### December 11, 2025
- **Artist Registration Page** (`/register/artist`) with dedicated design
  - Primary genre dropdown (17 genres)
  - Artist bio textarea
  - Link from main registration page
- **Admin Change Password** feature in `/admin/settings`
  - Current password validation
  - New password with confirmation
  - Minimum 6 character enforcement

### Previous Implementation
- Full backend API with 30+ endpoints
- Complete frontend with 15+ pages
- JWT authentication system
- Music player with full controls
- Playlist management
- Artist upload functionality with credit system
- Dashboard with analytics
- Search with tabs (Songs, Artists, Albums, Playlists)
- Stripe integration for subscriptions and uploads
- Full admin panel (Users, Content, Finance, Settings, Analytics)
- Custom FyahTrakz branding with logo and favicon

## Tech Stack
- **Backend**: FastAPI, MongoDB (Motor), JWT, bcrypt, emergentintegrations
- **Frontend**: React, Tailwind CSS, Shadcn/UI, Lucide Icons
- **Payments**: Stripe (via emergentintegrations)
- **Audio**: HTML5 Audio API

## API Endpoints Summary
- Auth: `/api/auth/register`, `/api/auth/login`, `/api/auth/me`, `/api/auth/change-password`
- Songs: `/api/songs`, `/api/songs/{id}`, `/api/songs/{id}/play`
- Albums: `/api/albums`, `/api/albums/{id}`
- Playlists: `/api/playlists`, `/api/playlists/{id}`, `/api/playlists/my`
- Artists: `/api/artists`, `/api/artists/{id}`, `/api/artists/profile`
- Search: `/api/search?q={query}`
- Recommendations: `/api/recommendations`
- Browse: `/api/browse/genres`, `/api/browse/featured`
- Payments: `/api/payments/subscription/checkout`, `/api/payments/upload/checkout`
- Admin: `/api/admin/users`, `/api/admin/songs`, `/api/admin/finance/*`, `/api/admin/settings`, `/api/admin/analytics/*`

## Database Schema
- **users**: `{id, name, email, password_hash, user_type, bio, genre, is_admin, has_subscription, upload_credits}`
- **songs**: `{id, title, artist_id, album_id, genre, file_url, play_count}`
- **albums**: `{id, title, artist_id, cover_image_url}`
- **playlists**: `{id, name, owner_id, is_public, song_ids}`
- **subscriptions**: `{id, user_id, status, expires_at}`
- **payment_transactions**: `{id, user_id, amount, payment_type, status}`

## Credentials
- **Admin Account**: admin@fyahtrakz.com / admin123 (default - should be changed!)

## Next Action Items
1. Add artist landing page for marketing
2. Implement social features (follow artists)
3. Add lyrics feature for songs
4. Mobile responsive improvements
