/**
 * Objective-C Bridge for PitchDetectorModule
 * Exposes Swift native module to React Native JavaScript
 */

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(PitchDetectorModule, RCTEventEmitter)

RCT_EXTERN_METHOD(startPitchDetection:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(stopPitchDetection)
RCT_EXTERN_METHOD(stopPitchDetectionAndReleaseSession:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(reconfigureAndStartPitchDetection:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(requestPermissions:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

@end
