import { SupportedLanguage } from './i18n';

export interface TermsSection {
  id: string;
  iconName: 'file' | 'shield' | 'dollar' | 'alert' | 'lock' | 'heart' | 'scale' | 'mail';
  title: string;
  content: string[];
  subsections?: {
    title: string;
    details: string[];
  }[];
}

export interface TermsOfServiceContent {
  title: string;
  subtitle: string;
  lastUpdated: string;
  summary: string;
  contactEmail: string;
  disclaimerSummary: string;
  sections: TermsSection[];
}

export const TERMS_OF_SERVICE_DATA: Record<SupportedLanguage, TermsOfServiceContent> = {
  'zh-HK': {
    title: '服務條款與免責聲明 (Terms of Service & Disclaimer)',
    subtitle: 'Snake Pro 使用條款、虛擬道具規範與法律免責聲明',
    lastUpdated: '2026年10月19日',
    contactEmail: 'elemall.uk@gmail.com',
    summary:
      '歡迎使用 Snake Pro（以下簡稱「本遊戲」或「本服務」）。在您下載、安裝、啟動或遊玩本遊戲前，請務必仔細閱讀並完全理解本《服務條款與免責聲明》（以下簡稱「本條款」）。當您開始使用本遊戲，即代表您已閱讀、理解並無條件同意接受本條款之全部約束。',
    disclaimerSummary:
      '【重要免責聲明摘要】本遊戲按「現狀 (AS IS)」及「現有 (AS AVAILABLE)」基礎提供，不提供任何形式之明示或默示擔保。本遊戲存檔主要儲存於玩家本機裝置，如因裝置遺失、系統故障、快取清理或解除安裝導致進度或虛擬代幣遺失，開發團隊不承擔任何賠償責任。請詳閱本條款第五條之完整免責聲明。',
    sections: [
      {
        id: 'acceptance',
        iconName: 'file',
        title: '一、條款之接納與適用範圍',
        content: [
          '1.1 本條款由您（以下簡稱「玩家」或「使用者」）與 Snake Pro 開發及營運團隊（以下簡稱「我們」）共同訂立，具有法律約束力。',
          '1.2 若您未滿法定成年年齡（通常為 18 歲），您必須在父母或法定監護人的陪同、指導與同意下閱讀並同意本條款，方得使用本遊戲。',
          '1.3 我們保留隨時修改、增補或更新本條款之權利。修改後之條款一經於遊戲內或官方網站公布即生效。若您在條款變更後繼續使用本遊戲，即視為您已接受並同意受修改後之條款約束。',
        ],
      },
      {
        id: 'license',
        iconName: 'shield',
        title: '二、服務內容與有限使用授權',
        content: [
          '2.1 我們授予玩家一項個人的、非獨佔的、不可轉讓的、不可轉授權的、可撤銷之有限授權，僅供玩家基於個人娛樂、非商業性目的下載、安裝及遊玩 Snake Pro。',
          '2.2 本遊戲中之所有元素，包括但不限於原始碼、圖形美術、角色外觀（Skins）、場景（Arenas）、音樂音效、關卡設計及「Snake Pro」品牌商標，均為我們或授權方合法擁有的知識產權，受國際版權法及相關知識產權法律保護。',
          '2.3 玩家不得進行以下行為：反向工程、反編譯、反彙編；任何濫用激勵廣告系統、篡改遊戲分數或使用未經授權工具之行為均被嚴格禁止，違者可能會被自排行榜中徹底移除成績與資格；將遊戲內容進行商業銷售或公開轉播謀利。',
        ],
      },
      {
        id: 'virtual_items',
        iconName: 'dollar',
        title: '三、應用內購買 (IAP) 與虛擬道具規範',
        content: [
          '3.1 虛擬道具性質：愛心體力與金幣屬於消耗型虛擬道具。未使用的愛心或金幣不具備任何現金價值，除所在平台（Apple / Google）之退款政策明確規定外，一概不予退款。遊戲內提供之皮膚外觀亦屬純粹之數位虛擬商品，僅供本遊戲內部娛樂使用，不得兌換為法定貨幣。',
          '3.2 官方安全結算：所有應用程式內購交易均直接透過 Apple App Store（StoreKit）或 Google Play（Google Play Billing）官方安全結帳系統處理。我們不會收集、接觸或儲存任何信用卡號碼或銀行帳單資訊。',
          '3.3 退款政策：除適用之法律或 Apple / Google 應用商店政策明確規定外，所有內購交易完成後均為最終交易，恕不接受退款或退貨。',
          '3.4 不設恢復購買功能：本遊戲內所有購買項目（愛心與金幣）均屬消耗型虛擬物品，依官方應用商店規範，消耗型道具不支援且不適用「恢復購買 (Restore Purchases)」機制。相關虛擬道具與進度僅儲存於本機裝置。',
        ],
        subsections: [
          {
            title: '虛擬物品與進度儲存',
            details: [
              '本遊戲內購買的「心」、「金幣」等消耗性虛擬物品，以及遊戲進度、造型、場景等資料，主要儲存於您的裝置本地。',
              '若您刪除本 App、清除 App 資料、更換裝置或重裝，上述消耗性物品及未同步至雲端的進度將無法恢復。',
            ],
          },
        ],
      },
      {
        id: 'third_party',
        iconName: 'scale',
        title: '四、第三方服務與廣告條款',
        content: [
          '4.1 本遊戲整合了 Google AdMob 廣告服務與 Google Firebase 雲端資料庫。',
          '4.2 遊戲內提供之激勵影片廣告（如觀看廣告免費補充愛心）由第三方廣告聯播網提供。廣告內容、商品、承諾或外部跳轉網站均由第三方廣告商獨立負責，我們對第三方廣告之真實性、合法性或安全性不承擔任何保證或連帶責任。',
          '4.3 雲端排行榜服務基於 Google Firebase Installation ID（FID）技術運作，僅傳輸匿名得分與加密匿名識別碼。',
        ],
      },
      {
        id: 'disclaimer',
        iconName: 'alert',
        title: '五、重要法律免責聲明 (Disclaimer of Warranties)',
        content: [
          '請務必仔細閱讀以下免責條款。在適用法律允許的最大限度內：',
        ],
        subsections: [
          {
            title: '5.1 「現狀」與「現有」提供 (As Is Basis)',
            details: [
              'Snake Pro 遊戲、內容、功能及相關服務均嚴格按照「現狀 (AS IS)」及「現有 (AS AVAILABLE)」的原則提供。',
              '我們明確排除任何形式的明示、默示、法定或其他保證，包括但不限於對適銷性、特定用途適用性、無侵權性、不中斷服務、無錯誤、無漏洞或及時性的保證。',
              '我們不保證本遊戲在所有裝置、作業系統版本或網路環境下均能完全相容、無卡頓或無異常中斷。',
            ],
          },
          {
            title: '5.2 本機遊戲存檔與資料遺失免責',
            details: [
              '本遊戲主要依賴玩家裝置之本機儲存空間（Local Storage / Sandbox）來記錄關卡進度、收集的金幣、解鎖的外觀及最高紀錄。',
              '若因玩家更換手機、裝置故障、重置系統、清除瀏覽器快取、手動清除應用資料、解除安裝遊戲或任何第三方軟體干擾，導致本機存檔或虛擬道具遺失，我們對該等資料損失不承擔任何恢復義務、補償或損害賠償責任。',
              '玩家應自行妥善保管裝置與備份重要資料。',
            ],
          },
          {
            title: '5.3 網路連線與雲端服務免責',
            details: [
              '全球排行榜等連線功能仰賴網際網路與第三方雲端伺服器（Google Cloud Firebase）。',
              '因電信業者網路不穩、伺服器維護、DDoS 攻擊、天災、法令限制或不可抗力事件所導致的連線延遲、無法提交分數或紀錄不同步，我們概不負責。',
            ],
          },
          {
            title: '5.4 健康、眩暈與光敏性安全警告',
            details: [
              '遊戲包含快速移動的視覺畫面、光影變化與高飽和度色彩。部分人群在觀看此類光影時可能出現眩暈、眼部疲勞或光敏性癲癇發作。',
              '如您在遊玩過程中感到任何不適、頭暈、視力模糊或抽搐，請立即停止遊玩並就醫諮詢。',
              '玩家因過度連續遊玩或個人體質所產生之任何生理不適或健康問題，我們不承擔任何責任。請玩家合理安排遊玩時間，保持充足休息。',
            ],
          },
        ],
      },
      {
        id: 'liability',
        iconName: 'lock',
        title: '六、責任限制 (Limitation of Liability)',
        content: [
          '6.1 在適用法律所允許的最大限度內，在任何情況下，Snake Pro 開發團隊、創作者或關係方均不對因使用或無法使用本遊戲所引起或與之相關的任何直接、間接、附帶、衍生、特別、懲罰性或懲戒性損害承擔賠償責任，包括但不限於利潤損失、數據遺失、業務中斷、商譽損害或裝置硬體受損，即使我們已被告知此類損害發生的可能性。',
          '6.2 若某些國家或司法管轄區不允許排除或限制特定損害賠償責任，我們的全部總體責任，在任何情況下，均不得超過您在引起索賠事件前三（3）個月內向本遊戲實際支付之金額總和，或十美元（$10.00 USD），以較高者為準。',
        ],
      },
      {
        id: 'termination',
        iconName: 'heart',
        title: '七、服務變更與終止',
        content: [
          '7.1 我們保留隨時在無需事先通知的情況下，修改、暫停或終止本遊戲之部分或全部功能（包括但不限於更新關卡、調整數值、重置排行榜或停運特定模式）之權利。',
          '7.2 任何濫用激勵廣告系統、篡改遊戲分數或使用未經授權工具之行為均被嚴格禁止，違者可能會被自排行榜中移除。若玩家違反本條款之任何約定或涉及外掛舞弊行為，我們有權立即限制、暫停或永久終止該玩家之帳戶訪問權限與排行榜展示，且無需承擔任何退款或賠償責任。',
        ],
      },
      {
        id: 'governing_law',
        iconName: 'mail',
        title: '八、適用法律、管轄權與聯繫我們',
        content: [
          '8.1 在適用法律允許的最大限度內，本條款受爭議發生地適用之法律管轄。如發生任何爭議，雙方應首先嘗試透過友好協商方式予以解決。如本條款之任何部分被認定為無效或不可執行，該部分將在最小必要限度內予以限制，其餘部分仍具有完全效力。',
          '8.2 若您對本服務條款、免責聲明或應用內購買有任何疑問、建議或索賠，請隨時透過我們的官方聯繫電子郵件與開發團隊聯繫：',
        ],
      },
    ],
  },
  'zh-CN': {
    title: '服务条款与免责声明 (Terms of Service & Disclaimer)',
    subtitle: 'Snake Pro 使用条款、虚拟道具规范与法律免责声明',
    lastUpdated: '2026年10月19日',
    contactEmail: 'elemall.uk@gmail.com',
    summary:
      '欢迎使用 Snake Pro（以下简称“本游戏”或“本服务”）。在您下载、安装、启动或游玩本游戏前，请务必仔细阅读并完全理解本《服务条款与免责声明》（以下简称“本条款”）。当您开始使用本游戏，即代表您已阅读、理解并无条件同意接受本条款之全部约束。',
    disclaimerSummary:
      '【重要免责声明摘要】本游戏按“现状 (AS IS)”及“现有 (AS AVAILABLE)”基础提供，不提供任何形式之明示或默示担保。本游戏存档主要保存在玩家本地设备，如因设备遗失、系统故障、缓存清理或卸载导致进度或虚拟代币遗失，开发团队不承担任何赔偿责任。请详阅本条款第五条之完整免责声明。',
    sections: [
      {
        id: 'acceptance',
        iconName: 'file',
        title: '一、条款之接纳与适用范围',
        content: [
          '1.1 本条款由您（以下简称“玩家”或“用户”）与 Snake Pro 开发及运营团队（以下简称“我们”）共同订立，具有法律约束力。',
          '1.2 若您未满法定成年年龄，您必须在父母或法定监护人的陪同、指导与同意下阅读并同意本条款，方得使用本游戏。',
          '1.3 我们保留随时修改、增补或更新本条款之权利。修改后之条款一经公布即生效。若您在条款变更后继续使用本游戏，即视为您已接受并同意受修改后之条款约束。',
        ],
      },
      {
        id: 'license',
        iconName: 'shield',
        title: '二、服务内容与有限使用授权',
        content: [
          '2.1 我们授予玩家一项个人的、非独占的、不可转让的、不可转授权的、可撤销之有限授权，仅供玩家基于个人娱乐、非商业性目的下载、安装及游玩 Snake Pro。',
          '2.2 本游戏中之所有元素，包括但不限于源代码、美术设计、角色外观（Skins）、对战场景（Arenas）、音乐音效及“Snake Pro”品牌标识，均为我们合法拥有的知识产权。',
          '2.3 严禁利用外挂、脚本、反编译或恶意作弊行为破坏排行榜公平性。任何滥用激励广告系统、篡改游戏分数或使用未经授权工具之行为均被严格禁止，违者可能会被从排行榜中彻底移除成绩与资格。',
        ],
      },
      {
        id: 'virtual_items',
        iconName: 'dollar',
        title: '三、应用内购买 (IAP) 与虚拟道具规范',
        content: [
          '3.1 虚拟道具性质：爱心体力与金币属于消耗型虚拟道具。未使用的爱心或金币不具备任何现金价值，除所在平台（Apple / Google）之退款政策明确规定外，一概不予退款。游戏内提供的外观亦属数字化虚拟道具，不得兑换法定货币。',
          '3.2 官方安全结算：所有内购直接由 Apple App Store 或 Google Play 官方结算，开发者不收集亦无法获取您的信用卡信息。',
          '3.3 退款规范：除商店法定强制规定外，所有内购一经交付即为最终交易。',
          '3.4 不设恢复购买功能：本游戏内所有购买项目（爱心与金币）均属消耗型虚拟道具，依照应用商店规范，消耗型道具不适用且不提供“恢复购买 (Restore Purchases)”功能。相关虚拟道具与进度仅保存在设备本地。',
        ],
        subsections: [
          {
            title: '虚拟物品与进度储存',
            details: [
              '本游戏内购买的“心”、“金币”等消耗性虚拟物品，以及游戏进度、造型、场景等资料，主要储存于您的设备本地。',
              '若您删除本 App、清除 App 数据、更换设备或重装，上述消耗性物品及未同步至云端的进度将无法恢复。',
            ],
          },
        ],
      },
      {
        id: 'third_party',
        iconName: 'scale',
        title: '四、第三方服务与广告条款',
        content: [
          '4.1 本游戏接入 Google AdMob 广告服务与 Google Firebase 数据库。',
          '4.2 激励视频广告由第三方提供，对其外部链接或商品真实性我们不承担连带责任。',
          '4.3 云端排行榜服务基于 Google Firebase Installation ID（FID）技术运作，仅传输匿名得分与加密匿名识别码。',
        ],
      },
      {
        id: 'disclaimer',
        iconName: 'alert',
        title: '五、重要法律免责声明 (Disclaimer of Warranties)',
        content: [
          '在适用法律允许的最大限度内，请知悉以下免责条款：',
        ],
        subsections: [
          {
            title: '5.1 “现状”提供 (As Is Basis)',
            details: [
              'Snake Pro 按照“现状 (AS IS)”及“现有 (AS AVAILABLE)”原则提供，不附带任何明示或默示担保。',
              '我们不保证游戏服务永不中断、毫无错误或在所有机型上均能完美兼容。',
            ],
          },
          {
            title: '5.2 本地游戏存档与数据遗失免责',
            details: [
              '游戏进度与虚拟道具保存在玩家本地设备存储空间中。',
              '因设备遗失、系统升级、清理缓存、卸载应用或第三方软件删除导致的数据丢失，我们不承担任何恢复或赔偿责任。',
            ],
          },
          {
            title: '5.3 网络连接与排行榜服务免责',
            details: [
              '因电信网络故障、服务器维护或不可抗力导致的分数同步延迟或中断，我们不承担责任。',
            ],
          },
          {
            title: '5.4 健康与光敏性安全警告',
            details: [
              '本游戏含动态视觉画面。如遇头晕、视力疲劳等不适，请立即停止游玩。因个人体质引发之任何健康问题，我们不承担责任。',
            ],
          },
        ],
      },
      {
        id: 'liability',
        iconName: 'lock',
        title: '六、责任限制 (Limitation of Liability)',
        content: [
          '6.1 在法律允许范围内，开发团队不对任何间接、附带、衍生或惩罚性损害负责。',
          '6.2 任何赔偿总额以玩家在事件发生前3个月内实际支付金额或 $10.00 美元为上限（以较高者为准）。',
        ],
      },
      {
        id: 'termination',
        iconName: 'heart',
        title: '七、服务变更与终止',
        content: [
          '7.1 我们有权适时调整关卡、数值或停用部分功能。',
          '7.2 任何滥用激励广告系统、篡改游戏分数或使用未经授权工具之行为均被严格禁止，违者可能会被从排行榜中移除。对违规作弊账号有权终止其访问权限。',
        ],
      },
      {
        id: 'governing_law',
        iconName: 'mail',
        title: '八、适用法律与联系方式',
        content: [
          '8.1 在适用法律允许的最大限度内，本条款受争议发生地适用之法律管辖。如发生任何争议，双方应首先尝试通过友好协商方式予以解决。',
          '8.2 如对条款有任何疑问，请联系官方支持邮箱：',
        ],
      },
    ],
  },
  'en': {
    title: 'Terms of Service & Disclaimer',
    subtitle: 'Snake Pro Terms of Use, Virtual Items Policy & Legal Disclaimer',
    lastUpdated: 'October 19, 2026',
    contactEmail: 'elemall.uk@gmail.com',
    summary:
      'Welcome to Snake Pro ("the Game" or "the Service"). Before downloading, installing, accessing, or playing the Game, please read and understand these Terms of Service & Disclaimer ("Terms"). By accessing or playing Snake Pro, you agree to be legally bound by these Terms in full.',
    disclaimerSummary:
      '[IMPORTANT DISCLAIMER SUMMARY] Snake Pro is provided strictly on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind. Gameplay progression and virtual items are stored locally on your device. The developer shall not be held liable for any loss of data, progress, or coins resulting from device malfunction, app deletion, cache clearing, or system updates. Please read Section 5 for the complete Legal Disclaimer.',
    sections: [
      {
        id: 'acceptance',
        iconName: 'file',
        title: '1. Acceptance of Terms & Eligibility',
        content: [
          '1.1 These Terms constitute a legally binding agreement between you ("Player" or "User") and the Snake Pro development team ("we", "us", or "our").',
          '1.2 If you are under the legal age of majority in your jurisdiction, you must obtain permission and guidance from your parent or legal guardian to play the Game and agree to these Terms.',
          '1.3 We reserve the right to revise or modify these Terms at any time. Continued use of the Game constitutes full acceptance of any updated terms.',
        ],
      },
      {
        id: 'license',
        iconName: 'shield',
        title: '2. Limited License & Intellectual Property',
        content: [
          '2.1 We grant you a personal, non-exclusive, non-transferable, revocable, limited license to download, install, and play Snake Pro solely for your personal, non-commercial entertainment.',
          '2.2 All visual assets, skins, arena themes, code, sound effects, musical compositions, and the "Snake Pro" trademark are protected intellectual property owned by or licensed to us.',
          '2.3 You agree not to reverse engineer, decompile, use automated scripts or cheat software, or commercially exploit any part of the Game. Any attempt to abuse the rewarded ad system, manipulate scores, or use unauthorized tools is strictly prohibited and may result in removal from the leaderboard.',
        ],
      },
      {
        id: 'virtual_items',
        iconName: 'dollar',
        title: '3. In-App Purchases (IAP) & Virtual Goods',
        content: [
          '3.1 Virtual Goods: Hearts and coins are consumable virtual items. Unused hearts or coins have no cash value and are non-refundable except as required by the platform’s refund policy. Skins and cosmetic items are digital virtual goods solely for in-game entertainment and cannot be exchanged for cash or transferred between accounts.',
          '3.2 Secure Billing: All purchases are processed directly and securely via Apple App Store (StoreKit) or Google Play Billing. We never collect or store your payment card or banking information.',
          '3.3 Refund Policy: Except as mandated by applicable law or official Apple/Google store policies, all in-app purchase transactions are final and non-refundable.',
          '3.4 No Restore Purchases: All in-app purchase products (Hearts and Coins) are consumable virtual goods. In accordance with app store billing guidelines, consumable items do not support and are not eligible for "Restore Purchases". All virtual goods and gameplay progress are stored locally on your device.',
        ],
        subsections: [
          {
            title: 'Virtual Items & Progression Storage',
            details: [
              'Consumable virtual items purchased in the game (such as Hearts and Coins), as well as game progress, skins, arenas, and related data, are stored primarily on your local device.',
              'If you delete this App, clear App data/cache, change devices, or reinstall, the aforementioned consumable items and any progress not synchronized to the cloud cannot be restored.',
            ],
          },
        ],
      },
      {
        id: 'third_party',
        iconName: 'scale',
        title: '4. Third-Party Services & Advertising',
        content: [
          '4.1 Snake Pro integrates Google AdMob for rewarded video advertisements and Google Firebase for cloud leaderboards.',
          '4.2 Third-party advertisements are served by independent networks. We do not endorse and are not liable for any third-party websites, products, or services advertised.',
          '4.3 Cloud leaderboards operate via Google Firebase Installation ID (FID) cryptographic technology, transmitting only anonymous scores and device identifiers.',
        ],
      },
      {
        id: 'disclaimer',
        iconName: 'alert',
        title: '5. LEGAL DISCLAIMER OF WARRANTIES (IMPORTANT)',
        content: [
          'TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE FOLLOWING DISCLAIMER OF WARRANTIES APPLIES:',
        ],
        subsections: [
          {
            title: '5.1 Provided "AS IS" and "AS AVAILABLE"',
            details: [
              'Snake Pro and all associated features and content are provided strictly on an "AS IS" and "AS AVAILABLE" basis.',
              'We disclaim all warranties of any kind, whether express, implied, statutory, or otherwise, including but not limited to implied warranties of merchantability, fitness for a particular purpose, non-infringement, accuracy, uninterrupted service, or freedom from software errors or bugs.',
              'We do not guarantee that the Game will be compatible with all hardware devices or future operating system updates.',
            ],
          },
          {
            title: '5.2 Local Storage & Data Loss Disclaimer',
            details: [
              'Game progress, high scores, unlocked skins, and virtual currency are stored primarily inside your local device sandbox (localStorage).',
              'The developer shall NOT be liable for any loss of game progress, scores, or virtual items resulting from device loss, hardware damage, operating system upgrade, browser cache clearing, manual app data deletion, or uninstallation.',
              'Players are responsible for managing their device storage and backups.',
            ],
          },
          {
            title: '5.3 Network & Cloud Service Availability',
            details: [
              'Online leaderboard features rely on Google Cloud Firebase servers. We are not liable for network latency, server downtime, or inability to record scores due to internet service disruptions or maintenance.',
            ],
          },
          {
            title: '5.4 Health, Ergonomics & Photosensitivity Warning',
            details: [
              'Gameplay involves animated visual movement, vibrant colors, and rapid turns. A small percentage of individuals may experience dizziness, fatigue, or photosensitive epileptic symptoms when viewing certain visual images.',
              'If you experience any discomfort or dizziness, stop playing immediately and consult a physician.',
              'The developer disclaims all liability for physical symptoms or eye strain arising from prolonged or continuous gameplay. Please take frequent breaks.',
            ],
          },
        ],
      },
      {
        id: 'liability',
        iconName: 'lock',
        title: '6. Limitation of Liability',
        content: [
          '6.1 In no event shall the developer, creators, or affiliates be liable for any indirect, incidental, consequential, special, punitive, or exemplary damages (including lost profits, lost data, hardware damage, or business disruption) arising out of or in connection with your use of Snake Pro.',
          '6.2 Under all circumstances, our maximum aggregate liability to you shall not exceed the total amount paid by you in the Game during the prior three (3) months, or $10.00 USD, whichever is greater.',
        ],
      },
      {
        id: 'termination',
        iconName: 'heart',
        title: '7. Service Modifications & Termination',
        content: [
          '7.1 We reserve the right to update, modify, balance, or discontinue any aspect of the Game at any time without prior liability.',
          '7.2 Any attempt to abuse the rewarded ad system, manipulate scores, or use unauthorized tools is strictly prohibited and may result in removal from the leaderboard. We reserve the right to restrict or terminate access for any player who engages in cheating, exploiting, or violating these Terms.',
        ],
      },
      {
        id: 'governing_law',
        iconName: 'mail',
        title: '8. Governing Law & Contact Information',
        content: [
          '8.1 These Terms are governed by the laws applicable in the place where the dispute arises, to the maximum extent permitted by law. Any dispute shall first be attempted to be resolved amicably.',
          '8.2 For questions, support, or legal inquiries, please contact our team at:',
        ],
      },
    ],
  },
  'ja': {
    title: '利用規約と免責事項 (Terms of Service & Disclaimer)',
    subtitle: 'Snake Pro 利用規約、仮想アイテム規定および法的免責事項',
    lastUpdated: '2026年10月19日',
    contactEmail: 'elemall.uk@gmail.com',
    summary:
      'Snake Pro（以下「本ゲーム」または「本サービス」）をご利用いただきありがとうございます。本ゲームをダウンロード、インストール、またはプレイする前に、本利用規約および免責事項（以下「本規約」）を注意深くお読みください。本ゲームを利用することにより、本規約に同意したものとみなされます。',
    disclaimerSummary:
      '【重要・免責事項の概要】本ゲームは現状有姿（AS IS）で提供され、いかなる保証も行われません。ゲーム進行状況およびコイン等のデータはお客様の端末ローカルに保存されます。端末故障、アプリ削除、キャッシュ消去等によるデータ消失について開発者は一切の責任を負いません。第5条の完全な免責事項をご確認ください。',
    sections: [
      {
        id: 'acceptance',
        iconName: 'file',
        title: '1. 規約への同意と適用範囲',
        content: [
          '1.1 本規約は、お客様と Snake Pro 開発チームとの間で締結される法的拘束力のある合意です。',
          '1.2 未成年者の場合、親権者等の法定代理人の同意を得た上で本ゲームをご利用ください。',
          '1.3 当社は本規約を随時変更できるものとし、更新された規約はゲーム内またはウェブ上に掲載された時点で有効となります。',
        ],
      },
      {
        id: 'license',
        iconName: 'shield',
        title: '2. 利用許諾と知的財産権',
        content: [
          '2.1 当社はお客様に対し、非営利目的での個人的な利用に限定した、譲渡不能・取消可能なライセンスを付与します。',
          '2.2 ゲーム内のすべての画像、サウンド、スキン、プログラムコードおよび「Snake Pro」ブランドは当社に帰属します。不正ツールの使用やリバースエンジニアリングは固く禁止されています。リワード広告システムの不正利用、スコアの改ざん、または不正ツールの使用はいかなる場合も固く禁じられており、違反した場合はリーダーボードから除外されることがあります。',
        ],
      },
      {
        id: 'virtual_items',
        iconName: 'dollar',
        title: '3. アプリ内課金 (IAP) と仮想アイテム',
        content: [
          '3.1 仮想アイテム：ハートおよびコインは消耗型仮想アイテムです。未使用のハートやコインには金銭的価値はなく、各プラットフォーム（Apple / Google）の返金ポリシーにより義務付けられている場合を除き、返金はいたしません。スキン等の装飾アイテムも同様にゲーム内娯楽用であり、現金への換金はできません。',
          '3.2 安全な決済：すべての課金処理は Apple App Store または Google Play の公式決済で行われ、開発者がクレジットカード情報を保持することはありません。',
          '3.3 返金ポリシー：適用法令または公式ストア規約で義務付けられている場合を除き、購入完了後の返金は行われません。',
          '3.4 購入の復元非対応：本ゲームで販売されるすべてのアイテム（ハートおよびコイン）は消耗型仮想アイテムです。アプリストアの規定に基づき、消耗型アイテムは「購入の復元 (Restore Purchases)」の対象外となります。仮想アイテムおよび進行データはお客様の端末ローカルにのみ保存されます。',
        ],
        subsections: [
          {
            title: '仮想アイテムと進行データの保存',
            details: [
              '本ゲーム内で購入された「ハート」や「コイン」などの消耗型仮想アイテム、ならびにゲーム進行状況、スキン、ステージ等のデータは、主にお客様の端末ローカルに保存されます。',
              '本アプリの削除、アプリデータの消去、端末の機種変更、または再インストールを行った場合、上記の消耗型アイテムおよびクラウドに同期されていない進行状況は復元できません。',
            ],
          },
        ],
      },
      {
        id: 'third_party',
        iconName: 'scale',
        title: '4. サードパーティ連携と広告',
        content: [
          '4.1 Google AdMob によるリワード広告および Google Firebase によるクラウドランキングを利用しています。',
          '4.2 外部広告主のコンテンツについて当社は責任を負いません。',
          '4.3 クラウドランキング機能は Google Firebase Installation ID (FID) 暗号化技術に基づいて動作し、匿名スコアと匿名デバイス識別子のみを送信します。',
        ],
      },
      {
        id: 'disclaimer',
        iconName: 'alert',
        title: '5. 法的免責事項 (Disclaimer of Warranties)',
        content: [
          '適用される法令の認める最大限において、以下の免責条項が適用されます：',
        ],
        subsections: [
          {
            title: '5.1 現状有姿（AS IS）での提供',
            details: [
              'Snake Pro は「現状有姿 (AS IS)」かつ「提供可能な範囲 (AS AVAILABLE)」で提供され、商品性、特定目的への適合性、中断のない動作等について一切の明示的・黙示的保証を行いません。',
            ],
          },
          {
            title: '5.2 端末ローカル保存とデータ消失免責',
            details: [
              '進行データやコイン等は端末内に保存されます。端末紛失、故障、OS更新、キャッシュ消去、アンインストール等によるデータ損失について、当社は復旧および損害賠償の責任を一切負いません。',
            ],
          },
          {
            title: '5.3 健康と光感受性に関する警告',
            details: [
              '画面の点滅や素早い動きにより、体調不良やめまいを感じた場合は直ちにプレイを中止し医師にご相談ください。長時間の連続プレイはお控えください。',
            ],
          },
        ],
      },
      {
        id: 'liability',
        iconName: 'lock',
        title: '6. 責任の制限 (Limitation of Liability)',
        content: [
          '6.1 当社は、本ゲームの利用に起因するいかなる間接的、偶発的、派生的損害についても責任を負いません。当社の賠償責任総額は、過去3ヶ月間にお客様が本ゲームに支払った金額または10米ドル（いずれか高い方）を上限とします。',
        ],
      },
      {
        id: 'termination',
        iconName: 'heart',
        title: '7. サービスの変更と終了',
        content: [
          '7.1 当社は事前の予告なくゲーム内容の更新や提供の中断を行う権利を有します。',
          '7.2 リワード広告システムの不正利用、スコアの改ざん、または不正ツールの使用はいかなる場合も固く禁じられており、違反した場合はリーダーボードから除外されることがあります。利用規約に違反したアカウントに対してはアクセスを制限または終了する権利を有します。',
        ],
      },
      {
        id: 'governing_law',
        iconName: 'mail',
        title: '8. 準拠法とお問い合わせ',
        content: [
          '8.1 適用される法令の認める最大限において、本規約は紛争が生じた地に適用される法令に準拠するものとします。いかなる紛争についても、まずは友好的な協議による解決を試みるものとします。',
          '8.2 ご不明な点がございましたら、公式サポートまでお問い合わせください：',
        ],
      },
    ],
  },
};

/**
 * 產生可用於直接提交到 App Store Connect、Google Play Console 或網站的完整服務條款與免責聲明 Markdown
 */
export function generateFullTermsOfServiceMarkdown(lang: SupportedLanguage = 'zh-HK'): string {
  const data = TERMS_OF_SERVICE_DATA[lang] || TERMS_OF_SERVICE_DATA['zh-HK'];
  const lines: string[] = [];

  lines.push(`# ${data.title}`);
  lines.push(`**${data.subtitle}**`);
  lines.push(`*Last Updated / 最後更新: ${data.lastUpdated}*`);
  lines.push('');
  lines.push(`> ${data.summary}`);
  lines.push('');
  lines.push(`**免責聲明摘要 / Disclaimer Summary:** ${data.disclaimerSummary}`);
  lines.push('');

  data.sections.forEach((sec) => {
    lines.push(`## ${sec.title}`);
    sec.content.forEach((c) => lines.push(c));
    lines.push('');

    if (sec.subsections) {
      sec.subsections.forEach((sub) => {
        lines.push(`### ${sub.title}`);
        sub.details.forEach((d) => lines.push(`- ${d}`));
        lines.push('');
      });
    }
  });

  lines.push('---');
  lines.push(`**Contact & Legal Inquiries / 聯繫我們:** [${data.contactEmail}](mailto:${data.contactEmail})`);

  return lines.join('\n');
}
