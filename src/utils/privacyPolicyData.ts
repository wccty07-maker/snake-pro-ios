import { SupportedLanguage } from './i18n';

export interface PrivacySection {
  id: string;
  iconName: 'shield' | 'database' | 'ads' | 'lock' | 'baby' | 'refresh' | 'mail';
  title: string;
  content: string[];
  subsections?: {
    title: string;
    details: string[];
  }[];
}

export interface PrivacyPolicyContent {
  title: string;
  subtitle: string;
  lastUpdated: string;
  summary: string;
  contactEmail: string;
  sections: PrivacySection[];
}

export const PRIVACY_POLICY_DATA: Record<SupportedLanguage, PrivacyPolicyContent> = {
  'zh-HK': {
    title: '隱私權政策 (Privacy Policy)',
    subtitle: 'Snake Pro 個人資料保護與隱私承諾',
    lastUpdated: '2026年11月24日',
    summary:
      '歡迎遊玩 Snake Pro。我們非常重視您的個人隱私權。本政策旨在向您清楚說明本遊戲如何處理遊戲存檔數據、廣告識別資訊與第三方服務互動。本遊戲致力於保護玩家隱私，絕不販售任何個人資料。',
    contactEmail: 'elemall.uk@gmail.com',
    sections: [
      {
        id: 'collection',
        iconName: 'database',
        title: '一、我們收集與儲存的資料類型',
        content: [
          '本遊戲主要於玩家裝置本機端（Local Storage）儲存遊玩進度，僅在玩家參與公開功能時與雲端伺服器進行必要通訊：',
        ],
        subsections: [
          {
            title: '1. 本機遊戲存檔資料 (無個人識別性)',
            details: [
              '遊戲內收集的冒險金幣、當前關卡進度、愛心體力倒數。',
              '解鎖之外觀造型（Skins）、競技場地圖（Arenas）、每日簽到與成就殿堂領取紀錄。',
              '本機應用內購交易編號紀錄（Transaction ID Ledger），僅用於防止重複派發與異常中斷後自動補發未完成交易。',
              '音效與背景音樂開啟狀態、語言偏好設定。',
              '此類資料僅儲存在您的裝置本機瀏覽器或沙盒空間中，我們不會將其與您的真實身份關聯。',
            ],
          },
          {
            title: '2. 公開排行榜與匿名記錄',
            details: [
              '當您在排行榜提交高分時，系統僅上傳加密匿名識別碼與「遊戲得分紀錄」。',
              '我們使用 Google Firebase Installation ID（FID）作為裝置唯一加密匿名識別碼以區分記錄，不包含真實姓名、電話、住址或電子郵件。',
              '排行榜分數與相關匿名識別碼將在排行榜功能有效運作期間持續保留，或保留至您主動提出刪除請求為止。',
            ],
          },
        ],
      },
      {
        id: 'third_party',
        iconName: 'ads',
        title: '二、第三方服務整合與廣告政策',
        content: [
          '為了提供免費遊戲內容與雲端排行榜，本遊戲整合了信譽良好的第三方 SDK 服務：',
        ],
        subsections: [
          {
            title: '1. Google AdMob 與 UMP 隱私同意（廣告服務）',
            details: [
              '本遊戲使用 Google AdMob 提供完全可選之「激勵影片廣告」（於愛心補給站觀看廣告以獲得 +1 顆免費愛心，每日上限 5 次；不含橫幅、插頁或強制廣告）。',
              '於歐洲經濟區（EEA）、英國及其他適用地區，本遊戲使用 Google User Messaging Platform (UMP) 收集並更新您的廣告隱私同意選擇；未取得合法廣告請求狀態前不會載入廣告。',
              '於 iOS 版本中，本遊戲不請求跨 App 追蹤權限（ATT）、不讀取 IDFA，並固定向 Google AdMob 請求非個人化廣告（Non-Personalized Ads, npa=1）；惟 AdMob SDK 仍可能依地區合規與 UMP 狀態處理粗略網路位置、裝置技術資訊、廣告曝光及防詐欺訊號。查閱 Google 隱私權政策：https://policies.google.com/privacy',
            ],
          },
          {
            title: '2. Google Firebase（雲端資料庫與匿名分析）',
            details: [
              '我們使用 Google Firebase Firestore 與 Firebase Installations (FID) 提供經典無盡模式、關卡模式與計時模式之匿名排行榜排位服務，並使用 Firebase Analytics 記錄不關聯真實身份之基礎遊戲互動統計。',
              '僅儲存匿名遊戲分數、過關時間、互動事件與加密匿名識別碼，絕不關聯真實身份或用於跨 App 追蹤。',
            ],
          },
          {
            title: '3. 應用商店內購（Apple App Store & Google Play）',
            details: [
              '所有應用內購買（4 款愛心包、4 款金幣包）均由 Apple App Store (StoreKit) 或 Google Play 官方結算系統直接安全處理，並顯示商店回傳之當地貨幣真實價格。',
              '本遊戲不會接觸、收集或儲存任何信用卡號或銀行帳單資訊。',
              '所有 8 款內購項目均為消耗型虛擬物品（Consumable），不支援透過「恢復購買 (Restore Purchases)」重複派發已消耗商品；惟若購買過程中發生閃退或網路中斷，系統將於重啟時自動檢查並補發尚未完成之有效交易。',
            ],
          },
        ],
      },
      {
        id: 'usage',
        iconName: 'lock',
        title: '三、資料使用目的與安全性',
        content: [
          '我們收集與處理數據的唯一目的包括：',
          '• 維持遊戲正常運作、關卡進度儲存與成就判定。',
          '• 確保應用內購交易驗證、防重複派發與未完成交易恢復。',
          '• 提供全球玩家良性公平的排行榜成績比拼。',
          '• 防範外掛作弊行為與維護伺服器穩定性。',
          '我們採取合理的業界安全措施保護資料傳輸，不進行個人輪廓畫像或出售數據予任何第三方廣告經紀商。',
        ],
      },
      {
        id: 'children',
        iconName: 'baby',
        title: '四、兒童隱私保護 (COPPA 規範)',
        content: [
          'Snake Pro 為全年齡大眾休閒遊戲。我們嚴格遵守美國《兒童在線隱私保護法》（COPPA）及歐盟 GDPR-K 規範：',
          '• 我們不會蓄意收集 13 歲以下（或您所在司法管轄區規定年齡）兒童的個人可識別姓名、照片或精確位置。',
          '• 家長或法定監護人若發現未成年人提供了不適當資料，可隨時聯絡我們予以刪除。',
        ],
      },
      {
        id: 'rights',
        iconName: 'refresh',
        title: '五、玩家權利與資料控制',
        content: [
          '您隨時保有對個人遊戲資料的完整控制權利：',
          '• 重設進度：您可以在遊戲「設定」中點擊重設資料，清空本機關卡進度與高分紀錄；於 iOS 版本中，重設進度時會保留您目前的愛心與金幣餘額及本機交易紀錄。',
          '• 廣告隱私選項：若您位於適用地區（如 EEA／英國），可隨時於遊戲「設定 > 隱私權與帳號管理 > 廣告隱私選項」修改同意設定；亦可透過系統設定關閉個人化廣告或重設廣告識別碼。',
          '• 刪除雲端分數：如需自全球排行榜完全移除您的分數紀錄，可在隱私面板一鍵自助抹除，或聯絡開發團隊協助處置。',
        ],
      },
      {
        id: 'contact',
        iconName: 'mail',
        title: '六、條款變更與聯繫我們',
        content: [
          '我們可能會不定期更新本隱私權政策以配合法規或遊戲功能演進。更新版本將直接發布於本頁面，並標註最後修訂日期。',
          '若您對本隱私權政策或個人資料保護有任何疑問、建議或刪除請求，歡迎隨時透過下方電子郵件聯繫開發團隊：',
        ],
      },
    ],
  },
  'zh-CN': {
    title: '隐私政策 (Privacy Policy)',
    subtitle: 'Snake Pro 个人信息保护与隐私承诺',
    lastUpdated: '2026年11月24日',
    summary:
      '欢迎游玩 Snake Pro。我们极其重视您的隐私权。本政策旨在向您清晰阐述本游戏如何处理游戏数据、广告标识信息与第三方服务交互。本游戏严格遵循各地区隐私保护规范，绝不出售任何个人数据。',
    contactEmail: 'elemall.uk@gmail.com',
    sections: [
      {
        id: 'collection',
        iconName: 'database',
        title: '一、我们收集与存储的数据类型',
        content: [
          '本游戏主要在玩家设备本地（Local Storage）存储游戏进度，仅在您参与云端功能时进行必要通信：',
        ],
        subsections: [
          {
            title: '1. 本地游戏存档数据 (无个人识别性)',
            details: [
              '关卡进度、冒险金币、爱心体力倒计时。',
              '已解锁的皮肤外观、对战竞技场、成就领取记录。',
              '本地应用内购交易编号记录（Transaction ID Ledger），仅用于防止重复派发及闪退后自动补发未完成交易。',
              '音效与背景音乐开启状态、语言偏好。',
              '此类数据仅保存在您的设备本地沙盒空间中，不会与真实个人身份进行关联。',
            ],
          },
          {
            title: '2. 公开排行榜与匿名记录',
            details: [
              '当您上传无尽模式或关卡高分时，系统仅同步加密匿名识别码与“得分记录”。',
              '我们使用 Google Firebase Installation ID（FID）作为设备唯一加密匿名识别码以区分记录，不包含真实姓名、联系电话或位置信息。',
              '排行榜分数与相关匿名标识符将在排行榜功能有效运行期间持续保留，或保留至您主动提出删除请求为止。',
            ],
          },
        ],
      },
      {
        id: 'third_party',
        iconName: 'ads',
        title: '二、第三方服务集成与广告政策',
        content: [
          '为了保障高品质游玩体验与云端排行榜运转，本游戏接入了以下受信赖的第三方 SDK 服务：',
        ],
        subsections: [
          {
            title: '1. Google AdMob 与 UMP 隐私同意（移动广告）',
            details: [
              '本游戏仅提供完全可选的激励视频广告（观看后获得 +1 颗免费爱心，每日上限 5 次；不包含横幅、插页或强制广告）。',
              '在欧洲经济区（EEA）、英国及其他适用地区，本游戏通过 Google User Messaging Platform (UMP) 征询并更新广告隐私偏好；在 SDK 确认可请求广告前不会加载广告。',
              '在 iOS 版本中，本游戏不请求跨 App 追踪权限（ATT）、不读取 IDFA，并固定向 Google AdMob 请求非个性化广告（Non-Personalized Ads, npa=1）；但 AdMob SDK 仍可能依地区合规与 UMP 状态处理粗略网络位置、设备技术信息、广告曝光及防欺诈信号。Google 隐私权政策：https://policies.google.com/privacy',
            ],
          },
          {
            title: '2. Google Firebase（云数据库与匿名分析）',
            details: [
              '使用 Google Firebase Firestore 与 Firebase Installations (FID) 提供全球匿名排行榜服务，并使用 Firebase Analytics 记录不关联真实身份的基础交互统计。',
              '仅储存匿名得分、通关时间、交互事件与加密匿名识别码，不用于跨 App 追踪。',
            ],
          },
          {
            title: '3. 商店官方内购结算（Apple App Store & Google Play）',
            details: [
              '所有 4 款爱心包与 4 款金币包均直接通过苹果 App Store (StoreKit) 或 Google Play 官方结算处理，并展示商店返回的本地货币价格。',
              '开发者无权也无法获取您的信用卡或账单信息。所有 8 款内购均为消耗型虚拟道具，不支持通过“恢复购买”重复发放已消耗商品；若购买过程中出现闪退或网络中断，系统会在重启时自动补发未完成的有效交易。',
            ],
          },
        ],
      },
      {
        id: 'usage',
        iconName: 'lock',
        title: '三、数据使用目的与安全防护',
        content: [
          '我们收集的数据仅用于：',
          '• 保障游戏正常运行、保存关卡进展与成就结算。',
          '• 确保应用内购交易校验、防重复派发与未完成交易恢复。',
          '• 提供全球排行榜良性竞技。',
          '• 保证游戏反作弊公平环境与网络安全。',
        ],
      },
      {
        id: 'children',
        iconName: 'baby',
        title: '四、未成年人与儿童隐私保护 (COPPA)',
        content: [
          'Snake Pro 为全年龄段休闲游戏，严格遵循《儿童在线隐私保护法》(COPPA) 及通用未成年人保护规范。',
          '我们不会主动收集未满 13 周岁儿童的个人身份敏感信息。若家长发现有相关信息误传，可随时联系我们快速清理。',
        ],
      },
      {
        id: 'rights',
        iconName: 'refresh',
        title: '五、您的数据权利与控制',
        content: [
          '您随时拥有对个人数据的完全控制：',
          '• 本地数据清理：可在游戏设置中随时重置游戏进度；在 iOS 版本中，重置进度时会保留您当前的爱心与金币余额及本地交易记录。',
          '• 广告隐私选项：适用地区用户可随时在游戏“设置 > 隐私权与账号管理 > 广告隐私选项”修改同意偏好，也可在系统设置中关闭个性化广告。',
          '• 排行榜删除：若希望从排行榜清除分数记录，可在面板一键自助清理，或发送邮件至开发者邮箱。',
        ],
      },
      {
        id: 'contact',
        iconName: 'mail',
        title: '六、政策更新与联系方式',
        content: [
          '本政策若有调整，将直接在本界面更新生效日期。',
          '如对本隐私政策有任何疑问或需要支持，请联系我们：',
        ],
      },
    ],
  },
  'en': {
    title: 'Privacy Policy',
    subtitle: 'Snake Pro · Commitment to Data Privacy & Security',
    lastUpdated: 'November 24, 2026',
    summary:
      'Welcome to Snake Pro! We value and respect your privacy. This policy explains what information is collected, how it is used, and how third-party services (such as Google AdMob and Firebase) operate within the game. We never sell your personal data.',
    contactEmail: 'elemall.uk@gmail.com',
    sections: [
      {
        id: 'collection',
        iconName: 'database',
        title: '1. Information We Collect and Store',
        content: [
          'Snake Pro operates primarily on local device storage (localStorage) and only connects to cloud servers for online leaderboards:',
        ],
        subsections: [
          {
            title: '1. Local Game Progression (Non-Personal)',
            details: [
              'Coins earned, completed stages, and stamina refill timers.',
              'Unlocked snake skins, arena themes, and achievement rewards.',
              'A local Transaction ID ledger stored solely to prevent duplicate fulfillment of in-app purchases and to recover unfinished transactions after an unexpected app close.',
              'Sound effects and BGM volume states, preferred UI language.',
              'This data is stored purely inside your device sandbox and is never tied to your real-world identity.',
            ],
          },
          {
            title: '2. Leaderboard & Anonymous Identifier',
            details: [
              'When you submit high scores to the global leaderboard, only your encrypted anonymous device identifier and score are transmitted.',
              'We use official Google Firebase Installation ID (FID) as the cryptographic anonymous device identifier to isolate records, with no personal identification like full name, phone number, or home address.',
              'Leaderboard scores and associated anonymous identifiers are retained for as long as the leaderboard feature is active, or until you request deletion.',
            ],
          },
        ],
      },
      {
        id: 'third_party',
        iconName: 'ads',
        title: '2. Third-Party Services & Advertising',
        content: [
          'To provide free content and online leaderboards, this application integrates trusted third-party SDKs:',
        ],
        subsections: [
          {
            title: '1. Google AdMob & UMP Consent (Advertising)',
            details: [
              'We use Google AdMob exclusively for optional opt-in rewarded video ads (watch an ad in the Heart Refill Station for +1 Heart, up to 5 per day). We do not show banner, interstitial, or forced ads.',
              'In the EEA, UK, and other applicable regions, we use Google User Messaging Platform (UMP) to gather and refresh your ad consent choices. Ads are only requested after the SDK confirms consent status.',
              'On iOS, this app does not request App Tracking Transparency (ATT) permission, does not access IDFA, and uniformly sends Non-Personalized Ads requests (npa=1) to Google AdMob. Please note that the Google AdMob SDK may still process coarse network location, technical device signals, and ad impression/fraud-prevention metrics subject to regional regulations and UMP consent. Review Google Privacy Policy: https://policies.google.com/privacy',
            ],
          },
          {
            title: '2. Google Firebase (Cloud Database & Anonymous Analytics)',
            details: [
              'We utilize Google Firebase Firestore and Firebase Installations (FID) for anonymous global leaderboards, and Firebase Analytics for non-personally-identifiable gameplay interaction telemetry.',
              'Only anonymous scores, timestamps, product interaction events, and encrypted anonymous device identifiers are processed—never linked to your real identity or used for cross-app tracking.',
            ],
          },
          {
            title: '3. In-App Purchases (Apple App Store & Google Play)',
            details: [
              'All 8 consumable in-app purchases (4 Heart Packs and 4 Coin Packs) are securely processed directly by Apple App Store (StoreKit) or Google Play Billing using localized storefront pricing.',
              'We do not collect or have access to your credit card, bank, or billing information. Because all items are consumables, consumed purchases cannot be re-granted via Restore Purchases; however, unfinished verified StoreKit transactions interrupted by crash or network loss are automatically recovered and fulfilled on relaunch.',
            ],
          },
        ],
      },
      {
        id: 'usage',
        iconName: 'lock',
        title: '3. How We Use Information',
        content: [
          'The data collected is used solely to:',
          '• Deliver game mechanics, persist progression, and unlock achievements.',
          '• Verify in-app purchase fulfillment, prevent duplicate grants, and recover unfinished transactions.',
          '• Maintain fair, competitive global leaderboards.',
          '• Prevent cheating and ensure server integrity.',
        ],
      },
      {
        id: 'children',
        iconName: 'baby',
        title: '4. Children’s Privacy (COPPA & GDPR-K Compliance)',
        content: [
          'Snake Pro is designed for general audiences and all ages. We comply with the Children’s Online Privacy Protection Act (COPPA):',
          '• We do not knowingly collect personal identifiable information from children under 13.',
          '• If a parent or guardian discovers that their child has provided data without consent, please contact us and we will promptly delete it.',
        ],
      },
      {
        id: 'rights',
        iconName: 'refresh',
        title: '5. Your Rights and Data Controls',
        content: [
          'You retain full control over your gameplay data:',
          '• Reset Data: You can clear saved gameplay progress directly from the game Settings. On iOS, resetting gameplay progress preserves your current Hearts and Coins balances as well as your local purchase ledger.',
          '• Ad Privacy Options: In applicable regions (e.g., EEA/UK), you can update your consent preferences anytime via Settings > Privacy & Account > Ad Privacy Options, or adjust OS-level ad settings.',
          '• Leaderboard Removal: You can instantly erase your cloud scores directly from the Data Management tab, or contact us at any time.',
        ],
      },
      {
        id: 'contact',
        iconName: 'mail',
        title: '6. Updates and Contact Information',
        content: [
          'We may update this policy periodically to reflect game updates or regulatory requirements. Any modifications will be posted here with an updated revision date.',
          'If you have any questions or requests regarding your privacy, please contact:',
        ],
      },
    ],
  },
  'ja': {
    title: 'プライバシーポリシー (Privacy Policy)',
    subtitle: 'Snake Pro 個人情報保護とプライバシーの誓約',
    lastUpdated: '2026年11月24日',
    summary:
      '『Snake Pro』をご利用いただきありがとうございます。当ゲームはプレイヤーのプライバシーを最優先に保護します。本ポリシーでは、ゲームデータや広告識別情報、サードパーティ連携の取扱いについて説明します。個人情報を販売することは一切ありません。',
    contactEmail: 'elemall.uk@gmail.com',
    sections: [
      {
        id: 'collection',
        iconName: 'database',
        title: '1. 収集および保存するデータについて',
        content: [
          '本ゲームは主に端末のローカルストレージ（Local Storage）に進行状況を保存し、オンライン機能の利用時のみ通信を行います：',
        ],
        subsections: [
          {
            title: '1. ローカルゲームデータ（非個人情報）',
            details: [
              '獲得コイン、ステージクリア状況、ハート体力タイマー。',
              '解放されたスネークスキン、アリーナマップ、アチーブメント達成履歴。',
              '重複付与防止および未完了決済の自動復元に使用するローカル取引ID台帳（Transaction ID Ledger）。',
              'BGM・効果音のオン/オフ、選択された言語設定。',
              'これらのデータはお客様の端末内にのみ保存され、実名等の個人情報とは一切結びつきません。',
            ],
          },
          {
            title: '2. 公開リーダーボードと匿名識別子',
            details: [
              'ハイスコアをランキングに登録する際、暗号化された匿名識別子と「スコア」のみが送信されます。',
              'Google Firebase Installation ID (FID) を公式の暗号化された一意の匿名デバイスIDとして使用し、本名や電話番号等は一切収集しません。',
              'リーダーボードのスコアおよび関連する匿名識別子は、リーダーボード機能が提供されている期間中、またはお客様からの削除要請があるまで保持されます。',
            ],
          },
        ],
      },
      {
        id: 'third_party',
        iconName: 'ads',
        title: '2. サードパーティサービスと広告ポリシー',
        content: [
          '無料プレイの提供およびオンラインランキング維持のため、以下の信頼性の高いSDKを利用しています：',
        ],
        subsections: [
          {
            title: '1. Google AdMob および UMP 同意管理（広告配信）',
            details: [
              '任意視聴のリワード動画広告（視聴でハート+1、1日最大5回）のみに Google AdMob を使用しています（バナー・インタースティシャル・強制広告はありません）。',
              'EEA・英国等の対象地域では Google User Messaging Platform (UMP) を通じて同意状況を確認・更新し、広告リクエスト可能と確認された場合のみ広告を読み込みます。',
              'iOS 版では App Tracking Transparency (ATT) によるクロスアプリ追跡を要求せず、IDFA にもアクセスしません。すべての iOS 広告リクエストは一貫して非パーソナライズ広告 (npa=1) として送信されます。なお Google AdMob SDK は地域規制および UMP 同意状況に応じて概算位置情報・端末技術情報・広告表示および不正防止シグナルを処理する場合があります。Google プライバシーポリシー：https://policies.google.com/privacy',
            ],
          },
          {
            title: '2. Google Firebase（クラウドデータベースおよび匿名分析）',
            details: [
              'グローバルランキング機能の提供に Google Firebase Firestore と Firebase Installations (FID) を、個人に紐づかないゲーム操作統計に Firebase Analytics を使用しています。',
              '匿名スコア、クリア時間、匿名操作イベント、暗号化された匿名IDのみを扱い、実名やクロスアプリ追跡とは一切紐づけません。',
            ],
          },
          {
            title: '3. アプリ内課金（Apple App Store & Google Play）',
            details: [
              '全8種類の消耗型アイテム（ハート4種・コイン4種）は各ストア公式決済システム（Apple StoreKit / Google Play）で処理され、ストアの現地通貨価格が表示されます。',
              '開発者がクレジットカード情報等を保持することはありません。消耗済みアイテムの重複復元には対応していませんが、アプリ強制終了等で未完了となった正規取引は次回起動時に自動補填されます。',
            ],
          },
        ],
      },
      {
        id: 'usage',
        iconName: 'lock',
        title: '3. データの利用目的',
        content: [
          '収集したデータは以下の目的でのみ使用されます：',
          '• ゲームの円滑な動作および進捗の保存。',
          '• アプリ内課金の検証、重複付与の防止、および未完了取引の復元。',
          '• 公正なグローバルランキングの集計。',
          '• 不正防止およびサーバーの安全性維持。',
        ],
      },
      {
        id: 'children',
        iconName: 'baby',
        title: '4. お子様のプライバシー保護 (COPPA等)',
        content: [
          'Snake Pro は全年齢対象のカジュアルゲームです。13歳未満のお子様から個人を特定できる情報を意図的に収集することはありません。',
        ],
      },
      {
        id: 'rights',
        iconName: 'refresh',
        title: '5. プレイヤーの権利とデータ管理',
        content: [
          'お客様はいつでもゲーム設定からローカル進捗をリセットできます（iOS 版では現在のハート・コイン残高および購入履歴を保持したまま進捗を初期化します）。対象地域ではゲーム設定の「広告プライバシー設定」からいつでも同意を変更できます。',
        ],
      },
      {
        id: 'contact',
        iconName: 'mail',
        title: '6. 改定とお問い合わせ',
        content: [
          'ポリシーの改定がある場合は本画面にて更新日とともに告知します。ご質問やデータ削除のご要望は下記メールまでお問い合わせください：',
        ],
      },
    ],
  },
};

/**
 * 產生可用於直接提交到 App Store Connect、Google Play Console 或網站的完整 Markdown / 純文字條款
 */
export function generateFullPrivacyPolicyMarkdown(lang: SupportedLanguage = 'zh-HK'): string {
  const data = PRIVACY_POLICY_DATA[lang] || PRIVACY_POLICY_DATA['zh-HK'];
  const lines: string[] = [];

  lines.push(`# ${data.title}`);
  lines.push(`**${data.subtitle}**`);
  lines.push(`*Last Updated / 最後更新: ${data.lastUpdated}*`);
  lines.push('');
  lines.push(`> ${data.summary}`);
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
  lines.push(`**Developer Contact / 開發團隊聯繫郵箱:** [${data.contactEmail}](mailto:${data.contactEmail})`);

  return lines.join('\n');
}
