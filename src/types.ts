export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export interface Point {
  x: number;
  y: number;
}

export type GameMode = 'LEVELS' | 'CLASSIC' | 'TIME_ATTACK' | 'SURVIVAL';

export type GameOverReason =
  | 'WALL'
  | 'OBSTACLE'
  | 'SELF'
  | 'ROVING_SNAKE'
  | 'TIME_OUT'
  | 'TIMEOUT'
  | 'PORTAL_TIMEOUT'
  | 'BOMB_EXPLODED'
  | 'OUT_OF_TURNS'
  | 'WRONG_COLOR_GATE';

export type ControlType = 'SWIPE' | 'DPAD' | 'JOYSTICK';

export type FoodType =
  | 'NORMAL'
  | 'GOLDEN'
  | 'SHIELD'
  | 'SLOW'
  | 'COIN'
  | 'BLUE'
  | 'GREEN'
  | 'PORTAL'
  | 'MAGNET'
  | 'CHILI'
  | 'DRAGON_EGG'
  | 'RAINBOW'
  | 'BOMB'
  | 'GHOST'
  | 'REVERSE'
  | 'GLOW_BERRY'
  | 'KEY'
  | 'LOCK_GATE'
  | 'LIGHTNING';

export type ObstaclePatternType =
  | 'NONE'
  | 'CORNERS'
  | 'PILLARS'
  | 'CROSS'
  | 'MAZE'
  | 'BOX'
  | 'SCATTERED'
  | 'CORRIDOR'
  | 'DOUBLE_GATE'
  | 'SPIRAL'
  | 'HOURGLASS'
  | 'DIAMOND'
  | 'CASTLE'
  | 'PYRAMID'
  | 'CHECKERBOARD'
  | 'TWIN_BRIDGES'
  | 'VOLCANO_RIM'
  | 'CYBER_CIRCUIT'
  | 'CORAL_REEF'
  | 'ASTRAL_STAR'
  | 'PORTAL_GATE'
  | 'SERPENTINE'
  | 'ZIG_ZAG'
  | 'TREASURE_VAULT'
  | 'BOSS_ARENA';

export interface LevelMission {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  targets: {
    normal?: number;    // 紅色蘋果
    blue?: number;      // 藍色蘋果
    green?: number;     // 青色蘋果
    golden?: number;    // 金色蘋果
    shield?: number;    // 護盾法球
    length?: number;    // 蛇身長度
    portals?: number;   // 穿越傳送門次數
    magnet?: number;    // 磁石珍珠
    chili?: number;     // 烈焰辣椒
    dragonEgg?: number; // 巨龍蛋
    rainbow?: number;   // 彩虹糖
    bombs?: number;     // 限時拆除炸彈數
    colorSequenceCount?: number; // 完成顏色順序次數
    keys?: number;      // 拾取鑰匙數
    lightning?: number; // 電磁超頻核心
    surviveSeconds?: number; // 維持生存目標 (秒)
  };
  timeLimit?: number; // 限時倒數 (秒)
  hasObstacles?: boolean;
  obstacleType?: ObstaclePatternType;
  rovingSnakesCount?: number; // 巡邏阻礙蛇數量
  rovingSnakeSpeed?: 'SLOW' | 'NORMAL' | 'FAST';
  rewardCoins: number;
  worldId?: number;
  worldName?: string;
  // Novelty & Special Mechanics
  hasPortals?: boolean;
  portals?: [Point, Point];
  gimmick?:
    | 'NONE'
    | 'PORTAL'
    | 'MAGNET'
    | 'CHILI'
    | 'DRAGON_EGG'
    | 'RAINBOW'
    | 'BOSS'
    | 'BOMB'
    | 'GHOST'
    | 'FOG'
    | 'ICE'
    | 'COLOR_SEQUENCE'
    | 'COLOR_GATE'
    | 'TURN_LIMIT'
    | 'REVERSE'
    | 'KEY_LOCK'
    | 'LIGHTNING';
  isBossLevel?: boolean;
  bossName?: string;
  bossTitle?: string;
  bossAvatar?: string;
  // Specific New Mechanics Properties
  hasBombs?: boolean;
  bombCountdownSeconds?: number;
  hasGhost?: boolean;
  hasFogOfWar?: boolean;
  fogRadius?: number;
  iceTiles?: Point[];
  colorSequence?: ('RED' | 'BLUE' | 'GREEN')[];
  colorGates?: { x: number; y: number; color: 'RED' | 'BLUE' | 'GREEN' }[];
  maxTurns?: number;
  hasReverse?: boolean;
  // Difficulty & Snake Speed Tuning (加快無聊或高壓關卡蛇速，提高挑戰度)
  snakeSpeed?: 'NORMAL' | 'FAST' | 'VERY_FAST' | 'TURBO' | 'EXTREME';
  baseSpeedMs?: number; // 自訂基礎移動間隔毫秒數 (數字愈小愈快)
}

export interface RovingSnake {
  id: string;
  body: Point[];
  direction: Direction;
  speedTicks: number;
  tickCounter: number;
  pattern: 'PATROL_H' | 'PATROL_V' | 'WANDER';
  color: string;
  bodyColor: string;
  glowColor: string;
  headColor: string;
  eyeColor: string;
  name: string;
}

export interface FoodItem {
  position: Point;
  type: FoodType;
  points: number;
  coins: number;
  duration?: number; // for temporary bonus food
  maxDuration?: number;
  bombCountdown?: number; // for ticking bombs
  maxBombCountdown?: number;
  color?: 'RED' | 'BLUE' | 'GREEN';
  id: string;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  alpha: number;
  createdAt: number;
}

export interface SnakeSkin {
  id: string;
  name: string;
  description: string;
  headColor: string;
  bodyColor: string;
  tailColor: string;
  glowColor: string;
  eyeColor: string;
  price: number;
  unlocked: boolean;
}

export interface ArenaTheme {
  id: string;
  name: string;
  description: string;
  bgGradient: [string, string];
  gridColor: string;
  wallColor: string;
  wallGlow: string;
  price: number;
  unlocked: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  claimed?: boolean;
  rewardCoins: number;
  tier?: number; // 1: 1~100關, 2: 101~200關, 3: 201~300關, 4: 301~400關
  requiredStageMin?: number;
}

export type DailyMissionType =
  | 'CHECK_IN'
  | 'PLAY_GAMES'
  | 'EAT_APPLES'
  | 'HIGH_SCORE'
  | 'CLEAR_LEVEL'
  | 'EARN_COINS'
  | 'EAT_GOLDEN'
  | 'COLLECT_SHIELD'
  | 'SNAKE_LENGTH';

export interface DailyMission {
  id: string;
  title: string;
  description: string;
  icon: string;
  progress: number;
  maxProgress: number;
  completed: boolean;
  claimed: boolean;
  rewardCoins: number;
  rewardHearts?: number;
  isCheckIn?: boolean;
  missionType?: DailyMissionType;
  difficultyLevel?: number; // 1 ~ 7 每日難度等級
  difficultyBonusPercent?: number; // 難度加強比例，例如 +25%, +50%
}

export interface PlayerProfile {
  playerName?: string;
  hasCustomUsername?: boolean;
  coins: number;
  totalGames: number;
  totalApples: number;
  hasPlayedClassic?: boolean;
  hasPlayedTimeAttack?: boolean;
  hasPlayedMissions?: boolean;
  classicGamesPlayed?: number;
  timeAttackGamesPlayed?: number;
  missionsGamesPlayed?: number;
  highScores: {
    LEVELS?: number;
    CLASSIC: number;
    TIME_ATTACK: number;
    SURVIVAL: number;
  };
  levelHighScores?: Record<number, number>;
  selectedSkin: string;
  selectedArena: string;
  unlockedSkins: string[];
  unlockedArenas: string[];
  soundEnabled: boolean;
  bgmEnabled?: boolean;
  hapticsEnabled: boolean;
  language?: 'zh-HK' | 'zh-CN' | 'en' | 'ja';
  hasCustomLanguage?: boolean;
  hasCompletedTutorial?: boolean;
  hasClaimedTutorialReward?: boolean;
  controlType: ControlType;
  dpadPosition: 'BOTTOM_CENTER' | 'SPLIT' | 'RIGHT';
  showGrid: boolean;
  unlockedLevel: number;
  lastSelectedLevel?: number;
  completedLevels: number[];
  unlockAllLevels?: boolean;
  hearts: number;
  maxHearts: number;
  lastHeartRefillTimestamp: number;
  lastCheckInDate?: string;
  checkInStreak?: number;
  monthlyCheckIns?: number[];
  checkInMonth?: string;
  dailyMissionsDate?: string;
  dailyMissions?: DailyMission[];
  dailyAdWatchDate?: string;
  dailyAdWatchCount?: number;
  seenItems?: string[];
  batterySaverEnabled?: boolean;
  targetFps?: 30 | 60;
  glowEffectsEnabled?: boolean;
}
