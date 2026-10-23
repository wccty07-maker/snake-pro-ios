import { LevelMission } from '../types';
import { SupportedLanguage } from './i18n';

export type ItemIntroType =
  | 'BLUE'
  | 'GREEN'
  | 'GOLDEN'
  | 'SHIELD'
  | 'PORTAL'
  | 'RAINBOW'
  | 'CHILI'
  | 'MAGNET'
  | 'DRAGON_EGG'
  | 'BOMB'
  | 'GHOST'
  | 'REVERSE'
  | 'GLOW_BERRY'
  | 'KEY'
  | 'ICE'
  | 'COLOR_SEQUENCE'
  | 'COLOR_GATE'
  | 'TURN_LIMIT'
  | 'LIGHTNING';

export interface ItemIntroDefinition {
  id: ItemIntroType;
  name: Record<SupportedLanguage, string>;
  category: Record<SupportedLanguage, string>;
  badge: Record<SupportedLanguage, string>;
  icon: string;
  themeColor: string;
  glowColor: string;
  borderColor: string;
  gradientBg: string;
  statPill: Record<SupportedLanguage, string>;
  description: Record<SupportedLanguage, string>;
  usageTip: Record<SupportedLanguage, string>;
}

export const ITEM_INTRO_DEFINITIONS: Record<ItemIntroType, ItemIntroDefinition> = {
  BLUE: {
    id: 'BLUE',
    name: {
      'zh-HK': '藍色蘋果',
      'zh-CN': '蓝色苹果',
      en: 'Blue Apple',
      ja: '青いリンゴ',
    },
    category: {
      'zh-HK': '能量果實',
      'zh-CN': '能量果实',
      en: 'Energy Fruit',
      ja: 'エネルギー果実',
    },
    badge: {
      'zh-HK': '雙色果實',
      'zh-CN': '双色果实',
      en: 'Special Color',
      ja: 'カラーフルーツ',
    },
    icon: '🔷',
    themeColor: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.5)',
    borderColor: 'border-sky-400/50',
    gradientBg: 'from-sky-500/20 via-blue-600/10 to-transparent',
    statPill: {
      'zh-HK': '⭐ +20 分 · 💰 +2 金幣',
      'zh-CN': '⭐ +20 分 · 💰 +2 金币',
      en: '⭐ +20 Pts · 💰 +2 Coins',
      ja: '⭐ +20 点 · 💰 +2 コイン',
    },
    description: {
      'zh-HK': '晶瑩清涼的藍莓冰晶蘋果！口感清甜爽口，吞食後可獲得 20 分與 2 枚金幣，通常是森之島指定採集目標。',
      'zh-CN': '晶莹清凉的蓝莓冰晶苹果！口感清甜爽口，吞食后可获得 20 分与 2 枚金币，通常是森之岛指定采集目标。',
      en: 'A refreshing blue crystal apple! Gives 20 points & 2 coins upon consumption, essential for world gathering missions.',
      ja: '涼しげに輝くブルーベリーリンゴ！食べると20点とコイン2枚を獲得。森の島の指定収集ターゲット！',
    },
    usageTip: {
      'zh-HK': '注意關卡頂部的目標數量，靈巧走位同時採集不同色彩的蘋果！',
      'zh-CN': '注意关卡顶部的目标数量，灵巧走位同时采集不同色彩的苹果！',
      en: 'Watch the mission objective count at the top to meet clear requirements!',
      ja: '画面上部の目標数を確認し、青リンゴを狙ってルートを組み立てよう！',
    },
  },

  GREEN: {
    id: 'GREEN',
    name: {
      'zh-HK': '青色蘋果',
      'zh-CN': '青色苹果',
      en: 'Green Apple',
      ja: '青リンゴ',
    },
    category: {
      'zh-HK': '能量果實',
      'zh-CN': '能量果实',
      en: 'Energy Fruit',
      ja: 'エネルギー果実',
    },
    badge: {
      'zh-HK': '雙色果實',
      'zh-CN': '双色果实',
      en: 'Special Color',
      ja: 'カラーフルーツ',
    },
    icon: '🍏',
    themeColor: '#4ade80',
    glowColor: 'rgba(74, 222, 128, 0.5)',
    borderColor: 'border-emerald-400/50',
    gradientBg: 'from-emerald-500/20 via-green-600/10 to-transparent',
    statPill: {
      'zh-HK': '⭐ +20 分 · 💰 +2 金幣',
      'zh-CN': '⭐ +20 分 · 💰 +2 金币',
      en: '⭐ +20 Pts · 💰 +2 Coins',
      ja: '⭐ +20 点 · 💰 +2 コイン',
    },
    description: {
      'zh-HK': '翠綠酸甜的薄荷香甜青蘋果！吞食後可獲得 20 分與 2 枚金幣，與藍色蘋果一同登場考驗多色彩收集！',
      'zh-CN': '翠绿酸甜的薄荷香甜青苹果！吞食后可获得 20 分与 2 枚金币，与蓝色苹果一同登场考验多色彩收集！',
      en: 'A crisp sweet mint apple! Grants 20 points and 2 coins, challenging you to collect multiple colors together.',
      ja: '甘酸っぱく爽快なミント風味の青リンゴ！20点とコイン2枚を獲得。複数色集めの基本となる果実！',
    },
    usageTip: {
      'zh-HK': '通常與藍色蘋果及經典紅蘋果交替刷新，規劃最佳路線一網打盡！',
      'zh-CN': '通常与蓝色苹果及经典红苹果交替刷新，规划最佳路线一网打尽！',
      en: 'Spawns alongside blue & red apples. Plan efficient sweeping turns!',
      ja: '青リンゴと赤リンゴが同時に並ぶことも。最短ルートで一網打尽にしよう！',
    },
  },

  GOLDEN: {
    id: 'GOLDEN',
    name: {
      'zh-HK': '金色蘋果',
      'zh-CN': '金色苹果',
      en: 'Golden Apple',
      ja: '金のリンゴ',
    },
    category: {
      'zh-HK': '珍寶果實',
      'zh-CN': '珍宝果实',
      en: 'Rare Fruit',
      ja: 'レア果実',
    },
    badge: {
      'zh-HK': '限時珍寶',
      'zh-CN': '限时珍宝',
      en: 'Time-Limited',
      ja: '限定出現',
    },
    icon: '🍏',
    themeColor: '#fbbf24',
    glowColor: 'rgba(251, 191, 36, 0.6)',
    borderColor: 'border-amber-400/50',
    gradientBg: 'from-amber-500/20 via-yellow-600/10 to-transparent',
    statPill: {
      'zh-HK': '✨ +50 分 · 💰 +5 金幣 · ⏳ 限時倒數',
      'zh-CN': '✨ +50 分 · 💰 +5 金币 · ⏳ 限时倒数',
      en: '✨ +50 Pts · 💰 +5 Coins · ⏳ Timed',
      ja: '✨ +50 点 · 💰 +5 コイン · ⏳ カウントダウン',
    },
    description: {
      'zh-HK': '閃耀黃金神聖光芒的稀有金蘋果！蘊含豐厚能量，吞食可一口氣奪取 50 分高分與 5 枚金幣！',
      'zh-CN': '闪耀黄金神圣光芒的稀有金苹果！蕴含丰厚能量，吞食可一口气夺取 50 分高分与 5 枚金币！',
      en: 'A dazzling golden apple radiating divine energy! Grants a massive 50 points and 5 bonus coins!',
      ja: '黄金の輝きを放つ神秘のリンゴ！圧倒的エネルギーを秘め、一気に50点とコイン5枚を獲得！',
    },
    usageTip: {
      'zh-HK': '金色蘋果在場上會有金色倒數光圈，幾秒後會自動消失，需分秒必爭搶先吞食！',
      'zh-CN': '金色苹果在场上会有金色倒计时光圈，几秒后会自动消失，需分秒必争抢先吞食！',
      en: 'Has a ticking golden countdown ring. Rush over to claim it before it vanishes!',
      ja: '出現後はカウントダウンリングが減少。消滅する前に優先して取りに行こう！',
    },
  },

  SHIELD: {
    id: 'SHIELD',
    name: {
      'zh-HK': '能量護盾',
      'zh-CN': '能量护盾',
      en: 'Energy Shield',
      ja: 'エナジーシールド',
    },
    category: {
      'zh-HK': '保命法球',
      'zh-CN': '保命法球',
      en: 'Protective Aegis',
      ja: '防護オーブ',
    },
    badge: {
      'zh-HK': '保命神技',
      'zh-CN': '保命神技',
      en: 'Invincibility',
      ja: '無敵保護',
    },
    icon: '🛡️',
    themeColor: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.65)',
    borderColor: 'border-cyan-400/50',
    gradientBg: 'from-cyan-500/20 via-sky-600/10 to-transparent',
    statPill: {
      'zh-HK': '🛡️ 4秒防護罩',
      'zh-CN': '🛡️ 4秒防护罩',
      en: '🛡️ 4s Shield',
      ja: '🛡️ 4秒バリア',
    },
    description: {
      'zh-HK': '守護力場法球！拾取後蛇身覆蓋一層幽藍光盾，持續 4 秒。護盾期間可抵擋撞牆、撞障礙物或撞巡邏蛇的致命傷害！',
      'zh-CN': '守护力场法球！拾取后蛇身覆盖一层幽蓝光盾，持续 4 秒。护盾期间可抵挡撞墙、撞障碍物或撞巡逻蛇的致命伤害！',
      en: 'A protective energy aegis! Wraps your snake in a radiant forcefield for 4s, shielding you from deadly wall or enemy impacts!',
      ja: '守護の力場オーブ！獲得すると4秒間ヘビが蒼いバリアをまとい、壁や障害物、敵ヘビの激突死を防ぎます！',
    },
    usageTip: {
      'zh-HK': '護盾生效期間若不慎擦撞危險，會觸發安全轉向反彈，保你不死繼續冒險！',
      'zh-CN': '护盾生效期间若不慎擦撞危险，会触发安全转向反弹，保你不死继续冒险！',
      en: 'When hazard is touched during shield duration, it safely bounces you away instead of game over!',
      ja: 'バリア中に衝突すると、安全な方向へ自動回避。生存率が大幅アップ！',
    },
  },

  PORTAL: {
    id: 'PORTAL',
    name: {
      'zh-HK': '翡翠傳送門',
      'zh-CN': '翡翠传送门',
      en: 'Jade Warp Portals',
      ja: '翡翠のポータル',
    },
    category: {
      'zh-HK': '空間異能',
      'zh-CN': '空间异能',
      en: 'Spatial Warp',
      ja: '空間ワープ',
    },
    badge: {
      'zh-HK': '瞬間躍遷',
      'zh-CN': '瞬间跃迁',
      en: 'Instant Teleport',
      ja: '瞬間移動',
    },
    icon: '🌀',
    themeColor: '#14b8a6',
    glowColor: 'rgba(20, 184, 166, 0.65)',
    borderColor: 'border-teal-400/50',
    gradientBg: 'from-teal-500/20 via-cyan-600/10 to-transparent',
    statPill: {
      'zh-HK': '🌀 雙向互通 · 瞬間跳躍至對向門',
      'zh-CN': '🌀 双向互通 · 瞬间跳跃至对向门',
      en: '🌀 Two-Way · Teleports across gates',
      ja: '🌀 双方向リンク · 対のポータルへ瞬間移動',
    },
    description: {
      'zh-HK': '神秘的翡翠雙向時空傳送門（α 門與 β 門）！當蛇頭進入任一側傳送門，身體將瞬間從對側傳送門穿出，跨越空間！',
      'zh-CN': '神秘的翡翠双向时空传送门（α 门与 β 门）！当蛇头进入任一侧传送门，身体将瞬间从对侧传送门穿出，跨越空间！',
      en: 'Ancient twin spatial portals (α & β)! Entering either portal instantly transports your snake head out of the paired portal!',
      ja: '古代翡翠の双方向ポータル（αとβ）！どちらかに飛び込むと、対になるもう一方のポータルから瞬時に出現！',
    },
    usageTip: {
      'zh-HK': '利用傳送門可以快速擺脫巡邏蛇的夾擊，或在窄道死路時瞬間扭轉戰局，每次穿越計入目標！',
      'zh-CN': '利用传送门可以快速摆脱巡逻蛇的夹击，或在窄道死路时瞬间扭转战局，每次穿越计入目标！',
      en: 'Use portals to escape pinch points or jump straight to distant fruit clusters!',
      ja: '巡回ヘビを撒いたり、行き止まりからの緊急脱出に最適！くぐるたび目標数にカウント！',
    },
  },

  RAINBOW: {
    id: 'RAINBOW',
    name: {
      'zh-HK': '彩虹波波糖',
      'zh-CN': '彩虹波波糖',
      en: 'Rainbow Candy',
      ja: 'レインボーキャンディ',
    },
    category: {
      'zh-HK': '彩虹狂熱',
      'zh-CN': '彩虹狂热',
      en: 'Rainbow Fever',
      ja: 'レインボーフィーバー',
    },
    badge: {
      'zh-HK': '🌈 6秒狂熱 · 2倍積分',
      'zh-CN': '🌈 6秒狂热 · 2倍积分',
      en: '🌈 6s Fever · 2x Score',
      ja: '🌈 6秒フィーバー · 2倍スコア',
    },
    icon: '🍭',
    themeColor: '#ec4899',
    glowColor: 'rgba(236, 72, 153, 0.75)',
    borderColor: 'border-pink-400/50',
    gradientBg: 'from-pink-500/25 via-purple-600/15 to-transparent',
    statPill: {
      'zh-HK': '⭐ +45分 · 💰 +5幣 · 🌈 6秒彩虹狂熱 (2倍積分/金幣 + 萬能穿閘 + 引力磁吸 + 星光護體 + 糖果雨)',
      'zh-CN': '⭐ +45分 · 💰 +5币 · 🌈 6秒彩虹狂热 (2倍积分/金币 + 万能穿闸 + 引力磁吸 + 星光护体 + 糖果雨)',
      en: '⭐ +45 Pts · 💰 +5 Coins · 🌈 6s Rainbow Fever (2x Score/Coins + Wildcard Gates + Magnet + Shield + Candy Rain)',
      ja: '⭐ +45点 · 💰 +5コイン · 🌈 6秒フィーバー (2倍スコア/コイン + 全ゲート通過 + 磁力吸引 + 星光無敵 + 菓子雨)',
    },
    description: {
      'zh-HK': '糖果王國的究極七彩神級甜點！吞食後即刻激活 6 秒「彩虹狂熱」，全場享受 2 倍雙倍積分與金幣、滿級 4 倍連擊鎖定、七彩流光星光護體、甜蜜引力吸附周圍果實、任意色彩閘門萬能通行，並引爆 3 顆甜點糖果雨！',
      'zh-CN': '糖果王国的究极七彩神级甜点！吞食后即刻激活 6 秒“彩虹狂热”，全场享受 2 倍双倍积分与金币、满级 4 倍连击锁定、七彩流光星光护体、甜蜜引力吸附周围果实、任意色彩闸门万能通行，并引爆 3 颗甜点糖果雨！',
      en: 'The ultimate prismatic delicacy! Triggers 6 seconds of Rainbow Fever: grants 2x double score & coins, locks 4x combo, shimmers with invulnerable rainbow light, sweet vacuum pull, passes through ANY color gate, and bursts a sweet candy rain!',
      ja: 'スイーツ王国の究極の虹色キャンディ！食べると6秒間「レインボーフィーバー」が発動！スコアとコインが2倍、4倍コンボ固定、虹色の星光無敵オーラ、周囲の果実を引き寄せる甘い磁力、全カラーゲートの万能通過、そして甘いお菓子の雨を降らせます！',
    },
    usageTip: {
      'zh-HK': '吃下後趁 6 秒彩虹狂熱大膽衝刺！利用甜蜜引力快速收割果實，穿過任何障礙或色彩閘門，享受瘋狂翻倍高分！',
      'zh-CN': '吃下后趁 6 秒彩虹狂热大胆冲刺！利用甜蜜引力快速收割果实，穿过任何障碍或色彩闸门，享受疯狂翻倍高分！',
      en: 'Rush boldly during the 6s Rainbow Fever! Use sweet magnet pull to scoop up fruits, blast through any color barrier, and rack up huge doubled scores!',
      ja: '6秒間のフィーバー中に積極的にダッシュ！甘い磁力でリンゴを一掃し、色付きゲートもそのまま突破して2倍スコアを稼ぎまくろう！',
    },
  },

  CHILI: {
    id: 'CHILI',
    name: {
      'zh-HK': '烈焰辣椒',
      'zh-CN': '烈焰辣椒',
      en: 'Fire Chili',
      ja: '灼熱唐辛子',
    },
    category: {
      'zh-HK': '狂暴衝鋒',
      'zh-CN': '狂暴冲锋',
      en: 'Blazing Rush',
      ja: '猛火ダッシュ',
    },
    badge: {
      'zh-HK': '烈焰無敵',
      'zh-CN': '烈焰无敌',
      en: 'Fire Armor',
      ja: '無敵火炎',
    },
    icon: '🌶️',
    themeColor: '#f97316',
    glowColor: 'rgba(249, 115, 22, 0.7)',
    borderColor: 'border-orange-400/50',
    gradientBg: 'from-orange-500/20 via-red-600/10 to-transparent',
    statPill: {
      'zh-HK': '🔥 5秒烈焰火衣 · 撞穿粉碎障礙',
      'zh-CN': '🔥 5秒烈焰火衣 · 撞穿粉碎障碍',
      en: '🔥 5s Fiery Speed · Smashes through obstacles',
      ja: '🔥 5秒間猛火 · 障害物を突破破壊',
    },
    description: {
      'zh-HK': '熔岩火山口孕育的狂暴火之辣椒！吃下後蛇身披上熾烈火衣，進入 5 秒烈焰無敵衝刺狀態，速度提升且能撞碎前方阻礙！',
      'zh-CN': '熔岩火山口孕育的狂暴火之辣椒！吃下后蛇身披上炽烈火衣，进入 5 秒烈焰无敌冲刺状态，速度提升且能撞碎前方阻碍！',
      en: 'Volcanic lava spice! Ignites your snake in fierce flames for 5s, boosting speed and empowering you to blast through blocks!',
      ja: '火口で育った灼熱の唐辛子！ヘビが5秒間紅蓮の炎をまとい、猛スピードで前方の障害物を粉砕しながら突進！',
    },
    usageTip: {
      'zh-HK': '當前方面對密集的石柱或牆角障礙時，吃下辣椒大膽衝鋒，開闢全新坦途！',
      'zh-CN': '当前面对密集的石柱或墙角障碍时，吃下辣椒大胆冲锋，开辟全新坦途！',
      en: 'Facing dense obstacle clusters? Pop a chili and plow straight through with blazing fury!',
      ja: '障害物だらけの狭いエリアも、唐辛子の炎をまとえば強行突破が可能に！',
    },
  },

  MAGNET: {
    id: 'MAGNET',
    name: {
      'zh-HK': '磁石珍珠',
      'zh-CN': '磁石珍珠',
      en: 'Magnetic Pearl',
      ja: 'マグネット真珠',
    },
    category: {
      'zh-HK': '引力漩渦',
      'zh-CN': '引力漩涡',
      en: 'Gravity Vortex',
      ja: '引力オーラ',
    },
    badge: {
      'zh-HK': '全域吸附',
      'zh-CN': '全域吸附',
      en: 'Auto Magnet',
      ja: '自動吸引',
    },
    icon: '🧲',
    themeColor: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.7)',
    borderColor: 'border-cyan-400/50',
    gradientBg: 'from-cyan-500/20 via-blue-600/10 to-transparent',
    statPill: {
      'zh-HK': '🧲 5秒引力場 · 自動吸附周圍果實',
      'zh-CN': '🧲 5秒引力场 · 自动吸附周围果实',
      en: '🧲 5s Magnet · Pulls nearby fruit automatically',
      ja: '🧲 5秒磁界 · 周囲のリンゴを自動吸引',
    },
    description: {
      'zh-HK': '深海水晶宮的神秘磁力珍珠！吃下後在蛇頭周圍引發強大引力漩渦，在 5 秒內將附近的果實與寶物直接吸入口中！',
      'zh-CN': '深海水晶宫的神秘磁力珍珠！吃下后在蛇头周围引发强大引力漩涡，在 5 秒内将附近的果实与宝物直接吸入口中！',
      en: 'Deep Sea Palace enchanted pearl! Emanates an invisible gravitational field for 5s, pulling nearby fruits straight into your mouth!',
      ja: '深海クリスタル宮に眠る磁力真珠！発動から5秒間、周囲のリンゴやアイテムを強力な磁力で吸い寄せます！',
    },
    usageTip: {
      'zh-HK': '在計時關卡或果實散落在死角時尤為實用，只需路過即可將果實盡收囊中！',
      'zh-CN': '在计时关卡或果实散落在死角时尤为实用，只需路过即可将果实尽收囊中！',
      en: 'Invaluable during tight timers or when fruits spawn in risky corners. Just cruise past to scoop them up!',
      ja: '制限時間ステージや危険な角のリンゴ回収に最適！近くを通り過ぎるだけで楽々ゲット！',
    },
  },

  DRAGON_EGG: {
    id: 'DRAGON_EGG',
    name: {
      'zh-HK': '遠古巨龍蛋',
      'zh-CN': '远古巨龙蛋',
      en: 'Ancient Dragon Egg',
      ja: '古代ドラゴンの卵',
    },
    category: {
      'zh-HK': '遠古重寶',
      'zh-CN': '远古重宝',
      en: 'Ancient Relic',
      ja: '伝説の秘宝',
    },
    badge: {
      'zh-HK': '巨額黃金',
      'zh-CN': '巨额黄金',
      en: 'Super Jackpot',
      ja: '超高額報酬',
    },
    icon: '🥚',
    themeColor: '#f43f5e',
    glowColor: 'rgba(244, 63, 94, 0.7)',
    borderColor: 'border-rose-400/50',
    gradientBg: 'from-rose-500/20 via-pink-600/10 to-transparent',
    statPill: {
      'zh-HK': '⭐ +60 分 · 💰 +35 金幣 · 👑 龍巢極品',
      'zh-CN': '⭐ +60 分 · 💰 +35 金币 · 👑 龙巢极品',
      en: '⭐ +60 Pts · 💰 +35 Coins · 👑 Supreme Bounty',
      ja: '⭐ +60 点 · 💰 +35 コイン · 👑 竜巣の最高峰',
    },
    description: {
      'zh-HK': '遠古巨龍巢穴守護的無價寶蛋！通體流淌赤金龍紋神光，拾取直接獲得 60 分與高達 35 枚大量金幣！',
      'zh-CN': '远古巨龙巢穴守护的无价宝蛋！通体流淌赤金龙纹神光，拾取直接获得 60 分与高达 35 枚大量金币！',
      en: 'The legendary jewel of the Dragon Lair! Gleaming with runic flames, awards an unprecedented 60 points and 35 pure gold coins!',
      ja: '古代竜の巣に鎮座する無価の宝珠！竜紋のオーラを宿し、獲得すると破格の60点とコイン35枚を獲得！',
    },
    usageTip: {
      'zh-HK': '巨龍蛋通常出現在障礙深處或巡邏蛇警戒區域，耐心等待安全時機再出手奪取！',
      'zh-CN': '巨龙蛋通常出现在障碍深处或巡逻蛇警戒区域，耐心等待安全时机再出手夺取！',
      en: 'Frequently guarded by patrolling serpents and narrow crevices. Time your approach carefully!',
      ja: '敵ヘビの巡回ルートや狭い岩壁に現れやすい。隙を見て安全に回収しよう！',
    },
  },

  BOMB: {
    id: 'BOMB',
    name: {
      'zh-HK': '定時炸彈',
      'zh-CN': '定时炸弹',
      en: 'Ticking Bomb',
      ja: '時限爆弾',
    },
    category: {
      'zh-HK': '限時拆彈',
      'zh-CN': '限时拆弹',
      en: 'Blast Hazard',
      ja: '緊急解体',
    },
    badge: {
      'zh-HK': '緊急拆除',
      'zh-CN': '紧急拆除',
      en: 'Defusal Rush',
      ja: '爆破回避',
    },
    icon: '💣',
    themeColor: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.7)',
    borderColor: 'border-red-400/50',
    gradientBg: 'from-red-500/20 via-amber-600/10 to-transparent',
    statPill: {
      'zh-HK': '💣 倒數引爆 · 歸零前必須吃掉拆除！',
      'zh-CN': '💣 倒数引爆 · 归零前必须吃掉拆除！',
      en: '💣 Ticking Fuse · Eat before countdown hits zero!',
      ja: '💣 カウントダウン爆発 · ゼロになる前に食べよ！',
    },
    description: {
      'zh-HK': '危險的引信定時炸彈！頭頂有急速倒數計時，必須在引爆歸零前吃掉它拆除危機，拆彈成功獎勵 40 分與 5 枚金幣！',
      'zh-CN': '危险的引信定时炸弹！头顶有急速倒计时，必须在引爆归零前吃掉它拆除危机，拆弹成功奖励 40 分与 5 枚金币！',
      en: 'A dangerous ticking bomb with an urgent countdown timer! You must swallow it before it detonates, rewarding 40 points and 5 coins!',
      ja: '急速にカウントダウンが進む危険な時限爆弾！爆発する前に食べて解体せよ。成功すると40点とコイン5枚を獲得！',
    },
    usageTip: {
      'zh-HK': '看清炸彈倒數秒數，分秒必爭！一旦看到炸彈應優先規劃直線衝刺拆除！',
      'zh-CN': '看清炸弹倒数秒数，分秒必争！一旦看到炸弹应优先规划直线冲刺拆除！',
      en: 'Prioritize reaching the bomb immediately before the countdown expires to prevent game over!',
      ja: '爆弾が出現したら最優先で回収ルートを組み、素早く解体に向かおう！',
    },
  },

  GHOST: {
    id: 'GHOST',
    name: {
      'zh-HK': '幽靈幻影藥水',
      'zh-CN': '幽灵幻影药水',
      en: 'Phantom Potion',
      ja: 'ゴーストポーション',
    },
    category: {
      'zh-HK': '虛空穿透',
      'zh-CN': '虚空穿透',
      en: 'Ghost Phasing',
      ja: '幻影すり抜け',
    },
    badge: {
      'zh-HK': '穿牆自如',
      'zh-CN': '穿墙自如',
      en: 'Phase Shift',
      ja: '壁透過',
    },
    icon: '👻',
    themeColor: '#c084fc',
    glowColor: 'rgba(192, 132, 252, 0.7)',
    borderColor: 'border-purple-400/50',
    gradientBg: 'from-purple-500/20 via-fuchsia-600/10 to-transparent',
    statPill: {
      'zh-HK': '👻 4秒虛化 · 穿透石牆與自體身軀',
      'zh-CN': '👻 4秒虚化 · 穿透石墙与自体身躯',
      en: '👻 4s Phantom · Phase through solid walls & body',
      ja: '👻 4秒間ゴースト化 · 壁や自身の体をすり抜ける',
    },
    description: {
      'zh-HK': '幽冥沼澤的秘寶藥水！拾取後化身為虛無幻影 4 秒，可直接穿過堅固石牆與自己的蛇身，絕境求生的神級解圍道具！',
      'zh-CN': '幽冥沼泽的秘宝药水！拾取后化身为虚无幻影 4 秒，可以直接穿过坚固石墙与自己的蛇身，绝境求生的神级解围道具！',
      en: 'Enchanted elixir from the shadow marsh! Grants 4 seconds of ghost form, allowing you to slither directly through walls and your own tail!',
      ja: '暗影沼の秘薬！4秒間幽霊化し、硬い石壁や自分自身の体をすり抜けることができる絶体絶命の救済アイテム！',
    },
    usageTip: {
      'zh-HK': '在被死角圍困或密集石牆迷宮中，喝下藥水即可直接穿牆而過，化險為夷！',
      'zh-CN': '在被死角围困或密集石墙迷宫中，喝下药水即可直接穿墙而过，化险为夷！',
      en: 'Use when trapped in narrow dead-ends or dense mazes to phase freely through obstacles!',
      ja: '袋小路に追い込まれた時や迷宮で大活躍！壁を直進してピンチを脱出しよう！',
    },
  },

  REVERSE: {
    id: 'REVERSE',
    name: {
      'zh-HK': '時空逆轉齒輪',
      'zh-CN': '时空逆转齿轮',
      en: 'Reverse Chrono Gear',
      ja: '逆転クロノギア',
    },
    category: {
      'zh-HK': '時空倒流',
      'zh-CN': '时空倒流',
      en: 'Time Reversal',
      ja: '時間反転',
    },
    badge: {
      'zh-HK': '尾首互換',
      'zh-CN': '尾首互换',
      en: 'Tail-to-Head',
      ja: '尾頭チェンジ',
    },
    icon: '⏪',
    themeColor: '#6366f1',
    glowColor: 'rgba(99, 102, 241, 0.7)',
    borderColor: 'border-indigo-400/50',
    gradientBg: 'from-indigo-500/20 via-purple-600/10 to-transparent',
    statPill: {
      'zh-HK': '⏪ 尾變蛇頭 · 瞬間調頭反向疾行',
      'zh-CN': '⏪ 尾变蛇头 · 瞬间调头反向疾行',
      en: '⏪ Instant Reverse · Tail becomes head immediately',
      ja: '⏪ 瞬時に反転 · 尾が頭に変わりバック走行',
    },
    description: {
      'zh-HK': '逆轉時空窟的神秘齒輪！吃下後蛇尾瞬間化為蛇頭，反向調頭行駛！死胡同無路可走時的大逆轉神技！',
      'zh-CN': '逆转时空窟的神秘齿轮！吃下后蛇尾瞬间化为蛇头，反向调头行驶！死胡同无路可走时的大逆转神技！',
      en: 'A miraculous clockwork gear! Instantly flips your tail into your head, slithering backwards to escape tight dead ends!',
      ja: '時空逆転の歯車！食べると瞬時に尾と頭が入れ替わり逆方向に走行！袋小路からの大逆転アイテム！',
    },
    usageTip: {
      'zh-HK': '不小心鑽入死角或被自己蛇身包圍時，吃下齒輪瞬間倒車脫困！',
      'zh-CN': '不小心钻入死角或被自己蛇身包围时，吃下齿轮瞬间倒车脱困！',
      en: 'When stuck facing a solid wall or trapped by your own coils, reverse gear gets you out instantly!',
      ja: '行き止まりに突っ込んだ時や囲まれた時、瞬時に反転脱出しよう！',
    },
  },

  GLOW_BERRY: {
    id: 'GLOW_BERRY',
    name: {
      'zh-HK': '螢光發光莓果',
      'zh-CN': '荧光发光莓果',
      en: 'Luminescent Berry',
      ja: '発光ブルーベリー',
    },
    category: {
      'zh-HK': '黑夜破霧',
      'zh-CN': '黑夜破雾',
      en: 'Fog Piercer',
      ja: '視界確保',
    },
    badge: {
      'zh-HK': '驅散迷霧',
      'zh-CN': '驱散迷雾',
      en: 'Light Up Map',
      ja: '濃霧解除',
    },
    icon: '🫐',
    themeColor: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.7)',
    borderColor: 'border-sky-400/50',
    gradientBg: 'from-sky-500/20 via-blue-600/10 to-transparent',
    statPill: {
      'zh-HK': '🫐 6秒明燈 · 驅散夜霧照亮全場',
      'zh-CN': '🫐 6秒明灯 · 驱散夜雾照亮全场',
      en: '🫐 6s Illumination · Dispels darkness across field',
      ja: '🫐 6秒間発光 · 濃霧を晴らして全体マップ可視化',
    },
    description: {
      'zh-HK': '迷霧幽暗林的奇妙夜光漿果！在漆黑迷霧中，蛇頭周圍視野受限，吃下發光莓果能立即破除迷霧，照亮整個戰場 6 秒！',
      'zh-CN': '迷雾幽暗林的奇妙夜光浆果！在漆黑迷雾中，蛇头周围视野受限，吃下发光莓果能立即破除迷雾，照亮整个战场 6 秒！',
      en: 'A glowing wild berry from the shrouded woods! Dispels pitch-black fog of war for 6 seconds, revealing hidden fruits and roving serpents!',
      ja: '暗闇の森に自生する神秘の発光ベリー！視界が狭い濃霧エリアで食べると、6秒間フィールド全体が明るく照らされます！',
    },
    usageTip: {
      'zh-HK': '在迷霧關卡中看清巡邏蛇位置與隱藏蘋果，搶先規劃安全行進路線！',
      'zh-CN': '在迷雾关卡中看清巡逻蛇位置与隐藏苹果，抢先规划安全行进路线！',
      en: 'Grab glow berries early in dark stages to memorize hazard locations and scout clear routes!',
      ja: '敵ヘビの位置や隠れたリンゴを一目で把握できる貴重な光源！',
    },
  },

  KEY: {
    id: 'KEY',
    name: {
      'zh-HK': '黃金秘庫鑰匙',
      'zh-CN': '黄金秘库钥匙',
      en: 'Golden Vault Key',
      ja: '黄金の宝物庫鍵',
    },
    category: {
      'zh-HK': '機關解鎖',
      'zh-CN': '机关解锁',
      en: 'Mechanism Key',
      ja: '仕掛け解錠',
    },
    badge: {
      'zh-HK': '破障開門 · 秘庫噴寶',
      'zh-CN': '破障开门 · 秘库喷宝',
      en: 'Barrier Breaker & Vault Burst',
      ja: '仕掛け解錠・秘宝解放',
    },
    icon: '🗝️',
    themeColor: '#eab308',
    glowColor: 'rgba(234, 179, 8, 0.7)',
    borderColor: 'border-yellow-400/50',
    gradientBg: 'from-yellow-500/20 via-amber-600/10 to-transparent',
    statPill: {
      'zh-HK': '🔓 炸碎障礙 · 👑 秘庫噴寶 · 🧲 6秒金光磁吸護體',
      'zh-CN': '🔓 炸碎障碍 · 👑 秘库喷宝 · 🧲 6秒金光磁吸护体',
      en: '🔓 Shatters Barriers · 👑 Spawns Vault Treasure · 🧲 6s Golden Aura',
      ja: '🔓 障害破砕 · 👑 秘庫の宝玉出現 · 🧲 6秒間黄金オーラ',
    },
    description: {
      'zh-HK': '密室機關城的純金神鑰！拾取立即解鎖炸碎前方障礙石門、從秘庫召喚金果或巨龍蛋珍寶，並賦予蛇身 6 秒黃金磁吸與無畏破門金鐘罩，獲得 10 枚金幣與時間/步數獎勵！',
      'zh-CN': '密室机关城的纯金神钥！拾取立即解锁炸碎前方障碍石门、从秘库召唤金果或巨龙蛋珍宝，并赋予蛇身 6 秒黄金磁吸与无畏破门金钟罩，获得 10 枚金币与时间/步数奖励！',
      en: 'The sacred golden key! Instantly shatters nearby obstacles, opens the vault to spawn golden apples or dragon eggs, and grants 6s Golden Aura with coin magnet & door-breaker shield!',
      ja: 'からくり宝物庫の純金キー！拾うと付近の障害物を解錠粉砕し、金リンゴや竜の卵を召喚！さらに6秒間黄金オーラをまとい磁力吸引と突進破砕を発動！',
    },
    usageTip: {
      'zh-HK': '拾取鑰匙後把握 6 秒黃金金鐘形態，大膽衝撞石壁破門而入，並利用磁吸快速收割場上秘寶！',
      'zh-CN': '拾取钥匙后把握 6 秒黄金金钟形态，大胆冲撞石壁破门而入，并利用磁吸快速收割场上秘宝！',
      en: 'Make the most of the 6s Golden Aura! Smash straight through obstacle doors and vacuum up the newly spawned vault treasures!',
      ja: '鍵を拾ったら6秒間の黄金オーラをフル活用！障害物を豪快に突破し、出現した秘宝を一気に吸引しよう！',
    },
  },

  ICE: {
    id: 'ICE',
    name: {
      'zh-HK': '極地琉璃滑冰',
      'zh-CN': '极地琉璃滑冰',
      en: 'Glacial Ice Tile',
      ja: '極地ツルツル氷原',
    },
    category: {
      'zh-HK': '地形機制',
      'zh-CN': '地形机制',
      en: 'Terrain Mechanic',
      ja: '地形ギミック',
    },
    badge: {
      'zh-HK': '無摩擦滑行',
      'zh-CN': '无摩擦滑行',
      en: 'Frictionless',
      ja: '滑走注意',
    },
    icon: '❄️',
    themeColor: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.7)',
    borderColor: 'border-cyan-400/50',
    gradientBg: 'from-cyan-500/20 via-sky-600/10 to-transparent',
    statPill: {
      'zh-HK': '❄️ 冰面滑行 · 撞上障礙前無法改變方向',
      'zh-CN': '❄️ 冰面滑行 · 撞上障碍前无法改变方向',
      en: '❄️ Ice Glide · Slides uncontrollably until hitting a wall',
      ja: '❄️ 氷上スライド · 障害物に当たるまで直進',
    },
    description: {
      'zh-HK': '極地冰封原的琉璃滑冰地表！踏上滑冰地塊後，蛇身將沿行進方向一直滑行，直到撞上牆壁或障礙物才會停下，期間無法自由轉彎！',
      'zh-CN': '极地冰封原的琉璃滑冰地表！踏上滑冰地块后，蛇身将沿行进方向一直滑行，直到撞上墙壁或障碍物才会停下，期间无法自由转弯！',
      en: 'Slick glassy ice plains! Stepping onto frozen tiles forces your snake to glide forward continuously until colliding with a wall or obstacle!',
      ja: '摩擦ゼロの凍てつく氷原！氷タイルに乗ると止まらず直進し、壁や障害物に衝突するまで方向転換できません！',
    },
    usageTip: {
      'zh-HK': '進入冰面前務必預判滑行終點的落腳點，避免直線滑向危險邊界或巡邏蛇！',
      'zh-CN': '进入冰面前务必预判滑行终点的落脚点，避免直线滑向危险边界或巡逻蛇！',
      en: 'Plan your trajectory before stepping on ice so you slide safely towards goals without crashing!',
      ja: '氷に乗る前に滑走先の安全を確認し、壁や敵ヘビへの衝突を防ごう！',
    },
  },

  COLOR_SEQUENCE: {
    id: 'COLOR_SEQUENCE',
    name: {
      'zh-HK': '三原色順序',
      'zh-CN': '三原色顺序',
      en: 'RGB Color Sequence',
      ja: '三原色シーケンス',
    },
    category: {
      'zh-HK': '節奏配對',
      'zh-CN': '节奏配对',
      en: 'Rhythm Puzzle',
      ja: 'リズム連鎖',
    },
    badge: {
      'zh-HK': '順序進食',
      'zh-CN': '顺序进食',
      en: 'Strict Order',
      ja: '順番厳守',
    },
    icon: '🎯',
    themeColor: '#d946ef',
    glowColor: 'rgba(217, 70, 239, 0.7)',
    borderColor: 'border-fuchsia-400/50',
    gradientBg: 'from-fuchsia-500/20 via-purple-600/10 to-transparent',
    statPill: {
      'zh-HK': '🎯 紅(🔴)→藍(🔵)→綠(🟢) 指定順序連鎖',
      'zh-CN': '🎯 红(🔴)→蓝(🔵)→绿(🟢) 指定顺序连锁',
      en: '🎯 Red(🔴) -> Blue(🔵) -> Green(🟢) sequence',
      ja: '🎯 赤(🔴)→青(🔵)→緑(🟢) 指定順に捕食',
    },
    description: {
      'zh-HK': '彩虹三稜鏡的色彩機關！頂部指示牌會提示當前需要進食的顏色，必須嚴格按照紅(🔴)→藍(🔵)→綠(🟢)循環順序進食，吃錯顏色會重置進度！',
      'zh-CN': '彩虹三棱镜的色彩机关！顶部指示牌会提示当前需要进食的颜色，必须严格按照红(🔴)→蓝(🔵)→绿(🟢)循环顺序进食，吃错颜色会重置进度！',
      en: 'Prismatic crystal puzzle! Follow the exact color cadence shown at the top. Biting the wrong color apple breaks and resets your streak!',
      ja: '虹色プリズムのパズル！画面上部の指示に従い、赤→青→緑の順にリンゴを食べよう。違う色を食べると連鎖がリセットされます！',
    },
    usageTip: {
      'zh-HK': '看清頂部目標指引的當前高亮色彩，冷靜繞開非當前顏色的果實！',
      'zh-CN': '看清顶部目标指引的当前高亮色彩，冷静绕开非当前颜色的果实！',
      en: 'Observe the highlighted color indicator at the top bar and steer clear of wrong-colored fruit!',
      ja: '上部のカラーガイドをしっかり確認し、違う色のリンゴは迂回しよう！',
    },
  },

  COLOR_GATE: {
    id: 'COLOR_GATE',
    name: {
      'zh-HK': '色彩能量閘門',
      'zh-CN': '色彩能量闸门',
      en: 'Chameleon Color Gate',
      ja: 'カラーゲート',
    },
    category: {
      'zh-HK': '變色龍機關',
      'zh-CN': '变色龙机关',
      en: 'Color Barrier',
      ja: '変色ギミック',
    },
    badge: {
      'zh-HK': '同色通行',
      'zh-CN': '同色通行',
      en: 'Matching Gate',
      ja: '同色通過',
    },
    icon: '🚪',
    themeColor: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.7)',
    borderColor: 'border-emerald-400/50',
    gradientBg: 'from-emerald-500/20 via-teal-600/10 to-transparent',
    statPill: {
      'zh-HK': '🚪 同色穿閘 · 吃對應顏色蘋果變色通過',
      'zh-CN': '🚪 同色穿闸 · 吃对应颜色苹果变色通过',
      en: '🚪 Matching Passage · Eat matching colored apple to pass',
      ja: '🚪 同色通過 · リンゴを食べて変色しゲート突破',
    },
    description: {
      'zh-HK': '七彩色彩閘的守護屏障！吃下紅、藍、青色蘋果後，蛇身會全身變為該顏色，只有全身顏色與能量閘門一致時才可安全通過，否則視為堅固石壁！',
      'zh-CN': '七彩色彩闸的守护屏障！吃下红、蓝、青色苹果后，蛇身会全身变为该颜色，只有全身颜色与能量闸门一致时才可安全通过，否则视为坚固石壁！',
      en: 'Enchanted energy barriers! Eating colored apples transforms your snake body color. You can ONLY pass through energy gates matching your current skin color!',
      ja: '七彩のエネルギー門！食べたリンゴの色（赤・青・緑）に蛇の体が変化し、体と同じ色のゲートのみ通り抜けることができます！',
    },
    usageTip: {
      'zh-HK': '想穿過前方藍色閘門，需先尋找藍色蘋果吃下改變體色！',
      'zh-CN': '想穿过前方蓝色闸门，需先寻找蓝色苹果吃下改变体色！',
      en: 'Need to get through a blue gate? Seek and eat a blue apple first to transform into blue!',
      ja: '青ゲートを通りたい時は、まず青リンゴを食べて変色しよう！',
    },
  },

  TURN_LIMIT: {
    id: 'TURN_LIMIT',
    name: {
      'zh-HK': '限次轉向規則',
      'zh-CN': '限次转向规则',
      en: 'Limited Turn Budget',
      ja: 'ターン回数制限',
    },
    category: {
      'zh-HK': '步數極限',
      'zh-CN': '步数极限',
      en: 'Turn Precision',
      ja: 'エコルート',
    },
    badge: {
      'zh-HK': '步步為營',
      'zh-CN': '步步为营',
      en: 'Minimal Turns',
      ja: '転換節約',
    },
    icon: '🔄',
    themeColor: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.7)',
    borderColor: 'border-amber-400/50',
    gradientBg: 'from-amber-500/20 via-yellow-600/10 to-transparent',
    statPill: {
      'zh-HK': '🔄 轉向預算 · 每次轉角扣減 1 步',
      'zh-CN': '🔄 转向预算 · 每次转角扣减 1 步',
      en: '🔄 Turn Budget · Every turn costs 1 turn budget',
      ja: '🔄 転換制限 · 曲がるたびに残り回数が1減る',
    },
    description: {
      'zh-HK': '步步為營關的極限步數考驗！每次蛇頭轉向都會消耗 1 次轉向次數，次數歸零前必須完成關卡目標，考驗零失誤最佳行進線路！',
      'zh-CN': '步步为营关的极限步数考验！每次蛇头转向都会消耗 1 次转向次数，次数归零前必须完成关卡目标，考验零失误最佳行进线路！',
      en: 'Precision turning challenge! Every direction change decrements your remaining turn count. Complete the mission before your turns hit zero!',
      ja: '無駄のない転換が求められる極限パズル！方向転換するたびに回数が減少し、ゼロになる前に目標を達成しなければなりません！',
    },
    usageTip: {
      'zh-HK': '盡量沿著長直線行進，緊貼邊緣環繞，減少不必要的頻繁轉向！',
      'zh-CN': '尽量沿着长直线行进，紧贴边缘环绕，减少不必要的频繁转向！',
      en: 'Slither along long straight avenues and sweep edges to minimize unnecessary turning!',
      ja: '長い直線走行を意識し、無駄なジグザグ走りを減らして回数を温存しよう！',
    },
  },

  LIGHTNING: {
    id: 'LIGHTNING',
    name: {
      'zh-HK': '電磁超頻核心',
      'zh-CN': '电磁超频核心',
      en: 'Cyber Overclock Core',
      ja: 'サイバー過負荷コア',
    },
    category: {
      'zh-HK': '超光速異能',
      'zh-CN': '超光速异能',
      en: 'Hyper Overclock',
      ja: '超光速ギミック',
    },
    badge: {
      'zh-HK': '⚡ 超導光速 · EMP癱瘓',
      'zh-CN': '⚡ 超导光速 · EMP瘫痪',
      en: '⚡ Hyper-Warp · EMP Shock',
      ja: '⚡ 超光速 · EMP麻痺',
    },
    icon: '⚡',
    themeColor: '#d946ef',
    glowColor: 'rgba(217, 70, 239, 0.85)',
    borderColor: 'border-fuchsia-400/50',
    gradientBg: 'from-fuchsia-500/25 via-cyan-500/20 to-transparent',
    statPill: {
      'zh-HK': '⚡ 5秒極限超頻 (光速狂飆 + EMP全圖癱瘓機械蛇 + 電感引力吸附 + 高壓電弧護甲)',
      'zh-CN': '⚡ 5秒极限超频 (光速狂飙 + EMP全图瘫痪机械蛇 + 电感引力吸附 + 高压电弧护甲)',
      en: '⚡ 5s Hyper Overclock (Sub-light Warp + EMP Drone Stun + Magnetic Vortex + Arc Armor)',
      ja: '⚡ 5秒超光速オーバードライブ (極限光速 + 全敵EMP麻痺 + 磁力吸引 + 高圧電磁アーマー)',
    },
    description: {
      'zh-HK': '賽博城最核心的高壓電磁能量水晶！吞食後即刻引爆 5 秒「電磁超頻」，蛇身直接切換至超導光速狂飆，同時爆發 EMP 電磁脈衝波癱瘓全場巡邏機械蛇，並以強大高壓電磁力場自動吸附周圍果實與享有電弧防撞護體！',
      'zh-CN': '赛博城最核心的高压电磁能量水晶！吞食后即刻引爆 5 秒“电磁超频”，蛇身直接切换至超导光速狂飙，同时爆发 EMP 电磁脉冲波瘫痪全场巡逻机械蛇，并以强大高压电磁力场自动吸附周围果实与享有电弧防撞护体！',
      en: 'The crown jewel reactor of Neon Cyber City! Eating it triggers 5s of Hyper Overclock: boosts movement to blazing warp speed, unleashes an EMP shockwave freezing all drone snakes, magnetizes nearby fruits, and wraps you in electric armor!',
      ja: 'サイバーシティの中枢を司る高圧電磁クリスタル！食べると5秒間「超光速オーバードライブ」が炸裂！驚異の極限速度で駆け抜け、強力なEMPパルスで巡回メカ蛇を完全停止させ、周囲の果実を引き寄せ高圧電磁アーマーで無敵化！',
    },
    usageTip: {
      'zh-HK': '在巡邏機械蛇夾擊或倒計時緊迫時果斷吞食！藉助 EMP 癱瘓與超光速直線狂飆一舉扭轉局勢！',
      'zh-CN': '在巡逻机械蛇夹击或倒计时紧迫时果断吞食！借助 EMP 瘫痪与超光速直线狂飙一举扭转局势！',
      en: 'Pop the Overclock Core when cornered by drone snakes or running low on time! Stun enemies and sweep the field at blistering speed!',
      ja: '敵メカ蛇に囲まれた時や残り時間が少ない時に大活躍！EMPで敵の足を止め、超光速で一気に果実を回収しよう！',
    },
  },
};

/**
 * Returns all special items appearing in a given level mission.
 */
export function getItemsInLevel(level: LevelMission): ItemIntroType[] {
  const items: ItemIntroType[] = [];
  const t = level.targets || {};

  // Color apples
  if (t.blue && t.blue > 0) items.push('BLUE');
  if (t.green && t.green > 0) items.push('GREEN');
  if (t.golden && t.golden > 0) items.push('GOLDEN');
  if (t.shield && t.shield > 0) items.push('SHIELD');

  // Gimmicks & special items
  if ((t.rainbow && t.rainbow > 0) || level.gimmick === 'RAINBOW') items.push('RAINBOW');
  if ((t.chili && t.chili > 0) || level.gimmick === 'CHILI') items.push('CHILI');
  if ((t.magnet && t.magnet > 0) || level.gimmick === 'MAGNET') items.push('MAGNET');
  if ((t.dragonEgg && t.dragonEgg > 0) || level.gimmick === 'DRAGON_EGG') items.push('DRAGON_EGG');
  if ((t.portals && t.portals > 0) || level.hasPortals || level.gimmick === 'PORTAL') items.push('PORTAL');
  if ((t.lightning && t.lightning > 0) || level.gimmick === 'LIGHTNING' || level.worldId === 5) items.push('LIGHTNING');

  // 9 New items and mechanics
  if ((t.bombs && t.bombs > 0) || level.hasBombs || level.gimmick === 'BOMB') items.push('BOMB');
  if (level.hasGhost || level.gimmick === 'GHOST') items.push('GHOST');
  if (level.hasReverse || level.gimmick === 'REVERSE') items.push('REVERSE');
  if (level.hasFogOfWar || level.gimmick === 'FOG') items.push('GLOW_BERRY');
  if ((t.keys && t.keys > 0) || level.gimmick === 'KEY_LOCK') items.push('KEY');
  if ((level.iceTiles && level.iceTiles.length > 0) || level.gimmick === 'ICE') items.push('ICE');
  if ((t.colorSequenceCount && t.colorSequenceCount > 0) || (level.gimmick === 'COLOR_SEQUENCE' && (t.colorSequenceCount ?? 0) > 0)) items.push('COLOR_SEQUENCE');
  if ((level.colorGates && level.colorGates.length > 0) || level.gimmick === 'COLOR_GATE') items.push('COLOR_GATE');
  if (level.maxTurns || level.gimmick === 'TURN_LIMIT') items.push('TURN_LIMIT');

  // Filter unique preserving order
  return Array.from(new Set(items));
}

/**
 * Returns the list of items appearing in the level that have NOT yet been seen by the player.
 */
export function getUnseenItemsInLevel(level: LevelMission, seenItems: string[] = []): ItemIntroType[] {
  const items = getItemsInLevel(level);
  return items.filter((itemKey) => !seenItems.includes(itemKey));
}
