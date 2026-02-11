# FyahTrakz - Google Play Store Listing

## App Icon
Download from: https://static.prod-images.emergentagent.com/jobs/4421c195-4ab1-42a5-9802-33ef6389b9f3/images/9cc646693b1b5aece6b0a2dc57b61cb25e1aadd1a62f6c4aa3d4cb73a7fb4e40.png

Requirements:
- Size: 512x512 PNG
- 32-bit PNG (with alpha)
- No rounded corners (Google applies them automatically)

---

## Store Listing Details

### App Name (30 characters max)
```
FyahTrakz
```

### Short Description (80 characters max)
```
Stream fire music from independent artists. Discover, playlist, repeat. 🔥
```

### Full Description (4000 characters max)
```
🔥 FyahTrakz - Where Music Comes Alive 🔥

Discover the hottest tracks from independent artists around the world. FyahTrakz is your gateway to fresh, authentic music that you won't find anywhere else.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎵 FOR LISTENERS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• Stream unlimited music from talented independent artists
• Create and manage your personal playlists
• Get personalized recommendations based on your taste
• Search across songs, artists, albums, and playlists
• Track your listening history
• Discover new releases and trending tracks
• Background playback - music keeps playing while you use other apps

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎤 FOR ARTISTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• Upload your music and reach new fans
• Keep 100% of your rights
• Track your plays and stats with the Artist Dashboard
• Build your fanbase with your artist profile
• Get discovered through our recommendation engine

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ FEATURES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎧 High-quality audio streaming
🔥 Sleek dark theme with fire-inspired design
📱 Background playback with lock screen controls
🔍 Powerful search across all content
📊 Artist analytics and insights
🎨 Beautiful, intuitive interface
🔒 Secure authentication

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💎 SUBSCRIPTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FyahTrakz offers a premium subscription for unlimited access to all music content. Subscribe to support independent artists and enjoy ad-free, unlimited streaming.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Join the FyahTrakz community today and discover music that sets your soul on fire! 🔥🎶

Website: https://fyahtrakz.com
```

---

## Category
**Primary**: Music & Audio
**Secondary**: Entertainment (optional)

---

## Content Rating
- **Rating**: Teen (suitable for ages 13+)
- **Content**: No violence, no sexual content, user-generated music content

---

## Pricing & Distribution
- **Price**: Free
- **In-app purchases**: Yes (Subscription: AUD $14.99/month)
- **Countries**: All countries (or select specific ones)

---

## Contact Details (Required)
- **Email**: [Your support email]
- **Website**: https://fyahtrakz.com
- **Privacy Policy URL**: https://fyahtrakz.com/privacy (you'll need to create this)

---

## Screenshots Required

### Phone Screenshots (Required)
- Minimum: 2 screenshots
- Recommended: 4-8 screenshots
- Size: 16:9 or 9:16 aspect ratio (e.g., 1080x1920)

**Suggested screenshots to capture:**
1. Home page showing featured content
2. Music player with a song playing
3. Search results page
4. Artist profile page
5. Playlist view
6. Artist dashboard (for artists)

### Tablet Screenshots (Optional but recommended)
- Size: 16:9 or 9:16 aspect ratio (e.g., 1920x1200)

---

## Feature Graphic (Required)
- Size: 1024x500 PNG or JPG
- This is the banner shown at the top of your store listing

---

## How to Take Screenshots

### Option 1: From Browser (Easiest)
1. Open Chrome DevTools (F12)
2. Click device toolbar icon (or Ctrl+Shift+M)
3. Select a phone resolution (e.g., Pixel 5)
4. Navigate to each page and take screenshots

### Option 2: From Android Emulator
1. Open Android Studio
2. Run the app in emulator
3. Use emulator's screenshot button

### Option 3: From Real Device
1. Install APK on Android phone
2. Use Power + Volume Down to screenshot

---

## Pre-Launch Checklist

☐ Google Play Console account created ($25)
☐ App icon (512x512 PNG) ready
☐ At least 2 phone screenshots ready
☐ Feature graphic (1024x500) ready
☐ Privacy policy page created
☐ App description finalized
☐ Signed APK or AAB built
☐ Contact email set up

---

## Building the Release APK

On your local machine with Android Studio:

```bash
cd frontend
yarn build
npx cap sync android
cd android
./gradlew bundleRelease
```

The AAB file will be at:
`android/app/build/outputs/bundle/release/app-release.aab`

Note: You'll need to create a signing key first. Android Studio will guide you through this when you select Build > Generate Signed Bundle/APK.
