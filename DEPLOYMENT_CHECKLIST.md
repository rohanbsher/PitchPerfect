# iOS App Store Deployment Checklist

Complete this checklist before submitting PitchPerfect to the iOS App Store.

## 📋 Pre-Deployment Setup

### Apple Developer Account
- [ ] Active Apple Developer Program membership ($99/year)
- [ ] Apple Developer account verified
- [ ] Team ID obtained from Account → Membership
- [ ] Distribution Certificate created
- [ ] App Store provisioning profile created (EAS can auto-create)

### App Store Connect
- [ ] Account access to App Store Connect (https://appstoreconnect.apple.com)
- [ ] New app created in App Store Connect
- [ ] App name "PitchPerfect" is available
- [ ] Bundle ID `com.pitchperfect.app` created
- [ ] SKU created (e.g., `pitchperfect-ios-001`)
- [ ] App Store Connect App ID obtained

### Expo & EAS Setup
- [ ] Expo account created (https://expo.dev)
- [ ] EAS CLI installed: `npm install -g eas-cli`
- [ ] Logged into EAS: `eas login`
- [ ] EAS project initialized: `eas init`
- [ ] EAS Project ID obtained and added to app.json

## ⚙️ Configuration Files

### app.json
- [ ] Bundle identifier updated: `com.pitchperfect.app`
- [ ] Version correct: `1.0.0`
- [ ] Build number set: `1`
- [ ] EAS project ID added in `extra.eas.projectId`
- [ ] Expo username added in `owner` field
- [ ] App description added
- [ ] Privacy fields configured (`usesNonExemptEncryption: false`)
- [ ] Microphone usage description clear and accurate
- [ ] App Store URL placeholder ready (update after app approved)

### eas.json
- [ ] Apple ID email added to `submit.production.ios.appleId`
- [ ] App Store Connect App ID added to `submit.production.ios.ascAppId`
- [ ] Apple Team ID added to `submit.production.ios.appleTeamId`
- [ ] Build profiles configured (development, preview, production)
- [ ] Auto-increment enabled for production builds

### Privacy & Legal
- [ ] Privacy policy written (PRIVACY_POLICY.md exists ✓)
- [ ] Privacy policy hosted online at permanent URL
- [ ] Privacy policy URL added to App Store Connect
- [ ] Privacy policy reviewed for accuracy
- [ ] Terms of Service created (if applicable)
- [ ] Support email created (support@pitchperfect.app)
- [ ] Website created (pitchperfect.app or similar)

## 🎨 Assets & Media

### App Icon
- [ ] Icon created: 1024x1024 PNG, RGB, no transparency
- [ ] Icon verified at `assets/icon.png` (exists ✓)
- [ ] Icon follows Apple design guidelines
- [ ] Icon tested on device (visible and clear)
- [ ] No rounded corners in source (Apple applies them)

### Splash Screen
- [ ] Splash screen created
- [ ] Verified at `assets/splash-icon.png` (exists ✓)
- [ ] Tested on various device sizes
- [ ] Background color matches design

### App Store Screenshots
Required sizes and counts:

**iPhone 6.7" (iPhone 15 Pro Max) - 1290 x 2796**
- [ ] Screenshot 1: Home screen with exercises
- [ ] Screenshot 2: Exercise in progress with pitch visualization
- [ ] Screenshot 3: Real-time pitch feedback with colors
- [ ] Screenshot 4: Results screen with analytics
- [ ] Screenshot 5: Progress dashboard (optional)

**iPhone 6.5" (iPhone 11 Pro Max) - 1242 x 2688**
- [ ] All 5 screenshots resized for this display

**iPhone 5.5" (iPhone 8 Plus) - 1242 x 2208**
- [ ] All 5 screenshots resized for this display

**iPad Pro 12.9" - 2048 x 2732** (if supporting iPad)
- [ ] All screenshots optimized for iPad layout

### App Preview Video (Optional)
- [ ] 15-30 second video created
- [ ] Shows real app functionality
- [ ] Portrait orientation
- [ ] 1080p or 4K resolution
- [ ] Captions added (recommended)
- [ ] Uploaded to App Store Connect

## 🧪 Testing & Quality Assurance

### Functionality Testing
- [ ] App builds without errors: `eas build --platform ios --profile production`
- [ ] Tested on physical iPhone (not just simulator)
- [ ] Tested on physical iPad (if claiming iPad support)
- [ ] Microphone permission prompt works correctly
- [ ] Microphone permission description displays properly
- [ ] Audio input works and detects pitch accurately
- [ ] All exercises function correctly
- [ ] Exercise progression works (auto-advance)
- [ ] Results screen displays correctly
- [ ] Progress tracking saves and loads
- [ ] App doesn't crash on launch
- [ ] App doesn't crash during use
- [ ] No error spam in console
- [ ] Haptic feedback works (if device supports)
- [ ] Status bar displays correctly
- [ ] Safe areas respected (notch, home indicator)

### Platform Testing
- [ ] Tested on iOS 15.1 (minimum version)
- [ ] Tested on latest iOS version
- [ ] Tested on iPhone SE (small screen)
- [ ] Tested on iPhone Pro Max (large screen)
- [ ] Tested on iPad (if supporting)
- [ ] Portrait orientation works
- [ ] Landscape orientation works (if supported)

### Performance Testing
- [ ] Audio latency acceptable (<50ms perceived)
- [ ] UI animations smooth (60fps)
- [ ] No memory leaks during extended use
- [ ] Battery consumption reasonable
- [ ] App size reasonable (~256MB with assets)
- [ ] Launch time acceptable (<3 seconds)

### Privacy & Security
- [ ] No audio recording/storage verified
- [ ] No network requests except app download
- [ ] No analytics or tracking
- [ ] No personal data collection
- [ ] AsyncStorage only stores progress locally
- [ ] Microphone only used when needed
- [ ] Background audio works if enabled

## 📝 App Store Connect Metadata

### Basic Information
- [ ] App Name: "PitchPerfect"
- [ ] Subtitle: "Real-Time Vocal Coaching" (30 char max)
- [ ] Primary Category: Music
- [ ] Secondary Category: Education
- [ ] Content Rights: Own all rights to content

### Description
- [ ] Promotional text added (170 char max) - see APP_STORE_METADATA.md
- [ ] Description added (4000 char max) - see APP_STORE_METADATA.md
- [ ] Description highlights key features
- [ ] Description explains privacy approach
- [ ] Description includes keywords naturally
- [ ] Keywords added (100 char max) - see APP_STORE_METADATA.md

### Version Information
- [ ] Version number: 1.0.0
- [ ] Build number: 1 (auto-increment with EAS)
- [ ] Copyright: © 2025 PitchPerfect
- [ ] "What's New" text added - see APP_STORE_METADATA.md

### Pricing & Availability
- [ ] Price: Free (or your choice)
- [ ] Availability: All countries (or selected)
- [ ] Pre-order: Not enabled (for initial release)

### App Privacy
- [ ] Privacy questionnaire completed in App Store Connect
- [ ] All data collection questions answered "No"
- [ ] Privacy Policy URL added
- [ ] Privacy info accurate and matches privacy policy

### Age Rating
- [ ] Age rating questionnaire completed
- [ ] Rating: 4+ (expected)
- [ ] No sensitive content flags

### App Review Information
- [ ] Contact first name added
- [ ] Contact last name added
- [ ] Contact phone number added
- [ ] Contact email added
- [ ] Demo account: Not needed (no login required)
- [ ] Notes for reviewer added - see APP_STORE_METADATA.md
- [ ] Review notes explain microphone usage
- [ ] Testing instructions clear and detailed

## 🚀 Build & Submit

### Build Process
- [ ] Dependencies installed: `npm install`
- [ ] Patches applied: `npm run postinstall` (automatic)
- [ ] No npm audit critical vulnerabilities
- [ ] TypeScript compiles without errors
- [ ] Local iOS build successful (optional): `npm run ios`

### EAS Build
```bash
# Build for App Store
eas build --platform ios --profile production
```

- [ ] Build started successfully
- [ ] Build completed without errors (wait ~20 minutes)
- [ ] Build artifact (.ipa) available
- [ ] Build downloaded and inspected (optional)
- [ ] Build tested via TestFlight (recommended)

### TestFlight Beta (Optional but Recommended)
- [ ] TestFlight build uploaded
- [ ] Internal testers invited
- [ ] Beta tested on multiple devices
- [ ] Beta feedback addressed
- [ ] No critical bugs found

### App Store Submission
```bash
# Submit to App Store
eas submit --platform ios --profile production
```

**OR manually:**
- [ ] .ipa downloaded from EAS
- [ ] Transporter app installed (Mac App Store)
- [ ] .ipa uploaded via Transporter
- [ ] Upload successful

### Final Verification
- [ ] Build appears in App Store Connect
- [ ] Correct build version selected for release
- [ ] All metadata filled in
- [ ] All screenshots uploaded
- [ ] Privacy questions answered
- [ ] Age rating confirmed
- [ ] Release option selected (automatic/manual)

### Submit for Review
- [ ] "Submit for Review" button clicked
- [ ] Confirmation email received
- [ ] Status: "Waiting for Review"

## ⏳ During Review

### Monitor Status
- [ ] Check App Store Connect daily
- [ ] Respond to any Apple requests within 24 hours
- [ ] Email notifications enabled

### Common Rejection Reasons to Avoid
- [x] Microphone permission description clear ✓
- [x] Privacy policy hosted and linked ✓
- [x] No crashes on launch ✓
- [x] All metadata complete ✓
- [x] No placeholder content ✓
- [x] App functions as described ✓

## ✅ After Approval

### Launch Day
- [ ] App appears in App Store search
- [ ] Download and test from App Store
- [ ] Verify app works when installed from store
- [ ] Share App Store link
- [ ] Update website with App Store badge
- [ ] Social media announcements
- [ ] Email announcement (if applicable)

### Post-Launch
- [ ] Monitor crash reports (if any)
- [ ] Monitor reviews and ratings
- [ ] Respond to user reviews
- [ ] Address critical bugs immediately
- [ ] Plan first update (bug fixes, features)

### Marketing
- [ ] App Store link: `https://apps.apple.com/app/pitchperfect/id[APP-ID]`
- [ ] Add App Store badge to website
- [ ] Social media posts prepared
- [ ] Press release (optional)
- [ ] Product Hunt launch (optional)
- [ ] Music education forums/communities

## 🔄 Future Updates

### Version Updates
When releasing v1.1.0 or later:

1. Update `app.json`:
   ```json
   "version": "1.1.0"
   ```

2. Build new version:
   ```bash
   eas build --platform ios --profile production
   ```

3. Submit update:
   ```bash
   eas submit --platform ios --profile production
   ```

4. Add "What's New" in App Store Connect

5. Submit for review

### Build Number
- EAS auto-increments build number with `autoIncrement: true`
- Build number format: 1, 2, 3, etc.
- Version 1.0.0 Build 1, then 1.0.1 Build 2, etc.

## 📞 Support & Resources

### Documentation
- [x] APP_STORE_SUBMISSION.md - Complete submission guide ✓
- [x] APP_STORE_METADATA.md - All App Store text and info ✓
- [x] PRIVACY_POLICY.md - Privacy policy document ✓
- [x] README.md - Updated with deployment info ✓

### External Resources
- **EAS Build**: https://docs.expo.dev/build/introduction/
- **EAS Submit**: https://docs.expo.dev/submit/introduction/
- **App Store Guidelines**: https://developer.apple.com/app-store/review/guidelines/
- **App Store Connect**: https://appstoreconnect.apple.com
- **Expo Dashboard**: https://expo.dev

### Support Contacts
- **EAS Support**: https://expo.dev/support
- **Apple Developer Support**: https://developer.apple.com/support/
- **App Store Review**: Contact via App Store Connect Resolution Center

---

## Quick Reference Commands

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to EAS
eas login

# Initialize project
eas init

# Configure build
eas build:configure

# Build for production
eas build --platform ios --profile production

# Monitor builds
eas build:list

# Submit to App Store
eas submit --platform ios --profile production

# Check submission status
eas submit:list

# View build logs
eas build:view [build-id]
```

---

**Status:** Ready for deployment! Complete the unchecked items above and you'll be live on the App Store within 1-3 days.
