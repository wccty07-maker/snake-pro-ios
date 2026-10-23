import { LevelMission, ObstaclePatternType, Point } from '../types';
import { toSimplifiedChinese } from './toSimplifiedChinese';

export interface WorldInfo {
  id: number;
  name: {
    'zh-HK': string;
    'zh-CN': string;
    en: string;
    ja: string;
  };
  startLevel: number;
  endLevel: number;
  themeColor: string;
  icon: string;
  accentColor: string;
  gimmickName: {
    'zh-HK': string;
    'zh-CN': string;
    en: string;
    ja: string;
  };
  description: {
    'zh-HK': string;
    'zh-CN': string;
    en: string;
    ja: string;
  };
}

export const WORLDS: WorldInfo[] = [
  {
    id: 1,
    name: {
      'zh-HK': '萌新森之島',
      'zh-CN': '萌新森之岛',
      en: 'Starter Forest Isle',
      ja: 'はじまりの森の島',
    },
    startLevel: 1,
    endLevel: 20,
    themeColor: 'from-emerald-500 to-teal-600',
    icon: '🌲',
    accentColor: '#10b981',
    gimmickName: {
      'zh-HK': '萌新試煉 · 森林果實',
      'zh-CN': '萌新试炼 · 森林果实',
      en: 'Starter Trial: Forest Fruit',
      ja: '初心者の試練：森の果実',
    },
    description: {
      'zh-HK': '鬱鬱蔥蔥的初生之森，熟悉走位技巧與多色蘋果！',
      'zh-CN': '郁郁葱葱的初生之森，熟悉走位技巧与多色苹果！',
      en: 'A lush starter forest. Master turns and gather colorful apples!',
      ja: '緑豊かなはじまりの森。ターンを習得し色彩豊かなリンゴを集めよう！',
    },
  },
  {
    id: 2,
    name: {
      'zh-HK': '翡翠石林',
      'zh-CN': '翡翠石林',
      en: 'Jade Stone Grove',
      ja: '翡翠の石林',
    },
    startLevel: 21,
    endLevel: 40,
    themeColor: 'from-teal-500 to-cyan-600',
    icon: '💎',
    accentColor: '#14b8a6',
    gimmickName: {
      'zh-HK': '空間異能 · 翡翠傳送門 🌀',
      'zh-CN': '空间异能 · 翡翠传送门 🌀',
      en: 'Spatial Warp: Jade Portals 🌀',
      ja: '空間ワープ：翡翠のポータル 🌀',
    },
    description: {
      'zh-HK': '古老翡翠巨石陣，穿越時空傳送門在兩端瞬間穿梭！',
      'zh-CN': '古老翡翠巨石阵，穿越时空传送门在两端瞬间穿梭！',
      en: 'Ancient jade monoliths with warp portals connecting opposite sides!',
      ja: '古代の翡翠巨石群。ポータルをくぐり瞬時にワープせよ！',
    },
  },
  {
    id: 3,
    name: {
      'zh-HK': '糖果甜點王國',
      'zh-CN': '糖果甜点王国',
      en: 'Sweet Candy Realm',
      ja: 'スイーツキングダム',
    },
    startLevel: 41,
    endLevel: 60,
    themeColor: 'from-pink-500 to-rose-600',
    icon: '🍬',
    accentColor: '#ec4899',
    gimmickName: {
      'zh-HK': '甜蜜狂歡 · 彩虹波波糖 🍭',
      'zh-CN': '甜蜜狂欢 · 彩虹波波糖 🍭',
      en: 'Sweet Rush: Rainbow Jawbreaker 🍭',
      ja: '甘い祝宴：虹色キャンディ 🍭',
    },
    description: {
      'zh-HK': '滿是馬卡龍與威化餅乾，吃下彩虹糖引發狂暴連擊！',
      'zh-CN': '满是马卡龙与威化饼干，吃下彩虹糖引发狂暴连击！',
      en: 'Delightful wafer walls and sweet rainbow candies with mega combos!',
      ja: 'ウエハースの壁と虹色キャンディ！甘いコンボを決めよう！',
    },
  },
  {
    id: 4,
    name: {
      'zh-HK': '熔岩火山口',
      'zh-CN': '熔岩火山口',
      en: 'Molten Magma Crater',
      ja: 'マグマの火山口',
    },
    startLevel: 61,
    endLevel: 80,
    themeColor: 'from-orange-500 to-red-600',
    icon: '🌋',
    accentColor: '#f97316',
    gimmickName: {
      'zh-HK': '烈焰衝刺 · 火之辣椒 🌶️',
      'zh-CN': '烈焰冲刺 · 火之辣椒 🌶️',
      en: 'Blazing Rush: Fire Chili 🌶️',
      ja: '猛火ダッシュ：灼熱唐辛子 🌶️',
    },
    description: {
      'zh-HK': '滾燙熔岩與黑曜石柱，吃下辣椒獲得烈焰無敵破障衝鋒！',
      'zh-CN': '滚烫熔岩与黑曜石柱，吃下辣椒获得烈焰无敌破障冲锋！',
      en: 'Fiery magma ground and obsidian walls! Fire chili grants blazing rush!',
      ja: '煮えたぎるマグマ地帯！灼熱唐辛子で無敵の猛火ダッシュ！',
    },
  },
  {
    id: 5,
    name: {
      'zh-HK': '霓虹賽博城',
      'zh-CN': '霓虹赛博城',
      en: 'Neon Cyber City',
      ja: 'ネオンサイバーシティ',
    },
    startLevel: 81,
    endLevel: 100,
    themeColor: 'from-fuchsia-500 to-purple-600',
    icon: '⚡',
    accentColor: '#d946ef',
    gimmickName: {
      'zh-HK': '全域超頻 · 電磁核心 ⚡',
      'zh-CN': '全域超频 · 电磁核心 ⚡',
      en: 'Cyber Overclock: Lightning Core ⚡',
      ja: '全域過負荷：閃電コア ⚡',
    },
    description: {
      'zh-HK': '高壓通電霓虹賽博城！全域基準蛇速飆升，吞食電磁超頻核心更引爆超光速曲速、全場 EMP 癱瘓機械蛇與強磁吸附！',
      'zh-CN': '高压通电霓虹赛博城！全域基准蛇速飙升，吞食电磁超频核心更引爆超光速曲速、全场 EMP 瘫痪机械蛇与强磁吸附！',
      en: 'High-voltage Neon Cyber City! Global baseline speed boosted. Overclock core unleashes warp speed, EMP drone stun, and magnetic pulls!',
      ja: '高電圧ネオンサイバー都市！全域基準速度が極速へ昇格。過負荷コアで超光速疾走、全敵EMP麻痺、磁力吸引を発動！',
    },
  },
  {
    id: 6,
    name: {
      'zh-HK': '幽冥暗影沼',
      'zh-CN': '幽冥暗影沼',
      en: 'Shadow Phantom Marsh',
      ja: '幽冥の暗影沼',
    },
    startLevel: 101,
    endLevel: 120,
    themeColor: 'from-purple-600 to-indigo-700',
    icon: '👻',
    accentColor: '#9333ea',
    gimmickName: {
      'zh-HK': '幽靈穿透 · 虛空幻影 👻',
      'zh-CN': '幽灵穿透 · 虚空幻影 👻',
      en: 'Ghost Mode: Phantom Phase 👻',
      ja: 'ゴーストモード：幻影すり抜け 👻',
    },
    description: {
      'zh-HK': '拾取幽靈幻影藥水，化身虛靈穿透身體與普通石牆！',
      'zh-CN': '拾取幽灵幻影药水，化身虚灵穿透身体与普通石墙！',
      en: 'Ghostly phantom potion allows passing through your own body and walls!',
      ja: '幽霊ポーションで自身の身体や石壁をすり抜けろ！',
    },
  },
  {
    id: 7,
    name: {
      'zh-HK': '深海水晶宮',
      'zh-CN': '深海水晶宫',
      en: 'Deep Sea Palace',
      ja: '深海クリスタル宮',
    },
    startLevel: 121,
    endLevel: 140,
    themeColor: 'from-blue-500 to-sky-600',
    icon: '🌊',
    accentColor: '#0ea5e9',
    gimmickName: {
      'zh-HK': '深海珍珠 · 磁吸漩渦 🧲',
      'zh-CN': '深海珍珠 · 磁吸漩涡 🧲',
      en: 'Ocean Pearl: Magnetic Whirlpool 🧲',
      ja: '深海の真珠：マグネット大渦 🧲',
    },
    description: {
      'zh-HK': '碧藍海底與晶瑩珊瑚，拾取磁石珍珠自動引力吸取周圍果實！',
      'zh-CN': '碧蓝海底与晶莹珊瑚，拾取磁石珍珠自动引力吸取周围果实！',
      en: 'Aquatic depths! Magnetic ocean pearls draw nearby fruit into your path!',
      ja: '神秘の海底宮殿！磁石真珠で周囲のリンゴを一気に引き寄せろ！',
    },
  },
  {
    id: 8,
    name: {
      'zh-HK': '極地冰封原',
      'zh-CN': '极地冰封原',
      en: 'Glacial Ice Tundra',
      ja: '極地氷結ツンドラ',
    },
    startLevel: 141,
    endLevel: 160,
    themeColor: 'from-cyan-400 to-blue-500',
    icon: '❄️',
    accentColor: '#38bdf8',
    gimmickName: {
      'zh-HK': '極速滑冰 · 冰面滑行 ❄️',
      'zh-CN': '极速滑冰 · 冰面滑行 ❄️',
      en: 'Ice Glaze: Slippery Floor ❄️',
      ja: 'ツルツル氷原：スライディング ❄️',
    },
    description: {
      'zh-HK': '踩上滑冰地面會一直滑行直至碰撞，考驗路線精準預判！',
      'zh-CN': '踩上滑冰地面会一直滑行直至碰撞，考验路线精准预判！',
      en: 'Stepping on ice tiles slides you forward uncontrollably until stopping!',
      ja: '氷の床に乗ると直進スライド！進行ルートを先読みせよ！',
    },
  },
  {
    id: 9,
    name: {
      'zh-HK': '迷霧幽暗林',
      'zh-CN': '迷雾幽暗林',
      en: 'Foggy Shrouded Woods',
      ja: '濃霧の薄暗き森',
    },
    startLevel: 161,
    endLevel: 180,
    themeColor: 'from-slate-700 to-zinc-900',
    icon: '🌫️',
    accentColor: '#a1a1aa',
    gimmickName: {
      'zh-HK': '夜間迷霧 · 發光果照亮 🫐',
      'zh-CN': '夜间迷雾 · 发光果照亮 🫐',
      en: 'Fog of War: Glow Berry 🫐',
      ja: '濃霧の戦場：発光ベリー 🫐',
    },
    description: {
      'zh-HK': '黑夜迷霧籠罩，只有蛇頭周圍可見，吃發光豆照亮迷宮！',
      'zh-CN': '黑夜迷雾笼罩，只有蛇头周围可见，吃发光豆照亮迷宫！',
      en: 'Pitch black darkness except around the snake head! Glow berries shed light!',
      ja: '視界ゼロの濃霧！蛇の周囲と発光ベリーの光を頼りに進め！',
    },
  },
  {
    id: 10,
    name: {
      'zh-HK': '爆破工程區',
      'zh-CN': '爆破工程区',
      en: 'Demolition Blast Site',
      ja: '爆破工区エリア',
    },
    startLevel: 181,
    endLevel: 200,
    themeColor: 'from-amber-600 to-red-700',
    icon: '💣',
    accentColor: '#ef4444',
    gimmickName: {
      'zh-HK': '限時拆彈 · 倒數引爆 💣',
      'zh-CN': '限时拆弹 · 倒数引爆 💣',
      en: 'Bomb Defusal: Ticking Timebomb 💣',
      ja: '時限爆弾：緊急解体 💣',
    },
    description: {
      'zh-HK': '定時炸彈急速倒數！必須在引爆歸零前吃掉它拆除危機！',
      'zh-CN': '定时炸弹急速倒数！必须在引爆归零前吃掉它拆除危机！',
      en: 'Ticking timebombs spawn on the field! Defuse them before zero or game over!',
      ja: 'カウントダウン爆弾が出現！爆発する前に素早く解体せよ！',
    },
  },
  {
    id: 11,
    name: {
      'zh-HK': '彩虹三稜鏡',
      'zh-CN': '彩虹三棱镜',
      en: 'Prismatic Mirror Realm',
      ja: '虹色プリズム界',
    },
    startLevel: 201,
    endLevel: 220,
    themeColor: 'from-violet-500 to-fuchsia-600',
    icon: '🌈',
    accentColor: '#a855f7',
    gimmickName: {
      'zh-HK': '顏色順序 · 節奏配對 🎯',
      'zh-CN': '颜色顺序 · 节奏配对 🎯',
      en: 'RGB Sequence: Ordered Bites 🎯',
      ja: 'カラー順序：シーケンス連鎖 🎯',
    },
    description: {
      'zh-HK': '按特定紅綠藍順序進食，解開七彩水晶陣，獲高額加成！',
      'zh-CN': '按特定红绿蓝顺序进食，解开七彩水晶阵，获高额加成！',
      en: 'Follow strict color sequences (Red -> Green -> Blue) to solve the prism!',
      ja: '指定された色順（赤・緑・青）にリンゴを食べてパズルを解け！',
    },
  },
  {
    id: 12,
    name: {
      'zh-HK': '七彩色彩閘',
      'zh-CN': '七彩色彩闸',
      en: 'Chameleon Gate Citadel',
      ja: 'カメレオンゲート城',
    },
    startLevel: 221,
    endLevel: 240,
    themeColor: 'from-emerald-600 to-sky-700',
    icon: '🎨',
    accentColor: '#10b981',
    gimmickName: {
      'zh-HK': '繽紛果園 · 彩虹靈果 🌈',
      'zh-CN': '缤纷果园 · 彩虹灵果 🌈',
      en: 'Rainbow Fruit Sanctuary 🌈',
      ja: '虹色フルーツサンクチュアリ 🌈',
    },
    description: {
      'zh-HK': '採集紅、藍、青各色珍稀靈果，享受無拘無束的果園盛宴！',
      'zh-CN': '采集红、蓝、青各色珍稀灵果，享受无拘无束的果园盛宴！',
      en: 'Harvest rare fruits across red, blue, and green in a vibrant feast!',
      ja: '赤・青・緑の色とりどりの果実を集めてフルーツの祝宴を楽しもう！',
    },
  },
  {
    id: 13,
    name: {
      'zh-HK': '步步為營關',
      'zh-CN': '步步为营关',
      en: 'Turn Limit Precision Zone',
      ja: 'ターン制限の聖域',
    },
    startLevel: 241,
    endLevel: 260,
    themeColor: 'from-amber-500 to-yellow-600',
    icon: '🔄',
    accentColor: '#f59e0b',
    gimmickName: {
      'zh-HK': '極限步數 · 限次轉向 📐',
      'zh-CN': '极限步数 · 限次转向 📐',
      en: 'Turn Budget: Limited Turns 📐',
      ja: '転換回数制限：エコルート 📐',
    },
    description: {
      'zh-HK': '限制蛇頭轉向次數！步步為營精打細算，零失誤規劃最佳路線！',
      'zh-CN': '限制蛇头转向次数！步步为营精打细算，零失误规划最佳路线！',
      en: 'Strict turn limits! Every direction turn counts down towards zero!',
      ja: 'ターンの回数に厳しい上限！無駄な転換を省き最短で獲物を狙え！',
    },
  },
  {
    id: 14,
    name: {
      'zh-HK': '逆轉時空窟',
      'zh-CN': '逆转时空窟',
      en: 'Chrono Reverse Cavern',
      ja: '時間逆転の洞窟',
    },
    startLevel: 261,
    endLevel: 280,
    themeColor: 'from-indigo-600 to-purple-800',
    icon: '⏪',
    accentColor: '#6366f1',
    gimmickName: {
      'zh-HK': '倒後逆轉 · 尾變蛇頭 ⏪',
      'zh-CN': '倒后逆转 · 尾变蛇头 ⏪',
      en: 'Reverse Gear: Tail to Head ⏪',
      ja: 'バック走行：尾頭反転 ⏪',
    },
    description: {
      'zh-HK': '拾取逆轉齒輪，蛇尾瞬間化為蛇頭反向行駛，絕境求生神技！',
      'zh-CN': '拾取逆转齿轮，蛇尾瞬间化为蛇头反向行驶，绝境求生神技！',
      en: 'Reverse gear flips tail into head instantaneously to escape dead-ends!',
      ja: '逆転ギアで尾が頭に入れ替わり反転走行！袋小路からの大逆転！',
    },
  },
  {
    id: 15,
    name: {
      'zh-HK': '密室機關城',
      'zh-CN': '密室机关城',
      en: 'Key & Lock Vault Maze',
      ja: 'からくり宝物庫',
    },
    startLevel: 281,
    endLevel: 300,
    themeColor: 'from-yellow-600 to-amber-700',
    icon: '🗝️',
    accentColor: '#eab308',
    gimmickName: {
      'zh-HK': '機關鑰匙 · 秘庫解鎖 🗝️',
      'zh-CN': '机关钥匙 · 秘库解锁 🗝️',
      en: 'Vault Keys: Lock Mechanisms 🗝️',
      ja: '鍵と仕掛け扉：秘庫解放 🗝️',
    },
    description: {
      'zh-HK': '撿起金光鑰匙打開封閉閘門，深入寶庫掠奪終極龍幣！',
      'zh-CN': '捡起金光钥匙打开封闭闸门，深入宝库掠夺终极龙币！',
      en: 'Collect gold keys to open locked barriers and claim inner treasure vaults!',
      ja: '鍵を回収してロックされた門を開き、秘蔵の財宝を勝ち取れ！',
    },
  },
  {
    id: 16,
    name: {
      'zh-HK': '浮空天宮',
      'zh-CN': '浮空天宫',
      en: 'Celestial Sky Citadel',
      ja: '天空の神殿城',
    },
    startLevel: 301,
    endLevel: 320,
    themeColor: 'from-sky-500 to-indigo-600',
    icon: '☁️',
    accentColor: '#38bdf8',
    gimmickName: {
      'zh-HK': '天宮躍遷 · 雙門滑冰 🌀❄️',
      'zh-CN': '天宫跃迁 · 双门滑冰 🌀❄️',
      en: 'Sky Warp: Portals & Ice 🌀❄️',
      ja: '天空ワープ：氷原ポータル 🌀❄️',
    },
    description: {
      'zh-HK': '雲端高空神殿！雙重傳送門與極地滑冰地表結合，身法極限！',
      'zh-CN': '云端高空神殿！双重传送门与极地滑冰地表结合，身法极限！',
      en: 'Twin portals combined with frictionless ice plains high in the skies!',
      ja: '天空の浮遊神殿。ワープポータルと氷原スライディングの超高難度融合！',
    },
  },
  {
    id: 17,
    name: {
      'zh-HK': '暗夜拆彈營',
      'zh-CN': '暗夜拆弹营',
      en: 'Midnight Bomb Camp',
      ja: '深夜の爆弾解体戦',
    },
    startLevel: 321,
    endLevel: 340,
    themeColor: 'from-zinc-800 to-red-950',
    icon: '💣',
    accentColor: '#f43f5e',
    gimmickName: {
      'zh-HK': '迷霧暗影 · 限時拆彈 🌫️💣',
      'zh-CN': '迷雾暗影 · 限时拆弹 🌫️💣',
      en: 'Foggy Demolition: Night Bombs 🌫️💣',
      ja: '濃霧爆破：暗夜の解体作戦 🌫️💣',
    },
    description: {
      'zh-HK': '伸手不見五指的迷霧中，急促嘀嗒聲響起！靠記憶盲摸拆彈！',
      'zh-CN': '伸手不见五指的迷雾中，急促嘀嗒声响起！靠记忆盲摸拆弹！',
      en: 'Pitch black fog of war with ticking bombs! Rely on glow berries to survive!',
      ja: '暗黒の濃霧に響くカウント音！発光ベリーで位置を暴き爆弾を止めろ！',
    },
  },
  {
    id: 18,
    name: {
      'zh-HK': '幽靈逆轉殿',
      'zh-CN': '幽灵逆转殿',
      en: 'Phantom Reverse Palace',
      ja: '幻影逆走の魔宮',
    },
    startLevel: 341,
    endLevel: 360,
    themeColor: 'from-fuchsia-700 to-purple-900',
    icon: '👻',
    accentColor: '#c084fc',
    gimmickName: {
      'zh-HK': '虛靈漫步 · 逆轉倒車 👻⏪',
      'zh-CN': '虚灵漫步 · 逆转倒车 👻⏪',
      en: 'Ghost Phase: Reverse Turn 👻⏪',
      ja: '幽霊反転：フェーズバック 👻⏪',
    },
    description: {
      'zh-HK': '幽靈穿牆與倒後檔雙重加持，在限次轉向的超絕迷陣中破局！',
      'zh-CN': '幽灵穿墙与倒后档双重加持，在限次转向的超绝迷阵中破局！',
      en: 'Combine ghost pass-through and reverse gears under tight turn limits!',
      ja: 'すり抜け幽霊と反転ギアを併用し、最小ターンで究極の脱出を図れ！',
    },
  },
  {
    id: 19,
    name: {
      'zh-HK': '遠古巨龍巢',
      'zh-CN': '远古巨龙巢',
      en: 'Ancient Dragon Hoard',
      ja: '古代竜の宝物巣',
    },
    startLevel: 361,
    endLevel: 380,
    themeColor: 'from-rose-600 to-amber-700',
    icon: '🐲',
    accentColor: '#e11d48',
    gimmickName: {
      'zh-HK': '巨龍炎獄 · 色彩門禁 🐲🥚🎨',
      'zh-CN': '巨龙炎狱 · 色彩门禁 🐲🥚🎨',
      en: 'Dragon Eggs: Flame & Gate 🐲🥚🎨',
      ja: '竜炎の巣：ドラゴンの卵 🐲🥚🎨',
    },
    description: {
      'zh-HK': '凶暴古龍盤踞！吃辣椒化身無敵火龍，破開彩閘搶奪遠古龍蛋！',
      'zh-CN': '凶暴古龙盘踞！吃辣椒化身无敌火龙，破开彩闸抢夺远古龙蛋！',
      en: 'Ferocious dragons guard golden eggs! Flame chili and color gates collide!',
      ja: '凶悪なドラゴンが支配する巣窟！炎のダッシュと色彩ゲートを突破せよ！',
    },
  },
  {
    id: 20,
    name: {
      'zh-HK': '諸神創世星殿',
      'zh-CN': '诸神创世星殿',
      en: 'Cosmic Genesis Peak',
      ja: '諸神の創世星殿',
    },
    startLevel: 381,
    endLevel: 400,
    themeColor: 'from-amber-400 via-purple-600 to-slate-950',
    icon: '🌟',
    accentColor: '#fbbf24',
    gimmickName: {
      'zh-HK': '創世星神 · 400關總決戰 👑',
      'zh-CN': '创世星神 · 400关总决战 👑',
      en: 'Genesis Overlord: Supreme 400 👑',
      ja: '創世神龍：400ステージ総決戦 👑',
    },
    description: {
      'zh-HK': '全遊戲400關終極巔峰總決戰！全機制全要素交織，成就傳奇！',
      'zh-CN': '全游戏400关终极巅峰总决战！全机制全要素交织，成就传奇！',
      en: 'The grand climax at stage 400! Every mechanic tested against the Supreme Creator!',
      ja: '全400ステージの究極天王山！全ギミックが炸裂する創世神話の頂点！',
    },
  },
];

export const getWorldByLevelId = (levelId: number): WorldInfo => {
  const found = WORLDS.find((w) => levelId >= w.startLevel && levelId <= w.endLevel);
  return found || WORLDS[0];
};

// 40 Handcrafted Boss Definitions (Every 10 levels up to 400)
export interface BossDefinition {
  levelId: number;
  bossName: { 'zh-HK': string; 'zh-CN': string; en: string; ja: string };
  bossTitle: { 'zh-HK': string; 'zh-CN': string; en: string; ja: string };
  bossAvatar: string;
  speed: 'SLOW' | 'NORMAL' | 'FAST';
  rovingCount: number;
  obstacleType: ObstaclePatternType;
}

export const BOSS_DEFINITIONS: Record<number, BossDefinition> = {
  10: {
    levelId: 10,
    bossName: { 'zh-HK': '翡翠藤蔓巨蟒', 'zh-CN': '翡翠藤蔓巨蟒', en: 'Jade Vine Python', ja: '翡翠ツル大蛇' },
    bossTitle: { 'zh-HK': '萌新森林守護長', 'zh-CN': '萌新森林守护长', en: 'Starter Forest Guardian', ja: '森の番人' },
    bossAvatar: '🐍',
    speed: 'NORMAL',
    rovingCount: 1,
    obstacleType: 'PILLARS',
  },
  20: {
    levelId: 20,
    bossName: { 'zh-HK': '碧玉千鱗石龍', 'zh-CN': '碧玉千鳞石龙', en: 'Jade Scale Wyrm', ja: '碧玉の石鱗竜' },
    bossTitle: { 'zh-HK': '翡翠石林霸主', 'zh-CN': '翡翠石林霸主', en: 'Jade Grove Overlord', ja: '翡翠石林の覇者' },
    bossAvatar: '🐉',
    speed: 'NORMAL',
    rovingCount: 2,
    obstacleType: 'PORTAL_GATE',
  },
  30: {
    levelId: 30,
    bossName: { 'zh-HK': '糖霜泡芙棉花蟒', 'zh-CN': '糖霜泡芙棉花蟒', en: 'Frosted Puff Boa', ja: 'シュガーパフボア' },
    bossTitle: { 'zh-HK': '甜點王國巡守先鋒', 'zh-CN': '甜点王国巡守先锋', en: 'Sweet Candy Vanguard', ja: 'お菓子の先鋒' },
    bossAvatar: '🧁',
    speed: 'NORMAL',
    rovingCount: 1,
    obstacleType: 'BOX',
  },
  40: {
    levelId: 40,
    bossName: { 'zh-HK': '彩虹太妃巨龍', 'zh-CN': '彩虹太妃巨龙', en: 'Rainbow Toffee Dragon', ja: '虹色タフィードラゴン' },
    bossTitle: { 'zh-HK': '糖果世界大君', 'zh-CN': '糖果世界大君', en: 'Sweet Kingdom Sovereign', ja: 'スイーツ帝王' },
    bossAvatar: '🍭',
    speed: 'NORMAL',
    rovingCount: 2,
    obstacleType: 'MAZE',
  },
  50: {
    levelId: 50,
    bossName: { 'zh-HK': '地心赤炎巨蜥', 'zh-CN': '地心赤炎巨蜥', en: 'Core Magma Serpent', ja: '地底マグマオオトカゲ' },
    bossTitle: { 'zh-HK': '火山口熔岩先鋒', 'zh-CN': '火山口熔岩先锋', en: 'Crater Molten Vanguard', ja: '火口の猛獣' },
    bossAvatar: '🦎',
    speed: 'FAST',
    rovingCount: 2,
    obstacleType: 'VOLCANO_RIM',
  },
  60: {
    levelId: 60,
    bossName: { 'zh-HK': '烈焰熔火暴君蟒', 'zh-CN': '烈焰熔火暴君蟒', en: 'Infernal Magma Tyrant', ja: '灼熱熔岩の暴君蛇' },
    bossTitle: { 'zh-HK': '火山口終極炎魔', 'zh-CN': '火山口终极炎魔', en: 'Magma Crater Overlord', ja: '火山口の炎魔王' },
    bossAvatar: '🔥',
    speed: 'FAST',
    rovingCount: 2,
    obstacleType: 'CASTLE',
  },
  70: {
    levelId: 70,
    bossName: { 'zh-HK': '地心熔火守護蜥', 'zh-CN': '地心熔火守护蜥', en: 'Magma Core Lizard', ja: '地底熔火トカゲ' },
    bossTitle: { 'zh-HK': '火山口熔岩巡守長', 'zh-CN': '火山口熔岩巡守长', en: 'Crater Lava Commander', ja: '火口の守護将' },
    bossAvatar: '🦎',
    speed: 'FAST',
    rovingCount: 2,
    obstacleType: 'VOLCANO_RIM',
  },
  80: {
    levelId: 80,
    bossName: { 'zh-HK': '烈焰熔火暴君蟒', 'zh-CN': '烈焰熔火暴君蟒', en: 'Infernal Magma Tyrant', ja: '灼熱熔岩の暴君蛇' },
    bossTitle: { 'zh-HK': '火山口終極炎魔 · ⏳40秒限時', 'zh-CN': '火山口终极炎魔 · ⏳40秒限时', en: 'Magma Overlord · 40s Rush', ja: '火口の炎魔王 · 40秒勝負' },
    bossAvatar: '🔥',
    speed: 'FAST',
    rovingCount: 2,
    obstacleType: 'CASTLE',
  },
  90: {
    levelId: 90,
    bossName: { 'zh-HK': '量子駭客機械蛇 ⚡', 'zh-CN': '量子骇客机械蛇 ⚡', en: 'Quantum Cyber Drone ⚡', ja: '量子ハッカーメカ蛇 ⚡' },
    bossTitle: { 'zh-HK': '賽博高壓巡檢先鋒', 'zh-CN': '赛博高压巡检先锋', en: 'Cyber Grid Commander', ja: 'サイバー指揮官' },
    bossAvatar: '🤖',
    speed: 'FAST',
    rovingCount: 2,
    obstacleType: 'CYBER_CIRCUIT',
  },
  100: {
    levelId: 100,
    bossName: { 'zh-HK': '霓虹暴走機械主腦 👑⚡', 'zh-CN': '霓虹暴走机械主脑 👑⚡', en: 'Overclock Cyber Core 👑⚡', ja: 'ネオン暴走メインフレーム 👑⚡' },
    bossTitle: { 'zh-HK': '賽博數碼界終極霸主 · ⏳50秒限時', 'zh-CN': '赛博数码界终极霸主 · ⏳50秒限时', en: 'Cyber Mainframe Sovereign · 50s Rush', ja: 'サイバー終極覇王 · 50秒勝負' },
    bossAvatar: '⚡',
    speed: 'FAST',
    rovingCount: 2,
    obstacleType: 'CHECKERBOARD',
  },
  110: {
    levelId: 110,
    bossName: { 'zh-HK': '噬魂暗夜幽靈蟒 👻', 'zh-CN': '噬魂暗夜幽灵蟒 👻', en: 'Soul Eater Shadow Wyrm 👻', ja: '魂喰らう暗影大蛇 👻' },
    bossTitle: { 'zh-HK': '幽靈沼澤巡獵者', 'zh-CN': '幽灵沼泽巡猎者', en: 'Phantom Marsh Stalker', ja: '暗沼の狩人' },
    bossAvatar: '👻',
    speed: 'FAST',
    rovingCount: 2,
    obstacleType: 'SCATTERED',
  },
  120: {
    levelId: 120,
    bossName: { 'zh-HK': '虛空幽冥冥王蛇 👑🔮', 'zh-CN': '虚空幽冥冥王蛇 👑🔮', en: 'Nether Void Sovereign 👑🔮', ja: '虚空の冥府大蛇 👑🔮' },
    bossTitle: { 'zh-HK': '暗影幽境大領主 · 幽靈終決戰', 'zh-CN': '暗影幽境大领主 · 幽灵终决战', en: 'Shadow Realm Overlord', ja: '暗影沼の支配者' },
    bossAvatar: '🔮',
    speed: 'FAST',
    rovingCount: 2,
    obstacleType: 'SPIRAL',
  },
  130: {
    levelId: 130,
    bossName: { 'zh-HK': '深淵潮汐海妖蛇 🧜', 'zh-CN': '深渊潮汐海妖蛇 🧜', en: 'Abyssal Tidal Siren 🧜', ja: '深淵潮汐の海妖蛇 🧜' },
    bossTitle: { 'zh-HK': '深海珍珠守衛將軍', 'zh-CN': '深海珍珠守卫将军', en: 'Deep Sea Pearl General', ja: '深海の守護将' },
    bossAvatar: '🧜',
    speed: 'FAST',
    rovingCount: 2,
    obstacleType: 'CORAL_REEF',
  },
  140: {
    levelId: 140,
    bossName: { 'zh-HK': '滄海水晶利維坦 👑🌊', 'zh-CN': '沧海水晶利维坦 👑🌊', en: 'Crystal Leviathan 👑🌊', ja: '水晶のリヴァイアサン 👑🌊' },
    bossTitle: { 'zh-HK': '水晶宮殿至尊龍皇 · 磁吸終決戰', 'zh-CN': '水晶宫殿至尊龙皇 · 磁吸终决战', en: 'Deep Ocean Sovereign', ja: '深海竜皇' },
    bossAvatar: '🌊',
    speed: 'FAST',
    rovingCount: 2,
    obstacleType: 'HOURGLASS',
  },
  150: {
    levelId: 150,
    bossName: { 'zh-HK': '極地暴雪霜狼蛇 🐺', 'zh-CN': '极地暴雪霜狼蛇 🐺', en: 'Blizzard Frost Wyrm 🐺', ja: '極地吹雪の氷蛇 🐺' },
    bossTitle: { 'zh-HK': '冰原先遣掠奪者', 'zh-CN': '冰原先遣掠夺者', en: 'Glacial Scout Raider', ja: '氷原の先遣隊' },
    bossAvatar: '🐺',
    speed: 'FAST',
    rovingCount: 2,
    obstacleType: 'TWIN_BRIDGES',
  },
  160: {
    levelId: 160,
    bossName: { 'zh-HK': '千載玄冰冰霜巨龍 👑❄️', 'zh-CN': '千载玄冰冰霜巨龙 👑❄️', en: 'Glacial Frost Drake 👑❄️', ja: '永久凍土の氷霜巨竜 👑❄️' },
    bossTitle: { 'zh-HK': '極地冰封原大霸主 · 滑冰終決戰', 'zh-CN': '极地冰封原大霸主 · 滑冰终决战', en: 'Glacial Tundra Monarch', ja: '極地ツンドラの氷王' },
    bossAvatar: '❄️',
    speed: 'FAST',
    rovingCount: 2,
    obstacleType: 'DIAMOND',
  },
  170: {
    levelId: 170,
    bossName: { 'zh-HK': '幽林迷霧蝙蝠蛇 🦇', 'zh-CN': '幽林迷雾蝙蝠蛇 🦇', en: 'Fogwood Nightwing 🦇', ja: '迷霧の暗視夜翼蛇 🦇' },
    bossTitle: { 'zh-HK': '夜間迷霧巡行先鋒', 'zh-CN': '夜间迷雾巡行先锋', en: 'Fog Patrol Vanguard', ja: '濃霧の斥候' },
    bossAvatar: '🦇',
    speed: 'FAST',
    rovingCount: 2,
    obstacleType: 'CORRIDOR',
  },
  180: {
    levelId: 180,
    bossName: { 'zh-HK': '暗夜迷霧古樹蛇靈 👑🌫️', 'zh-CN': '暗夜迷雾古树蛇灵 👑🌫️', en: 'Elder Fogwood Treant 👑🌫️', ja: '古樹の暗夜迷霧霊 👑🌫️' },
    bossTitle: { 'zh-HK': '幽暗林深處守護神 · 迷霧終決戰', 'zh-CN': '幽暗林深处守护神 · 迷雾终决战', en: 'Shrouded Forest Spirit', ja: '深林の主' },
    bossAvatar: '🌫️',
    speed: 'FAST',
    rovingCount: 2,
    obstacleType: 'MAZE',
  },
  190: {
    levelId: 190,
    bossName: { 'zh-HK': '烈性TNT爆破狂蟒 🧨', 'zh-CN': '烈性TNT爆破狂蟒 🧨', en: 'Dynamite Demolisher 🧨', ja: '爆薬マニア狂蛇 🧨' },
    bossTitle: { 'zh-HK': '拆彈工程先鋒魔', 'zh-CN': '拆弹工程先锋魔', en: 'Blast Site Bomb Fiend', ja: '工区の爆弾魔' },
    bossAvatar: '🧨',
    speed: 'FAST',
    rovingCount: 2,
    obstacleType: 'BOX',
  },
  200: {
    levelId: 200,
    bossName: { 'zh-HK': '毀滅引線核爆神蟒 👑💣', 'zh-CN': '毁灭引线核爆神蟒 👑💣', en: 'Cataclysm Nuke Wyrm 👑💣', ja: '終末爆薬の核裂竜 👑💣' },
    bossTitle: { 'zh-HK': '第200關半程榮耀霸主 · 終極拆彈大決戰', 'zh-CN': '第200关半程荣耀霸主 · 终极拆弹大决战', en: 'Halfway Milestone Demolition Monarch', ja: '200関記念栄光の核裂竜王' },
    bossAvatar: '💣',
    speed: 'FAST',
    rovingCount: 2,
    obstacleType: 'PORTAL_GATE',
  },
  210: {
    levelId: 210,
    bossName: { 'zh-HK': '赤碧青光色閘守衛', 'zh-CN': '赤碧青光色闸守卫', en: 'RGB Gate Sentry', ja: '三色ゲートの番兵' },
    bossTitle: { 'zh-HK': '色彩禁閉先鋒', 'zh-CN': '色彩禁闭先锋', en: 'Chroma Vanguard', ja: '三色の門番' },
    bossAvatar: '🚪',
    speed: 'NORMAL',
    rovingCount: 2,
    obstacleType: 'DOUBLE_GATE',
  },
  220: {
    levelId: 220,
    bossName: { 'zh-HK': '千變萬化變色神蛇', 'zh-CN': '千变万化变色神蛇', en: 'Chameleon Grand Duke', ja: '変幻自在カメレオン大公' },
    bossTitle: { 'zh-HK': '七彩閘門城堡主宰', 'zh-CN': '七彩闸门城堡主宰', en: 'Chameleon Citadel King', ja: '変色城塞の覇王' },
    bossAvatar: '🎨',
    speed: 'FAST',
    rovingCount: 2,
    obstacleType: 'CASTLE',
  },
  230: {
    levelId: 230,
    bossName: { 'zh-HK': '步步鎖魂機關蛇', 'zh-CN': '步步锁魂机关蛇', en: 'Step-Lock Automaton', ja: '歩数拘束のからくり蛇' },
    bossTitle: { 'zh-HK': '轉向審判執行官', 'zh-CN': '转向审判执行官', en: 'Turn Limit Inquisitor', ja: '歩数審判官' },
    bossAvatar: '📐',
    speed: 'NORMAL',
    rovingCount: 2,
    obstacleType: 'SERPENTINE',
  },
  240: {
    levelId: 240,
    bossName: { 'zh-HK': '方圓規矩算力大君', 'zh-CN': '方圆规矩算力大君', en: 'Calculus Geometry Wyrm', ja: '幾何精算法則の大君' },
    bossTitle: { 'zh-HK': '步步為營關統治者', 'zh-CN': '步步为营关统治者', en: 'Precision Realm Ruler', ja: '歩数聖域の支配者' },
    bossAvatar: '🔄',
    speed: 'FAST',
    rovingCount: 2,
    obstacleType: 'MAZE',
  },
  250: {
    levelId: 250,
    bossName: { 'zh-HK': '逆流時空倒退蛇', 'zh-CN': '逆流时空倒退蛇', en: 'Time Reversal Serpent', ja: '時間逆流のバック蛇' },
    bossTitle: { 'zh-HK': '倒後檔時空先鋒', 'zh-CN': '倒后档时空先锋', en: 'Reverse Gear Pioneer', ja: '逆走先鋒' },
    bossAvatar: '⏪',
    speed: 'NORMAL',
    rovingCount: 2,
    obstacleType: 'SPIRAL',
  },
  260: {
    levelId: 260,
    bossName: { 'zh-HK': '莫比烏斯環倒行巨龍', 'zh-CN': '莫比乌斯环倒行巨龙', en: 'Mobius Loop Chrono Dragon', ja: 'メビウスの環の逆走神竜' },
    bossTitle: { 'zh-HK': '逆轉時空窟守護主', 'zh-CN': '逆转时空窟守护主', en: 'Reverse Realm Sovereign', ja: '逆転洞窟の大君' },
    bossAvatar: '♾️',
    speed: 'FAST',
    rovingCount: 2,
    obstacleType: 'CYBER_CIRCUIT',
  },
  270: {
    levelId: 270,
    bossName: { 'zh-HK': '黃金密碼鎖鏈蟒', 'zh-CN': '黄金密码锁链蟒', en: 'Cipher Chain Boa', ja: '黄金の鎖鍵蛇' },
    bossTitle: { 'zh-HK': '機關城秘庫守衛', 'zh-CN': '机关城秘库守卫', en: 'Vault Sentry Guard', ja: '秘庫の看守' },
    bossAvatar: '🔐',
    speed: 'NORMAL',
    rovingCount: 2,
    obstacleType: 'TREASURE_VAULT',
  },
  280: {
    levelId: 280,
    bossName: { 'zh-HK': '萬鎖玄關機關巨魔', 'zh-CN': '万锁玄关机关巨魔', en: 'Omni-Lock Master Goe', ja: '万鍵開門の機関巨神' },
    bossTitle: { 'zh-HK': '密室機關城城主', 'zh-CN': '密室机关城城主', en: 'Lock Maze Fortress Master', ja: 'からくり城の城主' },
    bossAvatar: '🗝️',
    speed: 'FAST',
    rovingCount: 2,
    obstacleType: 'BOX',
  },
  290: {
    levelId: 290,
    bossName: { 'zh-HK': '天際流雲霜凍雕蛇', 'zh-CN': '天际流云霜冻雕蛇', en: 'Skycloud Frostfeather', ja: '天上の氷翼蛇' },
    bossTitle: { 'zh-HK': '浮空天宮滑冰執法者', 'zh-CN': '浮空天宫滑冰执法者', en: 'Cloud Ice Inquisitor', ja: '天空氷原の監視者' },
    bossAvatar: '🦅',
    speed: 'FAST',
    rovingCount: 2,
    obstacleType: 'TWIN_BRIDGES',
  },
  300: {
    levelId: 300,
    bossName: { 'zh-HK': '雲巔罡風神殿大帝', 'zh-CN': '云巅峰罡风神殿大帝', en: 'Zephyr Emperor of Skies', ja: '雲上の暴風神殿大帝' },
    bossTitle: { 'zh-HK': '第300關天階至尊領袖', 'zh-CN': '第300关天阶至尊领袖', en: '300-Stage Celestial Monarch', ja: '300関突破天空の覇皇' },
    bossAvatar: '☁️',
    speed: 'FAST',
    rovingCount: 2,
    obstacleType: 'BOSS_ARENA',
  },
  310: {
    levelId: 310,
    bossName: { 'zh-HK': '黑夜潛爆伏擊蟒', 'zh-CN': '黑夜潜爆伏击蟒', en: 'Midnight Ambush Bomb Snake', ja: '夜陰の伏撃爆弾蛇' },
    bossTitle: { 'zh-HK': '暗夜拆彈突擊隊長', 'zh-CN': '暗夜拆弹突击队长', en: 'Nightfall Demolition Chief', ja: '暗夜工区の強襲隊長' },
    bossAvatar: '🕶️',
    speed: 'FAST',
    rovingCount: 2,
    obstacleType: 'SCATTERED',
  },
  320: {
    levelId: 320,
    bossName: { 'zh-HK': '盲夜引信連鎖爆破神', 'zh-CN': '盲夜引信连锁爆破神', en: 'Blindnight Chain Blaster', ja: '盲夜連鎖爆破の邪神' },
    bossTitle: { 'zh-HK': '暗夜拆彈營毀滅魔神', 'zh-CN': '暗夜拆弹营毁灭魔神', en: 'Midnight Blast Tyrant', ja: '深夜爆弾営の魔神' },
    bossAvatar: '💥',
    speed: 'FAST',
    rovingCount: 2,
    obstacleType: 'PORTAL_GATE',
  },
  330: {
    levelId: 330,
    bossName: { 'zh-HK': '幽靈鏡像倒轉神蟒', 'zh-CN': '幽灵镜像倒转神蟒', en: 'Mirrored Phantom Serpent', ja: '幽体鏡像の逆転蛇' },
    bossTitle: { 'zh-HK': '步步逆轉先鋒守護', 'zh-CN': '步步逆转先锋守护', en: 'Turn-Reverse Phantom', ja: '幽霊反転の門番' },
    bossAvatar: '🪞',
    speed: 'FAST',
    rovingCount: 2,
    obstacleType: 'HOURGLASS',
  },
  340: {
    levelId: 340,
    bossName: { 'zh-HK': '虛靈無相反轉神皇', 'zh-CN': '虚灵无相反转神皇', en: 'Phase Inversion Phantom God', ja: '幽界無相の反転神皇' },
    bossTitle: { 'zh-HK': '幽靈逆轉殿至尊主', 'zh-CN': '幽灵逆转殿至尊主', en: 'Phantom Mirror Supreme', ja: '幻影魔殿の至尊' },
    bossAvatar: '👻',
    speed: 'FAST',
    rovingCount: 2,
    obstacleType: 'DIAMOND',
  },
  350: {
    levelId: 350,
    bossName: { 'zh-HK': '熾炎龍鱗暴虐赤龍', 'zh-CN': '炽炎龙鳞暴虐赤龙', en: 'Crimson Dragonscale Drake', ja: '紅蓮竜鱗の暴虐赤竜' },
    bossTitle: { 'zh-HK': '古龍巢炎獄守門者', 'zh-CN': '古龙巢炎狱守门者', en: 'Dragon Lair Hellfire Gatekeeper', ja: '古竜の巣の猛炎番人' },
    bossAvatar: '🔥',
    speed: 'FAST',
    rovingCount: 2,
    obstacleType: 'VOLCANO_RIM',
  },
  360: {
    levelId: 360,
    bossName: { 'zh-HK': '滅世紅蓮黑金巨龍王', 'zh-CN': '灭世红莲黑金巨龙王', en: 'Cataclysmic Dragon Sovereign', ja: '滅世紅蓮の黒金巨竜王' },
    bossTitle: { 'zh-HK': '遠古巨龍巢終極祖龍', 'zh-CN': '远古巨龙巢终极祖龙', en: 'Ancient Progenitor Dragon', ja: '古竜の祖神' },
    bossAvatar: '🐲',
    speed: 'FAST',
    rovingCount: 2,
    obstacleType: 'CASTLE',
  },
  370: {
    levelId: 370,
    bossName: { 'zh-HK': '創世星核巡天神獸', 'zh-CN': '创世星核巡天神兽', en: 'Genesis Starcore Titan', ja: '星核巡天の神獣' },
    bossTitle: { 'zh-HK': '星辰天階守護大將', 'zh-CN': '星辰天阶守护大将', en: 'Astral Ascent General', ja: '星神天階の守護将' },
    bossAvatar: '☄️',
    speed: 'FAST',
    rovingCount: 2,
    obstacleType: 'ASTRAL_STAR',
  },
  380: {
    levelId: 380,
    bossName: { 'zh-HK': '宇宙引力黑洞奇點蟒', 'zh-CN': '宇宙引力黑洞奇点蟒', en: 'Singularity Event Horizon Wyrm', ja: '特異点ブラックホール大蛇' },
    bossTitle: { 'zh-HK': '時空奇異點破壞神', 'zh-CN': '时空奇异点破坏神', en: 'Singularity Destroyer', ja: '時空特異点の破壊神' },
    bossAvatar: '🕳️',
    speed: 'FAST',
    rovingCount: 2,
    obstacleType: 'SPIRAL',
  },
  390: {
    levelId: 390,
    bossName: { 'zh-HK': '超新星爆發超維神蛇', 'zh-CN': '超新星爆发超维神蛇', en: 'Supernova Hyperdimension Serpent', ja: '超新星爆発の多次元神蛇' },
    bossTitle: { 'zh-HK': '星殿終極近衛神尊', 'zh-CN': '星殿终极近卫神尊', en: 'Astral Royal Supreme', ja: '星殿最終近衛神' },
    bossAvatar: '✨',
    speed: 'FAST',
    rovingCount: 2,
    obstacleType: 'CYBER_CIRCUIT',
  },
  400: {
    levelId: 400,
    bossName: { 'zh-HK': '創世諸神星辰神龍天帝', 'zh-CN': '创世诸神星辰神龙天帝', en: 'Genesis Supreme Dragon Sovereign', ja: '創世諸神の星辰神龍天帝' },
    bossTitle: { 'zh-HK': '👑 全400關終極巔峰總冠軍王座 👑', 'zh-CN': '👑 全400关终极巅峰总冠军王座 👑', en: '👑 Ultimate Stage 400 Grand Champion 👑', ja: '👑 全400関究極天帝王座 👑' },
    bossAvatar: '👑',
    speed: 'FAST',
    rovingCount: 2,
    obstacleType: 'BOSS_ARENA',
  },
};

// Calculate level reward coins strictly scaled according to difficulty, capped at at most 500 coins
export function calculateLevelRewardCoins(params: {
  id: number;
  hasObstacles?: boolean;
  obstacleType?: ObstaclePatternType;
  rovingSnakesCount?: number;
  rovingSnakeSpeed?: LevelMission['rovingSnakeSpeed'];
  timeLimit?: number;
  targets?: LevelMission['targets'];
  isBoss?: boolean;
}): number {
  const { id, hasObstacles, obstacleType, rovingSnakesCount = 0, rovingSnakeSpeed, timeLimit, targets, isBoss } = params;

  // Base progression across 400 levels (scales smoothly from 50 base coins at Lv 1 to 380 base coins at Lv 400)
  const progressRatio = Math.max(0, Math.min(1, (id - 1) / 399));
  let coins = 50 + progressRatio * 320;

  // Obstacle difficulty bonus
  if (hasObstacles) {
    if (obstacleType === 'MAZE' || obstacleType === 'DOUBLE_GATE' || obstacleType === 'SPIRAL' || obstacleType === 'BOSS_ARENA') {
      coins += 25;
    } else {
      coins += 15;
    }
  }

  // Roving snakes danger bonus
  if (rovingSnakesCount > 0) {
    coins += rovingSnakesCount * 18;
    if (rovingSnakeSpeed === 'FAST') {
      coins += 16;
    } else if (rovingSnakeSpeed === 'NORMAL') {
      coins += 10;
    }
  }

  // Timed pressure bonus
  if (timeLimit && timeLimit > 0) {
    if (timeLimit <= 40) {
      coins += 22;
    } else {
      coins += 12;
    }
  }

  // Target complexity bonus
  if (targets) {
    if (targets.bombs && targets.bombs >= 1) coins += targets.bombs * 15;
    if (targets.colorSequenceCount && targets.colorSequenceCount >= 1) coins += targets.colorSequenceCount * 12;
    if (targets.golden && targets.golden >= 2) coins += 15;
    if (targets.portals && targets.portals >= 2) coins += 15;
    if (targets.magnet && targets.magnet >= 2) coins += 15;
    if (targets.chili && targets.chili >= 2) coins += 16;
    if (targets.dragonEgg && targets.dragonEgg >= 1) coins += 20;
    if (targets.rainbow && targets.rainbow >= 2) coins += 15;
    if (targets.length && targets.length >= 22) coins += 15;
  }

  // Boss milestone bonus
  if (isBoss || id % 20 === 0) {
    coins += 45;
  } else if (id % 10 === 0) {
    coins += 25;
  }

  // Round to nearest multiple of 5 for clean readability
  const rounded = Math.round(coins / 5) * 5;

  // Strict bounds: Minimum 50 coins, Maximum strictly 500 coins per level
  return Math.max(50, Math.min(500, rounded));
}

// 24 Dynamic, Engaging Obstacle Patterns
export const OBSTACLE_PATTERNS: ObstaclePatternType[] = [
  'CORNERS',
  'PILLARS',
  'CROSS',
  'CORRIDOR',
  'MAZE',
  'BOX',
  'SCATTERED',
  'DOUBLE_GATE',
  'SPIRAL',
  'HOURGLASS',
  'DIAMOND',
  'CASTLE',
  'PYRAMID',
  'CHECKERBOARD',
  'TWIN_BRIDGES',
  'VOLCANO_RIM',
  'CYBER_CIRCUIT',
  'CORAL_REEF',
  'ASTRAL_STAR',
  'PORTAL_GATE',
  'SERPENTINE',
  'ZIG_ZAG',
  'TREASURE_VAULT',
  'BOSS_ARENA',
];

// Curated Level Title & Subtitle Themes per World
const WORLD_TITLE_THEMES: Record<number, { titles: string[]; subtitles: string[] }> = {
  1: {
    titles: ['生機萌芽', '林間青果', '青翠秘境', '晨曦初照', '松果巡遊', '溪流躍步', '綠意盎然', '樹影婆娑', '森林哨所'],
    subtitles: ['熟悉滑動轉向基礎', '收集甘甜的多色蘋果', '靈巧擺動避開邊界', '在樹蔭間尋覓閃耀果實', '小試身手完成試煉'],
  },
  2: {
    titles: ['石碑低語', '翡翠之光', '空間裂隙', '傳送門初啟', '碧玉迴廊', '時空跳躍', '石林穿梭', '翡翠神柱', '次元共鳴'],
    subtitles: ['步入翡翠傳送門穿梭兩端', '利用時空門靈巧甩開巡邏蛇', '在巨石陣中精準定向傳送', '穿越傳送門採集對向寶石'],
  },
  3: {
    titles: ['糖霜仙境', '太妃軟糖', '彩虹波波糖', '馬卡龍大道', '泡芙狂歡', '果凍彈力跳', '巧克力脆片', '糖果迷宮', '焦糖盛宴'],
    subtitles: ['吃下彩虹糖引發多倍連擊', '在威化餅乾牆縫隙穿梭', '彈力果凍讓蛇身加速衝刺', '享用滿屏甘甜糖果美點'],
  },
  4: {
    titles: ['熔岩沸騰', '地心熱浪', '火之辣椒', '烈焰衝刺', '黑曜巨石', '熾熱熔火', '狂暴火花', '火山裂隙', '炎獄洗禮'],
    subtitles: ['吃下烈焰辣椒獲無敵火衣', '火衣護體衝破前方阻礙', '小心岩漿裂縫的高溫警告', '極速狂飆避開熔火巡邏'],
  },
  5: {
    titles: ['電馭叛客', '霓虹光軌', '超頻脈衝', '量子光刃', '矩陣穿梭', '光子充能', '高壓阻斷', '賽博天網', '數碼暴走'],
    subtitles: ['在霓虹電網中尋找突破口', '光速轉向避開機械防禦巡警', '小心電子光柵的致命夾擊', '極速收集電磁能量核心'],
  },
  6: {
    titles: ['幽冥迷霧', '夜魘低語', '虛靈幻步', '暗影穿透', '幽魂法袍', '破牆穿體', '虛空漫遊', '幽暗迴響', '靈界巡遊'],
    subtitles: ['幽靈穿透可短暫穿過自身與石牆', '虛靈化身是解圍的神技', '靈活穿透狹窄死角逃出生天', '在暗沼中破除幽魂迷陣'],
  },
  7: {
    titles: ['潮汐湧動', '珊瑚迷城', '深海珍珠', '磁石漩渦', '深淵引力', '碧波龍宮', '海妖鳴唱', '晶石珊瑚', '水華天幕'],
    subtitles: ['吃下磁石珍珠自動吸取周圍果實', '引力漩渦帶來爽快滿屏進食', '在珊瑚礁林中優雅遊弋', '巧妙運用磁吸達成限時指標'],
  },
  8: {
    titles: ['極寒冰川', '琉璃滑面', '冰道疾行', '霜雪穿梭', '寒晶鏡面', '冰封迴廊', '急凍滑步', '雪原狂飆', '冰魄神殿'],
    subtitles: ['踩上冰面將無法轉向一直滑行', '考驗路線的精確預判與落點', '在冰封滑道中計算轉折角度', '順應冰勢一口氣滑向終點'],
  },
  9: {
    titles: ['黑夜籠罩', '螢火初現', '發光莓果', '夜行摸索', '暗夜探幽', '迷霧重重', '燈火指引', '盲道破局', '破霧之光'],
    subtitles: ['蛇頭只有3-4格微弱視野', '吃下發光莓果點亮迷霧地圖', '憑藉記憶在幽暗森林中遊走', '在黑暗中警惕巡邏的暗影蛇'],
  },
  10: {
    titles: ['引信嘶鳴', '倒數計時', '限時拆彈', '生死時速', '拆除專家', '爆破預警', '炸彈狂潮', '拆彈危機', '防爆衝刺'],
    subtitles: ['地圖上的炸彈急速倒數', '時間歸零前必須吃掉它拆除', '分秒必爭！先拆炸彈再搶目標', '冷靜走位化解連環爆炸危機'],
  },
  11: {
    titles: ['三原色彩', '光譜律動', '順序配對', '紅綠藍調', '彩虹節奏', '光芒交織', '三色連動', '稜鏡折射', '光譜神律'],
    subtitles: ['必須按紅綠藍指定順序進食', '看清頂部指示牌的當前顏色', '吃錯順序會中斷連擊計數', '按部就班解開三原色光陣'],
  },
  12: {
    titles: ['變色魔紋', '同色通行', '能量閘門', '色彩屏障', '同調變幻', '三色門禁', '彩光通行證', '色相轉移', '七彩迷城'],
    subtitles: ['吃紅蘋果變紅身，只能穿紅門', '非同色閘門視為堅固牆壁', '吃對顏色取得通關鑰匙', '巧妙變換體色穿梭彩色閘門'],
  },
  13: {
    titles: ['步步為營', '轉向精算', '限次博弈', '算無遺策', '精準轉角', '直道疾行', '步數警戒', '折線規劃', '極致走位'],
    subtitles: ['每一次蛇頭轉向都會消耗步數', '步數歸零前必須達成目標', '盡量走長直線減少轉彎', '精心計算每一步的行進價值'],
  },
  14: {
    titles: ['時空倒流', '齒輪反向', '尾首互換', '絕境倒車', '逆向破局', '回溯行駛', '時空折躍', '逆轉生機', '雙頭神技'],
    subtitles: ['拾取倒後齒輪將尾巴變蛇頭', '死角無路時直接反向脫困', '靈活運用倒車避開夾擊', '時空逆轉成就神級避障操作'],
  },
  15: {
    titles: ['重重深鎖', '黃金鎖匙', '密室機關', '開門奪寶', '機關重閣', '秘庫探奇', '鎖鑰同心', '破陣解密', '寶庫深處'],
    subtitles: ['撿拾金色鑰匙解鎖秘庫大門', '打開通道獲取深處的高分蘋果', '解開環環相扣的連鎖密室', '在機關重地奪取豐厚通關金幣'],
  },
  16: {
    titles: ['天際罡風', '浮空雙門', '冰原天宮', '雲端滑翔', '躍遷空行', '聖光之階', '天風疾馳', '神域雙界', '凌空渡步'],
    subtitles: ['空間傳送門與極地滑冰複合考驗', '踏上冰面瞬間傳送到對角', '在無邊浮島間靈活跨越', '挑戰高空神殿的雙重機制'],
  },
  17: {
    titles: ['暗夜滴答', '迷霧引線', '盲拆火線', '黑夜拆彈', '幽光防爆', '暗影警報', '濃霧拆彈', '生死雷區', '破霧拆解'],
    subtitles: ['濃重黑霧中摸索拆除計時炸彈', '先吃發光豆探明炸彈位置', '聽聲辨位，頂住時間倒數壓力', '在暗夜之中完成驚天拆彈'],
  },
  18: {
    titles: ['幽靈鏡像', '倒車穿牆', '算步虛靈', '雙重破局', '幻影神倒', '極限規避', '靈動穿梭', '虛實相生', '脫胎換骨'],
    subtitles: ['幽靈穿透與倒後檔雙管齊下', '受限的轉向次數考驗微操', '穿牆而過瞬間倒退變向', '以神級操作破除終極迷陣'],
  },
  19: {
    titles: ['龍威赫赫', '炎龍破門', '龍蛋爭雄', '色閘炎獄', '龍鱗鐵壁', '龍巢奪寶', '熾火破陣', '龍息狂飆', '真龍試煉'],
    subtitles: ['吃火辣椒獲無敵火衣衝破障礙', '變換體色通過彩閘奪得龍蛋', '在古龍眼皮底下智取寶物', '無懼龍威，邁向最後殿堂'],
  },
  20: {
    titles: ['星神齊聚', '諸神歸一', '全能同調', '萬象合一', '創世之歌', '星辰奇點', '終極王座', '傳奇落幕', '創世神光'],
    subtitles: ['全機制、全要素極致考驗', '傳送門、炸彈、冰面與色門齊備', '邁向第400關終極巔峰總王座', '展現全能蛇王的無雙身手'],
  },
};

// Generates predefined ice tiles pattern for ice levels
export function generateIceTiles(levelId: number): Point[] {
  const patternType = levelId % 4;
  const tiles: Point[] = [];
  if (patternType === 0) {
    // Center frozen lake
    for (let x = 6; x <= 13; x++) {
      for (let y = 10; y <= 17; y++) {
        tiles.push({ x, y });
      }
    }
  } else if (patternType === 1) {
    // Twin frozen rivers
    for (let x = 2; x <= 17; x++) {
      tiles.push({ x, y: 8 });
      tiles.push({ x, y: 19 });
    }
  } else if (patternType === 2) {
    // Glacial checker patches
    for (let x = 4; x <= 15; x += 3) {
      for (let y = 6; y <= 21; y += 3) {
        tiles.push({ x, y });
        tiles.push({ x: x + 1, y });
        tiles.push({ x, y: y + 1 });
      }
    }
  } else {
    // Cross ice tracks
    for (let y = 5; y <= 22; y++) {
      tiles.push({ x: 9, y });
      tiles.push({ x: 10, y });
    }
    for (let x = 3; x <= 16; x++) {
      tiles.push({ x, y: 13 });
      tiles.push({ x, y: 14 });
    }
  }
  return tiles;
}

// Generates colored gates for color matching levels
export function generateColorGates(levelId: number): { x: number; y: number; color: 'RED' | 'BLUE' | 'GREEN' }[] {
  const gates: { x: number; y: number; color: 'RED' | 'BLUE' | 'GREEN' }[] = [];
  const variant = levelId % 3;

  if (variant === 0) {
    // Vertical gate wall
    gates.push({ x: 5, y: 14, color: 'RED' });
    gates.push({ x: 9, y: 14, color: 'BLUE' });
    gates.push({ x: 14, y: 14, color: 'GREEN' });
  } else if (variant === 1) {
    // Quadrant gates
    gates.push({ x: 6, y: 9, color: 'RED' });
    gates.push({ x: 13, y: 9, color: 'BLUE' });
    gates.push({ x: 6, y: 19, color: 'GREEN' });
    gates.push({ x: 13, y: 19, color: 'RED' });
  } else {
    // Corridor choke points
    gates.push({ x: 9, y: 7, color: 'BLUE' });
    gates.push({ x: 10, y: 7, color: 'BLUE' });
    gates.push({ x: 9, y: 20, color: 'GREEN' });
    gates.push({ x: 10, y: 20, color: 'GREEN' });
  }
  return gates;
}

// Generate Procedural Level with Novelty & Fresh Mechanics (Supports all 400 levels!)
export const generateNovelLevel = (id: number): LevelMission => {
  const world = getWorldByLevelId(id);
  const worldIndex = Math.floor((id - 1) / 20); // 0 to 19
  const indexInWorld = (id - 1) % 20; // 0 to 19
  const isBoss = id % 10 === 0;

  // Boss Level special overrides
  if (isBoss) {
    const bossDef = BOSS_DEFINITIONS[id] || BOSS_DEFINITIONS[400];
    const isFinale = id % 20 === 0;
    // 每逢第20關的boss關，如果有三條巡邏蛇，將佢變兩條蛇；第350關、第370關、第390關為2條
    const bossRovingCount = (id === 350 || id === 370 || id === 390) ? 2 : (isFinale && bossDef.rovingCount === 3) ? 2 : bossDef.rovingCount;
    // Level 80 user request: countdown timer 40 seconds (第80關加倒計時40秒)
    const bossTimeLimit = id === 80 ? 40 : (isFinale && id > 80 && id % 40 === 0 ? 50 : undefined);
    const rewardCoins = calculateLevelRewardCoins({
      id,
      hasObstacles: true,
      obstacleType: bossDef.obstacleType,
      rovingSnakesCount: bossRovingCount,
      rovingSnakeSpeed: bossDef.speed,
      timeLimit: bossTimeLimit,
      isBoss: true,
    });

    const title = `${bossDef.bossName['zh-HK']}`;
    const subtitle = `👑 ${bossDef.bossTitle['zh-HK']} · ${isFinale ? '世界終極大決戰' : '領主阻擊戰'}${bossTimeLimit ? ` · ⏳ ${bossTimeLimit}秒限時` : ''}`;
    const description = `【${world.name['zh-HK']}】迎來最強考驗！與「${bossDef.bossName['zh-HK']}」正面交鋒，達成苛刻目標奪取通關金幣！`;

    // Dynamic targets for Boss fights
    const targets: LevelMission['targets'] = {
      normal: Math.min(35, 14 + Math.floor(id * 0.05)),
      length: Math.min(32, 16 + Math.floor(id * 0.04)),
    };

    if (worldIndex >= 1 && id % 2 === 0) targets.golden = Math.min(5, 2 + Math.floor(id * 0.008));
    if (world.id === 2 || world.id === 16 || world.id === 20) targets.portals = 3;
    if (world.id === 3) targets.rainbow = 2;
    if (world.id === 4 || world.id === 19) targets.chili = 2;
    if (world.id === 5) targets.lightning = 2;
    if (world.id === 6 || world.id === 18) targets.shield = 2;
    if (world.id === 7 || world.id === 20) targets.magnet = 2;
    if (world.id === 10 || world.id === 17) targets.bombs = 2;
    if (world.id === 11) targets.colorSequenceCount = 2;
    if (world.id === 12) {
      targets.blue = 4;
      targets.green = 4;
    }
    if (world.id === 15) targets.keys = 2;
    if (world.id === 19) targets.dragonEgg = 2;

    const hasPortals = world.id === 2 || world.id === 16 || world.id === 20;
    const hasBombs = world.id === 10 || world.id === 17 || (world.id === 20 && id % 5 === 1);
    const bombCountdownSeconds = hasBombs ? (world.id === 17 ? 14 : 12) : undefined;
    const hasFogOfWar = world.id === 9 || world.id === 17;
    const fogRadius = hasFogOfWar ? (world.id === 17 ? 4.0 : 4.2) : undefined;
    const hasGhost = world.id === 6 || world.id === 18;
    const hasReverse = world.id === 14 || world.id === 18;
    const iceTiles = (world.id === 8 || world.id === 16 || (world.id === 20 && id % 5 === 2)) ? generateIceTiles(id) : undefined;
    const colorSequence = (world.id === 11 || (world.id === 20 && id % 5 === 3)) ? (['RED', 'BLUE', 'GREEN'] as ('RED' | 'BLUE' | 'GREEN')[]) : undefined;
    const colorGates = (world.id === 12 || (world.id === 20 && id % 5 === 4)) ? generateColorGates(id) : undefined;

    const isCyberWorld = world.id === 5;
    // Boss fight snake speed tuning: Fast reflex response against bosses (Cyber World is ultra-responsive Turbo)
    const bossSnakeSpeed: LevelMission['snakeSpeed'] = isCyberWorld ? 'TURBO' : id >= 300 ? 'TURBO' : id >= 100 ? 'VERY_FAST' : 'FAST';
    const bossBaseSpeedMs = isCyberWorld ? 68 : Math.max(74, 96 - Math.floor(id * 0.055));

    return {
      id,
      title,
      subtitle,
      description,
      targets,
      timeLimit: bossTimeLimit,
      hasObstacles: true,
      obstacleType: bossDef.obstacleType,
      rovingSnakesCount: bossRovingCount,
      rovingSnakeSpeed: bossDef.speed,
      snakeSpeed: bossSnakeSpeed,
      baseSpeedMs: bossBaseSpeedMs,
      rewardCoins,
      worldId: world.id,
      worldName: world.name['zh-HK'],
      hasPortals,
      portals: hasPortals ? [{ x: 3, y: 14 }, { x: 16, y: 14 }] : undefined,
      hasBombs,
      bombCountdownSeconds,
      hasFogOfWar,
      fogRadius,
      hasGhost,
      hasReverse,
      iceTiles,
      colorSequence,
      colorGates,
      gimmick: 'BOSS',
      isBossLevel: true,
      bossName: bossDef.bossName['zh-HK'],
      bossTitle: bossDef.bossTitle['zh-HK'],
      bossAvatar: bossDef.bossAvatar,
    };
  }

  // Non-boss level: determine unique World gimmick, Archetype & properties
  let gimmick: LevelMission['gimmick'] = 'NONE';
  let hasPortals = false;
  let portals: [Point, Point] | undefined = undefined;
  let hasGhost = false;
  let hasFogOfWar = false;
  let fogRadius: number | undefined = undefined;
  let iceTiles: Point[] | undefined = undefined;
  let hasBombs = false;
  let bombCountdownSeconds: number | undefined = undefined;
  let colorSequence: ('RED' | 'BLUE' | 'GREEN')[] | undefined = undefined;
  let colorGates: { x: number; y: number; color: 'RED' | 'BLUE' | 'GREEN' }[] | undefined = undefined;
  let maxTurns: number | undefined = undefined;
  let hasReverse = false;

  const targets: LevelMission['targets'] = {};

  // World mechanics assignment:
  if (world.id === 2) {
    gimmick = 'PORTAL';
    hasPortals = true;
    portals = id % 2 === 0 ? [{ x: 3, y: 8 }, { x: 16, y: 20 }] : [{ x: 4, y: 14 }, { x: 15, y: 14 }];
  } else if (world.id === 3) {
    gimmick = 'RAINBOW';
  } else if (world.id === 4) {
    gimmick = 'CHILI';
  } else if (world.id === 5) {
    gimmick = 'LIGHTNING';
  } else if (world.id === 6) {
    gimmick = 'GHOST';
    hasGhost = true;
  } else if (world.id === 7) {
    gimmick = 'MAGNET';
  } else if (world.id === 8) {
    gimmick = 'ICE';
    iceTiles = generateIceTiles(id);
  } else if (world.id === 9) {
    gimmick = 'FOG';
    hasFogOfWar = true;
    fogRadius = 4.2;
  } else if (world.id === 10) {
    gimmick = 'BOMB';
    hasBombs = true;
    bombCountdownSeconds = 12;
  } else if (world.id === 11) {
    gimmick = 'COLOR_SEQUENCE';
    colorSequence = ['RED', 'BLUE', 'GREEN'];
  } else if (world.id === 12) {
    gimmick = 'COLOR_GATE';
    colorGates = generateColorGates(id);
  } else if (world.id === 13) {
    gimmick = 'TURN_LIMIT';
  } else if (world.id === 14) {
    gimmick = 'REVERSE';
    hasReverse = true;
  } else if (world.id === 15) {
    gimmick = 'KEY_LOCK';
  } else if (world.id === 16) {
    gimmick = 'PORTAL';
    hasPortals = true;
    portals = [{ x: 4, y: 7 }, { x: 15, y: 21 }];
    iceTiles = generateIceTiles(id);
  } else if (world.id === 17) {
    gimmick = 'BOMB';
    hasFogOfWar = true;
    fogRadius = 4.0;
    hasBombs = true;
    bombCountdownSeconds = 14;
  } else if (world.id === 18) {
    gimmick = 'GHOST';
    hasGhost = true;
    hasReverse = true;
  } else if (world.id === 19) {
    gimmick = 'DRAGON_EGG';
  } else if (world.id === 20) {
    const roll = id % 5;
    if (roll === 0) {
      gimmick = 'PORTAL';
      hasPortals = true;
      portals = [{ x: 3, y: 14 }, { x: 16, y: 14 }];
    } else if (roll === 1) {
      gimmick = 'BOMB';
      hasBombs = true;
      bombCountdownSeconds = 12;
    } else if (roll === 2) {
      gimmick = 'ICE';
      iceTiles = generateIceTiles(id);
    } else if (roll === 3) {
      gimmick = 'COLOR_SEQUENCE';
      colorSequence = ['RED', 'BLUE', 'GREEN'];
    } else {
      gimmick = 'MAGNET';
    }
  }

  // 6 Dynamic Gameplay Archetypes:
  // 0: Signature Gimmick Core | 1: Turn Budget Puzzle | 2: Time Attack Sprint |
  // 3: Survival Evasion | 4: Multi-Color Symphony | 5: Labyrinth & Vault Heist
  const archetype = indexInWorld % 6;
  let archetypeTitle = '';
  let archetypeSubtitle = '';
  let timeLimit: number | undefined = undefined;

  if (archetype === 0) {
    // 0: GIMMICK_CORE - Focus heavily on signature world mechanics
    archetypeTitle = '異能先鋒';
    if (world.id === 2 || world.id === 16 || (world.id === 20 && gimmick === 'PORTAL')) {
      targets.portals = 3 + (id % 2);
      targets.normal = 10 + (id % 5);
      archetypeSubtitle = `🌀 穿越時空傳送門 ${targets.portals} 次並收集果實`;
    } else if (world.id === 3) {
      targets.rainbow = 2 + (id % 2);
      targets.blue = 4 + (id % 3);
      targets.green = 4 + (id % 3);
      archetypeSubtitle = '🍭 吃下彩虹波波糖，觸發4倍狂暴連擊';
    } else if (world.id === 4 || world.id === 19) {
      targets.chili = 2 + (id % 2);
      targets.normal = 12 + (id % 6);
      if (world.id === 19) targets.dragonEgg = 2;
      archetypeSubtitle = '🌶️ 吃下烈焰辣椒獲無敵火衣，破障衝刺';
    } else if (world.id === 5) {
      targets.lightning = 2 + (id % 2);
      targets.golden = 2;
      targets.normal = 12 + (id % 5);
      archetypeSubtitle = '⚡ 拾取電磁超頻核心，觸發超光速狂飆與EMP癱瘓！';
    } else if (world.id === 6 || world.id === 18) {
      hasGhost = true;
      targets.shield = 2;
      targets.normal = 12 + (id % 6);
      archetypeSubtitle = '👻 拾取幽靈道具穿透石牆與自體，穿梭自如';
    } else if (world.id === 7 || (world.id === 20 && gimmick === 'MAGNET')) {
      targets.magnet = 2 + (id % 2);
      targets.normal = 16 + (id % 6);
      archetypeSubtitle = '🧲 拾取磁石珍珠，引發滿屏吸附風暴';
    } else if (world.id === 8 || (world.id === 20 && gimmick === 'ICE')) {
      iceTiles = generateIceTiles(id);
      targets.blue = 5 + (id % 3);
      targets.normal = 12 + (id % 5);
      archetypeSubtitle = '❄️ 在極地滑冰地面滑行，採集冰晶藍蘋果';
    } else if (world.id === 9) {
      hasFogOfWar = true;
      fogRadius = 4.2;
      targets.golden = 2 + (id % 2);
      targets.normal = 12 + (id % 5);
      archetypeSubtitle = '🫐 漆黑迷霧中尋覓發光莓果，照亮前路奪金果';
    } else if (world.id === 10 || world.id === 17 || (world.id === 20 && gimmick === 'BOMB')) {
      hasBombs = true;
      bombCountdownSeconds = 12;
      targets.bombs = 2 + (id % 2);
      targets.normal = 10 + (id % 5);
      archetypeSubtitle = `💣 緊迫倒數！在歸零前緊急拆除 ${targets.bombs} 枚炸彈`;
    } else if (world.id === 11 || (world.id === 20 && gimmick === 'COLOR_SEQUENCE')) {
      colorSequence = ['RED', 'BLUE', 'GREEN'];
      targets.colorSequenceCount = 2 + (id % 2);
      targets.normal = 8;
      archetypeSubtitle = `🎯 嚴格遵循紅(🔴)→藍(🔵)→綠(🟢)順序進食 ${targets.colorSequenceCount} 組`;
    } else if (world.id === 12) {
      colorGates = generateColorGates(id);
      targets.blue = 4 + (id % 3);
      targets.green = 4 + (id % 3);
      targets.normal = 8;
      archetypeSubtitle = '🎨 變換體色穿梭彩色閘門，收穫通關大獎';
    } else if (world.id === 13) {
      maxTurns = Math.max(18, 26 - Math.floor(worldIndex * 0.4));
      targets.normal = 10 + (id % 4);
      targets.golden = 2;
      archetypeSubtitle = `🔄 限制 ${maxTurns} 次轉向！零失誤極限規劃`;
    } else if (world.id === 14) {
      hasReverse = true;
      targets.length = 16 + (id % 5);
      targets.normal = 12 + (id % 5);
      archetypeSubtitle = '⏪ 拾取逆轉齒輪讓尾巴化為蛇頭，擺脫死角';
    } else if (world.id === 15) {
      targets.keys = 2 + (id % 2);
      targets.golden = 2;
      targets.normal = 10;
      archetypeSubtitle = `🗝️ 收集 ${targets.keys} 把金光鑰匙打開秘庫大門`;
    } else {
      targets.normal = 14;
      targets.golden = 2;
      archetypeSubtitle = '🌟 掌握核心異能，完成榮耀試煉';
    }
  } else if (archetype === 1) {
    // 1: TURN_BUDGET - Minimalist Turn Precision Puzzle
    maxTurns = Math.max(18, 30 - Math.floor(worldIndex * 0.5) - (id % 4));
    targets.normal = 10 + (id % 5);
    targets.golden = 2;
    archetypeTitle = '步步精算';
    archetypeSubtitle = `🔄 限制 ${maxTurns} 次轉向！走長直線減少轉角`;

    // Harmonize mechanics that complement turn budgets:
    if (world.id === 2 || world.id === 16) {
      hasPortals = true;
      portals = [{ x: 3, y: 8 }, { x: 16, y: 20 }];
      targets.portals = 2;
      archetypeSubtitle = `🔄 限制 ${maxTurns} 次轉向！善用傳送門節省步數`;
    } else if (world.id === 8 || world.id === 16) {
      iceTiles = generateIceTiles(id);
      archetypeSubtitle = `🔄 限制 ${maxTurns} 次轉向！順應冰面滑行省步數`;
    } else if (world.id === 14 || world.id === 18) {
      hasReverse = true;
      archetypeSubtitle = `🔄 限制 ${maxTurns} 次轉向！倒後換位零轉角消耗`;
    } else if (world.id === 15) {
      targets.keys = 1;
      archetypeSubtitle = `🔄 限制 ${maxTurns} 次轉向！拿鑰匙打開秘庫大門`;
    } else if (world.id === 6 || world.id === 18) {
      hasGhost = true;
      targets.shield = 1;
      archetypeSubtitle = `🔄 限制 ${maxTurns} 次轉向！幽靈穿牆抄捷徑省步數`;
    }
  } else if (archetype === 2) {
    // 2: SPEED_RUSH - High Adrenaline Timed Sprint with World Items Integrated!
    timeLimit = Math.max(28, 40 - Math.floor(worldIndex * 0.5) - (id % 3) * 2);
    archetypeTitle = '急速衝刺';
    archetypeSubtitle = `⏳ ${timeLimit}秒限時衝刺！每次進食均可加時`;

    if (world.id === 2 || (world.id === 20 && gimmick === 'PORTAL')) {
      hasPortals = true;
      portals = [{ x: 4, y: 14 }, { x: 15, y: 14 }];
      targets.portals = 2;
      targets.normal = 10 + (id % 4);
      archetypeTitle = '穿梭疾衝';
      archetypeSubtitle = `🌀 ⏳ ${timeLimit}秒限時！穿越傳送門並收集果實`;
    } else if (world.id === 3) {
      targets.rainbow = 1 + (id % 2);
      targets.normal = 10 + (id % 4);
      archetypeTitle = '彩虹狂飆';
      archetypeSubtitle = `🍭 ⏳ ${timeLimit}秒限時！吃彩虹糖引發狂暴連擊加時`;
    } else if (world.id === 4) {
      targets.chili = 1 + (id % 2);
      targets.normal = 10 + (id % 4);
      archetypeTitle = '烈焰狂飆';
      archetypeSubtitle = `🌶️ ⏳ ${timeLimit}秒限時！吃火之辣椒烈焰衝刺加時`;
    } else if (world.id === 5) {
      targets.lightning = 1 + (id % 2);
      targets.golden = 2;
      targets.normal = 10 + (id % 4);
      archetypeTitle = '電光狂飆';
      archetypeSubtitle = `⚡ ⏳ ${timeLimit}秒限時！吃超頻核心 52ms 閃電衝刺加時`;
    } else if (world.id === 6) {
      hasGhost = true;
      targets.shield = 1;
      targets.normal = 10 + (id % 4);
      archetypeTitle = '幻影極速';
      archetypeSubtitle = `👻 ⏳ ${timeLimit}秒限時！化身虛靈穿透石牆衝刺`;
    } else if (world.id === 7 || (world.id === 20 && gimmick === 'MAGNET')) {
      targets.magnet = 1 + (id % 2);
      targets.normal = 12 + (id % 4);
      archetypeTitle = '磁吸衝刺';
      archetypeSubtitle = `🧲 ⏳ ${timeLimit}秒限時！磁石珍珠吸取滿屏果實`;
    } else if (world.id === 8 || (world.id === 20 && gimmick === 'ICE')) {
      iceTiles = generateIceTiles(id);
      targets.blue = 3 + (id % 2);
      targets.normal = 10 + (id % 4);
      archetypeTitle = '極地滑行';
      archetypeSubtitle = `❄️ ⏳ ${timeLimit}秒限時！在滑冰地面疾走採集冰藍果`;
    } else if (world.id === 9) {
      hasFogOfWar = true;
      fogRadius = 4.2;
      targets.golden = 2;
      targets.normal = 10 + (id % 4);
      archetypeTitle = '破霧疾行';
      archetypeSubtitle = `🫐 ⏳ ${timeLimit}秒限時！在迷霧中奪取發光果爭分奪秒`;
    } else if (world.id === 10 || (world.id === 20 && gimmick === 'BOMB')) {
      hasBombs = true;
      bombCountdownSeconds = 12;
      targets.bombs = 1 + (id % 2);
      targets.normal = 8 + (id % 4);
      archetypeTitle = '火線拆彈';
      archetypeSubtitle = `💣 ⏳ ${timeLimit}秒限時！緊急拆除 ${targets.bombs} 枚定時炸彈`;
    } else if (world.id === 11 || (world.id === 20 && gimmick === 'COLOR_SEQUENCE')) {
      colorSequence = ['RED', 'BLUE', 'GREEN'];
      targets.colorSequenceCount = 1 + (id % 2);
      targets.normal = 6;
      archetypeTitle = '光速節奏';
      archetypeSubtitle = `🎯 ⏳ ${timeLimit}秒限時！疾速紅藍綠順序連擊`;
    } else if (world.id === 12) {
      colorGates = generateColorGates(id);
      targets.blue = 3;
      targets.green = 3;
      targets.normal = 6;
      archetypeTitle = '彩閘疾行';
      archetypeSubtitle = `🎨 ⏳ ${timeLimit}秒限時！變換體色穿梭彩色閘門`;
    } else if (world.id === 13) {
      maxTurns = 32;
      targets.normal = 10;
      targets.golden = 2;
      archetypeTitle = '限步疾行';
      archetypeSubtitle = `🔄 ⏳ ${timeLimit}秒限時且限制 ${maxTurns} 次轉向！`;
    } else if (world.id === 14) {
      hasReverse = true;
      targets.normal = 10 + (id % 4);
      targets.golden = 2;
      archetypeTitle = '時空逆行';
      archetypeSubtitle = `⏪ ⏳ ${timeLimit}秒限時！拾取逆轉齒輪倒退脫困`;
    } else if (world.id === 15) {
      targets.keys = 1 + (id % 2);
      targets.golden = 2;
      targets.normal = 8;
      archetypeTitle = '秘庫劫掠';
      archetypeSubtitle = `🗝️ ⏳ ${timeLimit}秒限時！奪取 ${targets.keys} 把鑰匙打開秘庫奪寶`;
    } else if (world.id === 16) {
      hasPortals = true;
      portals = [{ x: 4, y: 7 }, { x: 15, y: 21 }];
      iceTiles = generateIceTiles(id);
      targets.portals = 2;
      targets.normal = 10;
      archetypeTitle = '天宮躍遷';
      archetypeSubtitle = `🌀 ⏳ ${timeLimit}秒限時！雙門躍遷與冰面滑行`;
    } else if (world.id === 17) {
      hasFogOfWar = true;
      fogRadius = 4.0;
      hasBombs = true;
      bombCountdownSeconds = 14;
      targets.bombs = 1;
      targets.normal = 8;
      archetypeTitle = '暗夜火線';
      archetypeSubtitle = `💣 ⏳ ${timeLimit}秒限時！黑夜濃霧緊急拆彈`;
    } else if (world.id === 18) {
      hasGhost = true;
      hasReverse = true;
      targets.normal = 10;
      targets.golden = 2;
      archetypeTitle = '幻影逆轉';
      archetypeSubtitle = `👻 ⏳ ${timeLimit}秒限時！幽靈穿牆與倒後換位`;
    } else if (world.id === 19) {
      targets.chili = 1;
      targets.dragonEgg = 1;
      targets.normal = 8;
      archetypeTitle = '巨龍奪蛋';
      archetypeSubtitle = `🐲 ⏳ ${timeLimit}秒限時！吃辣椒化身火龍搶奪巨龍蛋`;
    } else {
      targets.normal = 12 + (id % 6);
      targets.golden = 2 + (id % 2);
    }
  } else if (archetype === 3) {
    // 3: SURVIVAL_EVASION - Dodge & Stay Alive with Defensive Items
    const surviveSecs = 24 + (id % 6);
    targets.surviveSeconds = surviveSecs;
    targets.normal = 8 + (id % 4);
    archetypeTitle = '險境生存';
    archetypeSubtitle = `⏱️ 維持生存 ${surviveSecs} 秒！在包圍中游刃有餘`;

    if (world.id === 4) {
      targets.chili = 1;
      archetypeTitle = '烈焰生存';
      archetypeSubtitle = `🌶️ 吃火辣椒烈焰護體！生存 ${surviveSecs} 秒並收集果實`;
    } else if (world.id === 5) {
      targets.lightning = 1;
      archetypeTitle = '脈衝避險';
      archetypeSubtitle = `⚡ 吞食超頻核心釋放 EMP 癱瘓機械蛇！生存 ${surviveSecs} 秒`;
    } else if (world.id === 6) {
      hasGhost = true;
      targets.shield = 1;
      archetypeTitle = '虛靈避險';
      archetypeSubtitle = `👻 拾取幽靈穿透避開巡邏蛇！生存 ${surviveSecs} 秒`;
    } else if (world.id === 7) {
      targets.magnet = 1;
      archetypeTitle = '引力避險';
      archetypeSubtitle = `🧲 磁石吸取果實避險！生存 ${surviveSecs} 秒`;
    } else if (world.id === 9) {
      hasFogOfWar = true;
      fogRadius = 4.2;
      archetypeTitle = '暗夜求生';
      archetypeSubtitle = `🫐 濃霧中吃發光果避險，生存 ${surviveSecs} 秒`;
    } else if (world.id === 10) {
      hasBombs = true;
      bombCountdownSeconds = 12;
      targets.bombs = 1;
      targets.normal = 6;
      archetypeTitle = '爆破求生';
      archetypeSubtitle = `💣 生存 ${surviveSecs} 秒並及時拆除定時炸彈`;
    } else if (world.id === 14) {
      hasReverse = true;
      archetypeTitle = '逆向求生';
      archetypeSubtitle = `⏪ 善用倒後檔反向避開阻礙，生存 ${surviveSecs} 秒`;
    } else if (world.id === 17) {
      hasFogOfWar = true;
      fogRadius = 4.0;
      hasBombs = true;
      bombCountdownSeconds = 14;
      targets.bombs = 1;
      targets.normal = 6;
      archetypeTitle = '暗夜拆彈求生';
      archetypeSubtitle = `💣 濃霧中生存 ${surviveSecs} 秒並及時拆彈`;
    } else if (world.id === 18) {
      hasGhost = true;
      hasReverse = true;
      archetypeTitle = '虛實避險';
      archetypeSubtitle = `👻 幽靈穿牆與倒後避險，生存 ${surviveSecs} 秒`;
    }
  } else if (archetype === 4) {
    // 4: MULTI_COLOR_BANQUET - Symphony of Fruit Colors with World Mechanics
    targets.normal = 8 + (id % 5);
    targets.blue = 4 + (id % 3);
    targets.green = 4 + (id % 3);
    targets.golden = 2;
    archetypeTitle = '多色和弦';
    archetypeSubtitle = `🌈 採集紅、藍、青、金四色果實大豐收`;

    if (world.id === 3) {
      targets.rainbow = 1 + (id % 2);
      archetypeTitle = '彩虹糖宴';
      archetypeSubtitle = `🍭 吃彩虹糖享4倍連擊，四色果實大豐收`;
    } else if (world.id === 5) {
      targets.lightning = 1;
      archetypeTitle = '霓虹電光宴';
      archetypeSubtitle = `⚡ 超頻引力吸附，四色果實大豐收`;
    } else if (world.id === 11 || (world.id === 20 && gimmick === 'COLOR_SEQUENCE')) {
      colorSequence = ['RED', 'BLUE', 'GREEN'];
      targets.colorSequenceCount = 2;
      targets.normal = 6;
      archetypeTitle = '三色律動';
      archetypeSubtitle = `🎯 嚴格遵循紅→藍→綠色彩順序品嚐果實`;
    } else if (world.id === 12) {
      colorGates = generateColorGates(id);
      archetypeTitle = '彩閘盛宴';
      archetypeSubtitle = `🎨 變換體色穿梭彩色閘門，享受果園盛宴`;
    } else if (world.id === 13) {
      maxTurns = 28;
      archetypeTitle = '算步盛宴';
      archetypeSubtitle = `🔄 限制 ${maxTurns} 次轉向！四色果實大豐收`;
    } else if (world.id === 15) {
      targets.keys = 1;
      targets.golden = 3;
      archetypeTitle = '秘寶盛宴';
      archetypeSubtitle = `🗝️ 撿金光鑰匙打開秘庫，掠奪各色珍果`;
    } else if (world.id === 19) {
      targets.chili = 1;
      targets.dragonEgg = 1;
      archetypeTitle = '龍巢盛宴';
      archetypeSubtitle = `🐲 吃辣椒化身火龍搶奪巨龍蛋與閃耀金果`;
    }
  } else {
    // 5: LABYRINTH_BREAKER - Tight Mazes with Signature Gimmicks Integrated
    const targetLength = 14 + (id % 7);
    targets.length = targetLength;
    targets.normal = 10 + (id % 5);
    targets.golden = 2;
    archetypeTitle = '迷宮突圍';
    archetypeSubtitle = `🐍 在狹窄迷宮中成長，蛇身長度達到 ${targetLength} 節`;

    if (world.id === 2 || (world.id === 20 && gimmick === 'PORTAL')) {
      hasPortals = true;
      portals = [{ x: 3, y: 8 }, { x: 16, y: 20 }];
      targets.portals = 2;
      targets.normal = 8;
      archetypeTitle = '空間迷陣';
      archetypeSubtitle = `🌀 穿梭傳送門破除迷陣，身長達到 ${targetLength} 節`;
    } else if (world.id === 3) {
      targets.rainbow = 1 + (id % 2);
      targets.normal = 8;
      archetypeTitle = '糖果迷宮';
      archetypeSubtitle = `🍭 吃彩虹糖引發狂暴成長，身長達到 ${targetLength} 節`;
    } else if (world.id === 4) {
      targets.chili = 1 + (id % 2);
      targets.normal = 8;
      archetypeTitle = '熔岩破陣';
      archetypeSubtitle = `🌶️ 吃火之辣椒破除熔岩石柱，身長達到 ${targetLength} 節`;
    } else if (world.id === 5) {
      targets.lightning = 1 + (id % 2);
      targets.normal = 8;
      archetypeTitle = '矩陣突圍';
      archetypeSubtitle = `⚡ 吃超頻核心衝破光柵迷陣，身長達到 ${targetLength} 節`;
    } else if (world.id === 6) {
      hasGhost = true;
      targets.shield = 1;
      targets.normal = 8;
      archetypeTitle = '幽冥穿牆';
      archetypeSubtitle = `👻 化身虛靈穿透迷宮石牆，身長達到 ${targetLength} 節`;
    } else if (world.id === 7 || (world.id === 20 && gimmick === 'MAGNET')) {
      targets.magnet = 1 + (id % 2);
      targets.normal = 8;
      archetypeTitle = '引力迷城';
      archetypeSubtitle = `🧲 磁石珍珠引力吸取迷宮果實，身長達到 ${targetLength} 節`;
    } else if (world.id === 8 || (world.id === 20 && gimmick === 'ICE')) {
      iceTiles = generateIceTiles(id);
      targets.normal = 8;
      archetypeTitle = '冰封迷宮';
      archetypeSubtitle = `❄️ 冰封滑道穿梭突圍，身長達到 ${targetLength} 節`;
    } else if (world.id === 9) {
      hasFogOfWar = true;
      fogRadius = 4.2;
      targets.normal = 8;
      archetypeTitle = '黑夜迷蹤';
      archetypeSubtitle = `🫐 黑暗迷宮中尋覓發光莓果，身長達到 ${targetLength} 節`;
    } else if (world.id === 10 || (world.id === 20 && gimmick === 'BOMB')) {
      hasBombs = true;
      bombCountdownSeconds = 12;
      targets.bombs = 1 + (id % 2);
      targets.normal = 6;
      archetypeTitle = '雷區迷宮';
      archetypeSubtitle = `💣 在迷宮深處拆除定時炸彈，身長達到 ${targetLength} 節`;
    } else if (world.id === 11 || (world.id === 20 && gimmick === 'COLOR_SEQUENCE')) {
      colorSequence = ['RED', 'BLUE', 'GREEN'];
      targets.colorSequenceCount = 1 + (id % 2);
      targets.normal = 6;
      archetypeTitle = '稜鏡迷宮';
      archetypeSubtitle = `🎯 迷宮中按紅藍綠順序進食，身長達到 ${targetLength} 節`;
    } else if (world.id === 12) {
      colorGates = generateColorGates(id);
      targets.blue = 3;
      targets.green = 3;
      targets.normal = 6;
      archetypeTitle = '彩閘迷城';
      archetypeSubtitle = `🎨 變色穿過彩色門禁，迷宮中身長達到 ${targetLength} 節`;
    } else if (world.id === 13) {
      maxTurns = 26;
      targets.normal = 8;
      archetypeTitle = '算步迷宮';
      archetypeSubtitle = `🔄 限制 ${maxTurns} 次轉向突圍迷宮，身長達到 ${targetLength} 節`;
    } else if (world.id === 14) {
      hasReverse = true;
      targets.normal = 8;
      archetypeTitle = '逆轉死角';
      archetypeSubtitle = `⏪ 迷宮死角拾取逆轉齒輪脫困，身長達到 ${targetLength} 節`;
    } else if (world.id === 15) {
      targets.keys = 1 + (id % 2);
      targets.normal = 8;
      archetypeTitle = '秘庫迷宮';
      archetypeSubtitle = `🗝️ 尋找鑰匙打開迷宮閘門，身長達到 ${targetLength} 節`;
    } else if (world.id === 16) {
      hasPortals = true;
      portals = [{ x: 4, y: 7 }, { x: 15, y: 21 }];
      iceTiles = generateIceTiles(id);
      targets.portals = 2;
      targets.normal = 8;
      archetypeTitle = '天宮迷陣';
      archetypeSubtitle = `🌀 雙門傳送與冰面滑行突圍，身長達到 ${targetLength} 節`;
    } else if (world.id === 17) {
      hasFogOfWar = true;
      fogRadius = 4.0;
      hasBombs = true;
      bombCountdownSeconds = 14;
      targets.bombs = 1;
      targets.normal = 6;
      archetypeTitle = '暗夜雷陣';
      archetypeSubtitle = `💣 濃霧迷宮摸黑拆彈，身長達到 ${targetLength} 節`;
    } else if (world.id === 18) {
      hasGhost = true;
      hasReverse = true;
      targets.normal = 8;
      archetypeTitle = '虛實迷宮';
      archetypeSubtitle = `👻 幽靈穿牆與倒後換位破除迷陣，身長達到 ${targetLength} 節`;
    } else if (world.id === 19) {
      targets.chili = 1;
      targets.dragonEgg = 1;
      targets.normal = 8;
      archetypeTitle = '龍巢破陣';
      archetypeSubtitle = `🐲 辣椒破障深入古龍巢奪蛋，身長達到 ${targetLength} 節`;
    }
  }

  // Obstacle selection (uses all 24 patterns with smooth variation)
  const hasObstacles = archetype === 5 || (id >= 4 && (id % 2 === 0 || id % 3 === 0));
  const mazeIndices = [4, 9, 10, 11, 12, 14, 15, 20, 21];
  const patternIndex = archetype === 5
    ? mazeIndices[(id * 5 + 3) % mazeIndices.length] // favor maze-like layouts
    : (id * 7 + worldIndex * 3) % OBSTACLE_PATTERNS.length;
  const obstacleType = hasObstacles ? OBSTACLE_PATTERNS[patternIndex] : undefined;

  // Patrol snakes count
  let rovingSnakesCount = 0;
  let rovingSnakeSpeed: LevelMission['rovingSnakeSpeed'] = 'SLOW';

  if (world.id === 5 || archetype === 3 || id % 4 === 0 || id % 7 === 0) {
    rovingSnakesCount = worldIndex >= 10 ? 2 : 1;
    rovingSnakeSpeed = worldIndex >= 12 ? 'NORMAL' : 'SLOW';
  }

  // 增加遊戲難度 & 加快無聊關卡蛇速 (Snake Speed Tuning):
  // 1. 無障礙/純吃果實的無聊關卡：加快蛇速至 FAST (100-104ms)，節奏明快刺激，考驗手速與靈活走位！
  // 2. 急速衝刺 (Archetype 2 / 限時關)：加速至 VERY_FAST (88-94ms)，真正體現飆速衝刺感！
  // 3. 賽博光網 (World 5)：全地圖電磁超頻，蛇速飆升至 VERY_FAST (90-95ms)！
  // 4. 險境生存 (Archetype 3)：蛇速 FAST (96-100ms)，敏捷躲避巡邏蛇！
  // 5. 後期世界 (World 11-20)：隨關卡推進難度梯次提升，終極世界進入 80-88ms 極限反應模式！
  const isPlainLevel = !hasObstacles && rovingSnakesCount === 0;
  const isSpeedRush = archetype === 2 || Boolean(timeLimit);
  const isSurvival = archetype === 3 || Boolean(targets.surviveSeconds);
  const isCyberWorld = world.id === 5;
  const isVolcanoOrBomb = world.id === 4 || world.id === 10 || world.id === 17;
  const isEndgameWorld = world.id >= 16;

  let snakeSpeed: LevelMission['snakeSpeed'] = 'NORMAL';
  let baseSpeedMs = Math.max(82, 115 - worldIndex * 1.5);

  if (isSpeedRush) {
    snakeSpeed = 'VERY_FAST';
    baseSpeedMs = Math.max(76, 92 - Math.floor(worldIndex * 0.8));
  } else if (isCyberWorld) {
    snakeSpeed = 'TURBO';
    baseSpeedMs = Math.max(66, 72 - Math.floor(indexInWorld * 0.3));
  } else if (isEndgameWorld) {
    snakeSpeed = archetype === 2 ? 'TURBO' : 'VERY_FAST';
    baseSpeedMs = Math.max(72, 84 - Math.floor((id - 300) * 0.08));
  } else if (isSurvival) {
    snakeSpeed = 'FAST';
    baseSpeedMs = Math.max(80, 98 - Math.floor(worldIndex * 0.7));
  } else if (isVolcanoOrBomb) {
    snakeSpeed = 'FAST';
    baseSpeedMs = Math.max(82, 100 - Math.floor(worldIndex * 0.7));
  } else if (isPlainLevel) {
    // 解決無聊感：無障礙關卡蛇速顯著加快，避免慢吞吞無趣爬行
    snakeSpeed = 'FAST';
    baseSpeedMs = Math.max(84, 102 - Math.floor(worldIndex * 0.8));
  } else if (worldIndex >= 10) {
    snakeSpeed = 'FAST';
    baseSpeedMs = Math.max(82, 96 - Math.floor((worldIndex - 10) * 1.1));
  }

  // Calculate Reward Coins strictly scaling to max 500
  const rewardCoins = calculateLevelRewardCoins({
    id,
    hasObstacles,
    obstacleType,
    rovingSnakesCount,
    rovingSnakeSpeed,
    timeLimit,
    targets,
  });

  // Strict mechanic synchronization guards:
  // 1. Color sequence MUST only be set if the mission actually targets colorSequenceCount!
  if (!targets.colorSequenceCount || targets.colorSequenceCount <= 0) {
    colorSequence = undefined;
  } else {
    colorSequence = ['RED', 'BLUE', 'GREEN'];
    gimmick = 'COLOR_SEQUENCE';
  }

  // 2. Bombs MUST only be active if targets.bombs is set or level is a designated Bomb mission
  if (!targets.bombs || targets.bombs <= 0) {
    if (gimmick !== 'BOMB') {
      hasBombs = false;
      bombCountdownSeconds = undefined;
    }
  }

  // 3. Keep gimmick in sync with active mechanics:
  if (gimmick === 'NONE' || gimmick === 'TURN_LIMIT') {
    if (colorSequence) gimmick = 'COLOR_SEQUENCE';
    else if (colorGates && colorGates.length > 0) gimmick = 'COLOR_GATE';
    else if (hasBombs) gimmick = 'BOMB';
    else if (targets.keys) gimmick = 'KEY_LOCK';
    else if (hasReverse) gimmick = 'REVERSE';
    else if (hasGhost) gimmick = 'GHOST';
    else if (targets.chili) gimmick = 'CHILI';
    else if (targets.rainbow) gimmick = 'RAINBOW';
    else if (targets.magnet) gimmick = 'MAGNET';
    else if (targets.dragonEgg) gimmick = 'DRAGON_EGG';
    else if (targets.lightning) gimmick = 'LIGHTNING';
    else if (hasPortals) gimmick = 'PORTAL';
    else if (iceTiles && iceTiles.length > 0) gimmick = 'ICE';
    else if (hasFogOfWar) gimmick = 'FOG';
    else if (maxTurns) gimmick = 'TURN_LIMIT';
  }

  // World-specific title & subtitle selection
  const worldThemes = WORLD_TITLE_THEMES[world.id] || WORLD_TITLE_THEMES[1];
  const titleCore = worldThemes.titles[indexInWorld % worldThemes.titles.length];
  const title = `${titleCore} · ${archetypeTitle}`;
  let subtitle = archetypeSubtitle;
  if (isSpeedRush || snakeSpeed === 'VERY_FAST' || snakeSpeed === 'TURBO') {
    subtitle = `⚡ 疾風速 · ${subtitle}`;
  } else if (snakeSpeed === 'FAST' && isPlainLevel) {
    subtitle = `⚡ 疾速挑戰 · ${subtitle}`;
  }

  let description = `在【${world.name['zh-HK']}】展開冒險！${subtitle}。`;
  if (hasPortals) description += '善用雙向翡翠傳送門，瞬間轉移陣地！';
  if (hasBombs) description += '地圖上有計時炸彈，在倒數歸零前吃掉拆除！';
  if (hasGhost) description += '拾取幽靈道具短暫穿過身體與石牆解圍！';
  if (targets.lightning || gimmick === 'LIGHTNING') description += '拾取電磁超頻核心，觸發 52ms 超光速電光衝刺、EMP癱瘓巡邏機械蛇與電磁引力！';
  if (iceTiles && iceTiles.length > 0) description += '踩上滑冰地面會一直滑到撞障礙才停下！';
  if (hasFogOfWar) description += '夜間迷霧籠罩，只有身邊可見，尋找發光果探路！';
  if (colorSequence) description += '必須按紅綠藍順序進食，解開彩色機關！';
  if (maxTurns) description += `精打細算每一次轉向，在 ${maxTurns} 步內完成！`;
  if (hasReverse) description += '利用倒後檔讓尾巴變蛇頭，擺脫死角！';
  if (rovingSnakesCount > 0) description += `小心場上有 ${rovingSnakesCount} 條巡邏蛇阻擾！`;
  description += '靈活走位，奪下滿星勝利！';

  return {
    id,
    title,
    subtitle,
    description,
    targets,
    timeLimit,
    hasObstacles,
    obstacleType,
    rovingSnakesCount,
    rovingSnakeSpeed,
    snakeSpeed,
    baseSpeedMs,
    rewardCoins,
    worldId: world.id,
    worldName: world.name['zh-HK'],
    hasPortals,
    portals,
    gimmick,
    hasGhost,
    hasFogOfWar,
    fogRadius,
    iceTiles,
    hasBombs,
    bombCountdownSeconds,
    colorSequence,
    colorGates,
    maxTurns,
    hasReverse,
  };
};

// Handcrafted first 20 missions (World 1: 萌新森之島) for smooth, 100% bug-free onboarding
const HANDCRAFTED_EARLY_MISSIONS: LevelMission[] = [
  {
    id: 1,
    title: '初出茅廬',
    subtitle: '熟悉滑動轉向基礎',
    description: '最簡單的入門試煉，在場上收集 10 個經典紅蘋果！',
    targets: { normal: 10 },
    rewardCoins: 50,
    worldId: 1,
    worldName: '萌新森之島',
    gimmick: 'NONE',
    snakeSpeed: 'NORMAL',
    baseSpeedMs: 115,
  },
  {
    id: 2,
    title: '雙色果園',
    subtitle: '彩色蘋果初登場',
    description: '收集 3 個清涼藍色蘋果與 8 個翠綠青色蘋果！',
    targets: { blue: 3, green: 8 },
    rewardCoins: 55,
    worldId: 1,
    worldName: '萌新森之島',
    gimmick: 'NONE',
    snakeSpeed: 'NORMAL',
    baseSpeedMs: 112,
  },
  {
    id: 3,
    title: '黃金誘惑',
    subtitle: '⚡ 疾速挑戰 · 搶吃閃耀金蘋果',
    description: '吃掉 2 個珍貴的金色蘋果與 12 個紅色蘋果！加快步伐奪金！',
    targets: { golden: 2, normal: 12 },
    rewardCoins: 65,
    worldId: 1,
    worldName: '萌新森之島',
    gimmick: 'NONE',
    snakeSpeed: 'FAST',
    baseSpeedMs: 106,
  },
  {
    id: 4,
    title: '迷宮突圍',
    subtitle: '小心石柱障礙',
    description: '地圖出現石柱障礙牆壁，靈巧走位避開障礙並收集 14 個蘋果！',
    hasObstacles: true,
    obstacleType: 'PILLARS',
    targets: { normal: 14 },
    rewardCoins: 75,
    worldId: 1,
    worldName: '萌新森之島',
    gimmick: 'NONE',
    snakeSpeed: 'NORMAL',
    baseSpeedMs: 110,
  },
  {
    id: 5,
    title: '影蛇初現',
    subtitle: '小心巡邏阻礙蛇！',
    description: '場上出現徘徊巡邏的阻礙影蛇！注意別撞到它，安全收集 12 個紅蘋果與 4 個青蘋果！',
    rovingSnakesCount: 1,
    rovingSnakeSpeed: 'SLOW',
    targets: { normal: 12, green: 4 },
    rewardCoins: 85,
    worldId: 1,
    worldName: '萌新森之島',
    gimmick: 'NONE',
    snakeSpeed: 'NORMAL',
    baseSpeedMs: 108,
  },
  {
    id: 6,
    title: '巨蟒成長',
    subtitle: '⚡ 疾速修煉 · 蛇身成長挑戰',
    description: '加快行進節奏，讓蛇身長度迅速成長達到 10 節，並收集 8 個蘋果！',
    targets: { length: 10, normal: 8 },
    rewardCoins: 90,
    worldId: 1,
    worldName: '萌新森之島',
    gimmick: 'NONE',
    snakeSpeed: 'FAST',
    baseSpeedMs: 102,
  },
  {
    id: 7,
    title: '晨曦疾行',
    subtitle: '⚡ 疾風極速 · ⏳ 35秒衝刺',
    description: '分秒必爭！極速衝刺！在 35 秒限時內奪得 12 個紅蘋果與 2 個金蘋果，進食可加時！',
    timeLimit: 35,
    targets: { normal: 12, golden: 2 },
    rewardCoins: 95,
    worldId: 1,
    worldName: '萌新森之島',
    gimmick: 'NONE',
    snakeSpeed: 'VERY_FAST',
    baseSpeedMs: 92,
  },
  {
    id: 8,
    title: '三色果實盛宴',
    subtitle: '⚡ 疾速大胃王 · 紅藍青三色盛宴',
    description: '森林果實大豐收！快節奏品嚐 8 個紅蘋果、4 個藍蘋果與 4 個青蘋果！',
    targets: { normal: 8, blue: 4, green: 4 },
    rewardCoins: 100,
    worldId: 1,
    worldName: '萌新森之島',
    gimmick: 'NONE',
    snakeSpeed: 'FAST',
    baseSpeedMs: 100,
  },
  {
    id: 9,
    title: '護盾避障',
    subtitle: '拾取法球化險為夷',
    description: '拾取 2 個護盾法球獲得無敵防護，並收集 12 個紅蘋果！',
    hasObstacles: true,
    obstacleType: 'CORNERS',
    targets: { shield: 2, normal: 12 },
    rewardCoins: 105,
    worldId: 1,
    worldName: '萌新森之島',
    gimmick: 'NONE',
    snakeSpeed: 'FAST',
    baseSpeedMs: 104,
  },
  {
    id: 10,
    title: '翡翠藤蔓巨蟒',
    subtitle: '👑 萌新森林守護長 · 領主阻擊戰',
    description: '萌新森林守護長現身！在石柱叢林中避開巨蟒巡邏，身長達到 14 節並收集 14 個蘋果！',
    isBossLevel: true,
    bossName: '翡翠藤蔓巨蟒',
    bossTitle: '萌新森林守護長',
    bossAvatar: '🐍',
    hasObstacles: true,
    obstacleType: 'PILLARS',
    rovingSnakesCount: 1,
    rovingSnakeSpeed: 'NORMAL',
    targets: { normal: 14, length: 14 },
    rewardCoins: 130,
    worldId: 1,
    worldName: '萌新森之島',
    gimmick: 'BOSS',
    snakeSpeed: 'FAST',
    baseSpeedMs: 98,
  },
  {
    id: 11,
    title: '十字石陣',
    subtitle: '青藍共舞穿梭',
    description: '穿梭十字石林，收集 12 個紅蘋果、4 個藍蘋果與 2 個閃耀金蘋果！',
    hasObstacles: true,
    obstacleType: 'CROSS',
    targets: { normal: 12, blue: 4, golden: 2 },
    rewardCoins: 110,
    worldId: 1,
    worldName: '萌新森之島',
    gimmick: 'NONE',
    snakeSpeed: 'FAST',
    baseSpeedMs: 102,
  },
  {
    id: 12,
    title: '雙影徘徊',
    subtitle: '雙蛇夾擊靈巧規避',
    description: '場上同時出現 2 條巡邏影蛇！冷靜閃避並收集 14 個紅蘋果與 5 個青蘋果！',
    rovingSnakesCount: 2,
    rovingSnakeSpeed: 'SLOW',
    targets: { normal: 14, green: 5 },
    rewardCoins: 120,
    worldId: 1,
    worldName: '萌新森之島',
    gimmick: 'NONE',
    snakeSpeed: 'FAST',
    baseSpeedMs: 102,
  },
  {
    id: 13,
    title: '步步為營',
    subtitle: '🔄 限制 26 次轉向！精算路線',
    description: '限制 26 次轉向！每走一步都精打細算，走長直線避開無謂轉向，收集 10 個紅蘋果與 2 個金蘋果！',
    gimmick: 'TURN_LIMIT',
    maxTurns: 26,
    targets: { normal: 10, golden: 2 },
    rewardCoins: 125,
    worldId: 1,
    worldName: '萌新森之島',
    snakeSpeed: 'NORMAL',
    baseSpeedMs: 108,
  },
  {
    id: 14,
    title: '森林生存者',
    subtitle: '⏱️ 疾走閃避 · 維持生存 25 秒',
    description: '影蛇徘徊巡邏！在充滿危機的森林中快節奏遊走存活 25 秒並收集 8 個蘋果！',
    rovingSnakesCount: 1,
    rovingSnakeSpeed: 'SLOW',
    targets: { surviveSeconds: 25, normal: 8 },
    rewardCoins: 130,
    worldId: 1,
    worldName: '萌新森之島',
    gimmick: 'NONE',
    snakeSpeed: 'FAST',
    baseSpeedMs: 98,
  },
  {
    id: 15,
    title: '靈巧游弋',
    subtitle: '蜿蜒通道採集',
    description: '穿過曲折蜿蜒通道，收集 12 個紅蘋果、4 個藍蘋果與 4 個青蘋果！',
    hasObstacles: true,
    obstacleType: 'SERPENTINE',
    targets: { normal: 12, blue: 4, green: 4 },
    rewardCoins: 135,
    worldId: 1,
    worldName: '萌新森之島',
    gimmick: 'NONE',
    snakeSpeed: 'FAST',
    baseSpeedMs: 102,
  },
  {
    id: 16,
    title: '極速狂飆',
    subtitle: '⚡ 疾風暴走 · ⏳ 35秒衝刺',
    description: '極速衝刺！在 35 秒限時內以狂暴蛇速將蛇身擴展至 14 節，並奪取 3 個金蘋果！',
    timeLimit: 35,
    targets: { normal: 14, golden: 3, length: 14 },
    rewardCoins: 140,
    worldId: 1,
    worldName: '萌新森之島',
    gimmick: 'NONE',
    snakeSpeed: 'VERY_FAST',
    baseSpeedMs: 90,
  },
  {
    id: 17,
    title: '密林深處',
    subtitle: '箱型迷陣避障',
    description: '在封閉石箱間穿行，避開巡邏影蛇，收集 12 個紅蘋果、4 個青蘋果與 2 個金蘋果！',
    hasObstacles: true,
    obstacleType: 'BOX',
    rovingSnakesCount: 1,
    rovingSnakeSpeed: 'SLOW',
    targets: { normal: 12, green: 4, golden: 2 },
    rewardCoins: 145,
    worldId: 1,
    worldName: '萌新森之島',
    gimmick: 'NONE',
    snakeSpeed: 'FAST',
    baseSpeedMs: 100,
  },
  {
    id: 18,
    title: '三色和弦',
    subtitle: '⚡ 疾速狂宴 · 全色系匯聚',
    description: '森林果實極致匯聚！以敏捷速度品嚐 10 個紅蘋果、5 個藍蘋果、5 個青蘋果與 2 個金蘋果！',
    targets: { normal: 10, blue: 5, green: 5, golden: 2 },
    rewardCoins: 150,
    worldId: 1,
    worldName: '萌新森之島',
    gimmick: 'NONE',
    snakeSpeed: 'FAST',
    baseSpeedMs: 98,
  },
  {
    id: 19,
    title: '決戰前夕',
    subtitle: '巨身修為雙蛇考驗',
    description: '雙蛇巡遊護衛！挑戰蛇身成長極限達到 16 節，並收集 14 個紅蘋果與 4 個藍蘋果！',
    hasObstacles: true,
    obstacleType: 'DOUBLE_GATE',
    rovingSnakesCount: 2,
    rovingSnakeSpeed: 'SLOW',
    targets: { length: 16, normal: 14, blue: 4 },
    rewardCoins: 160,
    worldId: 1,
    worldName: '萌新森之島',
    gimmick: 'NONE',
    snakeSpeed: 'FAST',
    baseSpeedMs: 96,
  },
  {
    id: 20,
    title: '碧玉千鱗石龍',
    subtitle: '👑 翡翠石林霸主 · 世界終極大決戰',
    description: '萌新森林最終守護石龍降臨！在傳送巨石陣中與雙龍周旋，達到 16 節蛇身並採集 16 個紅蘋果！',
    isBossLevel: true,
    bossName: '碧玉千鱗石龍',
    bossTitle: '翡翠石林霸主',
    bossAvatar: '🐉',
    hasObstacles: true,
    obstacleType: 'PORTAL_GATE',
    rovingSnakesCount: 2,
    rovingSnakeSpeed: 'NORMAL',
    hasPortals: true,
    portals: [{ x: 3, y: 14 }, { x: 16, y: 14 }],
    targets: { normal: 16, length: 16, golden: 3 },
    rewardCoins: 200,
    worldId: 1,
    worldName: '萌新森之島',
    gimmick: 'BOSS',
    snakeSpeed: 'VERY_FAST',
    baseSpeedMs: 92,
  },
];

// Generate full array of 400 missions with rewards scaled by difficulty and capped at 500 coins max
export const LEVEL_MISSIONS: LevelMission[] = Array.from({ length: 400 }, (_, index) => {
  const levelId = index + 1;
  const mission =
    levelId <= HANDCRAFTED_EARLY_MISSIONS.length
      ? HANDCRAFTED_EARLY_MISSIONS[levelId - 1]
      : generateNovelLevel(levelId);

  // 每逢第20關的boss關，如果有三條巡邏蛇，將佢變兩條蛇；第350關、第370關、第390關為2條
  const adjustedRovingSnakesCount =
    (levelId === 350 || levelId === 370 || levelId === 390)
      ? 2
      : (levelId % 20 === 0 && (mission.isBossLevel || mission.gimmick === 'BOSS') && mission.rovingSnakesCount === 3)
        ? 2
        : mission.rovingSnakesCount;

  return {
    ...mission,
    rovingSnakesCount: adjustedRovingSnakesCount,
    // Strict defense: max 500 coins
    rewardCoins: Math.min(500, Math.max(50, mission.rewardCoins)),
  };
});

export const getLevelConfig = (levelId: number): LevelMission => {
  const clamped = Math.max(1, Math.min(400, levelId));
  return LEVEL_MISSIONS.find((l) => l.id === clamped) || LEVEL_MISSIONS[0];
};

// Handcrafted first 20 missions English and Japanese titles
const HANDCRAFTED_LEVEL_TITLES_EN: Record<number, { title: string; subtitle: string }> = {
  1: { title: 'First Slither', subtitle: 'Master basic slithering and directional turns' },
  2: { title: 'Twin Apple Grove', subtitle: 'Collect refreshing blue and crisp green apples' },
  3: { title: 'Golden Apple Rush', subtitle: '⚡ Speed Rush · Snatch gleaming golden apples' },
  4: { title: 'Pillar Maze Breakout', subtitle: 'Maneuver around pillar obstacles and maze walls' },
  5: { title: 'Shadow Snake Lurking', subtitle: 'Beware of roaming patrol snakes in the arena!' },
  6: { title: 'Growth Spurt', subtitle: 'Devour red apples and grow your snake longer' },
  7: { title: 'Dawn Sprint', subtitle: '⚡ Lightning Sprint · Collect target fruits at pace' },
  8: { title: 'Tricolor Feast', subtitle: 'A colorful feast of red, blue and green apples' },
  9: { title: 'Aegis Shield Ward', subtitle: 'Pick up aegis shields to safely bounce off hazards' },
  10: { title: 'Jade Vine Python', subtitle: '👑 Starter Forest Guardian · Defeat the Jade Vine Python' },
  11: { title: 'Crossroads Maze', subtitle: 'Slither through the crossroads stone monoliths' },
  12: { title: 'Twin Shadows Patrol', subtitle: 'Dodge twin patrol snakes moving in harmony' },
  13: { title: 'Tactical Maneuver', subtitle: 'Deliberate movements · Slither safely to your targets' },
  14: { title: 'Forest Survivor', subtitle: 'Survive in the deep woods amidst prowling snakes' },
  15: { title: 'Agile Slithering', subtitle: 'Slender slithering through narrow forest alleys' },
  16: { title: 'Lightning Rush', subtitle: '⚡ Turbo Rush · High-speed fruit collection' },
  17: { title: 'Deep Forest Path', subtitle: 'Venture deeper into the wild forest' },
  18: { title: 'Chroma Symphony', subtitle: 'Collect all three apple varieties in balance' },
  19: { title: 'Eve of Showdown', subtitle: 'The final preparatory trial before the world boss' },
  20: { title: 'Jade Scale Wyrm', subtitle: '👑 Jade Grove Overlord · Showdown with Jade Scale Wyrm' },
};

const HANDCRAFTED_LEVEL_TITLES_JA: Record<number, { title: string; subtitle: string }> = {
  1: { title: '初陣スリザー', subtitle: 'スワイプ転向の基本をマスター' },
  2: { title: '二色果樹園', subtitle: '爽快な青リンゴと青翠リンゴを収集' },
  3: { title: '黄金の誘惑', subtitle: '⚡ スピード勝負・光る金リンゴを奪取' },
  4: { title: '石柱迷宮の突破', subtitle: '石柱の障害物を避けてリンゴを集めよう' },
  5: { title: '影蛇の徘徊', subtitle: '巡回する障害蛇にぶつからないよう注意！' },
  6: { title: '大蛇への成長', subtitle: 'リンゴを食べて体をぐんぐん伸ばそう' },
  7: { title: '朝焼けの疾走', subtitle: '⚡ 疾風ダッシュ・目標果実をすばやく収集' },
  8: { title: '三色フルーツ宴', subtitle: '赤・青・緑の三色フルーツをバランス良く獲得' },
  9: { title: 'シールド防御', subtitle: 'シールド玉を拾って無敵バリアで障害物を弾け' },
  10: { title: '翡翠ツル大蛇', subtitle: '👑 森の番人・翡翠ツル大蛇との決戦' },
  11: { title: '十字の石陣', subtitle: '十字の石陣迷宮をすり抜けろ' },
  12: { title: '二影の徘徊', subtitle: '2匹の巡回蛇の動きを見極めろ' },
  13: { title: '堅実なる進軍', subtitle: '慎重なコース取りで確実に目標を達成' },
  14: { title: '森林サバイバー', subtitle: '巡回蛇が蠢く森で生き残れ' },
  15: { title: '軽快なる遊泳', subtitle: '狭い森の通路を軽快にすり抜けろ' },
  16: { title: '電光石火の狂走', subtitle: '⚡ 爆速チャレンジ・高速スリザー' },
  17: { title: '密林の深奥', subtitle: 'さらに深い原生林の奥地へ' },
  18: { title: '三色の協奏曲', subtitle: '3種類のリンゴを集めて調和を奏でろ' },
  19: { title: '決戦前夜', subtitle: 'ボス戦前の最終調整試練' },
  20: { title: '碧玉の石鱗竜', subtitle: '👑 翡翠石林の覇者・碧玉の石鱗竜との大決戦' },
};

const ARCHETYPE_TITLES_EN = [
  'Special Vanguard',
  'Turn Precision',
  'Speed Sprint',
  'Survival Trial',
  'Chroma Symphony',
  'Labyrinth Heist',
];

const ARCHETYPE_TITLES_JA = [
  '異能の先鋒',
  '歩数計算',
  'スピードラッシュ',
  'サバイバル試練',
  '彩光シンフォニー',
  '迷宮トレジャー',
];

const WORLD_TITLE_THEMES_EN: Record<number, string[]> = {
  1: ['Green Sprout', 'Forest Fruit', 'Verdant Grove', 'Dawn Glow', 'Pine Trail', 'Brook Leap', 'Lush Haven', 'Tree Shade', 'Forest Outpost'],
  2: ['Stone Whisper', 'Jade Light', 'Space Rift', 'Portal Gateway', 'Jade Gallery', 'Chrono Jump', 'Monolith Maze', 'Jade Pillar', 'Dimensional Echo'],
  3: ['Sugar Wonder', 'Toffee Fudge', 'Rainbow Candy', 'Macaron Path', 'Cream Puff', 'Jelly Bounce', 'Crisp Cocoa', 'Sweet Labyrinth', 'Caramel Feast'],
  4: ['Boiling Magma', 'Core Heatwave', 'Fire Chili', 'Flame Sprint', 'Obsidian Stone', 'Molten Flare', 'Wild Sparks', 'Volcanic Rift', 'Inferno Rite'],
  5: ['Cyber City', 'Neon Rails', 'Overclock Pulse', 'Quantum Blade', 'Matrix Slither', 'Photon Surge', 'High-Voltage', 'Cyber Grid', 'Digital Storm'],
  6: ['Phantom Woods', 'Nether Glow', 'Ghost Passage', 'Shadow Veil', 'Ether Soul', 'Abyss Path', 'Haunted Rift', 'Phantom Dance', 'Specter Domain'],
  7: ['Ocean Trench', 'Tidal Wave', 'Magnet Pearl', 'Coral Forest', 'Aqua Vortex', 'Deep Current', 'Azure Abyss', 'Crystal Tide', 'Seabed Ruins'],
  8: ['Frost Glacier', 'Blizzard Gale', 'Ice Glide', 'Snow Drift', 'Frost Crystal', 'Frozen Peak', 'Aurora Ice', 'White Out', 'Glacial Chasm'],
  9: ['Mist Wood', 'Dark Hollow', 'Glow Berry', 'Night Veil', 'Shrouded Path', 'Dusk Shade', 'Silent Wood', 'Lantern Glow', 'Midnight Ridge'],
  10: ['Fuse Spark', 'Dynamite Cache', 'Clockwork Bomb', 'Blast Trench', 'Defusal Line', 'Hazard Vault', 'Detonation Point', 'Blast Wave', 'Thunder Mine'],
  11: ['Chroma Prism', 'RGB Spectrum', 'Rainbow Stream', 'Color Melody', 'Light Cascade', 'Prism Horizon', 'Vivid Bloom', 'Spectral Glow', 'Rainbow Arch'],
  12: ['Color Gate', 'Tricolor Barrier', 'Hue Shift', 'Chroma Sentry', 'Pigment Pass', 'Rainbow Gate', 'Kaleidoscope', 'Prism Gateway', 'Color Fortress'],
  13: ['Turn Limit', 'Calculated Move', 'Chessboard Grid', 'Precise Steps', 'Minimal Arc', 'Grid Tactician', 'Step Matrix', 'Geometry Path', 'Zero Error'],
  14: ['Reverse Gear', 'Tail Swapper', 'Chrono Invert', 'Backstep Loop', 'Tail Head Flip', 'Retrograde', 'Echo Slither', 'Reversal Zone', 'Counter Flow'],
  15: ['Vault Key', 'Golden Lock', 'Secret Vault', 'Keymaster Gate', 'Hidden Treasure', 'Locked Chamber', 'Master Key', 'Royal Cache', 'Ancient Door'],
  16: ['Sky Glacier', 'Portal Slide', 'Cloud Frost', 'Twin Gateway', 'Stratosphere', 'Ice Vortex', 'Warp Glide', 'Aerial Chasm', 'Glacial Leap'],
  17: ['Dark Detonation', 'Midnight Fuse', 'Foggy Blast', 'Shadow Defusal', 'Blind Demolition', 'Night Defusal', 'Phantom Spark', 'Obscured Mine', 'Dark Hazard'],
  18: ['Phantom Reversal', 'Spectral Loop', 'Ghost Backstep', 'Ether Invert', 'Phase Shift', 'Mirrored Ghost', 'Astral Rewind', 'Void Reversal', 'Shadow Loop'],
  19: ['Dragon Nest', 'Fire Egg Heist', 'Inferno Clutch', 'Drake Roar', 'Flame Hatchery', 'Molten Nest', 'Ancient Wyrm', 'Draconic Hoard', 'Dragonfire Peak'],
  20: ['Star Core', 'Genesis Domain', 'Omni Hazard', 'Cosmic Matrix', 'Celestial Nexus', 'Starlight Trial', 'Singularity Run', 'Eternal Apex', 'Grand Horizon'],
};

const WORLD_TITLE_THEMES_JA: Record<number, string[]> = {
  1: ['芽吹き', '森の青果', '青緑の秘境', '朝の陽ざし', '松ぼっくり巡り', '小川の跳躍', '緑の楽園', '木漏れ日', '森の哨所'],
  2: ['石碑の囁き', '翡翠の光', '空間の裂け目', 'ポータルゲート', '碧玉の回廊', '時空跳躍', '巨石の迷宮', '翡翠の柱', '次元共鳴'],
  3: ['砂糖の国', 'タフィーキャンディ', '虹色ドロップ', 'マカロン通り', 'シュークリーム', 'ゼリージャンプ', 'チョコクランチ', 'お菓子の迷宮', 'キャラメルの宴'],
  4: ['滾るマグマ', '地底の熱波', '灼熱唐辛子', '炎のダッシュ', '黒曜石の塊', '熔岩の炎', '火花散る道', '火山の亀裂', '炎獄の洗礼'],
  5: ['サイバーシティ', 'ネオンレール', 'パルス加速', '量子ブレード', 'マトリクス潜行', '光子チャージ', '高圧ゲート', 'サイバー防壁', 'デジタルの嵐'],
  6: ['幻影の森', '冥界の灯火', '幽霊の通り道', '影の帳', 'エーテルソウル', '深淵の小道', '怪奇の裂け目', '幻影の舞踏', '幽冥の領域'],
  7: ['海溝の深淵', '潮のうねり', '磁石真珠', '珊瑚の森', '深海の渦', '暗流の底', '碧海の奈落', '水晶の波濤', '海底の遺跡'],
  8: ['氷河の峰', '吹雪の突風', '氷上の滑走', '雪煙の道', '氷晶の輝き', '凍てつく頂', 'オーロラ氷壁', 'ホワイトアウト', '氷河の裂け目'],
  9: ['濃霧の森', '暗闇の窪地', '発光ベリー', '夜の帳', '霧深き小道', '夕闇の影', '静寂の森', '提灯の灯', '真夜中の稜線'],
  10: ['火花散る導火線', '爆薬の山', '時限爆弾', '爆風の溝', '解除の戦線', '危険な火薬庫', '起爆点', '爆圧の衝撃', '雷鳴の地雷'],
  11: ['プリズムの輝き', '三色スペクトル', '虹の奔流', '色彩の調べ', '光のカスケード', 'プリズムの地平', '極彩の開花', 'スペクトルの光芒', '虹の架け橋'],
  12: ['カラーゲート', '三色の障壁', '色相転換', '色彩の門番', '顔料の関所', 'レインボーゲート', '万華鏡の路', 'プリズム門', '色彩の要塞'],
  13: ['歩数制限', '計算された一手', 'チェス盤の目', '精密なる歩み', '最小旋回', '盤上の軍師', 'ステップの行列', '幾何の歩道', '失策ゼロ'],
  14: ['バックギア', '尾頭反転', '時空の逆行', '後退ループ', '反転スイッチ', 'レトロスリザー', '反響の走行', '逆転の回廊', 'カウンターフロー'],
  15: ['秘庫の鍵', '黄金の錠', '隠し宝物庫', '鍵守の門', '秘匿の財宝', '封じられし間', 'マスターキー', '王家の蔵', '古の扉'],
  16: ['天空の氷河', 'ポータルスライド', '雲海の凍土', '双子の門', '成層圏の風', '氷の渦巻き', 'ワープ滑走', '天空の深淵', '氷霜の飛躍'],
  17: ['暗闇の起爆', '真夜中の導火線', '霧中の爆破', '影の爆弾解除', '盲目の解体', '夜陰の解除班', '幻影の火花', '濃霧の地雷', '暗夜の危機'],
  18: ['幻影の逆走', '幽体のループ', 'ゴースト後退', '霊体の反転', '位相シフト', '鏡像の幽霊', 'アストラル巻き戻し', '虚無の逆転', '影の旋回'],
  19: ['巨竜の巣', '竜卵強奪', '紅蓮の産室', '竜の咆哮', '炎の孵化場', '熔火の古巣', 'エンシェントドレイク', '竜の財宝', '竜火の尖峰'],
  20: ['創世の核', '神話の領域', '万象の試練', '宇宙のマトリクス', '星辰の結節', '星光の試練', '特異点の激走', '永遠の頂', '大いなる地平'],
};

// Full 4-language localization generator for all 400 levels
export const getLocalizedLevel = (
  level: LevelMission,
  lang: 'zh-HK' | 'zh-CN' | 'en' | 'ja' = 'zh-HK'
): LevelMission => {
  const world = getWorldByLevelId(level.id);
  const localizedWorldName = world.name[lang] || world.name['zh-HK'];
  const bossDef = BOSS_DEFINITIONS[level.id];

  if (lang === 'zh-HK') {
    return {
      ...level,
      worldName: localizedWorldName,
      bossName: bossDef ? bossDef.bossName['zh-HK'] : level.bossName,
      bossTitle: bossDef ? bossDef.bossTitle['zh-HK'] : level.bossTitle,
    };
  }

  if (lang === 'zh-CN') {
    return {
      ...level,
      title: toSimplifiedChinese(level.title),
      subtitle: toSimplifiedChinese(level.subtitle),
      description: toSimplifiedChinese(level.description),
      worldName: localizedWorldName,
      bossName: bossDef ? bossDef.bossName['zh-CN'] : (level.bossName ? toSimplifiedChinese(level.bossName) : undefined),
      bossTitle: bossDef ? bossDef.bossTitle['zh-CN'] : (level.bossTitle ? toSimplifiedChinese(level.bossTitle) : undefined),
    };
  }

  if (lang === 'en') {
    const isBoss = level.isBossLevel;
    let title = '';
    let subtitle = '';

    if (level.id <= 20 && HANDCRAFTED_LEVEL_TITLES_EN[level.id]) {
      title = HANDCRAFTED_LEVEL_TITLES_EN[level.id].title;
      subtitle = HANDCRAFTED_LEVEL_TITLES_EN[level.id].subtitle;
    } else if (isBoss) {
      const bossName = bossDef?.bossName?.en || 'World Guardian Boss';
      const bossTitle = bossDef?.bossTitle?.en || 'Boss Trial';
      title = bossName;
      subtitle = `👑 ${bossTitle} · Showdown${level.timeLimit ? ` (⏳ ${level.timeLimit}s)` : ''}`;
    } else {
      const indexInWorld = (level.id - 1) % 20;
      const archetype = indexInWorld % 6;
      const themeTitles = WORLD_TITLE_THEMES_EN[world.id] || WORLD_TITLE_THEMES_EN[1];
      const themeTitle = themeTitles[indexInWorld % themeTitles.length];
      const archetypeTitle = ARCHETYPE_TITLES_EN[archetype];
      title = `${themeTitle} · ${archetypeTitle}`;
      subtitle = level.gimmick === 'PORTAL'
        ? '🌀 Spatial Warp Portals active! Slither through!'
        : level.gimmick === 'BOMB'
        ? '💣 Ticking Bomb: Defuse before explosion!'
        : level.gimmick === 'GHOST'
        ? '👻 Ghost Mode: Phase through walls & body!'
        : level.gimmick === 'ICE'
        ? '❄️ Glacial Ice: Slide until you hit a wall!'
        : level.gimmick === 'FOG'
        ? '🫐 Fog of War: Rely on glow berries for light!'
        : level.gimmick === 'COLOR_SEQUENCE'
        ? '🎯 Color Sequence: Match Red, Green, Blue order!'
        : level.gimmick === 'COLOR_GATE'
        ? '🎨 Color Gates: Match snake body to gate colors!'
        : level.gimmick === 'TURN_LIMIT'
        ? `🔄 Limited Turns: Only ${level.maxTurns || 20} turns allowed!`
        : level.gimmick === 'REVERSE'
        ? '⏪ Reverse Gear: Turn tail into head to escape!'
        : level.gimmick === 'CHILI'
        ? '🌶️ Fire Chili rush! Break obstacles!'
        : level.gimmick === 'MAGNET'
        ? '🧲 Deep Sea Pearl pulls all nearby fruit!'
        : level.gimmick === 'DRAGON_EGG'
        ? '🥚 Hunt golden dragon eggs for huge rewards!'
        : level.timeLimit
        ? `⏳ ${level.timeLimit}s Rush: Clear target goals in time!`
        : 'Complete mission goals to clear this stage!';
    }

    const desc = `Adventure in [${localizedWorldName}]. ${
      level.isBossLevel
        ? `Defeat the world boss with precision and master maneuvers! `
        : level.hasPortals
        ? `Use paired warp portals to zip across the arena! `
        : ''
    }Reach all target objectives to win!`;

    return {
      ...level,
      title,
      subtitle,
      description: desc,
      worldName: localizedWorldName,
      bossName: bossDef ? bossDef.bossName.en : undefined,
      bossTitle: bossDef ? bossDef.bossTitle.en : undefined,
    };
  }

  // Japanese
  const isBossJa = level.isBossLevel;
  let titleJa = '';
  let subtitleJa = '';

  if (level.id <= 20 && HANDCRAFTED_LEVEL_TITLES_JA[level.id]) {
    titleJa = HANDCRAFTED_LEVEL_TITLES_JA[level.id].title;
    subtitleJa = HANDCRAFTED_LEVEL_TITLES_JA[level.id].subtitle;
  } else if (isBossJa) {
    const bossNameJa = bossDef?.bossName?.ja || 'ワールドボス';
    const bossTitleJa = bossDef?.bossTitle?.ja || 'ボスの試練';
    titleJa = bossNameJa;
    subtitleJa = `👑 ${bossTitleJa} · 決戦！${level.timeLimit ? ` (⏳ ${level.timeLimit}秒)` : ''}`;
  } else {
    const indexInWorldJa = (level.id - 1) % 20;
    const archetypeJa = indexInWorldJa % 6;
    const themeTitlesJa = WORLD_TITLE_THEMES_JA[world.id] || WORLD_TITLE_THEMES_JA[1];
    const themeTitleJa = themeTitlesJa[indexInWorldJa % themeTitlesJa.length];
    const archetypeTitleJa = ARCHETYPE_TITLES_JA[archetypeJa];
    titleJa = `${themeTitleJa} · ${archetypeTitleJa}`;
    subtitleJa = level.gimmick === 'PORTAL'
      ? '🌀 翡翠のポータルで空間をワープせよ！'
      : level.gimmick === 'BOMB'
      ? '💣 時限爆弾：爆発前に解体せよ！'
      : level.gimmick === 'GHOST'
      ? '👻 ゴーストモード：壁と体をすり抜けろ！'
      : level.gimmick === 'ICE'
      ? '❄️ 氷の床：障害物に当たるまで滑走！'
      : level.gimmick === 'FOG'
      ? '🫐 濃霧の戦場：発光ベリーで道を照らせ！'
      : level.gimmick === 'COLOR_SEQUENCE'
      ? '🎯 カラー順序：指定の順番通りに食せ！'
      : level.gimmick === 'COLOR_GATE'
      ? '🎨 カラーゲート：同色時のみ通過可能！'
      : level.gimmick === 'TURN_LIMIT'
      ? `🔄 転換制限：残ターン${level.maxTurns || 20}回！`
      : level.gimmick === 'REVERSE'
      ? '⏪ バック走行：尾頭反転で窮地脱出！'
      : level.gimmick === 'CHILI'
      ? '🌶️ 灼熱唐辛子で無敵の猛火ダッシュ！'
      : level.gimmick === 'MAGNET'
      ? '🧲 磁石真珠で周囲のリンゴを吸引！'
      : level.gimmick === 'DRAGON_EGG'
      ? '🥚 貴重なドラゴンの卵を奪取せよ！'
      : level.timeLimit
      ? `⏳ ${level.timeLimit}秒の猛スピード勝負！`
      : '指定の目標を達成してステージを突破しよう！';
  }

  const descJa = `【${localizedWorldName}】の試練！${
    level.isBossLevel
      ? `強大なワールドボスと対峙せよ！`
      : level.hasPortals
      ? `ポータルをくぐり瞬時にワープ移動せよ！`
      : ''
  }目標をクリアしてコインを獲得しよう！`;

  return {
    ...level,
    title: titleJa,
    subtitle: subtitleJa,
    description: descJa,
    worldName: localizedWorldName,
    bossName: bossDef ? bossDef.bossName.ja : undefined,
    bossTitle: bossDef ? bossDef.bossTitle.ja : undefined,
  };
};
