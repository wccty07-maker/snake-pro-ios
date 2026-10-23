/**
 * Google AdMob 雙平台廣告設定檔
 * 
 * 官方規定：在開發與測試階段，必須使用 Google 官方提供的測試廣告 ID（Test Ad Unit IDs），
 * 否則在真機測試時若頻繁觀看或點擊自己的真實廣告，會被 Google 判定為無效流量而導致 AdMob 帳號受限或封號！
 * 
 * 當您準備正式打包發布到 Google Play 或 App Store 時，將 isTesting 改為 false，
 * 並填入您剛才在 AdMob 後台申請的正式 ID 即可。
 */

export interface AdMobPlatformConfig {
  appId: string;
  rewardedAdUnitId: string;
}

export interface AdMobConfig {
  // 是否處於測試模式（預設 true，使用 Google 官方測試廣告防封號；上架前設為 false）
  isTesting: boolean;
  
  // 獎勵設定
  rewardAmount: number; // 每次看完獎勵愛心數量 (1 顆)
  dailyLimit: number;    // 每日觀看上限次數 (5 次)

  // 雙平台廣告單元設定
  android: AdMobPlatformConfig;
  ios: AdMobPlatformConfig;
}

export const ADMOB_CONFIG: AdMobConfig = {
  // 開發測試階段保持 true；上架時改為 false
  isTesting: true,

  rewardAmount: 1,
  dailyLimit: 5,

  // Android 平台設定 (Google Play)
  android: {
    // 您的 Android AdMob 應用程式 ID (格式：ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy)
    appId: 'ca-app-pub-8064779527945455~9739767918',

    // 您的 Android 獎勵廣告單元 ID (格式：ca-app-pub-xxxxxxxxxxxxxxxx/zzzzzzzzzz)
    rewardedAdUnitId: 'ca-app-pub-8064779527945455/8964993864',
  },

  // iOS 平台設定 (Apple App Store)
  ios: {
    // 您的 iOS AdMob 應用程式 ID (格式：ca-app-pub-xxxxxxxxxxxxxxxx~aaaaaaaaaa)
    appId: 'ca-app-pub-8064779527945455~8180283397',

    // 您的 iOS 獎勵廣告單元 ID (格式：ca-app-pub-xxxxxxxxxxxxxxxx/bbbbbbbbbb)
    rewardedAdUnitId: 'ca-app-pub-8064779527945455/4672283222',
  },
};
