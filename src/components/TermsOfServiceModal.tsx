import React, { useState } from 'react';
import { soundEngine } from '../utils/audio';
import { SupportedLanguage, getCopyUrlText, getOpenUrlText } from '../utils/i18n';
import {
  TERMS_OF_SERVICE_DATA,
  generateFullTermsOfServiceMarkdown,
} from '../utils/termsOfServiceData';
import { CuteModalBackground } from './CuteModalBackground';
import {
  X,
  FileText,
  AlertTriangle,
  Scale,
  RotateCcw,
  Mail,
  ShieldAlert,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';

interface TermsOfServiceModalProps {
  isOpen: boolean;
  language?: SupportedLanguage;
  onClose: () => void;
  onSelectLanguage?: (lang: SupportedLanguage) => void;
}

export const TermsOfServiceModal: React.FC<TermsOfServiceModalProps> = ({
  isOpen,
  language = 'zh-HK',
  onClose,
  onSelectLanguage,
}) => {
  const [activeLang, setActiveLang] = useState<SupportedLanguage>(language);
  const [copied, setCopied] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);
  const [publicUrl, setPublicUrl] = useState('');

  React.useEffect(() => {
    setActiveLang(language);
    const custom = typeof window !== 'undefined' ? localStorage.getItem('snake_pro_custom_terms_url') : null;
    if (custom && custom.trim().startsWith('http')) {
      setPublicUrl(custom.trim());
    } else {
      setPublicUrl('https://cerulean-llama-27f5a0.netlify.app');
    }
  }, [language, isOpen]);

  // When returning from external browser or switching back to the app, restore sound
  React.useEffect(() => {
    if (!isOpen) return;
    const handleReturn = () => {
      soundEngine.restoreFromExternalNavigation();
    };
    window.addEventListener('focus', handleReturn);
    document.addEventListener('visibilitychange', handleReturn);
    return () => {
      window.removeEventListener('focus', handleReturn);
      document.removeEventListener('visibilitychange', handleReturn);
    };
  }, [isOpen]);

  const handleCloseModal = () => {
    soundEngine.playClick();
    soundEngine.restoreFromExternalNavigation();
    onClose();
  };

  if (!isOpen) return null;

  const termsData = TERMS_OF_SERVICE_DATA[activeLang] || TERMS_OF_SERVICE_DATA['zh-HK'];

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(termsData.contactEmail);
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pt-[calc(max(env(safe-area-inset-top),0.5rem)+2.8rem)] pb-3 bg-slate-950/85 backdrop-blur-md animate-fade-in select-none overflow-hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleCloseModal();
        }
      }}
    >
      <CuteModalBackground
        theme="settings"
        className="w-full max-w-lg max-h-[calc(100dvh-max(env(safe-area-inset-top),0.5rem)-3.8rem)] flex flex-col text-slate-100 shadow-2xl overflow-hidden border border-sky-500/30"
      >
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-sky-500/20 flex items-center justify-between shrink-0 bg-slate-950/80 gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500/20 to-blue-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 shrink-0 shadow-inner">
              <FileText className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-black flex items-center gap-2 truncate text-white">
                <span>{termsData.title}</span>
              </h3>
              <p className="text-[11px] text-slate-400 truncate">
                {termsData.subtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCloseModal}
            className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all active:scale-95 shrink-0 cursor-pointer shadow-md touch-manipulation"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Online URL Bar */}
        <div className="px-3 py-2 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30 shrink-0">
              URL
            </span>
            <span className="font-mono text-[11px] text-slate-300 truncate select-all">
              {publicUrl || '/terms.html'}
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
              href={publicUrl || 'https://cerulean-llama-27f5a0.netlify.app'}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                soundEngine.playClick();
                soundEngine.prepareForExternalNavigation();
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
          {/* Highlight Disclaimer Alert Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-950/50 via-amber-950/40 to-slate-950 border border-amber-500/50 shadow-md space-y-2">
            <div className="flex items-center gap-2 text-amber-300 font-black text-xs sm:text-sm">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <span>
                {activeLang === 'en'
                  ? 'Important Legal Disclaimer'
                  : activeLang === 'ja'
                  ? '重要な法的免責事項'
                  : activeLang === 'zh-CN'
                  ? '重要法律免责声明'
                  : '重要法律免責聲明'}
              </span>
            </div>
            <p className="text-amber-100/90 text-xs leading-relaxed font-medium">
              {termsData.disclaimerSummary}
            </p>
            <div className="pt-1 flex items-center justify-between text-[10px] font-mono text-slate-400 border-t border-amber-500/20">
              <span className="text-amber-400 font-bold">Snake Pro</span>
              <span>
                {activeLang === 'en'
                  ? 'Last Revised: '
                  : activeLang === 'ja'
                  ? '最終改定日: '
                  : activeLang === 'zh-CN'
                  ? '最后修订: '
                  : '最後修訂: '}
                {termsData.lastUpdated}
              </span>
            </div>
          </div>

          {/* Summary Introduction */}
          <div className="p-3.5 rounded-2xl bg-sky-950/30 border border-sky-500/30 text-sky-100 space-y-1.5">
            <div className="font-bold text-sky-200 text-xs sm:text-sm flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-sky-400" />
              <span>{termsData.title}</span>
            </div>
            <p className="leading-relaxed text-slate-300 text-xs">
              {termsData.summary}
            </p>
          </div>

          {/* Structured Terms Sections */}
          {termsData.sections.map((section) => {
            const isDisclaimerSection = section.id === 'disclaimer';
            return (
              <div
                key={section.id}
                className={`p-3.5 rounded-2xl border shadow-sm space-y-2.5 ${
                  isDisclaimerSection
                    ? 'bg-gradient-to-br from-amber-950/30 via-slate-950/90 to-rose-950/20 border-amber-500/50 shadow-amber-950/30'
                    : 'bg-slate-950/80 border-slate-800/90'
                }`}
              >
                <div className="flex items-center gap-2.5 pb-1 border-b border-slate-800/60">
                  <div
                    className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${
                      isDisclaimerSection
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                        : 'bg-slate-900 border-slate-700/60 text-sky-400'
                    }`}
                  >
                    {isDisclaimerSection ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : section.id === 'virtual_items' ? (
                      <RotateCcw className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Scale className="w-4 h-4" />
                    )}
                  </div>
                  <h4
                    className={`font-bold text-xs sm:text-sm ${
                      isDisclaimerSection ? 'text-amber-300' : 'text-slate-100'
                    }`}
                  >
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
                        className={`p-2.5 rounded-xl border space-y-1.5 ${
                          isDisclaimerSection
                            ? 'bg-amber-950/20 border-amber-500/30'
                            : 'bg-slate-900/60 border-slate-800/60'
                        }`}
                      >
                        <div
                          className={`font-bold text-[11px] sm:text-xs flex items-center gap-1.5 ${
                            isDisclaimerSection ? 'text-amber-200' : 'text-slate-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              isDisclaimerSection ? 'bg-amber-400' : 'bg-sky-400'
                            }`}
                          />
                          <span>{sub.title}</span>
                        </div>
                        <ul className="space-y-1 pl-3 text-slate-400 text-[11px]">
                          {sub.details.map((item, dIdx) => (
                            <li key={dIdx} className="list-disc leading-relaxed">
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Contact Box */}
          <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-sky-500/30 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] text-slate-400">
                {activeLang === 'en'
                  ? 'Developer Support & Legal Inquiries'
                  : activeLang === 'ja'
                  ? '開発チームサポート＆法的窓口'
                  : activeLang === 'zh-CN'
                  ? '开发团队客服与法律咨询邮箱'
                  : '開發團隊客服與法律諮詢信箱'}
              </div>
              <a
                href={`mailto:${termsData.contactEmail}`}
                className="font-mono text-xs font-bold text-sky-400 hover:text-sky-300 underline flex items-center gap-1 truncate"
              >
                <Mail className="w-3.5 h-3.5 shrink-0" />
                <span>{termsData.contactEmail}</span>
              </a>
            </div>
            <button
              type="button"
              onClick={handleCopyEmail}
              className="px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 text-xs font-bold transition-all shrink-0 cursor-pointer"
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
