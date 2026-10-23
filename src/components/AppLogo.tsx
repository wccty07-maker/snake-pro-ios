import React from 'react';

interface AppLogoProps {
  size?: number | string;
  className?: string;
  variant?: 'squircle' | 'round' | 'raw';
  showGlow?: boolean;
  showCrown?: boolean;
  withText?: boolean;
  subText?: string;
  onClick?: () => void;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 48,
  className = '',
  variant = 'squircle',
  showGlow = true,
  withText = false,
  subText,
  onClick,
}) => {
  const sizeNum = typeof size === 'number' ? size : parseInt(size, 10) || 48;

  const roundedClasses =
    variant === 'squircle'
      ? 'rounded-[23%]'
      : variant === 'round'
      ? 'rounded-full'
      : 'rounded-none';

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2 select-none ${
        onClick ? 'cursor-pointer active:scale-95 transition-transform' : ''
      } ${className}`}
    >
      {/* Icon Graphic Container */}
      <div
        className={`relative flex items-center justify-center shrink-0 overflow-hidden ${roundedClasses} transition-all duration-300`}
        style={{
          width: sizeNum,
          height: sizeNum,
          boxShadow: showGlow
            ? '0 8px 24px -4px rgba(16, 185, 129, 0.4), 0 0 16px rgba(56, 189, 248, 0.35)'
            : '0 4px 12px rgba(0, 0, 0, 0.3)',
        }}
      >
        <img
          src="/icon.svg"
          alt="Snake Pro Logo"
          width={sizeNum}
          height={sizeNum}
          className="w-full h-full object-cover select-none pointer-events-none"
          loading="eager"
          decoding="async"
        />

        {/* Glossy top overlay reflection highlight */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Optional Branding Text */}
      {withText && (
        <div className="flex flex-col text-left leading-tight min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-sm sm:text-base text-white tracking-wide bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 bg-clip-text text-transparent truncate drop-shadow-sm font-sans">
              Snake
            </span>
            <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-sm leading-none shrink-0">
              PRO
            </span>
          </div>
          {subText && (
            <span className="text-[10px] text-slate-400 font-medium truncate">
              {subText}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
