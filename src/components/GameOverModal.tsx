import React, { useMemo } from 'react';
import { GameMode, GameOverReason, LevelMission } from '../types';
import { soundEngine } from '../utils/audio';
import { SupportedLanguage, getTranslation } from '../utils/i18n';
import { RotateCcw, Trophy, ShoppingBag, Home, Heart, Plus, Sparkles, X } from 'lucide-react';
import { CuteModalBackground } from './CuteModalBackground';
import { CoinIcon } from './CoinIcon';
import { RedAppleIcon } from './RedAppleIcon';
import { BlueAppleIcon } from './BlueAppleIcon';
import { GreenAppleIcon } from './GreenAppleIcon';
import { GoldenAppleIcon } from './GoldenAppleIcon';

interface GameOverModalProps {
  isOpen: boolean;
  score: number;
  highScore: number;
  isNewHigh: boolean;
  coinsEarned: number;
  applesEaten: number;
  hearts: number;
  maxHearts: number;
  playerCoins: number;
  nextRefillSeconds: number;
  mode: GameMode;
  currentLevelId?: number;
  currentLevel?: LevelMission;
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
  revivesUsed?: number;
  maxRevives?: number;
  reason?: GameOverReason;
  language?: SupportedLanguage;
  onRestart: () => void;
  onRevive?: () => void;
  reviveCost?: number;
  onOpenShop: (tab?: 'SKINS' | 'ARENAS' | 'COINS') => void;
  onOpenHearts: () => void;
  onOpenLeaderboard?: () => void;
  onBackToMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  score,
  highScore,
  isNewHigh,
  coinsEarned,
  applesEaten: _applesEaten,
  hearts,
  maxHearts,
  playerCoins,
  nextRefillSeconds: _nextRefillSeconds,
  mode,
  currentLevelId,
  currentLevel,
  levelProgress,
  snakeLength,
  revivesUsed = 0,
  maxRevives = 1,
  reason: _reason,
  language = 'zh-HK',
  onRestart,
  onRevive,
  reviveCost = 5000,
  onOpenShop,
  onOpenHearts,
  onOpenLeaderboard,
  onBackToMenu,
}) => {
  if (!isOpen) return null;

  const modeLabel =
    mode === 'LEVELS'
      ? getTranslation('startMissionMode', language)
      : mode === 'CLASSIC'
      ? getTranslation('startClassicMode', language)
      : mode === 'TIME_ATTACK'
      ? getTranslation('startTimeAttack', language)
      : getTranslation('startSurvival', language);

  const isOutOfHearts = hearts <= 0;

  const penaltyLabel =
    language === 'en'
      ? '💔 Defeat: -1'
      : language === 'ja'
      ? '💔 失敗：-1'
      : language === 'zh-CN'
      ? '💔 失败扣 1'
      : '💔 失敗扣 1';

  const remainingHeartsText =
    language === 'en'
      ? 'Remaining Hearts:'
      : language === 'ja'
      ? '残りハート:'
      : language === 'zh-CN'
      ? '剩余爱心:'
      : '剩餘愛心:';

  const newRecordText =
    language === 'en'
      ? 'NEW HIGH SCORE!'
      : language === 'ja'
      ? '新記録達成！'
      : language === 'zh-CN'
      ? '新纪录！NEW RECORD！'
      : '新紀錄！NEW RECORD！';

  const breakRecordText =
    language === 'en'
      ? 'New Record Achieved!'
      : language === 'ja'
      ? '新記録樹立！'
      : language === 'zh-CN'
      ? '打破历史记录！'
      : '打破歷史紀錄！';

  const coinsEarnedText =
    language === 'en'
      ? 'Coins Earned'
      : language === 'ja'
      ? '獲得コイン'
      : language === 'zh-CN'
      ? '获得金币'
      : '獲得金幣';

  // 原位復活只限[任務闖關] (LEVELS)，classic同計時模式沒有；且[任務闖關]只可復活一次
  const isMissionMode = mode === 'LEVELS';
  const hasUsedReviveInMission = isMissionMode && revivesUsed >= maxRevives;
  const canReviveInMission = isMissionMode && !hasUsedReviveInMission && Boolean(onRevive);

  // Compute level mission objectives and their status at the moment of defeat
  const missionTargets = useMemo(() => {
    if (!isMissionMode || !currentLevel?.targets) return [];

    const targets = currentLevel.targets;
    const items: Array<{
      key: string;
      label: string;
      icon: React.ReactNode;
      current: number;
      target: number;
      isCompleted: boolean;
      colorClass: string;
      completedClass: string;
    }> = [];

    // 1. Normal Apples (🍎)
    if (targets.normal !== undefined) {
      const cur = levelProgress?.normal ?? 0;
      const isDone = cur >= targets.normal;
      items.push({
        key: 'normal',
        label: language === 'en' ? 'Apples' : language === 'ja' ? '赤りんご' : language === 'zh-CN' ? '红苹果' : '紅蘋果',
        icon: <RedAppleIcon className="w-3.5 h-3.5" />,
        current: cur,
        target: targets.normal,
        isCompleted: isDone,
        colorClass: 'bg-rose-950/40 border-rose-800/70 text-rose-200',
        completedClass: 'bg-rose-500/25 border-rose-400 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.3)]',
      });
    }

    // 2. Blue Apples (🔵)
    if (targets.blue !== undefined) {
      const cur = levelProgress?.blue ?? 0;
      const isDone = cur >= targets.blue;
      items.push({
        key: 'blue',
        label: language === 'en' ? 'Blue Apples' : language === 'ja' ? '青りんご' : language === 'zh-CN' ? '蓝苹果' : '藍蘋果',
        icon: <BlueAppleIcon className="w-3.5 h-3.5" />,
        current: cur,
        target: targets.blue,
        isCompleted: isDone,
        colorClass: 'bg-blue-950/50 border-blue-800/70 text-blue-200',
        completedClass: 'bg-blue-500/25 border-blue-400 text-blue-300 shadow-[0_0_10px_rgba(96,165,250,0.3)]',
      });
    }

    // 3. Green Apples (🍏)
    if (targets.green !== undefined) {
      const cur = levelProgress?.green ?? 0;
      const isDone = cur >= targets.green;
      items.push({
        key: 'green',
        label: language === 'en' ? 'Green Apples' : language === 'ja' ? '緑りんご' : language === 'zh-CN' ? '青苹果' : '青蘋果',
        icon: <GreenAppleIcon className="w-3.5 h-3.5" />,
        current: cur,
        target: targets.green,
        isCompleted: isDone,
        colorClass: 'bg-emerald-950/50 border-emerald-800/70 text-emerald-200',
        completedClass: 'bg-emerald-500/25 border-emerald-400 text-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.3)]',
      });
    }

    // 4. Golden Apples
    if (targets.golden !== undefined) {
      const cur = levelProgress?.golden ?? 0;
      const isDone = cur >= targets.golden;
      items.push({
        key: 'golden',
        label: language === 'en' ? 'Golden Apples' : language === 'ja' ? '金のリンゴ' : language === 'zh-CN' ? '金苹果' : '金蘋果',
        icon: <GoldenAppleIcon className="w-3.5 h-3.5" />,
        current: cur,
        target: targets.golden,
        isCompleted: isDone,
        colorClass: 'bg-amber-950/50 border-amber-800/70 text-amber-200',
        completedClass: 'bg-amber-500/25 border-amber-400 text-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.35)]',
      });
    }

    // 5. Shield Orbs (🛡️)
    if (targets.shield !== undefined) {
      const cur = levelProgress?.shield ?? 0;
      const isDone = cur >= targets.shield;
      items.push({
        key: 'shield',
        label: language === 'en' ? 'Shields' : language === 'ja' ? 'シールド' : language === 'zh-CN' ? '护盾球' : '護盾球',
        icon: <span>🛡️</span>,
        current: cur,
        target: targets.shield,
        isCompleted: isDone,
        colorClass: 'bg-sky-950/50 border-sky-800/70 text-sky-200',
        completedClass: 'bg-sky-500/25 border-sky-400 text-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.3)]',
      });
    }

    // 6. Snake Length (🐍)
    if (targets.length !== undefined) {
      const cur = levelProgress?.length ?? snakeLength ?? 4;
      const isDone = cur >= targets.length;
      items.push({
        key: 'length',
        label: language === 'en' ? 'Length' : language === 'ja' ? '体長' : language === 'zh-CN' ? '蛇身长度' : '蛇身長度',
        icon: <span>🐍</span>,
        current: cur,
        target: targets.length,
        isCompleted: isDone,
        colorClass: 'bg-purple-950/50 border-purple-800/70 text-purple-200',
        completedClass: 'bg-purple-500/25 border-purple-400 text-purple-300 shadow-[0_0_10px_rgba(192,132,252,0.3)]',
      });
    }

    // 7. Portals (🌀)
    if (targets.portals !== undefined) {
      const cur = levelProgress?.portals ?? 0;
      const isDone = cur >= targets.portals;
      items.push({
        key: 'portals',
        label: language === 'en' ? 'Portals' : language === 'ja' ? 'ポータル' : language === 'zh-CN' ? '传送门' : '傳送門',
        icon: <span>🌀</span>,
        current: cur,
        target: targets.portals,
        isCompleted: isDone,
        colorClass: 'bg-cyan-950/50 border-cyan-800/70 text-cyan-200',
        completedClass: 'bg-cyan-500/25 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.3)]',
      });
    }

    // 8. Chili (🌶️)
    if (targets.chili !== undefined) {
      const cur = levelProgress?.chili ?? 0;
      const isDone = cur >= targets.chili;
      items.push({
        key: 'chili',
        label: language === 'en' ? 'Chilies' : language === 'ja' ? '唐辛子' : '辣椒',
        icon: <span>🌶️</span>,
        current: cur,
        target: targets.chili,
        isCompleted: isDone,
        colorClass: 'bg-orange-950/50 border-orange-800/70 text-orange-200',
        completedClass: 'bg-orange-500/25 border-orange-400 text-orange-300 shadow-[0_0_10px_rgba(251,146,60,0.3)]',
      });
    }

    // 9. Magnet (🧲)
    if (targets.magnet !== undefined) {
      const cur = levelProgress?.magnet ?? 0;
      const isDone = cur >= targets.magnet;
      items.push({
        key: 'magnet',
        label: language === 'en' ? 'Magnets' : language === 'ja' ? '磁石' : '磁石',
        icon: <span>🧲</span>,
        current: cur,
        target: targets.magnet,
        isCompleted: isDone,
        colorClass: 'bg-sky-950/50 border-sky-800/70 text-sky-200',
        completedClass: 'bg-sky-500/25 border-sky-400 text-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.3)]',
      });
    }

    // 10. Dragon Egg (🥚)
    if (targets.dragonEgg !== undefined) {
      const cur = levelProgress?.dragonEgg ?? 0;
      const isDone = cur >= targets.dragonEgg;
      items.push({
        key: 'dragonEgg',
        label: language === 'en' ? 'Dragon Eggs' : language === 'ja' ? '竜の卵' : language === 'zh-CN' ? '巨龙蛋' : '巨龍蛋',
        icon: <span>🥚</span>,
        current: cur,
        target: targets.dragonEgg,
        isCompleted: isDone,
        colorClass: 'bg-rose-950/50 border-rose-800/70 text-rose-200',
        completedClass: 'bg-rose-500/25 border-rose-400 text-rose-300 shadow-[0_0_10px_rgba(251,113,133,0.3)]',
      });
    }

    // 11. Rainbow (🍭)
    if (targets.rainbow !== undefined) {
      const cur = levelProgress?.rainbow ?? 0;
      const isDone = cur >= targets.rainbow;
      items.push({
        key: 'rainbow',
        label: language === 'en' ? 'Rainbow Candies' : language === 'ja' ? '虹飴' : '彩虹糖',
        icon: <span>🍭</span>,
        current: cur,
        target: targets.rainbow,
        isCompleted: isDone,
        colorClass: 'bg-pink-950/50 border-pink-800/70 text-pink-200',
        completedClass: 'bg-pink-500/25 border-pink-400 text-pink-300 shadow-[0_0_10px_rgba(244,114,182,0.3)]',
      });
    }

    // 12. Bombs Defused (💣)
    if (targets.bombs !== undefined) {
      const cur = (levelProgress as any)?.bombs ?? 0;
      const isDone = cur >= targets.bombs;
      items.push({
        key: 'bombs',
        label: language === 'en' ? 'Defused Bombs' : language === 'ja' ? '爆弾解体' : language === 'zh-CN' ? '拆除炸弹' : '拆除炸彈',
        icon: <span>💣</span>,
        current: cur,
        target: targets.bombs,
        isCompleted: isDone,
        colorClass: 'bg-red-950/50 border-red-800/70 text-red-200',
        completedClass: 'bg-red-500/25 border-red-400 text-red-300 shadow-[0_0_10px_rgba(239,68,68,0.3)]',
      });
    }

    // 13. Color Sequence (🎯)
    if (targets.colorSequenceCount !== undefined) {
      const cur = (levelProgress as any)?.colorSequenceCount ?? 0;
      const isDone = cur >= targets.colorSequenceCount;
      items.push({
        key: 'colorSequenceCount',
        label: language === 'en' ? 'Color Order' : language === 'ja' ? 'カラー順序' : language === 'zh-CN' ? '颜色顺序' : '顏色順序',
        icon: <span>🎯</span>,
        current: cur,
        target: targets.colorSequenceCount,
        isCompleted: isDone,
        colorClass: 'bg-fuchsia-950/50 border-fuchsia-800/70 text-fuchsia-200',
        completedClass: 'bg-fuchsia-500/25 border-fuchsia-400 text-fuchsia-300 shadow-[0_0_10px_rgba(217,70,239,0.3)]',
      });
    }

    // 14. Keys (🗝️)
    if (targets.keys !== undefined) {
      const cur = (levelProgress as any)?.keys ?? 0;
      const isDone = cur >= targets.keys;
      items.push({
        key: 'keys',
        label: language === 'en' ? 'Keys' : language === 'ja' ? '鍵' : language === 'zh-CN' ? '钥匙' : '鑰匙',
        icon: <span>🗝️</span>,
        current: cur,
        target: targets.keys,
        isCompleted: isDone,
        colorClass: 'bg-yellow-950/50 border-yellow-800/70 text-yellow-200',
        completedClass: 'bg-yellow-500/25 border-yellow-400 text-yellow-300 shadow-[0_0_10px_rgba(234,179,8,0.3)]',
      });
    }

    // 15. Survive Seconds (⏱️)
    if (targets.surviveSeconds !== undefined) {
      const cur = (levelProgress as any)?.surviveSeconds ?? 0;
      const isDone = cur >= targets.surviveSeconds;
      items.push({
        key: 'surviveSeconds',
        label: language === 'en' ? 'Survive (s)' : language === 'ja' ? '生存(秒)' : language === 'zh-CN' ? '维持生存(秒)' : '維持生存(秒)',
        icon: <span>⏱️</span>,
        current: cur,
        target: targets.surviveSeconds,
        isCompleted: isDone,
        colorClass: 'bg-rose-950/50 border-rose-800/70 text-rose-200',
        completedClass: 'bg-emerald-500/25 border-emerald-400 text-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.3)]',
      });
    }

    return items;
  }, [isMissionMode, currentLevel, levelProgress, snakeLength, language]);

  const missionFailedText =
    language === 'en'
      ? 'Mission Failed'
      : language === 'ja'
      ? 'ステージ挑戦失敗'
      : language === 'zh-CN'
      ? '关卡挑战失败'
      : '闖關挑戰失敗';

  const displayLevelId = currentLevel?.id ?? currentLevelId ?? 1;

  const missionBannerText =
    language === 'en'
      ? `Stage ${displayLevelId}`
      : language === 'ja'
      ? `ステージ ${displayLevelId}`
      : language === 'zh-CN'
      ? `第 ${displayLevelId} 关`
      : `第 ${displayLevelId} 關`;

  const titleText = isMissionMode
    ? missionFailedText
    : isNewHigh
    ? breakRecordText
    : getTranslation('gameOver', language);

  const reviveBadgeText = isOutOfHearts
    ? language === 'en'
      ? '❤️ Must have hearts first'
      : language === 'ja'
      ? '❤️ 先にハート補充'
      : language === 'zh-CN'
      ? '❤️ 需持有爱心方可复活'
      : '❤️ 須持有愛心方可復活'
    : language === 'en'
    ? 'Limit 1'
    : language === 'ja'
    ? '1回限定'
    : language === 'zh-CN'
    ? '每关限1次'
    : '每關限1次';

  const reviveWithCoinsText = isOutOfHearts
    ? language === 'en'
      ? 'Need Hearts · Get Heart to Revive'
      : language === 'ja'
      ? 'ハート不足 · 回復後に復活可能'
      : language === 'zh-CN'
      ? '爱心不足 · 先换/买心方可复活'
      : '愛心不足 · 先換/買心方可復活'
    : playerCoins >= reviveCost
    ? language === 'en'
      ? 'Revive Here (+4s Shield)'
      : language === 'ja'
      ? 'コイン復活 (+4秒無敵シールド)'
      : language === 'zh-CN'
      ? '原位金币复活 (+4秒无敌盾)'
      : '原位金幣復活 (+4秒無敵盾)'
    : language === 'en'
    ? 'Need Coins (Shop)'
    : language === 'ja'
    ? 'コイン不足 (ショップへ)'
    : language === 'zh-CN'
    ? '金币不足 (前往商店)'
    : '金幣不足 (前往商店)';

  const reviveExhaustedText =
    language === 'en'
      ? '⚠️ Revive already used (Limit 1 per mission)'
      : language === 'ja'
      ? '⚠️ 本ミッションの復活上限に達しました (1回限定)'
      : language === 'zh-CN'
      ? '⚠️ 本关复活已用完 (每关限1次)'
      : '⚠️ 本關復活次數已用完 (每關限1次)';

  const refillToStartText =
    language === 'en'
      ? 'Out of Hearts · Refill to Play'
      : language === 'ja'
      ? 'ハート不足 · 回復してプレイ'
      : language === 'zh-CN'
      ? '爱心用尽 · 立即补充开局'
      : '愛心用盡 · 立即補充開局';

  const restartText =
    language === 'en'
      ? `Play Again (${hearts} ❤️)`
      : language === 'ja'
      ? `もう一度 (${hearts} ❤️)`
      : language === 'zh-CN'
      ? `重新开始 (剩余 ${hearts} ❤️)`
      : `重新開始 (剩餘 ${hearts} ❤️)`;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-4 pt-[calc(max(env(safe-area-inset-top),0.5rem)+3.2rem)] pb-3 bg-slate-950/80 backdrop-blur-md animate-fade-in select-none overflow-hidden"
    >
      <CuteModalBackground
        theme="defeat"
        className="w-full max-w-sm max-h-[calc(100dvh-max(env(safe-area-inset-top),0.5rem)-4.5rem)] flex flex-col text-slate-100 relative shadow-2xl overflow-hidden"
      >
        {/* Prominent top-right close button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            soundEngine.playClick();
            onBackToMenu();
          }}
          className="absolute top-3 right-3 w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-all active:scale-95 z-30 cursor-pointer shadow-md touch-manipulation border border-pink-500/30"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-full flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y p-3.5 sm:p-4 text-center text-slate-100 flex flex-col items-center">
          {/* Banner */}
          <div className="mb-2 pr-8">
            {isMissionMode ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/50 text-rose-300 text-xs font-black shadow-sm">
                <span>{missionBannerText}</span>
              </div>
            ) : isNewHigh ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/60 text-amber-300 text-xs font-black animate-bounce shadow-md">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>{newRecordText}</span>
              </div>
            ) : (
              <span className="text-xs uppercase tracking-widest text-pink-300 font-bold">
                {modeLabel}
              </span>
            )}
          </div>

          <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2 drop-shadow-[0_2px_8px_rgba(244,63,94,0.5)]">
            {titleText}
          </h3>

          {_reason && (
            <div className="mb-2.5 text-xs font-bold px-3 py-1 rounded-full bg-rose-950/70 border border-rose-500/50 text-rose-200 shadow-sm animate-fade-in">
              {_reason === 'BOMB_EXPLODED'
                ? (language === 'en' ? '💣 Timebomb exploded! Defuse failed!' : language === 'ja' ? '💣 時限爆弾が爆発！解除失敗！' : language === 'zh-CN' ? '💣 炸弹引爆！未能及时拆除！' : '💣 炸彈引爆！未能及時拆除！')
                : _reason === 'OUT_OF_TURNS'
                ? (language === 'en' ? '🔄 Out of turns! Move budget reached!' : language === 'ja' ? '🔄 方向転換の制限回数に到達！クリア失敗！' : language === 'zh-CN' ? '🔄 转向次数耗尽！未能及时过关！' : '🔄 轉向次數耗盡！未能及時過關！')
                : _reason === 'WRONG_COLOR_GATE'
                ? (language === 'en' ? '🚪 Color mismatch! Gate blocked passage!' : language === 'ja' ? '🚪 色が一致しません！カラーゲートに衝突！' : language === 'zh-CN' ? '🚪 颜色不符！撞上彩色禁制门！' : '🚪 顏色不符！撞上彩色禁制門！')
                : _reason === 'ROVING_SNAKE'
                ? (language === 'en' ? '🐍 Collided with patrol drone snake!' : language === 'ja' ? '🐍 パトロールヘビに衝突！' : language === 'zh-CN' ? '🐍 撞上巡逻阻碍蛇！' : '🐍 撞上巡邏阻礙蛇！')
                : _reason === 'WALL'
                ? (language === 'en' ? '🧱 Collided with border wall!' : language === 'ja' ? '🧱 壁に激突！' : language === 'zh-CN' ? '🧱 撞上边界墙壁！' : '🧱 撞上邊界牆壁！')
                : _reason === 'OBSTACLE'
                ? (language === 'en' ? '🧱 Collided with obstacle!' : language === 'ja' ? '🧱 障害物に衝突！' : language === 'zh-CN' ? '🧱 撞上障碍石砖！' : '🧱 撞上障礙石磚！')
                : _reason === 'SELF'
                ? (language === 'en' ? '💫 Collided with own body!' : language === 'ja' ? '💫 自分の体を噛んでしまった！' : language === 'zh-CN' ? '💫 咬到自己的蛇身！' : '💫 咬到自己的蛇身！')
                : (language === 'en' ? '⏳ Time limit expired!' : language === 'ja' ? '⏳ 制限時間終了！' : language === 'zh-CN' ? '⏳ 限时时间耗尽！' : '⏳ 限時時間耗盡！')}
            </div>
          )}

        {/* Hearts Penalty / Remaining Status */}
        <div className="w-full p-2.5 mb-2.5 rounded-2xl bg-rose-950/40 border border-rose-400/40 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-500/25 text-rose-300 flex items-center justify-center shrink-0">
              <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-rose-200 flex items-center gap-1">
                <span>{penaltyLabel}</span>
                <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500 inline-block drop-shadow-[0_0_6px_rgba(244,63,94,0.6)]" />
              </div>
              <div className="text-[11px] text-pink-200/80 flex items-center gap-1 mt-0.5">
                <span>{remainingHeartsText}</span>
                <span className="font-bold text-white font-mono">{hearts}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onOpenHearts();
            }}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/25 hover:bg-rose-500/40 border border-rose-400/50 text-rose-200 text-xs font-bold transition-all active:scale-95 shrink-0 shadow-sm min-h-[36px] cursor-pointer"
            aria-label={getTranslation('refillBtn', language)}
            title={getTranslation('refillBtn', language)}
          >
            <Plus className="w-3.5 h-3.5 text-rose-300 stroke-[3]" />
            <Heart className="w-4 h-4 fill-rose-500 text-rose-400 drop-shadow-[0_0_6px_rgba(244,63,94,0.6)]" />
          </button>
        </div>

        {/* Score & Mission Targets Card Box */}
        <div className="w-full p-3 rounded-2xl bg-[#1c0828]/80 border border-pink-500/30 shadow-inner mb-3.5 space-y-2.5">
          {!isMissionMode ? (
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-2 rounded-xl bg-purple-950/40 border border-purple-500/20">
                <div className="text-[11px] text-pink-200/80 font-medium">
                  {getTranslation('currentScoreLabel', language)}
                </div>
                <div className="text-2xl font-black text-pink-300 font-mono mt-0.5 drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]">
                  {score}
                </div>
              </div>
              <div className="p-2 rounded-xl bg-purple-950/40 border border-purple-500/20">
                <div className="text-[11px] text-amber-200/80 font-medium flex items-center justify-center gap-1">
                  <Trophy className="w-3 h-3 text-amber-400" />
                  <span>{getTranslation('highScoreLabel', language)}</span>
                </div>
                <div className="text-2xl font-black text-amber-300 font-mono mt-0.5">
                  {Math.max(highScore, score)}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 text-center items-center py-0.5">
              <div className="p-2 rounded-xl bg-purple-950/40 border border-purple-500/20">
                <div className="text-[11px] text-pink-200/80 font-medium">
                  {getTranslation('currentScoreLabel', language)}
                </div>
                <div className="text-2xl sm:text-3xl font-black text-pink-300 font-mono tracking-tight mt-0.5 drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]">
                  {score}
                </div>
              </div>
              <div className="p-2 rounded-xl bg-purple-950/40 border border-purple-500/20">
                <div className="text-[11px] text-pink-300/80 font-medium">{coinsEarnedText}</div>
                <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono tracking-tight mt-0.5 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]">
                  {coinsEarned}
                </div>
              </div>
            </div>
          )}

          {!isMissionMode && (
            <>
              <div className="h-px bg-pink-500/20 w-full" />
              <div className="flex items-center justify-center text-center text-xs py-0.5">
                <div>
                  <div className="text-pink-300/80 text-[11px] font-medium">{coinsEarnedText}</div>
                  <div className="font-bold text-amber-300 font-mono mt-0.5 text-center text-sm">
                    {coinsEarned}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* 關卡挑戰失敗時，加返輸嗰一刻已完成與進行中的目標 */}
          {isMissionMode && missionTargets.length > 0 && (
            <>
              <div className="h-px bg-pink-500/20 w-full" />
              <div className="w-full pt-0.5">
                <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
                  {missionTargets.map((tgt) => (
                    <div
                      key={tgt.key}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border font-mono font-bold text-xs transition-all shadow-sm ${
                        tgt.isCompleted ? tgt.completedClass : tgt.colorClass
                      }`}
                      title={`${tgt.label}: ${tgt.current}/${tgt.target}`}
                    >
                      <span className="shrink-0 text-sm leading-none flex items-center">{tgt.icon}</span>
                      <span className="tabular-nums">
                        {tgt.current}/{tgt.target}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-2">
          {/* 金幣原位復活選項：只限[任務闖關]，且只可復活一次 */}
          {canReviveInMission && (
            <button
              type="button"
              id="btn-revive-game"
              onClick={() => {
                if (isOutOfHearts) {
                  soundEngine.playTurn();
                  soundEngine.haptic('collision');
                  onOpenHearts();
                  return;
                }
                if (playerCoins >= reviveCost && onRevive) {
                  soundEngine.playSpecialEat();
                  soundEngine.haptic('success');
                  onRevive();
                } else {
                  soundEngine.playClick();
                  onOpenShop('COINS');
                }
              }}
              className={`w-full py-3 px-4 rounded-2xl btn-candy font-black text-sm shadow-xl active:scale-98 transition-all flex items-center justify-between cursor-pointer border min-h-[44px] ${
                isOutOfHearts
                  ? 'bg-rose-950/70 text-rose-200 border-rose-500/50 hover:bg-rose-900/80 shadow-rose-950/40'
                  : playerCoins >= reviveCost
                  ? 'bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-slate-950 border-amber-200 shadow-amber-500/40'
                  : 'bg-slate-800/80 text-amber-200/60 border-slate-700/80'
              }`}
            >
              <div className="flex items-center gap-2">
                {isOutOfHearts ? (
                  <Heart className="w-5 h-5 text-rose-400 fill-rose-500 animate-pulse shrink-0" />
                ) : (
                  <Sparkles
                    className={`w-5 h-5 ${
                      playerCoins >= reviveCost ? 'text-amber-950 fill-amber-950 animate-spin' : 'text-slate-400'
                    }`}
                  />
                )}
                <div className="text-left flex flex-col">
                  <span className="font-black leading-tight">{reviveWithCoinsText}</span>
                  <span className="text-[10px] font-bold opacity-80">{reviveBadgeText}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 font-mono font-black text-xs px-2.5 py-1 rounded-xl bg-black/20 shrink-0">
                <span>{reviveCost}</span>
                <CoinIcon className="w-3.5 h-3.5" />
              </div>
            </button>
          )}

          {/* 任務闖關模式如果已經用過1次復活，顯示已達上限提示 */}
          {hasUsedReviveInMission && (
            <div className="w-full py-2 px-3 rounded-xl bg-slate-900/60 border border-slate-700/50 text-slate-400 text-xs flex items-center justify-center gap-1.5 font-medium">
              <span>{reviveExhaustedText}</span>
            </div>
          )}

          {isOutOfHearts ? (
            <button
              type="button"
              id="btn-restart-game"
              onClick={() => {
                soundEngine.playClick();
                onOpenHearts();
              }}
              className="w-full py-3.5 px-4 rounded-2xl btn-candy bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 text-white font-black text-sm shadow-lg shadow-rose-500/40 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[48px]"
            >
              <Heart className="w-5 h-5 fill-white" />
              <span>{refillToStartText}</span>
            </button>
          ) : (
            <button
              type="button"
              id="btn-restart-game"
              onClick={() => {
                soundEngine.playClick();
                onRestart();
              }}
              className="w-full py-3.5 px-4 rounded-2xl btn-candy bg-gradient-to-b from-pink-400 to-rose-600 text-white font-black text-sm shadow-lg shadow-pink-600/40 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[48px]"
            >
              <RotateCcw className="w-5 h-5" />
              <span>{restartText}</span>
            </button>
          )}

          <div className="grid grid-cols-3 gap-2 pt-0.5">
            {onOpenLeaderboard && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  onOpenLeaderboard();
                }}
                className="py-2.5 px-2 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 border border-purple-400/40 text-amber-300 text-xs font-bold flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shadow-sm min-h-[44px]"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{getTranslation('leaderboardBtn', language)}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onOpenShop();
              }}
              className="py-2.5 px-2 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 border border-purple-400/40 text-pink-200 text-xs font-bold flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shadow-sm min-h-[44px]"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{getTranslation('shopBtn', language)}</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                soundEngine.playClick();
                onBackToMenu();
              }}
              className="py-2.5 px-2 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 border border-purple-400/40 text-purple-200 text-xs font-bold flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shadow-sm min-h-[44px]"
            >
              <Home className="w-3.5 h-3.5 text-purple-300 shrink-0" />
              <span>{getTranslation('homeBtn', language)}</span>
            </button>
          </div>
        </div>
        </div>
      </CuteModalBackground>
    </div>
  );
};
