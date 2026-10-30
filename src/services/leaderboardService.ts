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
  forceUpdate?: boolean
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
    const docSnap = await getDoc(playerDocRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const existingScore = typeof data.score === 'number' ? data.score : 0;

      // 3. 判斷：若大於玩家最高紀錄才更新，或 forceUpdate 強制校正污染數據
      if (safeScore > existingScore || forceUpdate) {
        await updateDoc(playerDocRef, {
          userId: currentUserId,
          username: safeUsername,
          score: safeScore,
          mode: targetMode,
          updatedAt: serverTimestamp(),
        });

        return {
          updated: true,
          score: safeScore,
          previousScore: existingScore,
          mode: targetMode,
          reason: 'NEW_RECORD',
        };
      } else {
        // 如果分數沒突破，但使用者更新了暱稱，順便更新暱稱（必須傳齊 mode 與 score 以符合安全規則）
        if (data.username !== safeUsername) {
          await updateDoc(playerDocRef, {
            userId: currentUserId,
            username: safeUsername,
            score: existingScore,
            mode: targetMode,
            updatedAt: serverTimestamp(),
          }).catch(() => {});
        }

        return {
          updated: false,
          score: safeScore,
          previousScore: existingScore,
          mode: targetMode,
          reason: 'NOT_HIGH_ENOUGH',
        };
      }
    } else {
      // 4. 初次在該模式上傳紀錄
      await setDoc(playerDocRef, {
        userId: currentUserId,
        username: safeUsername,
        score: safeScore,
        mode: targetMode,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return {
        updated: true,
        score: safeScore,
        mode: targetMode,
        reason: 'FIRST_ENTRY',
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
 * 相容舊版函數簽名，支援帶入模式
 */
export async function submitScoreIfHighScore(
  username: string,
  score: number,
  localHighScore?: number,
  mode: LeaderboardMode | GameMode | string = 'Missions',
  forceUpdate?: boolean
): Promise<SubmitScoreResult> {
  const userId = getOrCreatePlayerId();
  return submitScore(userId, username, score, mode, localHighScore, forceUpdate);
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
 * 並銷毀舊 FID 向 Firebase 重新申請全新 Installation ID
 */
export async function deleteAllPlayerScoresFromLeaderboard(
  userId?: string
): Promise<{ success: boolean; modesDeleted: LeaderboardMode[]; newFid: string }> {
  const currentUserId = userId?.trim() || getOrCreatePlayerId();
  const modes: LeaderboardMode[] = ['Classic', 'Missions', 'Time'];
  const deleted: LeaderboardMode[] = [];

  await Promise.all(
    modes.map(async (m) => {
      try {
        const ok = await deletePlayerScore(currentUserId, m);
        if (ok) deleted.push(m);
      } catch {
        // ignore
      }
    })
  );

  // 銷毀舊 FID 並重新生成全新 Firebase Installation ID
  const newFid = await resetFirebaseInstallationId();

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
    { userId: 'cLkoWQTKM1YVUoTfmCgNNj', username: 'cLkoWQTKM1YVUoTfmCgNNj', score: 1725, date: '10/27/2026' },
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
    { userId: 'cLkoWQTKM1YVUoTfmCgNNj', username: 'cLkoWQTKM1YVUoTfmCgNNj', score: 1250, date: '10/27/2026' },
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
    { userId: 'cLkoWQTKM1YVUoTfmCgNNj', username: 'cLkoWQTKM1YVUoTfmCgNNj', score: 745, date: '10/27/2026' },
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
      const cached = localStorage.getItem(`snake_pro_top20_cache_${targetMode}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length >= 20) {
          return parsed.map((p: any) => ({
            ...p,
            formattedDate: p.formattedDate === '雲端記錄' ? '' : (p.formattedDate || ''),
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

      // 格式化時間
      let formattedDate = '剛剛';
      if (data.updatedAt instanceof Timestamp) {
        const date = data.updatedAt.toDate();
        formattedDate = date.toLocaleDateString();
      }

      entries.push({
        id: docSnap.id || `entry_${entryUserId}`,
        userId: entryUserId,
        username: data.username || entryUserId,
        score: Number(data.score) || 0,
        mode: targetMode,
        rank,
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
        localStorage.setItem(`snake_pro_top20_cache_${targetMode}`, JSON.stringify(entries));
      } catch {
        // ignore
      }
    }

    onUpdate(entries, playerRank);
  };

  // 1. 立即以標準 HTTPS getDocs 發送直接請求，在手機端秒級完成數據載入
  getDocs(leaderboardQuery)
    .then((snap) => {
      if (snap && snap.docs && snap.docs.length > 0) {
        parseAndNotify(snap.docs);
      }
    })
    .catch((err) => {
      console.warn(`[Firestore] ${targetMode} getDocs 直接請求備援:`, err);
    });

  // 2. 同步啟動 onSnapshot 實時長輪詢監聽
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
 * 一鍵將玩家本地所有模式 (經典 Classic, 闖關 Missions, 計時 Time) 的最高分自動同步至 Firestore 排行榜
 * 確保已取得的高分不會只留存在本機，而是順利進入雲端排行榜
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

  // 跨模式污染檢測：若先前文檔曾記錄過污染數據，標記 forceUpdate 以強制覆蓋
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

  const tasks: { mode: LeaderboardMode; score: number; forceUpdate?: boolean }[] = [
    { mode: 'Classic', score: classicVerifiedScore, forceUpdate: isClassicCorrupted },
    { mode: 'Missions', score: missionsScore },
    { mode: 'Time', score: timeVerifiedScore, forceUpdate: isTimeCorrupted },
  ];

  const results: Record<LeaderboardMode, SubmitScoreResult | null> = {
    Classic: null,
    Missions: null,
    Time: null,
  };

  let syncedCount = 0;

  await Promise.all(
    tasks.map(async ({ mode, score, forceUpdate }) => {
      if (score > 0) {
        try {
          const res = await submitScore(userId, username, score, mode, undefined, forceUpdate);
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
 * 僅更新已存在文檔，絕不在未玩過或未記錄模式建立假紀錄
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
          const data = snap.data();
          await updateDoc(docRef, {
            userId: playerId,
            username: playerId.slice(0, 30),
            score: typeof data.score === 'number' ? data.score : 0,
            mode: m,
            updatedAt: serverTimestamp(),
          });
        }
      } catch {
        // 略過未聯網或未建立文檔的非致命錯誤
      }
    })
  );
}
