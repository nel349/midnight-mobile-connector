#import <React/RCTBridgeModule.h>

@interface TestModule : NSObject <RCTBridgeModule>
@end

@implementation TestModule

RCT_EXPORT_MODULE(TestModule)

RCT_EXPORT_METHOD(test:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    resolve(@"Test module works!");
}

@end