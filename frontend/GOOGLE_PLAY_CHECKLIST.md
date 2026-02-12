# FyahTrakz - Google Play Store Submission Checklist

## ✅ Assets Ready

### App Icon (512x512)
**Download:** https://static.prod-images.emergentagent.com/jobs/4421c195-4ab1-42a5-9802-33ef6389b9f3/images/9cc646693b1b5aece6b0a2dc57b61cb25e1aadd1a62f6c4aa3d4cb73a7fb4e40.png

### Feature Graphic (1024x500)
**Download:** https://static.prod-images.emergentagent.com/jobs/4421c195-4ab1-42a5-9802-33ef6389b9f3/images/1fdac21d0f28f24c7de60b7b04b09021f1bccf2f67f7f152a0d9ba1753934b96.png
> Note: Resize to exactly 1024x500 before uploading

---

## 📱 Screenshots Needed

Take these from your phone or Android emulator at 1080x1920:

1. **Home/Discovery Page** - Shows "Discover New Music" and artist listings
2. **Login Page** - Shows FyahTrakz branding and sign-in form  
3. **Artist Registration** - Shows the artist sign-up flow
4. **Music Player** - Shows a song playing with controls
5. **Artist Dashboard** - Shows artist stats and upload option
6. **Search Page** - Shows search functionality

**Tip:** Use Android Studio emulator → Screenshot button, or install the APK on your phone.

---

## 📝 Store Listing Content

### App Name (30 chars max)
```
FyahTrakz
```

### Short Description (80 chars max)
```
Stream fire music from independent artists. Discover, playlist, repeat. 🔥
```

### Full Description
```
🔥 FyahTrakz - Where Music Comes Alive 🔥

Discover the hottest tracks from independent artists around the world. FyahTrakz is your gateway to fresh, authentic music.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎵 FOR LISTENERS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• Stream unlimited music from talented independent artists
• Create and manage your personal playlists
• Get personalized recommendations based on your taste
• Search across songs, artists, albums, and playlists
• Background playback - music keeps playing while you use other apps
• Lock screen controls

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎤 FOR ARTISTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• Upload your music and reach new fans
• Keep 100% of your rights
• Track your plays and stats with the Artist Dashboard
• Build your fanbase with your artist profile
• Connect your social media

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ FEATURES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎧 High-quality audio streaming
🔥 Sleek dark theme with fire-inspired design
📱 Background playback with lock screen controls
🔍 Powerful search across all content
📊 Artist analytics and insights
🔒 Secure authentication

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Join the FyahTrakz community today and discover music that sets your soul on fire! 🔥🎶

Website: https://fyahtrakz.com
```

---

## ⚙️ App Settings

| Setting | Value |
|---------|-------|
| **Application ID** | com.fyahtrakz.app |
| **Category** | Music & Audio |
| **Content Rating** | Teen |
| **Price** | Free |
| **Contains Ads** | No |
| **In-app Purchases** | Yes (Subscription $9.99 AUD/month) |

---

## 🔐 Privacy & Policy

### Privacy Policy URL (Required)
You need a privacy policy page. Create one at: `https://fyahtrakz.com/privacy`

**Must include:**
- What data you collect (email, name, listening history)
- How you use the data
- Third-party services (Stripe for payments)
- User rights (data deletion)
- Contact information

---

## 📋 Step-by-Step Submission

### Step 1: Build the App
```bash
cd frontend
yarn install
yarn build
npx cap sync android
npx cap open android
```

In Android Studio:
1. **Build → Generate Signed Bundle / APK**
2. Select **Android App Bundle**
3. Create keystore (SAVE IT SECURELY!)
4. Build Release

### Step 2: Create App in Play Console
1. Go to https://play.google.com/console
2. Click **Create app**
3. Fill in:
   - App name: FyahTrakz
   - Default language: English
   - App or game: App
   - Free or paid: Free
4. Accept policies and create

### Step 3: Set Up Store Listing
1. Go to **Store presence → Main store listing**
2. Upload:
   - App icon (512x512)
   - Feature graphic (1024x500)
   - Phone screenshots (min 2, recommended 4-8)
3. Fill in descriptions
4. Save

### Step 4: Complete App Content
1. Go to **Policy → App content**
2. Complete all declarations:
   - Privacy policy URL
   - Ads (No)
   - App access (All functionality available)
   - Content ratings questionnaire
   - Target audience (18+)
   - Data safety form

### Step 5: Upload App Bundle
1. Go to **Release → Production**
2. Click **Create new release**
3. Upload your .aab file
4. Add release notes: "Initial release of FyahTrakz - Stream fire music!"
5. Review and start rollout

### Step 6: Submit for Review
1. Review all sections show ✅
2. Click **Submit for review**
3. Wait 1-7 days for approval

---

## 🚨 Common Rejection Reasons to Avoid

1. **Missing Privacy Policy** - Make sure URL works
2. **Broken functionality** - Test all features
3. **Login issues** - Ensure users can register/login
4. **Payment issues** - Stripe integration must work
5. **Content policy** - No copyrighted music without rights

---

## ✅ Pre-Submission Checklist

- [ ] App icon uploaded (512x512)
- [ ] Feature graphic uploaded (1024x500)
- [ ] At least 2 phone screenshots uploaded
- [ ] Short description filled
- [ ] Full description filled
- [ ] Privacy policy URL working
- [ ] Content rating completed
- [ ] Data safety form completed
- [ ] AAB file uploaded
- [ ] Release notes added
- [ ] All sections show green checkmarks

---

## Need Help?

If you get stuck on any step, let me know and I can help troubleshoot!
