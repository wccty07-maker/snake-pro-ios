/**
 * Automated Verification Suite for Snake Pro — iOS Production IAP & AdMob Integration
 *
 * Exercises the ACTUAL production modules through a realistic Capacitor native bridge mock:
 * - src/config/iapConfig.ts
 * - src/services/iapLedger.ts
 * - src/services/iapService.ts
 * - src/config/admobConfig.ts
 * - src/services/admobService.ts
 * - src/utils/hearts.ts
 * - dist/assets/*.js (production Release bundle audit)
 * - ios/App/CapApp-SPM/Package.swift, ios/App/App/capacitor.config.json, Info.plist, PrivacyInfo.xcprivacy
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// ---------------------------------------------------------------------------
// 1. Setup Browser + Capacitor Native Bridge Shims BEFORE importing modules
// ---------------------------------------------------------------------------
class MemoryStorage {
  private store = new Map<string, string>();
  public failNextSetItem = false;
  public failKeyOnce: string | null = null;

  get length(): number {
    return this.store.size;
  }
  clear(): void {
    this.store.clear();
  }
  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  setItem(key: string, value: string): void {
    if (this.failNextSetItem) {
      this.failNextSetItem = false;
      throw new Error('QuotaExceededError: simulated disk full');
    }
    if (this.failKeyOnce && this.failKeyOnce === key) {
      this.failKeyOnce = null;
      throw new Error(`QuotaExceededError: simulated failure for key ${key}`);
    }
    this.store.set(key, String(value));
  }
}

const memStorage = new MemoryStorage();
(globalThis as any).localStorage = memStorage;

let mockPlatform: 'ios' | 'android' | 'web' = 'ios';
let mockNative = true;
const mockAvailablePlugins = new Set<string>(['NativePurchases', 'AdMob']);

const nativeHandlers: Record<string, Record<string, (opts?: any) => Promise<any>>> = {
  NativePurchases: {},
  AdMob: {},
};

const eventListeners: Record<string, Record<string, Set<(arg?: any) => void>>> = {
  NativePurchases: {},
  AdMob: {},
};
let totalRemovedListeners = 0;

function emitNativeEvent(pluginName: string, eventName: string, payload?: any) {
  const set = eventListeners[pluginName]?.[eventName];
  if (!set) return;
  for (const fn of Array.from(set)) {
    fn(payload);
  }
}

function clearEventListeners() {
  eventListeners.NativePurchases = {};
  eventListeners.AdMob = {};
  totalRemovedListeners = 0;
}

const nativePurchasesMethods = [
  'isBillingSupported',
  'configure',
  'getProducts',
  'getProduct',
  'purchaseProduct',
  'restorePurchases',
  'getPurchases',
  'getUnfinishedTransactions',
  'finishTransaction',
  'addListener',
  'removeAllListeners',
];

const admobMethods = [
  'initialize',
  'requestConsentInfo',
  'showConsentForm',
  'showPrivacyOptionsForm',
  'trackingAuthorizationStatus',
  'prepareRewardVideoAd',
  'showRewardVideoAd',
  'addListener',
  'removeAllListeners',
];

const buildMethodHeaders = (methods: string[]) => [
  ...methods.map((name) => ({ name, rtype: 'promise' })),
  { name: 'addListener', rtype: 'callback' },
  { name: 'removeListener', rtype: 'callback' },
];

const allPluginHeaders = [
  {
    name: 'NativePurchases',
    methods: buildMethodHeaders(nativePurchasesMethods.filter((m) => m !== 'addListener')),
  },
  {
    name: 'AdMob',
    methods: buildMethodHeaders(admobMethods.filter((m) => m !== 'addListener')),
  },
];

let nextCallbackId = 1;
const mockWindow: any = {
  console,
  CapacitorCustomPlatform: { name: 'ios' },
  Capacitor: {
    PluginHeaders: [...allPluginHeaders],
    nativePromise: async (pluginName: string, methodName: string, options?: any) => {
      const handler = nativeHandlers[pluginName]?.[methodName];
      if (!handler) {
        throw new Error(`Mock handler missing: ${pluginName}.${methodName}`);
      }
      return handler(options);
    },
    nativeCallback: (pluginName: string, methodName: string, options: any, cb: (arg?: any) => void) => {
      const eventName = options?.eventName;
      if (methodName === 'addListener' && eventName && typeof cb === 'function') {
        eventListeners[pluginName] = eventListeners[pluginName] || {};
        eventListeners[pluginName][eventName] = eventListeners[pluginName][eventName] || new Set();
        eventListeners[pluginName][eventName].add(cb);
        return String(nextCallbackId++);
      }
      if (methodName === 'removeListener' && eventName && typeof cb === 'function') {
        totalRemovedListeners++;
        eventListeners[pluginName]?.[eventName]?.delete(cb);
        return undefined;
      }
      return undefined;
    },
  },
};

(globalThis as any).window = mockWindow;
(globalThis as any).CapacitorCustomPlatform = mockWindow.CapacitorCustomPlatform;
(globalThis as any).Capacitor = mockWindow.Capacitor;

function setMockEnv(platform: 'ios' | 'android' | 'web', plugins: string[] = ['NativePurchases', 'AdMob']) {
  mockPlatform = platform;
  mockNative = platform !== 'web';
  mockWindow.CapacitorCustomPlatform.name = platform;
  mockAvailablePlugins.clear();
  for (const p of plugins) mockAvailablePlugins.add(p);
  mockWindow.Capacitor.PluginHeaders = mockNative
    ? allPluginHeaders.filter((h) => mockAvailablePlugins.has(h.name))
    : [];
}

function makeFakeJWS(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'ES256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.mock_storekit2_signature`;
}

// ---------------------------------------------------------------------------
// 2. Test Runner
// ---------------------------------------------------------------------------
interface TestCaseResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestCaseResult[] = [];

async function runTest(name: string, fn: () => Promise<void> | void): Promise<void> {
  try {
    await fn();
    results.push({ name, passed: true });
    console.log(`  [PASS] ${name}`);
  } catch (err: any) {
    const message = err?.stack || err?.message || String(err);
    results.push({ name, passed: false, error: message });
    console.error(`  [FAIL] ${name}\n    ${message}`);
  }
}

async function main() {
  // Dynamically import modules AFTER window.Capacitor shim is in place
  const { Capacitor } = await import('@capacitor/core');
  (Capacitor as any).isPluginAvailable = (name: string) => mockNative && mockAvailablePlugins.has(name);

  const {
    ALL_APPLE_IAP_PRODUCTS,
    ALL_APPLE_PRODUCT_IDS,
    APPLE_HEARTS_PRODUCTS,
    APPLE_COINS_PRODUCTS,
    getProductTotalGrant,
  } = await import('../src/config/iapConfig');
  const { ADMOB_CONFIG } = await import('../src/config/admobConfig');
  const {
    commitConsumableGrantAtomically,
    createIOSAuthoritativeProfileStore,
    getProfileRevision,
    getMergedLedger,
    isTransactionAlreadyGranted,
    saveProfileSafelyForIOS,
    buildResetPlayerProfile,
    loadBackupLedger,
    STORAGE_PROFILE_KEY,
    STORAGE_IAP_LEDGER_KEY,
  } = await import('../src/services/iapLedger');
  const { iapService, decodeStoreKitJWSPayload } = await import('../src/services/iapService');
  const { admobService } = await import('../src/services/admobService');
  const { AdmobConsentStatus, RewardAdPluginEvents } = await import('@capacitor-community/admob');
  const { calculateHearts } = await import('../src/utils/hearts');
  const { createDefaultPlayerProfile } = await import('../src/utils/gameData');

  function resetServiceSingletons() {
    memStorage.clear();
    memStorage.failNextSetItem = false;
    memStorage.failKeyOnce = null;
    clearEventListeners();
    nativeHandlers.NativePurchases = {};
    nativeHandlers.AdMob = {};

    const iapAny = iapService as any;
    iapAny.isInitialized = false;
    iapAny.iosListenersAttached = false;
    iapAny.iosUpdateListener = null;
    iapAny.iosVerificationFailedListener = null;
    iapAny.iosCatalogState = { status: 'idle', products: {} };
    iapAny.iosCatalogInFlight = null;
    iapAny.activeIOSPurchase = null;
    iapAny.iosPurchaseUiTimeoutMs = 180000;
    iapAny.iosRecoveryInFlight = null;
    iapAny.inFlightTxPromises.clear();
    iapAny.unverifiedDiagnostics.clear();
    iapAny.fulfillmentHandler = null;
    iapAny.recoveryListeners.clear();

    const adAny = admobService as any;
    adAny.isInitialized = false;
    adAny.isAdLoading = false;
    adAny.isAdPrepared = false;
    adAny.prepareInFlight = null;
    adAny.lastLoadFailureReason = null;
    adAny.iosConsentState = {
      checked: false,
      canRequestAds: false,
      privacyOptionsRequired: false,
      status: AdmobConsentStatus.UNKNOWN,
    };
    adAny.iosConsentInFlight = null;
  }

  console.log('\n=== Snake Pro iOS IAP & AdMob Automated Verification Suite ===\n');

  // T1: 8 exact Apple Consumable Product IDs & Grant Quantities
  await runTest('T1: All 8 Apple Consumable Product IDs & exact grant amounts match App Store Connect', () => {
    const expected: Record<string, number> = {
      'com.elemall.snakegame.hearts10': 10,
      'com.elemall.snakegame.hearts32': 32,
      'com.elemall.snakegame.hearts75': 75,
      'com.elemall.snakegame.hearts160': 160,
      'com.elemall.snakegame.coins50k': 50000,
      'com.elemall.snakegame.coins180k': 180000,
      'com.elemall.snakegame.coins400k': 400000,
      'com.elemall.snakegame.coins1m': 1000000,
    };

    assert.equal(ALL_APPLE_IAP_PRODUCTS.length, 8);
    assert.equal(ALL_APPLE_PRODUCT_IDS.length, 8);
    assert.equal(APPLE_HEARTS_PRODUCTS.length, 4);
    assert.equal(APPLE_COINS_PRODUCTS.length, 4);

    for (const prod of ALL_APPLE_IAP_PRODUCTS) {
      assert.ok(prod.appleProductId in expected, `Unexpected appleProductId ${prod.appleProductId}`);
      assert.equal(getProductTotalGrant(prod), expected[prod.appleProductId]);
    }
  });

  // T2: Query all 8 StoreKit products & display GBP / USD / HKD localized priceString verbatim
  await runTest('T2: StoreKit product query returns all 8 items with GBP / USD / HKD localized prices verbatim', async () => {
    const storefronts: Array<{ currency: string; prices: string[] }> = [
      { currency: 'GBP', prices: ['£0.99', '£2.99', '£5.99', '£11.99', '£0.99', '£2.99', '£5.99', '£11.99'] },
      { currency: 'USD', prices: ['$0.99', '$2.99', '$5.99', '$11.99', '$0.99', '$2.99', '$5.99', '$11.99'] },
      { currency: 'HKD', prices: ['HK$8.00', 'HK$23.00', 'HK$48.00', 'HK$88.00', 'HK$8.00', 'HK$23.00', 'HK$48.00', 'HK$88.00'] },
    ];

    for (const sf of storefronts) {
      resetServiceSingletons();
      setMockEnv('ios');

      nativeHandlers.NativePurchases = {
        isBillingSupported: async () => ({ isBillingSupported: true }),
        configure: async () => {},
        getProducts: async ({ productIdentifiers }: { productIdentifiers: string[] }) => {
          assert.equal(productIdentifiers.length, 8);
          return {
            products: productIdentifiers.map((id, idx) => ({
              identifier: id,
              title: id,
              description: id,
              price: idx + 1,
              priceString: sf.prices[idx],
              currencyCode: sf.currency,
              currencySymbol: sf.currency,
              isFamilyShareable: false,
            })),
          };
        },
      };

      const catalog = await iapService.loadIOSProducts(true);
      assert.equal(catalog.status, 'ready');
      assert.equal(Object.keys(catalog.products).length, 8);
      ALL_APPLE_PRODUCT_IDS.forEach((id, idx) => {
        assert.equal(catalog.products[id].priceString, sf.prices[idx]);
        assert.equal(catalog.products[id].currencyCode, sf.currency);
      });
    }
  });

  // T3: Purchase all 8 Apple products -> verified grant amounts + finishTransaction AFTER persist
  await runTest('T3: All 8 Apple products grant exact amounts & finishTransaction executes ONLY after atomic persist', async () => {
    resetServiceSingletons();
    setMockEnv('ios');

    let profile = {
      ...createDefaultPlayerProfile('zh-HK'),
      hearts: 5,
      maxHearts: 5,
      coins: 100,
    };
    memStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(profile));

    const finishLog: string[] = [];
    let persistObservedBeforeFinish = true;

    iapService.registerFulfillmentHandler((entry) => {
      const res = commitConsumableGrantAtomically(profile, entry);
      if (res.status === 'GRANTED' && res.nextProfile) {
        profile = res.nextProfile;
      }
      return { status: res.status, error: res.error };
    });

    nativeHandlers.NativePurchases = {
      isBillingSupported: async () => ({ isBillingSupported: true }),
      configure: async (opts: any) => {
        assert.equal(opts.autoFinishTransactions, false);
      },
      getProducts: async ({ productIdentifiers }: { productIdentifiers: string[] }) => ({
        products: productIdentifiers.map((id) => ({
          identifier: id,
          title: id,
          description: id,
          price: 1,
          priceString: 'HK$8.00',
          currencyCode: 'HKD',
          currencySymbol: 'HK$',
          isFamilyShareable: false,
        })),
      }),
      purchaseProduct: async ({ productIdentifier, autoAcknowledgePurchases }: any) => {
        assert.equal(autoAcknowledgePurchases, false);
        const txId = String(1000000 + finishLog.length + 1);
        return {
          transactionId: txId,
          productIdentifier,
          quantity: 1,
          jwsRepresentation: makeFakeJWS({
            transactionId: txId,
            productId: productIdentifier,
            quantity: 1,
          }),
        };
      },
      finishTransaction: async ({ transactionId }: { transactionId: string }) => {
        const persistedLedger = JSON.parse(memStorage.getItem(STORAGE_IAP_LEDGER_KEY) || '{}');
        if (!persistedLedger[transactionId]) {
          persistObservedBeforeFinish = false;
        }
        finishLog.push(transactionId);
      },
    };

    await iapService.loadIOSProducts(true);

    for (const prod of ALL_APPLE_IAP_PRODUCTS) {
      const res = await iapService.purchaseProduct(prod.appleProductId, 'en');
      assert.equal(res.success, true, `Expected success for ${prod.appleProductId}: ${res.error}`);
      assert.equal(res.status, 'verified');
      assert.equal(res.fulfilledAtomically, true);
      assert.equal(res.grantedAmount, getProductTotalGrant(prod));
    }

    assert.equal(persistObservedBeforeFinish, true);
    assert.equal(finishLog.length, 8);
    assert.equal(profile.hearts, 5 + 10 + 32 + 75 + 160);
    assert.equal(profile.coins, 100 + 50000 + 180000 + 400000 + 1000000);
  });

  // T4-T6, T9-T10: Cancelled, Failed, Pending, Unverified, Mismatch, Missing Proof, Network Error, Missing Plugin
  await runTest('T4-T6 & T9-T10: Cancelled, Failed, Pending, Unverified, Product Mismatch, No-Proof, Network Error, & Missing Plugin never grant rewards', async () => {
    resetServiceSingletons();
    setMockEnv('ios');

    let profile = { ...createDefaultPlayerProfile('en'), hearts: 3, coins: 0 };
    memStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(profile));
    const finishedIds: string[] = [];

    iapService.registerFulfillmentHandler((entry) => {
      const res = commitConsumableGrantAtomically(profile, entry);
      if (res.status === 'GRANTED' && res.nextProfile) profile = res.nextProfile;
      return { status: res.status, error: res.error };
    });

    const baseHandlers = {
      isBillingSupported: async () => ({ isBillingSupported: true }),
      configure: async () => {},
      getProducts: async ({ productIdentifiers }: { productIdentifiers: string[] }) => ({
        products: productIdentifiers.map((id) => ({
          identifier: id,
          title: id,
          description: id,
          price: 1,
          priceString: '$0.99',
          currencyCode: 'USD',
          currencySymbol: '$',
          isFamilyShareable: false,
        })),
      }),
      finishTransaction: async ({ transactionId }: any) => {
        finishedIds.push(transactionId);
      },
    };

    // (a) Cancelled
    nativeHandlers.NativePurchases = {
      ...baseHandlers,
      purchaseProduct: async () => {
        throw new Error('User cancelled the purchase');
      },
    };
    await iapService.loadIOSProducts(true);
    const cancelRes = await iapService.purchaseProduct('com.elemall.snakegame.hearts10', 'en');
    assert.equal(cancelRes.success, false);
    assert.equal(cancelRes.cancelled, true);
    assert.equal(profile.hearts, 3);

    // (b) Pending / Deferred
    nativeHandlers.NativePurchases = {
      ...baseHandlers,
      purchaseProduct: async () => {
        throw new Error('Purchase is pending external approval');
      },
    };
    const pendingRes = await iapService.purchaseProduct('com.elemall.snakegame.hearts10', 'en');
    assert.equal(pendingRes.success, false);
    assert.equal(pendingRes.pending, true);
    assert.equal(pendingRes.status, 'pending');
    assert.equal(profile.hearts, 3);

    // (c) Unverified
    nativeHandlers.NativePurchases = {
      ...baseHandlers,
      purchaseProduct: async () => ({
        transactionId: '9990001',
        productIdentifier: 'com.elemall.snakegame.hearts10',
        verificationError: 'Invalid JWS signature',
      }),
    };
    const unverifiedRes = await iapService.purchaseProduct('com.elemall.snakegame.hearts10', 'en');
    assert.equal(unverifiedRes.success, false);
    assert.equal(unverifiedRes.status, 'unverified');
    assert.equal(profile.hearts, 3);

    // (d) Product ID mismatch in JWS
    nativeHandlers.NativePurchases = {
      ...baseHandlers,
      purchaseProduct: async () => ({
        transactionId: '9990002',
        productIdentifier: 'com.elemall.snakegame.hearts10',
        jwsRepresentation: makeFakeJWS({
          transactionId: '9990002',
          productId: 'com.elemall.snakegame.hearts160',
        }),
      }),
    };
    const mismatchRes = await iapService.purchaseProduct('com.elemall.snakegame.hearts10', 'en');
    assert.equal(mismatchRes.success, false);
    assert.equal(mismatchRes.status, 'unverified');
    assert.equal(profile.hearts, 3);

    // (e) TransactionId alone without JWS/receipt
    nativeHandlers.NativePurchases = {
      ...baseHandlers,
      purchaseProduct: async () => ({
        transactionId: '9990003',
        productIdentifier: 'com.elemall.snakegame.hearts10',
      }),
    };
    const noProofRes = await iapService.purchaseProduct('com.elemall.snakegame.hearts10', 'en');
    assert.equal(noProofRes.success, false);
    assert.equal(noProofRes.status, 'unverified');
    assert.equal(profile.hearts, 3);

    // (f) Network interruption
    nativeHandlers.NativePurchases = {
      ...baseHandlers,
      purchaseProduct: async () => {
        throw new Error('NSURLErrorNotConnectedToInternet: network offline');
      },
    };
    const netRes = await iapService.purchaseProduct('com.elemall.snakegame.hearts10', 'en');
    assert.equal(netRes.success, false);
    assert.equal(netRes.status, 'failed');
    assert.equal(profile.hearts, 3);

    // V47.1: Unverified transactions MUST NOT be blindly finished via allowUnverified:true;
    // they are recorded in unverifiedDiagnostics and never granted.
    assert.deepEqual(finishedIds, []);
    const diagBeforeReset = iapService.getUnverifiedTransactionDiagnostics();
    assert.ok(diagBeforeReset.some((d) => d.transactionId === '9990001'));

    // (g) Native IAP plugin missing on iOS -> unavailable, NEVER simulates
    resetServiceSingletons();
    setMockEnv('ios', []);
    const noPluginCatalog = await iapService.loadIOSProducts(true);
    assert.equal(noPluginCatalog.status, 'unavailable');
    const noPluginPurchase = await iapService.purchaseProduct('com.elemall.snakegame.hearts10', 'en');
    assert.equal(noPluginPurchase.success, false);
    assert.equal(noPluginPurchase.status, 'unavailable');
    assert.equal(profile.hearts, 3);
  });

  // T7 & T8: Crash Recovery + Duplicate Transaction ID + Persist Failure Guard + Unverified Classification
  await runTest('T7 & T8: Crash recovery fulfills verified tx once, NEVER auto-finishes unverified with allowUnverified:true, finishes verified revocations cleanly, and withholds finish on persist failure', async () => {
    resetServiceSingletons();
    setMockEnv('ios');

    let profile = { ...createDefaultPlayerProfile('en'), hearts: 2, coins: 0 };
    memStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(profile));
    const finishedCalls: Array<{ id: string; allowUnverified?: boolean }> = [];
    const recoveredEvents: any[] = [];

    iapService.registerFulfillmentHandler((entry) => {
      const res = commitConsumableGrantAtomically(profile, entry);
      if ((res.status === 'GRANTED' || res.status === 'DUPLICATE') && res.nextProfile) {
        profile = res.nextProfile;
      }
      return { status: res.status, error: res.error, backupSyncFailed: res.backupSyncFailed };
    });
    iapService.onIOSRecoveryGrant((e) => recoveredEvents.push(e));

    const unfinishedVerifiedTx = {
      transactionId: '555001',
      productIdentifier: 'com.elemall.snakegame.coins180k',
      quantity: 1,
      jwsRepresentation: makeFakeJWS({
        transactionId: '555001',
        productId: 'com.elemall.snakegame.coins180k',
        quantity: 1,
      }),
    };
    const unfinishedUnverifiedTx = {
      transactionId: '555002',
      productIdentifier: 'com.elemall.snakegame.hearts160',
      verificationError: 'Invalid signature / tampered receipt',
    };
    const unfinishedRecoverableTx = {
      transactionId: '555003',
      productIdentifier: 'com.elemall.snakegame.hearts10',
      verificationError: 'Temporary network verification error',
    };
    const verifiedRevokedTx = {
      transactionId: '555004',
      productIdentifier: 'com.elemall.snakegame.hearts32',
      revocationDate: '2026-11-24T00:00:00Z',
      jwsRepresentation: makeFakeJWS({
        transactionId: '555004',
        productId: 'com.elemall.snakegame.hearts32',
        revocationDate: Date.now(),
      }),
    };

    nativeHandlers.NativePurchases = {
      isBillingSupported: async () => ({ isBillingSupported: true }),
      configure: async () => {},
      getUnfinishedTransactions: async () => ({
        transactions: [
          unfinishedVerifiedTx,
          unfinishedUnverifiedTx,
          unfinishedRecoverableTx,
          verifiedRevokedTx,
        ],
      }),
      finishTransaction: async ({ transactionId, allowUnverified }: any) => {
        finishedCalls.push({ id: transactionId, allowUnverified });
      },
    };

    // Simulate storage failure -> MUST NOT finish verified tx 555001; MUST NOT call allowUnverified:true on 555002/555003;
    // Verified revoked tx 555004 IS finished cleanly WITHOUT allowUnverified:true and grants 0 items.
    memStorage.failNextSetItem = true;
    const countOnFail = await iapService.recoverUnfinishedIOSTransactions('en');
    assert.equal(countOnFail, 0);
    assert.equal(profile.coins, 0);
    assert.equal(profile.hearts, 2);
    assert.equal(finishedCalls.some((c) => c.id === '555001'), false);
    assert.equal(finishedCalls.some((c) => c.id === '555002'), false);
    assert.equal(finishedCalls.some((c) => c.id === '555003'), false);
    assert.equal(finishedCalls.some((c) => c.allowUnverified === true), false);
    assert.equal(
      finishedCalls.some((c) => c.id === '555004' && c.allowUnverified !== true),
      true
    );

    // Confirm unverified diagnostics classified properly and NEVER entered fulfilled ledger
    const diags = iapService.getUnverifiedTransactionDiagnostics();
    const dInvalid = diags.find((d) => d.transactionId === '555002');
    const dRecov = diags.find((d) => d.transactionId === '555003');
    assert.equal(dInvalid?.classification, 'PERMANENTLY_INVALID');
    assert.equal(dRecov?.classification, 'POTENTIALLY_RECOVERABLE');
    assert.equal(isTransactionAlreadyGranted('555002', profile), false);
    assert.equal(isTransactionAlreadyGranted('555003', profile), false);

    // Retry when storage healthy -> grants 180,000 coins & finishes 555001
    finishedCalls.length = 0;
    const countOnRetry = await iapService.recoverUnfinishedIOSTransactions('en');
    assert.equal(countOnRetry, 1);
    assert.equal(profile.coins, 180000);
    assert.equal(recoveredEvents.length, 1);
    assert.equal(finishedCalls.some((c) => c.id === '555001'), true);
    assert.equal(isTransactionAlreadyGranted('555001', profile), true);

    // Duplicate delivery of tx 555001 -> NEVER double-grants!
    finishedCalls.length = 0;
    const countOnDuplicate = await iapService.recoverUnfinishedIOSTransactions('en');
    assert.equal(countOnDuplicate, 0);
    assert.equal(profile.coins, 180000);
    assert.equal(finishedCalls.some((c) => c.id === '555001'), true);
  });

  // T11-T16: iOS AdMob UMP consent gate, ATT declined (npa: true), reward once-only, duplicate callback, early dismiss, No Fill, missing plugin
  await runTest('T11-T16: iOS AdMob UMP consent gate, ATT declined (npa:true), valid reward once-only, duplicate callback, early dismiss, No Fill, missing plugin', async () => {
    // (a) UMP canRequestAds === false blocks ad load & show
    resetServiceSingletons();
    setMockEnv('ios');
    let prepareCalled = false;

    nativeHandlers.AdMob = {
      requestConsentInfo: async () => ({
        status: AdmobConsentStatus.REQUIRED,
        isConsentFormAvailable: true,
        canRequestAds: false,
        privacyOptionsRequirementStatus: 'REQUIRED',
      }),
      showConsentForm: async () => ({
        status: AdmobConsentStatus.REQUIRED,
        isConsentFormAvailable: true,
        canRequestAds: false,
        privacyOptionsRequirementStatus: 'REQUIRED',
      }),
      initialize: async () => {},
      prepareRewardVideoAd: async () => {
        prepareCalled = true;
      },
    };

    const initOk = await admobService.initializeConsentAndAdsForIOS();
    assert.equal(initOk, false);
    assert.equal(prepareCalled, false);
    assert.equal(admobService.isPrivacyOptionsRequired(), true);

    const blockedShow = await admobService.showRewardedAd();
    assert.equal(blockedShow.success, false);
    assert.equal(blockedShow.reason, 'CONSENT_REQUIRED');

    // (b) UMP canRequestAds === true + ATT denied -> npa: true & grants reward ONCE even with duplicate Rewarded callbacks + Dismissed race
    resetServiceSingletons();
    setMockEnv('ios');
    let lastPrepareOptions: any = null;

    nativeHandlers.AdMob = {
      requestConsentInfo: async () => ({
        status: AdmobConsentStatus.OBTAINED,
        isConsentFormAvailable: false,
        canRequestAds: true,
        privacyOptionsRequirementStatus: 'NOT_REQUIRED',
      }),
      trackingAuthorizationStatus: async () => ({ status: 'denied' }),
      initialize: async () => {},
      prepareRewardVideoAd: async (opts: any) => {
        lastPrepareOptions = opts;
      },
      showRewardVideoAd: async () => {
        setTimeout(() => {
          emitNativeEvent('AdMob', RewardAdPluginEvents.Rewarded, { type: 'Heart', amount: 1 });
          emitNativeEvent('AdMob', RewardAdPluginEvents.Rewarded, { type: 'Heart', amount: 1 });
          emitNativeEvent('AdMob', RewardAdPluginEvents.Dismissed);
        }, 20);
        return { type: 'Heart', amount: 1 };
      },
    };

    await admobService.initializeConsentAndAdsForIOS();
    assert.equal(lastPrepareOptions?.adId, 'ca-app-pub-8064779527945455/4672283222');
    assert.equal(lastPrepareOptions?.npa, true);

    const adSuccess = await admobService.showRewardedAd();
    assert.equal(adSuccess.success, true);
    assert.equal(adSuccess.rewardEarned, true);
    assert.equal(adSuccess.reason, 'SUCCESS');
    assert.ok(totalRemovedListeners >= 4, 'All ad listeners must be removed after session');

    // (c) Early dismiss without reward -> USER_DISMISSED, NO reward
    resetServiceSingletons();
    setMockEnv('ios');
    nativeHandlers.AdMob = {
      requestConsentInfo: async () => ({
        status: AdmobConsentStatus.NOT_REQUIRED,
        canRequestAds: true,
        privacyOptionsRequirementStatus: 'NOT_REQUIRED',
      }),
      trackingAuthorizationStatus: async () => ({ status: 'notDetermined' }),
      initialize: async () => {},
      prepareRewardVideoAd: async () => {},
      showRewardVideoAd: async () => {
        setTimeout(() => {
          emitNativeEvent('AdMob', RewardAdPluginEvents.Dismissed);
        }, 15);
        const err: any = new Error('User closed ad early');
        err.code = 'REWARDED_AD_CANCELLED';
        throw err;
      },
    };
    const earlyRes = await admobService.showRewardedAd();
    assert.equal(earlyRes.success, false);
    assert.equal(earlyRes.rewardEarned, false);
    assert.equal(earlyRes.reason, 'USER_DISMISSED');

    // (d) AdMob No Fill -> NO_FILL, NO reward
    resetServiceSingletons();
    setMockEnv('ios');
    nativeHandlers.AdMob = {
      requestConsentInfo: async () => ({
        status: AdmobConsentStatus.NOT_REQUIRED,
        canRequestAds: true,
        privacyOptionsRequirementStatus: 'NOT_REQUIRED',
      }),
      trackingAuthorizationStatus: async () => ({ status: 'notDetermined' }),
      initialize: async () => {},
      prepareRewardVideoAd: async () => {
        throw new Error('Request Error: No ad to show (No fill)');
      },
    };
    const noFillRes = await admobService.showRewardedAd();
    assert.equal(noFillRes.success, false);
    assert.equal(noFillRes.rewardEarned, false);
    assert.equal(noFillRes.reason, 'NO_FILL');

    // (e) Native AdMob plugin missing on iOS -> NO_PLUGIN, never simulates
    resetServiceSingletons();
    setMockEnv('ios', []);
    const noPluginRes = await admobService.showRewardedAd();
    assert.equal(noPluginRes.success, false);
    assert.equal(noPluginRes.rewardEarned, false);
    assert.equal(noPluginRes.reason, 'NO_PLUGIN');
  });

  // T17: Legacy save migration & purchased Hearts never truncated
  await runTest('T17: Legacy save migration & purchased Hearts (> maxHearts) never truncated by calculateHearts()', () => {
    resetServiceSingletons();
    const legacySave = {
      playerName: 'LegacyHero',
      coins: 12345,
      hearts: 25,
      maxHearts: 5,
      lastHeartRefillTimestamp: Date.now() - 3600_000,
      completedLevels: [1, 2, 3],
    };
    memStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(legacySave));

    const merged = getMergedLedger(legacySave as any);
    assert.deepEqual(merged, {});

    const calc = calculateHearts(25, 5, Date.now() - 3600_000, Date.now());
    assert.equal(calc.hearts, 25);
    assert.equal(calc.nextRefillSeconds, 0);
  });

  // T18: Android Regression Check
  await runTest('T18: Android AdMob IDs & Google Play Billing path remain untouched', async () => {
    assert.equal(ADMOB_CONFIG.android.appId, 'ca-app-pub-8064779527945455~6487715743');
    assert.equal(ADMOB_CONFIG.android.rewardedAdUnitId, 'ca-app-pub-8064779527945455/9062742346');
    assert.equal(ADMOB_CONFIG.ios.appId, 'ca-app-pub-8064779527945455~8180283397');
    assert.equal(ADMOB_CONFIG.ios.rewardedAdUnitId, 'ca-app-pub-8064779527945455/4672283222');

    resetServiceSingletons();
    setMockEnv('android');
    let androidAutoFinish: boolean | undefined;
    let androidAutoAck: boolean | undefined;

    nativeHandlers.NativePurchases = {
      isBillingSupported: async () => ({ isBillingSupported: true }),
      configure: async (opts: any) => {
        androidAutoFinish = opts.autoFinishTransactions;
      },
      getProducts: async ({ productIdentifiers }: { productIdentifiers: string[] }) => ({
        products: productIdentifiers.map((id) => ({
          identifier: id,
          title: id,
          description: id,
          price: 1,
          priceString: '$1.00',
          currencyCode: 'USD',
          currencySymbol: '$',
          isFamilyShareable: false,
        })),
      }),
      purchaseProduct: async (opts: any) => {
        androidAutoAck = opts.autoAcknowledgePurchases;
        return { transactionId: 'GPA.1234-5678-9012-34567', productIdentifier: opts.productIdentifier };
      },
    };

    const androidPurchase = await iapService.purchaseProduct('com.elemall.snakegame.hearts10', 'zh-HK');
    assert.equal(androidPurchase.success, true);
    assert.equal(androidPurchase.platform, 'android');
    assert.equal(androidAutoFinish, true);
    assert.equal(androidAutoAck, true);
  });

  // T20: Production Release build audit + iOS SPM/Config/Plist/PrivacyManifest
  await runTest('T20: Production Release build has ZERO simulated ad/payment text & iOS SPM/Config/Plist/PrivacyManifest are valid', () => {
    const distAssetsDir = path.resolve(process.cwd(), 'dist/assets');
    const jsFiles = fs.readdirSync(distAssetsDir).filter((f) => f.endsWith('.js'));
    assert.ok(jsFiles.length > 0, 'dist/assets must contain built JS bundles');

    const bundleContent = jsFiles
      .map((f) => fs.readFileSync(path.join(distAssetsDir, f), 'utf8'))
      .join('\n');

    assert.equal(bundleContent.includes('SNAKE ENERGY REFILL'), false, 'Simulated ad overlay leaked into Release bundle!');
    assert.equal(bundleContent.includes('SIM_WEB_'), false, 'Simulated web transaction ID leaked into Release bundle!');
    assert.equal(bundleContent.includes('DEV_WEB_MOCK_'), false, 'Dev web mock transaction ID leaked into Release bundle!');
    assert.equal(bundleContent.includes('web_dev_tx_'), false, 'Web dev mock transaction ID leaked into Release bundle!');

    const pkgSwift = fs.readFileSync(path.resolve(process.cwd(), 'ios/App/CapApp-SPM/Package.swift'), 'utf8');
    assert.ok(pkgSwift.includes('CapacitorCommunityAdmob'), 'Package.swift missing CapacitorCommunityAdmob');
    assert.ok(pkgSwift.includes('CapgoNativePurchases'), 'Package.swift missing CapgoNativePurchases');

    const iosCapCfg = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'ios/App/App/capacitor.config.json'), 'utf8'));
    assert.equal(iosCapCfg.plugins?.NativePurchases?.autoFinishTransactions, false);
    assert.ok(iosCapCfg.packageClassList.includes('AdMobPlugin'));
    assert.ok(iosCapCfg.packageClassList.includes('NativePurchasesPlugin'));

    const rootCapCfg = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'capacitor.config.json'), 'utf8'));
    assert.equal(rootCapCfg.plugins?.NativePurchases?.autoFinishTransactions, undefined);

    const infoPlist = fs.readFileSync(path.resolve(process.cwd(), 'ios/App/App/Info.plist'), 'utf8');
    assert.ok(infoPlist.includes('ca-app-pub-8064779527945455~8180283397'));
    assert.ok(infoPlist.includes('cstr6suwn9.skadnetwork'));
    assert.equal(infoPlist.includes('NSUserTrackingUsageDescription'), false);

    const privacyManifest = fs.readFileSync(path.resolve(process.cwd(), 'ios/App/App/PrivacyInfo.xcprivacy'), 'utf8');
    assert.ok(privacyManifest.includes('NSPrivacyTracking'));
    assert.ok(privacyManifest.includes('CA92.1'));
  });

  // Utility check
  await runTest('Utility: decodeStoreKitJWSPayload parses StoreKit 2 JWS cleanly and rejects malformed tokens', () => {
    const jws = makeFakeJWS({ transactionId: '12345', productId: 'com.elemall.snakegame.hearts10' });
    const parsed = decodeStoreKitJWSPayload(jws);
    assert.equal(parsed?.transactionId, '12345');
    assert.equal(parsed?.productId, 'com.elemall.snakegame.hearts10');
    assert.equal(decodeStoreKitJWSPayload('not-a-jws'), null);
  });

  // T21: V47.1 Separated 180s UI Timeout vs Native Purchase Lifecycle + Late Success / Failure + Concurrent Duplicate Event
  await runTest('T21: UI timeout stops spinner without cancelling native purchase, blocks overlapping taps, handles late success/failure, and serializes concurrent Transaction.updates', async () => {
    // Part A: UI timeout followed by late native SUCCESS
    resetServiceSingletons();
    setMockEnv('ios');

    let profile = { ...createDefaultPlayerProfile('en'), hearts: 5, coins: 0 };
    memStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(profile));
    const recoveryGrants: any[] = [];
    const finishedIds: string[] = [];

    iapService.registerFulfillmentHandler((entry) => {
      const res = commitConsumableGrantAtomically(profile, entry);
      if ((res.status === 'GRANTED' || res.status === 'DUPLICATE') && res.nextProfile) {
        profile = res.nextProfile;
      }
      return { status: res.status, error: res.error };
    });
    iapService.onIOSRecoveryGrant((e) => recoveryGrants.push(e));

    (iapService as any).iosPurchaseUiTimeoutMs = 50;
    let purchaseCalls = 0;
    let resolveNativePurchase!: (val: any) => void;

    nativeHandlers.NativePurchases = {
      isBillingSupported: async () => ({ isBillingSupported: true }),
      configure: async () => {},
      getProducts: async ({ productIdentifiers }: { productIdentifiers: string[] }) => ({
        products: productIdentifiers.map((id) => ({
          identifier: id,
          title: id,
          description: id,
          price: 0.99,
          priceString: '$0.99',
          currencyCode: 'USD',
          currencySymbol: '$',
          isFamilyShareable: false,
        })),
      }),
      getUnfinishedTransactions: async () => ({ transactions: [] }),
      purchaseProduct: async () => {
        purchaseCalls += 1;
        return await new Promise((resolve) => {
          resolveNativePurchase = resolve;
        });
      },
      finishTransaction: async ({ transactionId }: any) => {
        finishedIds.push(transactionId);
      },
    };

    await iapService.loadIOSProducts(true);

    // 1. Tap Buy -> UI wait times out at 50ms while native Promise is still pending
    const uiRes = await iapService.purchaseProduct('com.elemall.snakegame.hearts10', 'en');
    assert.equal(uiRes.success, false);
    assert.equal(uiRes.pending, true);
    assert.equal(uiRes.status, 'pending');
    assert.equal(
      uiRes.error,
      'Your purchase is still being processed. Please wait while we check its status.'
    );
    assert.equal(profile.hearts, 5, 'Pending/UI-timed-out purchase must NOT pre-grant');

    // 2. Rapid second tap while native purchase is STILL unsettled -> MUST NOT start overlapping native purchase!
    const overlapRes = await iapService.purchaseProduct('com.elemall.snakegame.hearts32', 'en');
    assert.equal(overlapRes.success, false);
    assert.equal(overlapRes.pending, true);
    assert.equal(purchaseCalls, 1, 'Must NOT call NativePurchases.purchaseProduct() twice while unsettled');

    // 3. Native StoreKit purchase settles LATE with a verified transaction -> delivers ONCE & emits recovery grant & unlocks!
    const lateTxId = '880001';
    resolveNativePurchase({
      transactionId: lateTxId,
      productIdentifier: 'com.elemall.snakegame.hearts10',
      quantity: 1,
      jwsRepresentation: makeFakeJWS({
        transactionId: lateTxId,
        productId: 'com.elemall.snakegame.hearts10',
        quantity: 1,
      }),
    });
    // Also fire concurrent Transaction.updates for the SAME txId to verify per-tx serialization!
    emitNativeEvent('NativePurchases', 'transactionUpdated', {
      transactionId: lateTxId,
      productIdentifier: 'com.elemall.snakegame.hearts10',
      quantity: 1,
      jwsRepresentation: makeFakeJWS({
        transactionId: lateTxId,
        productId: 'com.elemall.snakegame.hearts10',
        quantity: 1,
      }),
    });

    await new Promise((r) => setTimeout(r, 30));
    assert.equal(profile.hearts, 15, 'Late success must grant +10 Hearts ONCE ONLY even with concurrent Transaction.updates');
    assert.equal(recoveryGrants.length, 1);
    assert.ok(finishedIds.includes(lateTxId));
    assert.equal((iapService as any).activeIOSPurchase, null, 'Lock must be released after late settlement');

    // Part B: UI timeout followed by late native CANCELLATION/FAILURE -> releases lock without granting
    let rejectNativePurchase!: (err: Error) => void;
    nativeHandlers.NativePurchases.purchaseProduct = async () => {
      purchaseCalls += 1;
      return await new Promise((_, reject) => {
        rejectNativePurchase = reject;
      });
    };

    const uiRes2 = await iapService.purchaseProduct('com.elemall.snakegame.hearts10', 'en');
    assert.equal(uiRes2.pending, true);
    rejectNativePurchase(new Error('User cancelled'));
    await new Promise((r) => setTimeout(r, 30));
    assert.equal(profile.hearts, 15, 'Late failure/cancel must not grant anything');
    assert.equal((iapService as any).activeIOSPurchase, null, 'Lock must be cleanly released on late cancel');

    (iapService as any).iosPurchaseUiTimeoutMs = 180000;
  });

  // T22: V49 Confirmed Bundle ID Consistency, Build >= 253, Exact Copy & ErrorBoundary Audit
  await runTest('T22: Confirmed iOS Bundle ID (elemall.snakegame.1), Build >= 253, exact Ad unavailable copy & ErrorBoundary are consistent', () => {
    const iosCapCfg = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'ios/App/App/capacitor.config.json'), 'utf8'));
    assert.equal(iosCapCfg.appId, 'elemall.snakegame.1', 'ios/App/App/capacitor.config.json appId must be elemall.snakegame.1');

    const rootCapCfg = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'capacitor.config.json'), 'utf8'));
    assert.equal(rootCapCfg.appId, 'com.elemall.snakegame', 'Root capacitor.config.json must stay com.elemall.snakegame for Android');

    const fastfile = fs.readFileSync(path.resolve(process.cwd(), 'ios/App/fastlane/Fastfile'), 'utf8');
    assert.ok(fastfile.includes('bundle_id = "elemall.snakegame.1"'), 'Fastfile must lock bundle_id to elemall.snakegame.1');
    assert.equal(fastfile.includes('IOS_BUNDLE_ID'), false, 'Fastfile must NOT contain IOS_BUNDLE_ID override');
    assert.ok(fastfile.includes('[asc_latest + 1, env_build, 253].max'), 'Fastfile fallback floor must be 253');

    const codemagic = fs.readFileSync(path.resolve(process.cwd(), 'codemagic.yaml'), 'utf8');
    assert.ok(codemagic.includes('RUN_NUM + 252'), 'codemagic.yaml floor must be RUN_NUM + 252 (>= 253)');

    const pbxproj = fs.readFileSync(path.resolve(process.cwd(), 'ios/App/App.xcodeproj/project.pbxproj'), 'utf8');
    assert.ok(pbxproj.includes('PRODUCT_BUNDLE_IDENTIFIER = elemall.snakegame.1;'));
    const buildMatches = Array.from(pbxproj.matchAll(/CURRENT_PROJECT_VERSION = (\d+);/g));
    assert.ok(buildMatches.length >= 2, 'project.pbxproj should define CURRENT_PROJECT_VERSION');
    for (const m of buildMatches) {
      assert.ok(Number(m[1]) >= 253, `Baseline CURRENT_PROJECT_VERSION (${m[1]}) must be >= 253`);
    }

    const heartsModal = fs.readFileSync(path.resolve(process.cwd(), 'src/components/HeartsModal.tsx'), 'utf8');
    assert.ok(
      heartsModal.includes('Ad is currently unavailable. Please try again later.'),
      'HeartsModal must include exact V47 required ad-unavailable English message'
    );

    const mainTsx = fs.readFileSync(path.resolve(process.cwd(), 'src/main.tsx'), 'utf8');
    assert.ok(mainTsx.includes('AppErrorBoundary'), 'src/main.tsx must wrap App in AppErrorBoundary');
    assert.ok(fs.existsSync(path.resolve(process.cwd(), 'src/components/AppErrorBoundary.tsx')));
  });

  // T23: V47.1 Section 1 — Balance Merge Bug Regression (Coins & Hearts)
  await runTest('T23: NO Math.max() balance merge — spending then buying produces exact Coins (100k - 30k + 50k = 120k) & exact Hearts (20 - 5 + 10 = 25)', () => {
    resetServiceSingletons();

    // Coins scenario: stale localStorage snapshot still has old balance 100,000 Coins
    const staleSavedProfile = {
      ...createDefaultPlayerProfile('en'),
      coins: 100000,
      hearts: 20,
      completedLevels: [1, 2, 3, 4, 5],
      unlockedSkins: ['neon_viper', 'golden_dragon'],
      soundEnabled: false,
    };
    memStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(staleSavedProfile));

    // Player normally spends 30,000 Coins (in-memory authoritative profile is now 70,000)
    const afterSpendingCoins = {
      ...staleSavedProfile,
      coins: 70000,
    };

    // Player buys 50,000 Coins
    const coinGrant = commitConsumableGrantAtomically(afterSpendingCoins, {
      transactionId: '770001',
      productId: 'com.elemall.snakegame.coins50k',
      category: 'COINS',
      quantity: 1,
      grantedAmount: 50000,
      grantedAt: Date.now(),
      platform: 'ios',
    });

    assert.equal(coinGrant.status, 'GRANTED');
    assert.equal(coinGrant.nextProfile?.coins, 120000, 'Final Coins MUST be 120,000, NEVER 150,000!');
    // Confirm non-balance fields preserved intact
    assert.deepEqual(coinGrant.nextProfile?.completedLevels, [1, 2, 3, 4, 5]);
    assert.deepEqual(coinGrant.nextProfile?.unlockedSkins, ['neon_viper', 'golden_dragon']);
    assert.equal(coinGrant.nextProfile?.soundEnabled, false);

    // Hearts scenario: stale localStorage still has 20 Hearts; player consumes 5 Hearts -> 15 Hearts; buys 10 Hearts -> MUST be 25 (NOT 30!)
    const afterSpendingHearts = {
      ...coinGrant.nextProfile!,
      hearts: 15,
    };
    const heartGrant = commitConsumableGrantAtomically(afterSpendingHearts, {
      transactionId: '770002',
      productId: 'com.elemall.snakegame.hearts10',
      category: 'HEARTS',
      quantity: 1,
      grantedAmount: 10,
      grantedAt: Date.now(),
      platform: 'ios',
    });

    assert.equal(heartGrant.status, 'GRANTED');
    assert.equal(heartGrant.nextProfile?.hearts, 25, 'Final Hearts MUST be 25, NEVER 30!');
    assert.equal(heartGrant.nextProfile?.coins, 120000);
  });

  // T24: V47.1 Section 2 — Backup-Only Guard, Partial Failure (Profile OK / Backup Fail), Crash Between Writes & Stale Auto-Save Guard
  await runTest('T24: Backup ledger alone never blocks fulfillment, partial backup failure self-heals, crash before finish never double-grants, and stale React auto-save is blocked', () => {
    resetServiceSingletons();

    const baseProfile = {
      ...createDefaultPlayerProfile('en'),
      hearts: 5,
      coins: 1000,
    };
    memStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(baseProfile));

    // (a) Backup-only ledger contains txId 881001 WITHOUT authoritative profile record -> MUST NOT treat as granted!
    memStorage.setItem(
      STORAGE_IAP_LEDGER_KEY,
      JSON.stringify({
        '881001': {
          transactionId: '881001',
          productId: 'com.elemall.snakegame.hearts10',
          category: 'HEARTS',
          grantedAmount: 10,
          grantedAt: Date.now(),
          platform: 'ios',
        },
      })
    );
    assert.equal(
      isTransactionAlreadyGranted('881001', baseProfile),
      false,
      'Backup-only entry without authoritative profile record must NOT be treated as fulfilled proof'
    );

    // (b) Profile write succeeds, backup ledger write throws QuotaExceeded -> authoritative delivery IS verified, backupSyncFailed=true
    memStorage.failKeyOnce = STORAGE_IAP_LEDGER_KEY;
    const grantRes = commitConsumableGrantAtomically(baseProfile, {
      transactionId: '881001',
      productId: 'com.elemall.snakegame.hearts10',
      category: 'HEARTS',
      quantity: 1,
      grantedAmount: 10,
      grantedAt: Date.now(),
      platform: 'ios',
    });
    assert.equal(grantRes.status, 'GRANTED');
    assert.equal(grantRes.backupSyncFailed, true);
    assert.equal(grantRes.nextProfile?.hearts, 15);
    assert.equal(isTransactionAlreadyGranted('881001', grantRes.nextProfile), true);

    // (c) Stale React useEffect snapshot (from BEFORE grantRes) tries to auto-save -> MUST be blocked!
    const staleAutoSave = saveProfileSafelyForIOS(baseProfile);
    assert.equal(staleAutoSave.saved, false);
    assert.equal(staleAutoSave.skippedStaleSnapshot, true);
    const persistedAfterStale = JSON.parse(memStorage.getItem(STORAGE_PROFILE_KEY) || '{}');
    assert.equal(persistedAfterStale.hearts, 15, 'Stale auto-save must NEVER overwrite committed IAP hearts');
    assert.ok(persistedAfterStale.iapTransactionLedger?.['881001']);

    // (d) Simulate crash between authoritative profile write & finishTransaction -> relaunch with stale in-memory profile & missing backup
    memStorage.removeItem(STORAGE_IAP_LEDGER_KEY);
    const duplicateRecovery = commitConsumableGrantAtomically(baseProfile, {
      transactionId: '881001',
      productId: 'com.elemall.snakegame.hearts10',
      category: 'HEARTS',
      quantity: 1,
      grantedAmount: 10,
      grantedAt: Date.now(),
      platform: 'ios',
    });
    assert.equal(duplicateRecovery.status, 'DUPLICATE');
    assert.equal(duplicateRecovery.nextProfile?.hearts, 15, 'Recovery must NOT double-grant after crash');
    // Backup ledger was self-healed & verified
    const healedBackup = loadBackupLedger();
    assert.ok(healedBackup['881001'], 'Backup ledger must self-heal on duplicate/recovery check');
  });

  // T25: V47.1 Section 5 — Reset Game Progress Protection on iOS vs Android
  await runTest('T25: Reset Progress preserves Hearts (> maxHearts), Coins & IAP ledger on iOS while keeping exact legacy reset on Android', () => {
    resetServiceSingletons();

    const richProfile = {
      ...createDefaultPlayerProfile('en'),
      hearts: 42,
      maxHearts: 5,
      coins: 120000,
      unlockedLevel: 85,
      completedLevels: [1, 2, 3],
      highScores: { CLASSIC: 5000, TIME_ATTACK: 4000, LEVELS: 9000, SURVIVAL: 0 },
      iapTransactionLedger: {
        '900001': {
          transactionId: '900001',
          productId: 'com.elemall.snakegame.hearts32',
          category: 'HEARTS' as const,
          quantity: 1,
          grantedAmount: 32,
          grantedAt: Date.now(),
          platform: 'ios' as const,
        },
      },
    };
    const cleanBase = {
      ...createDefaultPlayerProfile('en'),
      hearts: 5,
      maxHearts: 5,
      coins: 0,
      unlockedLevel: 1,
      completedLevels: [],
      highScores: { CLASSIC: 0, TIME_ATTACK: 0, LEVELS: 0, SURVIVAL: 0 },
    };

    const iosReset = buildResetPlayerProfile(richProfile, cleanBase, true);
    assert.equal(iosReset.hearts, 42, 'iOS reset must preserve current Hearts without truncating to 5');
    assert.equal(iosReset.coins, 120000, 'iOS reset must preserve current Coins');
    assert.equal(iosReset.unlockedLevel, 1);
    assert.deepEqual(iosReset.completedLevels, []);
    assert.equal(iosReset.highScores.CLASSIC, 0);
    assert.ok(iosReset.iapTransactionLedger?.['900001'], 'iOS reset must preserve IAP ledger');

    const androidReset = buildResetPlayerProfile(richProfile, cleanBase, false);
    assert.equal(androidReset.hearts, 5, 'Android reset must retain exact legacy hearts: 5');
    assert.equal(androidReset.coins, 0, 'Android reset must retain exact legacy coins: 0');
  });

  // T26: V47.1 Section 6 — Unified iOS Non-Tracking (npa:true always, never calls ATT) + Privacy Manifest ProductInteraction
  await runTest('T26: iOS AdMob ALWAYS sends npa:true and NEVER calls trackingAuthorizationStatus even if ATT were authorized; PrivacyInfo declares ProductInteraction', async () => {
    resetServiceSingletons();
    setMockEnv('ios');

    let attCalled = false;
    let capturedPrepareOpts: any = null;

    nativeHandlers.AdMob = {
      requestConsentInfo: async () => ({
        status: AdmobConsentStatus.OBTAINED,
        isConsentFormAvailable: false,
        canRequestAds: true,
        privacyOptionsRequirementStatus: 'NOT_REQUIRED',
      }),
      trackingAuthorizationStatus: async () => {
        attCalled = true;
        return { status: 'authorized' };
      },
      initialize: async () => {},
      prepareRewardVideoAd: async (opts: any) => {
        capturedPrepareOpts = opts;
      },
    };

    const ok = await admobService.initializeConsentAndAdsForIOS();
    assert.equal(ok, true);
    assert.equal(attCalled, false, 'iOS must NEVER call trackingAuthorizationStatus under unified no-tracking policy');
    assert.equal(capturedPrepareOpts?.npa, true, 'iOS must ALWAYS pass npa: true even when consent is obtained');

    const privacyManifest = fs.readFileSync(path.resolve(process.cwd(), 'ios/App/App/PrivacyInfo.xcprivacy'), 'utf8');
    assert.ok(
      privacyManifest.includes('NSPrivacyCollectedDataTypeProductInteraction'),
      'PrivacyInfo.xcprivacy must declare ProductInteraction for Firebase Analytics'
    );
    assert.ok(
      privacyManifest.includes('<key>NSPrivacyTracking</key>\n\t<false/>'),
      'PrivacyInfo.xcprivacy must declare NSPrivacyTracking = false'
    );
  });

  // T27: V49 Section 2 — 300s Empty-Unfinished Lock Vulnerability & Same-Product-ID Recovery Guard (All 6 Cases)
  await runTest('T27 (V49 Sec 2): 300s+ empty Transaction.unfinished & same-product old tx recovery NEVER prematurely unlock unsettled native purchase; late success/cancel settle cleanly', async () => {
    resetServiceSingletons();
    setMockEnv('ios');

    const store = createIOSAuthoritativeProfileStore({
      ...createDefaultPlayerProfile('en'),
      hearts: 5,
      coins: 0,
    });
    memStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(store.getSnapshot()));

    const finishedIds: string[] = [];
    const recoveryEvents: any[] = [];
    iapService.registerFulfillmentHandler((entry) => {
      const res = store.commitIAPGrant(entry);
      return { status: res.status, error: res.error, backupSyncFailed: res.backupSyncFailed };
    });
    iapService.onIOSRecoveryGrant((evt) => recoveryEvents.push(evt));

    (iapService as any).iosPurchaseUiTimeoutMs = 40;
    let purchaseCalls = 0;
    let resolveNativePurchase!: (tx: any) => void;
    let mockUnfinishedQueue: any[] = [];

    nativeHandlers.NativePurchases = {
      isBillingSupported: async () => ({ isBillingSupported: true }),
      configure: async () => {},
      getProducts: async ({ productIdentifiers }: { productIdentifiers: string[] }) => ({
        products: productIdentifiers.map((id) => ({
          identifier: id,
          title: id,
          description: id,
          price: 0.99,
          priceString: '$0.99',
          currencyCode: 'USD',
          currencySymbol: '$',
          isFamilyShareable: false,
        })),
      }),
      getUnfinishedTransactions: async () => ({ transactions: [...mockUnfinishedQueue] }),
      purchaseProduct: async () => {
        purchaseCalls += 1;
        return await new Promise((resolve) => {
          resolveNativePurchase = resolve;
        });
      },
      finishTransaction: async ({ transactionId }: any) => {
        finishedIds.push(transactionId);
        mockUnfinishedQueue = mockUnfinishedQueue.filter((t) => t.transactionId !== transactionId);
      },
    };

    await iapService.loadIOSProducts(true);

    // Case 1: 180s UI timeout fires while native purchase Promise is still unsettled
    const uiRes = await iapService.purchaseProduct('com.elemall.snakegame.hearts10', 'en');
    assert.equal(uiRes.success, false);
    assert.equal(uiRes.pending, true);
    assert.equal(
      uiRes.error,
      'Your purchase is still being processed. Please wait while we check its status.'
    );
    const stateAfterTimeout = iapService.getActiveIOSPurchaseState();
    assert.equal(stateAfterTimeout.active, true);
    assert.equal(stateAfterTimeout.phase, 'UI_TIMED_OUT_WAITING_NATIVE');

    // Case 2: Simulate > 300 seconds elapsed (400s) with Transaction.unfinished === []
    (iapService as any).activeIOSPurchase.startedAt = Date.now() - 400_000;
    mockUnfinishedQueue = [];
    const recovEmpty = await iapService.recoverUnfinishedIOSTransactions('en');
    assert.equal(recovEmpty, 0);
    assert.equal(
      iapService.getActiveIOSPurchaseState().active,
      true,
      'Empty Transaction.unfinished after 300s MUST NOT unlock unsettled native purchase!'
    );

    // Case 3: Player tries to buy again after 300s -> MUST block overlapping native purchase!
    const retryAfter300s = await iapService.purchaseProduct('com.elemall.snakegame.hearts10', 'en');
    assert.equal(retryAfter300s.success, false);
    assert.equal(retryAfter300s.pending, true);
    assert.equal(purchaseCalls, 1, 'MUST NOT start overlapping NativePurchases.purchaseProduct()');
    assert.ok(
      retryAfter300s.error?.toLowerCase().includes('reopen the app'),
      'Post-timeout retry should guide user on safe app restart recovery'
    );

    // Case 6: An OLD unfinished transaction for the SAME Product ID arrives via recovery
    // -> delivers old tx ONCE, and MUST NOT release current active native purchase lock!
    const oldSameProductTx = {
      transactionId: '990101',
      productIdentifier: 'com.elemall.snakegame.hearts10',
      quantity: 1,
      jwsRepresentation: makeFakeJWS({
        transactionId: '990101',
        productId: 'com.elemall.snakegame.hearts10',
        quantity: 1,
      }),
    };
    mockUnfinishedQueue = [oldSameProductTx];
    const oldRecovered = await iapService.recoverUnfinishedIOSTransactions('en');
    assert.equal(oldRecovered, 1, 'Old unfinished tx should still be recovered cleanly');
    assert.equal(store.getSnapshot().hearts, 15, 'Old tx grants +10 Hearts');
    assert.equal(
      iapService.getActiveIOSPurchaseState().active,
      true,
      'Recovering an OLD transaction with the SAME productId MUST NOT release current active native purchase lock!'
    );

    // Attempting to buy again is STILL blocked until the actual native Promise settles
    const blockedAfterOldRecov = await iapService.purchaseProduct('com.elemall.snakegame.hearts10', 'en');
    assert.equal(blockedAfterOldRecov.pending, true);
    assert.equal(purchaseCalls, 1);

    // Case 4: Original native purchase Promise finally resolves LATE -> grants ONCE & releases lock
    const currentTxId = '990102';
    resolveNativePurchase({
      transactionId: currentTxId,
      productIdentifier: 'com.elemall.snakegame.hearts10',
      quantity: 1,
      jwsRepresentation: makeFakeJWS({
        transactionId: currentTxId,
        productId: 'com.elemall.snakegame.hearts10',
        quantity: 1,
      }),
    });
    await new Promise((r) => setTimeout(r, 30));
    assert.equal(store.getSnapshot().hearts, 25, 'Original late purchase grants +10 Hearts ONCE');
    assert.ok(finishedIds.includes(currentTxId));
    assert.equal(
      iapService.getActiveIOSPurchaseState().active,
      false,
      'Lock MUST release once original native Promise resolves'
    );

    // Case 5: Original native purchase Promise rejects LATE with User cancelled -> releases lock, allows subsequent purchase
    let rejectLateCancel!: (err: Error) => void;
    nativeHandlers.NativePurchases.purchaseProduct = async () => {
      purchaseCalls += 1;
      return await new Promise((_, reject) => {
        rejectLateCancel = reject;
      });
    };

    const uiCancelTimeout = await iapService.purchaseProduct('com.elemall.snakegame.hearts10', 'en');
    assert.equal(uiCancelTimeout.pending, true);
    (iapService as any).activeIOSPurchase.startedAt = Date.now() - 400_000;
    await iapService.recoverUnfinishedIOSTransactions('en');
    assert.equal(iapService.getActiveIOSPurchaseState().active, true);

    rejectLateCancel(new Error('User cancelled'));
    await new Promise((r) => setTimeout(r, 30));
    assert.equal(store.getSnapshot().hearts, 25, 'Late cancel grants 0');
    assert.equal(
      iapService.getActiveIOSPurchaseState().active,
      false,
      'Lock MUST release cleanly when original native Promise rejects with User cancelled'
    );

    // Confirm purchasing is NOT permanently locked after late cancel
    nativeHandlers.NativePurchases.purchaseProduct = async ({ productIdentifier }: any) => {
      purchaseCalls += 1;
      return {
        transactionId: '990103',
        productIdentifier,
        quantity: 1,
        jwsRepresentation: makeFakeJWS({
          transactionId: '990103',
          productId: productIdentifier,
          quantity: 1,
        }),
      };
    };
    const nextPurchase = await iapService.purchaseProduct('com.elemall.snakegame.hearts10', 'en');
    assert.equal(nextPurchase.success, true);
    assert.equal(store.getSnapshot().hearts, 35);

    (iapService as any).iosPurchaseUiTimeoutMs = 180000;
  });

  // T28: V49 Section 3 — Authoritative iOS Profile Store & App.tsx Integration Race Suite (All 10 Scenarios)
  await runTest('T28 (V49 Sec 3): Production IOSAuthoritativeProfileStore handles all 10 spend/IAP/stale-render/revision/ad/refill/crash/reset race scenarios', async () => {
    resetServiceSingletons();
    setMockEnv('ios');

    const initial = {
      ...createDefaultPlayerProfile('en'),
      coins: 100000,
      hearts: 3,
      maxHearts: 5,
      lastHeartRefillTimestamp: Date.now() - 20 * 60 * 1000, // 20 mins ago -> eligible for +1 natural refill
      completedLevels: [1, 2, 3],
      unlockedLevel: 4,
      highScores: { CLASSIC: 2500, TIME_ATTACK: 1800, LEVELS: 4000, SURVIVAL: 0 },
      profileRevision: 0,
    };
    memStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(initial));

    // Track what React would render (intentionally lagging behind synchronous store to simulate pre-render races!)
    let reactRenderedProfile = initial;
    const store = createIOSAuthoritativeProfileStore(initial);

    // Wire iapService fulfillment handler identically to src/App.tsx
    const finishedIds: string[] = [];
    iapService.registerFulfillmentHandler((entry) => {
      const res = store.commitIAPGrant(entry);
      return { status: res.status, error: res.error, backupSyncFailed: res.backupSyncFailed };
    });

    nativeHandlers.NativePurchases = {
      isBillingSupported: async () => ({ isBillingSupported: true }),
      configure: async () => {},
      getProducts: async ({ productIdentifiers }: { productIdentifiers: string[] }) => ({
        products: productIdentifiers.map((id) => ({
          identifier: id,
          title: id,
          description: id,
          price: 0.99,
          priceString: '$0.99',
          currencyCode: 'USD',
          currencySymbol: '$',
          isFamilyShareable: false,
        })),
      }),
      finishTransaction: async ({ transactionId }: any) => {
        finishedIds.push(transactionId);
      },
    };
    await iapService.loadIOSProducts(true);

    // Scenarios 1, 2, 3: Spend 30,000 Coins synchronously (React has NOT re-rendered yet; reactRenderedProfile still has 100,000!)
    // Immediately receive 50,000 Coins IAP -> final MUST be 120,000 (NOT 150,000)!
    const afterSpend = store.applyUpdate((prev) => ({
      ...prev,
      coins: prev.coins - 30000,
    }));
    assert.equal(afterSpend.coins, 70000);
    assert.equal(reactRenderedProfile.coins, 100000, 'Simulate React not yet re-rendered');
    const revAfterSpend = getProfileRevision(afterSpend);
    assert.ok(revAfterSpend > 0);

    nativeHandlers.NativePurchases.purchaseProduct = async ({ productIdentifier }: any) => ({
      transactionId: '950001',
      productIdentifier,
      quantity: 1,
      jwsRepresentation: makeFakeJWS({
        transactionId: '950001',
        productId: productIdentifier,
        quantity: 1,
      }),
    });
    const buy50k = await iapService.purchaseProduct('com.elemall.snakegame.coins50k', 'en');
    assert.equal(buy50k.success, true);
    assert.equal(store.getSnapshot().coins, 120000, '100,000 - 30,000 + 50,000 MUST equal 120,000 even before React re-render');

    const snapshotAfter50k = store.getSnapshot();
    const revAfter50k = getProfileRevision(snapshotAfter50k);
    assert.ok(revAfter50k > revAfterSpend);

    // Scenario 5: Old pre-IAP React snapshot (missing tx 950001, lower rev) tries to overwrite via persistIfCurrent & saveProfileSafelyForIOS
    const blockedOldReact = store.persistIfCurrent(reactRenderedProfile);
    assert.equal(blockedOldReact.saved, false);
    assert.equal(blockedOldReact.skippedStaleSnapshot, true);
    assert.equal(JSON.parse(memStorage.getItem(STORAGE_PROFILE_KEY)!).coins, 120000);

    // Scenario 4: Two profiles have the EXACT SAME IAP Ledger ({ 950001 }), but different Revisions!
    // Spend 5,000 Coins -> now coins = 115,000, rev = revAfter50k + 1 (SAME ledger as snapshotAfter50k!)
    const afterSecondSpend = store.applyUpdate(
      (prev) => ({ ...prev, coins: prev.coins - 5000 }),
      { persistImmediately: true }
    );
    assert.equal(afterSecondSpend.coins, 115000);
    assert.deepEqual(
      Object.keys(snapshotAfter50k.iapTransactionLedger || {}),
      Object.keys(afterSecondSpend.iapTransactionLedger || {}),
      'Both snapshots have identical IAP ledgers'
    );
    // Attempting to save older revision (snapshotAfter50k, coins 120k) MUST be blocked by STALE_REVISION!
    const blockedSameLedgerOldRev = saveProfileSafelyForIOS(snapshotAfter50k);
    assert.equal(blockedSameLedgerOldRev.saved, false);
    assert.equal(blockedSameLedgerOldRev.skippedStaleSnapshot, true);
    assert.equal(blockedSameLedgerOldRev.reason, 'STALE_REVISION');
    assert.equal(JSON.parse(memStorage.getItem(STORAGE_PROFILE_KEY)!).coins, 115000);

    // Direct stale object passed to store.applyUpdate MUST ALSO be blocked!
    const ignoredDirectOverwrite = store.applyUpdate(snapshotAfter50k);
    assert.equal(ignoredDirectOverwrite.coins, 115000);

    // Scenario 6: Two different IAP transactions arrive consecutively before any React re-render
    const txA = store.commitIAPGrant({
      transactionId: '950002',
      productId: 'com.elemall.snakegame.coins50k',
      category: 'COINS',
      quantity: 1,
      grantedAmount: 50000,
      grantedAt: Date.now(),
      platform: 'ios',
    });
    const txB = store.commitIAPGrant({
      transactionId: '950003',
      productId: 'com.elemall.snakegame.coins180k',
      category: 'COINS',
      quantity: 1,
      grantedAmount: 180000,
      grantedAt: Date.now(),
      platform: 'ios',
    });
    assert.equal(txA.status, 'GRANTED');
    assert.equal(txB.status, 'GRANTED');
    assert.equal(store.getSnapshot().coins, 115000 + 50000 + 180000);
    assert.ok(store.getSnapshot().iapTransactionLedger?.['950002']);
    assert.ok(store.getSnapshot().iapTransactionLedger?.['950003']);

    // Scenario 8 (Order A): Natural Heart Refill (3 -> 4) + IAP (+10 Hearts) = 14
    const afterRefill = store.applyNaturalHeartRefill(Date.now());
    assert.equal(afterRefill.hearts, 4, 'Natural refill restores 3 -> 4');
    const heartTx1 = store.commitIAPGrant({
      transactionId: '950004',
      productId: 'com.elemall.snakegame.hearts10',
      category: 'HEARTS',
      quantity: 1,
      grantedAmount: 10,
      grantedAt: Date.now(),
      platform: 'ios',
    });
    assert.equal(heartTx1.status, 'GRANTED');
    assert.equal(store.getSnapshot().hearts, 14);

    // Scenario 8 (Order B): Natural Heart Refill fires AFTER IAP raised hearts > maxHearts -> MUST NOT truncate 14 -> 5!
    const refillAfterIap = store.applyNaturalHeartRefill(Date.now() + 60 * 60 * 1000);
    assert.equal(refillAfterIap.hearts, 14, 'Natural refill must NEVER truncate purchased hearts (> maxHearts)');

    // Scenario 7: AdMob Reward (+1 Heart) & IAP (+10 Hearts) concurrent updates -> BOTH preserved (+11 total -> 25)!
    const adRes = store.applyAdRewardHeart('2026-11-24', 5);
    assert.equal(adRes.rewarded, true);
    const heartTx2 = store.commitIAPGrant({
      transactionId: '950005',
      productId: 'com.elemall.snakegame.hearts10',
      category: 'HEARTS',
      quantity: 1,
      grantedAmount: 10,
      grantedAt: Date.now(),
      platform: 'ios',
    });
    assert.equal(heartTx2.status, 'GRANTED');
    assert.equal(store.getSnapshot().hearts, 25, 'Ad reward (+1) + IAP (+10) must BOTH apply (14 + 1 + 10 = 25)');
    assert.equal(store.getSnapshot().dailyAdWatchCount, 1);

    // Scenario 9: Profile write fails -> PERSIST_FAILED, finishTransaction withheld -> simulated restart & recovery succeeds ONCE
    const unfinishedFailTx = {
      transactionId: '950006',
      productIdentifier: 'com.elemall.snakegame.hearts10',
      quantity: 1,
      jwsRepresentation: makeFakeJWS({
        transactionId: '950006',
        productId: 'com.elemall.snakegame.hearts10',
        quantity: 1,
      }),
    };
    nativeHandlers.NativePurchases.getUnfinishedTransactions = async () => ({
      transactions: [unfinishedFailTx],
    });

    finishedIds.length = 0;
    memStorage.failNextSetItem = true;
    const failedRecovCount = await iapService.recoverUnfinishedIOSTransactions('en');
    assert.equal(failedRecovCount, 0);
    assert.equal(store.getSnapshot().hearts, 25, 'Failed write must leave balance unchanged');
    assert.equal(finishedIds.includes('950006'), false, 'Failed write MUST withhold finishTransaction');

    // Simulate cold restart (new authoritative store loaded from storage) -> recovery grants ONCE & finishes
    const reloadedProfile = JSON.parse(memStorage.getItem(STORAGE_PROFILE_KEY)!);
    const restartedStore = createIOSAuthoritativeProfileStore(reloadedProfile);
    iapService.registerFulfillmentHandler((entry) => {
      const res = restartedStore.commitIAPGrant(entry);
      return { status: res.status, error: res.error, backupSyncFailed: res.backupSyncFailed };
    });
    const restartRecovCount = await iapService.recoverUnfinishedIOSTransactions('en');
    assert.equal(restartRecovCount, 1);
    assert.equal(restartedStore.getSnapshot().hearts, 35);
    assert.equal(finishedIds.includes('950006'), true);

    // Scenario 10: Reset Progress preserves Hearts (35), Coins (345,000), and Ledger, AND blocks stale pre-reset snapshot!
    const preResetSnapshot = restartedStore.getSnapshot();
    const resetBase = {
      ...createDefaultPlayerProfile('en'),
      hearts: 5,
      maxHearts: 5,
      coins: 0,
      unlockedLevel: 1,
      completedLevels: [],
      highScores: { CLASSIC: 0, TIME_ATTACK: 0, LEVELS: 0, SURVIVAL: 0 },
    };
    const afterReset = restartedStore.resetProgress(resetBase);
    assert.equal(afterReset.hearts, 35, 'iOS Reset Progress must preserve Hearts (35)');
    assert.equal(afterReset.coins, 345000, 'iOS Reset Progress must preserve Coins (345,000)');
    assert.equal(afterReset.unlockedLevel, 1);
    assert.deepEqual(afterReset.completedLevels, []);
    assert.ok(afterReset.iapTransactionLedger?.['950006']);
    assert.ok(getProfileRevision(afterReset) > getProfileRevision(preResetSnapshot));

    // Pre-reset stale snapshot with identical ledger CANNOT overwrite reset!
    const stalePreResetSave = restartedStore.persistIfCurrent(preResetSnapshot);
    assert.equal(stalePreResetSave.saved, false);
    assert.equal(stalePreResetSave.skippedStaleSnapshot, true);
    assert.equal(JSON.parse(memStorage.getItem(STORAGE_PROFILE_KEY)!).unlockedLevel, 1);
  });

  // T29: V49 Section 4 & App.tsx Integration Audit — Exact Pinned Plugin Versions, Lockfile Integrity, & App.tsx Wiring
  await runTest('T29 (V49 Sec 4 & Integration): package.json pins exact 8.9.16/8.4.0, package-lock.json has integrity hashes, and src/App.tsx wires IOSAuthoritativeProfileStore', () => {
    const pkg = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf8'));
    assert.equal(pkg.dependencies['@capgo/native-purchases'], '8.9.16', 'Must pin exact 8.9.16 without caret');
    assert.equal(pkg.dependencies['@capacitor-community/admob'], '8.4.0', 'Must pin exact 8.4.0 without caret');

    const lock = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'package-lock.json'), 'utf8'));
    const iapLock = lock.packages?.['node_modules/@capgo/native-purchases'];
    const admobLock = lock.packages?.['node_modules/@capacitor-community/admob'];
    assert.equal(iapLock?.version, '8.9.16');
    assert.ok(typeof iapLock?.resolved === 'string' && iapLock.resolved.includes('native-purchases-8.9.16.tgz'));
    assert.ok(typeof iapLock?.integrity === 'string' && iapLock.integrity.startsWith('sha512-'));
    assert.equal(admobLock?.version, '8.4.0');
    assert.ok(typeof admobLock?.resolved === 'string' && admobLock.resolved.includes('admob-8.4.0.tgz'));
    assert.ok(typeof admobLock?.integrity === 'string' && admobLock.integrity.startsWith('sha512-'));

    const appTsx = fs.readFileSync(path.resolve(process.cwd(), 'src/App.tsx'), 'utf8');
    assert.ok(appTsx.includes('createIOSAuthoritativeProfileStore'), 'App.tsx must use createIOSAuthoritativeProfileStore');
    assert.ok(appTsx.includes('iosProfileStoreRef.current.commitIAPGrant'), 'App.tsx fulfillmentHandler must use commitIAPGrant');
    assert.ok(appTsx.includes('store.applyNaturalHeartRefill'), 'App.tsx heart refill must use applyNaturalHeartRefill');
    assert.ok(appTsx.includes('store.applyAdRewardHeart'), 'App.tsx ad reward must use applyAdRewardHeart');
    assert.ok(appTsx.includes('iosProfileStoreRef.current.resetProgress'), 'App.tsx reset must use resetProgress');
    assert.ok(appTsx.includes('iosProfileStoreRef.current.persistIfCurrent'), 'App.tsx auto-save must use persistIfCurrent');

    const iapServiceTs = fs.readFileSync(path.resolve(process.cwd(), 'src/services/iapService.ts'), 'utf8');
    assert.equal(iapServiceTs.includes('iosAbandonedRecoveryMs'), false, '300s abandoned unlock must be completely removed');
    assert.equal(iapServiceTs.includes('releaseActiveIOSPurchaseIfMatched'), false, 'productId-based premature lock release must be completely removed');
  });

  // T30: V50 CI/CD Signing Scope Isolation, Certificate Safety & Diagnostic Log Audit
  await runTest('T30 (V50 CI/CD Hotfix): Project-Level has ZERO signing overrides, Main App Target has Manual Signing, Fastfile has NO global xcargs signing & NO cert auto-revocation', () => {
    const pbxproj = fs.readFileSync(path.resolve(process.cwd(), 'ios/App/App.xcodeproj/project.pbxproj'), 'utf8');

    // Helper to extract XCBuildConfiguration block by UUID
    const extractConfigBlock = (uuid: string): string => {
      const m = pbxproj.match(new RegExp(`${uuid}\\s*/\\*[^*]*\\*/\\s*=\\s*\\{[\\s\\S]*?\\n\\t\\t\\};`));
      assert.ok(m, `Missing XCBuildConfiguration block for UUID ${uuid}`);
      return m[0];
    };

    // Project-Level Debug & Release MUST NOT contain any signing/provisioning overrides (which leak to SPM bundles)
    const forbiddenProjectKeys = [
      'PROVISIONING_PROFILE_SPECIFIER',
      'PROVISIONING_PROFILE',
      'CODE_SIGN_STYLE',
      'CODE_SIGN_IDENTITY',
      'DEVELOPMENT_TEAM',
      'OTHER_CODE_SIGN_FLAGS',
    ];
    for (const projCfgId of ['504EC3141FED79650016851F', '504EC3151FED79650016851F']) {
      const block = extractConfigBlock(projCfgId);
      for (const key of forbiddenProjectKeys) {
        assert.equal(
          block.includes(key),
          false,
          `Project-Level config ${projCfgId} MUST NOT contain ${key}`
        );
      }
    }

    // Main App Target Debug & Release MUST have Manual Signing & confirmed identifiers, and NO hardcoded stale temporary profile
    for (const appCfgId of ['504EC3171FED79650016851F', '504EC3181FED79650016851F']) {
      const block = extractConfigBlock(appCfgId);
      assert.ok(block.includes('CODE_SIGN_STYLE = Manual;'), `App target config ${appCfgId} must set CODE_SIGN_STYLE = Manual`);
      assert.ok(block.includes('DEVELOPMENT_TEAM = N2S5289QDM;'), `App target config ${appCfgId} must set DEVELOPMENT_TEAM = N2S5289QDM`);
      assert.ok(block.includes('CODE_SIGN_IDENTITY = "Apple Distribution";'), `App target config ${appCfgId} must set CODE_SIGN_IDENTITY`);
      assert.ok(block.includes('PRODUCT_BUNDLE_IDENTIFIER = elemall.snakegame.1;'), `App target config ${appCfgId} must set elemall.snakegame.1`);
      assert.ok(block.includes('CURRENT_PROJECT_VERSION = 253;'), `App target config ${appCfgId} must set baseline build 253`);
      assert.equal(block.includes('1792763888'), false, 'Stale temporary profile 1792763888 must be removed');
      assert.equal(block.includes('1793016646'), false, 'Stale temporary profile 1793016646 must be removed');
      assert.equal(block.includes('1795607289'), false, 'Stale temporary profile 1795607289 must be removed');
    }

    // Fastfile code-only lines (strip comments) audit
    const fastfileRaw = fs.readFileSync(path.resolve(process.cwd(), 'ios/App/fastlane/Fastfile'), 'utf8');
    const fastfileCode = fastfileRaw
      .split('\n')
      .filter((line) => !line.trim().startsWith('#'))
      .join('\n');

    assert.equal(fastfileCode.includes('xcargs:'), false, 'Fastfile must NOT pass global xcargs signing overrides to build_app');
    assert.equal(fastfileCode.includes('CODE_SIGNING_ALLOWED=NO'), false, 'Fastfile must NEVER use CODE_SIGNING_ALLOWED=NO');
    assert.equal(fastfileCode.includes('CODE_SIGNING_REQUIRED=NO'), false, 'Fastfile must NEVER use CODE_SIGNING_REQUIRED=NO');
    assert.equal(fastfileCode.includes('OTHER_CODE_SIGN_FLAGS='), false, 'Fastfile must NOT pass global OTHER_CODE_SIGN_FLAGS in xcargs');
    assert.equal(fastfileCode.includes('.delete!'), false, 'Fastfile must NEVER auto-revoke Apple Distribution certificates (.delete!)');
    assert.equal(fastfileCode.includes('1793016646'), false, 'Fastfile must NOT hardcode temporary profile fallback');
    assert.equal(fastfileCode.includes('1792763888'), false, 'Fastfile must NOT hardcode temporary profile fallback');

    assert.ok(fastfileCode.includes('export_method: "app-store"'), 'Fastfile must retain app-store export_method');
    assert.ok(fastfileCode.includes('signingStyle: "manual"'), 'Fastfile must retain manual signingStyle in export_options');
    assert.ok(fastfileCode.includes('bundle_id => profile_name'), 'Fastfile export_options must map bundle_id => profile_name');
    assert.ok(fastfileCode.includes('buildlog_path: build_logs_dir'), 'Fastfile must persist full xcodebuild logs');
    assert.ok(fastfileCode.includes('collect_and_print_xcode_diagnostics'), 'Fastfile must print Xcode diagnostic errors on failure');
    assert.ok(fastfileCode.includes('com.apple.product-type.application'), 'Fastfile Xcodeproj patch must filter strictly to main application target');

    // Codemagic YAML audit
    const codemagic = fs.readFileSync(path.resolve(process.cwd(), 'codemagic.yaml'), 'utf8');
    assert.ok(codemagic.includes('build/logs/**/*.log'), 'codemagic.yaml must collect build/logs/**/*.log artifacts');
    assert.ok(codemagic.includes('$HOME/Library/Logs/gym/*.log'), 'codemagic.yaml must collect gym logs in artifacts');
    assert.ok(codemagic.includes('set -o pipefail'), 'codemagic.yaml must enable pipefail when tee-ing fastlane output');
  });

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`\n=== Test Summary: ${passed}/${results.length} PASSED, ${failed} FAILED ===\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
