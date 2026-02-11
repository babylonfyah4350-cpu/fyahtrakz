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
9. Mobile apps for iOS and Android

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

### Mobile (Capacitor)
- **Platforms**: iOS and Android
- **Features**: Background audio, lock screen controls, push notifications
- **Build**: Native apps wrapping the React web app

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

## What's Been Implemented

### December 11, 2025
- **Mobile App Setup (Capacitor)**
  - iOS and Android native projects created
  - Background audio playback configured
  - Lock screen controls enabled
  - Push notification support ready
  - Dark theme splash screen and status bar
  - Build scripts added to package.json
  - Mobile build documentation created

- **Artist Registration Page** (`/register/artist`)
  - Primary genre dropdown (17 genres)
  - Artist bio textarea
  - Link from main registration page

- **Admin Change Password** feature in `/admin/settings`
  - Current password validation
  - New password with confirmation

- **Database Query Optimizations**
  - MongoDB aggregation pipelines for play counts
  - Removed inefficient Python loops

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
- Full admin panel
- Custom FyahTrakz branding

## Tech Stack
- **Backend**: FastAPI, MongoDB (Motor), JWT, bcrypt, emergentintegrations
- **Frontend**: React, Tailwind CSS, Shadcn/UI, Lucide Icons
- **Mobile**: Capacitor 6 (iOS + Android)
- **Payments**: Stripe
- **Audio**: HTML5 Audio API

## Mobile App Commands

```bash
# Build web and sync to mobile
yarn build:mobile

# Open in Android Studio
yarn cap:open:android

# Open in Xcode
yarn cap:open:ios

# Sync changes to native projects
yarn cap:sync
```

## API Endpoints Summary
- Auth: `/api/auth/register`, `/api/auth/login`, `/api/auth/me`, `/api/auth/change-password`
- Songs: `/api/songs`, `/api/songs/{id}`, `/api/songs/{id}/play`
- Albums: `/api/albums`, `/api/albums/{id}`
- Playlists: `/api/playlists`, `/api/playlists/{id}`, `/api/playlists/my`
- Artists: `/api/artists`, `/api/artists/{id}`, `/api/artists/profile`
- Search: `/api/search?q={query}`
- Recommendations: `/api/recommendations`
- Payments: `/api/payments/subscription/checkout`, `/api/payments/upload/checkout`
- Admin: `/api/admin/users`, `/api/admin/songs`, `/api/admin/finance/*`, `/api/admin/settings`

## Production URLs
- **Website**: https://fyahtrakz.com
- **API**: https://fyahtrakz.com/api/

## Credentials
- **Admin Account**: admin@fyahtrakz.com / admin123 (change this!)

## Next Action Items
1. Generate app icons and splash screens for mobile
2. Test mobile builds on real devices
3. Submit to App Stores (requires developer accounts)

## Future Enhancements
- Artist landing page for marketing
- Social features (follow artists, share playlists)
- Lyrics feature for songs
- Offline music downloads
- Mobile responsive improvements
