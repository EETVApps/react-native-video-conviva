import {NativeModules} from 'react-native';
import type {
  Int32,
  Float,
  UnsafeObject,
} from 'react-native/Libraries/Types/CodegenTypes';

export type VideoSaveData = {
  uri: string;
};

// @TODO rename to "Spec" when applying new arch
export interface VideoManagerType {
    convivaInitCmd: (
    reactTag: Int32, 
	customerKey: string,
    gatewayUrl: string,
    playerName: string,
    tags: object,
    enableDebug: boolean
  ) => Promise<void>;
  reportPlaybackRequestedCmd: (
    reactTag: Int32, 
	assetName: string,
    isLive: boolean,
    tags: object
  ) => Promise<void>;
  setPlaybackDataCmd: (
    reactTag: Int32, 
    streamUrl: string,
    viewerId: string,
    tags: object
  ) => Promise<void>;
  reportWarningCmd: (
    reactTag: Int32, 
	message: string
  ) => Promise<void>;
  reportErrorCmd: (
    reactTag: Int32, 
	message: string,
    tags: object
  ) => Promise<void>;
  reportPlaybackEndedCmd: (
    reactTag: Int32
  ) => Promise<void>;
  restartInSdCmd: (reactTag: Int32) => Promise<void>;
  seekCmd: (reactTag: Int32, time: Float, tolerance?: Float) => Promise<void>;
  setPlayerPauseStateCmd: (reactTag: Int32, paused: boolean) => Promise<void>;
  setLicenseResultCmd: (
    reactTag: Int32,
    result: string,
    licenseUrl: string,
  ) => Promise<void>;
  setLicenseResultErrorCmd: (
    reactTag: Int32,
    error: string,
    licenseUrl: string,
  ) => Promise<void>;
  setFullScreenCmd: (reactTag: Int32, fullScreen: boolean) => Promise<void>;
  setVolumeCmd: (reactTag: Int32, volume: number) => Promise<void>;
  save: (reactTag: Int32, option: UnsafeObject) => Promise<VideoSaveData>;
  getCurrentPosition: (reactTag: Int32) => Promise<Int32>;
}

export default NativeModules.VideoManager as VideoManagerType;
