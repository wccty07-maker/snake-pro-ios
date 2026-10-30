import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, getFirestore, Firestore, doc, getDoc, setLogLevel } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getInstallations, getId, deleteInstallations, Installations } from 'firebase/installations';
import { getAuth, signInAnonymously, onAuthStateChanged, Auth } from 'firebase/auth';

// Set Firestore log level to 'error' to avoid noisy offline warning logs during network reconnections
try {
  setLogLevel('error');
} catch {
  // ignore
}

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyAqAxQm2I54V9m3EGT0ag3CtBPfqX-PJ1Q",
  authDomain: "snake-pro-c1187.firebaseapp.com",
  projectId: "snake-pro-c1187",
  storageBucket: "snake-pro-c1187.firebasestorage.app",
  messagingSenderId: "1067132350124",
  appId: "1:1067132350124:web:1671b699865969ffda3909",
  measurementId: "G-SRM31N08J7"
};

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth & Anonymous Sign-In (satisfies request.auth != null in security rules)
export const auth: Auth = getAuth(app);
if (typeof window !== 'undefined') {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      signInAnonymously(auth).catch(() => {});
    }
  });
}

// Initialize Cloud Firestore with auto-detected long polling for iOS WKWebView & mobile networks
let firestoreDb: Firestore;
try {
  firestoreDb = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
  });
} catch {
  firestoreDb = getFirestore(app);
}

export const db = firestoreDb;

// Initialize Firebase Installations safely (check browser environment)
let installationsInstance: Installations | null = null;
if (typeof window !== 'undefined') {
  try {
    installationsInstance = getInstallations(app);
  } catch (err) {
    console.warn('Firebase Installations 初始化備援:', err);
  }
}

export const installations = installationsInstance;

const FID_STORAGE_KEY = 'snake_pro_fid_v1';

/**
 * 檢查是否為官方 Firebase Installations 產生的真實有效 FID
 * (官方 FID 為 22 字元 base64url 編碼格式，不帶 fid_ 等前綴)
 */
export function isValidFirebaseInstallationId(id?: string | null): boolean {
  if (!id || typeof id !== 'string') return false;
  const trimmed = id.trim();
  return trimmed.length >= 16 && !trimmed.startsWith('fid_') && !trimmed.startsWith('mock_');
}

/**
 * 取得 Firebase Installation ID (FID) 作為裝置唯一匿名識別碼
 * 向 Google Firebase Installations 服務請求官方加密唯一識別碼，確保匿名性與合規
 */
export async function getFirebaseInstallationId(forceRefresh: boolean = false): Promise<string> {
  if (typeof window === 'undefined') return 'fid_guest';

  // 1. 若本機已快取真實 Firebase 官方 FID 且未要求強制刷新，直接返回
  const cached = localStorage.getItem(FID_STORAGE_KEY);
  if (!forceRefresh && isValidFirebaseInstallationId(cached)) {
    return cached!.trim();
  }

  // 2. 向 Firebase Installations 請求真實 FID (22 字元官方加密唯一識別碼)
  if (installationsInstance) {
    try {
      const realFid = await getId(installationsInstance);
      if (realFid && realFid.trim()) {
        const cleanFid = realFid.trim();
        localStorage.setItem(FID_STORAGE_KEY, cleanFid);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('fid_updated', { detail: { fid: cleanFid } }));
        }
        return cleanFid;
      }
    } catch (err) {
      console.warn('獲取 Firebase Installation ID 失敗:', err);
    }
  }

  // 3. 離線或網路暫時受阻時的快取或備援
  if (cached && cached.trim().length >= 10) {
    return cached.trim();
  }

  const offlineFid = 'fid_offline_' + Date.now().toString(36);
  localStorage.setItem(FID_STORAGE_KEY, offlineFid);
  return offlineFid;
}

/**
 * 同步快速讀取已快取的 FID，避免 UI 渲染非同步跳動
 */
export function getSyncCachedFID(): string {
  if (typeof window === 'undefined') return 'fid_guest';
  try {
    const cached = localStorage.getItem(FID_STORAGE_KEY);
    if (cached && cached.trim()) {
      if (!isValidFirebaseInstallationId(cached)) {
        // 若仍為暫時備援碼，在背景異步向 Firebase Installations 請求官方真實 FID
        getFirebaseInstallationId().catch(() => {});
      }
      return cached.trim();
    }
    // 初次載入先啟動非同步獲取真實 FID
    getFirebaseInstallationId().catch(() => {});
    return 'fid_pending';
  } catch {
    return 'fid_guest';
  }
}

/**
 * 徹底重設 / 銷毀 Firebase Installation ID
 * 呼叫 Firebase 官方 deleteInstallations() 銷毀現有安裝憑證，並向 Firebase 申請全新 FID
 * 徹底斷開玩家與過往雲端排行榜與伺服器紀錄的關聯 (符合 GDPR 被遺忘權)
 */
export async function resetFirebaseInstallationId(): Promise<string> {
  try {
    if (installationsInstance) {
      await deleteInstallations(installationsInstance).catch((e) => {
        console.warn('Firebase deleteInstallations 警示:', e);
      });
      const freshFid = await getId(installationsInstance);
      if (freshFid && freshFid.trim()) {
        const cleanFid = freshFid.trim();
        localStorage.setItem(FID_STORAGE_KEY, cleanFid);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('fid_updated', { detail: { fid: cleanFid } }));
        }
        return cleanFid;
      }
    }
  } catch (err) {
    console.warn('重設 Firebase Installation 失敗:', err);
  }

  const fallback = 'fid_' + Date.now().toString(36);
  localStorage.setItem(FID_STORAGE_KEY, fallback);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('fid_updated', { detail: { fid: fallback } }));
  }
  return fallback;
}

// 應用程式啟動時在背景自動預先暖身獲取真實 FID
if (typeof window !== 'undefined') {
  getFirebaseInstallationId().catch(() => {});
}

// Initialize Analytics safely (check browser environment & support)
export let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== 'undefined') {
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    })
    .catch(() => {
      // Analytics not supported or blocked by ad-blocker
    });
}

// Test connection to Firestore safely
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, 'leaderboard', '_health_check_'));
    return snap !== null;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore is currently in offline mode or network unreachable.');
    }
    return false;
  }
}
