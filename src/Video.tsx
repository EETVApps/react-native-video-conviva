import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  forwardRef,
  useImperativeHandle,
  type ComponentRef,
} from 'react';
import {
  View,
  StyleSheet,
  Image,
  Platform,
  type StyleProp,
  type ImageStyle,
  type NativeSyntheticEvent,
} from 'react-native';

import NativeVideoComponent, {
  type OnAudioFocusChangedData,
  type OnAudioTracksData,
  type OnBandwidthUpdateData,
  type OnBufferData,
  type OnExternalPlaybackChangeData,
  type OnGetLicenseData,
  type OnLoadStartData,
  type OnPictureInPictureStatusChangedData,
  type OnPlaybackStateChangedData,
  type OnProgressData,
  type OnSeekData,
  type OnTextTrackDataChangedData,
  type OnTimedMetadataData,
  type OnVideoAspectRatioData,
  type OnVideoErrorData,
  type OnVideoTracksData,
  type VideoComponentType,
  type VideoSrc,
} from './specs/VideoNativeComponent';
import {
  generateHeaderForNative,
  getReactTag,
  resolveAssetSourceForVideo,
} from './utils';
import {VideoManager} from './specs/VideoNativeComponent';
import type {
  OnLoadData,
  OnTextTracksData,
  OnReceiveAdEventData,
  ReactVideoProps,
} from './types';

export type VideoSaveData = {
  uri: string;
};

export interface VideoRef {
  convivaInit: (customerKey: string, gatewayUrl: string, playerName: string, tags: object, enableDebug: boolean) => void;
  reportPlaybackRequested: (assetName: string, isLive: boolean, tags: object) => void;
  setPlaybackData: (streamUrl: string, viewerId: string, tags: object) => void;
  reportWarning: (message: string) => void;
  reportError: (message: string, tags: object) => void;
  reportPlaybackEnded: () => void;
  seek: (time: number, tolerance?: number) => void;
  resume: () => void;
  pause: () => void;
  presentFullscreenPlayer: () => void;
  dismissFullscreenPlayer: () => void;
  restoreUserInterfaceForPictureInPictureStopCompleted: (
    restore: boolean,
  ) => void;
  save: (options: object) => Promise<VideoSaveData>;
}

const Video = forwardRef<VideoRef, ReactVideoProps>(
  (
    {
      source,
      style,
      resizeMode,
      posterResizeMode,
      poster,
      fullscreen,
      drm,
      textTracks,
      selectedVideoTrack,
      selectedAudioTrack,
      selectedTextTrack,
      onLoadStart,
      onLoad,
      onError,
      onProgress,
      onSeek,
      onEnd,
      onBuffer,
      onBandwidthUpdate,
      onExternalPlaybackChange,
      onFullscreenPlayerWillPresent,
      onFullscreenPlayerDidPresent,
      onFullscreenPlayerWillDismiss,
      onFullscreenPlayerDidDismiss,
      onReadyForDisplay,
      onPlaybackRateChange,
      onVolumeChange,
      onAudioBecomingNoisy,
      onPictureInPictureStatusChanged,
      onRestoreUserInterfaceForPictureInPictureStop,
      onReceiveAdEvent,
      onPlaybackStateChanged,
      onAudioFocusChanged,
      onIdle,
      onTimedMetadata,
      onAudioTracks,
      onTextTracks,
      onTextTrackDataChanged,
      onVideoTracks,
      onAspectRatio,
      ...rest
    },
    ref,
  ) => {
    const nativeRef = useRef<ComponentRef<VideoComponentType>>(null);
    const [showPoster, setShowPoster] = useState(!!poster);
    const [isFullscreen, setIsFullscreen] = useState(fullscreen);
    const [
      _restoreUserInterfaceForPIPStopCompletionHandler,
      setRestoreUserInterfaceForPIPStopCompletionHandler,
    ] = useState<boolean | undefined>();

    const hasPoster = !!poster;

    const posterStyle = useMemo<StyleProp<ImageStyle>>(
      () => ({
        ...StyleSheet.absoluteFillObject,
        resizeMode:
          posterResizeMode && posterResizeMode !== 'none'
            ? posterResizeMode
            : 'contain',
      }),
      [posterResizeMode],
    );

    const src = useMemo<VideoSrc | undefined>(() => {
      if (!source) {
        return undefined;
      }
      const resolvedSource = resolveAssetSourceForVideo(source);
      let uri = resolvedSource.uri || '';
      if (uri && uri.match(/^\//)) {
        uri = `file://${uri}`;
      }
      if (!uri) {
        console.log('Trying to load empty source');
      }
      const isNetwork = !!(uri && uri.match(/^(rtp|rtsp|http|https):/));
      const isAsset = !!(
        uri &&
        uri.match(
          /^(assets-library|ipod-library|file|content|ms-appx|ms-appdata):/,
        )
      );

      return {
        uri,
        isNetwork,
        isAsset,
        shouldCache: resolvedSource.shouldCache || false,
        type: resolvedSource.type || '',
        mainVer: resolvedSource.mainVer || 0,
        patchVer: resolvedSource.patchVer || 0,
        requestHeaders: generateHeaderForNative(resolvedSource.headers),
        startPosition: resolvedSource.startPosition ?? -1,
        cropStart: resolvedSource.cropStart || 0,
        cropEnd: resolvedSource.cropEnd,
        title: resolvedSource.title,
        subtitle: resolvedSource.subtitle,
        description: resolvedSource.description,
        customImageUri: resolvedSource.customImageUri,
      };
    }, [source]);

    const _drm = useMemo(() => {
      if (!drm) {
        return;
      }

      return {
        type: drm.type,
        licenseServer: drm.licenseServer,
        headers: generateHeaderForNative(drm.headers),
        contentId: drm.contentId,
        certificateUrl: drm.certificateUrl,
        base64Certificate: drm.base64Certificate,
        useExternalGetLicense: !!drm.getLicense,
      };
    }, [drm]);

    const _selectedTextTrack = useMemo(() => {
      if (!selectedTextTrack) {
        return;
      }
      const type = typeof selectedTextTrack.value;
      if (type !== 'number' && type !== 'string') {
        console.log('invalid type provided to selectedTextTrack');
        return;
      }
      return {
        type: selectedTextTrack?.type,
        value: `${selectedTextTrack.value}`,
      };
    }, [selectedTextTrack]);

    const _selectedAudioTrack = useMemo(() => {
      if (!selectedAudioTrack) {
        return;
      }
      const type = typeof selectedAudioTrack.value;
      if (type !== 'number' && type !== 'string') {
        console.log('invalid type provided to selectedAudioTrack');
        return;
      }

      return {
        type: selectedAudioTrack?.type,
        value: `${selectedAudioTrack.value}`,
      };
    }, [selectedAudioTrack]);

    const _selectedVideoTrack = useMemo(() => {
      if (!selectedVideoTrack) {
        return;
      }
      const value = selectedVideoTrack?.value
        ? `${selectedVideoTrack.value}`
        : undefined;

      return {
        type: selectedVideoTrack?.type,
        value,
      };
    }, [selectedVideoTrack]);

    const convivaInit = useCallback((customerKey: string, gatewayUrl: string, playerName: string, tags: object, enableDebug: boolean) => {
      if (!nativeRef.current) {
        console.warn('Video Component is not mounted');
        return;
      }

      const convivaInitFunction = () => {
        VideoManager.convivaInit(customerKey, gatewayUrl, playerName, tags, enableDebug, getReactTag(nativeRef));
      };
      Platform.select({
        ios: convivaInitFunction,
        android: convivaInitFunction,
        default: () => {
          // TODO: Implement VideoManager.convivaInitFunction for windows
          // nativeRef.current?.setNativeProps({seek: time});
        },
      })();
    }, []);

    const reportPlaybackRequested = useCallback((assetName: string, isLive: boolean, tags: object) => {
      if (!nativeRef.current) {
        console.warn('Video Component is not mounted');
        return;
      }
      const reportPlaybackRequestedFunction = () => {
        VideoManager.reportPlaybackRequested(assetName, isLive, tags, getReactTag(nativeRef));
      };
      Platform.select({
        ios: reportPlaybackRequestedFunction,
        android: reportPlaybackRequestedFunction,
        default: () => {
          // TODO: Implement VideoManager.reportPlaybackRequested for windows
          // nativeRef.current?.setNativeProps({seek: time});
        },
      })();
    }, []);

    const setPlaybackData = useCallback((streamUrl: string, viewerId: string, tags: object) => {
      if (!nativeRef.current) {
        console.warn('Video Component is not mounted');
        return;
      }
      const setPlaybackDataFunction = () => {
        VideoManager.setPlaybackData(streamUrl, viewerId, tags, getReactTag(nativeRef));
      };
      Platform.select({
        ios: setPlaybackDataFunction,
        android: setPlaybackDataFunction,
        default: () => {
          // TODO: Implement VideoManager.setPlaybackData for windows
          // nativeRef.current?.setNativeProps({seek: time});
        },
      })();
    }, []);
	
	const reportWarning = useCallback((message: string) => {
      if (!nativeRef.current) {
        console.warn('Video Component is not mounted');
        return;
      }
      const reportWarningFunction = () => {
        VideoManager.reportWarning(message, getReactTag(nativeRef));
      };
      Platform.select({
        ios: reportWarningFunction,
        android: reportWarningFunction,
        default: () => {
          // TODO: Implement VideoManager.reportWarning for windows
          // nativeRef.current?.setNativeProps({seek: time});
        },
      })();
    }, []);

    const reportError = useCallback((message: string, tags: object) => {
      if (!nativeRef.current) {
        console.warn('Video Component is not mounted');
        return;
      }
      const reportErrorFunction = () => {
        VideoManager.reportError(message, tags, getReactTag(nativeRef));
      };
      Platform.select({
        ios: reportErrorFunction,
        android: reportErrorFunction,
        default: () => {
          // TODO: Implement VideoManager.reportError for windows
          // nativeRef.current?.setNativeProps({seek: time});
        },
      })();
    }, []);
	
	const reportPlaybackEnded = useCallback(() => {
      if (!nativeRef.current) {
        console.warn('Video Component is not mounted');
        return;
      }
      const reportPlaybackEndedFunction = () => {
        VideoManager.reportPlaybackEnded(getReactTag(nativeRef));
      };
      Platform.select({
        ios: reportPlaybackEndedFunction,
        android: reportPlaybackEndedFunction,
        default: () => {
          // TODO: Implement VideoManager.reportPlaybackEnded for windows
          // nativeRef.current?.setNativeProps({seek: time});
        },
      })();
    }, []);
  
    const seek = useCallback(async (time: number, tolerance?: number) => {
      if (isNaN(time)) {
        throw new Error('Specified time is not a number');
      }

      if (!nativeRef.current) {
        console.warn('Video Component is not mounted');
        return;
      }

      const callSeekFunction = () => {
        VideoManager.seek(
          {
            time,
            tolerance: tolerance || 0,
          },
          getReactTag(nativeRef),
        );
      };

      Platform.select({
        ios: callSeekFunction,
        android: callSeekFunction,
        default: () => {
          // TODO: Implement VideoManager.seek for windows
          nativeRef.current?.setNativeProps({seek: time});
        },
      })();
    }, []);

    const presentFullscreenPlayer = useCallback(() => {
      setIsFullscreen(true);
    }, [setIsFullscreen]);

    const dismissFullscreenPlayer = useCallback(() => {
      setIsFullscreen(false);
    }, [setIsFullscreen]);

    const save = useCallback((options: object) => {
      // VideoManager.save can be null on android & windows
      return VideoManager.save?.(options, getReactTag(nativeRef));
    }, []);

    const pause = useCallback(() => {
      return VideoManager.setPlayerPauseState(true, getReactTag(nativeRef));
    }, []);

    const resume = useCallback(() => {
      return VideoManager.setPlayerPauseState(false, getReactTag(nativeRef));
    }, []);

    const restoreUserInterfaceForPictureInPictureStopCompleted = useCallback(
      (restored: boolean) => {
        setRestoreUserInterfaceForPIPStopCompletionHandler(restored);
      },
      [setRestoreUserInterfaceForPIPStopCompletionHandler],
    );

    const onVideoLoadStart = useCallback(
      (e: NativeSyntheticEvent<OnLoadStartData>) => {
        hasPoster && setShowPoster(true);
        onLoadStart?.(e.nativeEvent);
      },
      [hasPoster, onLoadStart],
    );

    const onVideoLoad = useCallback(
      (e: NativeSyntheticEvent<OnLoadData>) => {
        if (Platform.OS === 'windows') {
          hasPoster && setShowPoster(false);
        }
        onLoad?.(e.nativeEvent);
      },
      [onLoad, hasPoster, setShowPoster],
    );

    const onVideoError = useCallback(
      (e: NativeSyntheticEvent<OnVideoErrorData>) => {
        onError?.(e.nativeEvent);
      },
      [onError],
    );

    const onVideoProgress = useCallback(
      (e: NativeSyntheticEvent<OnProgressData>) => {
        onProgress?.(e.nativeEvent);
      },
      [onProgress],
    );

    const onVideoSeek = useCallback(
      (e: NativeSyntheticEvent<OnSeekData>) => {
        onSeek?.(e.nativeEvent);
      },
      [onSeek],
    );

    const onVideoPlaybackStateChanged = useCallback(
      (e: NativeSyntheticEvent<OnPlaybackStateChangedData>) => {
        onPlaybackStateChanged?.(e.nativeEvent);
      },
      [onPlaybackStateChanged],
    );

    // android only
    const onVideoIdle = useCallback(() => {
      onIdle?.();
    }, [onIdle]);

    const _onTimedMetadata = useCallback(
      (e: NativeSyntheticEvent<OnTimedMetadataData>) => {
        onTimedMetadata?.(e.nativeEvent);
      },
      [onTimedMetadata],
    );

    const _onAudioTracks = useCallback(
      (e: NativeSyntheticEvent<OnAudioTracksData>) => {
        onAudioTracks?.(e.nativeEvent);
      },
      [onAudioTracks],
    );

    const _onTextTracks = useCallback(
      (e: NativeSyntheticEvent<OnTextTracksData>) => {
        onTextTracks?.(e.nativeEvent);
      },
      [onTextTracks],
    );

    const _onTextTrackDataChanged = useCallback(
      (
        e: NativeSyntheticEvent<OnTextTrackDataChangedData & {target?: number}>,
      ) => {
        const {...eventData} = e.nativeEvent;
        delete eventData.target;
        onTextTrackDataChanged?.(eventData as OnTextTrackDataChangedData);
      },
      [onTextTrackDataChanged],
    );

    const _onVideoTracks = useCallback(
      (e: NativeSyntheticEvent<OnVideoTracksData>) => {
        onVideoTracks?.(e.nativeEvent);
      },
      [onVideoTracks],
    );

    const _onPlaybackRateChange = useCallback(
      (e: NativeSyntheticEvent<Readonly<{playbackRate: number}>>) => {
        onPlaybackRateChange?.(e.nativeEvent);
      },
      [onPlaybackRateChange],
    );

    const _onVolumeChange = useCallback(
      (e: NativeSyntheticEvent<Readonly<{volume: number}>>) => {
        onVolumeChange?.(e.nativeEvent);
      },
      [onVolumeChange],
    );

    const _onReadyForDisplay = useCallback(() => {
      hasPoster && setShowPoster(false);
      onReadyForDisplay?.();
    }, [setShowPoster, hasPoster, onReadyForDisplay]);

    const _onPictureInPictureStatusChanged = useCallback(
      (e: NativeSyntheticEvent<OnPictureInPictureStatusChangedData>) => {
        onPictureInPictureStatusChanged?.(e.nativeEvent);
      },
      [onPictureInPictureStatusChanged],
    );

    const _onAudioFocusChanged = useCallback(
      (e: NativeSyntheticEvent<OnAudioFocusChangedData>) => {
        onAudioFocusChanged?.(e.nativeEvent);
      },
      [onAudioFocusChanged],
    );

    const onVideoBuffer = useCallback(
      (e: NativeSyntheticEvent<OnBufferData>) => {
        onBuffer?.(e.nativeEvent);
      },
      [onBuffer],
    );

    const onVideoExternalPlaybackChange = useCallback(
      (e: NativeSyntheticEvent<OnExternalPlaybackChangeData>) => {
        onExternalPlaybackChange?.(e.nativeEvent);
      },
      [onExternalPlaybackChange],
    );

    const _onBandwidthUpdate = useCallback(
      (e: NativeSyntheticEvent<OnBandwidthUpdateData>) => {
        onBandwidthUpdate?.(e.nativeEvent);
      },
      [onBandwidthUpdate],
    );

    const _onReceiveAdEvent = useCallback(
      (e: NativeSyntheticEvent<OnReceiveAdEventData>) => {
        onReceiveAdEvent?.(e.nativeEvent);
      },
      [onReceiveAdEvent],
    );

    const _onVideoAspectRatio = useCallback(
      (e: NativeSyntheticEvent<OnVideoAspectRatioData>) => {
        onAspectRatio?.(e.nativeEvent);
      },
      [onAspectRatio],
    );

    const useExternalGetLicense = drm?.getLicense instanceof Function;

    const onGetLicense = useCallback(
      (event: NativeSyntheticEvent<OnGetLicenseData>) => {
        if (useExternalGetLicense) {
          const data = event.nativeEvent;
          if (data && data.spcBase64) {
            const getLicenseOverride = drm.getLicense(
              data.spcBase64,
              data.contentId,
              data.licenseUrl,
              data.loadedLicenseUrl,
            );
            const getLicensePromise = Promise.resolve(getLicenseOverride); // Handles both scenarios, getLicenseOverride being a promise and not.
            getLicensePromise
              .then((result) => {
                if (result !== undefined) {
                  nativeRef.current &&
                    VideoManager.setLicenseResult(
                      result,
                      data.loadedLicenseUrl,
                      getReactTag(nativeRef),
                    );
                } else {
                  nativeRef.current &&
                    VideoManager.setLicenseResultError(
                      'Empty license result',
                      data.loadedLicenseUrl,
                      getReactTag(nativeRef),
                    );
                }
              })
              .catch(() => {
                nativeRef.current &&
                  VideoManager.setLicenseResultError(
                    'fetch error',
                    data.loadedLicenseUrl,
                    getReactTag(nativeRef),
                  );
              });
          } else {
            VideoManager.setLicenseResultError(
              'No spc received',
              data.loadedLicenseUrl,
              getReactTag(nativeRef),
            );
          }
        }
      },
      [drm, useExternalGetLicense],
    );

    useImperativeHandle(
      ref,
      () => ({
        convivaInit,
        reportPlaybackRequested,
        setPlaybackData,
        reportWarning,
        reportError,
        reportPlaybackEnded,
        seek,
        presentFullscreenPlayer,
        dismissFullscreenPlayer,
        save,
        pause,
        resume,
        restoreUserInterfaceForPictureInPictureStopCompleted,
      }),
      [
        convivaInit,
        reportPlaybackRequested,
        setPlaybackData,
        reportWarning,
        reportError,
        reportPlaybackEnded,
        seek,
        presentFullscreenPlayer,
        dismissFullscreenPlayer,
        save,
        pause,
        resume,
        restoreUserInterfaceForPictureInPictureStopCompleted,
      ],
    );

    return (
      <View style={style}>
        <NativeVideoComponent
          ref={nativeRef}
          {...rest}
          src={src}
          drm={_drm}
          style={StyleSheet.absoluteFill}
          resizeMode={resizeMode}
          fullscreen={isFullscreen}
          restoreUserInterfaceForPIPStopCompletionHandler={
            _restoreUserInterfaceForPIPStopCompletionHandler
          }
          textTracks={textTracks}
          selectedTextTrack={_selectedTextTrack}
          selectedAudioTrack={_selectedAudioTrack}
          selectedVideoTrack={_selectedVideoTrack}
          onGetLicense={useExternalGetLicense ? onGetLicense : undefined}
          onVideoLoad={onVideoLoad as (e: NativeSyntheticEvent<object>) => void}
          onVideoLoadStart={onVideoLoadStart}
          onVideoError={onVideoError}
          onVideoProgress={onVideoProgress}
          onVideoSeek={onVideoSeek}
          onVideoEnd={onEnd}
          onVideoBuffer={onVideoBuffer}
          onVideoPlaybackStateChanged={onVideoPlaybackStateChanged}
          onVideoBandwidthUpdate={_onBandwidthUpdate}
          onTimedMetadata={_onTimedMetadata}
          onAudioTracks={_onAudioTracks}
          onTextTracks={_onTextTracks}
          onTextTrackDataChanged={_onTextTrackDataChanged}
          onVideoTracks={_onVideoTracks}
          onVideoFullscreenPlayerDidDismiss={onFullscreenPlayerDidDismiss}
          onVideoFullscreenPlayerDidPresent={onFullscreenPlayerDidPresent}
          onVideoFullscreenPlayerWillDismiss={onFullscreenPlayerWillDismiss}
          onVideoFullscreenPlayerWillPresent={onFullscreenPlayerWillPresent}
          onVideoExternalPlaybackChange={onVideoExternalPlaybackChange}
          onVideoIdle={onVideoIdle}
          onAudioFocusChanged={_onAudioFocusChanged}
          onReadyForDisplay={_onReadyForDisplay}
          onPlaybackRateChange={_onPlaybackRateChange}
          onVolumeChange={_onVolumeChange}
          onVideoAudioBecomingNoisy={onAudioBecomingNoisy}
          onPictureInPictureStatusChanged={_onPictureInPictureStatusChanged}
          onRestoreUserInterfaceForPictureInPictureStop={
            onRestoreUserInterfaceForPictureInPictureStop
          }
          onVideoAspectRatio={_onVideoAspectRatio}
          onReceiveAdEvent={
            _onReceiveAdEvent as (e: NativeSyntheticEvent<object>) => void
          }
        />
        {hasPoster && showPoster ? (
          <Image style={posterStyle} source={{uri: poster}} />
        ) : null}
      </View>
    );
  },
);

Video.displayName = 'Video';
export default Video;
