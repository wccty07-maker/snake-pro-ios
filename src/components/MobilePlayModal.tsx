import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Smartphone, QrCode, Copy, Check, ExternalLink, HelpCircle, X, Share2, Sparkles, MonitorSmartphone, ChevronRight } from 'lucide-react';
import { soundEngine } from '../utils/audio';
import { SupportedLanguage } from '../utils/i18n';
import { CuteModalBackground } from './CuteModalBackground';
import { AppLogo } from './AppLogo';

interface MobilePlayModalProps {
  isOpen: boolean;
  language?: SupportedLanguage;
  onClose: () => void;
}

export const MobilePlayModal: React.FC<MobilePlayModalProps> = ({
  isOpen,
  language = 'zh-HK',
  onClose,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [selectedUrlType, setSelectedUrlType] = useState<'shared' | 'dev'>('shared');

  const sharedUrl = 'https://ais-pre-l5epuk5w5rv23ucy3hzhpy-918051111526.europe-west2.run.app';
  const devUrl = 'https://ais-dev-l5epuk5w5rv23ucy3hzhpy-918051111526.europe-west2.run.app';

  const currentUrl = selectedUrlType === 'shared' ? sharedUrl : devUrl;

  useEffect(() => {
    if (!isOpen) return;

    QRCode.toDataURL(currentUrl, {
      width: 260,
      margin: 2,
      color: {
        dark: '#030712',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate QR code', err));
  }, [isOpen, currentUrl]);

  if (!isOpen) return null;

  const handleCopy = () => {
    soundEngine.playClick();
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isEn = language === 'en';

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-4 pt-[calc(max(env(safe-area-inset-top),0.5rem)+3.2rem)] pb-3 bg-slate-950/80 backdrop-blur-md animate-fade-in select-none overflow-hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          soundEngine.playClick();
          onClose();
        }
      }}
    >
      <CuteModalBackground
        theme="mobile"
        className="w-full max-w-md max-h-[calc(100dvh-max(env(safe-area-inset-top),0.5rem)-4.5rem)] text-slate-100 flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Pinned Sticky Header */}
        <div className="flex items-center justify-between border-b border-teal-500/20 p-3.5 sm:p-4 bg-slate-950/75 shrink-0 gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <AppLogo size={40} showGlow={true} />
            <div className="min-w-0">
              <h2 className="text-base font-black text-white flex items-center gap-1.5 truncate">
                <span>{isEn ? 'Mobile Play Guide' : language === 'zh-CN' ? '手机试玩指引' : '手機試玩指引'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30 shrink-0">
                  QR Code
                </span>
              </h2>
              <p className="text-xs text-slate-400 truncate">
                {isEn ? 'Quick mobile preview & QR scanner' : language === 'zh-CN' ? '解决「Page not found」及手机快速试玩' : '解決「Page not found」及手機快速試玩'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all active:scale-95 shrink-0 cursor-pointer shadow-md touch-manipulation"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 min-h-0 flex flex-col gap-3.5">
          {/* Clarification about Share */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs leading-relaxed space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-amber-300 text-sm">
              <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                {isEn ? 'How to preview on your smartphone?' : language === 'zh-CN' ? '为什么 Safari 会显示「Page not found」？' : '點解 Safari 會出「Page not found」？'}
              </span>
            </div>
            <p className="text-slate-300 text-[12px]">
              {isEn
                ? 'Click the "Share" button in the upper right corner of AI Studio to publish the live preview URL, then scan this QR code with your iPhone or Android camera!'
                : language === 'zh-CN'
                ? '因为 Google AI Studio 的公开预览网址需要在电脑版右上角点击一次「Share」(分享) 按钮发布！未发布前 Google 服务器尚未开通此公开网址，所以 Safari 会出现 404。'
                : '因為 Google AI Studio 嘅公開預覽網址需要喺電腦版右上角撳一次「Share」(分享) 按鈕發布！未發布前 Google 伺服器仲未開通此公開網址，所以 Safari 會出 404。'}
            </p>
          </div>

          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="QR Code"
                className="w-48 h-48 rounded-xl border border-white/20 shadow-md p-2 bg-white"
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center text-slate-500">
                Generating QR...
              </div>
            )}

            <button
              type="button"
              onClick={handleCopy}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95 min-h-[44px]"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? (isEn ? 'Copied!' : language === 'zh-CN' ? '已复制！' : '已複製！') : (isEn ? 'Copy Game Link' : language === 'zh-CN' ? '复制游戏网址' : '複製遊戲網址')}</span>
            </button>
          </div>

          {/* Mobile Home Screen App Icon Preview */}
          <div className="p-3 bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-slate-950 rounded-2xl border border-emerald-500/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <AppLogo size={46} showGlow={true} />
              <div>
                <div className="font-extrabold text-white text-xs">
                  {language === 'zh-CN' ? '添加到主屏幕效果' : '加入主畫面效果'}
                </div>
                <div className="text-[10px] text-emerald-300/80">
                  {language === 'zh-CN' ? 'iPhone 桌面将显示全新可爱怪兽萌蛇 Logo' : 'iPhone 桌面將顯示全新可愛怪獸萌蛇 Logo'}
                </div>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">
              {language === 'zh-CN' ? 'PWA 支持' : 'PWA 支援'}
            </span>
          </div>
        </div>
      </CuteModalBackground>
    </div>
  );
};
