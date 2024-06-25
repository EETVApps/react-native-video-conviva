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

    @objc(save:reactTag:resolver:rejecter:)
    func save(options: NSDictionary, reactTag: NSNumber, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        performOnVideoView(withReactTag: reactTag, callback: { videoView in
            videoView?.save(options: options, resolve: resolve, reject: reject)
        })
    }

    @objc(seek:reactTag:)
    func seek(info: NSDictionary, reactTag: NSNumber) {
        performOnVideoView(withReactTag: reactTag, callback: { videoView in
            videoView?.setSeek(info)
        })
    }

    @objc(setLicenseResult:licenseUrl:reactTag:)
    func setLicenseResult(license: NSString, licenseUrl: NSString, reactTag: NSNumber) {
        performOnVideoView(withReactTag: reactTag, callback: { videoView in
            videoView?.setLicenseResult(license as String, licenseUrl as String)
        })
    }

    @objc(setLicenseResultError:licenseUrl:reactTag:)
    func setLicenseResultError(error: NSString, licenseUrl: NSString, reactTag: NSNumber) {
        performOnVideoView(withReactTag: reactTag, callback: { videoView in
            videoView?.setLicenseResultError(error as String, licenseUrl as String)
        })
    }

    @objc(dismissFullscreenPlayer:)
    func dismissFullscreenPlayer(_ reactTag: NSNumber) {
        performOnVideoView(withReactTag: reactTag, callback: { videoView in
            videoView?.dismissFullscreenPlayer()
        })
    }

    @objc(presentFullscreenPlayer:)
    func presentFullscreenPlayer(_ reactTag: NSNumber) {
        performOnVideoView(withReactTag: reactTag, callback: { videoView in
            videoView?.presentFullscreenPlayer()
        })
    }

    @objc(setPlayerPauseState:reactTag:)
    func setPlayerPauseState(paused: NSNumber, reactTag: NSNumber) {
        performOnVideoView(withReactTag: reactTag, callback: { videoView in
            videoView?.setPaused(paused.boolValue)
        })
    }

    @objc(setVolume:reactTag:)
    func setVolume(value: Float, reactTag: NSNumber) {
        performOnVideoView(withReactTag: reactTag, callback: { videoView in
            videoView?.setVolume(value)
        })
    }

    @objc(getCurrentPosition:resolver:rejecter:)
    func getCurrentPosition(reactTag: NSNumber, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        performOnVideoView(withReactTag: reactTag, callback: { videoView in
            videoView?.getCurrentPlaybackTime(resolve, reject)
        })
    }

    @objc(setFullScreen:reactTag:)
    func setFullScreen(fullScreen: Bool, reactTag: NSNumber) {
        performOnVideoView(withReactTag: reactTag, callback: { videoView in
            videoView?.setFullscreen(fullScreen)
        })
    }

    override class func requiresMainQueueSetup() -> Bool {
        return true
    }
    
    //MARK: - Conviva bridging methods
    @objc(convivaInit:gatewayUrl:playerName:tags:enableDebug:reactTag:)
    func convivaInit(customerKey: String, gatewayUrl: String, playerName: String, tags : [String:Any], enableDebug : Bool, reactTag : Int)  {
        ConvivaSessionsManager.sharedManager.initialiseConviva(customerKey: customerKey, gatewayUrl: gatewayUrl, playerName: playerName, tags: tags, enableDebug: enableDebug)
    }
    
    @objc(reportPlaybackRequested:isLive:tags:reactTag:)
    func reportPlaybackRequested(assetName: String, isLive: Bool, tags : [String:Any], reactTag : Int) {
        ConvivaSessionsManager.sharedManager.reportPlaybackRequested(assetName: assetName, isLive: isLive, tags: tags)
    }
    
    @objc(setPlaybackData:viewerId:tags:reactTag:)
    func setPlaybackData(streamUrl: String, viewerId: String, tags : [String:Any], reactTag : Int) {
        ConvivaSessionsManager.sharedManager.setPlaybackData(streamUrl: streamUrl, viewerId: viewerId, tags: tags)
    }
    
    @objc(reportWarning:reactTag:)
    func reportWarning(message: String, reactTag : Int) {
        ConvivaSessionsManager.sharedManager.reportWarning(message: message)
    }

    @objc(reportError:tags:reactTag:)
    func reportError(message: String, tags : [String:Any], reactTag : Int) {
        ConvivaSessionsManager.sharedManager.reportError(message: message, tags: tags)
    }
    
    @objc(setSeekStart:reactTag:)
    func setSeekStart(startPosition: Int, reactTag : Int) {
        ConvivaSessionsManager.sharedManager.setSeekStart(startPosition: startPosition)
    }
    
    @objc(setSeekEnd:reactTag:)
    func setSeekEnd(endPosition: Int, reactTag : Int) {
        ConvivaSessionsManager.sharedManager.setSeekEnd(endPosition: endPosition)
    }
    
    @objc(reportPlaybackEnded:)
    func reportPlaybackEnded(reactTag : Int) {
        ConvivaSessionsManager.sharedManager.reportPlaybackEnded()
    }
}
