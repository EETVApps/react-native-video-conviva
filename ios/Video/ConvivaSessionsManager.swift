//
//  ConvivaSessionsManager.swift
//  OnTheGo
//
//  Created by Taiwo Sorungbe on 20/06/2024.
//  Copyright © 2024 BT. All rights reserved.
//

import UIKit
import ConvivaSDK
import ConvivaAVFoundation

@objc public class ConvivaSessionsManager: NSObject {

    /// Singleton for Conviva Sessions Manager.
    @objc public static let sharedManager = ConvivaSessionsManager()
    
    /// top level CISAnalytics object
    private var analytics:CISAnalytics?
    ///This object will be used throughout the entire application lifecycle to report video related events.
    private var videoAnalytics:CISVideoAnalytics?
    
    private var onInitTagsDictionary:[String:Any]! = [String:Any]()
    private var sessionTagsDictionary:[String:Any]?
    private var playbackRequested:Bool = false
    private weak var player:AVPlayer?

    // MARK: Intialization
    
    override private init() {
        super.init()
    }
    
    // MARK: instance methods
    @objc public func initialiseConviva(customerKey: String?, gatewayUrl: String?, playerName: String?, tags : [String:Any]?, enableDebug : Bool)  {
        
        print("\(#fileID) \(#function) called - customerKey: \(customerKey ?? "undefined"), gatewayUrl: \(gatewayUrl ?? "undefined"), playerName: \(playerName ?? "undefined"), tags: \(String(describing: tags))")
        
        if analytics != nil {
            // already initialised
            return;
        }
        
        let logLevel = enableDebug ? LogLevel.LOGLEVEL_DEBUG.rawValue : LogLevel.LOGLEVEL_NONE.rawValue

        if let customer_key = customerKey, let gateway_url = gatewayUrl {
            var settingsDict = [String:Any]()
            settingsDict[CIS_SSDK_SETTINGS_GATEWAY_URL] = gateway_url
            settingsDict[CIS_SSDK_SETTINGS_LOG_LEVEL] = logLevel
            analytics = CISAnalyticsCreator.create(withCustomerKey: customer_key, settings: settingsDict)
            
            // Instantiate Video Analytics used throughout the app lifecycle to report video related events
            // Disable auto detection of the stream as we want to report the stream URL from VOSP
            var options = [String:Any]()
            options[CIS_SDK_OPTION_EXTERNAL_STREAMURL_REPORTING] = 1 // true
            videoAnalytics = self.analytics?.createVideoAnalytics(options)
        }
        else if let customer_key = customerKey {
            analytics = CISAnalyticsCreator.create(withCustomerKey: customer_key)
            var options = [String:Any]()
            options[CIS_SDK_OPTION_EXTERNAL_STREAMURL_REPORTING] = 1 // true
            videoAnalytics = self.analytics?.createVideoAnalytics(options)
        }
        
        sessionTagsDictionary = [String:Any]()
        if let tags = tags, tags.isEmpty == false {
            tags.forEach { (key, value) in
                onInitTagsDictionary[key] = value
                sessionTagsDictionary?[key] = value
            }
        }

        if let player_name = playerName {
            onInitTagsDictionary[CIS_SSDK_METADATA_PLAYER_NAME] = player_name
            sessionTagsDictionary?[CIS_SSDK_METADATA_PLAYER_NAME] = player_name
        }
        
    }
    
    @objc public func reportPlaybackRequested(assetName: String, isLive: Bool, tags : [String:Any]?) {
        
        print("\(#fileID) \(#function) called - assetName: \(assetName), isLive: \(isLive), tags: \(String(describing: tags))")

        if analytics == nil {
            // not yet initialised
            return;
        }

        if playbackRequested {
            cleanupSession()
        }
        
        sessionTagsDictionary?[CIS_SSDK_METADATA_IS_LIVE] = isLive ? 1 : 0
        sessionTagsDictionary?[CIS_SSDK_METADATA_ASSET_NAME] = assetName

        if let tags = tags, tags.isEmpty == false {
            tags.forEach { (key, value) in
                sessionTagsDictionary?[key] = value
            }
        }

        videoAnalytics?.reportPlaybackRequested(sessionTagsDictionary)
        playbackRequested = true
    }
    
    @objc public func setPlaybackData(streamUrl: String, viewerId: String, tags : [String:Any]?) {
        
        print("\(#fileID) \(#function) called - streamUrl: \(streamUrl), viewerId: \(viewerId), tags: \(String(describing: tags))")

        sessionTagsDictionary?[CIS_SSDK_METADATA_VIEWER_ID] = viewerId
        sessionTagsDictionary?[CIS_SSDK_METADATA_STREAM_URL] = streamUrl
        
        if let tags = tags, tags.isEmpty == false {
            tags.forEach { (key, value) in
                sessionTagsDictionary?[key] = value
            }
        }

        if let contentInfo = sessionTagsDictionary {
            videoAnalytics?.setContentInfo(contentInfo)
        }
        
        let avPlayer = self.player ?? NowPlayingInfoCenterManager.shared.getStreamingPlayer()
        if playbackRequested, let streamer = avPlayer {
            // attach player to conviva
            videoAnalytics?.setPlayer(streamer)
        }
    }
    
    @objc public func reportWarning(message: String) {
        print("\(#fileID) \(#function) called - message: \(message)")

        if playbackRequested {
            videoAnalytics?.reportPlaybackError(message, errorSeverity: ErrorSeverity.ERROR_WARNING)
        }
    }

    
    @objc public func reportError(message: String, tags : [String:Any]?) {
        print("\(#fileID) \(#function) called - message: \(message), tags: \(String(describing: tags))")

        if let tags = tags, tags.isEmpty == false {
            tags.forEach { (key, value) in
                sessionTagsDictionary?[key] = value
            }
        }

        if let contentInfo = sessionTagsDictionary {
            videoAnalytics?.setContentInfo(contentInfo)
        }

        if playbackRequested {
            videoAnalytics?.reportPlaybackError(message, errorSeverity: ErrorSeverity.ERROR_FATAL)
        }
    }

    @objc public func setStreamPlayer(player:AVPlayer?) {
        print("\(#fileID) \(#function) called")
        if self.player != nil && self.player != player {
            cleanupSession()
        }
        self.player = player
    }

    @objc public func removeStreamPlayer(player:AVPlayer?) {
        print("\(#fileID) \(#function) called")
        if self.player == player {
            cleanupSession()
        }
    }
    
    @objc public func setSeekStart(startPosition:Int) {
        print("\(#fileID) \(#function) called - startPosition: \(startPosition)")
        if playbackRequested {
            videoAnalytics?.reportPlaybackMetric(CIS_SSDK_PLAYBACK_METRIC_SEEK_STARTED, value: startPosition)
        }
    }
    
    @objc public func setSeekEnd(endPosition:Int) {
        print("\(#fileID) \(#function) called - endPosition: \(endPosition)")
        if playbackRequested {
            videoAnalytics?.reportPlaybackMetric(CIS_SSDK_PLAYBACK_METRIC_SEEK_ENDED, value: endPosition)
        }
    }

    @objc public func reportPlaybackEnded() {
        print("\(#fileID) \(#function) called")
        cleanupSession()
    }
    
    @objc public func cleanupSession() {
        print("\(#fileID) \(#function) called")

        if playbackRequested {
            playbackRequested = false
            videoAnalytics?.reportPlaybackEnded()
            videoAnalytics?.cleanup()
            sessionTagsDictionary = [String:Any]()
            if onInitTagsDictionary.isEmpty == false {
                onInitTagsDictionary.forEach { (key, value) in
                    sessionTagsDictionary?[key] = value
                }
            }
        }
    }
}
