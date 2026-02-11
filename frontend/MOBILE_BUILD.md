# FyahTrakz Mobile App

This guide explains how to build the FyahTrakz mobile app for iOS and Android using Capacitor.

## Prerequisites

### For Android Development
- **Android Studio** (latest version)
- **Java JDK 17+**
- Android SDK with API level 33+

### For iOS Development
- **macOS** (required for iOS builds)
- **Xcode 15+** 
- **CocoaPods** (`sudo gem install cocoapods`)
- Apple Developer Account ($99/year for App Store distribution)

## Project Setup

The Capacitor configuration is already set up. The mobile projects are in:
- `frontend/ios/` - iOS Xcode project
- `frontend/android/` - Android Studio project

## Building the Apps

### Step 1: Build Web Assets
```bash
cd frontend
yarn build
npx cap sync
```

### Step 2: Open in IDE

**For Android:**
```bash
yarn cap:open:android
# Or manually: npx cap open android
```
This opens Android Studio. From there:
1. Wait for Gradle sync to complete
2. Connect an Android device or start an emulator
3. Click "Run" (green play button)

**For iOS:**
```bash
yarn cap:open:ios
# Or manually: npx cap open ios
```
This opens Xcode. From there:
1. Select your development team in Signing & Capabilities
2. Select a simulator or connected device
3. Click "Run" (play button)

## Building for Release

### Android APK/AAB

1. Open Android Studio
2. Go to **Build > Generate Signed Bundle/APK**
3. Create a keystore (first time) or use existing
4. Select **APK** or **Android App Bundle**
5. Build will be in `android/app/build/outputs/`

Or via command line:
```bash
cd frontend/android
./gradlew assembleRelease  # For APK
./gradlew bundleRelease    # For AAB (Play Store)
```

### iOS IPA

1. Open Xcode
2. Select **Product > Archive**
3. In Organizer, click **Distribute App**
4. Follow prompts for App Store or Ad Hoc distribution

## App Configuration

### App ID & Name
Edit `frontend/capacitor.config.ts`:
```typescript
const config: CapacitorConfig = {
  appId: 'com.fyahtrakz.app',  // Your unique app ID
  appName: 'FyahTrakz',
  // ...
};
```

### App Icons
Replace icon files in:
- **Android:** `frontend/android/app/src/main/res/mipmap-*`
- **iOS:** `frontend/ios/App/App/Assets.xcassets/AppIcon.appiconset/`

Recommended: Use a tool like [capacitor-assets](https://github.com/ionic-team/capacitor-assets) to generate all icon sizes from a single source image.

### Splash Screen
Configure in `capacitor.config.ts` under `plugins.SplashScreen`.

## Features Configured

✅ **Background Audio Playback** - Music continues when app is minimized
✅ **Lock Screen Controls** - Native media controls on lock screen
✅ **Push Notifications** - Ready for FCM (Android) and APNS (iOS)
✅ **Dark Theme** - Native status bar and splash screen match app theme

## Publishing to App Stores

### Google Play Store
1. Create a Google Play Developer account ($25 one-time)
2. Create an app listing in Play Console
3. Upload your signed AAB file
4. Complete store listing (screenshots, description, etc.)
5. Submit for review

### Apple App Store
1. Enroll in Apple Developer Program ($99/year)
2. Create an App ID in Apple Developer Portal
3. Create an app record in App Store Connect
4. Archive and upload from Xcode
5. Complete app information and submit for review

## Troubleshooting

### Android Build Issues
- Ensure JAVA_HOME points to JDK 17+
- Run `cd android && ./gradlew clean` to clear build cache
- Update Gradle wrapper if needed

### iOS Build Issues
- Run `cd ios/App && pod install` to update dependencies
- Ensure correct provisioning profile is selected
- Check Xcode signing settings

### Web Assets Not Updating
```bash
yarn build && npx cap sync
```

## Development Workflow

1. Make changes to React code in `frontend/src/`
2. Test in browser with `yarn start`
3. Build and sync: `yarn build:mobile`
4. Test on device/simulator via Android Studio or Xcode

## Support

For Capacitor-specific issues: https://capacitorjs.com/docs
For FyahTrakz issues: Contact the development team
