import React, { useState, useEffect, useMemo } from 'react';
import { GameMode, PlayerProfile } from '../types';
import {
  subscribeToTop20Leaderboard,
  FirestoreLeaderboardEntry,
  LeaderboardMode,
  normalizeMode,
  getOrCreatePlayerId,
  submitScore,
  syncAllLocalHighScores,
  getPlayerCloudScore,
  deletePlayerScore,
} from '../services/leaderboardService';
import { soundEngine } from '../utils/audio';
import { SupportedLanguage, getTranslation } from '../utils/i18n';
import { getSanitizedHighScore, isCloudScoreContaminated } from '../utils/scoreIsolation';
import { CuteModalBackground } from './CuteModalBackground';
import {
  X,
  Trophy,
  Clock,
  Sparkles,
  Map,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';

export const FIRESTORE_RECOMMENDED_RULES = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /leaderboard/{entryId} {
      allow read, write: if true;
    }
  }
}`;

interface LeaderboardModalProps {
  isOpen: boolean;
  profile: PlayerProfile;
  initialMode?: GameMode;
  language?: SupportedLanguage;
  onClose: () => void;
  onUpdateProfile: React.Dispatch<React.SetStateAction<PlayerProfile>>;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  profile,
  initialMode = 'LEVELS',
  language = 'zh-HK',
  onClose,
  onUpdateProfile,
}) => {
  // 3 個模式切換：預設打開『闖關』('Missions')，其次為『經典』('Classic')，最右為『計時』('Time')
  const [activeMode, setActiveMode] = useState<LeaderboardMode>(() =>
    normalizeMode(initialMode || 'LEVELS')
  );

  const playerFid = getOrCreatePlayerId();

  // Firestore 即時排行榜狀態
  const [entries, setEntries] = useState<FirestoreLeaderboardEntry[]>([]);
  const [playerRank, setPlayerRank] = useState<number | null>(null);
  const [playerCloudScore, setPlayerCloudScore] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [indexUrl, setIndexUrl] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [showRulesGuide, setShowRulesGuide] = useState<boolean>(false);
  const [rulesCopied, setRulesCopied] = useState<boolean>(false);

  // 每次打開排行榜時，預設顯示『闖關』模式
  useEffect(() => {
    if (isOpen) {
      setActiveMode(initialMode ? normalizeMode(initialMode) : 'Missions');
      setEntries([]);
      setPlayerRank(null);
      setPlayerCloudScore(null);
    }
  }, [isOpen, initialMode]);

  const isClassicUnplayed = !profile.hasPlayedClassic || (profile.classicGamesPlayed ?? 0) <= 0;
  const isTimeUnplayed = !profile.hasPlayedTimeAttack || (profile.timeAttackGamesPlayed ?? 0) <= 0;
  const isMissionsUnplayed =
    (!profile.completedLevels || profile.completedLevels.length === 0) &&
    (!profile.hasPlayedMissions || (profile.missionsGamesPlayed ?? 0) <= 0) &&
    (profile.highScores?.LEVELS ?? 0) <= 0;

  const isCurrentModeUnplayed =
    (activeMode === 'Classic' && isClassicUnplayed) ||
    (activeMode === 'Time' && isTimeUnplayed) ||
    (activeMode === 'Missions' && isMissionsUnplayed);

  // 取得玩家在目前模式的純淨個人最高分（全面防止跨模式洩漏）
  const getPlayerScoreForMode = (targetMode: LeaderboardMode): number => {
    return getSanitizedHighScore(profile, targetMode);
  };

  const currentModeScore = isCurrentModeUnplayed ? 0 : getPlayerScoreForMode(activeMode);

  // 當開啟排行榜或切換模式時，自動將本地已有的個人最高分同步至 Firestore
  // 解決玩家在通關或刷新本地紀錄時（如 985 分）尚未成功提交至雲端的問題
  useEffect(() => {
    if (!isOpen) return;
    if (isCurrentModeUnplayed) return;

    const currentScore = getPlayerScoreForMode(activeMode);
    if (currentScore > 0) {
      const userId = getOrCreatePlayerId();
      submitScore(userId, userId, currentScore, activeMode)
        .then((res) => {
          if (res.updated) {
            console.log(`[Leaderboard] 自動同步 ${activeMode} 高分 (${res.score}) 至排行榜成功！`);
          }
        })
        .catch((err) => {
          console.warn(`[Leaderboard] 自動同步 ${activeMode} 高分失敗:`, err);
        });
    }

    // 同時在背景靜態補交所有模式最高分
    syncAllLocalHighScores(profile).catch(() => {});
  }, [isOpen, activeMode, isCurrentModeUnplayed]);

  // 當 modal 開啟或模式切換時，監聽 Firestore 對應模式前 20 名
  // collection('leaderboard').where('mode', '==', activeMode).orderBy('score', 'desc').limit(20)
  useEffect(() => {
    if (!isOpen) return;

    let isSubscribed = true;
    setIsLoading(true);
    setErrorMessage(null);
    setIndexUrl(null);

    const unsubscribe = subscribeToTop20Leaderboard(
      activeMode,
      (newEntries, currentRank) => {
        if (!isSubscribed) return;
        // 安全防護：若玩家尚未玩過該模式，過濾掉任何舊版誤寫入的自己個人紀錄
        const sanitizedEntries = isCurrentModeUnplayed
          ? newEntries.filter((e) => !e.isCurrentPlayer)
          : newEntries;
        const sanitizedRank = isCurrentModeUnplayed ? null : currentRank;

        setEntries(sanitizedEntries);
        setPlayerRank(sanitizedRank);
        setIsLoading(false);
        setIsConnected(true);
        setErrorMessage(null);

        if (isCurrentModeUnplayed) {
          setPlayerCloudScore(0);
        } else {
          // 檢查排行榜前 20 名中是否有玩家自己的記錄
          const currentMe = sanitizedEntries.find((e) => e.isCurrentPlayer);
          if (currentMe && typeof currentMe.score === 'number' && currentMe.score > 0) {
            setPlayerCloudScore(currentMe.score);
          } else {
            // 若不在前 20 名，從雲端單獨讀取該玩家的個人最高分紀錄
            const uid = getOrCreatePlayerId();
            getPlayerCloudScore(uid, activeMode).then((cScore) => {
              if (!isSubscribed) return;
              if (typeof cScore === 'number' && cScore > 0) {
                setPlayerCloudScore(cScore);
              }
            });
          }
        }
      },
      (err) => {
        if (!isSubscribed) return;
        console.warn(`[Firestore] ${activeMode} 模式排行榜載入錯誤:`, err);
        setIsLoading(false);
        setIsConnected(false);

        const msg = err.message || '';
        const isUnavailable =
          msg.includes('unavailable') ||
          msg.includes('offline') ||
          (err as { code?: string }).code === 'unavailable';

        // 檢查是否為需要建立複合索引 (Composite Index) 的提示
        const matchUrl = msg.match(/https:\/\/console\.firebase\.google\.com[^\s]*/);
        if (matchUrl) {
          setIndexUrl(matchUrl[0]);
          setErrorMessage(
            language === 'en'
              ? 'Firestore requires an index for this query. Click below to create it in Firebase Console.'
              : '此查詢需要建立 Firestore 複合索引 (mode + score DESC)。請點擊下方連結前往 Firebase 控制台一鍵建立：'
          );
        } else if (isUnavailable) {
          setErrorMessage(
            language === 'en'
              ? 'Cloud leaderboard connection is reconnecting. Tap retry below.'
              : language === 'ja'
              ? 'クラウドランキングに再接続中... 下記ボタンで再試行してください。'
              : '雲端排行榜正在重新連線，請點擊下方按鈕重試。'
          );
        } else {
          setErrorMessage(
            language === 'en'
              ? 'Failed to load leaderboard data. Please check network and Firestore rules.'
              : '無法讀取排行榜資料，請確認網路連線與 Firestore 安全規則。'
          );
        }
      }
    );

    return () => {
      isSubscribed = false;
      unsubscribe();
    };
  }, [isOpen, activeMode, language, retryCount]);


  const handleTabChange = (mode: LeaderboardMode) => {
    soundEngine.playClick();
    setActiveMode(mode);
    setEntries([]); // 立即清空，防止切換標籤時因非同步前一模式名單洩漏自己的紀錄
    setPlayerRank(null);
    setPlayerCloudScore(null);
    setIsLoading(true);
  };

  // 找出目前玩家在排行榜或雲端紀錄的最高分
  const currentPlayerInTop20 = isCurrentModeUnplayed ? undefined : entries.find((e) => e.isCurrentPlayer);
  const rawCloudScore = isCurrentModeUnplayed ? 0 : (currentPlayerInTop20 ? currentPlayerInTop20.score : (playerCloudScore ?? 0));

  const timeAttackHighScore = getSanitizedHighScore(profile, 'TIME_ATTACK');
  const classicHighScore = getSanitizedHighScore(profile, 'CLASSIC');
  const missionsHighScore = getSanitizedHighScore(profile, 'LEVELS');

  // 全面雲端分數安全防禦：
  // 檢驗該模式的雲端紀錄是否為跨模式污染或重設前舊紀錄
  const isCloudContaminated = isCloudScoreContaminated(rawCloudScore, activeMode, profile);

  // 若發現雲端是殘留污染紀錄或重設前舊分數，主動從 Firestore 覆蓋為當前真實分數或刪除舊紀錄
  useEffect(() => {
    if (isOpen && !isCurrentModeUnplayed && isCloudContaminated) {
      const uid = getOrCreatePlayerId();
      if (currentModeScore > 0) {
        submitScore(uid, uid, currentModeScore, activeMode, undefined, true).catch(() => {});
      } else {
        deletePlayerScore(uid, activeMode).catch(() => {});
      }
    }
  }, [isOpen, isCurrentModeUnplayed, isCloudContaminated, activeMode, currentModeScore]);

  const bestCloudScore = isCloudContaminated ? currentModeScore : rawCloudScore;

  // 玩家真正最高分：以本地真實遊玩驗證最高分 currentModeScore 為唯一依據，杜絕重設前的雲端舊分數覆蓋剛通關的分數！
  const effectiveBestScore = isCurrentModeUnplayed
    ? 0
    : (currentModeScore > 0 ? currentModeScore : (isCloudContaminated ? 0 : bestCloudScore));

  // 樂觀同步與即時名次計算：
  // 徹底解決 Firebase 雲端異步寫入延遲或網絡快取導致當前玩家行內分數與頂部「個人最高」不一致的問題
  const displayEntries = useMemo(() => {
    if (isCurrentModeUnplayed) {
      return entries.filter((e) => !e.isCurrentPlayer);
    }

    const currentFid = playerFid || getOrCreatePlayerId();
    let list: FirestoreLeaderboardEntry[] = entries.map((entry) => {
      if (entry.isCurrentPlayer || entry.userId === currentFid) {
        return {
          ...entry,
          score: effectiveBestScore,
          isCurrentPlayer: true,
        };
      }
      return entry;
    });

    const hasMe = list.some((e) => e.isCurrentPlayer || e.userId === currentFid);
    if (!hasMe && effectiveBestScore > 0) {
      const lowestScore = list.length >= 20 ? list[list.length - 1].score : 0;
      if (list.length < 20 || effectiveBestScore >= lowestScore) {
        list.push({
          id: `${currentFid}_${activeMode}`,
          userId: currentFid,
          username: currentFid,
          score: effectiveBestScore,
          mode: activeMode,
          formattedDate: '剛剛',
          isCurrentPlayer: true,
        });
      }
    }

    // 重新排序並校正名次 rank
    list.sort((a, b) => (b.score || 0) - (a.score || 0));
    return list.slice(0, 20).map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }));
  }, [entries, effectiveBestScore, isCurrentModeUnplayed, playerFid, activeMode]);

  // 當發現雲端紀錄高於本地紀錄時：
  // 闖關模式絕不從雲端倒灌（闖關必須以 levelHighScores 各關真實通關最高分為唯一標準）
  useEffect(() => {
    if (!isOpen) return;
    if (isCurrentModeUnplayed) return; // 玩家未玩過該模式時，絕不將雲端舊殘留數據同步至本地！
    if (isCloudContaminated) return; // 雲端分數屬於跨模式污染或重設前殘留時，絕不同步！
    if (activeMode === 'Missions') return; // 闖關模式由真實通關關卡完全權威控制，禁止雲端覆蓋！

    // 嚴格阻擋跨模式污染：任何模式均不得採信等於其他模式分數的雲端值
    if (activeMode === 'Classic' && ((timeAttackHighScore > 0 && bestCloudScore === timeAttackHighScore) || (missionsHighScore > 0 && bestCloudScore === missionsHighScore))) {
      return;
    }
    if (activeMode === 'Time' && ((missionsHighScore > 0 && bestCloudScore === missionsHighScore) || (classicHighScore > 0 && bestCloudScore === classicHighScore))) {
      return;
    }

    if (bestCloudScore > currentModeScore && bestCloudScore > 0 && currentModeScore > 0) {
      const modeKey = activeMode === 'Classic' ? 'CLASSIC' : 'TIME_ATTACK';

      onUpdateProfile((prev) => {
        const curScore = prev.highScores[modeKey] || 0;
        if (bestCloudScore > curScore) {
          return {
            ...prev,
            highScores: {
              ...prev.highScores,
              [modeKey]: bestCloudScore,
            },
          };
        }
        return prev;
      });
    }
  }, [isOpen, bestCloudScore, currentModeScore, activeMode, isCurrentModeUnplayed, isCloudContaminated, timeAttackHighScore, classicHighScore, missionsHighScore, onUpdateProfile]);

  // 本地舊殘留數據全面清洗：
  // 1. 若本地 profile.highScores.LEVELS 誤跟了其他模式高分，立即校正洗淨！
  // 2. 若本地 profile.highScores.CLASSIC 誤跟了其他模式高分，立即校正洗淨！
  // 3. 若本地 profile.highScores.TIME_ATTACK 誤跟了 LEVELS (如 4185) 或 CLASSIC，立即校正洗淨歸零！
  useEffect(() => {
    if (!isOpen) return;

    if (activeMode === 'Time') {
      const storedTime = profile.highScores?.TIME_ATTACK || 0;
      const isLeaked =
        (missionsHighScore > 0 && storedTime === missionsHighScore) ||
        (classicHighScore > 0 && storedTime === classicHighScore);
      if (isLeaked) {
        onUpdateProfile((prev) => ({
          ...prev,
          highScores: {
            ...prev.highScores,
            TIME_ATTACK: currentModeScore > 0 && currentModeScore !== missionsHighScore ? currentModeScore : 0,
          },
        }));
      }
    }

    if (activeMode === 'Missions' && !isCurrentModeUnplayed) {
      const storedMissions = profile.highScores?.LEVELS || 0;
      const isLeaked =
        (timeAttackHighScore > 0 && storedMissions === timeAttackHighScore) ||
        (classicHighScore > 0 && storedMissions === classicHighScore);
      if (isLeaked && currentModeScore > 0) {
        onUpdateProfile((prev) => ({
          ...prev,
          highScores: {
            ...prev.highScores,
            LEVELS: currentModeScore,
          },
        }));
      }
    }

    if (activeMode === 'Classic') {
      const storedClassic = profile.highScores?.CLASSIC || 0;
      const isLeaked =
        (timeAttackHighScore > 0 && storedClassic === timeAttackHighScore) ||
        (missionsHighScore > 0 && storedClassic === missionsHighScore);
      if (isLeaked) {
        const correctedClassic = isClassicUnplayed ? 0 : (currentModeScore > 0 ? currentModeScore : 960);
        onUpdateProfile((prev) => ({
          ...prev,
          highScores: {
            ...prev.highScores,
            CLASSIC: correctedClassic,
          },
        }));
      }
    }
  }, [isOpen, activeMode, isCurrentModeUnplayed, isClassicUnplayed, isTimeUnplayed, currentModeScore, profile.highScores?.LEVELS, profile.highScores?.CLASSIC, profile.highScores?.TIME_ATTACK, timeAttackHighScore, classicHighScore, missionsHighScore, onUpdateProfile]);

  const modeBestLabel =
    language === 'en'
      ? 'Current Best:'
      : language === 'ja'
      ? '最高記録:'
      : language === 'zh-CN'
      ? '个人最高:'
      : '個人最高:';

  const ptsLabel = language === 'en' ? 'pts' : language === 'ja' ? '点' : '分';
  const youBadge = language === 'en' ? 'YOU' : language === 'ja' ? 'あなた' : '你';
  const highScoreCol = language === 'en' ? 'Score' : language === 'ja' ? 'スコア' : language === 'zh-CN' ? '分数' : '分數';

  const missionsTabLabel =
    language === 'en'
      ? 'Missions'
      : language === 'ja'
      ? 'ステージ'
      : language === 'zh-CN'
      ? '闯关'
      : '闖關';

  const classicTabLabel =
    language === 'en'
      ? 'Classic'
      : language === 'ja'
      ? 'クラシック'
      : language === 'zh-CN'
      ? '经典'
      : '經典';

  const timeTabLabel =
    language === 'en'
      ? 'Time'
      : language === 'ja'
      ? 'タイム'
      : language === 'zh-CN'
      ? '计时'
      : '計時';

  const championBadgeLabel =
    language === 'en'
      ? 'Champion'
      : language === 'ja'
      ? '王者'
      : language === 'zh-CN'
      ? '模式冠军'
      : '模式冠軍';

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-4 pt-[calc(max(env(safe-area-inset-top),0.5rem)+3.2rem)] pb-3 bg-slate-950/80 backdrop-blur-md animate-fade-in select-none overflow-hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          soundEngine.playClick();
          onClose();
        }
      }}
    >
      <CuteModalBackground
        theme="leaderboard"
        className="w-full max-w-md max-h-[calc(100dvh-max(env(safe-area-inset-top),0.5rem)-4.5rem)] flex flex-col text-slate-100 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-amber-500/20 bg-slate-950/75 flex items-center justify-between shrink-0 gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center text-xl shadow-inner shrink-0">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-wide truncate">
                  {getTranslation('leaderboardTitle', language)}
                </h2>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                  TOP 20
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all active:scale-95 shrink-0 cursor-pointer shadow-md touch-manipulation"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 個模式切換按鈕：『闖關』(最左)、『經典』(中間)、『計時』(最右) */}
        <div className="p-2 sm:px-4 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between gap-2 shrink-0">
          {/* 1. 闖關模式 (Missions) - 最左邊 */}
          <button
            type="button"
            onClick={() => handleTabChange('Missions')}
            className={`flex-1 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeMode === 'Missions'
                ? 'bg-emerald-500/25 border border-emerald-400 text-emerald-300 shadow-sm ring-1 ring-emerald-400/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
            }`}
          >
            <Map className="w-4 h-4 text-emerald-400" />
            <span>{missionsTabLabel}</span>
          </button>

          {/* 2. 經典模式 (Classic) - 擺中間 */}
          <button
            type="button"
            onClick={() => handleTabChange('Classic')}
            className={`flex-1 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeMode === 'Classic'
                ? 'bg-blue-500/25 border border-blue-400 text-blue-300 shadow-sm ring-1 ring-blue-400/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
            }`}
          >
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>{classicTabLabel}</span>
          </button>

          {/* 3. 計時模式 (Time) - 最右邊 */}
          <button
            type="button"
            onClick={() => handleTabChange('Time')}
            className={`flex-1 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeMode === 'Time'
                ? 'bg-pink-500/25 border border-pink-400 text-pink-300 shadow-sm ring-1 ring-pink-400/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
            }`}
          >
            <Clock className="w-4 h-4 text-pink-400" />
            <span>{timeTabLabel}</span>
          </button>
        </div>

        {/* Mode High Score Status Bar (Clean & Uncluttered) */}
        <div className="px-3.5 py-2 bg-slate-900/80 border-b border-slate-800/80 flex items-center justify-between text-xs shrink-0 gap-2">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-semibold">
            <span>
              {language === 'en'
                ? 'TOP 20 Rankings'
                : language === 'ja'
                ? 'TOP 20 ランキング'
                : '前 20 名最高分排名'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-300 font-mono text-[11px]">
            <span>{modeBestLabel}</span>
            <span
              className={`font-bold ${
                isCurrentModeUnplayed || effectiveBestScore === 0 ? 'text-slate-400 font-medium' : 'text-emerald-400'
              }`}
            >
              {effectiveBestScore} {ptsLabel}
            </span>
          </div>
        </div>

        {/* Leaderboard Content List */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y p-3 space-y-1.5">
          {isLoading ? (
            <div className="py-14 flex flex-col items-center justify-center gap-3 text-slate-400">
              <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
            </div>
          ) : displayEntries.length > 0 ? (
            <>
              {errorMessage && (
                <div className="p-3 mb-2 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-xs text-amber-200 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-bold text-amber-300">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>
                        {language === 'en'
                          ? 'Local Records Active (Cloud Rules Pending)'
                          : language === 'ja'
                          ? 'ローカル記録表示中（クラウド同期設定待ち）'
                          : '本地榮譽榜已載入 (雲端規則待發布)'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowRulesGuide((v) => !v)}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-[11px] border border-amber-500/30 transition-all cursor-pointer"
                    >
                      {showRulesGuide
                        ? language === 'en'
                          ? 'Hide Guide'
                          : '收起教學'
                        : language === 'en'
                        ? 'Setup Guide'
                        : '查看發布教學'}
                    </button>
                  </div>

                  {showRulesGuide && (
                    <div className="pt-2 border-t border-amber-500/20 space-y-2 text-[11px] text-slate-300">
                      <p>
                        {language === 'en'
                          ? 'To enable global multiplayer rankings, paste the rule below in Firebase Console (Firestore -> Rules) and click Publish:'
                          : '如需開啟全球多人連線排行榜，請在 Firebase Console 控制台 (Firestore Database -> Rules 規則) 貼上以下規則並按「發布 (Publish)」：'}
                      </p>
                      <pre className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-[10px] font-mono text-emerald-400 overflow-x-auto select-all">
                        {FIRESTORE_RECOMMENDED_RULES}
                      </pre>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(FIRESTORE_RECOMMENDED_RULES);
                            soundEngine.playClick();
                            setRulesCopied(true);
                            setTimeout(() => setRulesCopied(false), 2500);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          {rulesCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{rulesCopied ? (language === 'en' ? 'Copied!' : '已複製！') : (language === 'en' ? 'Copy Rule' : '一鍵複製規則代碼')}</span>
                        </button>
                        <a
                          href="https://console.firebase.google.com/project/snake-pro-c1187/firestore/rules"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                        >
                          <span>{language === 'en' ? 'Open Firebase Console' : '前往 Firebase 控制台'}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {displayEntries.map((entry) => {
              const displayFid = (() => {
                if (entry.isCurrentPlayer) return playerFid;
                const rawId = (entry.userId || '').trim();
                const docId = (entry.id || '').replace(/_(Classic|Missions|Time)$/i, '').trim();
                const candidate = rawId || docId;
                if (candidate && !/[^\w\-_]/.test(candidate) && !candidate.includes('#')) {
                  return candidate;
                }
                const seed = candidate || entry.username || `player_${entry.rank}`;
                let hash = 0;
                for (let i = 0; i < seed.length; i++) {
                  hash = (hash << 5) - hash + seed.charCodeAt(i);
                  hash |= 0;
                }
                const part1 = Math.abs(hash).toString(36).padStart(7, '0');
                const part2 = Math.abs(hash * 37 + 101).toString(36).padStart(7, '0');
                return `fid_${part1}${part2}`;
              })();
              const isFirst = entry.rank === 1;
              const isSecond = entry.rank === 2;
              const isThird = entry.rank === 3;
              const isMe = entry.isCurrentPlayer;

              return (
                <div
                  key={entry.id}
                  className={`p-2.5 sm:p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isMe
                      ? 'bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border-emerald-500 shadow-md shadow-emerald-950/40 ring-1 ring-emerald-500/50'
                      : isFirst
                      ? 'bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-900 border-amber-500/70 shadow-sm ring-1 ring-amber-500/30'
                      : isSecond
                      ? 'bg-gradient-to-r from-slate-800/60 via-slate-900 to-slate-900 border-slate-400/50'
                      : isThird
                      ? 'bg-gradient-to-r from-amber-900/30 via-slate-900 to-slate-900 border-amber-700/50'
                      : 'bg-slate-900/70 border-slate-800/80 hover:bg-slate-850/80'
                  }`}
                >
                  {/* Left: Rank & Player info */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm shrink-0 font-mono ${
                        isFirst
                          ? 'bg-gradient-to-br from-amber-400 to-yellow-600 text-slate-950 shadow-md shadow-amber-500/30 text-base'
                          : isSecond
                          ? 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-950 shadow-md text-base'
                          : isThird
                          ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white shadow-md text-base'
                          : 'bg-slate-800 text-slate-400 border border-slate-700/60'
                      }`}
                    >
                      {isFirst ? '🥇' : isSecond ? '🥈' : isThird ? '🥉' : entry.rank}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-xs sm:text-sm font-mono font-bold truncate max-w-[160px] sm:max-w-[240px] tracking-wide ${
                            isMe ? 'text-emerald-300 font-black' : 'text-slate-200'
                          }`}
                          title={displayFid}
                        >
                          {displayFid}
                        </span>
                        {isMe && (
                          <span className="px-1.5 py-0.2 rounded bg-emerald-500 text-slate-950 text-[10px] font-black shrink-0">
                            {youBadge}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                        {isFirst && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-amber-500/20 text-amber-300">
                            {championBadgeLabel}
                          </span>
                        )}
                        <span className="text-slate-500 text-[10px]">{entry.formattedDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Score */}
                  <div className="text-right shrink-0">
                    <div className="text-[10px] text-slate-400 font-medium">{highScoreCol}</div>
                    <div
                      className={`font-mono font-black text-sm sm:text-base leading-tight ${
                        isMe
                          ? 'text-emerald-400'
                          : isFirst
                          ? 'text-amber-300'
                          : isSecond
                          ? 'text-slate-200'
                          : isThird
                          ? 'text-amber-500'
                          : 'text-white'
                      }`}
                    >
                      {entry.score.toLocaleString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        ) : errorMessage ? (
          <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-center space-y-2.5">
            <AlertCircle className="w-6 h-6 text-amber-400 mx-auto" />
            <div className="text-xs text-amber-200 font-medium">{errorMessage}</div>
            {indexUrl ? (
              <a
                href={indexUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md mt-2"
              >
                <span>
                  {language === 'en'
                    ? 'Create Firebase Composite Index'
                    : language === 'ja'
                    ? 'Firebase複合インデックスを作成'
                    : language === 'zh-CN'
                    ? '前往建立 Firebase 复合索引'
                    : '前往建立 Firebase 複合索引'}
                </span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setIsLoading(true);
                      setErrorMessage(null);
                      setRetryCount((c) => c + 1);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold border border-amber-500/30 transition-all active:scale-95 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{language === 'en' ? 'Retry' : language === 'ja' ? '再試行' : '重新整理'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRulesGuide((v) => !v)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/30 transition-all active:scale-95 cursor-pointer"
                  >
                    <span>{showRulesGuide ? (language === 'en' ? 'Hide Guide' : '收起教學') : (language === 'en' ? 'Setup Guide' : '查看發布教學')}</span>
                  </button>
                </div>
                {showRulesGuide && (
                  <div className="pt-2 border-t border-amber-500/20 space-y-2 text-[11px] text-slate-300 text-left">
                    <p>
                      {language === 'en'
                        ? 'To enable global multiplayer rankings, paste the rule below in Firebase Console (Firestore -> Rules) and click Publish:'
                        : '如需開啟全球多人連線排行榜，請在 Firebase Console 控制台 (Firestore Database -> Rules 規則) 貼上以下規則並按「發布 (Publish)」：'}
                    </p>
                    <pre className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-[10px] font-mono text-emerald-400 overflow-x-auto select-all">
                      {FIRESTORE_RECOMMENDED_RULES}
                    </pre>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(FIRESTORE_RECOMMENDED_RULES);
                          soundEngine.playClick();
                          setRulesCopied(true);
                          setTimeout(() => setRulesCopied(false), 2500);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        {rulesCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{rulesCopied ? (language === 'en' ? 'Copied!' : '已複製！') : (language === 'en' ? 'Copy Rule' : '一鍵複製規則代碼')}</span>
                      </button>
                      <a
                        href="https://console.firebase.google.com/project/snake-pro-c1187/firestore/rules"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                      >
                        <span>{language === 'en' ? 'Open Firebase Console' : '前往 Firebase 控制台'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center p-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center text-2xl mb-2">
              🏆
            </div>
            <div className="text-sm font-bold text-white">
              {language === 'en'
                ? `No rankings in ${activeMode === 'Classic' ? 'Classic' : activeMode === 'Missions' ? 'Missions' : 'Time Attack'} mode yet`
                : language === 'ja'
                ? `現在『${activeMode === 'Classic' ? 'クラシック' : activeMode === 'Missions' ? 'ステージ' : 'タイム'}』モードの記録はありません`
                : language === 'zh-CN'
                ? `目前『${activeMode === 'Classic' ? '经典' : activeMode === 'Missions' ? '闯关' : '计时'}』模式尚无排名`
                : `目前『${activeMode === 'Classic' ? '經典' : activeMode === 'Missions' ? '闖關' : '計時'}』模式尚無排名`}
            </div>
            <div className="text-xs text-slate-400 mt-1 max-w-xs">
              {language === 'en'
                ? 'Play a round in this mode to submit your score automatically!'
                : language === 'ja'
                ? 'このモードをプレイすると、ハイスコアが自動でランキングに反映されます！'
                : language === 'zh-CN'
                ? '只要在该模式完成一局游戏，最高分就会自动提交至排行榜！'
                : '只要在該模式完成一局遊戲，最高分就會自動提交至排行榜！'}
            </div>
          </div>
        )}
        </div>
      </CuteModalBackground>
    </div>
  );
};

