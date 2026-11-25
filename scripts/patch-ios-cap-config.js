#!/usr/bin/env node
/**
 * Post `npx cap sync ios` patcher & verifier for Snake Pro iOS.
 *
 * 1. Injects `plugins.NativePurchases.autoFinishTransactions = false` ONLY into
 *    `ios/App/App/capacitor.config.json` (leaves root `capacitor.config.json` and
 *    all Android configuration completely untouched).
 * 2. Safely removes any stale `CapacitorApp` entry from `ios/App/CapApp-SPM/Package.swift`
 *    without leaving dangling commas or affecting AdMob / NativePurchases.
 * 3. Strictly verifies that BOTH `@capacitor-community/admob` and
 *    `@capgo/native-purchases` are compiled into `Package.swift` and registered in
 *    `ios/App/App/capacitor.config.json` (`packageClassList`). Exits non-zero if missing.
 */

import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const iosCapConfigPath = path.resolve(rootDir, 'ios/App/App/capacitor.config.json');
const spmPackagePath = path.resolve(rootDir, 'ios/App/CapApp-SPM/Package.swift');

function fail(msg) {
  console.error(`[patch-ios-cap-config] ERROR: ${msg}`);
  process.exit(1);
}

// 1. Patch ios/App/App/capacitor.config.json (iOS-only)
if (!fs.existsSync(iosCapConfigPath)) {
  fail(`Missing ${iosCapConfigPath}. Did 'npx cap sync ios' run?`);
}

let iosCapConfig;
try {
  iosCapConfig = JSON.parse(fs.readFileSync(iosCapConfigPath, 'utf8'));
} catch (err) {
  fail(`Failed to parse ${iosCapConfigPath}: ${err.message}`);
}

// Align iOS-only capacitor.config.json appId to confirmed official App Store Bundle ID
// (root capacitor.config.json retains com.elemall.snakegame for Android).
iosCapConfig.appId = 'elemall.snakegame.1';

iosCapConfig.plugins = iosCapConfig.plugins || {};
iosCapConfig.plugins.NativePurchases = {
  ...(iosCapConfig.plugins.NativePurchases || {}),
  autoFinishTransactions: false,
};

// Remove AppPlugin from packageClassList if @capacitor/app was uninstalled
if (Array.isArray(iosCapConfig.packageClassList)) {
  iosCapConfig.packageClassList = iosCapConfig.packageClassList.filter(
    (cls) => cls !== 'AppPlugin'
  );
}

fs.writeFileSync(iosCapConfigPath, JSON.stringify(iosCapConfig, null, '\t') + '\n', 'utf8');
console.log('[patch-ios-cap-config] Patched ios/App/App/capacitor.config.json: appId = elemall.snakegame.1, NativePurchases.autoFinishTransactions = false');

// 2. Clean stale CapacitorApp reference in Package.swift (if any) safely
if (!fs.existsSync(spmPackagePath)) {
  fail(`Missing ${spmPackagePath}. Did 'npx cap sync ios' run?`);
}

let packageSwift = fs.readFileSync(spmPackagePath, 'utf8');
const originalSwift = packageSwift;

// Remove only lines referencing CapacitorApp / @capacitor/app, preserving valid comma structure
packageSwift = packageSwift
  .split('\n')
  .filter((line) => !line.includes('CapacitorApp') && !line.includes('@capacitor/app'))
  .join('\n');

// Clean up any accidental trailing comma before closing bracket `]`
packageSwift = packageSwift.replace(/,(\s*\n\s*\])/g, '$1');

if (packageSwift !== originalSwift) {
  fs.writeFileSync(spmPackagePath, packageSwift, 'utf8');
  console.log('[patch-ios-cap-config] Cleaned stale CapacitorApp reference from ios/App/CapApp-SPM/Package.swift');
}

// 3. Verify BOTH required native plugins are present in SPM Package.swift & capacitor.config.json
const requiredSpmTokens = [
  'CapacitorCommunityAdmob',
  'CapgoNativePurchases',
];

const missingSpm = requiredSpmTokens.filter((token) => !packageSwift.includes(token));
if (missingSpm.length > 0) {
  fail(
    `ios/App/CapApp-SPM/Package.swift is missing required native plugins: ${missingSpm.join(', ')}`
  );
}

const classList = Array.isArray(iosCapConfig.packageClassList)
  ? iosCapConfig.packageClassList
  : [];

const requiredClasses = ['AdMobPlugin', 'NativePurchasesPlugin'];
const missingClasses = requiredClasses.filter((cls) => !classList.includes(cls));
if (missingClasses.length > 0) {
  fail(
    `ios/App/App/capacitor.config.json packageClassList is missing required plugins: ${missingClasses.join(', ')} (found: ${JSON.stringify(classList)})`
  );
}

if (iosCapConfig.appId !== 'elemall.snakegame.1') {
  fail(`ios/App/App/capacitor.config.json appId mismatch: expected elemall.snakegame.1, got ${iosCapConfig.appId}`);
}

console.log('[patch-ios-cap-config] Verified iOS appId:', iosCapConfig.appId);
console.log('[patch-ios-cap-config] Verified SPM Package.swift contains:', requiredSpmTokens.join(', '));
console.log('[patch-ios-cap-config] Verified iOS packageClassList contains:', classList.join(', '));
