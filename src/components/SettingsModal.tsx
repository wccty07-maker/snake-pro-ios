import React, { useState, useEffect } from 'react';
import { PlayerProfile } from '../types';
import { soundEngine } from '../utils/audio';
import {
  X,
  Volume2,
  VolumeX,
  Music,
  Globe,
  Check,
  ShieldCheck,
  ChevronRight,
  RotateCcw,
  Fingerprint,
  Copy,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import {
  SupportedLanguage,
  LANGUAGE_OPTIONS,
  getTranslation,
} from '../utils/i18n';
import { CuteModalBackground } from './CuteModalBackground';
import { getFirebaseInstallationId, getSyncCachedFID } from '../firebase';

interface SettingsModalProps {
  profile: PlayerProfile;
  isOpen: boolean;
  onClose: () => void;
  onUpdateProfile: (updater: (prev: PlayerProfile) => PlayerProfile) => void;
  onResetData?: () => void;
  onRestoreProgression?: () => void;
  onOpenTutorial?: () => void;
  onReplayIntro?: () => void;
  onOpenItemCompendium?: () => void;
  onResetItemIntros?: () => void;
  onOpenPrivacyPolicy?: () => void;
  onOpenTermsOfService?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  profile,
  isOpen,
  onClose,
  onUpdateProfile,
  onOpenPrivacyPolicy,
  onOpenTermsOfService,
  onResetData,
}) => {
  const currentLang: SupportedLanguage = profile.language || 'zh-HK';

  const [langToast, setLangToast] = useState<string | null>(null);
  const [fid, setFid] = useState<string>(() => getSyncCachedFID());
  const [fidCopied, setFidCopied] = useState<boolean>(false);
  const [isConfirmingReset, setIsConfirmingReset] = useState<boolean>(false);
  const [resetSuccess, setResetSuccess] = useState<boolean>(false);

  // 當打開設定視窗獲取最新真實 FID
  useEffect(() => {
    if (isOpen) {
      setLangToast(null);
      setIsConfirmingReset(false);
      setResetSuccess(false);
      getFirebaseInstallationId().then((resolvedId) => {
        if (resolvedId) setFid(resolvedId);
      }).catch(() => {});
    }

    const handleFidUpdate = (e: Event) => {
      const detail = (e as CustomEvent<{ fid: string }>).detail;
      if (detail?.fid) setFid(detail.fid);
    };

    window.addEventListener('fid_updated', handleFidUpdate);
    return () => window.removeEventListener('fid_updated', handleFidUpdate);
  }, [isOpen]);

  const handleCopyFid = async (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (!fid || fid === 'fid_pending') return;

    // Remove any selection ranges immediately so mobile OS doesn't enter text selection mode
    if (typeof window !== 'undefined' && window.getSelection) {
      window.getSelection()?.removeAllRanges();
    }

    let copied = false;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(fid);
        copied = true;
      }
    } catch {
      // Fall through to textarea execCommand fallback
    }

    if (!copied && typeof document !== 'undefined') {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = fid;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        textarea.style.left = '-9999px';
        textarea.style.top = '-9999px';
        textarea.setAttribute('readonly', '');
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        copied = document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch {
        // ignore
      }
    }

    // Always clear selection again after copying
    if (typeof window !== 'undefined' && window.getSelection) {
      window.getSelection()?.removeAllRanges();
    }

    if (profile.soundEnabled) soundEngine.playClick();
    setFidCopied(true);
    setTimeout(() => setFidCopied(false), 2200);
  };

  if (!isOpen) return null;

  const toggleSound = () => {
    const next = !profile.soundEnabled;
    soundEngine.setSoundEnabled(next);
    if (next) soundEngine.playClick();
    onUpdateProfile((prev) => ({ ...prev, soundEnabled: next }));
  };

  const toggleBgm = () => {
    const currentBgm = profile.bgmEnabled ?? true;
    const next = !currentBgm;
    soundEngine.setBgmEnabled(next);
    if (profile.soundEnabled) soundEngine.playClick();
    onUpdateProfile((prev) => ({ ...prev, bgmEnabled: next }));
  };

  const handleLanguageChange = (lang: SupportedLanguage) => {
    if (lang === currentLang) return;
    if (profile.soundEnabled) soundEngine.playClick();
    onUpdateProfile((prev) => ({ ...prev, language: lang, hasCustomLanguage: true }));
    const toastMsg =
      lang === 'zh-CN'
        ? '已切换为简体中文！'
        : lang === 'zh-HK'
        ? '已切換為繁體中文！'
        : lang === 'en'
        ? 'Switched to English!'
        : '日本語に切り替えました！';
    setLangToast(toastMsg);
    setTimeout(() => {
      setLangToast(null);
    }, 2500);
  };


  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-4 pt-[calc(max(env(safe-area-inset-top),0.5rem)+3.2rem)] pb-3 bg-slate-950/80 backdrop-blur-md animate-fade-in select-none overflow-hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          if (profile.soundEnabled) soundEngine.playClick();
          onClose();
        }
      }}
    >
      <CuteModalBackground
        theme="settings"
        className="w-full max-w-md max-h-[calc(100dvh-max(env(safe-area-inset-top),0.5rem)-4.5rem)] flex flex-col text-slate-100 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-pink-500/20 flex items-center justify-between shrink-0 bg-slate-950/75 gap-2">
          <div className="min-w-0 flex-1 select-none">
            <h3 className="text-base font-black flex items-center gap-2">
              <span>{getTranslation('settingsTitle', currentLang)}</span>
            </h3>
            <p className="text-[11px] text-slate-400 leading-snug">
              {getTranslation('settingsSubtitle', currentLang)}
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (profile.soundEnabled) soundEngine.playClick();
              onClose();
            }}
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all active:scale-95 shrink-0 cursor-pointer shadow-md touch-manipulation"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options (Clean & Production-Grade) */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y p-3.5 sm:p-4 space-y-3 text-xs">
          {/* 0. 官方匿名ID */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-br from-slate-950/90 via-slate-900/80 to-sky-950/30 border border-sky-500/30 shadow-sm gap-2.5 select-none">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-sky-500/15 border border-sky-500/40 flex items-center justify-center text-sky-400 shrink-0 shadow-inner">
                <Fingerprint className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-100 text-xs sm:text-sm">
                    {getTranslation('fidTitle', currentLang)}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center">
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyFid(e);
                    }}
                    className="font-mono text-[11px] text-sky-300 truncate select-none tracking-wider px-1.5 py-0.5 rounded bg-slate-950/80 border border-sky-500/30 max-w-full inline-block cursor-pointer hover:border-sky-400/60 active:scale-95 transition-all touch-manipulation"
                    title={fid}
                  >
                    {fid || '正在獲取 FID...'}
                  </span>
                </div>
              </div>
            </div>

            {/* FID Copy Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleCopyFid(e);
              }}
              className="h-8 px-2.5 sm:px-3 rounded-lg bg-sky-600/30 hover:bg-sky-500/40 active:bg-sky-500/50 text-sky-200 text-xs font-bold border border-sky-500/40 flex items-center gap-1.5 shrink-0 transition-all active:scale-95 cursor-pointer shadow-sm touch-manipulation select-none"
              title="複製 FID"
            >
              {fidCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300 font-sans text-xs">
                    {getTranslation('fidCopied', currentLang)}
                  </span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-sky-300" />
                  <span className="font-sans text-xs">
                    {currentLang === 'zh-CN' ? '复制' : currentLang === 'en' ? 'Copy' : currentLang === 'ja' ? 'コピー' : '複製'}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* 1. Background Music (BGM) */}
          <div
            onClick={() => toggleBgm()}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/80 hover:bg-slate-900/80 active:bg-slate-900 border border-slate-800 shadow-sm cursor-pointer select-none transition-all touch-manipulation"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center shadow-inner shrink-0 text-amber-400">
                <Music className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-100 text-sm">
                    {getTranslation('bgmTitle', currentLang)}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      profile.bgmEnabled ?? true
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {profile.bgmEnabled ?? true
                      ? getTranslation('on', currentLang)
                      : getTranslation('off', currentLang)}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {getTranslation('bgmSubtitle', currentLang)}
                </div>
              </div>
            </div>
            <button
              type="button"
              id="setting-toggle-bgm"
              onClick={(e) => {
                e.stopPropagation();
                toggleBgm();
              }}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 shrink-0 cursor-pointer touch-manipulation active:scale-95 ${
                profile.bgmEnabled ?? true ? 'bg-amber-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  profile.bgmEnabled ?? true ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 2. Sound FX Setting */}
          <div
            onClick={() => toggleSound()}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/80 hover:bg-slate-900/80 active:bg-slate-900 border border-slate-800 shadow-sm cursor-pointer select-none transition-all touch-manipulation"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center shadow-inner shrink-0">
                {profile.soundEnabled ? (
                  <Volume2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <VolumeX className="w-5 h-5 text-slate-500" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-100 text-sm">
                    {getTranslation('soundTitle', currentLang)}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      profile.soundEnabled
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {profile.soundEnabled
                      ? getTranslation('on', currentLang)
                      : getTranslation('off', currentLang)}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {getTranslation('soundSubtitle', currentLang)}
                </div>
              </div>
            </div>
            <button
              type="button"
              id="setting-toggle-sound"
              onClick={(e) => {
                e.stopPropagation();
                toggleSound();
              }}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 shrink-0 cursor-pointer touch-manipulation active:scale-95 ${
                profile.soundEnabled ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  profile.soundEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 3. Language Selector (語言選擇) */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-sm space-y-2.5 select-none">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center text-sky-400 shrink-0">
                  <Globe className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-slate-100 text-sm">
                    {getTranslation('languageTitle', currentLang)}
                  </div>
                  <div className="text-[11px] text-slate-400 leading-snug">
                    {getTranslation('languageSubtitle', currentLang)}
                  </div>
                </div>
              </div>
              {langToast && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 animate-fade-in flex items-center gap-1 shrink-0">
                  <Check className="w-3 h-3" />
                  <span>{langToast}</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              {LANGUAGE_OPTIONS.map((opt) => {
                const isSelected = currentLang === opt.code;
                return (
                  <button
                    key={opt.code}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLanguageChange(opt.code);
                    }}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all select-none touch-manipulation active:scale-95 cursor-pointer ${
                      isSelected
                        ? 'bg-sky-500/25 border-sky-400 text-sky-200 shadow-sm'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <span>{opt.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Privacy Policy & Terms of Service */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-sm space-y-2 select-none">

            {/* Privacy Policy */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (profile.soundEnabled) soundEngine.playClick();
                if (onOpenPrivacyPolicy) {
                  onOpenPrivacyPolicy();
                }
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-emerald-500/30 hover:border-emerald-500/50 transition-all active:scale-[0.98] cursor-pointer group text-left touch-manipulation"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="font-bold text-slate-100 text-xs flex items-center gap-1.5 flex-wrap min-w-0">
                  <span>
                    {currentLang === 'zh-CN'
                      ? '隐私政策 (Privacy Policy)'
                      : currentLang === 'en'
                      ? 'Privacy Policy'
                      : currentLang === 'ja'
                      ? 'プライバシーポリシー'
                      : '隱私權政策 (Privacy Policy)'}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                    v2.0
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-300 transition-colors shrink-0 ml-1.5" />
            </button>

            {/* Terms of Service & Disclaimer */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (profile.soundEnabled) soundEngine.playClick();
                if (onOpenTermsOfService) {
                  onOpenTermsOfService();
                } else if (onOpenPrivacyPolicy) {
                  onOpenPrivacyPolicy();
                }
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-sky-500/30 hover:border-sky-500/50 transition-all active:scale-[0.98] cursor-pointer group text-left touch-manipulation"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="font-bold text-slate-100 text-xs flex items-center gap-1.5 flex-wrap min-w-0">
                  <span>
                    {getTranslation('termsOfServiceBtn', currentLang)}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-sky-300 transition-colors shrink-0 ml-1.5" />
            </button>
          </div>

          {/* 5. 重設本機遊戲進度 (Reset Local Game Progress) */}
          {onResetData && (
            <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-sm space-y-2.5 select-none">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (profile.soundEnabled) soundEngine.playClick();
                  setIsConfirmingReset(true);
                }}
                className="w-full h-11 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-md bg-rose-950/60 hover:bg-rose-900/70 text-rose-200 border border-rose-500/40 hover:border-rose-500/70 shadow-rose-950/30 touch-manipulation"
              >
                <RotateCcw className="w-4 h-4 shrink-0 text-rose-400" />
                <span>
                  {currentLang === 'zh-CN'
                    ? '重置本地游戏进度'
                    : currentLang === 'en'
                    ? 'Reset Local Progress'
                    : currentLang === 'ja'
                    ? '進行状況リセット'
                    : '重設本機遊戲進度'}
                </span>
              </button>

              {/* Inline Reset Danger Confirmation Prompt */}
              {isConfirmingReset && (
                <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/60 space-y-2.5 animate-fade-in">
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-rose-300 shrink-0 mt-0.5">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <div className="font-black text-rose-200 text-xs">
                        {currentLang === 'zh-CN'
                          ? '确定要重置本地游戏进度？'
                          : currentLang === 'en'
                          ? 'Confirm Reset Local Game Data?'
                          : currentLang === 'ja'
                          ? 'ローカル進行状況をリセットしますか？'
                          : '確定要重設本機遊戲進度？'}
                      </div>
                      <div className="text-[10.5px] text-rose-300/90 leading-relaxed mt-1">
                        {currentLang === 'zh-CN'
                          ? '此操作将清空本地所有关卡进度、金币、解锁造型与最高纪录，恢复至初次开启状态。此操作无法撤销！'
                          : currentLang === 'en'
                          ? 'This will wipe all stage levels, coins, unlocked skins, and local high scores back to defaults. This action cannot be undone!'
                          : currentLang === 'ja'
                          ? 'すべてのステージ進行、コイン、スキン、ハイスコアが初期状態に戻ります。この操作は取り消せません！'
                          : '此操作將清空本機所有關卡進度、金幣、解鎖造型與最高紀錄，回復至初次開啟狀態。此操作無法復原！'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (profile.soundEnabled) soundEngine.playClick();
                        setIsConfirmingReset(false);
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all active:scale-95 cursor-pointer border border-slate-700"
                    >
                      {currentLang === 'zh-CN' ? '取消' : currentLang === 'en' ? 'Cancel' : currentLang === 'ja' ? 'キャンセル' : '取消'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onResetData();
                        setIsConfirmingReset(false);
                        setResetSuccess(true);
                        setTimeout(() => {
                          setResetSuccess(false);
                        }, 4000);
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs transition-all active:scale-95 cursor-pointer shadow-lg shadow-rose-900/40 border border-rose-400/50 flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>
                        {currentLang === 'zh-CN' ? '确认重置' : currentLang === 'en' ? 'Confirm Reset' : currentLang === 'ja' ? '初期化を実行' : '確認重設'}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* Reset Success Notice */}
              {resetSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs font-bold flex items-center justify-center gap-2 animate-fade-in shadow-inner">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="leading-snug text-center">
                    {currentLang === 'zh-CN'
                      ? '已成功重设！本地游戏进度已恢复至初始状态。'
                      : currentLang === 'en'
                      ? 'Reset complete! Local game data restored to defaults.'
                      : currentLang === 'ja'
                      ? '初期化完了！ゲームデータが初期状態に戻りました。'
                      : '已成功重設！本機遊戲進度已回復至初始狀態。'}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </CuteModalBackground>
    </div>
  );
};
