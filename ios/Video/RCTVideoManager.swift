import AVFoundation
import React

@objc(RCTVideoManager)
class RCTVideoManager: RCTViewManager {
    override func view() -> UIView {
        return RCTVideo(eventDispatcher: (RCTBridge.current().eventDispatcher() as! RCTEventDispatcher))
    }

    func methodQueue() -> DispatchQueue {
        return bridge.uiManager.methodQueue
    }

    func performOnVideoView(withReactTag reactTag: NSNumber, callback: @escaping (RCTVideo?) -> Void) {
        DispatchQueue.main.async { [weak self] in
            guard let self else {
                callback(nil)
                return
            }

            let view = self.bridge.uiManager.view(forReactTag: reactTag)

            guard let videoView = view as? RCTVideo else {
                DebugLog("Invalid view returned from registry, expecting RCTVideo, got: \(String(describing: self.view))")
                callback(nil)
                return
            }

            callback(videoView)
        }
    }

    @objc(seekCmd:time:tolerance:)
    func seekCmd(_ reactTag: NSNumber, time: NSNumber, tolerance: NSNumber) {
        performOnVideoView(withReactTag: reactTag, callback: { videoView in
            videoView?.setSeek(time, tolerance)
        })
    }

    @objc(setLicenseResultCmd:license:licenseUrl:)
    func setLicenseResultCmd(_ reactTag: NSNumber, license: NSString, licenseUrl: NSString) {
        performOnVideoView(withReactTag: reactTag, callback: { videoView in
            videoView?.setLicenseResult(license as String, licenseUrl as String)
        })
    }

    @objc(setLicenseResultErrorCmd:error:licenseUrl:)
    func setLicenseResultErrorCmd(_ reactTag: NSNumber, error: NSString, licenseUrl: NSString) {
        performOnVideoView(withReactTag: reactTag, callback: { videoView in
            videoView?.setLicenseResultError(error as String, licenseUrl as String)
        })
    }

    @objc(setPlayerPauseStateCmd:paused:)
    func setPlayerPauseStateCmd(_ reactTag: NSNumber, paused: Bool) {
        performOnVideoView(withReactTag: reactTag, callback: { videoView in
            videoView?.setPaused(paused)
        })
    }

    @objc(setVolumeCmd:volume:)
    func setVolumeCmd(_ reactTag: NSNumber, volume: Float) {
        performOnVideoView(withReactTag: reactTag, callback: { videoView in
            videoView?.setVolume(volume)
        })
    }

    @objc(setFullScreenCmd:fullscreen:)
    func setFullScreenCmd(_ reactTag: NSNumber, fullScreen: Bool) {
        performOnVideoView(withReactTag: reactTag, callback: { videoView in
            videoView?.setFullscreen(fullScreen)
        })
    }

    @objc(save:options:resolve:reject:)
    func save(_ reactTag: NSNumber, options: NSDictionary, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        performOnVideoView(withReactTag: reactTag, callback: { videoView in
            videoView?.save(options, resolve, reject)
        })
    }

    @objc(getCurrentPosition:resolve:reject:)
    func getCurrentPosition(_ reactTag: NSNumber, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        performOnVideoView(withReactTag: reactTag, callback: { videoView in
            videoView?.getCurrentPlaybackTime(resolve, reject)
        })
    }

    override class func requiresMainQueueSetup() -> Bool {
        return true
    }
    
    //MARK: - Conviva bridging methods
    @objc(convivaInitCmd:customerKey:gatewayUrl:playerName:tags:enableDebug:)
    func convivaInitCmd(_ reactTag: NSNumber, customerKey: String, gatewayUrl: String, playerName: String, tags : [String:Any], enableDebug : Bool)  {
        ConvivaSessionsManager.sharedManager.initialiseConviva(customerKey: customerKey, gatewayUrl: gatewayUrl, playerName: playerName, tags: tags, enableDebug: enableDebug)
    }
    
    @objc(reportPlaybackRequestedCmd:assetName:isLive:tags:)
    func reportPlaybackRequestedCmd(_ reactTag: NSNumber, assetName: String, isLive: Bool, tags : [String:Any]) {
        ConvivaSessionsManager.sharedManager.reportPlaybackRequested(assetName: assetName, isLive: isLive, tags: tags)
    }
    
    @objc(setPlaybackDataCmd:streamUrl:viewerId:tags:)
    func setPlaybackDataCmd(_ reactTag: NSNumber, streamUrl: String, viewerId: String, tags : [String:Any]) {
        ConvivaSessionsManager.sharedManager.setPlaybackData(streamUrl: streamUrl, viewerId: viewerId, tags: tags)
    }
    
    @objc(reportWarningCmd:message:)
    func reportWarningCmd(_ reactTag: NSNumber, message: String) {
        ConvivaSessionsManager.sharedManager.reportWarning(message: message)
    }

    @objc(reportErrorCmd:message:tags:)
    func reportErrorCmd(_ reactTag: NSNumber, message: String, tags : [String:Any]) {
        ConvivaSessionsManager.sharedManager.reportError(message: message, tags: tags)
    }
    
    @objc(setSeekStartCmd:startPosition:)
    func setSeekStartCmd(_ reactTag: NSNumber, startPosition: Int) {
        ConvivaSessionsManager.sharedManager.setSeekStart(startPosition: startPosition)
    }
    
    @objc(setSeekEndCmd:endPosition:)
    func setSeekEndCmd(_ reactTag: NSNumber, endPosition: Int) {
        ConvivaSessionsManager.sharedManager.setSeekEnd(endPosition: endPosition)
    }
    
    @objc(reportPlaybackEndedCmd:)
    func reportPlaybackEndedCmd(_ reactTag: NSNumber) {
        ConvivaSessionsManager.sharedManager.reportPlaybackEnded()
    }
}
