package com.brentvatne.react

import android.util.Log
import com.brentvatne.exoplayer.ConvivaManager
import com.brentvatne.exoplayer.ReactExoplayerView
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.common.UIManagerType
import kotlin.math.roundToInt

class VideoManagerModule(reactContext: ReactApplicationContext?) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = REACT_CLASS

    private fun performOnPlayerView(reactTag: Int, callback: (ReactExoplayerView?) -> Unit) {
        UiThreadUtil.runOnUiThread {
            try {
                val uiManager = UIManagerHelper.getUIManager(
                    reactApplicationContext,
                    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) UIManagerType.FABRIC else UIManagerType.DEFAULT
                )

                val view = uiManager?.resolveView(reactTag)

                if (view is ReactExoplayerView) {
                    callback(view)
                } else {
                    callback(null)
                }
            } catch (e: Exception) {
                callback(null)
            }
        }
    }

    @ReactMethod
    fun setPlayerPauseStateCmd(reactTag: Int, paused: Boolean?) {
        performOnPlayerView(reactTag) {
            it?.setPausedModifier(paused!!)
        }
    }

    @ReactMethod
    fun seekCmd(reactTag: Int, time: Float, tolerance: Float) {
        performOnPlayerView(reactTag) {
            it?.seekTo((time * 1000f).roundToInt().toLong())
        }
    }

    @ReactMethod
    fun setVolumeCmd(reactTag: Int, volume: Float) {
        performOnPlayerView(reactTag) {
            it?.setVolumeModifier(volume)
        }
    }

    @ReactMethod
    fun setFullScreenCmd(reactTag: Int, fullScreen: Boolean) {
        performOnPlayerView(reactTag) {
            it?.setFullscreen(fullScreen)
        }
    }

    @ReactMethod
    fun getCurrentPosition(reactTag: Int, promise: Promise) {
        performOnPlayerView(reactTag) {
            it?.getCurrentPosition(promise)
        }
    }

    private var convivaManager: ConvivaManager? = null

    @ReactMethod
    fun convivaInitCmd(reactTag: Int, customerKey: String, gatewayUrl: String?, playerName: String, tags: ReadableMap, enableDebug: Boolean) {
        performOnPlayerView(reactTag) { exoplayerView ->
            exoplayerView?.let {
                convivaManager = ConvivaManager(exoplayerView.context, customerKey, gatewayUrl, playerName, tags.toHashMap(), enableDebug)
                exoplayerView.setPlayerCreatedCallback { exoPlayer ->
                    convivaManager?.setPlayer(exoPlayer)
                }
            } ?: run {
                Log.e(REACT_CLASS, "Missing view for convivaInit")
            }
        }
    }

    @ReactMethod
    fun reportPlaybackRequestedCmd(reactTag: Int, assetName: String, isLive: Boolean, tags: ReadableMap) {
        // Forcing onto UI thread to prevent race condition with init
        UiThreadUtil.runOnUiThread {
            convivaManager?.reportPlaybackRequested(assetName, isLive, tags.toHashMap())
                ?: run {
                    Log.e(REACT_CLASS, "Missing convivaManager for reportPlaybackRequested")
                }
        }
    }

    @ReactMethod
    fun setPlaybackDataCmd(reactTag: Int, streamUrl: String?, viewerId: String, tags: ReadableMap) {
        // Forcing onto UI thread to prevent race condition with init
        UiThreadUtil.runOnUiThread {
            convivaManager?.setPlaybackData(streamUrl, viewerId, tags.toHashMap())
                ?: run {
                    Log.e(REACT_CLASS, "Missing convivaManager for setPlaybackData")
                }
        }
    }

    @ReactMethod
    fun reportWarningCmd(reactTag: Int, message: String) {
        // Forcing onto UI thread to prevent race condition with init
        UiThreadUtil.runOnUiThread {
            convivaManager?.reportWarning(message)
                ?: run {
                    Log.e(REACT_CLASS, "Missing convivaManager for reportError")
                }
        }
    }

    @ReactMethod
    fun reportErrorCmd(reactTag: Int, message: String, tags: ReadableMap) {
        // Forcing onto UI thread to prevent race condition with init
        UiThreadUtil.runOnUiThread {
            convivaManager?.reportError(message, tags.toHashMap())
                ?: run {
                    Log.e(REACT_CLASS, "Missing convivaManager for reportError")
                }
        }
    }

    @ReactMethod
    fun reportPlaybackEndedCmd(reactTag: Int) {
        // Forcing onto UI thread to prevent race condition with init
        UiThreadUtil.runOnUiThread {
            convivaManager?.reportPlaybackEnded()
                ?: run {
                    Log.e(REACT_CLASS, "Missing convivaManager for reportPlaybackEnded")
                }
        }
    }
	
	@ReactMethod
    fun restartInSdCmd(reactTag: Int){
        performOnPlayerView(reactTag){
            it?.restartInSd()
        }
    }    companion object {
        private const val REACT_CLASS = "VideoManager"
    }
}
