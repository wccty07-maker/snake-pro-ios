/**
 * 雙平台應用程式內購 (Mobile IAP) 設定檔
 * 同時支援 Apple App Store (StoreKit) 與 Google Play (Google Play Billing)
 * 符合 Apple Guideline 3.1.1 及 Google Play 政策規範
 */

export interface MobileIAPProduct {
  id: string; // 應用內內部 ID
  appleProductId: string; // App Store Connect 登記的 Product ID
  googleProductId: string; // Google Play Console 登記的 Product ID
  type: 'consumable' | 'non_consumable';
  category: 'HEARTS' | 'COINS';
  amount: number;
  bonusAmount?: number;
  priceUSD: number;
  priceTag: string;
  nameZhHK: string;
  nameZhCN: string;
  nameEn: string;
  nameJa: string;
  descriptionZhHK: string;
}

// 向後相容別名
export type AppleIAPProduct = MobileIAPProduct;

export const MOBILE_IAP_CONFIG = {
  // 雙平台統一 Package Name / Bundle Identifier (正式註冊)
  bundleId: 'elemall.snakegame.1',
  packageName: 'elemall.snakegame.1',
  // 是否處於測試 / 沙盒模式
  isSandbox: true,
  // 隱私權政策與服務條款 (Apple 與 Google Play 雙平台審查硬性必備)
  privacyPolicyUrl: 'https://jolly-sundae-9ed76d.netlify.app',
  termsOfUseUrl: 'https://cerulean-llama-27f5a0.netlify.app',
};

// 向後相容別名
export const APPLE_IAP_CONFIG = MOBILE_IAP_CONFIG;

// 愛心商品 (消耗型 Consumables - 雙平台共用同一套 Product ID 規範)
export const APPLE_HEARTS_PRODUCTS: MobileIAPProduct[] = [
  {
    id: 'heart_tier_1',
    appleProductId: 'com.elemall.snakegame.hearts10',
    googleProductId: 'com.elemall.snakegame.hearts10',
    type: 'consumable',
    category: 'HEARTS',
    amount: 10,
    priceUSD: 1.00,
    priceTag: '$1.00 USD',
    nameZhHK: '基礎愛心袋 (10 顆心)',
    nameZhCN: '基础爱心袋 (10 颗心)',
    nameEn: 'Starter Hearts Pouch (10 Hearts)',
    nameJa: 'ハートスターターパック (10個)',
    descriptionZhHK: '立即補充 10 顆愛心體力，持續冒險！',
  },
  {
    id: 'heart_tier_2',
    appleProductId: 'com.elemall.snakegame.hearts32',
    googleProductId: 'com.elemall.snakegame.hearts32',
    type: 'consumable',
    category: 'HEARTS',
    amount: 30,
    bonusAmount: 2,
    priceUSD: 2.99,
    priceTag: '$2.99 USD',
    nameZhHK: '人氣愛心盒 (30+2 顆心)',
    nameZhCN: '人气爱心盒 (30+2 颗心)',
    nameEn: 'Popular Hearts Box (30+2 Hearts)',
    nameJa: '人気ハートボックス (30+2個)',
    descriptionZhHK: '熱銷推薦！額外贈送 2 顆心！',
  },
  {
    id: 'heart_tier_3',
    appleProductId: 'com.elemall.snakegame.hearts75',
    googleProductId: 'com.elemall.snakegame.hearts75',
    type: 'consumable',
    category: 'HEARTS',
    amount: 60,
    bonusAmount: 15,
    priceUSD: 5.99,
    priceTag: '$5.99 USD',
    nameZhHK: '超狂愛心箱 (60+15 顆心)',
    nameZhCN: '超值爱心箱 (60+15 颗心)',
    nameEn: 'Mega Hearts Chest (60+15 Hearts)',
    nameJa: '超得ハートチェスト (60+15個)',
    descriptionZhHK: '超值爆款！加贈 15 顆心！',
  },
  {
    id: 'heart_tier_4',
    appleProductId: 'com.elemall.snakegame.hearts160',
    googleProductId: 'com.elemall.snakegame.hearts160',
    type: 'consumable',
    category: 'HEARTS',
    amount: 120,
    bonusAmount: 40,
    priceUSD: 11.99,
    priceTag: '$11.99 USD',
    nameZhHK: '皇家至尊寶庫 (120+40 顆心)',
    nameZhCN: '皇家至尊宝库 (120+40 颗心)',
    nameEn: 'Royal Hearts Vault (120+40 Hearts)',
    nameJa: '至高のハート宝庫 (120+40個)',
    descriptionZhHK: '極致大容量！加贈 40 顆心！',
  },
];

// 金幣商品 (消耗型 Consumables - 雙平台共用同一套 Product ID 規範)
export const APPLE_COINS_PRODUCTS: MobileIAPProduct[] = [
  {
    id: 'coin_pack_mini',
    appleProductId: 'com.elemall.snakegame.coins50k',
    googleProductId: 'com.elemall.snakegame.coins50k',
    type: 'consumable',
    category: 'COINS',
    amount: 50000,
    priceUSD: 1.00,
    priceTag: '$1.00 USD',
    nameZhHK: '金幣小錢包 (50,000 金幣)',
    nameZhCN: '金币小钱包 (50,000 金币)',
    nameEn: 'Pouch of Coins (50,000 Coins)',
    nameJa: 'コインミニポーチ (50,000コイン)',
    descriptionZhHK: '換取心儀造型與競技場的必備金幣包！',
  },
  {
    id: 'coin_pack_medium',
    appleProductId: 'com.elemall.snakegame.coins180k',
    googleProductId: 'com.elemall.snakegame.coins180k',
    type: 'consumable',
    category: 'COINS',
    amount: 160000,
    bonusAmount: 20000,
    priceUSD: 2.99,
    priceTag: '$2.99 USD',
    nameZhHK: '豐盛金幣箱 (180,000 金幣)',
    nameZhCN: '丰盛金币箱 (180,000 金币)',
    nameEn: 'Chest of Coins (180,000 Coins)',
    nameJa: 'コイン宝箱 (180,000コイン)',
    descriptionZhHK: '熱銷熱賣！贈送 20,000 金幣！',
  },
  {
    id: 'coin_pack_large',
    appleProductId: 'com.elemall.snakegame.coins400k',
    googleProductId: 'com.elemall.snakegame.coins400k',
    type: 'consumable',
    category: 'COINS',
    amount: 350000,
    bonusAmount: 50000,
    priceUSD: 5.99,
    priceTag: '$5.99 USD',
    nameZhHK: '巨額金幣寶庫 (400,000 金幣)',
    nameZhCN: '巨额金币宝库 (400,000 金币)',
    nameEn: 'Vault of Coins (400,000 Coins)',
    nameJa: '大量コイン金庫 (400,000コイン)',
    descriptionZhHK: '超值爆款！贈送 50,000 金幣！',
  },
  {
    id: 'coin_pack_vault',
    appleProductId: 'com.elemall.snakegame.coins1m',
    googleProductId: 'com.elemall.snakegame.coins1m',
    type: 'consumable',
    category: 'COINS',
    amount: 800000,
    bonusAmount: 200000,
    priceUSD: 11.99,
    priceTag: '$11.99 USD',
    nameZhHK: '皇家至尊金庫 (1,000,000 金幣)',
    nameZhCN: '皇家至尊金库 (1,000,000 金币)',
    nameEn: 'Royal Treasury (1,000,000 Coins)',
    nameJa: 'ロイヤルコイン金庫 (1,000,000コイン)',
    descriptionZhHK: '土豪專享！贈送 200,000 金幣！',
  },
];
