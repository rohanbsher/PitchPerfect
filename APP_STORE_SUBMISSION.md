# App Store Submission Guide - PitchPerfect

This guide walks you through submitting PitchPerfect to the iOS App Store.

## Prerequisites

### 1. Apple Developer Account
- **Required**: Paid Apple Developer Program membership ($99/year)
- **Sign up**: https://developer.apple.com/programs/
- **Team ID**: You'll need this for code signing

### 2. Expo Account
- **Create account**: https://expo.dev
- **Install EAS CLI**: `npm install -g eas-cli`
- **Login**: `eas login`

### 3. App Store Connect Setup
1. Go to https://appstoreconnect.apple.com
2. Click "My Apps" → "+" → "New App"
3. Fill in app information:
   - **Platform**: iOS
   - **Name**: PitchPerfect
   - **Primary Language**: English (U.S.)
   - **Bundle ID**: com.pitchperfect.app
   - **SKU**: pitchperfect-ios-001
   - **User Access**: Full Access

## Configuration Steps

### Step 1: Update EAS Configuration

Edit `eas.json` and update the submit section:

```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABC123XYZ"
      }
    }
  }
}
```

**Find your values:**
- **appleId**: Your Apple ID email
- **ascAppId**: App Store Connect App ID (found in App Information)
- **appleTeamId**: Apple Developer Team ID (Account → Membership)

### Step 2: Update app.json

Edit `app.json`:

```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "your-actual-eas-project-id"
      }
    },
    "owner": "your-expo-username"
  }
}
```

**Get your EAS Project ID:**
```bash
eas init
```

### Step 3: Build for Production

```bash
# First time setup
eas build:configure

# Build for iOS App Store
eas build --platform ios --profile production

# This will:
# - Create an iOS App Store build
# - Handle code signing automatically
# - Upload to EAS servers
# - Take ~15-30 minutes
```

**Monitor build progress:**
```bash
eas build:list
```

### Step 4: Submit to App Store

Once build completes:

```bash
# Submit to App Store Connect
eas submit --platform ios --profile production

# Or manually:
# 1. Download .ipa from EAS dashboard
# 2. Upload via Transporter app or Xcode
```

## App Store Connect Configuration

### 1. App Information

**Name & Category:**
- **App Name**: PitchPerfect
- **Subtitle**: Real-Time Vocal Coaching
- **Primary Category**: Music
- **Secondary Category**: Education

**App Description:**

```
Master your pitch with real-time vocal coaching and instant feedback.

PitchPerfect is an advanced pitch detection app designed for singers, musicians, and vocal students. Using professional-grade pitch detection algorithms, PitchPerfect provides instant feedback on your singing to help you improve pitch accuracy and develop perfect pitch.

KEY FEATURES:

🎵 Real-Time Pitch Detection
• Advanced YIN algorithm with <10ms latency
• Visual pitch feedback with color coding
• Accurate to within ±5 cents

🎯 Guided Vocal Exercises
• Pre-built scales, intervals, and arpeggios
• Progressive difficulty levels
• Auto-advancing hands-free mode

📊 Progress Tracking
• Track your improvement over time
• Achievement system and streaks
• Detailed session analytics

🎨 Beautiful Visualizations
• Visual pitch scale with animated feedback
• Musical staff notation
• Piano keyboard display
• Pitch history graphs

✨ Professional Features
• Haptic feedback on correct notes
• Background audio support
• Portrait and landscape orientations
• iPad support

PERFECT FOR:
• Vocal students and teachers
• Choir members
• Musicians developing ear training
• Anyone learning to sing

PRIVACY FIRST:
• All audio processing happens on your device
• No audio recording or cloud uploads
• No personal data collection
• Works completely offline

Download PitchPerfect today and start your journey to perfect pitch!
```

**Keywords:**
```
pitch,singing,vocal,music,training,coach,tuner,ear,practice,exercises,scales,intervals,musician,singer,pitch detection,voice,lessons
```

**Promotional Text:**
```
Transform your singing with real-time pitch feedback and guided vocal exercises. Perfect for beginners and professionals alike!
```

### 2. App Preview & Screenshots

**Required Sizes:**
- **iPhone 6.7"** (iPhone 15 Pro Max): 1290 x 2796 pixels
- **iPhone 6.5"** (iPhone 11 Pro Max): 1242 x 2688 pixels
- **iPhone 5.5"** (iPhone 8 Plus): 1242 x 2208 pixels
- **iPad Pro 12.9"**: 2048 x 2732 pixels

**Screenshot Ideas:**
1. Home screen with exercise cards
2. Exercise in progress with pitch visualization
3. Results screen with analytics
4. Pitch history graph
5. Progress dashboard

**App Preview Video (Optional but Recommended):**
- 15-30 seconds
- Show real-time pitch detection
- Demonstrate key features
- No audio required (captions recommended)

### 3. Pricing & Availability

- **Price**: Free (or your choice)
- **Availability**: All countries
- **Pre-orders**: Optional

### 4. App Privacy

In App Store Connect → App Privacy:

**Data Collection:** No

Answer "No" to all data collection questions:
- ❌ Contact Info
- ❌ Health & Fitness
- ❌ Financial Info
- ❌ Location
- ❌ Sensitive Info
- ❌ Contacts
- ❌ User Content
- ❌ Browsing History
- ❌ Search History
- ❌ Identifiers
- ❌ Purchases
- ❌ Usage Data
- ❌ Diagnostics
- ❌ Other Data

**Privacy Policy URL:**
```
https://yourdomain.com/privacy-policy
```
*(Host PRIVACY_POLICY.md on your website)*

### 5. Age Rating

Complete the questionnaire:
- **Made for Kids**: No
- **Unrestricted Web Access**: No
- **Gambling**: No
- **Contests**: No
- **User Generated Content**: No

Expected Rating: **4+**

### 6. App Review Information

**Contact Information:**
- **First Name**: [Your First Name]
- **Last Name**: [Your Last Name]
- **Phone Number**: [Your Phone]
- **Email**: [Your Email]

**Demo Account:**
Not required (app works without login)

**Notes:**
```
PitchPerfect is a vocal training app that uses the device microphone for real-time pitch detection.

TESTING INSTRUCTIONS:
1. Grant microphone permission when prompted
2. Tap "Start" on the home screen exercise
3. Sing or hum any note - you'll see real-time pitch feedback
4. Follow the visual guides to match the target pitches

The app processes all audio locally and does not record or transmit any data.

MICROPHONE PERMISSION:
Required for core functionality (pitch detection). Audio is processed in real-time and not stored.

No login required - full functionality available immediately.
```

**Version Notes (v1.0.0):**
```
Initial release of PitchPerfect

Features:
- Real-time pitch detection with YIN algorithm
- Guided vocal exercises (scales, intervals, breathing)
- Visual feedback with multiple visualization modes
- Progress tracking and achievements
- Hands-free auto-progression
- Professional Apple-inspired UI
- iPad support
```

## Pre-Submission Checklist

### App Functionality
- [ ] App builds successfully without errors
- [ ] All features work as expected
- [ ] Microphone permission flow works correctly
- [ ] Audio processing works on real device
- [ ] No crashes or freezes
- [ ] Tested on multiple iOS versions (15.1+)
- [ ] Tested on iPhone and iPad

### Content & Metadata
- [ ] Bundle ID matches App Store Connect (com.pitchperfect.app)
- [ ] Version number is correct (1.0.0)
- [ ] Build number is correct (1)
- [ ] App name is correct
- [ ] Description is compelling and accurate
- [ ] Keywords are relevant
- [ ] Screenshots are high quality
- [ ] App icon is 1024x1024 PNG

### Privacy & Compliance
- [ ] Privacy Policy is hosted online
- [ ] Privacy questions answered in App Store Connect
- [ ] Age rating completed
- [ ] Microphone usage description is clear
- [ ] No data collection (privacy-first)

### Code Signing
- [ ] Distribution certificate created
- [ ] App Store provisioning profile created
- [ ] EAS handles signing automatically

### Testing
- [ ] Tested on physical device (not just simulator)
- [ ] Audio works correctly
- [ ] Permissions granted properly
- [ ] UI looks good on all screen sizes
- [ ] No console errors or warnings

## Build & Submit Commands

```bash
# 1. Configure EAS (first time only)
eas build:configure

# 2. Build for App Store
eas build --platform ios --profile production

# 3. Wait for build to complete (~20 minutes)
# Monitor: https://expo.dev

# 4. Submit to App Store
eas submit --platform ios --profile production

# Alternative: Manual submission
# Download IPA from EAS dashboard
# Upload via Transporter app or Xcode → Window → Organizer
```

## After Submission

### Review Timeline
- **Initial Review**: 24-48 hours typically
- **Status Updates**: Check App Store Connect
- **Notifications**: Via email

### Common Rejection Reasons

1. **Microphone Permission Description**
   - ✅ Solution: Already handled in Info.plist
   - Clear description of why microphone is needed

2. **Missing Privacy Policy**
   - ✅ Solution: Host PRIVACY_POLICY.md online
   - Add URL to App Store Connect

3. **Crashes on Launch**
   - ✅ Prevention: Test on real device before submission
   - Run through full test flow

4. **Incomplete Metadata**
   - ✅ Solution: Follow checklist above
   - Ensure all required fields filled

### If Rejected

1. Read rejection reason carefully
2. Fix the issue
3. Increment build number
4. Rebuild: `eas build --platform ios --profile production`
5. Resubmit: `eas submit --platform ios --profile production`

## Post-Approval

### Launch Checklist
- [ ] App appears in App Store
- [ ] Test download from App Store
- [ ] Verify app works when installed from store
- [ ] Share App Store link
- [ ] Monitor reviews and ratings
- [ ] Plan first update

### App Store URL
```
https://apps.apple.com/app/pitchperfect/id[YOUR-APP-ID]
```

### Marketing Assets
- Press kit
- Social media posts
- Website landing page
- Demo video

## Updating the App

For future versions:

```bash
# 1. Update version in app.json
# "version": "1.1.0"

# 2. Build new version
eas build --platform ios --profile production

# 3. Submit update
eas submit --platform ios --profile production

# 4. Add "What's New" in App Store Connect
```

## Helpful Resources

- **EAS Build Docs**: https://docs.expo.dev/build/introduction/
- **EAS Submit Docs**: https://docs.expo.dev/submit/introduction/
- **App Store Guidelines**: https://developer.apple.com/app-store/review/guidelines/
- **App Store Connect**: https://appstoreconnect.apple.com
- **Expo Dashboard**: https://expo.dev

## Support

For issues:
1. Check EAS build logs: `eas build:list`
2. Review Apple rejection reasons in App Store Connect
3. Expo documentation: https://docs.expo.dev
4. Apple Developer Forums: https://developer.apple.com/forums

---

**Ready to submit?** Follow the steps above and your app will be live within a few days! 🚀
