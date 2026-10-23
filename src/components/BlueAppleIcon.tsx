import React from 'react';

interface BlueAppleIconProps {
  className?: string;
  size?: number;
}

export const BlueAppleIcon: React.FC<BlueAppleIconProps> = ({
  className = 'w-3.5 h-3.5',
  size,
}) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 align-middle ${className}`}
      style={size ? { width: size, height: size } : undefined}
      aria-hidden="true"
    >
      <defs>
        {/* Apple body radial gradient */}
        <radialGradient id="blueAppleBodyGrad" cx="35%" cy="32%" r="68%">
          <stop offset="0%" stopColor="#bae6fd" />
          <stop offset="28%" stopColor="#38bdf8" />
          <stop offset="72%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#0369a1" />
        </radialGradient>

        {/* Gloss shine gradient */}
        <linearGradient id="blueAppleShineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>

        {/* Vibrant green leaf gradient */}
        <linearGradient id="blueAppleLeafGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#86efac" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
      </defs>

      {/* Apple stem */}
      <path
        d="M12 7.2C12.3 4.6 13.9 2.9 16.2 2.2C15.9 3.9 14.8 5.8 13.1 6.8C12.7 7 12.3 7.1 12 7.2Z"
        fill="#78350f"
      />

      {/* Fresh green leaf */}
      <path
        d="M12.5 5.2C14.6 2.8 18.6 2.8 19.2 6.2C16.6 7.2 13.6 6.7 12.5 5.2Z"
        fill="url(#blueAppleLeafGrad)"
      />

      {/* Cute glossy apple body */}
      <path
        d="M12 7.8C10.5 6.2 7 6.2 4.8 8.2C2.2 10.6 2 15 4.5 18.5C6 20.6 8 22 10.2 22C11 22 11.6 21.6 12 21.6C12.4 21.6 13 22 13.8 22C16 22 18 20.6 19.5 18.5C22 15 21.8 10.6 19.2 8.2C17 6.2 13.5 6.2 12 7.8Z"
        fill="url(#blueAppleBodyGrad)"
      />

      {/* Left shoulder gloss shine */}
      <ellipse
        cx="7.6"
        cy="11.4"
        rx="2.1"
        ry="3.6"
        transform="rotate(-26 7.6 11.4)"
        fill="url(#blueAppleShineGrad)"
      />

      {/* Sparkle glint */}
      <circle cx="6.5" cy="9.2" r="0.9" fill="#ffffff" opacity="0.95" />
    </svg>
  );
};
