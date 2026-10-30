import React, { useState } from 'react';
import { soundEngine } from '../utils/audio';
import { SupportedLanguage, getCopyUrlText, getOpenUrlText } from '../utils/i18n';
import { PRIVACY_POLICY_DATA } from '../utils/privacyPolicyData';
import { CuteModalBackground } from './CuteModalBackground';
import {
  X,
  ShieldCheck,
  Database,
  Tv,
  Lock,
  Smile,
  RotateCcw,
  Mail,
  ExternalLink,
  Smartphone,
  Apple,
  Copy,
  Check,
} from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  initialTab?: 'POLICY' | 'AD_GUIDE';
  language?: SupportedLanguage;
  playerName?: string;
  onClose: () => void;
  onSelectLanguage?: (lang: SupportedLanguage) => void;
  onResetData?: () => void;
  onClearCloudScores?: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({
  isOpen,
  initialTab = 'POLICY',
  language = 'zh-HK',
  onClose,
  onSelectLanguage,
}) => {
  const [activeTab, setActiveTab] = useState<'POLICY' | 'AD_GUIDE'>(initialTab);
  const [activeLang, setActiveLang] = useState<SupportedLanguage>(language);
  const [adOsTab, setAdOsTab] = useState<'IOS' | 'ANDROID'>('IOS');
  const [copied, setCopied] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);
  const [publicUrl, setPublicUrl] = useState('');

  // Sync with prop when opened
  React.useEffect(() => {
    setActiveLang(language);
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
    const custom = typeof window !== 'undefined' ? localStorage.getItem('snake_pro_custom_privacy_url') : null;
    if (custom && custom.trim().startsWith('http')) {
      setPublicUrl(custom.trim());
    } else {
      setPublicUrl('https://jolly-sundae-9ed76d.netlify.app');
    }
  }, [language, isOpen, initialTab]);

  if (!isOpen) return null;

  const currentData = PRIVACY_POLICY_DATA[activeLang] || PRIVACY_POLICY_DATA['zh-HK'];

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(currentData.contactEmail);
    soundEngine.playClick();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(publicUrl);
    soundEngine.playClick();
    setUrlCopied(true);
    setTimeout(() => setUrlCopied(false), 2200);
  };

  const iosSteps = [
    {
      num: 1,
      title:
        activeLang === 'en'
          ? 'Open iPhone Settings'
          : activeLang === 'ja'
          ? 'iPhone の【設定】を開く'
          : activeLang === 'zh-CN'
          ? '进入 iPhone【设置】'
          : '進入 iPhone【設定】',
      desc:
        activeLang === 'en'
          ? 'Open the "Settings" app on your home screen.'
          : activeLang === 'ja'
          ? 'ホーム画面の「設定」アプリを開きます。'
          : activeLang === 'zh-CN'
          ? '打开手机桌面上的“设置 (Settings)”App。'
          : '打開手機桌面上的「設定 (Settings)」App。',
    },
    {
      num: 2,
      title:
        activeLang === 'en'
          ? 'Select Privacy & Security'
          : activeLang === 'ja'
          ? '【プライバシーとセキュリティ】を選択'
          : activeLang === 'zh-CN'
          ? '点击【隐私与安全性】'
          : '點選【隱私權與安全性】',
      desc:
        activeLang === 'en'
          ? 'Scroll down and tap "Privacy & Security" ("Privacy" on iOS 15 or earlier).'
          : activeLang === 'ja'
          ? '下にスクロールして「プライバシーとセキュリティ」（iOS 15以前は「プライバシー」）をタップします。'
          : activeLang === 'zh-CN'
          ? '下滑找到【隐私与安全性】（iOS 15 以前为“隐私”）。'
          : '下滑找到【隱私權與安全性】（iOS 15 以前為「隱私權」）。',
    },
    {
      num: 3,
      title:
        activeLang === 'en'
          ? 'Tap Tracking & Turn Off Requests'
          : activeLang === 'ja'
          ? '【トラッキング】を開き要求をオフ'
          : activeLang === 'zh-CN'
          ? '进入【跟踪】并关闭请求'
          : '進入【追蹤】並關閉請求',
      desc:
        activeLang === 'en'
          ? 'Tap "Tracking" and toggle off "Allow Apps to Request to Track". All tracking requests from apps will be automatically declined.'
          : activeLang === 'ja'
          ? '「トラッキング」をタップし、「Appからのトラッキング要求を許可」をオフにします。すべてのアプリのトラッキング要求が自動的に拒否されます。'
          : activeLang === 'zh-CN'
          ? '点击【跟踪 (Tracking)】，将顶部的“允许 App 请求跟踪”切换为关闭。关闭后系统将自动拒绝所有 App 的广告追踪请求。'
          : '點選【追蹤 (Tracking)】，將頂部的「允許 App 要求追蹤」切換為關閉。關閉後系統將自動拒絕所有 App 的廣告追蹤請求。',
    },
    {
      num: 4,
      title:
        activeLang === 'en'
          ? 'Turn Off Apple Personalized Ads'
          : activeLang === 'ja'
          ? '【Appleの広告】のパーソナライズをオフ'
          : activeLang === 'zh-CN'
          ? '关闭【Apple 广告】个性化投放'
          : '關閉【Apple 廣告】個人化投放',
      desc:
        activeLang === 'en'
          ? 'Return to Privacy & Security, tap "Apple Advertising" at the bottom, and turn off "Personalized Ads".'
          : activeLang === 'ja'
          ? '「プライバシーとセキュリティ」最下部の「Appleの広告」を開き、「パーソナライズされた広告」をオフにします。'
          : activeLang === 'zh-CN'
          ? '返回【隐私与安全性】最底部的【Apple 广告】，关闭“个性化广告”。'
          : '返回【隱私權與安全性】最底部的【Apple 廣告】，關閉「個人化廣告」。',
    },
  ];

  const androidSteps = [
    {
      num: 1,
      title:
        activeLang === 'en'
          ? 'Open Android Settings'
          : activeLang === 'ja'
          ? 'Android の【設定】を開く'
          : activeLang === 'zh-CN'
          ? '打开 Android【设置】'
          : '打開 Android【設定】',
      desc:
        activeLang === 'en'
          ? 'Open your device system Settings menu.'
          : activeLang === 'ja'
          ? '端末の「設定」アプリを開きます。'
          : activeLang === 'zh-CN'
          ? '进入手机系统设置菜单。'
          : '進入手機系統設定選單。',
    },
    {
      num: 2,
      title:
        activeLang === 'en'
          ? 'Select Google Services'
          : activeLang === 'ja'
          ? '【Google】サービスを選択'
          : activeLang === 'zh-CN'
          ? '选择【Google】服务'
          : '選擇【Google】服務',
      desc:
        activeLang === 'en'
          ? 'Scroll down and tap "Google" (or "Google Services & preferences").'
          : activeLang === 'ja'
          ? '下にスクロールして「Google」（または「Google サービスと設定」）をタップします。'
          : activeLang === 'zh-CN'
          ? '下滑点击【Google】（或“Google 服务与偏好设置”）。'
          : '下滑點擊【Google】（或「Google 服務與偏好設定」）。',
    },
    {
      num: 3,
      title:
        activeLang === 'en'
          ? 'Tap Ads'
          : activeLang === 'ja'
          ? '【広告】をタップ'
          : activeLang === 'zh-CN'
          ? '点击【广告 (Ads)】'
          : '點擊【廣告 (Ads)】',
      desc:
        activeLang === 'en'
          ? 'In the services list, tap into the "Ads" page.'
          : activeLang === 'ja'
          ? 'サービス一覧から「広告」を選択します。'
          : activeLang === 'zh-CN'
          ? '在服务列表中点击进入【广告】页面。'
          : '在服務列表中點擊進入【廣告】頁面。',
    },
    {
      num: 4,
      title:
        activeLang === 'en'
          ? 'Delete or Reset Advertising ID'
          : activeLang === 'ja'
          ? '【広告IDを削除】または【リセット】'
          : activeLang === 'zh-CN'
          ? '【删除广告 ID】或【重设广告 ID】'
          : '【刪除廣告 ID】或【重設廣告 ID】',
      desc:
        activeLang === 'en'
          ? 'Tap "Delete advertising ID" to remove your device advertising ID, or enable "Opt out of Ads Personalization".'
          : activeLang === 'ja'
          ? '「広告IDを削除」をタップして識別子を削除するか、「広告のカスタマイズをオプトアウトする」をオンにします。'
          : activeLang === 'zh-CN'
          ? '点击“删除广告 ID (Delete advertising ID)”，系统将完全移除设备的广告标识符；若显示“退出广告个性化”，请切换为开启。'
          : '點選「刪除廣告 ID (Delete advertising ID)」，系統將完全移除裝置的廣告辨識碼；若介面顯示「退出廣告個人化 (Opt out of Ads Personalization)」，請切換為開啟。',
    },
  ];

  const renderSectionIcon = (iconName: string) => {
    switch (iconName) {
      case 'database':
        return <Database className="w-4 h-4 text-sky-400" />;
      case 'ads':
        return <Tv className="w-4 h-4 text-amber-400" />;
      case 'lock':
        return <Lock className="w-4 h-4 text-emerald-400" />;
      case 'baby':
        return <Smile className="w-4 h-4 text-pink-400" />;
      case 'refresh':
        return <RotateCcw className="w-4 h-4 text-purple-400" />;
      case 'mail':
        return <Mail className="w-4 h-4 text-indigo-400" />;
      default:
        return <ShieldCheck className="w-4 h-4 text-teal-400" />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pt-[calc(max(env(safe-area-inset-top),0.5rem)+2.8rem)] pb-3 bg-slate-950/85 backdrop-blur-md animate-fade-in select-none overflow-hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          soundEngine.playClick();
          onClose();
        }
      }}
    >
      <CuteModalBackground
        theme="settings"
        className="w-full max-w-lg max-h-[calc(100dvh-max(env(safe-area-inset-top),0.5rem)-3.8rem)] flex flex-col text-slate-100 shadow-2xl overflow-hidden border border-emerald-500/30"
      >
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-emerald-500/20 flex items-center justify-between shrink-0 bg-slate-950/80 gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-black flex items-center gap-2 truncate text-white">
                <span>{currentData.title}</span>
              </h3>
              <p className="text-[11px] text-slate-400 truncate">
                {currentData.subtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all active:scale-95 shrink-0 cursor-pointer shadow-md touch-manipulation"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation: 1. 隱私權政策, 2. 關閉廣告追蹤 */}
        <div className="px-3 py-2 bg-slate-950/90 border-b border-slate-800 flex items-center gap-1.5 shrink-0 overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setActiveTab('POLICY');
            }}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
              activeTab === 'POLICY'
                ? 'bg-emerald-500/25 border border-emerald-400 text-emerald-300 shadow-sm'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>
              {activeTabLabelPolicy(activeLang)}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setActiveTab('AD_GUIDE');
            }}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
              activeTab === 'AD_GUIDE'
                ? 'bg-amber-500/25 border border-amber-400 text-amber-300 shadow-sm'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tv className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {activeTabLabelAdGuide(activeLang)}
            </span>
          </button>
        </div>

        {/* Online URL Bar */}
        <div className="px-3 py-2 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
              URL
            </span>
            <span className="font-mono text-[11px] text-slate-300 truncate select-all">
              {publicUrl || '/privacy.html'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleCopyUrl}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold flex items-center gap-1 border border-slate-750 active:scale-95 transition-all cursor-pointer"
              title={getCopyUrlText(activeLang, false)}
            >
              {urlCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">{getCopyUrlText(activeLang, true)}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>{getCopyUrlText(activeLang, false)}</span>
                </>
              )}
            </button>
            <a
              href={publicUrl || 'https://jolly-sundae-9ed76d.netlify.app'}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                soundEngine.playClick();
                soundEngine.prepareForExternalNavigation();
                const onReturn = () => {
                  window.removeEventListener('focus', onReturn);
                  document.removeEventListener('visibilitychange', onReturn);
                  setTimeout(() => {
                    soundEngine.restoreFromExternalNavigation().catch(() => {});
                  }, 120);
                };
                window.addEventListener('focus', onReturn, { once: true });
                document.addEventListener('visibilitychange', onReturn, { once: true });
              }}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-750 transition-all cursor-pointer flex items-center justify-center"
              title={getOpenUrlText(activeLang)}
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y p-3.5 sm:p-5 space-y-4 text-xs select-text">
          {/* TAB 1: 完整隱私條款 */}
          {activeTab === 'POLICY' && (
            <>
              {/* Summary Banner */}
              <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-100 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono text-emerald-400/80">
                  <span className="font-bold text-white">Snake Pro</span>
                  <span>
                    {activeLang === 'en'
                      ? 'Updated: '
                      : activeLang === 'ja'
                      ? '最終更新: '
                      : activeLang === 'zh-CN'
                      ? '更新: '
                      : '更新: '}
                    {currentData.lastUpdated}
                  </span>
                </div>
                <p className="leading-relaxed text-slate-300 text-xs">
                  {currentData.summary}
                </p>
              </div>

              {/* Structured Policy Sections */}
              {currentData.sections.map((section) => (
                <div
                  key={section.id}
                  className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/90 shadow-sm space-y-2.5"
                >
                  <div className="flex items-center gap-2.5 pb-1 border-b border-slate-800/60">
                    <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-700/60 flex items-center justify-center shrink-0">
                      {renderSectionIcon(section.iconName)}
                    </div>
                    <h4 className="font-bold text-slate-100 text-xs sm:text-sm">
                      {section.title}
                    </h4>
                  </div>

                  {section.content.map((p, pIdx) => (
                    <p key={pIdx} className="text-slate-300 leading-relaxed text-[11px] sm:text-xs">
                      {p}
                    </p>
                  ))}

                  {section.subsections && (
                    <div className="space-y-2.5 pt-1">
                      {section.subsections.map((sub, sIdx) => (
                        <div
                          key={sIdx}
                          className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60 space-y-1.5"
                        >
                          <div className="font-bold text-slate-200 text-[11px] sm:text-xs flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                            <span>{sub.title}</span>
                          </div>
                          <ul className="space-y-1 pl-3 text-slate-400 text-[11px]">
                            {sub.details.map((item, dIdx) => {
                              const isUrl = item.includes('https://');
                              return (
                                <li key={dIdx} className="list-disc leading-relaxed">
                                  {isUrl ? (
                                    <span>
                                      {item.split('https://')[0]}
                                      <a
                                        href={`https://${item.split('https://')[1]}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-sky-400 underline hover:text-sky-300 inline-flex items-center gap-0.5 ml-1"
                                      >
                                        https://{item.split('https://')[1]}
                                        <ExternalLink className="w-3 h-3 inline" />
                                      </a>
                                    </span>
                                  ) : (
                                    item
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

          {/* TAB 2: 關閉個人化廣告追蹤教學 */}
          {activeTab === 'AD_GUIDE' && (
            <div className="space-y-3.5">
              <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/30 space-y-2">
                <div className="flex items-center gap-2">
                  <Tv className="w-4 h-4 text-amber-400" />
                  <h4 className="font-bold text-amber-200 text-xs sm:text-sm">
                    {activeLang === 'en'
                      ? 'How to Turn Off Personalized Ad Tracking'
                      : activeLang === 'ja'
                      ? '広告のトラッキング制限・解除ガイド'
                      : activeLang === 'zh-CN'
                      ? '如何关闭手机个性化广告追踪教学'
                      : '如何關閉手機個人化廣告追蹤教學'}
                  </h4>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {activeLang === 'en'
                    ? 'Snake Pro uses Google AdMob for rewarded video ads (optional hearts refill). You can easily restrict ad personalization or reset your device advertising ID in your mobile system settings.'
                    : activeLang === 'ja'
                    ? 'Snake Pro ではリワード動画広告（ハート無料回復）に Google AdMob を使用しています。端末のOS設定からアプリ横断トラッキングの拒否や広告IDのリセットがいつでも行えます。'
                    : activeLang === 'zh-CN'
                    ? 'Snake Pro 仅在您主动点击观看奖励广告（获取免费爱心）时使用 Google AdMob。您可以随时通过手机操作系统的原生设置，彻底关闭跨 App 追踪或重设广告识别码。'
                    : 'Snake Pro 僅在您主動點擊觀看獎勵廣告（獲取免費愛心）時使用 Google AdMob。您可以隨時透過手機作業系統的原生設定，徹底關閉跨 App 追蹤或重設廣告識別碼。'}
                </p>
              </div>

              {/* OS Toggle (iOS vs Android) - No (iPhone / iPad) or (安卓手機) */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setAdOsTab('IOS');
                  }}
                  className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    adOsTab === 'IOS'
                      ? 'bg-sky-500/25 border-sky-400 text-sky-200 shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Apple className="w-4 h-4 text-rose-400" />
                  <span>Apple iOS</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setAdOsTab('ANDROID');
                  }}
                  className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    adOsTab === 'ANDROID'
                      ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200 shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span>Google Android</span>
                </button>
              </div>

              {/* Step-by-Step for iOS */}
              {adOsTab === 'IOS' && (
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <div className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                    <Apple className="w-4 h-4 text-rose-400" />
                    <span>
                      {activeLang === 'en'
                        ? 'iOS: 4 Steps to Turn Off Ad Tracking'
                        : activeLang === 'ja'
                        ? 'iOS 広告トラッキング停止の 4 ステップ：'
                        : activeLang === 'zh-CN'
                        ? 'iOS 系统关闭广告追踪 4 步骤：'
                        : 'iOS 系統關閉廣告追蹤 4 步驟：'}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {iosSteps.map((s) => (
                      <div
                        key={s.num}
                        className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 flex items-start gap-2.5"
                      >
                        <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                          {s.num}
                        </span>
                        <div>
                          <div className="font-bold text-slate-200 text-[11px]">{s.title}</div>
                          <div className="text-[10px] text-slate-400">{s.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step-by-Step for Android */}
              {adOsTab === 'ANDROID' && (
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <div className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    <span>
                      {activeLang === 'en'
                        ? 'Android: 4 Steps to Reset or Delete Advertising ID'
                        : activeLang === 'ja'
                        ? 'Android 広告IDのリセット・削除 4 ステップ：'
                        : activeLang === 'zh-CN'
                        ? 'Android 系统重置或删除广告 ID 4 步骤：'
                        : 'Android 系統重設或刪除廣告 ID 4 步驟：'}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {androidSteps.map((s) => (
                      <div
                        key={s.num}
                        className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 flex items-start gap-2.5"
                      >
                        <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                          {s.num}
                        </span>
                        <div>
                          <div className="font-bold text-slate-200 text-[11px]">{s.title}</div>
                          <div className="text-[10px] text-slate-400">{s.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Contact Box */}
          <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-emerald-500/30 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] text-slate-400">
                {activeLang === 'en'
                  ? 'Developer Support & Privacy Email'
                  : activeLang === 'ja'
                  ? '開発チームサポート＆プライバシー窓口'
                  : activeLang === 'zh-CN'
                  ? '开发团队客服与隐私邮箱'
                  : '開發團隊客服與隱私信箱'}
              </div>
              <a
                href={`mailto:${currentData.contactEmail}`}
                className="font-mono text-xs font-bold text-emerald-400 hover:text-emerald-300 underline flex items-center gap-1 truncate"
              >
                <Mail className="w-3.5 h-3.5 shrink-0" />
                <span>{currentData.contactEmail}</span>
              </a>
            </div>
            <button
              type="button"
              onClick={handleCopyEmail}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all shrink-0 cursor-pointer"
            >
              {copied
                ? (activeLang === 'en'
                    ? 'Copied!'
                    : activeLang === 'ja'
                    ? 'コピー完了!'
                    : activeLang === 'zh-CN'
                    ? '已复制!'
                    : '已複製!')
                : (activeLang === 'en'
                    ? 'Copy Email'
                    : activeLang === 'ja'
                    ? 'メールをコピー'
                    : activeLang === 'zh-CN'
                    ? '复制邮箱'
                    : '複製信箱')}
            </button>
          </div>
        </div>
      </CuteModalBackground>
    </div>
  );
};

function activeTabLabelPolicy(lang: SupportedLanguage) {
  switch (lang) {
    case 'en':
      return 'Privacy Policy';
    case 'ja':
      return 'プライバシーポリシー';
    case 'zh-CN':
      return '隐私政策';
    default:
      return '隱私權政策';
  }
}

function activeTabLabelAdGuide(lang: SupportedLanguage) {
  switch (lang) {
    case 'en':
      return 'Ad Tracking Guide';
    case 'ja':
      return '広告設定ガイド';
    case 'zh-CN':
      return '关闭广告追踪';
    default:
      return '關閉廣告追蹤';
  }
}
