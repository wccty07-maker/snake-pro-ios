import { SnakeSkin, ArenaTheme, Achievement, PlayerProfile, DailyMission, DailyMissionType } from '../types';
import { SupportedLanguage, detectSystemLanguage } from './i18n';

export interface DailyDifficultyInfo {
  level: number;
  title: Record<SupportedLanguage, string>;
  scale: number;
  bonusPercent: number;
  tagColor: string;
}

export const DAILY_DIFFICULTY_TIERS: DailyDifficultyInfo[] = [
  {
    level: 1,
    title: { 'zh-HK': '初階試煉', 'zh-CN': '初阶试炼', en: 'Apprentice', ja: '見習い試練' },
    scale: 1.0,
    bonusPercent: 0,
    tagColor: 'from-emerald-500 to-teal-500',
  },
  {
    level: 2,
    title: { 'zh-HK': '漸入佳境', 'zh-CN': '渐入佳境', en: 'Rising Star', ja: '順調な歩み' },
    scale: 1.25,
    bonusPercent: 25,
    tagColor: 'from-cyan-500 to-blue-500',
  },
  {
    level: 3,
    title: { 'zh-HK': '身手敏捷', 'zh-CN': '身手敏捷', en: 'Agile Hunter', ja: '敏捷な戦士' },
    scale: 1.5,
    bonusPercent: 50,
    tagColor: 'from-blue-500 to-indigo-500',
  },
  {
    level: 4,
    title: { 'zh-HK': '凌厲強悍', 'zh-CN': '凌厉强悍', en: 'Fierce Challenger', ja: '勇猛なる挑戦' },
    scale: 1.8,
    bonusPercent: 80,
    tagColor: 'from-purple-500 to-pink-500',
  },
  {
    level: 5,
    title: { 'zh-HK': '狂暴試煉', 'zh-CN': '狂暴试炼', en: 'Berserk Trial', ja: '狂乱の試練' },
    scale: 2.2,
    bonusPercent: 120,
    tagColor: 'from-amber-500 to-rose-500',
  },
  {
    level: 6,
    title: { 'zh-HK': '宗師威壓', 'zh-CN': '宗师威压', en: 'Master Pressure', ja: '達人の覇気' },
    scale: 2.6,
    bonusPercent: 160,
    tagColor: 'from-rose-500 to-red-600',
  },
  {
    level: 7,
    title: { 'zh-HK': '神話巔峰', 'zh-CN': '神话巅峰', en: 'Mythic Zenith', ja: '神話の頂点' },
    scale: 3.0,
    bonusPercent: 200,
    tagColor: 'from-amber-400 via-rose-500 to-purple-600',
  },
];

export const getDailyDifficultyInfo = (streak: number = 0): DailyDifficultyInfo => {
  const lvl = Math.min(7, Math.max(1, ((streak || 0) % 7) + 1));
  return DAILY_DIFFICULTY_TIERS[lvl - 1] || DAILY_DIFFICULTY_TIERS[0];
};

interface MissionTemplate {
  missionType: DailyMissionType;
  idPrefix: string;
  icon: string;
  baseMax: number;
  baseReward: number;
  titleKey: string;
  defaultTitle: string;
  defaultDesc: string;
}

const DAILY_MISSION_POOL: MissionTemplate[] = [
  {
    missionType: 'PLAY_GAMES',
    idPrefix: 'daily_play',
    icon: '🎮',
    baseMax: 2,
    baseReward: 60,
    titleKey: 'daily_play',
    defaultTitle: '每日熱身試煉',
    defaultDesc: '完成任意模式遊玩 {n} 場',
  },
  {
    missionType: 'EAT_APPLES',
    idPrefix: 'daily_eat',
    icon: '🍇',
    baseMax: 20,
    baseReward: 80,
    titleKey: 'daily_eat',
    defaultTitle: '能量暴食怪',
    defaultDesc: '累計吃下 {n} 顆能量果實/金蘋果',
  },
  {
    missionType: 'HIGH_SCORE',
    idPrefix: 'daily_score',
    icon: '⭐',
    baseMax: 150,
    baseReward: 100,
    titleKey: 'daily_score',
    defaultTitle: '怪獸衝擊高分',
    defaultDesc: '單局分數達到 {n} 分以上',
  },
  {
    missionType: 'CLEAR_LEVEL',
    idPrefix: 'daily_level',
    icon: '🎯',
    baseMax: 1,
    baseReward: 120,
    titleKey: 'daily_level',
    defaultTitle: '闖關冒險先鋒',
    defaultDesc: '成功通關任 {n} 個糖果奇幻關卡',
  },
  {
    missionType: 'EARN_COINS',
    idPrefix: 'daily_coins',
    icon: '💰',
    baseMax: 50,
    baseReward: 100,
    titleKey: 'daily_coins',
    defaultTitle: '金幣豐收達人',
    defaultDesc: '在對局或闖關中累計賺取 {n} 枚金幣',
  },
  {
    missionType: 'EAT_GOLDEN',
    idPrefix: 'daily_golden',
    icon: '🌟',
    baseMax: 2,
    baseReward: 90,
    titleKey: 'daily_golden',
    defaultTitle: '黃金盛宴獵手',
    defaultDesc: '在任一對局中吃下 {n} 顆閃耀金色蘋果',
  },
  {
    missionType: 'COLLECT_SHIELD',
    idPrefix: 'daily_shield',
    icon: '🛡️',
    baseMax: 2,
    baseReward: 85,
    titleKey: 'daily_shield',
    defaultTitle: '守護力場護體',
    defaultDesc: '在冒險中啟動 {n} 次守護護盾法球',
  },
  {
    missionType: 'SNAKE_LENGTH',
    idPrefix: 'daily_length',
    icon: '🦕',
    baseMax: 15,
    baseReward: 95,
    titleKey: 'daily_length',
    defaultTitle: '巨蟒體格生長',
    defaultDesc: '單局萌蛇身長達到 {n} 格以上',
  },
];

/**
 * 依據日期與玩家天數天梯動態生成今日目標：
 * 1. 每日 00:00 根據日期輪換不同目標組合 (每日轉一次)
 * 2. 每日難度逐日加強，金幣獎勵同步翻倍 (難度每日加強)
 * 3. 除每日簽到外，每日簽到永遠維持登入即領 100 金幣不變！
 */
export const getDailyMissionsForDate = (dateStr: string, streak: number = 0): DailyMission[] => {
  const diffInfo = getDailyDifficultyInfo(streak);

  // 1. 每日簽到 (除咗每日簽到外，永遠固定開啟即領 100 金幣，絕不提高難度)
  const checkInMission: DailyMission = {
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

  // 2. 依據日期進行輪換 (Daily Rotation)
  let dateSeed = 0;
  for (let i = 0; i < dateStr.length; i++) {
    dateSeed = (dateSeed * 31 + dateStr.charCodeAt(i)) & 0x7fffffff;
  }

  // 從 8 個每日任務範本中，選出 5 個輪換任務
  const shuffledPool = [...DAILY_MISSION_POOL].sort((a, b) => {
    const hashA = (dateSeed * 17 + a.idPrefix.charCodeAt(0) * 13) % 100;
    const hashB = (dateSeed * 17 + b.idPrefix.charCodeAt(0) * 13) % 100;
    return hashA - hashB;
  });

  const selectedTemplates = shuffledPool.slice(0, 5);

  // 3. 難度每日加強 (Scale difficulty target & reward)
  const scaledMissions: DailyMission[] = selectedTemplates.map((tpl) => {
    let scaledMax = Math.round(tpl.baseMax * diffInfo.scale);
    // 整數微調
    if (tpl.missionType === 'CLEAR_LEVEL' || tpl.missionType === 'PLAY_GAMES') {
      scaledMax = Math.max(1, Math.round(tpl.baseMax + (diffInfo.level - 1)));
    } else if (tpl.missionType === 'EAT_GOLDEN' || tpl.missionType === 'COLLECT_SHIELD') {
      scaledMax = Math.max(1, Math.round(tpl.baseMax + Math.floor(diffInfo.level / 2)));
    } else if (tpl.missionType === 'HIGH_SCORE') {
      scaledMax = Math.round((tpl.baseMax * diffInfo.scale) / 10) * 10;
    }

    const scaledReward = Math.round(tpl.baseReward * diffInfo.scale);
    const rewardHearts = diffInfo.level === 7 ? 1 : 0; // 第 7 天神話巔峰加送 1 顆愛心

    return {
      id: `${tpl.idPrefix}_lvl${diffInfo.level}`,
      title: tpl.defaultTitle,
      description: tpl.defaultDesc.replace('{n}', String(scaledMax)),
      icon: tpl.icon,
      progress: 0,
      maxProgress: scaledMax,
      completed: false,
      claimed: false,
      rewardCoins: scaledReward,
      rewardHearts: rewardHearts > 0 ? rewardHearts : undefined,
      missionType: tpl.missionType,
      difficultyLevel: diffInfo.level,
      difficultyBonusPercent: diffInfo.bonusPercent,
    };
  });

  return [checkInMission, ...scaledMissions];
};

export const getDefaultDailyMissions = (): DailyMission[] => {
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return getDailyMissionsForDate(dateStr, 0);
};

export const SNAKE_SKINS: SnakeSkin[] = [
  {
    id: 'neon_viper',
    name: '霓虹幻彩流光蛇 (Neon Cyber Viper)',
    description: '1. Neon Digital Grid 原作流光蛇，賽博能量光條與璀璨星眸',
    headColor: '#38bdf8',
    bodyColor: '#06b6d4',
    tailColor: '#818cf8',
    glowColor: 'rgba(56, 189, 248, 0.9)',
    eyeColor: '#ffffff',
    price: 0,
    unlocked: true,
  },
  {
    id: 'neon_caterpillar',
    name: '霓虹萌趣毛毛蟲 (Neon Caterpillar)',
    description: '原作翠綠發光毛毛蟲，環形分節體表與可愛螢光眼眸',
    headColor: '#22c55e',
    bodyColor: '#4ade80',
    tailColor: '#16a34a',
    glowColor: 'rgba(34, 197, 94, 0.9)',
    eyeColor: '#ffffff',
    price: 5000,
    unlocked: false,
  },
  {
    id: 'mikey_green',
    name: '翡翠大眼萌蛇 (Emerald Peeker)',
    description: '原創奇幻翠綠小萌蛇，生動靈巧大眼與可愛小角',
    headColor: '#10b981',
    bodyColor: '#34d399',
    tailColor: '#059669',
    glowColor: 'rgba(16, 185, 129, 0.75)',
    eyeColor: '#047857',
    price: 5000,
    unlocked: false,
  },
  {
    id: 'macaron_cutie',
    name: '粉嫩小萌蛇 (Pinky Cutie)',
    description: '粉紅腮紅與大眼睛萌蛇',
    headColor: '#f43f5e',
    bodyColor: '#fb7185',
    tailColor: '#fda4af',
    glowColor: 'rgba(244, 63, 94, 0.75)',
    eyeColor: '#ffffff',
    price: 5000,
    unlocked: false,
  },
  {
    id: 'sulley_furry',
    name: '紫斑絨羽萌蛇 (Fluffy Spotted)',
    description: '毛絨幻彩青紫配色，柔順體表與薰衣草紫斑紋',
    headColor: '#06b6d4',
    bodyColor: '#8b5cf6',
    tailColor: '#3b82f6',
    glowColor: 'rgba(6, 182, 212, 0.8)',
    eyeColor: '#0284c7',
    price: 6500,
    unlocked: false,
  },
  {
    id: 'neon_aurora',
    name: '霓虹極光紫晶蛇 (Neon Aurora Serpent)',
    description: '原作粉紫極光流光靈蛇，浪漫漸層光紋與星芒閃爍',
    headColor: '#c084fc',
    bodyColor: '#e879f9',
    tailColor: '#f43f5e',
    glowColor: 'rgba(216, 70, 239, 0.85)',
    eyeColor: '#ffffff',
    price: 8000,
    unlocked: false,
  },
  {
    id: 'night_fury',
    name: '暗夜黑曜龍蛇 (Shadow Obsidian)',
    description: '神秘幽影龍族造型，黑曜石龍鱗與深邃翠綠大眼',
    headColor: '#1e293b',
    bodyColor: '#334155',
    tailColor: '#0f172a',
    glowColor: 'rgba(34, 197, 94, 0.85)',
    eyeColor: '#22c55e',
    price: 10000,
    unlocked: false,
  },
  {
    id: 'spicy_drake',
    name: '烈焰小萌龍 (Spicy Drake)',
    description: '活潑調皮的橙紅小飛龍，琥珀金瞳與俏皮火焰頭冠',
    headColor: '#f97316',
    bodyColor: '#fb923c',
    tailColor: '#ea580c',
    glowColor: 'rgba(249, 115, 22, 0.8)',
    eyeColor: '#facc15',
    price: 15000,
    unlocked: false,
  },
  {
    id: 'electric_spark',
    name: '霓虹電能萌蛇 (Volt Spark)',
    description: '超能電力奇趣小獸，高壓電光與霓虹觸角',
    headColor: '#38bdf8',
    bodyColor: '#818cf8',
    tailColor: '#c084fc',
    glowColor: 'rgba(56, 189, 248, 0.8)',
    eyeColor: '#38bdf8',
    price: 20000,
    unlocked: false,
  },
  {
    id: 'golden_beast',
    name: '黃金傳奇神獸 (Golden Mythic)',
    description: '帝王般尊貴神話萌獸，流光溢彩黃金龍鱗',
    headColor: '#facc15',
    bodyColor: '#eab308',
    tailColor: '#ca8a04',
    glowColor: 'rgba(250, 204, 21, 0.85)',
    eyeColor: '#ffffff',
    price: 35000,
    unlocked: false,
  },
];

export const ARENA_THEMES: ArenaTheme[] = [
  {
    id: 'neon_grid',
    name: '霓虹數碼蜂巢 (Neon Digital Grid)',
    description: '1. Neon Digital Grid 賽博六角蜂巢能量網，深邃幽藍與霓虹流光',
    bgGradient: ['#080c1d', '#040713'],
    gridColor: 'rgba(56, 189, 248, 0.12)',
    wallColor: '#38bdf8',
    wallGlow: 'rgba(56, 189, 248, 0.65)',
    price: 0,
    unlocked: true,
  },
  {
    id: 'scare_floor',
    name: '奇幻霓虹工廠 (Neon Power Arena)',
    description: '能源幻彩科技工廠，工業神秘深紫與螢光霓虹',
    bgGradient: ['#0f172a', '#1e1b4b'],
    gridColor: 'rgba(99, 102, 241, 0.22)',
    wallColor: '#6366f1',
    wallGlow: 'rgba(99, 102, 241, 0.55)',
    price: 5000,
    unlocked: false,
  },
  {
    id: 'candy_kingdom',
    name: '夢幻奇趣場 (Fantasy Arena)',
    description: '奇幻萌怪遊樂競技場',
    bgGradient: ['#240d33', '#4a154b'],
    gridColor: 'rgba(244, 114, 182, 0.22)',
    wallColor: '#f472b6',
    wallGlow: 'rgba(244, 114, 182, 0.55)',
    price: 5000,
    unlocked: false,
  },
  {
    id: 'dragon_island',
    name: '幽谷神秘海島 (Mystic Dragon Isle)',
    description: '奇幻巨龍秘境海島，幽邃深海與青苔山巒',
    bgGradient: ['#022c22', '#064e3b'],
    gridColor: 'rgba(16, 185, 129, 0.22)',
    wallColor: '#10b981',
    wallGlow: 'rgba(16, 185, 129, 0.6)',
    price: 8000,
    unlocked: false,
  },
  {
    id: 'biolum_jungle',
    name: '夜光奇幻森林 (Bioluminescent Jungle)',
    description: '外星發光植物、神秘孢子與奇異晶石洞穴',
    bgGradient: ['#170b3b', '#3b0764'],
    gridColor: 'rgba(192, 132, 252, 0.25)',
    wallColor: '#c084fc',
    wallGlow: 'rgba(192, 132, 252, 0.6)',
    price: 12000,
    unlocked: false,
  },
  {
    id: 'monster_academy',
    name: '萌獸魔法學院 (Magic Academy)',
    description: '魔法學院殿堂，復古校園石砌與深藍星夜',
    bgGradient: ['#082f49', '#0c4a6e'],
    gridColor: 'rgba(56, 189, 248, 0.25)',
    wallColor: '#38bdf8',
    wallGlow: 'rgba(56, 189, 248, 0.6)',
    price: 20000,
    unlocked: false,
  },
];

export interface AchievementTierInfo {
  tier: number;
  title: Record<SupportedLanguage, string>;
  stageRange: string;
  minLevel: number;
  maxLevel: number;
  badge: Record<SupportedLanguage, string>;
  themeColor: string;
  accentHex: string;
}

export const ACHIEVEMENT_TIERS: AchievementTierInfo[] = [
  {
    tier: 1,
    title: {
      'zh-HK': '初涉奇境 · 1~100關階級',
      'zh-CN': '初涉奇境 · 1~100关阶级',
      en: 'Apprentice Realm (Stages 1~100)',
      ja: '見習いの領域 (1~100ステージ)',
    },
    stageRange: '1~100',
    minLevel: 1,
    maxLevel: 100,
    badge: {
      'zh-HK': '🌱 第 1 階',
      'zh-CN': '🌱 第 1 阶',
      en: '🌱 Tier 1',
      ja: '🌱 第 1 階',
    },
    themeColor: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/40 text-emerald-300',
    accentHex: '#10b981',
  },
  {
    tier: 2,
    title: {
      'zh-HK': '百戰精銳 · 101~200關階級',
      'zh-CN': '百战精锐 · 101~200关阶级',
      en: 'Elite Veteran (Stages 101~200)',
      ja: '精鋭ベテラン (101~200ステージ)',
    },
    stageRange: '101~200',
    minLevel: 101,
    maxLevel: 200,
    badge: {
      'zh-HK': '⚔️ 第 2 階',
      'zh-CN': '⚔️ 第 2 阶',
      en: '⚔️ Tier 2',
      ja: '⚔️ 第 2 階',
    },
    themeColor: 'from-sky-500/20 to-blue-500/10 border-sky-500/40 text-sky-300',
    accentHex: '#0ea5e9',
  },
  {
    tier: 3,
    title: {
      'zh-HK': '萬靈霸主 · 201~300關階級',
      'zh-CN': '万灵霸主 · 201~300关阶级',
      en: 'Mythic Overlord (Stages 201~300)',
      ja: '万霊の覇者 (201~300ステージ)',
    },
    stageRange: '201~300',
    minLevel: 201,
    maxLevel: 300,
    badge: {
      'zh-HK': '👑 第 3 階',
      'zh-CN': '👑 第 3 阶',
      en: '👑 Tier 3',
      ja: '👑 第 3 階',
    },
    themeColor: 'from-purple-500/20 to-pink-500/10 border-purple-500/40 text-purple-300',
    accentHex: '#a855f7',
  },
  {
    tier: 4,
    title: {
      'zh-HK': '創世傳奇 · 301~400關巔峰',
      'zh-CN': '创世传奇 · 301~400关巅峰',
      en: 'Genesis Legend (Stages 301~400)',
      ja: '創世の伝説 (301~400ステージ)',
    },
    stageRange: '301~400',
    minLevel: 301,
    maxLevel: 400,
    badge: {
      'zh-HK': '🌟 第 4 階',
      'zh-CN': '🌟 第 4 阶',
      en: '🌟 Tier 4',
      ja: '🌟 第 4 階',
    },
    themeColor: 'from-amber-500/25 to-rose-500/15 border-amber-400/50 text-amber-300',
    accentHex: '#f59e0b',
  },
];

export const getAchievementTierBadge = (
  tierInfo: AchievementTierInfo,
  lang: SupportedLanguage = 'zh-HK'
): string => {
  if (typeof tierInfo.badge === 'object' && tierInfo.badge !== null) {
    return tierInfo.badge[lang] || tierInfo.badge['en'] || tierInfo.badge['zh-HK'];
  }
  const icon = tierInfo.tier === 1 ? '🌱' : tierInfo.tier === 2 ? '⚔️' : tierInfo.tier === 3 ? '👑' : '🌟';
  if (lang === 'en') return `${icon} Tier ${tierInfo.tier}`;
  if (lang === 'zh-CN') return `${icon} 第 ${tierInfo.tier} 阶`;
  if (lang === 'ja') return `${icon} 第 ${tierInfo.tier} 階`;
  return `${icon} 第 ${tierInfo.tier} 階`;
};

export const getAchievementTierForLevel = (level: number = 1): number => {
  if (level <= 100) return 1;
  if (level <= 200) return 2;
  if (level <= 300) return 3;
  return 4;
};

export const isAchievementTierUnlocked = (ach: Achievement, unlockedLevel: number = 1): boolean => {
  const minLevel = ach.requiredStageMin ?? (ach.tier === 2 ? 101 : ach.tier === 3 ? 201 : ach.tier === 4 ? 301 : 1);
  return (unlockedLevel || 1) >= minLevel;
};

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  // ================= TIER 1: 1~100 關 (初入奇境) =================
  {
    id: 'first_bite',
    title: '第一口美味能量',
    description: '在任何模式中吃下第一顆能量果實',
    icon: '🍇',
    progress: 0,
    maxProgress: 1,
    unlocked: false,
    claimed: false,
    rewardCoins: 50,
    tier: 1,
    requiredStageMin: 1,
  },
  {
    id: 'combo_master',
    title: '狂暴連擊大師',
    description: '快速連吃觸發 3x 連擊倍率',
    icon: '⚡',
    progress: 0,
    maxProgress: 1,
    unlocked: false,
    claimed: false,
    rewardCoins: 100,
    tier: 1,
    requiredStageMin: 1,
  },
  {
    id: 'length_20',
    title: '大怪獸成長',
    description: '萌蛇身長達到 20 格',
    icon: '🦕',
    progress: 4,
    maxProgress: 20,
    unlocked: false,
    claimed: false,
    rewardCoins: 150,
    tier: 1,
    requiredStageMin: 1,
  },
  {
    id: 'length_40',
    title: '巨龍盤踞',
    description: '萌蛇身長達到 40 格',
    icon: '🐉',
    progress: 4,
    maxProgress: 40,
    unlocked: false,
    claimed: false,
    rewardCoins: 300,
    tier: 1,
    requiredStageMin: 1,
  },
  {
    id: 'score_500',
    title: '傳奇怪獸王',
    description: '單局得分突破 500 分',
    icon: '🏆',
    progress: 0,
    maxProgress: 500,
    unlocked: false,
    claimed: false,
    rewardCoins: 250,
    tier: 1,
    requiredStageMin: 1,
  },
  {
    id: 'collector',
    title: '萌怪收藏家',
    description: '解鎖任意一款怪獸蛇身造型',
    icon: '🎨',
    progress: 1,
    maxProgress: 2,
    unlocked: false,
    claimed: false,
    rewardCoins: 200,
    tier: 1,
    requiredStageMin: 1,
  },
  {
    id: 'stage_50',
    title: '半百探險先鋒',
    description: '成功闖過冒險模式第 50 關',
    icon: '🚩',
    progress: 1,
    maxProgress: 50,
    unlocked: false,
    claimed: false,
    rewardCoins: 350,
    tier: 1,
    requiredStageMin: 1,
  },
  {
    id: 'stage_100',
    title: '百關宗師大成',
    description: '成功闖過第 100 關！輪替開啟第 2 階精銳挑戰',
    icon: '💯',
    progress: 1,
    maxProgress: 100,
    unlocked: false,
    claimed: false,
    rewardCoins: 600,
    tier: 1,
    requiredStageMin: 1,
  },

  // ================= TIER 2: 101~200 關 (百戰精銳 · 難度加強) =================
  {
    id: 't2_fruits_150',
    title: '狂食風暴之胃',
    description: '累計吞噬 150 顆各色能量果實',
    icon: '🍒',
    progress: 0,
    maxProgress: 150,
    unlocked: false,
    claimed: false,
    rewardCoins: 500,
    tier: 2,
    requiredStageMin: 101,
  },
  {
    id: 't2_combo_4x',
    title: '4x 極限連擊狂潮',
    description: '身法迅猛如電，連續觸發 4x 極限倍率',
    icon: '⚡',
    progress: 0,
    maxProgress: 1,
    unlocked: false,
    claimed: false,
    rewardCoins: 600,
    tier: 2,
    requiredStageMin: 101,
  },
  {
    id: 't2_length_55',
    title: '深谷巨蟒體魄',
    description: '在對局中萌蛇身長達到 55 格',
    icon: '🐍',
    progress: 4,
    maxProgress: 55,
    unlocked: false,
    claimed: false,
    rewardCoins: 750,
    tier: 2,
    requiredStageMin: 101,
  },
  {
    id: 't2_length_70',
    title: '深淵泰坦神軀',
    description: '在對局中萌蛇身長突破 70 格',
    icon: '🐊',
    progress: 4,
    maxProgress: 70,
    unlocked: false,
    claimed: false,
    rewardCoins: 1000,
    tier: 2,
    requiredStageMin: 101,
  },
  {
    id: 't2_score_1500',
    title: '精銳超高分霸主',
    description: '任一對局單局得分突破 1,500 分',
    icon: '🌟',
    progress: 0,
    maxProgress: 1500,
    unlocked: false,
    claimed: false,
    rewardCoins: 1000,
    tier: 2,
    requiredStageMin: 101,
  },
  {
    id: 't2_collector_3',
    title: '造型收藏行家',
    description: '解鎖並擁有至少 3 款不同萌蛇造型',
    icon: '🎭',
    progress: 1,
    maxProgress: 3,
    unlocked: false,
    claimed: false,
    rewardCoins: 800,
    tier: 2,
    requiredStageMin: 101,
  },
  {
    id: 't2_stage_150',
    title: '跨越百五關',
    description: '成功闖過冒險模式第 150 關',
    icon: '🏔️',
    progress: 1,
    maxProgress: 150,
    unlocked: false,
    claimed: false,
    rewardCoins: 1200,
    tier: 2,
    requiredStageMin: 101,
  },
  {
    id: 't2_stage_200',
    title: '雙百關傳說',
    description: '成功闖過第 200 關！輪替開啟第 3 階霸主挑戰',
    icon: '🎖️',
    progress: 1,
    maxProgress: 200,
    unlocked: false,
    claimed: false,
    rewardCoins: 1600,
    tier: 2,
    requiredStageMin: 101,
  },

  // ================= TIER 3: 201~300 關 (萬靈霸主 · 大師難度加強) =================
  {
    id: 't3_fruits_400',
    title: '萬靈能量吞噬巨擘',
    description: '累計吞噬 400 顆能量果實',
    icon: '🍉',
    progress: 0,
    maxProgress: 400,
    unlocked: false,
    claimed: false,
    rewardCoins: 1200,
    tier: 3,
    requiredStageMin: 201,
  },
  {
    id: 't3_length_85',
    title: '吞天巨靈之軀',
    description: '在對局中萌蛇身長達到 85 格',
    icon: '🐉',
    progress: 4,
    maxProgress: 85,
    unlocked: false,
    claimed: false,
    rewardCoins: 1800,
    tier: 3,
    requiredStageMin: 201,
  },
  {
    id: 't3_length_100',
    title: '百節不朽聖龍',
    description: '在對局中萌蛇身長達到震撼的 100 格',
    icon: '👑',
    progress: 4,
    maxProgress: 100,
    unlocked: false,
    claimed: false,
    rewardCoins: 2500,
    tier: 3,
    requiredStageMin: 201,
  },
  {
    id: 't3_score_3500',
    title: '萬靈神話分突破',
    description: '任一對局單局得分突破 3,500 分',
    icon: '🔮',
    progress: 0,
    maxProgress: 3500,
    unlocked: false,
    claimed: false,
    rewardCoins: 2500,
    tier: 3,
    requiredStageMin: 201,
  },
  {
    id: 't3_coins_3000',
    title: '金幣財富巨鱷',
    description: '生涯累計獲得超過 3,000 枚金幣',
    icon: '💰',
    progress: 0,
    maxProgress: 3000,
    unlocked: false,
    claimed: false,
    rewardCoins: 1500,
    tier: 3,
    requiredStageMin: 201,
  },
  {
    id: 't3_collector_5',
    title: '五裝全能名士',
    description: '解鎖並擁有 5 款以上萌蛇造型或競技場景',
    icon: '🎪',
    progress: 1,
    maxProgress: 5,
    unlocked: false,
    claimed: false,
    rewardCoins: 1800,
    tier: 3,
    requiredStageMin: 201,
  },
  {
    id: 't3_stage_250',
    title: '二百五十關里程碑',
    description: '成功闖過冒險模式第 250 關',
    icon: '🏰',
    progress: 1,
    maxProgress: 250,
    unlocked: false,
    claimed: false,
    rewardCoins: 2200,
    tier: 3,
    requiredStageMin: 201,
  },
  {
    id: 't3_stage_300',
    title: '三百關諸神霸主',
    description: '成功闖過第 300 關！輪替開啟第 4 階創世終極巔峰',
    icon: '🔱',
    progress: 1,
    maxProgress: 300,
    unlocked: false,
    claimed: false,
    rewardCoins: 3500,
    tier: 3,
    requiredStageMin: 201,
  },

  // ================= TIER 4: 301~400 關 (創世傳奇 · 終極巔峰加強) =================
  {
    id: 't4_fruits_1000',
    title: '創世星核能量暴食',
    description: '累計吞噬 1,000 顆能量果實',
    icon: '🌌',
    progress: 0,
    maxProgress: 1000,
    unlocked: false,
    claimed: false,
    rewardCoins: 3000,
    tier: 4,
    requiredStageMin: 301,
  },
  {
    id: 't4_length_120',
    title: '創世神龍無盡盤旋',
    description: '在對局中萌蛇身長達到極限 120 格',
    icon: '🐲',
    progress: 4,
    maxProgress: 120,
    unlocked: false,
    claimed: false,
    rewardCoins: 5000,
    tier: 4,
    requiredStageMin: 301,
  },
  {
    id: 't4_score_8000',
    title: '宇宙至尊創世分',
    description: '任一對局單局得分突破 8,000 分創世神蹟',
    icon: '🌠',
    progress: 0,
    maxProgress: 8000,
    unlocked: false,
    claimed: false,
    rewardCoins: 6000,
    tier: 4,
    requiredStageMin: 301,
  },
  {
    id: 't4_coins_10000',
    title: '萬金傳奇富豪',
    description: '生涯累計獲得超過 10,000 枚金幣',
    icon: '💎',
    progress: 0,
    maxProgress: 10000,
    unlocked: false,
    claimed: false,
    rewardCoins: 5000,
    tier: 4,
    requiredStageMin: 301,
  },
  {
    id: 't4_skins_all',
    title: '全造型頂級收藏家',
    description: '解鎖並擁有 6 款以上萌蛇頂級造型',
    icon: '👑',
    progress: 1,
    maxProgress: 6,
    unlocked: false,
    claimed: false,
    rewardCoins: 4000,
    tier: 4,
    requiredStageMin: 301,
  },
  {
    id: 't4_stage_350',
    title: '臨登天宮極頂',
    description: '成功闖過冒險模式第 350 關',
    icon: '☁️',
    progress: 1,
    maxProgress: 350,
    unlocked: false,
    claimed: false,
    rewardCoins: 5000,
    tier: 4,
    requiredStageMin: 301,
  },
  {
    id: 't4_stage_400',
    title: '400關創世星殿大滿貫',
    description: '成功擊潰第 400 關創世神殿總決戰！全遊大圓滿！',
    icon: '🏆',
    progress: 1,
    maxProgress: 400,
    unlocked: false,
    claimed: false,
    rewardCoins: 8888,
    tier: 4,
    requiredStageMin: 301,
  },
];

export const OLD_DEFAULT_USERNAMES: string[] = [
  '怪獸萌蛇王',
  '怪兽萌蛇王',
  'Snake Master',
  'スネークマスター',
  '神秘蛇王',
  '神秘玩家',
  'Snake Player',
];

/**
 * 檢查暱稱是否為早期系統固定預設名稱或空白重覆名稱
 */
export const isDefaultOrDuplicateUsername = (name?: string | null): boolean => {
  if (!name || !name.trim()) return true;
  const trimmed = name.trim();
  return OLD_DEFAULT_USERNAMES.includes(trimmed);
};

export const DEFAULT_USERNAMES_BY_LANG: Record<SupportedLanguage, string> = {
  'zh-HK': '怪獸萌蛇王',
  'zh-CN': '怪兽萌蛇王',
  'en': 'Snake Master',
  'ja': 'スネークマスター',
};

/**
 * 取得標準固定預設暱稱（不再隨機派發隨機帶 # 標籤之暱稱，由玩家自行在設定輸入）
 */
export function getDefaultPlayerName(lang: SupportedLanguage = 'zh-HK'): string {
  return DEFAULT_USERNAMES_BY_LANG[lang] || DEFAULT_USERNAMES_BY_LANG['zh-HK'];
}

/**
 * 保持相容簽名，返回標準固定暱稱（不再隨機派發）
 */
export function generateUniquePlayerName(lang: SupportedLanguage = 'zh-HK'): string {
  return getDefaultPlayerName(lang);
}

export const createDefaultPlayerProfile = (lang?: SupportedLanguage): PlayerProfile => {
  const initialLang = lang || detectSystemLanguage();
  return {
    playerName: generateUniquePlayerName(initialLang),
    hasCustomUsername: false,
    coins: 80,
    totalGames: 0,
    totalApples: 0,
    hasPlayedClassic: false,
    hasPlayedTimeAttack: false,
    hasPlayedMissions: false,
    classicGamesPlayed: 0,
    timeAttackGamesPlayed: 0,
    missionsGamesPlayed: 0,
    highScores: {
      LEVELS: 0,
      CLASSIC: 0,
      TIME_ATTACK: 0,
      SURVIVAL: 0,
    },
    levelHighScores: {},
    selectedSkin: 'neon_viper',
    selectedArena: 'neon_grid',
    unlockedSkins: ['neon_viper'],
    unlockedArenas: ['neon_grid'],
    soundEnabled: true,
    bgmEnabled: true,
    hapticsEnabled: false,
    language: initialLang,
    hasCustomLanguage: false,
    hasCompletedTutorial: false,
    hasClaimedTutorialReward: false,
    controlType: 'SWIPE',
    dpadPosition: 'BOTTOM_CENTER',
    showGrid: true,
    unlockedLevel: 1,
    lastSelectedLevel: 1,
    completedLevels: [],
    unlockAllLevels: false,
    hearts: 5,
    maxHearts: 5,
    lastHeartRefillTimestamp: Date.now(),
    dailyAdWatchDate: '',
    dailyAdWatchCount: 0,
    seenItems: [],
    batterySaverEnabled: false,
    targetFps: 60,
    glowEffectsEnabled: true,
  };
};

export const DEFAULT_PLAYER_PROFILE: PlayerProfile = createDefaultPlayerProfile();
