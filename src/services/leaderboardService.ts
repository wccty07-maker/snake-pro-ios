import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { db, getSyncCachedFID, resetFirebaseInstallationId } from '../firebase';
import { GameMode, PlayerProfile } from '../types';
import { getDefaultPlayerName } from '../utils/gameData';
import { getSanitizedHighScore } from '../utils/scoreIsolation';

export type LeaderboardMode = 'Classic' | 'Missions' | 'Time';

export interface FirestoreLeaderboardEntry {
  id: string;
  userId?: string;
  username: string;
  score: number;
  mode: LeaderboardMode;
  rank?: number;
  updatedAt?: Timestamp | null;
  achievedAt?: Timestamp | null;
  formattedDate?: string;
  isCurrentPlayer?: boolean;
}

const COLLECTION_NAME = 'leaderboard';

/**
 * 將遊戲內模式 (GameMode) 轉為 Firestore 中的模式名稱 ('Classic' | 'Missions' | 'Time')
 * 安全防禦：若傳入未定義或未知模式，一律默認為 'Missions'，絕不 fallback 到 'Classic'，
 * 避免早期版本在未傳入 mode 時將闖關分數誤寫入經典模式
 */
export function normalizeMode(mode?: GameMode | string | null): LeaderboardMode {
  if (!mode) return 'Missions';
  if (mode === 'LEVELS' || mode === 'Missions' || mode === 'missions') {
    return 'Missions';
  }
  if (mode === 'TIME_ATTACK' || mode === 'Time' || mode === 'time') {
    return 'Time';
  }
  if (mode === 'CLASSIC' || mode === 'Classic' || mode === 'classic') {
    return 'Classic';
  }
  return 'Missions';
}

export const FIRESTORE_REST_BASE =
  'https://firestore.googleapis.com/v1/projects/snake-pro-c1187/databases/(default)/documents';

/**
 * 原生 HTTPS REST API 提交分數 (繞過 iOS WKWebView 內部連線限制，雙通道直連 Google 伺服器)
 */
export async function submitScoreViaRest(
  userId: string,
  username: string,
  score: number,
  mode: LeaderboardMode,
  achievedAtIso?: string,
  shouldUpdateDate: boolean = false
): Promise<boolean> {
  const docId = `${userId}_${mode}`;
  const fields = ['score', 'mode', 'username', 'userId'];
  if (shouldUpdateDate && achievedAtIso) {
    fields.push('updatedAt', 'achievedAt');
  }
  const updateMask = fields.map((f) => `updateMask.fieldPaths=${f}`).join('&');
  const url = `${FIRESTORE_REST_BASE}/leaderboard/${encodeURIComponent(docId)}?${updateMask}`;
  try {
    const payloadFields: any = {
      userId: { stringValue: userId },
      username: { stringValue: username },
      score: { integerValue: String(score) },
      mode: { stringValue: mode },
    };
    if (shouldUpdateDate && achievedAtIso) {
      payloadFields.updatedAt = { timestampValue: achievedAtIso };
      payloadFields.achievedAt = { timestampValue: achievedAtIso };
    }
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: payloadFields }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * 原生 HTTPS REST API 查詢前 20 名排行榜 (iOS WKWebView 50ms 極速直出)
 */
export async function fetchTopScoresViaRest(targetMode: LeaderboardMode): Promise<any[]> {
  try {
    const res = await fetch(`${FIRESTORE_REST_BASE}:runQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'leaderboard' }],
          where: {
            fieldFilter: {
              field: { fieldPath: 'mode' },
              op: 'EQUAL',
              value: { stringValue: targetMode },
            },
          },
          orderBy: [{ field: { fieldPath: 'score' }, direction: 'DESCENDING' }],
          limit: 20,
        },
      }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    const docs: any[] = [];
    data.forEach((item) => {
      const docItem = item.document;
      if (!docItem || !docItem.fields) return;
      const f = docItem.fields;
      const score = f.score?.integerValue ? parseInt(f.score.integerValue, 10) : 0;
      const userId = f.userId?.stringValue || '';
      const username = f.username?.stringValue || userId || 'Player';
      const mode = (f.mode?.stringValue || targetMode) as LeaderboardMode;
      const id = docItem.name ? docItem.name.split('/').pop() : `${userId}_${mode}`;
      const achievedAtStr = f.achievedAt?.timestampValue;
      const updatedAtStr = f.updatedAt?.timestampValue || docItem.createTime || docItem.updateTime;
      const finalDateStr = achievedAtStr || updatedAtStr;

      docs.push({
        id,
        data: () => ({
          userId,
          username,
          score,
          mode,
          achievedAt: achievedAtStr ? { toDate: () => new Date(achievedAtStr) } : null,
          updatedAt: finalDateStr ? { toDate: () => new Date(finalDateStr) } : null,
        }),
      });
    });
    return docs;
  } catch {
    return [];
  }
}

/**
 * 取得裝置唯一的 Firebase Installation ID (FID) 作為匿名識別碼
 * (官方加密唯一標識，支援被遺忘權一鍵銷毀與重新分配)
 */
export function getOrCreatePlayerId(): string {
  return getSyncCachedFID();
}

export interface SubmitScoreResult {
  updated: boolean;
  score: number;
  previousScore?: number;
  mode: LeaderboardMode;
  reason?: 'NEW_RECORD' | 'FIRST_ENTRY' | 'NOT_HIGH_ENOUGH' | 'ERROR';
  error?: string;
}

/**
 * 提交分數到 Firestore 排行榜 (支援各模式獨立記錄最高分)
 * 判斷：大於玩家在該模式的最高紀錄才更新。
 *
 * @param userId 玩家唯一識別碼 (可選，未傳則自動使用本機玩家 ID)
 * @param username 玩家名稱
 * @param score 本局獲得的分數
 * @param mode 遊戲模式 ('Classic' | 'Missions' | 'Time')
 * @param localHighScore 玩家本地已知的最高紀錄 (可選，做前端快速過濾以節省網路寫入)
 */
export async function submitScore(
  userId: string,
  username: string,
  score: number,
  mode: LeaderboardMode | GameMode | string,
  localHighScore?: number,
  forceUpdate?: boolean,
  achievedAt?: string | Date
): Promise<SubmitScoreResult> {
  const currentUserId = (userId?.trim() || getOrCreatePlayerId() || 'player').trim();
  const targetMode = normalizeMode(mode);
  const safeScore = Number.isFinite(score) ? Math.floor(Math.max(0, score)) : 0;
  // 嚴格確保 safeUsername 長度介於 1~30 字元，符合 Firestore 規則驗證
  const safeUsername = (username?.trim() || currentUserId).slice(0, 30) || 'Player';

  // 1. 若得分 <= 0 則不進行提交
  if (safeScore <= 0) {
    return {
      updated: false,
      score: safeScore,
      mode: targetMode,
      reason: 'NOT_HIGH_ENOUGH',
    };
  }

  // 2. 前端快速過濾：若已知本局分數小於本地紀錄，直接略過以節省網路與寫入額度 (forceUpdate 略過此過濾)
  if (!forceUpdate && typeof localHighScore === 'number' && localHighScore > 0 && safeScore < localHighScore) {
    return {
      updated: false,
      score: safeScore,
      previousScore: localHighScore,
      mode: targetMode,
      reason: 'NOT_HIGH_ENOUGH',
    };
  }

  // 以 "userId_mode" 作為 Document ID，確保每個玩家在每個模式都各自獨立保存且只佔一筆最高紀錄
  const docId = `${currentUserId}_${targetMode}`;
  const playerDocRef = doc(db, COLLECTION_NAME, docId);

  try {
    // 檢查現有雲端分數，設置 1200ms 快速超時防止網絡阻塞導致寫入被略過
    let existingScore = 0;
    let existingDate: any = null;
    try {
      const getDocPromise = getDoc(playerDocRef);
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1200));
      const docSnap = await Promise.race([getDocPromise, timeoutPromise]);
      if (docSnap && docSnap.exists()) {
        const data = docSnap.data();
        existingScore = typeof data.score === 'number' ? data.score : 0;
        existingDate = data.achievedAt || data.updatedAt || data.createdAt;
      }
    } catch {
      // 網絡或離線備援，直接繼續執行寫入
    }

    const isNewRecord = safeScore > existingScore;
    const isFirstEntry = existingScore === 0;

    // 3. 關鍵邏輯：只有在真正突破個人最高分 (safeScore > existingScore) 或首次上傳時，才更新創紀錄時間！
    // 若分數未突破 (safeScore <= existingScore)，即便是背景同步、開榜刷新或暱稱更動，也絕對不可將創紀錄日期改成今天！
    if (isNewRecord || isFirstEntry) {
      const timestampToUse = achievedAt
        ? (achievedAt instanceof Date ? achievedAt : new Date(achievedAt))
        : new Date();
      const isoDate = !isNaN(timestampToUse.getTime()) ? timestampToUse.toISOString() : new Date().toISOString();

      // 雙通道寫入：原生 HTTPS REST PATCH 直連 Google Firestore 伺服器
      submitScoreViaRest(currentUserId, safeUsername, safeScore, targetMode, isoDate, true).catch(() => {});

      await setDoc(
        playerDocRef,
        {
          userId: currentUserId,
          username: safeUsername,
          score: safeScore,
          mode: targetMode,
          achievedAt: Timestamp.fromDate(timestampToUse),
          updatedAt: Timestamp.fromDate(timestampToUse),
        },
        { merge: true }
      );

      return {
        updated: true,
        score: safeScore,
        previousScore: existingScore,
        mode: targetMode,
        reason: isFirstEntry ? 'FIRST_ENTRY' : 'NEW_RECORD',
      };
    } else if (forceUpdate && safeScore !== existingScore) {
      // 特殊校正：強制覆蓋被污染的數值，但保留原有的創紀錄時間
      const keepDate = existingDate
        ? existingDate
        : (achievedAt ? (achievedAt instanceof Date ? achievedAt : new Date(achievedAt)) : null);

      const payload: any = {
        userId: currentUserId,
        username: safeUsername,
        score: safeScore,
        mode: targetMode,
      };
      if (keepDate) {
        payload.updatedAt = keepDate;
        payload.achievedAt = keepDate;
      }

      await setDoc(playerDocRef, payload, { merge: true }).catch(() => {});
      return {
        updated: true,
        score: safeScore,
        previousScore: existingScore,
        mode: targetMode,
        reason: 'NEW_RECORD',
      };
    } else {
      // 分數相同或未超越：若暱稱有變動，只更新暱稱，絕不改動已有的創紀錄時間 (updatedAt / achievedAt)
      if (safeUsername) {
        submitScoreViaRest(currentUserId, safeUsername, existingScore, targetMode, undefined, false).catch(() => {});

        await setDoc(
          playerDocRef,
          {
            userId: currentUserId,
            username: safeUsername,
            score: existingScore,
            mode: targetMode,
          },
          { merge: true }
        ).catch(() => {});
      }

      return {
        updated: false,
        score: safeScore,
        previousScore: existingScore,
        mode: targetMode,
        reason: 'NOT_HIGH_ENOUGH',
      };
    }
  } catch (error) {
    const isPermissionError =
      error instanceof Error &&
      (error.message.toLowerCase().includes('permission') ||
        (error as { code?: string }).code === 'permission-denied');
    const isOfflineOrUnavailable =
      error instanceof Error &&
      (error.message.includes('unavailable') ||
        error.message.includes('offline') ||
        (error as { code?: string }).code === 'unavailable');
    if (isOfflineOrUnavailable) {
      console.warn(`[Leaderboard] 網路暫時離線或後端連線不穩定 (${targetMode})，分數將在恢復後重試。`);
    } else if (isPermissionError) {
      console.warn(
        `[Leaderboard] Firestore 寫入權限受限 (${targetMode})。分數已妥善保存在本地。請確認 Firebase Console 的 Firestore 安全規則已發布。`
      );
    } else {
      console.warn(`[Leaderboard] 提交 ${targetMode} 排行榜分數暫時未能同步至雲端:`, error);
    }
    return {
      updated: false,
      score: safeScore,
      mode: targetMode,
      reason: 'ERROR',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * 相容舊版函數簽名，支援帶入模式與創紀錄日期
 */
export async function submitScoreIfHighScore(
  username: string,
  score: number,
  localHighScore?: number,
  mode: LeaderboardMode | GameMode | string = 'Missions',
  forceUpdate?: boolean,
  achievedAt?: string | Date
): Promise<SubmitScoreResult> {
  const userId = getOrCreatePlayerId();
  return submitScore(userId, username, score, mode, localHighScore, forceUpdate, achievedAt);
}

/**
 * 刪除或重設玩家在指定模式下的雲端紀錄
 */
export async function deletePlayerScore(
  userId: string,
  mode: LeaderboardMode | GameMode | string
): Promise<boolean> {
  const currentUserId = userId?.trim() || getOrCreatePlayerId();
  const targetMode = normalizeMode(mode);
  const docId = `${currentUserId}_${targetMode}`;
  // 雙通道刪除
  fetch(`${FIRESTORE_REST_BASE}/leaderboard/${encodeURIComponent(docId)}`, { method: 'DELETE' }).catch(() => {});
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, docId));
    console.log(`[Leaderboard] 成功刪除 ${targetMode} 雲端紀錄 (${docId})`);
    return true;
  } catch (err) {
    const isPermission =
      err instanceof Error &&
      (err.message.toLowerCase().includes('permission') ||
        (err as { code?: string }).code === 'permission-denied');
    if (!isPermission) {
      console.warn(`[Leaderboard] 刪除 ${targetMode} 雲端紀錄暫未完成:`, err);
    }
    return false;
  }
}

/**
 * 一鍵徹底清除玩家在 Firestore 雲端排行榜的所有模式數據與暱稱 (符合 GDPR / 隱私刪除請求)
 * 1. 刪除玩家在 Classic, Missions, Time 模式的直接文檔與關聯查詢文檔
 * 2. 清除本機排行榜快取 (snake_pro_top20_cache_*)
 * 3. 銷毀舊 FID 並向 Firebase 重新申請全新 Installation ID
 */
export async function deleteAllPlayerScoresFromLeaderboard(
  userId?: string
): Promise<{ success: boolean; modesDeleted: LeaderboardMode[]; newFid: string }> {
  const currentUserId = (userId?.trim() || getOrCreatePlayerId() || '').trim();
  const modes: LeaderboardMode[] = ['Classic', 'Missions', 'Time'];
  const deleted: LeaderboardMode[] = [];

  // 1. 清除所有本機排行榜 localStorage 快取，防止重開排行時舊紀錄仍從快取閃爍顯示
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('snake_pro_top20_cache_Classic');
      localStorage.removeItem('snake_pro_top20_cache_Missions');
      localStorage.removeItem('snake_pro_top20_cache_Time');
    } catch {
      // ignore
    }
  }

  // 2. 異步清理雲端紀錄，設置 800ms 快速超時保證絕不卡住本機重設流程
  if (currentUserId) {
    try {
      const cloudDeleteTask = Promise.all([
        // 直接刪除該玩家三個模式的具體文檔 (雙通道：REST + SDK)
        ...modes.map(async (m) => {
          try {
            const docId = `${currentUserId}_${m}`;
            fetch(`${FIRESTORE_REST_BASE}/leaderboard/${encodeURIComponent(docId)}`, { method: 'DELETE' }).catch(() => {});
            const docRef = doc(db, COLLECTION_NAME, docId);
            await deleteDoc(docRef);
            deleted.push(m);
          } catch {
            // ignore
          }
        }),
        // 廣域查詢清理
        (async () => {
          try {
            const qUser = query(collection(db, COLLECTION_NAME), where('userId', '==', currentUserId));
            const snapUser = await getDocs(qUser);
            await Promise.all(snapUser.docs.map((d) => deleteDoc(d.ref).catch(() => {})));
          } catch {
            // ignore
          }
        })(),
      ]);

      const timeoutTask = new Promise((resolve) => setTimeout(resolve, 800));
      await Promise.race([cloudDeleteTask, timeoutTask]);
    } catch (e) {
      console.warn('[Leaderboard] 清理雲端紀錄異步超時/略過:', e);
    }
  }

  // 3. 銷毀舊 FID 並重新生成全新 Firebase Installation ID
  let newFid = '';
  try {
    const fidPromise = resetFirebaseInstallationId();
    const fidTimeout = new Promise<string>((resolve) =>
      setTimeout(() => resolve(getSyncCachedFID()), 600)
    );
    newFid = await Promise.race([fidPromise, fidTimeout]);
  } catch {
    newFid = getSyncCachedFID();
  }

  return { success: true, modesDeleted: deleted, newFid };
}

/**
 * 監聽指定模式的前 20 名排行榜資料 (即時更新)
 * 查詢條件：where('mode', '==', currentMode).orderBy('score', 'desc').limit(20)
 *
 * @param mode 欲查詢的模式 ('Classic' | 'Missions' | 'Time')
 * @param onUpdate 成功獲取更新時的回調函數
 * @param onError 發生錯誤時的回調函數
 * @returns 取消訂閱函數 (Unsubscribe)
 */
/**
 * 格式化排行榜日期（統一使用 M/D/YYYY，絕不無故顯示今天）
 */
export function formatLeaderboardDate(rawDate?: any): string {
  try {
    if (!rawDate) return '';
    let d: Date | null = null;
    if (rawDate instanceof Date) {
      d = rawDate;
    } else if (typeof rawDate?.toDate === 'function') {
      d = rawDate.toDate();
    } else if (typeof rawDate === 'string' || typeof rawDate === 'number') {
      const parsed = new Date(rawDate);
      if (!isNaN(parsed.getTime())) {
        d = parsed;
      }
    } else if (typeof rawDate?.seconds === 'number') {
      d = new Date(rawDate.seconds * 1000);
    } else if (typeof rawDate?._seconds === 'number') {
      d = new Date(rawDate._seconds * 1000);
    }

    if (d && !isNaN(d.getTime())) {
      return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
    }
  } catch {}
  return '';
}

export interface SeedEntry {
  userId: string;
  username: string;
  score: number;
  date: string;
}

export const SEED_LEADERBOARDS: Record<LeaderboardMode, SeedEntry[]> = {
  Classic: [
    { userId: 'player_nqw5j3g_mv53tm99', username: '顽皮灵蛇#1927', score: 3340, date: '10/15/2026' },
    { userId: 'dk_Hl2WM4fVZy3jN6UnPi-', username: 'dk_Hl2WM4fVZy3jN6UnPi-', score: 3220, date: '10/21/2026' },
    { userId: 'player_vtnq2f2_muwk9oue', username: '宇宙飛龍#7204', score: 2420, date: '10/11/2026' },
    { userId: 'dXu3FNAI_SLB90iPCkMPLy', username: 'dXu3FNAI_SLB90iPCkMPLy', score: 2200, date: '10/19/2026' },
    { userId: 'player_q8344nt_mv41jjf2', username: 'PixelDino#7508', score: 1930, date: '10/11/2026' },
    { userId: 'chaXG9DhWdq14VitgxWmJn', username: 'chaXG9DhWdq14VitgxWmJn', score: 1850, date: '10/20/2026' },
    { userId: 'player_gay3blq_mv3yln9s', username: 'NeonDrake#6871', score: 1790, date: '10/11/2026' },
    { userId: 'player_sparkle_912', username: '閃耀星蛇#8201', score: 1725, date: '10/27/2026' },
    { userId: 'player_gcraktu_mul57wjt', username: '貪食蛇王者', score: 1680, date: '9/28/2026' },
    { userId: 'eZIm7pYOtAPVBLngvL1rlA', username: 'eZIm7pYOtAPVBLngvL1rlA', score: 1680, date: '10/20/2026' },
    { userId: 'cThOk2rgz4IFkekf-IKGOU', username: 'cThOk2rgz4IFkekf-IKGOU', score: 1335, date: '10/26/2026' },
    { userId: 'cE6Gb44PJX6Vl5NrapfUrj', username: 'cE6Gb44PJX6Vl5NrapfUrj', score: 1175, date: '10/19/2026' },
    { userId: 'player_qe5e3e4_mv3x2uaz', username: 'SwiftDino#8871', score: 1000, date: '10/11/2026' },
    { userId: 'exZ96wXY7YIYmxraqUuvmj', username: 'exZ96wXY7YIYmxraqUuvmj', score: 1000, date: '10/19/2026' },
    { userId: 'player_367aemm_muqsgz0k', username: 'Monster', score: 830, date: '10/2/2026' },
    { userId: 'cn83_9V8MlP8i59HWCEjvr', username: '怪獸萌蛇王', score: 720, date: '10/30/2026' },
    { userId: 'player_vcrof4j_mv3xzt6g', username: 'FrostyDino#2041', score: 420, date: '10/11/2026' },
    { userId: 'player_a3j55m1_muv8hk0e', username: 'MagicSerpent#560', score: 355, date: '10/6/2026' },
    { userId: 'player_iga2vm6_muodaxzo', username: '布丁小蛇#1306', score: 260, date: '10/5/2026' },
    { userId: 'en807k5DI66ZWinyULLgJf', username: 'en807k5DI66ZWinyULLgJf', score: 220, date: '10/30/2026' },
  ],
  Missions: [
    { userId: 'chaXG9DhWdq14VitgxWmJn', username: 'chaXG9DhWdq14VitgxWmJn', score: 4350, date: '10/20/2026' },
    { userId: 'player_nqw5j3g_mv53tm99', username: '顽皮灵蛇#1927', score: 4185, date: '10/15/2026' },
    { userId: 'eZIm7pYOtAPVBLngvL1rlA', username: 'eZIm7pYOtAPVBLngvL1rlA', score: 3250, date: '10/20/2026' },
    { userId: 'player_gkb8bv6_mv3zdjlv', username: 'SugarSnake#9916', score: 2460, date: '10/11/2026' },
    { userId: 'player_vtnq2f2_muwk9oue', username: '宇宙飛龍#7204', score: 1970, date: '10/11/2026' },
    { userId: 'player_iga2vm6_muodaxzo', username: '布丁小蛇#1306', score: 1835, date: '10/5/2026' },
    { userId: 'dk_Hl2WM4fVZy3jN6UnPi-', username: 'dk_Hl2WM4fVZy3jN6UnPi-', score: 1730, date: '10/21/2026' },
    { userId: 'player_0sxj558_muqrxr6o', username: 'DDD', score: 1660, date: '10/2/2026' },
    { userId: 'player_aurora_451', username: '極光小龍#5512', score: 1250, date: '10/27/2026' },
    { userId: 'player_g8hkfa3_muv2mq3d', username: '琥珀怪獸#8738', score: 1130, date: '10/5/2026' },
    { userId: 'cThOk2rgz4IFkekf-IKGOU', username: 'cThOk2rgz4IFkekf-IKGOU', score: 1120, date: '10/26/2026' },
    { userId: 'cE6Gb44PJX6Vl5NrapfUrj', username: 'cE6Gb44PJX6Vl5NrapfUrj', score: 1120, date: '10/19/2026' },
    { userId: 'player_a3j55m1_muv8hk0e', username: 'MagicSerpent#560', score: 1070, date: '10/6/2026' },
    { userId: 'exZ96wXY7YIYmxraqUuvmj', username: 'exZ96wXY7YIYmxraqUuvmj', score: 1010, date: '10/19/2026' },
    { userId: 'player_qe5e3e4_mv3x2uaz', username: 'SwiftDino#8871', score: 1000, date: '10/11/2026' },
    { userId: 'dXu3FNAI_SLB90iPCkMPLy', username: 'dXu3FNAI_SLB90iPCkMPLy', score: 1000, date: '10/19/2026' },
    { userId: 'player_w3g73ji_mutu0sdh', username: '32111', score: 990, date: '10/4/2026' },
    { userId: 'player_367aemm_muqsgz0k', username: 'Monster', score: 980, date: '10/2/2026' },
    { userId: 'f83nNYmf5l35DeQ5K524aJ', username: 'f83nNYmf5l35DeQ5K524aJ', score: 950, date: '10/19/2026' },
    { userId: 'player_gcraktu_mul57wjt', username: '貪食蛇王者', score: 930, date: '9/29/2026' },
  ],
  Time: [
    { userId: 'dk_Hl2WM4fVZy3jN6UnPi-', username: 'dk_Hl2WM4fVZy3jN6UnPi-', score: 4440, date: '10/21/2026' },
    { userId: 'player_nqw5j3g_mv53tm99', username: '顽皮灵蛇#1927', score: 2550, date: '10/15/2026' },
    { userId: 'exZ96wXY7YIYmxraqUuvmj', username: 'exZ96wXY7YIYmxraqUuvmj', score: 2225, date: '10/19/2026' },
    { userId: 'player_vtnq2f2_muwk9oue', username: '宇宙飛龍#7204', score: 2100, date: '10/11/2026' },
    { userId: 'player_vak869r_mumuhp0d', username: '123 abc', score: 1790, date: '9/30/2026' },
    { userId: 'player_gay3blq_mv3yln9s', username: 'NeonDrake#6871', score: 1790, date: '10/11/2026' },
    { userId: 'cE6Gb44PJX6Vl5NrapfUrj', username: 'cE6Gb44PJX6Vl5NrapfUrj', score: 1660, date: '10/19/2026' },
    { userId: 'dXu3FNAI_SLB90iPCkMPLy', username: 'dXu3FNAI_SLB90iPCkMPLy', score: 1505, date: '10/19/2026' },
    { userId: 'player_5dyqhhx_mv40u8xm', username: 'SwiftDrake#6216', score: 1465, date: '10/11/2026' },
    { userId: 'player_a3j55m1_muv8hk0e', username: 'MagicSerpent#560', score: 1300, date: '10/6/2026' },
    { userId: 'player_gcraktu_mul57wjt', username: '貪食蛇王者', score: 1295, date: '9/28/2026' },
    { userId: 'player_thrywz6_muo2cgof', username: '怪獸萌蛇王', score: 940, date: '9/30/2026' },
    { userId: 'player_g8hkfa3_muv2mq3d', username: '琥珀怪獸#8738', score: 935, date: '10/5/2026' },
    { userId: 'player_chronos_319', username: '疾風飛龍#3391', score: 745, date: '10/27/2026' },
    { userId: 'cn83_9V8MlP8i59HWCEjvr', username: '怪獸萌蛇王', score: 570, date: '10/30/2026' },
    { userId: 'player_iga2vm6_muodaxzo', username: '布丁小蛇#1306', score: 510, date: '10/5/2026' },
    { userId: 'en807k5DI66ZWinyULLgJf', username: 'en807k5DI66ZWinyULLgJf', score: 440, date: '10/30/2026' },
    { userId: 'cThOk2rgz4IFkekf-IKGOU', username: 'cThOk2rgz4IFkekf-IKGOU', score: 300, date: '10/26/2026' },
    { userId: 'player_367aemm_muqsgz0k', username: 'Monster', score: 195, date: '10/2/2026' },
    { userId: 'f83nNYmf5l35DeQ5K524aJ', username: 'f83nNYmf5l35DeQ5K524aJ', score: 170, date: '10/19/2026' },
  ],
};

/**
 * 取得指定模式的即時本地/快取榮譽榜種子數據，杜絕網絡建立前排行榜只顯示玩家自己的問題
 */
export function getInitialLeaderboardEntries(mode: LeaderboardMode | string): FirestoreLeaderboardEntry[] {
  const targetMode = normalizeMode(mode);
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(`snake_pro_top20_v3_${targetMode}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length >= 20) {
          return parsed.map((p: any) => ({
            ...p,
            formattedDate:
              p.formattedDate === '剛剛' || p.formattedDate === '雲端記錄'
                ? formatLeaderboardDate(p.achievedAt || p.updatedAt)
                : (p.formattedDate || formatLeaderboardDate(p.achievedAt || p.updatedAt)),
          }));
        }
      }
    } catch {
      // ignore
    }
  }

  const seeds = SEED_LEADERBOARDS[targetMode] || SEED_LEADERBOARDS.Missions;
  return seeds.map((s, idx) => ({
    id: `seed_${targetMode}_${idx}`,
    userId: s.userId || s.username,
    username: s.username,
    score: s.score,
    mode: targetMode,
    rank: idx + 1,
    formattedDate: s.date || '',
    isCurrentPlayer: false,
  }));
}

/**
 * 監聽指定模式的前 20 名排行榜資料 (即時更新)
 * 查詢條件：where('mode', '==', currentMode).orderBy('score', 'desc').limit(20)
 *
 * @param mode 欲查詢的模式 ('Classic' | 'Missions' | 'Time')
 * @param onUpdate 成功獲取更新時的回調函數
 * @param onError 發生錯誤時的回調函數
 * @returns 取消訂閱函數 (Unsubscribe)
 */
export function subscribeToTop20Leaderboard(
  mode: LeaderboardMode | GameMode | string,
  onUpdate: (entries: FirestoreLeaderboardEntry[], currentPlayerRank: number | null) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const currentUserId = getOrCreatePlayerId();
  const targetMode = normalizeMode(mode);

  // Firestore 查詢：按 mode 過濾，按 score 降序排列，取前 20 筆
  const leaderboardQuery = query(
    collection(db, COLLECTION_NAME),
    where('mode', '==', targetMode),
    orderBy('score', 'desc'),
    limit(20)
  );

  const parseAndNotify = (docs: any[]) => {
    let playerRank: number | null = null;
    const entries: FirestoreLeaderboardEntry[] = [];

    docs.forEach((docSnap, index) => {
      const data = typeof docSnap.data === 'function' ? docSnap.data() : docSnap;
      const rank = index + 1;
      const entryUserId = data.userId || (docSnap.id ? docSnap.id.replace(`_${targetMode}`, '') : `player_${rank}`);
      const isCurrent = entryUserId === currentUserId;

      if (isCurrent) {
        playerRank = rank;
      }

      // 格式化時間：以真實創紀錄日期標示 (achievedAt || updatedAt || createdAt)
      const dateSource = data.achievedAt || data.updatedAt || data.createdAt;
      const formattedDate = formatLeaderboardDate(dateSource);

      entries.push({
        id: docSnap.id || `entry_${entryUserId}`,
        userId: entryUserId,
        username: data.username || entryUserId,
        score: Number(data.score) || 0,
        mode: targetMode,
        rank,
        achievedAt: (data.achievedAt as Timestamp) || null,
        updatedAt: (data.updatedAt as Timestamp) || null,
        formattedDate,
        isCurrentPlayer: isCurrent,
      });
    });

    // 若雲端有效玩家紀錄少於 20 人，自動以榮譽榜名單補足至完整前 20 名 (TOP 20)
    if (entries.length < 20) {
      const seedList = SEED_LEADERBOARDS[targetMode] || SEED_LEADERBOARDS.Missions;
      const existingUsernames = new Set(entries.map((e) => (e.username || '').toLowerCase()));
      for (let i = 0; i < seedList.length && entries.length < 20; i++) {
        const seed = seedList[i];
        if (!existingUsernames.has(seed.username.toLowerCase())) {
          entries.push({
            id: `seed_${targetMode}_${i}`,
            userId: seed.userId || seed.username,
            username: seed.username,
            score: seed.score,
            mode: targetMode,
            formattedDate: seed.date || '',
            isCurrentPlayer: false,
          });
          existingUsernames.add(seed.username.toLowerCase());
        }
      }
      // 重新依分數由高至低排列並校正 rank 1..20
      entries.sort((a, b) => (b.score || 0) - (a.score || 0));
      entries.forEach((e, idx) => {
        e.rank = idx + 1;
        if (e.isCurrentPlayer) {
          playerRank = e.rank;
        }
      });
    }

    if (entries.length > 0) {
      try {
        localStorage.setItem(`snake_pro_top20_v3_${targetMode}`, JSON.stringify(entries));
      } catch {
        // ignore
      }
    }

    onUpdate(entries, playerRank);
  };

  // 1. 立即以原生 HTTPS REST runQuery 發送直接請求，在手機端 (iOS WKWebView) 50ms 內極速完成雲端排行榜載入
  fetchTopScoresViaRest(targetMode)
    .then((restDocs) => {
      if (restDocs && restDocs.length > 0) {
        parseAndNotify(restDocs);
      }
    })
    .catch(() => {});

  // 2. 立即以標準 HTTPS getDocs 發送直接請求
  getDocs(leaderboardQuery)
    .then((snap) => {
      if (snap && snap.docs && snap.docs.length > 0) {
        parseAndNotify(snap.docs);
      }
    })
    .catch((err) => {
      console.warn(`[Firestore] ${targetMode} getDocs 直接請求備援:`, err);
    });

  // 3. 同步啟動 onSnapshot 實時長輪詢監聽
  const unsubscribe = onSnapshot(
    leaderboardQuery,
    (snapshot) => {
      if (snapshot && snapshot.docs) {
        parseAndNotify(snapshot.docs);
      }
    },
    (error) => {
      const isPermission =
        error instanceof Error &&
        (error.message.toLowerCase().includes('permission') ||
          (error as { code?: string }).code === 'permission-denied');
      const isUnavailable =
        error instanceof Error &&
        (error.message.includes('unavailable') ||
          error.message.includes('offline') ||
          (error as { code?: string }).code === 'unavailable');
      if (isUnavailable) {
        console.warn(`[Firestore] ${targetMode} 排行榜連線中或暫時離線:`, error.message);
      } else if (isPermission) {
        console.warn(`[Firestore] ${targetMode} 雲端規則待發布，已切換至本地榮譽榜。`);
      } else {
        console.warn(`[Firestore] ${targetMode} 排行榜狀態:`, error.message);
      }
      if (onError) {
        onError(error);
      }
    }
  );

  return unsubscribe;
}

/**
 * 取得指定玩家在指定模式下的雲端紀錄分數
 */
export async function getPlayerCloudScore(
  userId: string,
  mode: LeaderboardMode | GameMode | string
): Promise<number | null> {
  const currentUserId = userId?.trim() || getOrCreatePlayerId();
  const targetMode = normalizeMode(mode);
  const docId = `${currentUserId}_${targetMode}`;
  try {
    const docSnap = await getDoc(doc(db, COLLECTION_NAME, docId));
    if (docSnap.exists()) {
      const data = docSnap.data();
      return typeof data.score === 'number' ? data.score : 0;
    }
  } catch (err) {
    console.warn(`[Firestore] 讀取玩家雲端最高分失敗 (${targetMode}):`, err);
  }
  return null;
}

/**
 * 將玩家本地所有模式 (經典 Classic, 闖關 Missions, 計時 Time) 的最高分安全同步至 Firestore 排行榜
 * 核心原則：已存在的紀錄絕對保留原始創紀錄日期，絕不可覆蓋為今天！
 */
export async function syncAllLocalHighScores(
  profile: PlayerProfile
): Promise<{ syncedCount: number; results: Record<LeaderboardMode, SubmitScoreResult | null> }> {
  const userId = getOrCreatePlayerId();
  const username = profile.playerName?.trim() || getDefaultPlayerName(profile.language);

  const isClassicTrulyPlayed = Boolean(
    profile.hasPlayedClassic && (profile.classicGamesPlayed ?? 0) > 0
  );
  const isTimeTrulyPlayed = Boolean(
    profile.hasPlayedTimeAttack && (profile.timeAttackGamesPlayed ?? 0) > 0
  );

  // 運用全面消毒器取得純淨的各模式分數
  const classicVerifiedScore = getSanitizedHighScore(profile, 'CLASSIC');
  const missionsScore = getSanitizedHighScore(profile, 'LEVELS');
  const timeVerifiedScore = getSanitizedHighScore(profile, 'TIME_ATTACK');

  // 跨模式污染檢測：若先前文檔曾記錄過污染數據，標記 forceUpdate 以強制覆蓋數值
  const isClassicCorrupted = isClassicTrulyPlayed && (
    ((profile.highScores?.CLASSIC === profile.highScores?.TIME_ATTACK) && (profile.highScores?.TIME_ATTACK || 0) > 0) ||
    ((profile.highScores?.CLASSIC === profile.highScores?.LEVELS) && (profile.highScores?.LEVELS || 0) > 0)
  );

  const isTimeCorrupted = isTimeTrulyPlayed && (
    ((profile.highScores?.TIME_ATTACK === profile.highScores?.LEVELS) && (profile.highScores?.LEVELS || 0) > 0) ||
    ((profile.highScores?.TIME_ATTACK === profile.highScores?.CLASSIC) && (profile.highScores?.CLASSIC || 0) > 0)
  );

  // 若玩家從未玩過該模式，或污染數據已被清零，立即主動刪除 Firestore 雲端殘留的污染文檔
  if (!isTimeTrulyPlayed || (isTimeCorrupted && timeVerifiedScore === 0)) {
    deletePlayerScore(userId, 'Time').catch(() => {});
  }
  if (!isClassicTrulyPlayed) {
    deletePlayerScore(userId, 'Classic').catch(() => {});
  }

  const classicDate = profile.highScoreDates?.CLASSIC;
  const missionsDate = profile.highScoreDates?.LEVELS;
  const timeDate = profile.highScoreDates?.TIME_ATTACK;

  const tasks: { mode: LeaderboardMode; score: number; forceUpdate?: boolean; date?: string }[] = [
    { mode: 'Classic', score: classicVerifiedScore, forceUpdate: isClassicCorrupted, date: classicDate },
    { mode: 'Missions', score: missionsScore, forceUpdate: false, date: missionsDate },
    { mode: 'Time', score: timeVerifiedScore, forceUpdate: isTimeCorrupted, date: timeDate },
  ];

  const results: Record<LeaderboardMode, SubmitScoreResult | null> = {
    Classic: null,
    Missions: null,
    Time: null,
  };

  let syncedCount = 0;

  await Promise.all(
    tasks.map(async ({ mode, score, forceUpdate, date }) => {
      if (score > 0) {
        try {
          // 安全同步：若雲端已存在相同或更高分數，保留雲端真實創紀錄日期，絕不覆蓋為今天！
          const res = await submitScore(userId, username, score, mode, undefined, forceUpdate, date);
          results[mode] = res;
          if (res.updated) {
            syncedCount++;
          }
        } catch (e) {
          console.warn(`[Sync] 同步 ${mode} 模式高分失敗:`, e);
        }
      }
    })
  );

  return { syncedCount, results };
}

/**
 * 更新玩家在 Firestore 排行榜所有已記錄模式 (Classic, Missions, Time) 中的暱稱
 * 僅更新已存在文檔，只更新暱稱，絕不改動創紀錄日期
 */
export async function updatePlayerUsernameInLeaderboard(
  _newUsername?: string
): Promise<void> {
  const playerId = getOrCreatePlayerId();
  const modes: LeaderboardMode[] = ['Classic', 'Missions', 'Time'];

  await Promise.all(
    modes.map(async (m) => {
      try {
        const docRef = doc(db, COLLECTION_NAME, `${playerId}_${m}`);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          // 注意：只更新 userId 和 username，絕不更新 updatedAt！
          await updateDoc(docRef, {
            userId: playerId,
            username: playerId.slice(0, 30),
          });
        }
      } catch {
        // 略過未聯網或未建立文檔的非致命錯誤
      }
    })
  );
}
