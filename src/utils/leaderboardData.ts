import { GameMode, PlayerProfile } from '../types';
import { getSanitizedHighScore } from './scoreIsolation';

export interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  avatar: string;
  score: number;
  mode: GameMode;
  date: string;
  badge?: string;
  isCurrentPlayer?: boolean;
}

// 預設熱門排行榜高分競爭者 (模擬真實全球與本地玩家競賽紀錄)
const BASE_LEADERBOARD_CLASSIC: Omit<LeaderboardEntry, 'rank' | 'isCurrentPlayer'>[] = [
  { id: 'c1', name: '👑 蛇王阿強', avatar: '🐉', score: 1480, mode: 'CLASSIC', date: '今日', badge: '頂級王者' },
  { id: 'c2', name: '⚡ 旺角急轉彎', avatar: '⚡', score: 1390, mode: 'CLASSIC', date: '今日', badge: '速度之神' },
  { id: 'c3', name: '🎮 香港貪食第一人', avatar: '🕹️', score: 1280, mode: 'CLASSIC', date: '昨日', badge: '宗師' },
  { id: 'c4', name: '🌟 NeonPython', avatar: '✨', score: 1190, mode: 'CLASSIC', date: '昨日', badge: '宗師' },
  { id: 'c5', name: '🔥 銅鑼灣火龍', avatar: '🔥', score: 1110, mode: 'CLASSIC', date: '2天前', badge: '鑽石' },
  { id: 'c6', name: '💎 尖沙咀大蛇', avatar: '💎', score: 1040, mode: 'CLASSIC', date: '2天前', badge: '鑽石' },
  { id: 'c7', name: '🏆 CyberViper', avatar: '🤖', score: 980, mode: 'CLASSIC', date: '3天前', badge: '白金' },
  { id: 'c8', name: '🚀 快速吞噬者', avatar: '🚀', score: 920, mode: 'CLASSIC', date: '3天前', badge: '白金' },
  { id: 'c9', name: '🍎 蘋果獵人', avatar: '🍏', score: 870, mode: 'CLASSIC', date: '4天前', badge: '白金' },
  { id: 'c10', name: '⚡ 閃電狂蛇', avatar: '⚡', score: 820, mode: 'CLASSIC', date: '4天前', badge: '黃金' },
  { id: 'c11', name: '🎯 穿雲箭', avatar: '🏹', score: 780, mode: 'CLASSIC', date: '5天前', badge: '黃金' },
  { id: 'c12', name: '🐍 靈蛇仙子', avatar: '🧚', score: 740, mode: 'CLASSIC', date: '5天前', badge: '黃金' },
  { id: 'c13', name: '🔥 熾烈暴龍', avatar: '🦖', score: 700, mode: 'CLASSIC', date: '本週', badge: '黃金' },
  { id: 'c14', name: '🌟 幻影蛇', avatar: '👻', score: 660, mode: 'CLASSIC', date: '本週', badge: '白銀' },
  { id: 'c15', name: '🌀 漩渦獵手', avatar: '🌀', score: 620, mode: 'CLASSIC', date: '本週', badge: '白銀' },
  { id: 'c16', name: '🛡️ 鐵甲狂蟒', avatar: '🛡️', score: 580, mode: 'CLASSIC', date: '上週', badge: '白銀' },
  { id: 'c17', name: '💥 爆速超蛇', avatar: '💥', score: 540, mode: 'CLASSIC', date: '上週', badge: '白銀' },
  { id: 'c18', name: '🥇 競速先鋒', avatar: '🏎️', score: 500, mode: 'CLASSIC', date: '上週', badge: '青銅' },
  { id: 'c19', name: '🥈 榮耀之星', avatar: '⭐', score: 460, mode: 'CLASSIC', date: '上週', badge: '青銅' },
  { id: 'c20', name: '🎖️ 隱世高手', avatar: '🥋', score: 420, mode: 'CLASSIC', date: '上週', badge: '青銅' },
  { id: 'c21', name: '🎗️ 新秀挑戰者', avatar: '🌱', score: 380, mode: 'CLASSIC', date: '上週' },
  { id: 'c22', name: '✨ 初心狂熱', avatar: '🔥', score: 340, mode: 'CLASSIC', date: '上週' },
];

const BASE_LEADERBOARD_TIME_ATTACK: Omit<LeaderboardEntry, 'rank' | 'isCurrentPlayer'>[] = [
  { id: 't1', name: '⚡ 光速閃避者', avatar: '⚡', score: 1080, mode: 'TIME_ATTACK', date: '今日', badge: '時空領主' },
  { id: 't2', name: '⏱️ 秒針掠奪者', avatar: '⏳', score: 990, mode: 'TIME_ATTACK', date: '今日', badge: '時間刺客' },
  { id: 't3', name: '🏎️ 極速追風', avatar: '🏎️', score: 920, mode: 'TIME_ATTACK', date: '昨日', badge: '宗師' },
  { id: 't4', name: '👑 蛇王阿強', avatar: '🐉', score: 870, mode: 'TIME_ATTACK', date: '昨日', badge: '宗師' },
  { id: 't5', name: '💥 連擊狂人', avatar: '💥', score: 820, mode: 'TIME_ATTACK', date: '2天前', badge: '鑽石' },
  { id: 't6', name: '🎯 精準咬擊', avatar: '🎯', score: 770, mode: 'TIME_ATTACK', date: '2天前', badge: '鑽石' },
  { id: 't7', name: '🌟 幻影極速', avatar: '✨', score: 720, mode: 'TIME_ATTACK', date: '3天前', badge: '白金' },
  { id: 't8', name: '🍏 貪吃小霸王', avatar: '🍎', score: 680, mode: 'TIME_ATTACK', date: '3天前', badge: '白金' },
  { id: 't9', name: '🚀 宇宙火箭', avatar: '🚀', score: 640, mode: 'TIME_ATTACK', date: '4天前', badge: '白金' },
  { id: 't10', name: '🔥 烈焰蛇衝', avatar: '🔥', score: 600, mode: 'TIME_ATTACK', date: '4天前', badge: '黃金' },
  { id: 't11', name: '🕹️ 街機高手', avatar: '🎮', score: 560, mode: 'TIME_ATTACK', date: '5天前', badge: '黃金' },
  { id: 't12', name: '💫 轉向大師', avatar: '💫', score: 520, mode: 'TIME_ATTACK', date: '5天前', badge: '黃金' },
  { id: 't13', name: '🛡️ 守衛神蛇', avatar: '🛡️', score: 480, mode: 'TIME_ATTACK', date: '本週', badge: '黃金' },
  { id: 't14', name: '🌪️ 旋風斬', avatar: '🌪️', score: 450, mode: 'TIME_ATTACK', date: '本週', badge: '白銀' },
  { id: 't15', name: '👾 賽博巡航', avatar: '👾', score: 420, mode: 'TIME_ATTACK', date: '本週', badge: '白銀' },
  { id: 't16', name: '🐍 翠綠獵手', avatar: '🐍', score: 390, mode: 'TIME_ATTACK', date: '上週', badge: '白銀' },
  { id: 't17', name: '🏅 百步穿楊', avatar: '🏅', score: 360, mode: 'TIME_ATTACK', date: '上週', badge: '白銀' },
  { id: 't18', name: '🤖 自動追蹤', avatar: '🤖', score: 330, mode: 'TIME_ATTACK', date: '上週', badge: '青銅' },
  { id: 't19', name: '💎 碎金狂潮', avatar: '💎', score: 300, mode: 'TIME_ATTACK', date: '上週', badge: '青銅' },
  { id: 't20', name: '🏃 跑跑蛇王', avatar: '🏃', score: 270, mode: 'TIME_ATTACK', date: '上週', badge: '青銅' },
  { id: 't21', name: '🌟 星光閃耀', avatar: '⭐', score: 240, mode: 'TIME_ATTACK', date: '上週' },
  { id: 't22', name: '🍎 初試啼聲', avatar: '🍎', score: 210, mode: 'TIME_ATTACK', date: '上週' },
];

const BASE_LEADERBOARD_LEVELS: Omit<LeaderboardEntry, 'rank' | 'isCurrentPlayer'>[] = [
  { id: 'l1', name: '👑 蛇王阿強', avatar: '🐉', score: 2500, mode: 'LEVELS', date: '今日', badge: '25關全通' },
  { id: 'l2', name: '🌟 香港全通關大師', avatar: '🏆', score: 2450, mode: 'LEVELS', date: '今日', badge: '25關全通' },
  { id: 'l3', name: '⚡ 旺角急轉彎', avatar: '⚡', score: 2380, mode: 'LEVELS', date: '昨日', badge: '24關達人' },
  { id: 'l4', name: '🔥 銅鑼灣火龍', avatar: '🔥', score: 2260, mode: 'LEVELS', date: '昨日', badge: '23關達人' },
  { id: 'l5', name: '🎮 街機元老', avatar: '🕹️', score: 2150, mode: 'LEVELS', date: '2天前', badge: '22關達人' },
  { id: 'l6', name: '💎 尖沙咀大蛇', avatar: '💎', score: 2040, mode: 'LEVELS', date: '2天前', badge: '21關達人' },
  { id: 'l7', name: '🎯 任務終結者', avatar: '🎯', score: 1930, mode: 'LEVELS', date: '3天前', badge: '20關大師' },
  { id: 'l8', name: '🤖 CyberViper', avatar: '🤖', score: 1820, mode: 'LEVELS', date: '3天前', badge: '19關突破' },
  { id: 'l9', name: '🚀 衝鋒小隊長', avatar: '🚀', score: 1710, mode: 'LEVELS', date: '4天前', badge: '18關突破' },
  { id: 'l10', name: '🍎 蘋果守望者', avatar: '🍏', score: 1600, mode: 'LEVELS', date: '4天前', badge: '17關突破' },
  { id: 'l11', name: '🛡️ 鐵壁守衛', avatar: '🛡️', score: 1490, mode: 'LEVELS', date: '5天前', badge: '16關突破' },
  { id: 'l12', name: '🐍 綠影疾風', avatar: '🐍', score: 1380, mode: 'LEVELS', date: '5天前', badge: '15關突破' },
  { id: 'l13', name: '💥 爆裂蛇王', avatar: '💥', score: 1270, mode: 'LEVELS', date: '本週', badge: '14關突破' },
  { id: 'l14', name: '⭐ 璀璨之星', avatar: '⭐', score: 1160, mode: 'LEVELS', date: '本週', badge: '13關突破' },
  { id: 'l15', name: '🌀 轉角逢生', avatar: '🌀', score: 1050, mode: 'LEVELS', date: '本週', badge: '12關突破' },
  { id: 'l16', name: '🏎️ 飆風狂蛇', avatar: '🏎️', score: 950, mode: 'LEVELS', date: '上週', badge: '11關突破' },
  { id: 'l17', name: '🥋 禪心定力', avatar: '🥋', score: 850, mode: 'LEVELS', date: '上週', badge: '10關突破' },
  { id: 'l18', name: '🏅 勇敢先鋒', avatar: '🏅', score: 750, mode: 'LEVELS', date: '上週', badge: '9關突破' },
  { id: 'l19', name: '🎖️ 冒險家', avatar: '🧭', score: 650, mode: 'LEVELS', date: '上週', badge: '8關突破' },
  { id: 'l20', name: '🌱 闖關新星', avatar: '🌱', score: 550, mode: 'LEVELS', date: '上週', badge: '7關突破' },
  { id: 'l21', name: '✨ 努力升級中', avatar: '✨', score: 450, mode: 'LEVELS', date: '上週' },
  { id: 'l22', name: '🍎 初階闖關者', avatar: '🍎', score: 350, mode: 'LEVELS', date: '上週' },
];

/**
 * 取得前 20 名玩家排行榜並動態整合玩家當前最佳成績
 */
export function getLeaderboardTop20(
  mode: GameMode,
  profile: PlayerProfile
): {
  top20: LeaderboardEntry[];
  playerEntry: LeaderboardEntry;
  playerRank: number;
  isInTop20: boolean;
  scoreDifferenceToTop20: number;
} {
  const baseList =
    mode === 'CLASSIC'
      ? BASE_LEADERBOARD_CLASSIC
      : mode === 'TIME_ATTACK'
      ? BASE_LEADERBOARD_TIME_ATTACK
      : BASE_LEADERBOARD_LEVELS;

  const playerScore = getSanitizedHighScore(profile, mode);

  const playerName = profile.playerName?.trim() || '你 (You)';

  const playerEntry: LeaderboardEntry = {
    rank: 0,
    id: 'current_player',
    name: playerName,
    avatar: '👑',
    score: playerScore,
    mode,
    date: '剛剛',
    badge: '你的記錄',
    isCurrentPlayer: true,
  };

  // 複製對手列表並過濾掉自身
  const competitorEntries: LeaderboardEntry[] = baseList.map((entry) => ({
    ...entry,
    rank: 0,
    isCurrentPlayer: false,
  }));

  // 將當前玩家加入列表
  const allEntries = [...competitorEntries, playerEntry];

  // 依分數高至低排序
  allEntries.sort((a, b) => b.score - a.score);

  // 計算每一位的名次 (相同分數依排序)
  let foundPlayerRank = allEntries.length;
  allEntries.forEach((entry, idx) => {
    entry.rank = idx + 1;
    if (entry.isCurrentPlayer) {
      foundPlayerRank = entry.rank;
    }
  });

  // 前 20 名記錄
  const top20 = allEntries.slice(0, 20);
  const isInTop20 = foundPlayerRank <= 20;

  // 若未進入前20名，計算距離第20名的分數差距
  const rank20Score = top20.length >= 20 ? top20[19].score : 0;
  const scoreDifferenceToTop20 = Math.max(0, rank20Score - playerScore + 1);

  return {
    top20,
    playerEntry: { ...playerEntry, rank: foundPlayerRank },
    playerRank: foundPlayerRank,
    isInTop20,
    scoreDifferenceToTop20,
  };
}
