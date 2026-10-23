import React, { useId } from 'react';

interface CoinIconProps {
  className?: string;
  size?: number;
}

export const CoinIcon: React.FC<CoinIconProps> = ({ className = 'w-4 h-4', size }) => {
  const rawId = useId();
  const id = rawId.replace(/[^a-zA-Z0-9_-]/g, '_');

  const style = size ? { width: size, height: size } : undefined;

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 align-middle ${className}`}
      style={style}
      aria-label="Gold Coin"
    >
      <defs>
        <linearGradient id={`outer_${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="50%" stopColor="#EAB308" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
        <linearGradient id={`inner_${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="40%" stopColor="#FACC15" />
          <stop offset="100%" stopColor="#CA8A04" />
        </linearGradient>
        <linearGradient id={`star_${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="60%" stopColor="#FEF08A" />
          <stop offset="100%" stopColor="#EAB308" />
        </linearGradient>
      </defs>

      {/* 3D Depth Shadow */}
      <circle cx="12" cy="12.8" r="10" fill="#78350F" opacity="0.6" />

      {/* Outer Coin Body */}
      <circle cx="12" cy="12" r="10" fill={`url(#outer_${id})`} />

      {/* Embossed Inner Face */}
      <circle
        cx="12"
        cy="12"
        r="7.8"
        fill={`url(#inner_${id})`}
        stroke="#A16207"
        strokeWidth="0.8"
      />

      {/* Cute Arcade Coin Center Star */}
      <path
        d="M12 7.2L13.3 10.3L16.5 10.5L14.1 12.6L14.8 15.8L12 14.1L9.2 15.8L9.9 12.6L7.5 10.5L10.7 10.3L12 7.2Z"
        fill={`url(#star_${id})`}
        stroke="#854D0E"
        strokeWidth="0.6"
        strokeLinejoin="round"
      />

      {/* Glossy Highlight Reflection */}
      <ellipse
        cx="8.5"
        cy="7.2"
        rx="2.8"
        ry="1.1"
        transform="rotate(-30 8.5 7.2)"
        fill="#FFFFFF"
        opacity="0.65"
      />
    </svg>
  );
};
