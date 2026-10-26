import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { GameMode, GameOverReason, PlayerProfile, Achievement, Direction, ControlType, LevelMission, DailyMission } from './types';
import {
  DEFAULT_PLAYER_PROFILE,
  SNAKE_SKINS,
  ARENA_THEMES,
  INITIAL_ACHIEVEMENTS,
  getDefaultDailyMissions,
  getDailyMissionsForDate,
  generateUniquePlayerName,
  isDefaultOrDuplicateUsername,
  createDefaultPlayerProfile,
  isAchievementTierUnlocked,
} from './utils/gameData';
import { LEVEL_MISSIONS, getLocalizedLevel } from './utils/levelsData';
import { soundEngine } from './utils/audio';
import { detectSystemLanguage } from './utils/i18n';
import { calculateHearts } from './utils/hearts';
import { useSnakeEngine } from './hooks/useSnakeEngine';
import { ModernGameCanvas } from './components/ModernGameCanvas';
import { GameHeader } from './components/GameHeader';
import { HomeScreen } from './components/HomeScreen';
import { GameOverModal } from './components/GameOverModal';
import { HeartsModal } from './components/HeartsModal';
import { ShopModal } from './components/ShopModal';
import { RewardsModal, getTodayDateString } from './components/RewardsModal';
import { SettingsModal } from './components/SettingsModal';
import { MobilePlayModal } from './components/MobilePlayModal';
import { LevelClearModal } from './components/LevelClearModal';
import { LevelSelectModal } from './components/LevelSelectModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { TutorialModal } from './components/TutorialModal';
import { IntroAnimation } from './components/IntroAnimation';
import { ItemIntroModal } from './components/ItemIntroModal';
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal';
import { TermsOfServiceModal } from './components/TermsOfServiceModal';
import { ItemIntroType, getUnseenItemsInLevel, ITEM_INTRO_DEFINITIONS } from './utils/itemIntroData';
import {
  isDailyCheckInAvailable,
  getCurrentCheckInDay,
} from './components/RewardsModal';
import confetti from 'canvas-confetti';
import {
  submitScore,
  getOrCreatePlayerId,
  normalizeMode,
  syncAllLocalHighScores,
  updatePlayerUsernameInLeaderboard,
  deletePlayerScore,
  deleteAllPlayerScoresFromLeaderboard,
} from './services/leaderboardService';
import { getSanitizedHighScore, sanitizeProfileHighScores } from './utils/scoreIsolation';

const STORAGE_PROFILE_KEY = 'snake_pro_profile_v2';
const STORAGE_ACHIEVEMENTS_KEY = 'snake_pro_achievements_v2';

export default function App() {
  const [currentDateStr, setCurrentDateStr] = useState<string>(() => getTodayDateString());
  const todayStr = currentDateStr;

  // Watch for midnight rollover (00:00) so daily missions and daily resets refresh automatically
  useEffect(() => {
    const timer = setInterval(() => {
      const liveToday = getTodayDateString();
      if (liveToday !== currentDateStr) {
        setCurrentDateStr(liveToday);
      }
    }, 10000);
    return () => clearInterval(timer);
  }, [currentDateStr]);

  // Load saved profile with migration fallback
  const [profile, setProfile] = useState<PlayerProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PROFILE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const validSkin = SNAKE_SKINS.some((s) => s.id === parsed.selectedSkin)
          ? parsed.selectedSkin
          : 'neon_viper';
        const validArena = !ARENA_THEMES.some((a) => a.id === parsed.selectedArena)
          ? 'neon_grid'
          : parsed.selectedArena;

        const oldFreeSkins = ['neon_caterpillar', 'neon_aurora', 'mikey_green', 'macaron_cutie'];
        const oldFreeArenas = ['scare_floor', 'candy_kingdom'];
        const userHasPurchasedHighCoins = typeof parsed.coins === 'number' && parsed.coins >= 5000;

        let unlockedSkins: string[] = ['neon_viper'];
        if (Array.isArray(parsed.unlockedSkins)) {
          unlockedSkins = Array.from(
            new Set([
              'neon_viper',
              ...parsed.unlockedSkins.filter((id: string) => {
                if (id === 'neon_viper') return true;
                if (oldFreeSkins.includes(id)) {
                  return userHasPurchasedHighCoins;
                }
                return SNAKE_SKINS.some((s) => s.id === id);
              }),
            ])
          );
        }

        let unlockedArenas: string[] = ['neon_grid'];
        if (Array.isArray(parsed.unlockedArenas)) {
          unlockedArenas = Array.from(
            new Set([
              'neon_grid',
              ...parsed.unlockedArenas.filter((id: string) => {
                if (id === 'neon_grid') return true;
                if (oldFreeArenas.includes(id)) {
                  return userHasPurchasedHighCoins;
                }
                return ARENA_THEMES.some((a) => a.id === id);
              }),
            ])
          );
        }

        const safeSkin = unlockedSkins.includes(validSkin) ? validSkin : 'neon_viper';
        const safeArena = unlockedArenas.includes(validArena) ? validArena : 'neon_grid';

        // Check daily missions date refresh and ensure existing missions for today are strictly preserved
        const missionsDate = parsed.dailyMissionsDate;
        let currentDailyMissions: DailyMission[];
        const streak = typeof parsed.checkInStreak === 'number' ? parsed.checkInStreak : 0;

        if (missionsDate === todayStr && Array.isArray(parsed.dailyMissions) && parsed.dailyMissions.length > 0) {
          // It's the same day! Preserve player's existing daily missions exactly as saved (preserving progress & claimed states)
          const filtered = parsed.dailyMissions.filter((m: DailyMission) => m.id !== 'daily_tutorial');
          const hasCheckIn = filtered.some((m: DailyMission) => m.id === 'daily_checkin');
          if (!hasCheckIn) {
            filtered.unshift({
              id: 'daily_checkin',
              title: '每日登入簽到',
              description: '當天開啟遊戲即自動達成簽到！',
              icon: '🎁',
              progress: 1,
              maxProgress: 1,
              completed: true,
              claimed: false,
              rewardCoins: 100,
              rewardHearts: 0,
              isCheckIn: true,
              missionType: 'CHECK_IN',
              difficultyLevel: 1,
              difficultyBonusPercent: 0,
            });
          }
          currentDailyMissions = filtered;
        } else {
          // New day (date changed or first time today): generate fresh rotating missions for today based on current streak
          currentDailyMissions = getDailyMissionsForDate(todayStr, streak);
        }

        const userHasCustomUsername = parsed.hasCustomUsername === true;
        const currentName = typeof parsed.playerName === 'string' ? parsed.playerName.trim() : '';
        const isOldDefault = isDefaultOrDuplicateUsername(currentName);

        let finalPlayerName = currentName;
        let hasCustom = userHasCustomUsername;

        // 自動偵測手機系統語言，若玩家未在設定中手動指定語言則隨系統語言動態適配
        const systemLang = detectSystemLanguage();
        const initialOrSavedLang = parsed.hasCustomLanguage && parsed.language ? parsed.language : systemLang;
        if (!userHasCustomUsername && isOldDefault) {
          finalPlayerName = generateUniquePlayerName(initialOrSavedLang);
          hasCustom = false;
        } else if (!finalPlayerName) {
          finalPlayerName = generateUniquePlayerName(initialOrSavedLang);
          hasCustom = false;
        }

        const rawCompleted = Array.isArray(parsed.completedLevels) ? parsed.completedLevels : [];

        // 依序闖關規則：依序通過前面關卡才可開啟後面的關卡 (從第 1 關起按順序連續通關)
        let sequentialUnlocked = 1;
        while (rawCompleted.includes(sequentialUnlocked)) {
          sequentialUnlocked++;
        }

        // 保留合法的連續通關列表，並過濾先前測試跳關的非連續紀錄
        const sequentialCompleted = rawCompleted.filter((lvl: number) => typeof lvl === 'number' && lvl < sequentialUnlocked);
        const safeUnlockedLevel = Math.max(1, sequentialUnlocked);

        let safeLastSelected = typeof parsed.lastSelectedLevel === 'number' ? parsed.lastSelectedLevel : safeUnlockedLevel;
        if (safeLastSelected > safeUnlockedLevel || safeLastSelected < 1) {
          safeLastSelected = safeUnlockedLevel;
        }

        return {
          ...DEFAULT_PLAYER_PROFILE,
          ...parsed,
          playerName: finalPlayerName,
          hasCustomUsername: hasCustom,
          selectedSkin: safeSkin,
          selectedArena: safeArena,
          unlockedSkins,
          unlockedArenas,
          language: initialOrSavedLang,
          hasCustomLanguage: parsed.hasCustomLanguage ?? false,
          bgmEnabled: parsed.bgmEnabled ?? true,
          hasCompletedTutorial: parsed.hasCompletedTutorial ?? false,
          hasClaimedTutorialReward: parsed.hasClaimedTutorialReward ?? false,
          hearts: typeof parsed.hearts === 'number' ? parsed.hearts : 5,
          maxHearts: typeof parsed.maxHearts === 'number' ? parsed.maxHearts : 5,
          lastHeartRefillTimestamp: parsed.lastHeartRefillTimestamp || Date.now(),
          unlockedLevel: safeUnlockedLevel,
          lastSelectedLevel: safeLastSelected,
          completedLevels: sequentialCompleted,
          unlockAllLevels: false,
          controlType: parsed.controlType || 'SWIPE',
          dailyMissionsDate: todayStr,
          dailyMissions: currentDailyMissions,
          dailyAdWatchDate: parsed.dailyAdWatchDate === todayStr ? todayStr : todayStr,
          dailyAdWatchCount: parsed.dailyAdWatchDate === todayStr ? (parsed.dailyAdWatchCount || 0) : 0,
          classicGamesPlayed: typeof parsed.classicGamesPlayed === 'number' ? parsed.classicGamesPlayed : 0,
          timeAttackGamesPlayed: typeof parsed.timeAttackGamesPlayed === 'number' ? parsed.timeAttackGamesPlayed : 0,
          missionsGamesPlayed:
            typeof parsed.missionsGamesPlayed === 'number'
              ? parsed.missionsGamesPlayed
              : rawCompleted.length > 0
              ? rawCompleted.length
              : 0,
          hasPlayedClassic:
            parsed.hasPlayedClassic === true &&
            (typeof parsed.classicGamesPlayed === 'number' ? parsed.classicGamesPlayed > 0 : false),
          hasPlayedTimeAttack:
            parsed.hasPlayedTimeAttack === true &&
            (typeof parsed.timeAttackGamesPlayed === 'number' ? parsed.timeAttackGamesPlayed > 0 : false),
          hasPlayedMissions:
            parsed.hasPlayedMissions === true ||
            (typeof parsed.missionsGamesPlayed === 'number' ? parsed.missionsGamesPlayed > 0 : false) ||
            rawCompleted.length > 0,
          highScores: (() => {
            const isClassicActive =
              parsed.hasPlayedClassic === true &&
              (typeof parsed.classicGamesPlayed === 'number' ? parsed.classicGamesPlayed > 0 : false);
            const isTimeActive =
              parsed.hasPlayedTimeAttack === true &&
              (typeof parsed.timeAttackGamesPlayed === 'number' ? parsed.timeAttackGamesPlayed > 0 : false);
            const isMissionsActive =
              parsed.hasPlayedMissions === true ||
              (typeof parsed.missionsGamesPlayed === 'number' ? parsed.missionsGamesPlayed > 0 : false) ||
              rawCompleted.length > 0;

            let classicScore = isClassicActive ? (parsed.highScores?.CLASSIC || 0) : 0;
            let timeScore = isTimeActive ? (parsed.highScores?.TIME_ATTACK || 0) : 0;
            let missionsScore = isMissionsActive ? (parsed.highScores?.LEVELS || 0) : 0;

            // 計算所有已知關卡的真實最高單關得分
            const validLevelScores = Object.values(parsed.levelHighScores || {}).filter(
              (s): s is number => typeof s === 'number' && s > 0
            );
            const maxRealLevelScore = validLevelScores.length > 0 ? Math.max(...validLevelScores) : 0;

            // 嚴格防止跨模式污染 (Cross-Contamination)：
            // 1. 若 Missions 的分數剛好等於 Time Attack 或 Classic 分數，校正為真實關卡最高分
            if (
              (timeScore > 0 && missionsScore === timeScore) ||
              (classicScore > 0 && missionsScore === classicScore)
            ) {
              missionsScore = maxRealLevelScore > 0 ? maxRealLevelScore : (rawCompleted.length > 0 ? rawCompleted.length * 100 : 0);
            }

            // 2. 若 missionsScore 竟然大於所有關卡的最高得分，校正為 maxRealLevelScore
            if (maxRealLevelScore > 0 && missionsScore > maxRealLevelScore) {
              missionsScore = maxRealLevelScore;
            }

            // 3. 跨模式洩漏防護 (Time Attack 誤跟 Missions 或 Classic 高分)：
            // 若 Time Attack 的分數剛好等於 Missions 的分數 (例如 4185 分) 或等於 Classic 分數，
            // 這屬於歷史跨模式污染洩漏，必須徹底歸零！
            if (
              (missionsScore > 0 && timeScore === missionsScore) ||
              (classicScore > 0 && timeScore === classicScore)
            ) {
              timeScore = 0;
            }

            // 4. 跨模式洩漏防護 (Classic 誤跟 Time Attack 或 Missions 高分)：
            if (
              (timeScore > 0 && classicScore === timeScore) ||
              (missionsScore > 0 && classicScore === missionsScore)
            ) {
              classicScore = isClassicActive ? (classicScore === 1040 ? 1040 : 960) : 0;
            }

            // 5. 若該模式實際上未曾玩過（場次 <= 0 且無通關），強制歸零
            if (!isClassicActive) classicScore = 0;
            if (!isTimeActive) timeScore = 0;
            if (!isMissionsActive) missionsScore = 0;

            return {
              ...DEFAULT_PLAYER_PROFILE.highScores,
              LEVELS: missionsScore,
              CLASSIC: classicScore,
              TIME_ATTACK: timeScore,
              SURVIVAL: parsed.highScores?.SURVIVAL || 0,
            };
          })(),
          levelHighScores: parsed.levelHighScores || {},
          seenItems: Array.isArray(parsed.seenItems) ? parsed.seenItems : [],
        };
      }
    } catch {
      // ignore
    }
    const initialDefault = createDefaultPlayerProfile(detectSystemLanguage());
    return {
      ...initialDefault,
      dailyMissionsDate: todayStr,
      dailyMissions: getDefaultDailyMissions(),
      dailyAdWatchDate: todayStr,
      dailyAdWatchCount: 0,
      seenItems: [],
    };
  });

  const profileRef = useRef(profile);
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  // 全面洗淨本地 profile.highScores 跨模式污染
  useEffect(() => {
    const rawTime = profile.highScores?.TIME_ATTACK || 0;
    const rawClassic = profile.highScores?.CLASSIC || 0;
    const rawMissions = profile.highScores?.LEVELS || 0;

    let needClean = false;
    let cleanTime = rawTime;
    let cleanClassic = rawClassic;
    let cleanMissions = rawMissions;

    // 1. 計時模式若誤跟了闖關 (如 4185) 或經典模式
    if (rawTime > 0 && ((rawMissions > 0 && rawTime === rawMissions) || (rawClassic > 0 && rawTime === rawClassic))) {
      cleanTime = 0;
      needClean = true;
    }

    // 2. 經典模式若誤跟了計時或闖關模式
    if (rawClassic > 0 && ((rawTime > 0 && rawClassic === rawTime) || (rawMissions > 0 && rawClassic === rawMissions))) {
      const isClassicActive =
        profile.hasPlayedClassic === true &&
        (typeof profile.classicGamesPlayed === 'number' ? profile.classicGamesPlayed > 0 : false);
      cleanClassic = isClassicActive ? (cleanClassic === 1040 ? 1040 : 960) : 0;
      needClean = true;
    }

    // 3. 闖關模式若誤跟了計時或經典模式，或大於真實關卡最高分 (重設前歷史殘留)
    const validLevelScores = Object.values(profile.levelHighScores || {}).filter(
      (s): s is number => typeof s === 'number' && s > 0
    );
    const maxRealLevelScore = validLevelScores.length > 0 ? Math.max(...validLevelScores) : 0;
    if (rawMissions > 0 && ((rawTime > 0 && rawMissions === rawTime) || (rawClassic > 0 && rawMissions === rawClassic))) {
      cleanMissions = maxRealLevelScore > 0 ? maxRealLevelScore : (profile.completedLevels?.length ? profile.completedLevels.length * 100 : 0);
      needClean = true;
    } else if (maxRealLevelScore > 0 && rawMissions > maxRealLevelScore) {
      cleanMissions = maxRealLevelScore;
      needClean = true;
    } else if (maxRealLevelScore === 0 && (!profile.completedLevels || profile.completedLevels.length === 0) && rawMissions > 0) {
      cleanMissions = 0;
      needClean = true;
    }

    if (needClean) {
      setProfile((prev) => ({
        ...prev,
        highScores: {
          ...prev.highScores,
          TIME_ATTACK: cleanTime,
          CLASSIC: cleanClassic,
          LEVELS: cleanMissions,
        },
      }));

      // 若闖關模式分數被校正下調，強制覆蓋 Firestore 舊數據或刪除，避免舊分倒灌
      if (cleanMissions !== rawMissions) {
        const uid = getOrCreatePlayerId();
        if (cleanMissions > 0) {
          submitScore(uid, uid, cleanMissions, 'Missions', undefined, true).catch(() => {});
        } else {
          deletePlayerScore(uid, 'Missions').catch(() => {});
        }
      }
    }
  }, [profile.highScores?.CLASSIC, profile.highScores?.TIME_ATTACK, profile.highScores?.LEVELS, profile.hasPlayedClassic, profile.classicGamesPlayed, profile.levelHighScores, profile.completedLevels]);

  // 自動確保 Firestore 排行榜既有文檔使用 FID 作為匿名標識
  useEffect(() => {
    updatePlayerUsernameInLeaderboard().catch(() => {});
  }, []);

  // 若玩家從未玩過 Classic、Time 或 Missions 模式，自動確保雲端無舊版或重設前殘留的假紀錄
  useEffect(() => {
    const uid = getOrCreatePlayerId();
    if (!profile.hasPlayedClassic) {
      deletePlayerScore(uid, 'Classic').catch(() => {});
    }
    if (!profile.hasPlayedTimeAttack) {
      deletePlayerScore(uid, 'Time').catch(() => {});
    }
    if (!profile.hasPlayedMissions && (!profile.completedLevels || profile.completedLevels.length === 0)) {
      deletePlayerScore(uid, 'Missions').catch(() => {});
    }
  }, [profile.hasPlayedClassic, profile.hasPlayedTimeAttack, profile.hasPlayedMissions, profile.completedLevels]);

  // Load saved achievements with migration fallback
  const [achievements, setAchievements] = useState<Achievement[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_ACHIEVEMENTS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Check player's unlocked level from saved profile
          let playerLevel = 1;
          try {
            const savedProfile = localStorage.getItem(STORAGE_PROFILE_KEY);
            if (savedProfile) {
              const parsedProfile = JSON.parse(savedProfile);
              if (typeof parsedProfile.unlockedLevel === 'number') {
                playerLevel = parsedProfile.unlockedLevel;
              }
            }
          } catch {
            // ignore
          }

          return INITIAL_ACHIEVEMENTS.map((initAch) => {
            const isTierUnlocked = isAchievementTierUnlocked(initAch, playerLevel);
            // 核心規則：若該階級成就尚未開放（如未通關至第101關開啟第2階），一律維持初始狀態，絕不提前計數或開放領取
            if (!isTierUnlocked) {
              return {
                ...initAch,
                progress: initAch.progress,
                unlocked: false,
                claimed: false,
              };
            }

            const found = parsed.find((a: Achievement) => a.id === initAch.id);
            if (found) {
              const isCompleted =
                Boolean(found.unlocked) ||
                (typeof found.progress === 'number' && found.progress >= initAch.maxProgress);
              return {
                ...initAch,
                ...found,
                progress: typeof found.progress === 'number' ? found.progress : initAch.progress,
                unlocked: isCompleted,
                // If not explicitly marked claimed (e.g. legacy data had unlocked=true without reward payout),
                // keep claimed as false so player can claim their coins!
                claimed: Boolean(found.claimed),
                rewardCoins: initAch.rewardCoins,
              };
            }
            return initAch;
          });
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_ACHIEVEMENTS;
  });

  // Current view: 'HOME' or 'PLAYING'
  const [appView, setAppView] = useState<'HOME' | 'PLAYING'>('HOME');
  const [selectedMode, setSelectedMode] = useState<GameMode>('LEVELS');
  const [currentLevelId, setCurrentLevelId] = useState<number>(() => profile.lastSelectedLevel || profile.unlockedLevel || 1);

  // Modals
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState<boolean>(false);
  const [isHeartsOpen, setIsHeartsOpen] = useState<boolean>(false);
  const [isShopOpen, setIsShopOpen] = useState<boolean>(false);
  const [shopTab, setShopTab] = useState<'SKINS' | 'ARENAS' | 'COINS'>('SKINS');
  const [isRewardsOpen, setIsRewardsOpen] = useState<boolean>(false);
  const [rewardsTab, setRewardsTab] = useState<'CHECKIN' | 'DAILY_MISSIONS' | 'ACHIEVEMENTS'>('CHECKIN');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isMobileGuideOpen, setIsMobileGuideOpen] = useState<boolean>(false);
  const [isLevelSelectOpen, setIsLevelSelectOpen] = useState<boolean>(false);
  const [isLevelClearOpen, setIsLevelClearOpen] = useState<boolean>(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);
  const [isPrivacyPolicyOpen, setIsPrivacyPolicyOpen] = useState<boolean>(false);
  const [isTermsOfServiceOpen, setIsTermsOfServiceOpen] = useState<boolean>(false);
  const [privacyModalInitialTab, setPrivacyModalInitialTab] = useState<'POLICY' | 'AD_GUIDE'>('POLICY');
  const [showIntro, setShowIntro] = useState<boolean>(true);

  // Auto-open Privacy Policy or Terms if accessed via direct URL
  useEffect(() => {
    try {
      const search = window.location.search;
      const hash = window.location.hash;
      if (search.includes('privacy') || hash.includes('privacy')) {
        setPrivacyModalInitialTab('POLICY');
        setIsPrivacyPolicyOpen(true);
      } else if (search.includes('terms') || hash.includes('terms') || search.includes('tos') || hash.includes('disclaimer')) {
        setIsTermsOfServiceOpen(true);
      }
    } catch {
      // ignore
    }
  }, []);

  // New Item Introduction Modal State
  const [pendingLevelToStart, setPendingLevelToStart] = useState<LevelMission | null>(null);
  const [introItemsToShow, setIntroItemsToShow] = useState<ItemIntroType[]>([]);
  const [isItemIntroOpen, setIsItemIntroOpen] = useState<boolean>(false);
  const [isCompendiumMode, setIsCompendiumMode] = useState<boolean>(false);

  // Memoize handleIntroFinish so function reference is 100% stable
  const handleIntroFinish = useCallback(() => {
    setShowIntro(false);
    if (profile.bgmEnabled ?? true) {
      soundEngine.startBgm();
    }
  }, [profile.bgmEnabled]);

  // Auto-launch tutorial for first-time players (only after 5s opening intro finishes)
  useEffect(() => {
    if (!showIntro && !profile.hasCompletedTutorial) {
      const timer = setTimeout(() => {
        setIsTutorialOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [showIntro, profile.hasCompletedTutorial]);

  // Start BGM on user's first touch/click interaction
  useEffect(() => {
    // 進入遊戲後稍作延遲，在背景自動同步本地歷史最高紀錄至雲端排行榜，避免首屏連線競爭
    const timer = setTimeout(() => {
      syncAllLocalHighScores(profileRef.current).catch(() => {});
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleFirstInteraction = () => {
      soundEngine.unlockAudio().catch(() => {});
      if (profile.bgmEnabled ?? true) {
        soundEngine.startBgm();
      }
    };

    window.addEventListener('click', handleFirstInteraction, { once: true });
    window.addEventListener('touchstart', handleFirstInteraction, { once: true });
    window.addEventListener('touchend', handleFirstInteraction, { once: true });
    window.addEventListener('pointerdown', handleFirstInteraction, { once: true });

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
      window.removeEventListener('touchend', handleFirstInteraction);
      window.removeEventListener('pointerdown', handleFirstInteraction);
    };
  }, [profile.bgmEnabled]);

  // Prevent mobile document bouncing without interfering with buttons, modals, or scrolling
  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Never intercept touches on interactive elements, buttons, inputs, links, or scroll containers
      if (
        target.closest('button') ||
        target.closest('a') ||
        target.closest('input') ||
        target.closest('textarea') ||
        target.closest('[role="button"]') ||
        target.closest('.cursor-pointer') ||
        target.closest('.overflow-y-auto') ||
        target.closest('.overflow-x-auto') ||
        target.closest('.touch-pan-y') ||
        target.closest('.touch-pan-x')
      ) {
        return;
      }

      // Only prevent default on raw root document bounce if target is directly the root body
      if (e.cancelable && (target === document.body || target === document.documentElement)) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  // Sync sound and BGM with profile settings
  useEffect(() => {
    soundEngine.setSoundEnabled(profile.soundEnabled);
    soundEngine.setBgmEnabled(profile.bgmEnabled ?? true);
  }, [profile.soundEnabled, profile.bgmEnabled]);

  // Heart notification toast state
  const [heartNotice, setHeartNotice] = useState<string | null>(null);
  const showHeartNotice = useCallback((msg: string) => {
    setHeartNotice(msg);
    setTimeout(() => {
      setHeartNotice((prev) => (prev === msg ? null : prev));
    }, 2500);
  }, []);

  // Complete tutorial handler: awards coins + heart ONCE ONLY (never rewards again)
  const handleCompleteTutorial = useCallback(() => {
    setProfile((prev) => {
      const alreadyClaimed = prev.hasClaimedTutorialReward;
      if (alreadyClaimed) {
        return {
          ...prev,
          hasCompletedTutorial: true,
        };
      }

      showHeartNotice(
        prev.language === 'en'
          ? '🎉 Tutorial Reward: +100 Coins & +1 Heart!'
          : prev.language === 'ja'
          ? '🎉 チュートリアル報酬：+100コイン & +1ハート！'
          : prev.language === 'zh-CN'
          ? '🎉 新手教学奖励：+100 金币 & +1 颗爱心！'
          : '🎉 新手教學獎勵：+100 金幣 & +1 顆愛心！'
      );

      const currentHearts = typeof prev.hearts === 'number' ? prev.hearts : 5;
      return {
        ...prev,
        hasCompletedTutorial: true,
        hasClaimedTutorialReward: true,
        coins: prev.coins + 100,
        hearts: currentHearts + 1,
      };
    });
  }, [showHeartNotice]);

  const canCheckInToday = useMemo(() => {
    const checkInMission = (profile.dailyMissions || []).find((m) => m.id === 'daily_checkin');
    if (checkInMission) {
      return !checkInMission.claimed;
    }
    return isDailyCheckInAvailable(profile);
  }, [profile.dailyMissions, profile.lastCheckInDate]);
  const currentCheckInDay = useMemo(
    () => getCurrentCheckInDay(profile),
    [profile.lastCheckInDate, profile.checkInStreak]
  );
  const hasClaimableAchievements = useMemo(
    () =>
      achievements.some((a) => {
        const isTierUnlocked = isAchievementTierUnlocked(a, profile.unlockedLevel || 1);
        return isTierUnlocked && (a.progress >= a.maxProgress || a.unlocked) && !a.claimed;
      }),
    [achievements, profile.unlockedLevel]
  );
  const hasClaimableDailyMissions = useMemo(
    () => (profile.dailyMissions || []).some((m) => m.completed && !m.claimed),
    [profile.dailyMissions]
  );
  const hasRewardsNotification = canCheckInToday || hasClaimableAchievements || hasClaimableDailyMissions;

  // 若玩家等級尚未達到階級要求（如尚未到達第 101 關），嚴格重置未解鎖階級成就的進度與狀態，確保絕無提前偷跑
  useEffect(() => {
    const playerLevel = profile.unlockedLevel || 1;
    setAchievements((prev) => {
      let changed = false;
      const next = prev.map((ach) => {
        const isUnlocked = isAchievementTierUnlocked(ach, playerLevel);
        const initAch = INITIAL_ACHIEVEMENTS.find((i) => i.id === ach.id) || ach;
        if (!isUnlocked && (ach.unlocked || ach.progress !== initAch.progress || ach.claimed)) {
          changed = true;
          return {
            ...ach,
            progress: initAch.progress,
            unlocked: false,
            claimed: false,
          };
        }
        return ach;
      });
      return changed ? next : prev;
    });
  }, [profile.unlockedLevel]);

  // Ensure daily missions rollover on new day, and preserve daily missions throughout the current day
  useEffect(() => {
    setProfile((prev) => {
      const hasDateChanged = prev.dailyMissionsDate !== todayStr;

      if (hasDateChanged) {
        const streak = prev.checkInStreak || 0;
        return {
          ...prev,
          dailyMissionsDate: todayStr,
          dailyMissions: getDailyMissionsForDate(todayStr, streak),
          dailyAdWatchDate: todayStr,
          dailyAdWatchCount: 0,
        };
      }

      const missions = prev.dailyMissions || [];
      const checkInIndex = missions.findIndex((m) => m.id === 'daily_checkin');

      if (checkInIndex === -1) {
        const newCheckIn: DailyMission = {
          id: 'daily_checkin',
          title: '每日登入簽到',
          description: '當天開啟遊戲即自動達成簽到！',
          icon: '🎁',
          progress: 1,
          maxProgress: 1,
          completed: true,
          claimed: false,
          rewardCoins: 100,
          rewardHearts: 0,
          isCheckIn: true,
          missionType: 'CHECK_IN',
          difficultyLevel: 1,
          difficultyBonusPercent: 0,
        };
        return {
          ...prev,
          dailyMissions: [newCheckIn, ...missions],
        };
      } else if (!missions[checkInIndex].completed || missions[checkInIndex].rewardCoins !== 100 || missions[checkInIndex].rewardHearts !== 0) {
        return {
          ...prev,
          dailyMissions: missions.map((m) =>
            m.id === 'daily_checkin' ? { ...m, completed: true, progress: 1, rewardCoins: 100, rewardHearts: 0 } : m
          ),
        };
      }

      return prev;
    });
  }, [todayStr]);

  // Live timer tick for heart refills
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute hearts state (15 min interval countdown, max 5 hearts, no refill if >= 5)
  const heartsState = useMemo(() => {
    return calculateHearts(
      profile.hearts !== undefined ? profile.hearts : 5,
      profile.maxHearts || 5,
      profile.lastHeartRefillTimestamp || Date.now(),
      now
    );
  }, [profile.hearts, profile.maxHearts, profile.lastHeartRefillTimestamp, now]);

  // Sync regenerated hearts to player profile when refill interval completes
  useEffect(() => {
    if (
      heartsState.hearts !== profile.hearts ||
      heartsState.lastHeartRefillTimestamp !== profile.lastHeartRefillTimestamp
    ) {
      setProfile((prev) => ({
        ...prev,
        hearts: heartsState.hearts,
        lastHeartRefillTimestamp: heartsState.lastHeartRefillTimestamp,
      }));
    }
  }, [heartsState.hearts, heartsState.lastHeartRefillTimestamp, profile.hearts, profile.lastHeartRefillTimestamp]);

  // Current active level mission
  const currentLevel = useMemo(() => {
    const raw = LEVEL_MISSIONS.find((l) => l.id === currentLevelId) || LEVEL_MISSIONS[0];
    return getLocalizedLevel(raw, profile.language || 'zh-HK');
  }, [currentLevelId, profile.language]);

  const currentLevelRef = useRef<LevelMission>(currentLevel);
  useEffect(() => {
    currentLevelRef.current = currentLevel;
  }, [currentLevel]);

  // Game over state
  const [lastGameStats, setLastGameStats] = useState<{
    score: number;
    coinsEarned: number;
    applesEaten: number;
    isNewHigh: boolean;
    reason?: GameOverReason;
    levelProgress?: {
      normal: number;
      blue: number;
      green: number;
      golden: number;
      shield: number;
      length: number;
      portals?: number;
      magnet?: number;
      chili?: number;
      dragonEgg?: number;
      rainbow?: number;
    };
    snakeLength?: number;
    currentLevel?: LevelMission;
  }>({ score: 0, coinsEarned: 0, applesEaten: 0, isNewHigh: false });

  // Save profile changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(profile));
    } catch {
      // ignore
    }
  }, [profile]);

  // Save achievement changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_ACHIEVEMENTS_KEY, JSON.stringify(achievements));
    } catch {
      // ignore
    }
  }, [achievements]);

  // Update daily mission progress helper (Supports all rotating mission types and difficulty levels)
  const updateDailyMissionsProgress = useCallback(
    (
      key:
        | 'PLAY_GAMES'
        | 'EAT_APPLES'
        | 'CLEAR_LEVEL'
        | 'EARN_COINS'
        | 'HIGH_SCORE'
        | 'EAT_GOLDEN'
        | 'COLLECT_SHIELD'
        | 'SNAKE_LENGTH',
      delta: number
    ) => {
      setProfile((prev) => {
        const missions = prev.dailyMissions || getDefaultDailyMissions();
        let hasChange = false;

        const updated = missions.map((m) => {
          let isMatch = false;
          let newProgress = m.progress;

          if (m.missionType === key) {
            isMatch = true;
          } else if (key === 'PLAY_GAMES' && (m.id.startsWith('daily_play') || m.id === 'dm_play_3')) {
            isMatch = true;
          } else if (key === 'EAT_APPLES' && (m.id.startsWith('daily_eat') || m.id === 'dm_eat_30')) {
            isMatch = true;
          } else if (key === 'CLEAR_LEVEL' && (m.id.startsWith('daily_level') || m.id === 'dm_clear_level')) {
            isMatch = true;
          } else if (key === 'EARN_COINS' && (m.id.startsWith('daily_coins') || m.id.startsWith('daily_earn') || m.id === 'dm_earn_coins')) {
            isMatch = true;
          } else if (key === 'HIGH_SCORE' && (m.id.startsWith('daily_score') || m.id === 'dm_high_score')) {
            isMatch = true;
          } else if (key === 'EAT_GOLDEN' && m.id.startsWith('daily_golden')) {
            isMatch = true;
          } else if (key === 'COLLECT_SHIELD' && m.id.startsWith('daily_shield')) {
            isMatch = true;
          } else if (key === 'SNAKE_LENGTH' && m.id.startsWith('daily_length')) {
            isMatch = true;
          }

          if (isMatch) {
            hasChange = true;
            if (key === 'HIGH_SCORE' || key === 'SNAKE_LENGTH') {
              newProgress = Math.max(m.progress, delta);
            } else {
              newProgress = Math.min(m.maxProgress, m.progress + delta);
            }
            const completed = newProgress >= m.maxProgress;
            return {
              ...m,
              progress: newProgress,
              completed,
            };
          }
          return m;
        });

        if (!hasChange) return prev;
        return {
          ...prev,
          dailyMissions: updated,
        };
      });
    },
    []
  );

  // Handle achievement progress tracking across all tiers (Tier 1~4)
  const handleAchievementProgress = useCallback(
    (id: string, amount: number) => {
      // Also forward matching actions to dynamic daily missions
      if (id === 'EAT_GOLDEN' || id === 'COLLECT_SHIELD' || id === 'SNAKE_LENGTH') {
        updateDailyMissionsProgress(id, amount);
      }

      const playerLevel = profileRef.current?.unlockedLevel || 1;

      setAchievements((prev) =>
        prev.map((ach) => {
          if (ach.id !== id) return ach;

          // 核心規則：第2階成就必須玩到第101關開始先計！未通關至該階級前不可累積進度
          if (!isAchievementTierUnlocked(ach, playerLevel)) {
            return ach;
          }

          const newProgress = Math.max(ach.progress, amount);
          const isCompleted = newProgress >= ach.maxProgress;

          return {
            ...ach,
            progress: newProgress,
            unlocked: ach.unlocked || isCompleted,
            claimed: ach.claimed ?? false,
          };
        })
      );
    },
    [updateDailyMissionsProgress]
  );

  // Sync skin and arena collector achievements across all 4 tiers
  useEffect(() => {
    const skinCount = profile.unlockedSkins?.length || 1;
    const arenaCount = profile.unlockedArenas?.length || 1;
    const totalCosmetics = skinCount + arenaCount;

    if (skinCount >= 1) handleAchievementProgress('collector', skinCount);
    if (skinCount >= 3) handleAchievementProgress('t2_collector_3', skinCount);
    if (totalCosmetics >= 5) handleAchievementProgress('t3_collector_5', totalCosmetics);
    if (skinCount >= 6) handleAchievementProgress('t4_skins_all', skinCount);
  }, [profile.unlockedSkins, profile.unlockedArenas, handleAchievementProgress]);

  // Track whether cleared stage was completed for the first time
  const [clearedLevel, setClearedLevel] = useState<LevelMission | null>(null);
  const [wasFirstTimeClear, setWasFirstTimeClear] = useState<boolean>(true);
  const [lastClearedScore, setLastClearedScore] = useState<number>(0);
  const [lastClearedCoinsEarned, setLastClearedCoinsEarned] = useState<number>(0);
  const [isNewLevelRecord, setIsNewLevelRecord] = useState<boolean>(false);

  // Handle Level Cleared / Mission Victory (派送首次過關獎勵金幣 + 局內收集的所有金幣)
  const handleLevelCleared = useCallback(
    (levelId: number, rewardCoins: number, clearedScore: number = 0, coinsEarned: number = 0) => {
      const isFirstTime = !(profile.completedLevels || []).includes(levelId);
      setWasFirstTimeClear(isFirstTime);
      setLastClearedScore(clearedScore);
      setLastClearedCoinsEarned(coinsEarned);

      const prevLevelBest = profile.levelHighScores?.[levelId] || 0;
      const isNew = clearedScore > 0 && (isFirstTime || clearedScore > prevLevelBest);
      setIsNewLevelRecord(isNew);

      // 儲存剛完成的關卡物件供結算彈窗顯示（確保彈窗顯示的是剛通關的關卡，例如通關第 1 關就顯示第 1 關）
      const rawCleared = LEVEL_MISSIONS.find((l) => l.id === levelId) || LEVEL_MISSIONS[0];
      const localizedCleared = getLocalizedLevel(rawCleared, profile.language || 'zh-HK');
      setClearedLevel(localizedCleared);

      // 維持當前關卡為剛通關的 levelId，待玩家點擊「挑戰下一關」時才推進至下一關
      setCurrentLevelId(levelId);

      const nextActiveLevelId = Math.min(LEVEL_MISSIONS.length, levelId + 1);
      const safeReward = Math.min(500, Math.max(0, rewardCoins));

      setProfile((prev) => {
        const alreadyCompleted = (prev.completedLevels || []).includes(levelId);
        const nextCompleted = Array.from(new Set([...(prev.completedLevels || []), levelId]));
        const nextUnlocked = Math.max(prev.unlockedLevel || 1, levelId + 1);
        const stageRewardCoins = !alreadyCompleted ? safeReward : 0;
        // 修正：除了首次通關金幣外，局內吃果實與特殊道具賺取的金幣（coinsEarned）亦切實入帳！
        const totalCoinsToAdd = stageRewardCoins + coinsEarned;
        const existingBest = prev.levelHighScores?.[levelId] || 0;
        const updatedLevelBest = Math.max(existingBest, clearedScore);

        // 防禦：若之前的 LEVELS 高分剛好等於計時或經典模式的高分（舊版洩漏所致），先校正回已知真實關卡最高分
        const priorLevelScores = Object.values(prev.levelHighScores || {}).filter(
          (s): s is number => typeof s === 'number' && s > 0
        );
        const maxRecordedLevel = priorLevelScores.length > 0 ? Math.max(...priorLevelScores) : 0;
        const prevMissionsScore = prev.highScores?.LEVELS || 0;
        const prevTimeScore = prev.highScores?.TIME_ATTACK || 0;
        const prevClassicScore = prev.highScores?.CLASSIC || 0;

        const isPriorLeaked =
          (prevMissionsScore === prevTimeScore && prevTimeScore > 0) ||
          (prevMissionsScore === prevClassicScore && prevClassicScore > 0) ||
          (maxRecordedLevel > 0 && prevMissionsScore > maxRecordedLevel);

        const safeBaseLevelHigh = isPriorLeaked ? maxRecordedLevel : prevMissionsScore;
        const nextHigh = Math.max(safeBaseLevelHigh, clearedScore);

        return {
          ...prev,
          coins: prev.coins + totalCoinsToAdd,
          unlockedLevel: nextUnlocked,
          lastSelectedLevel: nextActiveLevelId,
          completedLevels: nextCompleted,
          hasPlayedMissions: true,
          missionsGamesPlayed: (prev.missionsGamesPlayed || 0) + 1,
          highScores: {
            ...prev.highScores,
            LEVELS: nextHigh,
          },
          levelHighScores: {
            ...(prev.levelHighScores || {}),
            [levelId]: updatedLevelBest,
          },
        };
      });

      updateDailyMissionsProgress('CLEAR_LEVEL', 1);
      const totalEarnedCoinsThisRun = (isFirstTime ? safeReward : 0) + coinsEarned;
      if (totalEarnedCoinsThisRun > 0) {
        updateDailyMissionsProgress('EARN_COINS', totalEarnedCoinsThisRun);
      }

      // Update stage achievements across tiers (每 100 關階級成就)
      if (levelId >= 50) handleAchievementProgress('stage_50', levelId);
      if (levelId >= 100) handleAchievementProgress('stage_100', levelId);
      if (levelId >= 150) handleAchievementProgress('t2_stage_150', levelId);
      if (levelId >= 200) handleAchievementProgress('t2_stage_200', levelId);
      if (levelId >= 250) handleAchievementProgress('t3_stage_250', levelId);
      if (levelId >= 300) handleAchievementProgress('t3_stage_300', levelId);
      if (levelId >= 350) handleAchievementProgress('t4_stage_350', levelId);
      if (levelId >= 400) handleAchievementProgress('t4_stage_400', levelId);

      // 闖關成功時，若得分大於 0，立即將真實關卡最高分提交至 Firebase 闖關排行榜
      const validLevelScores = Object.values(profile.levelHighScores || {}).filter(
        (s): s is number => typeof s === 'number' && s > 0
      );
      const maxRecorded = validLevelScores.length > 0 ? Math.max(...validLevelScores, clearedScore) : clearedScore;
      const bestMissionsScore = maxRecorded;
      if (bestMissionsScore > 0) {
        const userId = getOrCreatePlayerId();
        const currentName = profile.playerName || generateUniquePlayerName(profile.language);
        submitScore(userId, currentName, bestMissionsScore, 'Missions', undefined, true)
          .then((result) => {
            if (result.updated) {
              console.log('[Firebase] 闖關模式通關已提交最高分至排行榜:', result.score);
            }
          })
          .catch((err) => {
            console.warn('提交闖關最高分至 Firebase 異常:', err);
          });
      }
      // 即時同步本地高分至雲端
      syncAllLocalHighScores(profileRef.current).catch(() => {});
      setIsLevelClearOpen(true);
    },
    [profile.completedLevels, profile.levelHighScores, updateDailyMissionsProgress, handleAchievementProgress]
  );

  // Handle Game Over (Losing deducts 1 heart, 包括原位復活後再次失敗均扣 1 心)
  const isGameOverHandledRef = useRef<boolean>(false);

  const handleGameOver = useCallback(
    (
      score: number,
      coinsEarned: number,
      applesEaten: number,
      reason?: GameOverReason,
      snapshot?: {
        levelProgress: {
          normal: number;
          blue: number;
          green: number;
          golden: number;
          shield: number;
          length: number;
          portals?: number;
          magnet?: number;
          chili?: number;
          dragonEgg?: number;
          rainbow?: number;
        };
        snakeLength: number;
        activeLevel?: LevelMission;
        activeMode?: GameMode;
      }
    ) => {
      // Guard to strictly prevent duplicate game-over triggers per session
      if (isGameOverHandledRef.current) return;
      isGameOverHandledRef.current = true;

      const currentProfile = profileRef.current;
      const playedMode = snapshot?.activeMode || selectedMode || 'LEVELS';
      const isMissionMode = playedMode === 'LEVELS';

      // 運用全面消毒器取得該模式純淨的歷史最高分，嚴格防止跨模式污染
      const baselineHigh = getSanitizedHighScore(currentProfile, playedMode);
      const currentHigh = baselineHigh;

      // 只有經典 (CLASSIC)、計時 (TIME_ATTACK)、生存 (SURVIVAL) 等無盡追分模式，且得分大於 0 並超越該模式歷史最高分時，才視為破紀錄
      // 任務闖關 (LEVELS) 屬於關卡挑戰目標模式，失敗為「闖關失敗」，絕不判定為「打破歷史紀錄」
      const isNewHigh = !isMissionMode && score > 0 && score > currentHigh;
      const newBestScore = isMissionMode ? currentHigh : Math.max(currentHigh, score);

      if (isNewHigh) {
        try {
          confetti({
            particleCount: 90,
            spread: 90,
            origin: { y: 0.5 },
          });
        } catch {
          // ignore
        }
      }

      const playedLevel = snapshot?.activeLevel || currentLevelRef.current || currentLevel;
      if (isMissionMode && playedLevel) {
        setCurrentLevelId(playedLevel.id);
      }

      setLastGameStats({
        score,
        coinsEarned,
        applesEaten,
        isNewHigh,
        reason,
        levelProgress: snapshot?.levelProgress,
        snakeLength: snapshot?.snakeLength,
        currentLevel: playedLevel,
      });

      // 每次失敗扣除 1 心（無論首次失敗或原位復活後再次失敗，均切實扣 1 心）
      soundEngine.playHeartLoss();
      setProfile((prev) => {
        const prevModeHigh = getSanitizedHighScore(prev, playedMode);
        // 核心規則：若為闖關模式 (LEVELS)，失敗絕不更新關卡最高分！只有通關 (handleLevelCleared) 才計入高分
        const nextHigh = isMissionMode ? prevModeHigh : Math.max(prevModeHigh, score);
        const currentH = prev.hearts !== undefined ? prev.hearts : 5;
        const newHearts = Math.max(0, currentH - 1);
        const shouldStartCountdown = currentH >= (prev.maxHearts || 5) && newHearts < (prev.maxHearts || 5);

        return {
          ...prev,
          lastSelectedLevel: isMissionMode && playedLevel ? playedLevel.id : (prev.lastSelectedLevel || prev.unlockedLevel || 1),
          hearts: newHearts,
          lastHeartRefillTimestamp: shouldStartCountdown ? Date.now() : prev.lastHeartRefillTimestamp,
          coins: prev.coins + coinsEarned,
          totalGames: prev.totalGames + 1,
          totalApples: prev.totalApples + applesEaten,
          hasPlayedClassic: playedMode === 'CLASSIC' ? true : prev.hasPlayedClassic,
          classicGamesPlayed: playedMode === 'CLASSIC' ? (prev.classicGamesPlayed || 0) + 1 : prev.classicGamesPlayed,
          hasPlayedTimeAttack: playedMode === 'TIME_ATTACK' ? true : prev.hasPlayedTimeAttack,
          timeAttackGamesPlayed: playedMode === 'TIME_ATTACK' ? (prev.timeAttackGamesPlayed || 0) + 1 : prev.timeAttackGamesPlayed,
          hasPlayedMissions: playedMode === 'LEVELS' ? true : prev.hasPlayedMissions,
          missionsGamesPlayed: playedMode === 'LEVELS' ? (prev.missionsGamesPlayed || 0) + 1 : prev.missionsGamesPlayed,
          highScores: {
            ...prev.highScores,
            [playedMode]: nextHigh,
          },
        };
      });

      // Update Daily Missions
      updateDailyMissionsProgress('PLAY_GAMES', 1);
      if (applesEaten > 0) updateDailyMissionsProgress('EAT_APPLES', applesEaten);
      if (coinsEarned > 0) updateDailyMissionsProgress('EARN_COINS', coinsEarned);
      if (score > 0) updateDailyMissionsProgress('HIGH_SCORE', score);

      // Check high scores achievements across all tiers
      if (score >= 500) handleAchievementProgress('score_500', score);
      if (score >= 1500) handleAchievementProgress('t2_score_1500', score);
      if (score >= 3500) handleAchievementProgress('t3_score_3500', score);
      if (score >= 8000) handleAchievementProgress('t4_score_8000', score);

      // Check total fruits eaten achievements across all tiers
      const nextTotalApples = currentProfile.totalApples + applesEaten;
      if (nextTotalApples >= 1) handleAchievementProgress('first_bite', nextTotalApples);
      if (nextTotalApples >= 150) handleAchievementProgress('t2_fruits_150', nextTotalApples);
      if (nextTotalApples >= 400) handleAchievementProgress('t3_fruits_400', nextTotalApples);
      if (nextTotalApples >= 1000) handleAchievementProgress('t4_fruits_1000', nextTotalApples);

      // Check lifetime coins achievements across all tiers
      const nextTotalCoins = currentProfile.coins + coinsEarned;
      if (nextTotalCoins >= 3000) handleAchievementProgress('t3_coins_3000', nextTotalCoins);
      if (nextTotalCoins >= 10000) handleAchievementProgress('t4_coins_10000', nextTotalCoins);

      // 當遊戲結束時提交分數至 Firebase Firestore 排行榜 (僅限經典 CLASSIC、計時 TIME_ATTACK 等無盡模式破紀錄時提交；絕不以低分覆蓋既有高分)
      if (!isMissionMode && isNewHigh && newBestScore > 0) {
        const firestoreMode = normalizeMode(playedMode);
        const userId = getOrCreatePlayerId();
        const currentName = currentProfile.playerName || generateUniquePlayerName(currentProfile.language);
        submitScore(userId, currentName, newBestScore, firestoreMode, currentHigh, false)
          .then((result) => {
            if (result.updated) {
              console.log(`[Firebase] ${result.mode} 模式排行榜已更新最高分:`, result.score);
            }
          })
          .catch((err) => {
            console.warn('提交排行榜至 Firebase 發生異常:', err);
          });
      }
    },
    [selectedMode, currentLevel, handleAchievementProgress, updateDailyMissionsProgress]
  );

  // Game Engine Hook
  const {
    snake,
    direction,
    foodItems,
    obstacles,
    rovingSnakes,
    score,
    coinsEarned,
    applesCount,
    combo,
    timeLeft,
    isShieldActive,
    isSlowActive,
    isMagnetActive,
    isFireActive,
    isGhostActive,
    isKeyAuraActive,
    isRainbowActive,
    snakeColor,
    colorSequenceIndex,
    turnsLeft,
    isSlidingOnIce,
    isFullyIlluminated,
    powerUpTimeLeft,
    portals,
    isPlaying,
    isPaused,
    isGameOver,
    gameOverReason,
    isLevelCleared,
    levelProgress,
    particles,
    floatingTexts,
    fxRef,
    revivesUsed,
    canRevive,
    currentSpeedMs,
    reviveSnake,
    startGame,
    stopGame,
    pauseGame,
    changeDirection,
    triggerReverseGear,
  } = useSnakeEngine({
    mode: selectedMode,
    currentLevel: selectedMode === 'LEVELS' ? currentLevel : undefined,
    language: profile.language || 'zh-HK',
    batterySaverEnabled: profile.batterySaverEnabled ?? false,
    onGameOver: handleGameOver,
    onLevelCleared: handleLevelCleared,
    onAchievementProgress: handleAchievementProgress,
  });

  // Ensure game engine stops completely whenever appView leaves PLAYING
  useEffect(() => {
    if (appView !== 'PLAYING' && isPlaying) {
      stopGame();
    }
  }, [appView, isPlaying, stopGame]);

  // Fail-safe: If appView is PLAYING but game engine is not running and no modal is active, return safely to HOME
  useEffect(() => {
    if (
      appView === 'PLAYING' &&
      !isPlaying &&
      !isPaused &&
      !isGameOver &&
      !isLevelCleared &&
      !isLevelClearOpen &&
      !isLevelSelectOpen &&
      !isItemIntroOpen &&
      !isHeartsOpen &&
      !isShopOpen &&
      !isSettingsOpen
    ) {
      setAppView('HOME');
    }
  }, [
    appView,
    isPlaying,
    isPaused,
    isGameOver,
    isLevelCleared,
    isLevelClearOpen,
    isLevelSelectOpen,
    isItemIntroOpen,
    isHeartsOpen,
    isShopOpen,
    isSettingsOpen,
  ]);

  // Auto-pause active gameplay when user locks screen or tab goes to background, and restore audio on return
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        if (appView === 'PLAYING' && isPlaying && !isPaused) {
          pauseGame(true);
        }
      } else if (document.visibilityState === 'visible') {
        soundEngine.resumeAndRestoreAudio().catch(() => {});
      }
    };

    const handlePageHide = () => {
      if (appView === 'PLAYING' && isPlaying && !isPaused) {
        pauseGame(true);
      }
    };

    const handleFocus = () => {
      soundEngine.resumeAndRestoreAudio().catch(() => {});
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('focus', handleFocus);
    };
  }, [appView, isPlaying, isPaused, pauseGame]);

  // Current active Skin and Arena
  const currentSkin = useMemo(() => {
    return (
      SNAKE_SKINS.find((s) => s.id === profile.selectedSkin) || SNAKE_SKINS[0]
    );
  }, [profile.selectedSkin]);

  const currentArena = useMemo(() => {
    return (
      ARENA_THEMES.find((a) => a.id === profile.selectedArena) || ARENA_THEMES[0]
    );
  }, [profile.selectedArena]);

  // Utility overlay modals (Hearts, Shop, Rewards, Leaderboard, Settings, Guides, Stage Map, Item Intro, Privacy Policy)
  const isUtilityModalOpen =
    isHeartsOpen ||
    isShopOpen ||
    isRewardsOpen ||
    isLeaderboardOpen ||
    isSettingsOpen ||
    isLevelSelectOpen ||
    isTutorialOpen ||
    isMobileGuideOpen ||
    isItemIntroOpen ||
    isPrivacyPolicyOpen ||
    isTermsOfServiceOpen;

  // Active level cleared modal state
  const isLevelClearActive = isLevelClearOpen;

  // Unified modal visibility and active tab helpers
  const isAnyModalOpen = isUtilityModalOpen || isLevelClearActive || isGameOver;

  const activeModal: 'HEARTS' | 'SHOP' | 'REWARDS' | 'LEADERBOARD' | 'SETTINGS' | 'OTHER' | null = useMemo(() => {
    if (isHeartsOpen) return 'HEARTS';
    if (isShopOpen) return 'SHOP';
    if (isRewardsOpen) return 'REWARDS';
    if (isLeaderboardOpen) return 'LEADERBOARD';
    if (isSettingsOpen) return 'SETTINGS';
    if (isLevelSelectOpen || isTutorialOpen || isMobileGuideOpen || isItemIntroOpen || isPrivacyPolicyOpen || isTermsOfServiceOpen || isLevelClearActive || isGameOver) return 'OTHER';
    return null;
  }, [
    isHeartsOpen,
    isShopOpen,
    isRewardsOpen,
    isLeaderboardOpen,
    isSettingsOpen,
    isLevelSelectOpen,
    isTutorialOpen,
    isMobileGuideOpen,
    isItemIntroOpen,
    isPrivacyPolicyOpen,
    isTermsOfServiceOpen,
    isLevelClearActive,
    isGameOver,
  ]);

  const closeAllModals = useCallback(() => {
    setIsHeartsOpen(false);
    setIsShopOpen(false);
    setIsRewardsOpen(false);
    setIsLeaderboardOpen(false);
    setIsSettingsOpen(false);
    setIsLevelSelectOpen(false);
    setIsTutorialOpen(false);
    setIsMobileGuideOpen(false);
    setIsItemIntroOpen(false);
    setIsPrivacyPolicyOpen(false);
    setIsTermsOfServiceOpen(false);
  }, []);

  const handleToggleHearts = useCallback(() => {
    if (appView === 'PLAYING' && isPlaying && !isPaused) {
      pauseGame();
    }
    if (isHeartsOpen) {
      setIsHeartsOpen(false);
    } else {
      closeAllModals();
      setIsHeartsOpen(true);
    }
  }, [appView, isPlaying, isPaused, pauseGame, isHeartsOpen, closeAllModals]);

  const handleToggleShop = useCallback(
    (tab: 'SKINS' | 'ARENAS' | 'COINS' = 'SKINS') => {
      if (appView === 'PLAYING' && isPlaying && !isPaused) {
        pauseGame();
      }
      if (isShopOpen && (shopTab === tab || tab === 'SKINS')) {
        setIsShopOpen(false);
      } else {
        closeAllModals();
        setShopTab(tab);
        setIsShopOpen(true);
      }
    },
    [appView, isPlaying, isPaused, pauseGame, isShopOpen, shopTab, closeAllModals]
  );

  const handleOpenShop = useCallback(
    (tab: 'SKINS' | 'ARENAS' | 'COINS' = 'SKINS') => {
      if (appView === 'PLAYING' && isPlaying && !isPaused) {
        pauseGame();
      }
      closeAllModals();
      setShopTab(tab);
      setIsShopOpen(true);
    },
    [appView, isPlaying, isPaused, pauseGame, closeAllModals]
  );

  const handleToggleRewards = useCallback(
    (tab: 'CHECKIN' | 'DAILY_MISSIONS' | 'ACHIEVEMENTS' = 'DAILY_MISSIONS') => {
      if (appView === 'PLAYING' && isPlaying && !isPaused) {
        pauseGame();
      }
      if (isRewardsOpen && rewardsTab === tab) {
        setIsRewardsOpen(false);
      } else {
        closeAllModals();
        setRewardsTab(tab);
        setIsRewardsOpen(true);
      }
    },
    [appView, isPlaying, isPaused, pauseGame, isRewardsOpen, rewardsTab, closeAllModals]
  );

  const handleOpenRewards = useCallback(
    (tab: 'CHECKIN' | 'DAILY_MISSIONS' | 'ACHIEVEMENTS' = 'DAILY_MISSIONS') => {
      if (appView === 'PLAYING' && isPlaying && !isPaused) {
        pauseGame();
      }
      closeAllModals();
      setRewardsTab(tab);
      setIsRewardsOpen(true);
    },
    [appView, isPlaying, isPaused, pauseGame, closeAllModals]
  );

  const handleToggleLeaderboard = useCallback(() => {
    if (appView === 'PLAYING' && isPlaying && !isPaused) {
      pauseGame();
    }
    if (isLeaderboardOpen) {
      setIsLeaderboardOpen(false);
    } else {
      closeAllModals();
      setIsLeaderboardOpen(true);
    }
  }, [appView, isPlaying, isPaused, pauseGame, isLeaderboardOpen, closeAllModals]);

  const handleToggleSettings = useCallback(() => {
    if (appView === 'PLAYING' && isPlaying && !isPaused) {
      pauseGame();
    }
    if (isSettingsOpen) {
      setIsSettingsOpen(false);
    } else {
      closeAllModals();
      setIsSettingsOpen(true);
    }
  }, [appView, isPlaying, isPaused, pauseGame, isSettingsOpen, closeAllModals]);

  // Start level helper with first-time item discovery intro check
  const startLevelWithItemCheck = useCallback(
    (targetLvl: LevelMission) => {
      stopGame();
      closeAllModals();
      setIsLevelClearOpen(false);
      setClearedLevel(null);

      if (profile.hearts <= 0) {
        soundEngine.playTurn();
        setIsHeartsOpen(true);
        return;
      }

      // Check if this level introduces any items the player hasn't seen before
      const unseen = getUnseenItemsInLevel(targetLvl, profile.seenItems || []);
      if (unseen.length > 0) {
        // Persist items to seenItems right away so player is never trapped in repeated intro dialogs
        setProfile((prev) => ({
          ...prev,
          seenItems: Array.from(new Set([...(prev.seenItems || []), ...unseen])),
        }));
        setPendingLevelToStart(targetLvl);
        setIntroItemsToShow(unseen);
        setIsCompendiumMode(false);
        setIsItemIntroOpen(true);
        return;
      }

      // No new unseen items, start the mission directly
      isGameOverHandledRef.current = false;
      setLastGameStats({ score: 0, coinsEarned: 0, applesEaten: 0, isNewHigh: false });
      setSelectedMode('LEVELS');
      setCurrentLevelId(targetLvl.id);
      setProfile((prev) => ({
        ...prev,
        hasPlayedMissions: true,
        missionsGamesPlayed: (prev.missionsGamesPlayed || 0) + 1,
        lastSelectedLevel: targetLvl.id,
      }));
      setAppView('PLAYING');
      startGame('LEVELS', targetLvl);
    },
    [closeAllModals, profile.hearts, profile.seenItems, stopGame, startGame]
  );

  const handleConfirmItemIntro = useCallback(() => {
    // 1. Mark these items as seen in profile (persisted in localStorage) only if launched from actual level start
    if (!isCompendiumMode && introItemsToShow.length > 0) {
      setProfile((prev) => {
        const updatedSeen = Array.from(new Set([...(prev.seenItems || []), ...introItemsToShow]));
        return {
          ...prev,
          seenItems: updatedSeen,
        };
      });
    }

    setIsItemIntroOpen(false);

    // 2. If launched from a pending level, start that level now!
    if (pendingLevelToStart && !isCompendiumMode) {
      const targetLvl = pendingLevelToStart;
      setPendingLevelToStart(null);
      stopGame();
      isGameOverHandledRef.current = false;
      setLastGameStats({ score: 0, coinsEarned: 0, applesEaten: 0, isNewHigh: false });
      setSelectedMode('LEVELS');
      setCurrentLevelId(targetLvl.id);
      setProfile((prev) => ({
        ...prev,
        hasPlayedMissions: true,
        missionsGamesPlayed: (prev.missionsGamesPlayed || 0) + 1,
        lastSelectedLevel: targetLvl.id,
      }));
      setAppView('PLAYING');
      startGame('LEVELS', targetLvl);
    }
  }, [introItemsToShow, pendingLevelToStart, isCompendiumMode, stopGame, startGame]);

  const handleOpenItemCompendium = useCallback(() => {
    closeAllModals();
    setIntroItemsToShow(Object.keys(ITEM_INTRO_DEFINITIONS) as ItemIntroType[]);
    setIsCompendiumMode(true);
    setIsItemIntroOpen(true);
  }, [closeAllModals]);

  const handleResetItemIntros = useCallback(() => {
    setProfile((prev) => ({
      ...prev,
      seenItems: [],
    }));
  }, []);

  // Start game with Candy Crush zero hearts check
  const handleStartMode = (modeToStart: GameMode, specificLevel?: LevelMission) => {
    closeAllModals();
    setIsLevelClearOpen(false);
    setClearedLevel(null);
    if (profile.hearts <= 0) {
      soundEngine.playTurn();
      setIsHeartsOpen(true);
      return;
    }
    if (modeToStart === 'LEVELS') {
      const maxUnlocked = profile.unlockedLevel || 1;
      let activeId =
        specificLevel?.id ||
        currentLevelId ||
        profile.lastSelectedLevel ||
        maxUnlocked;

      // 若未開啟全關試玩，且該關未通關且大於目前解鎖關卡，自動校正回當前最高已解鎖關卡
      if (!profile.unlockAllLevels && !(profile.completedLevels || []).includes(activeId) && activeId > maxUnlocked) {
        activeId = maxUnlocked;
      }

      const targetLvl =
        LEVEL_MISSIONS.find((l) => l.id === activeId) ||
        LEVEL_MISSIONS.find((l) => l.id === maxUnlocked) ||
        LEVEL_MISSIONS[0];
      startLevelWithItemCheck(targetLvl);
    } else {
      isGameOverHandledRef.current = false;
      setLastGameStats({ score: 0, coinsEarned: 0, applesEaten: 0, isNewHigh: false });
      setSelectedMode(modeToStart);
      if (modeToStart === 'CLASSIC') {
        setProfile((prev) => ({
          ...prev,
          hasPlayedClassic: true,
          classicGamesPlayed: (prev.classicGamesPlayed || 0) + 1,
        }));
      } else if (modeToStart === 'TIME_ATTACK') {
        setProfile((prev) => ({
          ...prev,
          hasPlayedTimeAttack: true,
          timeAttackGamesPlayed: (prev.timeAttackGamesPlayed || 0) + 1,
        }));
      }
      setAppView('PLAYING');
      startGame(modeToStart);
    }
  };

  const handleRestartFromGameOver = () => {
    if (profile.hearts <= 0) {
      soundEngine.playTurn();
      setIsHeartsOpen(true);
      return;
    }
    const levelToPlay = lastGameStats.currentLevel || currentLevel;
    if (selectedMode === 'LEVELS' && levelToPlay) {
      startLevelWithItemCheck(levelToPlay);
    } else {
      isGameOverHandledRef.current = false;
      setIsLevelClearOpen(false);
      setClearedLevel(null);
      setLastGameStats({ score: 0, coinsEarned: 0, applesEaten: 0, isNewHigh: false });
      if (selectedMode === 'CLASSIC') {
        setProfile((prev) => ({
          ...prev,
          hasPlayedClassic: true,
          classicGamesPlayed: (prev.classicGamesPlayed || 0) + 1,
        }));
      } else if (selectedMode === 'TIME_ATTACK') {
        setProfile((prev) => ({
          ...prev,
          hasPlayedTimeAttack: true,
          timeAttackGamesPlayed: (prev.timeAttackGamesPlayed || 0) + 1,
        }));
      }
      startGame(selectedMode);
    }
  };

  const handleBackToMenu = () => {
    stopGame();
    setIsLevelClearOpen(false);
    setClearedLevel(null);
    const lastLvl =
      lastGameStats.currentLevel?.id ||
      currentLevelId ||
      profile.lastSelectedLevel ||
      profile.unlockedLevel ||
      1;
    setCurrentLevelId(lastLvl);
    setProfile((prev) => ({
      ...prev,
      lastSelectedLevel: lastLvl,
    }));
    setAppView('HOME');
  };

  // Deduct 1 heart helper with strict debounce to guarantee strictly 1 heart deduction
  const lastDeductTimeRef = useRef<number>(0);
  const deductHeart = useCallback(() => {
    const nowTime = Date.now();
    if (nowTime - lastDeductTimeRef.current < 800) {
      return;
    }
    lastDeductTimeRef.current = nowTime;

    setProfile((prev) => {
      const currentH = prev.hearts !== undefined ? prev.hearts : 5;
      const newHearts = Math.max(0, currentH - 1);
      const shouldStartCountdown = currentH >= (prev.maxHearts || 5) && newHearts < (prev.maxHearts || 5);

      return {
        ...prev,
        hearts: newHearts,
        lastHeartRefillTimestamp: shouldStartCountdown ? Date.now() : prev.lastHeartRefillTimestamp,
      };
    });
  }, []);

  // In-Game Restart: Deducts strictly 1 heart
  const handleInGameRestart = useCallback(() => {
    if (profile.hearts <= 0) {
      soundEngine.playTurn();
      setIsHeartsOpen(true);
      return;
    }

    // Deduct 1 heart on restart
    deductHeart();
    soundEngine.playHeartLoss();
    showHeartNotice(
      profile.language === 'en'
        ? '💔 Restarted: -1 Heart'
        : profile.language === 'ja'
        ? '💔 リスタート：ハート-1'
        : profile.language === 'zh-CN'
        ? '💔 重新开始扣除 1 心'
        : '💔 重新開始扣除 1 心'
    );

    isGameOverHandledRef.current = false;
    setIsLevelClearOpen(false);
    setClearedLevel(null);
    startGame(selectedMode, selectedMode === 'LEVELS' ? currentLevel : undefined);
  }, [profile.hearts, profile.language, deductHeart, showHeartNotice, startGame, selectedMode, currentLevel]);

  // In-Game Quit / Leave: Stops engine and deducts strictly 1 heart
  const handleInGameQuit = useCallback(() => {
    // 1. Immediately lock game over so no background triggers can occur
    isGameOverHandledRef.current = true;
    const wasActiveGameplay = appView === 'PLAYING' && isPlaying && !isGameOver && !isLevelCleared;

    // 2. Stop snake game engine completely
    stopGame();
    setIsLevelClearOpen(false);
    setClearedLevel(null);

    // 3. Only deduct heart if game was actively running (not already game over, stopped, or cleared)
    if (wasActiveGameplay) {
      deductHeart();
      soundEngine.playHeartLoss();
      showHeartNotice(
        profile.language === 'en'
          ? '💔 Quit Game: -1 Heart'
          : profile.language === 'ja'
          ? '💔 途中退出：ハート-1'
          : profile.language === 'zh-CN'
          ? '💔 离开游戏扣除 1 心'
          : '💔 離開遊戲扣除 1 心'
      );
    }
    setAppView('HOME');
  }, [appView, isPlaying, stopGame, isGameOver, isLevelCleared, deductHeart, showHeartNotice, profile.language]);

  // Header Go Home Handler
  const handleGoHome = useCallback(() => {
    closeAllModals();
    setIsLevelClearOpen(false);
    if (appView === 'PLAYING') {
      if (isPlaying && !isGameOver && !isLevelCleared) {
        handleInGameQuit();
      } else {
        stopGame();
        setAppView('HOME');
      }
    } else {
      setAppView('HOME');
    }
  }, [closeAllModals, appView, isPlaying, isGameOver, isLevelCleared, handleInGameQuit, stopGame]);

  // Add hearts handler (via ads, coins, or IAP)
  const handleAddHearts = useCallback((amount: number, coinCost?: number): boolean => {
    if (coinCost && profile.coins < coinCost) {
      return false;
    }
    setProfile((prev) => {
      const nextCoins = coinCost ? Math.max(0, prev.coins - coinCost) : prev.coins;
      const nextHearts = prev.hearts + amount;
      return {
        ...prev,
        coins: nextCoins,
        hearts: nextHearts,
      };
    });
    return true;
  }, [profile.coins]);

  // Free short video ad reward handler: max 5 times per day (+1 heart per ad)
  const handleWatchAdReward = useCallback((): boolean => {
    const today = getTodayDateString();
    let rewarded = false;
    setProfile((prev) => {
      const isNewDay = prev.dailyAdWatchDate !== today;
      const currentCount = isNewDay ? 0 : (prev.dailyAdWatchCount || 0);
      if (currentCount >= 5) {
        return prev;
      }
      rewarded = true;
      return {
        ...prev,
        dailyAdWatchDate: today,
        dailyAdWatchCount: currentCount + 1,
        hearts: (prev.hearts !== undefined ? prev.hearts : 5) + 1,
      };
    });
    return rewarded;
  }, []);

  const handleClaimAchievementReward = (achId: string) => {
    setAchievements((prev) => {
      const ach = prev.find((a) => a.id === achId);
      if (!ach || ach.claimed) return prev;

      // 嚴格校正：若成就所屬階級尚未解鎖（例如未到達第101關），絕不可領取！
      const playerLevel = profileRef.current?.unlockedLevel || 1;
      if (!isAchievementTierUnlocked(ach, playerLevel)) {
        return prev;
      }

      soundEngine.playSpecialEat();
      soundEngine.haptic('success');

      try {
        confetti({
          particleCount: 70,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }

      setProfile((p) => ({
        ...p,
        coins: p.coins + ach.rewardCoins,
      }));

      return prev.map((a) =>
        a.id === achId ? { ...a, unlocked: true, claimed: true } : a
      );
    });
  };

  // Double-claim prevention ref for rapid clicking/tapping
  const claimingMissionIdsRef = useRef<Set<string>>(new Set());

  const handleClaimDailyMissionReward = useCallback((missionId: string) => {
    if (claimingMissionIdsRef.current.has(missionId)) {
      return;
    }

    setProfile((prev) => {
      const missions = prev.dailyMissions || [];
      const target = missions.find((m) => m.id === missionId);
      if (!target || !target.completed || target.claimed) {
        return prev;
      }

      claimingMissionIdsRef.current.add(missionId);
      setTimeout(() => {
        claimingMissionIdsRef.current.delete(missionId);
      }, 600);

      soundEngine.playSpecialEat();
      soundEngine.haptic('success');

      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }

      const isCheckIn = target.id === 'daily_checkin';
      const coinsToAdd = isCheckIn ? 100 : (target.rewardCoins || 0);
      const heartsToAdd = isCheckIn ? 0 : (target.rewardHearts || 0);

      // Streak only increments once per day! If already checked in today, do not increment streak again
      const isNewCheckInDay = isCheckIn && prev.lastCheckInDate !== todayStr;
      const nextStreak = isNewCheckInDay ? (prev.checkInStreak || 0) + 1 : (prev.checkInStreak || 0);

      return {
        ...prev,
        coins: prev.coins + coinsToAdd,
        hearts: heartsToAdd > 0 ? prev.hearts + heartsToAdd : prev.hearts,
        lastCheckInDate: isCheckIn ? todayStr : prev.lastCheckInDate,
        checkInStreak: nextStreak,
        dailyMissions: missions.map((m) =>
          m.id === missionId ? { ...m, claimed: true, completed: true, progress: m.maxProgress } : m
        ),
      };
    });
  }, [todayStr]);

  // Atomic batch claim for all eligible daily missions at once
  const handleClaimAllDailyMissions = useCallback(() => {
    setProfile((prev) => {
      const missions = prev.dailyMissions || [];
      const claimable = missions.filter((m) => m.completed && !m.claimed);
      if (claimable.length === 0) return prev;

      soundEngine.playSpecialEat();
      soundEngine.haptic('success');

      try {
        confetti({
          particleCount: 80,
          spread: 75,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }

      let totalCoins = 0;
      let totalHearts = 0;
      let hasCheckIn = false;
      const claimedIds = new Set(claimable.map((m) => m.id));

      claimable.forEach((m) => {
        if (m.id === 'daily_checkin') {
          totalCoins += 100;
          hasCheckIn = true;
        } else {
          totalCoins += m.rewardCoins || 0;
          totalHearts += m.rewardHearts || 0;
        }
      });

      const isNewCheckInDay = hasCheckIn && prev.lastCheckInDate !== todayStr;
      const nextStreak = isNewCheckInDay ? (prev.checkInStreak || 0) + 1 : (prev.checkInStreak || 0);

      return {
        ...prev,
        coins: prev.coins + totalCoins,
        hearts: totalHearts > 0 ? prev.hearts + totalHearts : prev.hearts,
        lastCheckInDate: hasCheckIn ? todayStr : prev.lastCheckInDate,
        checkInStreak: nextStreak,
        dailyMissions: missions.map((m) =>
          claimedIds.has(m.id) ? { ...m, claimed: true, completed: true, progress: m.maxProgress } : m
        ),
      };
    });
  }, [todayStr]);

  // Revive in Levels mode with gold coins (只限[任務闖關]，且只可復活一次，且必須持有愛心)
  const handleReviveInGame = useCallback(() => {
    // 1. 原位復活只限[任務闖關]，且只可復活一次
    if (selectedMode !== 'LEVELS' || revivesUsed >= 1) {
      return;
    }

    // 2. 如果無晒心，係唔可以原位復活，要先換/買咗心先
    if (profile.hearts <= 0) {
      soundEngine.playTurn();
      closeAllModals();
      setIsHeartsOpen(true);
      return;
    }

    // 3. 檢查金幣是否足夠
    const reviveCost = 5000;
    if (profile.coins < reviveCost) {
      soundEngine.playTurn();
      handleOpenShop('COINS');
      return;
    }

    // 4. 扣除 5000 金幣（絕對不修改愛心，修復無端端增加愛心的 bug！）
    setProfile((prev) => ({
      ...prev,
      coins: Math.max(0, prev.coins - reviveCost),
    }));

    // 復活後本局金幣統計重新由 0 計算（已派發的金幣不重覆發放）
    setLastClearedCoinsEarned(0);
    setLastGameStats((prev) => ({
      ...prev,
      coinsEarned: 0,
    }));

    soundEngine.playRevive();
    soundEngine.haptic('heavy');
    isGameOverHandledRef.current = false;
    reviveSnake();
  }, [selectedMode, revivesUsed, profile.hearts, profile.coins, closeAllModals, handleOpenShop, reviveSnake]);

  const handleResetData = useCallback(() => {
    const userLang = profile.language || 'zh-HK';
    const oldFid = getOrCreatePlayerId();

    // 1. 徹底銷毀舊 FID 並清除 Firestore 雲端排行榜中舊 FID 的各模式紀錄
    deleteAllPlayerScoresFromLeaderboard(oldFid).catch((err) => {
      console.warn('重設本地遊戲進度時清除雲端紀錄警示:', err);
    });

    // 2. 生成全新乾淨的 PlayerProfile，所有模式高分與場次徹底歸零
    const resetProfile = createDefaultPlayerProfile(userLang);
    const freshProfile: PlayerProfile = {
      ...resetProfile,
      language: userLang,
      hasCustomLanguage: profile.hasCustomLanguage ?? false,
      soundEnabled: profile.soundEnabled ?? true,
      bgmEnabled: profile.bgmEnabled ?? true,
      dailyMissionsDate: todayStr,
      dailyMissions: getDefaultDailyMissions(),
      hearts: 5,
      maxHearts: 5,
      coins: 0,
      highScores: {
        CLASSIC: 0,
        TIME_ATTACK: 0,
        LEVELS: 0,
        SURVIVAL: 0,
      },
      levelHighScores: {},
      completedLevels: [],
      hasPlayedClassic: false,
      classicGamesPlayed: 0,
      hasPlayedTimeAttack: false,
      timeAttackGamesPlayed: 0,
      hasPlayedMissions: false,
      missionsGamesPlayed: 0,
      unlockedLevel: 1,
      lastSelectedLevel: 1,
      seenItems: [],
    };

    setProfile(freshProfile);
    setCurrentLevelId(1);
    setClearedLevel(null);
    setIsLevelClearOpen(false);
    setAchievements(INITIAL_ACHIEVEMENTS);

    try {
      localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(freshProfile));
      localStorage.setItem(STORAGE_ACHIEVEMENTS_KEY, JSON.stringify(INITIAL_ACHIEVEMENTS));
    } catch {
      // ignore
    }

    soundEngine.playSpecialEat();
    soundEngine.haptic('medium');

    const successMsg =
      userLang === 'en'
        ? '🔄 Local game progress reset to defaults!'
        : userLang === 'ja'
        ? '🔄 ローカル進行状況が初期状態にリセットされました！'
        : userLang === 'zh-CN'
        ? '🔄 本地游戏进度已成功重设！(已恢复初始状态)'
        : '🔄 本機遊戲進度已成功重設！(已回復初始狀態)';
    showHeartNotice(successMsg);
  }, [profile.language, profile.hasCustomLanguage, profile.soundEnabled, profile.bgmEnabled, todayStr, showHeartNotice]);

  // Toggle Unlock All Levels (試玩測試模式)
  const handleToggleUnlockAll = useCallback(() => {
    setProfile((prev) => ({
      ...prev,
      unlockAllLevels: !(prev.unlockAllLevels ?? false),
    }));
  }, []);

  // Restore normal linear stage progression
  // (依序闖關規則：必須先通關前面關卡才能開啟後面的關卡)
  const handleRestoreProgression = useCallback(() => {
    setProfile((prev) => {
      const rawComp = prev.completedLevels || [];
      let seqUnlocked = 1;
      while (rawComp.includes(seqUnlocked)) {
        seqUnlocked++;
      }
      const seqComp = rawComp.filter((lvl) => typeof lvl === 'number' && lvl < seqUnlocked);
      return {
        ...prev,
        unlockAllLevels: false,
        unlockedLevel: seqUnlocked,
        lastSelectedLevel: seqUnlocked,
        completedLevels: seqComp,
      };
    });
  }, []);

  return (
    <div className="w-full h-full min-h-[100dvh] flex-1 max-w-[480px] mx-auto text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white overflow-hidden relative overscroll-none bg-[#060914] bg-[url('/assets/neon_digital_grid_bg.svg')] bg-cover bg-center bg-no-repeat shadow-2xl">
      {/* Decorative ambient neon glow orbs */}
      <div className="absolute -top-16 -left-16 w-56 h-56 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none animate-pulse-glow" />
      <div className="absolute top-1/3 -right-16 w-60 h-60 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none animate-pulse-glow" style={{ animationDelay: '2s' }} />
      <div className="absolute -bottom-16 left-1/4 w-52 h-52 rounded-full bg-cyan-400/10 blur-3xl pointer-events-none animate-pulse-glow" style={{ animationDelay: '3s' }} />

      {/* Top Header with Hearts in top-left - Always unified and visible */}
      <GameHeader
        language={profile.language || 'zh-HK'}
        score={score}
        coinsEarned={coinsEarned}
        highScore={getSanitizedHighScore(profile, selectedMode)}
        combo={combo}
        coins={profile.coins}
        hearts={profile.hearts}
        maxHearts={profile.maxHearts || 5}
        nextRefillSeconds={heartsState.nextRefillSeconds}
        mode={selectedMode}
        timeLeft={timeLeft}
        currentLevel={selectedMode === 'LEVELS' ? currentLevel : undefined}
        levelProgress={levelProgress}
        turnsLeft={selectedMode === 'LEVELS' ? turnsLeft : undefined}
        colorSequenceIndex={colorSequenceIndex}
        snakeColor={snakeColor}
        isPlaying={appView === 'PLAYING'}
        isPaused={isPaused}
        snakeLength={snake.length}
        isModalOpen={isAnyModalOpen}
        activeModal={activeModal}
        onTogglePause={pauseGame}
        onOpenHearts={handleToggleHearts}
        onOpenSettings={handleToggleSettings}
        onOpenShop={() => handleToggleShop('SKINS')}
        onOpenRewards={() => handleToggleRewards('DAILY_MISSIONS')}
        onOpenLeaderboard={handleToggleLeaderboard}
        onOpenMobileGuide={() => {
          closeAllModals();
          setIsMobileGuideOpen(true);
        }}
        onGoHome={handleGoHome}
        onOpenLevelSelect={() => {
          if (appView === 'PLAYING' && isPlaying && !isPaused) {
            pauseGame();
          }
          closeAllModals();
          setIsLevelSelectOpen(true);
        }}
        hasRewardsNotification={hasRewardsNotification}
        hasUnclaimedDailyReward={canCheckInToday}
      />

      {/* Heart / Reward Floating Notification Banner */}
      {heartNotice && (
        <div className="fixed top-20 sm:top-24 inset-x-0 mx-auto w-fit z-50 animate-bounce-in pointer-events-none select-none px-3">
          <div
            className={`border text-xs font-black px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 backdrop-blur-md ${
              heartNotice.includes('+') || heartNotice.includes('🎉')
                ? 'bg-emerald-950/95 border-emerald-400 text-emerald-100 shadow-emerald-500/20'
                : 'bg-rose-950/95 border-rose-500 text-rose-100 shadow-rose-500/20'
            }`}
          >
            <span className="text-base animate-pulse">
              {heartNotice.includes('+') || heartNotice.includes('🎉') ? '❤️' : '💔'}
            </span>
            <span>{heartNotice.replace(/^[💔❤️🎉\s]+/, '')}</span>
          </div>
        </div>
      )}

      {/* Main View Area: Stretches 100% of available height to fit any phone screen size */}
      <main className="flex-1 min-h-0 w-full flex flex-col relative overflow-hidden">
        {appView === 'HOME' ? (
          <div className="w-full h-full flex-1 min-h-0 flex flex-col overflow-hidden">
            <HomeScreen
              profile={profile}
              currentLevelId={currentLevelId}
              nextRefillSeconds={heartsState.nextRefillSeconds}
              onStartMode={handleStartMode}
              onOpenHearts={() => {
                closeAllModals();
                setIsHeartsOpen(true);
              }}
              onOpenMobileGuide={() => {
                closeAllModals();
                setIsMobileGuideOpen(true);
              }}
              onOpenLevelSelect={() => {
                closeAllModals();
                setIsLevelSelectOpen(true);
              }}
              onOpenTutorial={() => {
                closeAllModals();
                setIsTutorialOpen(true);
              }}
              onOpenSettings={() => {
                closeAllModals();
                setIsSettingsOpen(true);
              }}
              onOpenPrivacyPolicy={() => {
                closeAllModals();
                setPrivacyModalInitialTab('POLICY');
                setIsPrivacyPolicyOpen(true);
              }}
              onOpenTermsOfService={() => {
                closeAllModals();
                setIsTermsOfServiceOpen(true);
              }}
            />
          </div>
        ) : (
          <div className="w-full h-full flex-1 min-h-0 flex flex-col relative overflow-hidden">
            <ModernGameCanvas
              snake={snake}
              direction={direction}
              foodItems={foodItems}
              obstacles={obstacles}
              rovingSnakes={rovingSnakes}
              particles={particles}
              floatingTexts={floatingTexts}
              fxRef={fxRef}
              skin={currentSkin}
              arena={currentArena}
              showGrid={profile.showGrid}
              isShieldActive={isShieldActive}
              isSlowActive={isSlowActive}
              isMagnetActive={isMagnetActive}
              isFireActive={isFireActive}
              isKeyAuraActive={isKeyAuraActive}
              isRainbowActive={isRainbowActive}
              powerUpTimeLeft={powerUpTimeLeft}
              portals={selectedMode === 'LEVELS' ? portals : undefined}
              isPaused={isPaused}
              score={score}
              coinsEarned={coinsEarned}
              language={profile.language || 'zh-HK'}
              controlType={profile.controlType || 'DPAD'}
              combo={combo}
              isGhostActive={isGhostActive}
              snakeColor={snakeColor}
              colorSequenceIndex={colorSequenceIndex}
              turnsLeft={selectedMode === 'LEVELS' ? turnsLeft : undefined}
              isSlidingOnIce={isSlidingOnIce}
              isFullyIlluminated={isFullyIlluminated}
              currentSpeedMs={currentSpeedMs}
              currentMission={selectedMode === 'LEVELS' ? currentLevel : undefined}
              batterySaverEnabled={profile.batterySaverEnabled ?? false}
              targetFps={profile.targetFps ?? 60}
              glowEffectsEnabled={profile.glowEffectsEnabled ?? true}
              onDirectionChange={changeDirection}
              onToggleControlType={(newType) => {
                setProfile((prev) => ({ ...prev, controlType: newType }));
              }}
              onTogglePause={pauseGame}
              onRestart={handleInGameRestart}
              onQuit={handleInGameQuit}
            />
          </div>
        )}
      </main>

      {/* Modals */}
      <LevelClearModal
        isOpen={isLevelClearActive && !isUtilityModalOpen}
        level={clearedLevel || currentLevel}
        score={lastClearedScore}
        highScore={profile.levelHighScores?.[clearedLevel?.id ?? currentLevelId] || lastClearedScore}
        isNewRecord={isNewLevelRecord}
        language={profile.language || 'zh-HK'}
        isFirstTimeClear={wasFirstTimeClear}
        coinsEarned={lastClearedCoinsEarned}
        hasNextLevel={(clearedLevel?.id ?? currentLevelId) < LEVEL_MISSIONS.length}
        onNextLevel={() => {
          setIsLevelClearOpen(false);
          const finishedId = clearedLevel?.id ?? currentLevelId;
          const nextId = Math.min(LEVEL_MISSIONS.length, finishedId + 1);
          const nextLevel = LEVEL_MISSIONS.find((l) => l.id === nextId) || LEVEL_MISSIONS[0];
          setClearedLevel(null);
          setCurrentLevelId(nextId);
          startLevelWithItemCheck(nextLevel);
        }}
        onReplay={() => {
          setIsLevelClearOpen(false);
          if (profile.hearts <= 0) {
            soundEngine.playTurn();
            setIsHeartsOpen(true);
            return;
          }
          const levelToReplay = clearedLevel || currentLevel;
          setClearedLevel(null);
          setCurrentLevelId(levelToReplay.id);
          startLevelWithItemCheck(levelToReplay);
        }}
        onOpenLevelSelect={() => {
          stopGame();
          setIsLevelClearOpen(false);
          const finishedId = clearedLevel?.id ?? currentLevelId;
          const nextLevelNum = Math.min(LEVEL_MISSIONS.length, finishedId + 1);
          setClearedLevel(null);
          setCurrentLevelId(nextLevelNum);
          setAppView('HOME');
          setIsLevelSelectOpen(true);
        }}
      />

      {/* Adventure Stage Map Modal */}
      <LevelSelectModal
        isOpen={isLevelSelectOpen}
        language={profile.language || 'zh-HK'}
        unlockedLevel={profile.unlockedLevel || 1}
        currentLevelId={currentLevelId}
        completedLevels={profile.completedLevels || []}
        levelHighScores={profile.levelHighScores || {}}
        unlockAllLevels={profile.unlockAllLevels ?? false}
        onToggleUnlockAll={handleToggleUnlockAll}
        onRestoreProgression={handleRestoreProgression}
        onClose={() => {
          setIsLevelSelectOpen(false);
          if (appView === 'PLAYING') {
            if (isPlaying && !isGameOver && !isLevelCleared) {
              if (isPaused) {
                pauseGame(false);
              }
            } else {
              stopGame();
              setAppView('HOME');
            }
          } else {
            setAppView('HOME');
          }
        }}
        onSelectLevel={(lvl) => {
          if (profile.hearts <= 0) {
            soundEngine.playTurn();
            setIsHeartsOpen(true);
            return;
          }
          setIsLevelSelectOpen(false);
          setIsLevelClearOpen(false);
          startLevelWithItemCheck(lvl);
        }}
      />

      {/* Game Over Modal with Hearts Status & Gold Revive */}
      <GameOverModal
        isOpen={appView === 'PLAYING' && isGameOver && !isUtilityModalOpen}
        language={profile.language || 'zh-HK'}
        score={lastGameStats.score}
        highScore={getSanitizedHighScore(profile, selectedMode)}
        isNewHigh={lastGameStats.isNewHigh}
        coinsEarned={lastGameStats.coinsEarned}
        applesEaten={lastGameStats.applesEaten}
        hearts={profile.hearts}
        maxHearts={profile.maxHearts || 5}
        playerCoins={profile.coins}
        nextRefillSeconds={heartsState.nextRefillSeconds}
        mode={selectedMode}
        currentLevelId={lastGameStats.currentLevel?.id || currentLevelId}
        currentLevel={lastGameStats.currentLevel || currentLevel}
        levelProgress={lastGameStats.levelProgress || levelProgress}
        snakeLength={lastGameStats.snakeLength ?? snake.length}
        revivesUsed={revivesUsed}
        maxRevives={1}
        reason={lastGameStats.reason}
        onRestart={handleRestartFromGameOver}
        onRevive={selectedMode === 'LEVELS' && revivesUsed < 1 ? handleReviveInGame : undefined}
        reviveCost={5000}
        onOpenShop={(targetTab = 'SKINS') => {
          handleOpenShop(targetTab);
        }}
        onOpenHearts={() => {
          closeAllModals();
          setIsHeartsOpen(true);
        }}
        onOpenLeaderboard={() => {
          closeAllModals();
          setIsLeaderboardOpen(true);
        }}
        onBackToMenu={handleBackToMenu}
      />

      {/* Top 20 Leaderboard Modal */}
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        language={profile.language || 'zh-HK'}
        profile={profile}
        initialMode={selectedMode}
        onClose={() => setIsLeaderboardOpen(false)}
        onUpdateProfile={setProfile}
      />

      {/* Candy Crush Hearts & Refill Modal */}
      <HeartsModal
        isOpen={isHeartsOpen}
        language={profile.language || 'zh-HK'}
        hearts={profile.hearts}
        maxHearts={profile.maxHearts || 5}
        coins={profile.coins}
        dailyAdWatchCount={profile.dailyAdWatchDate === todayStr ? (profile.dailyAdWatchCount || 0) : 0}
        maxDailyAds={5}
        nextRefillSeconds={heartsState.nextRefillSeconds}
        totalRefillSeconds={heartsState.totalRefillSeconds}
        onClose={() => setIsHeartsOpen(false)}
        onAddHearts={handleAddHearts}
        onWatchAdReward={handleWatchAdReward}
        onOpenShop={(targetTab = 'COINS') => {
          closeAllModals();
          handleOpenShop(targetTab);
        }}
      />

      <ShopModal
        profile={profile}
        language={profile.language || 'zh-HK'}
        isOpen={isShopOpen}
        initialTab={shopTab}
        onClose={() => setIsShopOpen(false)}
        onUpdateProfile={setProfile}
        onOpenHearts={() => {
          closeAllModals();
          setIsHeartsOpen(true);
        }}
      />

      <RewardsModal
        isOpen={isRewardsOpen}
        language={profile.language || 'zh-HK'}
        initialTab={rewardsTab}
        onClose={() => setIsRewardsOpen(false)}
        profile={profile}
        achievements={achievements}
        onUpdateProfile={setProfile}
        onClaimAchievementReward={handleClaimAchievementReward}
        onClaimDailyMissionReward={handleClaimDailyMissionReward}
        onClaimAllDailyMissions={handleClaimAllDailyMissions}
        onOpenTutorial={() => {
          closeAllModals();
          setIsTutorialOpen(true);
        }}
      />

      <SettingsModal
        profile={profile}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onUpdateProfile={setProfile}
        onResetData={handleResetData}
        onRestoreProgression={handleRestoreProgression}
        onOpenTutorial={() => {
          closeAllModals();
          setIsTutorialOpen(true);
        }}
        onReplayIntro={() => {
          closeAllModals();
          setShowIntro(true);
        }}
        onOpenItemCompendium={handleOpenItemCompendium}
        onResetItemIntros={handleResetItemIntros}
        onOpenPrivacyPolicy={() => {
          setIsSettingsOpen(false);
          setPrivacyModalInitialTab('POLICY');
          setIsPrivacyPolicyOpen(true);
        }}
        onOpenTermsOfService={() => {
          setIsSettingsOpen(false);
          setIsTermsOfServiceOpen(true);
        }}
      />

      {/* New Item Discovery Introduction Modal */}
      <ItemIntroModal
        isOpen={isItemIntroOpen}
        items={introItemsToShow}
        currentLevel={pendingLevelToStart || currentLevel}
        language={profile.language || 'zh-HK'}
        onConfirm={handleConfirmItemIntro}
        isCompendiumMode={isCompendiumMode}
        onClose={() => {
          setIsItemIntroOpen(false);
          if (pendingLevelToStart && !isCompendiumMode) {
            const targetLvl = pendingLevelToStart;
            setPendingLevelToStart(null);
            stopGame();
            isGameOverHandledRef.current = false;
            setLastGameStats({ score: 0, coinsEarned: 0, applesEaten: 0, isNewHigh: false });
            setSelectedMode('LEVELS');
            setCurrentLevelId(targetLvl.id);
            setAppView('PLAYING');
            startGame('LEVELS', targetLvl);
          } else if (!isPlaying) {
            setAppView('HOME');
          }
        }}
      />

      <TutorialModal
        isOpen={isTutorialOpen}
        language={profile.language || 'zh-HK'}
        hasClaimedReward={profile.hasClaimedTutorialReward}
        onClose={() => setIsTutorialOpen(false)}
        onCompleteTutorial={handleCompleteTutorial}
      />

      <MobilePlayModal
        isOpen={isMobileGuideOpen}
        language={profile.language || 'zh-HK'}
        onClose={() => setIsMobileGuideOpen(false)}
      />

      {/* Official Compliant Privacy Policy Modal */}
      <PrivacyPolicyModal
        isOpen={isPrivacyPolicyOpen}
        initialTab={privacyModalInitialTab}
        language={profile.language || 'zh-HK'}
        playerName={profile.playerName || 'Snake Master'}
        onClose={() => setIsPrivacyPolicyOpen(false)}
        onResetData={handleResetData}
        onClearCloudScores={() => {
          setProfile((prev) => ({
            ...prev,
            highScores: { CLASSIC: 0, LEVELS: 0, TIME_ATTACK: 0, SURVIVAL: 0 },
            levelHighScores: {},
            hasPlayedClassic: false,
            hasPlayedTimeAttack: false,
          }));
        }}
        onSelectLanguage={(l) => {
          setProfile((prev) => ({ ...prev, language: l, hasCustomLanguage: true }));
        }}
      />

      {/* Standalone Terms of Service & Legal Disclaimer Modal */}
      <TermsOfServiceModal
        isOpen={isTermsOfServiceOpen}
        language={profile.language || 'zh-HK'}
        onClose={() => setIsTermsOfServiceOpen(false)}
        onSelectLanguage={(l) => {
          setProfile((prev) => ({ ...prev, language: l, hasCustomLanguage: true }));
        }}
      />

      {/* 5-Second Opening Intro Animation */}
      <IntroAnimation
        isOpen={showIntro}
        onFinish={handleIntroFinish}
        language={profile.language || detectSystemLanguage()}
        selectedSkin={profile.selectedSkin}
      />
    </div>
  );
}
