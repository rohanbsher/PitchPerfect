# Expo SDK 54 - expo-dev-launcher Fix

## Issue Description

When building for iOS with Expo SDK 54 and expo-dev-client, you may encounter a Swift compilation error:

```
value of type 'ExpoReactDelegate' has no member 'reactNativeFactory'
```

This error occurs in:
- Line 58: `reactDelegate?.reactNativeFactory`
- Line 85: `reactDelegate?.reactNativeFactory`

In the file: `node_modules/expo-dev-launcher/ios/ReactDelegateHandler/ExpoDevLauncherReactDelegateHandler.swift`

## Root Cause

In Expo SDK 54, the `ExpoReactDelegate` class (located in `expo-modules-core`) was refactored and no longer has a `reactNativeFactory` property. However, the `expo-dev-launcher` package version 6.0.13 still contains code that attempts to access this non-existent property.

This is an API breaking change between:
- **expo-dev-launcher**: 6.0.13
- **expo-modules-core**: 3.0.18

## Solution

A patch has been applied to `expo-dev-launcher` that removes references to the non-existent `reactDelegate?.reactNativeFactory` property. The patch keeps only the `appDelegate?.factory` access path, which works correctly with SDK 54.

### What was changed:

1. **Line 58**: Removed the fallback to `reactDelegate?.reactNativeFactory`
   ```swift
   // Before:
   guard let reactNativeFactory = appDelegate?.factory as? RCTReactNativeFactory ?? reactDelegate?.reactNativeFactory as? RCTReactNativeFactory else {

   // After:
   guard let reactNativeFactory = appDelegate?.factory as? RCTReactNativeFactory else {
   ```

2. **Lines 85-91**: Removed the entire fallback block that tried to use `reactDelegate?.reactNativeFactory`
   ```swift
   // Removed:
   if let factory = reactDelegate?.reactNativeFactory {
     return factory.recreateRootView(...)
   }
   ```

## Patch Management

This project uses `patch-package` to automatically apply the fix after `npm install`.

### Files involved:
- `patches/expo-dev-launcher+6.0.13.patch` - The patch file
- `package.json` - Contains `"postinstall": "patch-package"` script

### If you need to reinstall:

```bash
# Remove node_modules
rm -rf node_modules

# Reinstall dependencies (patch will be applied automatically)
npm install

# Reinstall iOS pods
cd ios && pod install && cd ..
```

### If the patch fails:

If you encounter issues with the patch, you can manually apply it:

```bash
npx patch-package expo-dev-launcher
```

## Verification

After applying the patch, your `AppDelegate.swift` should work correctly with the following setup:

```swift
import Expo
import React
import ReactAppDependencyProvider

@UIApplicationMain
public class AppDelegate: ExpoAppDelegate {
  var window: UIWindow?
  var reactNativeDelegate: ExpoReactNativeFactoryDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  // ... rest of AppDelegate implementation
}
```

The key is that `AppDelegate` conforms to `ReactNativeFactoryProvider` protocol (via `ExpoAppDelegate`), which provides the `factory` property that the patched code uses.

## Future Updates

This fix should be temporary. The issue will likely be resolved in future versions of:
- `expo-dev-launcher` (versions after 6.0.13)
- Expo SDK 55+

When upgrading Expo or expo-dev-launcher, test if the patch is still needed by temporarily removing it and attempting a build.

## Related Information

- **Expo SDK Version**: 54.0.10
- **expo-dev-client Version**: 6.0.13
- **expo-modules-core Version**: 3.0.18
- **React Native Version**: 0.81.4

## References

- GitHub PR #39844: "Remove ExpoAppDelegate requirement in ExpoReactNativeFactory, DevClient and Updates"
- Expo SDK 54 introduced changes to make the framework more flexible for brownfield app integration
