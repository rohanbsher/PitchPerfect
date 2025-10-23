# 🚀 PitchPerfect - App Store Deployment Guide

**Last Updated:** October 22, 2025
**Version:** 1.0.0
**Status:** Ready for App Store Submission

---

## ✅ Pre-Deployment Checklist

### Configuration Complete
- [x] Bundle ID updated: `com.rohanbhandari.pitchperfect`
- [x] EAS CLI installed
- [x] eas.json created
- [x] app.json configured
- [x] iOS build tested locally
- [x] GitHub repository created

### Still Required
- [ ] Apple Developer Account ($99/year)
- [ ] App Store Connect listing created
- [ ] Screenshots captured (5 required)
- [ ] App Store description written
- [ ] Privacy policy URL (if applicable)
- [ ] Support URL
- [ ] Production build created with EAS

---

## 📋 Step-by-Step Deployment Process

### STEP 1: Apple Developer Account Setup (One-Time, 24-48hr wait)

1. Go to https://developer.apple.com/programs/enroll/
2. Click "Start Your Enrollment"
3. Sign in with Apple ID: `rohanbsher@gmail.com`
4. Choose: Individual (not Company)
5. Accept agreements
6. Pay $99/year
7. Wait for verification email (24-48 hours)

**Cost:** $99/year
**Time:** 5 min setup + 24-48hr verification

---

### STEP 2: EAS Login & Configuration (5 min)

```bash
# Login to EAS (Expo Application Services)
eas login
# Use your Expo account or create one

# Check authentication
eas whoami

# Configure build (interactive)
eas build:configure
# This will:
# - Detect existing eas.json
# - Set up iOS credentials
# - Link to your Expo project
```

**Expected Output:**
```
✔ Build credentials set up
✔ Project linked to Expo account
✔ Ready to build!
```

---

### STEP 3: App Store Connect Setup (30 min)

**Prerequisites:** Apple Developer account approved

1. **Go to App Store Connect**
   - Visit: https://appstoreconnect.apple.com
   - Sign in with Apple ID

2. **Create New App**
   - Click "My Apps" → "+" icon → "New App"
   - **Platform:** iOS
   - **Name:** PitchPerfect
   - **Primary Language:** English (U.S.)
   - **Bundle ID:** Select `com.rohanbhandari.pitchperfect`
   - **SKU:** `pitchperfect-001` (internal identifier)
   - **User Access:** Full Access

3. **Configure App Information**
   - **Category:**
     - Primary: Music
     - Secondary: Education
   - **Content Rights:** Yes, it contains third-party content (University of Iowa piano samples)
   - **Age Rating:** 4+ (No objectionable content)

4. **Pricing and Availability**
   - **Price:** Free
   - **Availability:** All countries
   - **Pre-orders:** No

---

### STEP 4: App Store Metadata (45 min)

#### **App Name & Subtitle**
```
Name: PitchPerfect - Vocal Training
Subtitle: Real-Time Pitch Detection
```

#### **Description** (4000 character limit)
```
Transform your voice with PitchPerfect, the professional vocal training app designed for singers of all levels.

🎯 KEY FEATURES

• Real-Time Pitch Detection - Advanced YIN algorithm provides instant feedback on your singing
• 8-Week Structured Curriculum - Progress from foundation to mastery with expert guidance
• 11 Professional Exercises - Master scales, intervals, and breathing techniques
• Smart Progress Tracking - Monitor your improvement with detailed analytics
• Beautiful Visualizations - See your pitch in real-time with musical staff notation

🎼 VOCAL EXERCISES

Master essential singing techniques:
- C Major Scale practice
- 5-Note warm-ups
- Interval training (thirds, octaves)
- Full scale progressions

🫁 BREATHING TECHNIQUES

Learn professional breathing methods:
- Diaphragmatic breathing foundation
- Box breathing for control
- Farinelli technique for advanced training

📊 PERSONALIZED JOURNEY

Follow our proven 8-week curriculum designed by vocal coaches:
- Week 1-2: Foundation and consistency
- Week 3-4: Range building and precision
- Week 5-6: Stamina and refinement
- Week 7-8: Challenge and mastery

Perfect for:
✓ Beginner singers starting their journey
✓ Intermediate vocalists improving technique
✓ Advanced singers maintaining precision
✓ Music students preparing for auditions
✓ Choir members perfecting their pitch

Download PitchPerfect today and discover your true vocal potential!
```

#### **Keywords** (100 characters max, comma-separated)
```
vocal training,pitch detection,singing lessons,voice coach,music education,pitch perfect,vocal
```

#### **Promotional Text** (170 characters, can be updated anytime)
```
🎵 Master your voice with real-time pitch detection and professional vocal training. 8-week structured curriculum for all skill levels!
```

#### **Support URL**
```
https://github.com/rohanbsher/PitchPerfect/issues
```

#### **Marketing URL** (Optional)
```
https://github.com/rohanbsher/PitchPerfect
```

#### **Privacy Policy URL**
```
https://github.com/rohanbsher/PitchPerfect/blob/main/PRIVACY_POLICY.md
```
*(You'll need to create this - see PRIVACY_POLICY_TEMPLATE.md below)*

---

### STEP 5: Screenshots & Assets (1-2 hours)

#### **Required Screenshot Sizes**

**6.7" Display (iPhone 14/15/16 Pro Max)** - PRIMARY
- Resolution: 1290 x 2796 pixels
- Format: PNG or JPEG
- Minimum: 3 screenshots
- Maximum: 10 screenshots

**6.5" Display (iPhone XS Max, 11 Pro Max)**
- Resolution: 1284 x 2778 pixels

**5.5" Display (iPhone 8 Plus)** - REQUIRED for backward compatibility
- Resolution: 1242 x 2208 pixels

#### **Screenshot Requirements**

**Screenshot 1: Home Screen**
- Show: "Week 1: Foundation" with JourneyProgress card
- Capture: Home screen with "Start Today's Lesson" button
- Highlight: 8-week curriculum progress

**Screenshot 2: Exercise Preview**
- Show: Preview screen with What/Why/How sections
- Capture: "Diaphragmatic Breathing" or "C Major Scale"
- Highlight: Professional exercise instructions

**Screenshot 3: Breathing Visualizer**
- Show: Circle animation during breathing exercise
- Capture: Mid-inhale with expanding circle
- Highlight: Beautiful real-time visualization

**Screenshot 4: Pitch Scale Visualizer**
- Show: Musical staff with notes during vocal exercise
- Capture: Active note being sung (green indicator)
- Highlight: Real-time pitch detection accuracy

**Screenshot 5: Results Screen**
- Show: Exercise completion with accuracy score
- Capture: "Great job! 87% accuracy" message
- Highlight: Progress tracking and encouragement

#### **How to Capture Screenshots**

```bash
# Run app on iPhone 16 Pro Max simulator
npx expo run:ios

# Or use Xcode
open ios/PitchPerfect.xcworkspace

# Select iPhone 16 Pro Max simulator
# Run the app
# Navigate to each screen
# Press Cmd+S to capture screenshot
# Screenshots save to ~/Desktop
```

#### **App Icon (1024x1024)**
- Current: `assets/icon.png` (22KB)
- Verify resolution: Should be exactly 1024x1024 px
- Format: PNG, no transparency, no rounded corners
- Upload location: App Store Connect → App Information → App Icon

---

### STEP 6: Privacy Information (Required)

**App Store Connect → App Privacy**

**Data Collection:**
- **Usage Data:** Yes
  - What: Exercise completion, progress tracking
  - Purpose: App functionality
  - Linked to user: No
  - Used for tracking: No

**Data Not Collected:**
- Personal Information: No
- Contact Info: No
- Location: No
- Audio Recordings: No (processed locally, not stored)

**Third-Party SDKs:**
- Expo (Analytics): Optional, can be disabled
- No advertising SDKs
- No third-party analytics

---

### STEP 7: Build Production IPA (20-30 min)

#### **Option A: EAS Build (Recommended)**

```bash
# Build for iOS App Store
eas build --platform ios --profile production

# This will:
# 1. Upload your code to EAS servers
# 2. Install dependencies
# 3. Generate certificates (first time)
# 4. Build the app
# 5. Sign with your Apple Developer account
# 6. Provide download link for .ipa

# Expected output:
✔ Build complete!
📱 Build artifact: https://expo.dev/accounts/USERNAME/builds/BUILD_ID
```

**Build time:** 15-20 minutes
**Cost:** Free (500 builds/month)

#### **Option B: Local Build (If EAS fails)**

```bash
# Clean build
rm -rf node_modules ios/Pods ios/build
npm install
cd ios && pod install && cd ..

# Build with Xcode
xcodebuild -workspace ios/PitchPerfect.xcworkspace \
  -scheme PitchPerfect \
  -configuration Release \
  -archivePath build/PitchPerfect.xcarchive \
  archive

# Export IPA
xcodebuild -exportArchive \
  -archivePath build/PitchPerfect.xcarchive \
  -exportPath build \
  -exportOptionsPlist exportOptions.plist
```

---

### STEP 8: Upload to App Store Connect (10 min)

#### **Option A: EAS Submit (Easiest)**

```bash
# Submit directly to App Store Connect
eas submit --platform ios --profile production

# This will:
# 1. Upload the .ipa to App Store Connect
# 2. Link to your app (using ascAppId)
# 3. Process the build
```

#### **Option B: Manual Upload**

1. Download .ipa from EAS build
2. Open Xcode → Window → Organizer
3. Click "Distribute App"
4. Select "App Store Connect"
5. Select "Upload"
6. Choose your team
7. Wait for processing (5-15 minutes)

#### **Option C: Transporter App**

1. Download .ipa
2. Open Transporter app (Mac App Store)
3. Drag .ipa file
4. Click "Deliver"
5. Wait for upload

---

### STEP 9: Submit for Review (15 min)

1. **Go to App Store Connect**
   - Select your app
   - Go to version 1.0.0

2. **Select Build**
   - Click "+" next to Build
   - Select the uploaded build
   - Wait for processing (shows green checkmark when ready)

3. **Complete App Store Information**
   - Verify all screenshots uploaded
   - Verify description complete
   - Add version release notes:
   ```
   Initial release of PitchPerfect!

   Features:
   • Real-time pitch detection with YIN algorithm
   • 8-week structured vocal training curriculum
   • 11 professional exercises (3 breathing + 8 vocal)
   • Smart progress tracking
   • Beautiful pitch visualizations

   Perfect for singers of all levels - from beginners to advanced vocalists!
   ```

4. **Export Compliance**
   - Does your app use encryption? **No**
   - (Our app doesn't transmit data or use HTTPS for sensitive info)

5. **Advertising Identifier**
   - Does your app use the Advertising Identifier (IDFA)? **No**

6. **Content Rights**
   - Does your app contain third-party content? **Yes**
   - Specify: University of Iowa Musical Instrument Samples (AIFF format)

7. **Submit for Review**
   - Click "Add for Review"
   - Click "Submit to App Review"
   - Choose: Automatically release after approval

---

### STEP 10: Monitor Review Status (7-14 days)

**Review States:**
1. **Waiting for Review** - In queue (2-7 days)
2. **In Review** - Apple is testing (24-48 hours)
3. **Pending Developer Release** - Approved, waiting for your release
4. **Ready for Sale** - Live on App Store! 🎉

**Or:**
- **Rejected** - Need to address feedback and resubmit

**Check status:**
- App Store Connect dashboard
- Email notifications
- EAS dashboard: `eas build:list`

---

## 🎉 Post-Launch Checklist

### After App Goes Live

- [ ] Share App Store link on social media
- [ ] Update GitHub README with App Store badge
- [ ] Monitor initial user reviews
- [ ] Track downloads in App Store Connect
- [ ] Respond to user feedback
- [ ] Plan v1.1 updates based on reviews

### App Store Link Format
```
https://apps.apple.com/app/idAPP_ID
```

### Adding App Store Badge to README

```markdown
[![Download on App Store](https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/en-us?size=250x83)](https://apps.apple.com/app/idAPP_ID)
```

---

## 🚨 Common Issues & Solutions

### Issue 1: "Bundle ID already in use"
**Solution:** Bundle IDs must be globally unique. Try:
- `com.rohanbhandari.pitchperfect2`
- `com.rohanbhandari.vocal-trainer`
- `io.rohanbhandari.pitchperfect`

### Issue 2: "Certificate generation failed"
**Solution:**
```bash
eas credentials
# Select: Remove credentials
# Then rebuild: eas build --platform ios --profile production
```

### Issue 3: "Build failed - missing Info.plist keys"
**Solution:** Verify `app.json` has all required iOS keys:
- `bundleIdentifier`
- `NSMicrophoneUsageDescription`
- `UIBackgroundModes`

### Issue 4: "App rejected - Guideline 2.1 Performance: App Completeness"
**Solution:** Ensure all features work:
- Test on physical device
- Verify microphone permission works
- Test all 11 exercises
- Ensure no crashes

### Issue 5: "Missing screenshots"
**Solution:** Must have screenshots for ALL required sizes:
- 6.7" (1290 x 2796)
- 6.5" (1284 x 2778)
- 5.5" (1242 x 2208)

---

## 📞 Support & Resources

### Official Documentation
- **Expo EAS:** https://docs.expo.dev/build/introduction/
- **App Store Connect:** https://developer.apple.com/app-store-connect/
- **Review Guidelines:** https://developer.apple.com/app-store/review/guidelines/

### Helpful Commands

```bash
# Check EAS build status
eas build:list

# View build logs
eas build:view BUILD_ID

# Check credentials
eas credentials

# Update app.json dynamically
eas update

# View submission status
eas submit:list
```

### Timeline Summary

| Step | Time | Notes |
|------|------|-------|
| Apple Developer signup | 24-48 hrs | One-time verification |
| App Store Connect setup | 30 min | Creating listing |
| Screenshots | 1-2 hrs | Capture + edit |
| EAS build | 20 min | Automated |
| Upload to App Store | 10 min | Via EAS or Xcode |
| App Store review | 7-14 days | Apple's timeline |
| **Total** | **~3 weeks** | Mostly waiting |

---

## ✅ Ready to Deploy!

You now have everything you need to publish PitchPerfect to the App Store.

**Current Status:**
- ✅ EAS CLI installed
- ✅ Bundle ID configured
- ✅ eas.json created
- ✅ app.json updated
- ✅ iOS build tested

**Next Steps:**
1. Get Apple Developer account ($99)
2. Create App Store Connect listing
3. Capture screenshots
4. Run: `eas build --platform ios --profile production`
5. Submit for review
6. Wait 7-14 days
7. Go live! 🚀

**Questions? Need help with any step? Let me know!**

---

**Last Updated:** October 22, 2025
**Version:** 1.0.0 Production Ready
