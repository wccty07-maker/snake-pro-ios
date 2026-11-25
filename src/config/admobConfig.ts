/**
 * Google AdMob 雙平台廣告設定檔
 *
 * - Android 正式設定維持原狀，絕不更動。
 * - iOS 明確區分開發測試與正式 Release 環境：
 *   - 開發測試：透過 VITE_IOS_ADMOB_TEST_MODE=true 啟用 Google 官方 iOS Rewarded Test Ad Unit ID
 *     (`ca-app-pub-3940256099942544/1712485313`) 與測試裝置清單 (VITE_IOS_ADMOB_TEST_DEVICES)，避免點擊自有正式廣告。
 *   - 正式 Release：預設 `ios.isTesting = false`，使用正式 iOS App ID 與 Rewarded Ad Unit ID。
 */

export interface AdMobPlatformConfig {
  appId: string;
  rewardedAdUnitId: string;
}

export interface AdMobIOSPlatformConfig extends AdMobPlatformConfig {
  /** Google 官方 iOS Rewarded 測試廣告單元 ID (僅測試模式使用) */
  testRewardedAdUnitId: string;
  /** iOS 是否處於測試廣告模式 (正式 Release 預設 false) */
  isTesting: boolean;
  /** 註冊之 iOS 測試裝置 ID 清單 (透過 VITE_IOS_ADMOB_TEST_DEVICES 逗號分隔設定) */
  testingDevices: string[];
  /** 可選：UMP 測試地區 ('EEA' | 'NOT_EEA' | 'DISABLED')，僅於 isTesting=true 時生效 */
  umpDebugGeography: 'EEA' | 'NOT_EEA' | 'DISABLED';
}

export interface AdMobConfig {
  /** Android 原有測試旗標（維持 false，不更動 Android 行為） */
  isTesting: boolean;

  // 獎勵設定
  rewardAmount: number; // 每次看完獎勵愛心數量 (1 顆)
  dailyLimit: number;   // 每日觀看上限次數 (5 次)

  // 雙平台廣告單元設定
  android: AdMobPlatformConfig;
  ios: AdMobIOSPlatformConfig;
}

/** Google 官方 iOS Rewarded Video Test Ad Unit ID */
export const GOOGLE_IOS_TEST_REWARDED_AD_UNIT_ID =
  'ca-app-pub-3940256099942544/1712485313';

function parseCsvEnv(raw: string | undefined): string[] {
  if (!raw || typeof raw !== 'string') return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseUmpDebugGeography(raw: string | undefined): 'EEA' | 'NOT_EEA' | 'DISABLED' {
  if (raw === 'EEA' || raw === 'NOT_EEA') return raw;
  return 'DISABLED';
}

const iosTestModeEnabled =
  typeof import.meta !== 'undefined' &&
  (import.meta as any).env?.VITE_IOS_ADMOB_TEST_MODE === 'true';

const iosTestingDevices = parseCsvEnv(
  typeof import.meta !== 'undefined'
    ? (import.meta as any).env?.VITE_IOS_ADMOB_TEST_DEVICES
    : undefined
);

const iosUmpDebugGeo = parseUmpDebugGeography(
  typeof import.meta !== 'undefined'
    ? (import.meta as any).env?.VITE_IOS_UMP_DEBUG_GEOGRAPHY
    : undefined
);

export const ADMOB_CONFIG: AdMobConfig = {
  // Android 正式發布模式（維持原狀）
  isTesting: false,

  rewardAmount: 1,
  dailyLimit: 5,

  // Android 平台設定 (Google Play — 不可修改)
  android: {
    // 您的 Android AdMob 應用程式 ID (已關聯 Google Play: com.elemall.snakegame)
    appId: 'ca-app-pub-8064779527945455~6487715743',

    // 您的 Android 獎勵廣告單元 ID
    rewardedAdUnitId: 'ca-app-pub-8064779527945455/9062742346',
  },

  // iOS 平台設定 (Apple App Store)
  ios: {
    // 正式 iOS AdMob 應用程式 ID
    appId: 'ca-app-pub-8064779527945455~8180283397',

    // 正式 iOS 獎勵廣告單元 ID
    rewardedAdUnitId: 'ca-app-pub-8064779527945455/4672283222',

    // Google 官方 iOS Rewarded 測試廣告單元 ID
    testRewardedAdUnitId: GOOGLE_IOS_TEST_REWARDED_AD_UNIT_ID,

    // 正式 Release Build 預設 false；僅於明確設定 VITE_IOS_ADMOB_TEST_MODE=true 時切為測試廣告
    isTesting: iosTestModeEnabled,

    testingDevices: iosTestingDevices,
    umpDebugGeography: iosTestModeEnabled ? iosUmpDebugGeo : 'DISABLED',
  },
};
