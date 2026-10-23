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
    lastUpdated: '2026年10月19日',
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
            title: '1. Google AdMob（廣告服務）',
            details: [
              '本遊戲使用 Google AdMob 提供可選之「激勵影片廣告」（觀看廣告以補充免費愛心體力，每日上限 5 次）。',
              'AdMob SDK 可能會收集並使用您的裝置廣告識別碼（如 Android 廣告 ID 或 iOS IDFA/ATT 授權）、粗略網路位置與廣告互動數據，以展示相關廣告或防止欺詐。',
              '查閱 Google 隱私權政策：https://policies.google.com/privacy',
            ],
          },
          {
            title: '2. Google Firebase（雲端資料庫）',
            details: [
              '我們使用 Google Firebase Firestore 提供經典無盡模式、關卡模式與計時模式之排行榜即時排位服務。',
              '僅儲存匿名遊戲分數、過關時間與加密匿名識別碼。',
            ],
          },
          {
            title: '3. 應用商店內購（Apple App Store & Google Play）',
            details: [
              '所有應用內購買（愛心包、金幣包）均由 Apple App Store (StoreKit) 或 Google Play 官方結算系統直接安全處理。',
              '本遊戲不會接觸、收集或儲存任何信用卡號或銀行帳單資訊。',
              '所有內購項目（愛心與金幣）均為消耗型虛擬物品，主要儲存於您的本機裝置，依應用商店規範不支援且不適用「恢復購買 (Restore Purchases)」功能。',
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
          '• 重設進度：您可以在遊戲「設定」中點擊重設資料，清空本機所有紀錄。',
          '• 限制廣告追蹤：您可以透過 iOS【設定 > 隱私權與安全性 > 追蹤】或 Android【設定 > Google > 廣告】重設廣告 ID 或關閉個人化廣告。',
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
    lastUpdated: '2026年10月19日',
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
            title: '1. Google AdMob（移动广告）',
            details: [
              '本游戏提供激励视频广告（例如看完广告获取免费爱心体力，每日上限 5 次）。',
              'Google AdMob SDK 可能会收集移动设备广告标识符（如 Android GAID、iOS IDFA）、网络连接类型及广告展示日志，以确保广告投放正常及防范欺诈。',
              'Google 隐私权政策：https://policies.google.com/privacy',
            ],
          },
          {
            title: '2. Google Firebase（云数据库）',
            details: [
              '使用 Google Cloud Firebase Firestore 提供全球排行排名数据服务。',
              '仅储存匿名得分、通关时间与加密匿名识别码。',
            ],
          },
          {
            title: '3. 商店官方内购结算（Apple App Store & Google Play）',
            details: [
              '所有金币包与爱心内购均直接通过苹果 App Store 或 Google Play 官方结算处理。',
              '开发者无权也无法获取您的信用卡或账单信息。所有内购项目（爱心与金币）均为消耗型虚拟道具，主要储存于您的本地设备，依商店规范不适用且不提供“恢复购买 (Restore Purchases)”功能。',
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
          '• 本地数据清理：可在游戏设置或清理浏览器缓存随时重置。',
          '• 广告追踪控制：可在手机系统设置中重置广告 ID 或关闭个性化广告投放。',
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
    lastUpdated: 'October 19, 2026',
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
            title: '1. Google AdMob (Advertising)',
            details: [
              'We use Google AdMob to deliver opt-in rewarded video ads (e.g. watch an ad to refill hearts/stamina, up to 5 per day).',
              'Google AdMob SDK may collect device identifiers (such as Google Advertising ID or iOS IDFA when authorized), approximate IP location, and ad impression data for ad delivery and fraud prevention.',
              'Review Google Privacy Policy: https://policies.google.com/privacy',
            ],
          },
          {
            title: '2. Google Firebase (Cloud Database)',
            details: [
              'We utilize Google Cloud Firebase Firestore to power our global leaderboards for Endless, Levels, and Time Attack modes.',
              'Only anonymous scores, timestamps, and encrypted anonymous device identifiers are stored.',
            ],
          },
          {
            title: '3. In-App Purchases (Apple App Store & Google Play)',
            details: [
              'All in-app purchases are securely processed directly by Apple App Store (StoreKit) or Google Play Billing.',
              'We do not collect or have access to your credit card, bank, or billing information. All in-app purchase items (Hearts and Coins) are consumable virtual goods stored locally on your device, and do not support or require Restore Purchases.',
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
          '• Reset Data: You can clear all saved data directly from the game Settings or your browser cache.',
          '• Limit Ad Tracking: You can reset your Advertising ID or opt-out of personalized ads via your device OS settings (Settings > Privacy on iOS or Settings > Google > Ads on Android).',
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
    lastUpdated: '2026年10月19日',
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
            title: '1. Google AdMob（広告配信）',
            details: [
              'リワード動画広告（広告視聴によるハート回復など、1日最大5回）に Google AdMob を使用しています。',
              '広告配信および不正防止の目的で、広告識別子（IDFAやGAIDなど）や通信ログを収集する場合があります。',
              'Google プライバシーポリシー：https://policies.google.com/privacy',
            ],
          },
          {
            title: '2. Google Firebase（クラウドデータベース）',
            details: [
              'グローバルランキング機能の提供に Google Firebase Firestore を使用しています。',
              '匿名スコア、クリア時間、暗号化された匿名IDのみが保存されます。',
            ],
          },
          {
            title: '3. アプリ内課金（Apple & Google Play）',
            details: [
              'すべての課金決済は各ストアの公式決済システムにより安全に処理されます。開発者がクレジットカード情報等を保持することはありません。すべての購入アイテム（ハートおよびコイン）は端末ローカルに保存される消耗型仮想アイテムのため、「購入の復元 (Restore Purchases)」の対象外となります。',
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
          'お客様はいつでもゲーム設定からローカルデータをリセットできます。また、端末の設定から広告のトラッキング制限を行うことが可能です。',
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
