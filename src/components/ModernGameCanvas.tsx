import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Point, Direction, FoodItem, Particle, FloatingText, SnakeSkin, ArenaTheme, LevelMission, RovingSnake, ControlType } from '../types';
import { GRID_COLS, GRID_ROWS } from '../hooks/useSnakeEngine';
import { Pause, Play, RotateCcw, Home, Target, ShieldAlert } from 'lucide-react';
import { soundEngine } from '../utils/audio';
import { SupportedLanguage, getTranslation } from '../utils/i18n';
import { getLocalizedLevel } from '../utils/levelsData';
import { CuteModalBackground } from './CuteModalBackground';

interface ModernGameCanvasProps {
  snake: Point[];
  direction: Direction;
  foodItems: FoodItem[];
  obstacles: Point[];
  rovingSnakes?: RovingSnake[];
  particles?: Particle[];
  floatingTexts?: FloatingText[];
  fxRef?: React.MutableRefObject<{ particles: Particle[]; floatingTexts: FloatingText[] }>;
  skin: SnakeSkin;
  arena: ArenaTheme;
  showGrid: boolean;
  isShieldActive: boolean;
  isSlowActive: boolean;
  isMagnetActive?: boolean;
  isFireActive?: boolean;
  isKeyAuraActive?: boolean;
  isRainbowActive?: boolean;
  isLightningActive?: boolean;
  powerUpTimeLeft?: {
    shield: number;
    slow: number;
    fire: number;
    magnet: number;
    ghost?: number;
    keyAura?: number;
    rainbow?: number;
    lightning?: number;
  };
  portals?: [Point, Point];
  isPaused?: boolean;
  score?: number;
  coinsEarned?: number;
  currentMission?: LevelMission;
  language?: SupportedLanguage;
  controlType?: ControlType;
  combo?: number;
  isGhostActive?: boolean;
  snakeColor?: 'NORMAL' | 'RED' | 'BLUE' | 'GREEN';
  colorSequenceIndex?: number;
  turnsLeft?: number;
  isSlidingOnIce?: boolean;
  isFullyIlluminated?: boolean;
  currentSpeedMs?: number;
  batterySaverEnabled?: boolean;
  targetFps?: 30 | 60;
  glowEffectsEnabled?: boolean;
  onDirectionChange: (dir: Direction) => void;
  onToggleControlType?: (type: ControlType) => void;
  onTogglePause?: () => void;
  onRestart?: () => void;
  onQuit?: () => void;
}

export const ModernGameCanvas: React.FC<ModernGameCanvasProps> = ({
  snake,
  direction,
  foodItems,
  obstacles,
  rovingSnakes = [],
  particles = [],
  floatingTexts = [],
  fxRef,
  skin,
  arena,
  showGrid,
  isShieldActive,
  isSlowActive,
  isMagnetActive = false,
  isFireActive = false,
  isKeyAuraActive = false,
  isRainbowActive = false,
  isLightningActive = false,
  powerUpTimeLeft,
  portals,
  isPaused = false,
  score = 0,
  coinsEarned = 0,
  currentMission,
  language = 'zh-HK',
  controlType = 'DPAD',
  combo = 0,
  isGhostActive = false,
  snakeColor = 'NORMAL',
  colorSequenceIndex = 0,
  turnsLeft,
  isSlidingOnIce = false,
  isFullyIlluminated = false,
  currentSpeedMs,
  batterySaverEnabled = false,
  targetFps = 60,
  glowEffectsEnabled = true,
  onDirectionChange,
  onToggleControlType,
  onTogglePause,
  onRestart,
  onQuit,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Offscreen canvas background layer cache & proxy cache (Zero-allocation & offscreen blit)
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const bgCacheKeyRef = useRef<string>('');
  const proxyCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const lastRawCtxRef = useRef<CanvasRenderingContext2D | null>(null);

  // Double tap detection refs
  const lastTapRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const touchMovedRef = useRef<boolean>(false);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);

  // Swipe gesture tracking
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const [touchIndicator, setTouchIndicator] = useState<{ x: number; y: number; active: boolean } | null>(null);

  // Quick double-tap visual ripple animation state
  const [doubleTapRipple, setDoubleTapRipple] = useState<{ x: number; y: number } | null>(null);

  // Double-tap hint helper (shows briefly then fades away)
  const [showDoubleTapHint, setShowDoubleTapHint] = useState<boolean>(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowDoubleTapHint(false);
    }, 4500);
    return () => clearTimeout(timer);
  }, []);

  // Trigger double tap pause/resume
  const triggerDoubleTapAction = useCallback((clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setDoubleTapRipple({
        x: clientX - rect.left,
        y: clientY - rect.top,
      });
      setTimeout(() => setDoubleTapRipple(null), 600);
    }

    soundEngine.playDoubleTap();
    if (isPaused) {
      soundEngine.playResume();
    } else {
      soundEngine.playPause();
    }

    if (onTogglePause) {
      onTogglePause();
    }
  }, [onTogglePause, isPaused]);

  // Handle Touch Start
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setTouchIndicator({
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
        active: true,
      });
    }

    touchMovedRef.current = false;
    touchStartPosRef.current = {
      x: touch.clientX,
      y: touch.clientY,
    };

    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
  };

  // Handle Touch Move
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current || e.touches.length !== 1) return;
    const touch = e.touches[0];

    // Measure total displacement from start to distinguish taps from swipes
    if (touchStartPosRef.current) {
      const distFromStart = Math.hypot(
        touch.clientX - touchStartPosRef.current.x,
        touch.clientY - touchStartPosRef.current.y
      );
      if (distFromStart > 12) {
        touchMovedRef.current = true;
      }
    }

    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const minDistance = 16; // ultra-responsive swipe threshold

    if (Math.abs(dx) > minDistance || Math.abs(dy) > minDistance) {
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) {
          onDirectionChange('RIGHT');
        } else {
          onDirectionChange('LEFT');
        }
      } else {
        if (dy > 0) {
          onDirectionChange('DOWN');
        } else {
          onDirectionChange('UP');
        }
      }
      // Reset start to continuous smooth gestures
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
    }
  };

  // Handle Touch End (detect Double Tap)
  const handleTouchEnd = (e: React.TouchEvent) => {
    const endTouch = e.changedTouches[0];
    touchStartRef.current = null;
    setTouchIndicator(null);

    // If finger was stationary (not a swipe drag), test for double tap!
    if (!touchMovedRef.current && endTouch && touchStartPosRef.current) {
      const now = Date.now();
      const lastTap = lastTapRef.current;

      if (lastTap && now - lastTap.time < 350) {
        const dist = Math.hypot(
          endTouch.clientX - lastTap.x,
          endTouch.clientY - lastTap.y
        );

        if (dist < 50) {
          // Double tap detected!
          lastTapRef.current = null;
          triggerDoubleTapAction(endTouch.clientX, endTouch.clientY);
          return;
        }
      }

      // Record first tap
      lastTapRef.current = {
        time: now,
        x: endTouch.clientX,
        y: endTouch.clientY,
      };
    }
  };

  // Desktop double click support
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    triggerDoubleTapAction(e.clientX, e.clientY);
  };

  // Desktop keyboard fallback steering
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return;

      if (isPaused) {
        if (e.key === ' ' && onTogglePause) {
          e.preventDefault();
          onTogglePause();
        }
        return;
      }

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          onDirectionChange('UP');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          onDirectionChange('DOWN');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          onDirectionChange('LEFT');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          onDirectionChange('RIGHT');
          break;
        case ' ':
          e.preventDefault();
          if (onTogglePause) onTogglePause();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPaused, onDirectionChange, onTogglePause]);

  // Helper to render static background layers (Moat, Grid, Themed Obstacles, Outer Boundary Wall) onto offscreen cache
  const renderOffscreenBackground = useCallback(
    (
      targetCanvas: HTMLCanvasElement,
      w: number,
      h: number,
      gX: number,
      gY: number,
      gW: number,
      gH: number,
      cW: number,
      cH: number,
      enableGlow: boolean
    ) => {
      const offCtx = targetCanvas.getContext('2d');
      if (!offCtx) return;

      offCtx.clearRect(0, 0, w, h);

      // 1. Draw Outer Arena Wall Moat Background
      const bgGrad = offCtx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, arena.bgGradient[0]);
      bgGrad.addColorStop(1, arena.bgGradient[1]);
      offCtx.fillStyle = bgGrad;
      offCtx.fillRect(0, 0, w, h);

      // 1.5. Playable Grid Mat Background (soft contrast separating grid from outer boundary moat)
      offCtx.fillStyle = 'rgba(0, 0, 0, 0.32)';
      offCtx.beginPath();
      offCtx.roundRect(gX, gY, gW, gH, 6);
      offCtx.fill();

      // 2. Subtle Clean Straight Grid Lines (Inside playable arena)
      if (showGrid) {
        offCtx.strokeStyle = arena.gridColor || 'rgba(56, 189, 248, 0.14)';
        offCtx.lineWidth = 1;
        offCtx.beginPath();
        // Internal vertical grid lines
        for (let x = 1; x < GRID_COLS; x++) {
          const lx = Math.round(gX + x * cW) + 0.5;
          offCtx.moveTo(lx, gY);
          offCtx.lineTo(lx, gY + gH);
        }
        // Internal horizontal grid lines
        for (let y = 1; y < GRID_ROWS; y++) {
          const ly = Math.round(gY + y * cH) + 0.5;
          offCtx.moveTo(gX, ly);
          offCtx.lineTo(gX + gW, ly);
        }
        offCtx.stroke();

        // Clean grid board bounding border (separates grid from the boundary moat)
        offCtx.strokeStyle = arena.gridColor ? arena.gridColor.replace(/[\d.]+\)$/, '0.35)') : 'rgba(56, 189, 248, 0.25)';
        offCtx.lineWidth = 1;
        offCtx.beginPath();
        offCtx.roundRect(gX, gY, gW, gH, 6);
        offCtx.stroke();
      }

      // 3. Outer Boundary Wall + corner tech brackets + subtle glint (baked into offscreen cache)
      offCtx.save();
      offCtx.strokeStyle = arena.wallColor;
      offCtx.lineWidth = 2.5;
      if (enableGlow) {
        offCtx.shadowColor = arena.wallGlow;
        offCtx.shadowBlur = 10;
      }
      offCtx.beginPath();
      offCtx.roundRect(2, 2, w - 4, h - 4, 14);
      offCtx.stroke();

      const bracketLen = 12;
      offCtx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
      offCtx.lineWidth = 2;
      // Top-left
      offCtx.beginPath();
      offCtx.moveTo(3, 3 + bracketLen);
      offCtx.lineTo(3, 3);
      offCtx.lineTo(3 + bracketLen, 3);
      // Top-right
      offCtx.moveTo(w - 3 - bracketLen, 3);
      offCtx.lineTo(w - 3, 3);
      offCtx.lineTo(w - 3, 3 + bracketLen);
      // Bottom-left
      offCtx.moveTo(3, h - 3 - bracketLen);
      offCtx.lineTo(3, h - 3);
      offCtx.lineTo(3 + bracketLen, h - 3);
      // Bottom-right
      offCtx.moveTo(w - 3 - bracketLen, h - 3);
      offCtx.lineTo(w - 3, h - 3);
      offCtx.lineTo(w - 3, h - 3 - bracketLen);
      offCtx.stroke();

      // Subtle glint on top edge of boundary wall
      offCtx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      offCtx.lineWidth = 1.5;
      offCtx.beginPath();
      offCtx.moveTo(14, 2.5);
      offCtx.lineTo(w - 14, 2.5);
      offCtx.stroke();
      offCtx.restore();
    },
    [arena, showGrid]
  );

  // High-DPI canvas render loop
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rawCtx = canvas.getContext('2d');
    if (!rawCtx) return;

    // In Battery Saver mode (or when glow is disabled), reuse cached proxy to stop GPU gaussian blur passes
    // Zero-allocation: Reuses proxyCtxRef instead of creating new Proxy on every frame!
    const enableGlow = !batterySaverEnabled && (glowEffectsEnabled ?? true);
    let ctx = rawCtx;
    if (!enableGlow) {
      if (!proxyCtxRef.current || lastRawCtxRef.current !== rawCtx) {
        lastRawCtxRef.current = rawCtx;
        proxyCtxRef.current = new Proxy(rawCtx, {
          set(target, prop, value) {
            if (prop === 'shadowBlur') {
              target.shadowBlur = 0;
              return true;
            }
            // @ts-ignore
            target[prop] = value;
            return true;
          },
          get(target, prop) {
            // @ts-ignore
            const val = target[prop];
            if (typeof val === 'function') {
              return val.bind(target);
            }
            return val;
          },
        }) as CanvasRenderingContext2D;
      }
      ctx = proxyCtxRef.current;
    }

    const width = canvas.width;
    const height = canvas.height;
    // Arena padding / buffer so Boundary Wall does not cling to or cover the grid
    const ARENA_PADDING = 8; // breathing margin between outer boundary wall and playable grid
    const gridX = ARENA_PADDING;
    const gridY = ARENA_PADDING;
    const gridWidth = width - ARENA_PADDING * 2;
    const gridHeight = height - ARENA_PADDING * 2;
    const cellW = gridWidth / GRID_COLS;
    const cellH = gridHeight / GRID_ROWS;

    ctx.clearRect(0, 0, width, height);

    // 1. Offscreen background layer caching (caches static backdrop, grid mat, grid lines, and boundary wall)
    const currentBgKey = `${width}x${height}_${arena.id}_${showGrid}_${batterySaverEnabled}_${glowEffectsEnabled}`;
    if (
      !offscreenCanvasRef.current ||
      offscreenCanvasRef.current.width !== width ||
      offscreenCanvasRef.current.height !== height ||
      bgCacheKeyRef.current !== currentBgKey
    ) {
      if (!offscreenCanvasRef.current) {
        offscreenCanvasRef.current = document.createElement('canvas');
      }
      offscreenCanvasRef.current.width = width;
      offscreenCanvasRef.current.height = height;
      bgCacheKeyRef.current = currentBgKey;
      renderOffscreenBackground(
        offscreenCanvasRef.current,
        width,
        height,
        gridX,
        gridY,
        gridWidth,
        gridHeight,
        cellW,
        cellH,
        enableGlow
      );
    }

    // High performance single texture blit (draws background moat, grid mat, grid lines, obstacles, boundary wall)
    if (offscreenCanvasRef.current) {
      ctx.drawImage(offscreenCanvasRef.current, 0, 0);
    }

    // 3.5. Draw Spatial Warp Portals (雙向時空傳送門 🌀)
    // 嚴格限制：傳送門只限於設有傳送門之任務關卡（LEVELS 闖關模式），經典模式與計時模式絕不顯示傳送門
    const activePortals = currentMission?.hasPortals ? (portals || currentMission.portals) : undefined;
    if (activePortals && activePortals.length === 2) {
      const now = Date.now();
      const rot = (now / 350) % (Math.PI * 2);
      const portalRadius = Math.min(cellW, cellH) * 0.72;

      activePortals.forEach((pt, pIdx) => {
        const px = gridX + pt.x * cellW + cellW / 2;
        const py = gridY + pt.y * cellH + cellH / 2;
        const isAlpha = pIdx === 0;

        ctx.save();
        ctx.translate(px, py);

        // Glow aura
        ctx.shadowColor = isAlpha ? 'rgba(56, 189, 248, 0.95)' : 'rgba(251, 146, 60, 0.95)';
        ctx.shadowBlur = 18;

        // Outer pulsing ring
        const pulseR = portalRadius * (1 + Math.sin(now / 200 + pIdx) * 0.1);
        ctx.strokeStyle = isAlpha ? '#38bdf8' : '#fb923c';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, pulseR, 0, Math.PI * 2);
        ctx.stroke();

        // Inner vortex swirling gradient
        const vortexGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, portalRadius);
        vortexGrad.addColorStop(0, '#ffffff');
        vortexGrad.addColorStop(0.4, isAlpha ? '#06b6d4' : '#f97316');
        vortexGrad.addColorStop(0.8, isAlpha ? '#0e7490' : '#c2410c');
        vortexGrad.addColorStop(1, '#020617');
        ctx.fillStyle = vortexGrad;
        ctx.beginPath();
        ctx.arc(0, 0, portalRadius * 0.88, 0, Math.PI * 2);
        ctx.fill();

        // Swirl spiral arms
        ctx.rotate(isAlpha ? rot : -rot);
        ctx.strokeStyle = isAlpha ? '#bae6fd' : '#fed7aa';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.arc(0, 0, portalRadius * 0.65, (i * Math.PI * 2) / 3, (i * Math.PI * 2) / 3 + 1.2);
          ctx.stroke();
        }

        // Center Symbol
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(isAlpha ? 'α' : 'β', 0, 0.5);

        ctx.restore();
      });
    }

    // 3.6. Draw Ice Tiles (滑冰地面 🧊)
    const activeIceTiles = currentMission?.iceTiles;
    if (activeIceTiles && activeIceTiles.length > 0) {
      activeIceTiles.forEach((tile) => {
        const ix = gridX + tile.x * cellW;
        const iy = gridY + tile.y * cellH;
        ctx.save();
        ctx.fillStyle = 'rgba(186, 230, 253, 0.28)';
        ctx.fillRect(ix + 1, iy + 1, cellW - 2, cellH - 2);
        ctx.strokeStyle = 'rgba(125, 211, 252, 0.65)';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(ix + 1.5, iy + 1.5, cellW - 3, cellH - 3);

        // Subtle frost crystal in center
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.font = `${Math.floor(cellW * 0.52)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('❄️', ix + cellW / 2, iy + cellH / 2);
        ctx.restore();
      });
    }

    // 3.7. Draw Color Gates (顏色閘門 🔴 🔵 🟢)
    const activeColorGates = currentMission?.colorGates;
    if (activeColorGates && activeColorGates.length > 0) {
      activeColorGates.forEach((gate) => {
        const gx = gridX + gate.x * cellW;
        const gy = gridY + gate.y * cellH;
        const isMatch = snakeColor === gate.color;
        const gColor = gate.color === 'RED' ? '#f43f5e' : gate.color === 'BLUE' ? '#38bdf8' : '#22c55e';

        ctx.save();
        ctx.shadowColor = gColor;
        ctx.shadowBlur = isMatch ? 8 : 16;
        ctx.fillStyle = isMatch ? `${gColor}35` : `${gColor}75`;
        ctx.fillRect(gx + 1, gy + 1, cellW - 2, cellH - 2);

        ctx.strokeStyle = gColor;
        ctx.lineWidth = 2.2;
        ctx.strokeRect(gx + 2, gy + 2, cellW - 4, cellH - 4);

        // Gate laser bars
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(gx + 4, gy + cellH / 2);
        ctx.lineTo(gx + cellW - 4, gy + cellH / 2);
        ctx.stroke();

        // Symbol (Unlocked checkmark vs Locked Padlock)
        ctx.shadowBlur = 0;
        ctx.font = `${Math.floor(cellW * 0.48)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(isMatch ? '🔓' : '🔒', gx + cellW / 2, gy + cellH / 2);
        ctx.restore();
      });
    }

    // 3.8. Draw Themed Obstacles dynamically (Direct reactive rendering: always 100% in sync with level obstacles)
    if (obstacles && obstacles.length > 0) {
      const worldId = currentMission?.worldId || 1;
      obstacles.forEach((obs) => {
        const ox = gridX + obs.x * cellW;
        const oy = gridY + obs.y * cellH;

        ctx.save();
        if (worldId === 2) {
          // Jade Monolith (翡翠神柱)
          ctx.fillStyle = '#0f766e';
          ctx.strokeStyle = '#2dd4bf';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.roundRect(ox + 2, oy + 2, cellW - 4, cellH - 4, 6);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#5eead4';
          ctx.beginPath();
          ctx.arc(ox + cellW / 2, oy + cellH / 2, 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (worldId === 3) {
          // Sweet Candy Kingdom (糖果甜點威化柱)
          ctx.fillStyle = '#db2777';
          ctx.strokeStyle = '#f472b6';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.roundRect(ox + 2, oy + 2, cellW - 4, cellH - 4, 6);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#fdf2f8';
          ctx.fillRect(ox + 4, oy + cellH / 2 - 1.5, cellW - 8, 3);
        } else if (worldId === 4) {
          // Molten Magma Basalt (玄武熔岩石)
          ctx.fillStyle = '#290e05';
          ctx.strokeStyle = '#f97316';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.roundRect(ox + 2, oy + 2, cellW - 4, cellH - 4, 6);
          ctx.fill();
          ctx.stroke();
          // Glowing magma crack
          ctx.strokeStyle = '#fb923c';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(ox + 4, oy + 4);
          ctx.lineTo(ox + cellW / 2, oy + cellH / 2);
          ctx.lineTo(ox + cellW - 4, oy + cellH - 4);
          ctx.stroke();
        } else if (worldId === 5) {
          // Neon Cyber Circuit Grid (高壓霓虹光柵)
          ctx.fillStyle = '#0f172a';
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.roundRect(ox + 2, oy + 2, cellW - 4, cellH - 4, 5);
          ctx.fill();
          ctx.stroke();
          ctx.strokeStyle = '#f43f5e';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(ox + cellW / 2, oy + 4);
          ctx.lineTo(ox + cellW / 2, oy + cellH - 4);
          ctx.stroke();
        } else if (worldId === 6) {
          // Phantom Shadow Tombstone (幽冥石碑)
          ctx.fillStyle = '#2e1065';
          ctx.strokeStyle = '#a855f7';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.roundRect(ox + 2, oy + 2, cellW - 4, cellH - 4, 6);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#c084fc';
          ctx.beginPath();
          ctx.arc(ox + cellW / 2, oy + cellH / 2, 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (worldId === 7) {
          // Deep Sea Coral Reef (深海水晶礁)
          ctx.fillStyle = '#0c4a6e';
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.roundRect(ox + 2, oy + 2, cellW - 4, cellH - 4, 7);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#7dd3fc';
          ctx.beginPath();
          ctx.arc(ox + cellW / 2, oy + cellH / 2, 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (worldId === 8 || worldId === 16) {
          // Glacial Ice Peak (極地冰霜岩)
          ctx.fillStyle = '#075985';
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.roundRect(ox + 2, oy + 2, cellW - 4, cellH - 4, 6);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#e0f2fe';
          ctx.beginPath();
          ctx.arc(ox + cellW / 2, oy + cellH / 2, 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (worldId === 9) {
          // Foggy Shrouded Woods (迷霧幽暗林 · 巨龍荊棘黑曜岩)
          // High-visibility crisp border + glowing crimson/rose core (eliminates blending into dark fog)
          ctx.fillStyle = '#18181b';
          ctx.strokeStyle = '#f43f5e';
          ctx.lineWidth = 2.2;
          if (enableGlow) {
            ctx.shadowColor = 'rgba(244, 63, 94, 0.7)';
            ctx.shadowBlur = 9;
          }
          ctx.beginPath();
          ctx.roundRect(ox + 2, oy + 2, cellW - 4, cellH - 4, 6);
          ctx.fill();
          ctx.stroke();

          // Spooky thorn cross rune
          ctx.strokeStyle = '#fb7185';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(ox + 5, oy + cellH / 2);
          ctx.lineTo(ox + cellW - 5, oy + cellH / 2);
          ctx.moveTo(ox + cellW / 2, oy + 5);
          ctx.lineTo(ox + cellW / 2, oy + cellH - 5);
          ctx.stroke();

          // Center glowing ruby dot
          ctx.fillStyle = '#e11d48';
          ctx.beginPath();
          ctx.arc(ox + cellW / 2, oy + cellH / 2, 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (worldId === 10 || worldId === 17) {
          // Demolition Blast Barricade (爆破危險鋼障)
          ctx.fillStyle = '#1e293b';
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(ox + 2, oy + 2, cellW - 4, cellH - 4, 6);
          ctx.fill();
          ctx.stroke();
          // Hazard warning stripe
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(ox + 4, oy + cellH - 4);
          ctx.lineTo(ox + cellW - 4, oy + 4);
          ctx.stroke();
        } else if (worldId === 11) {
          // Prismatic Realm (七彩稜鏡結晶)
          ctx.fillStyle = '#581c87';
          ctx.strokeStyle = '#c084fc';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.roundRect(ox + 2, oy + 2, cellW - 4, cellH - 4, 6);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#f43f5e';
          ctx.beginPath();
          ctx.arc(ox + cellW / 2, oy + cellH / 2, 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Classic Timber / Stone Block
          ctx.fillStyle = '#78350f';
          ctx.strokeStyle = '#b45309';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.roundRect(ox + 2, oy + 2, cellW - 4, cellH - 4, 7);
          ctx.fill();
          ctx.stroke();
          ctx.strokeStyle = '#92400e';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(ox + 4, oy + cellH / 2);
          ctx.lineTo(ox + cellW - 4, oy + cellH / 2);
          ctx.moveTo(ox + cellW / 2, oy + 4);
          ctx.lineTo(ox + cellW / 2, oy + cellH - 4);
          ctx.stroke();
          ctx.fillStyle = '#fef3c7';
          ctx.beginPath();
          ctx.arc(ox + cellW / 2, oy + cellH / 2, 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });
    }

    // 4. Draw Food Items with Pulse & Sparkles (Candy Crush Sweets & Jewels)
    const now = Date.now();
    const pulse = Math.sin(now / 180) * 0.12;

    foodItems.forEach((food) => {
      const fx = gridX + food.position.x * cellW + cellW / 2;
      const fy = gridY + food.position.y * cellH + cellH / 2;
      const radius = (Math.min(cellW, cellH) / 2 - 2) * (1 + pulse);

      ctx.save();
      ctx.translate(fx, fy);

      if (food.type === 'NORMAL') {
        // Red Apple (鮮甜紅蘋果 🍎，完美對應關卡目標紅蘋果圖標)
        ctx.shadowColor = 'rgba(239, 68, 68, 0.95)';
        ctx.shadowBlur = 15;

        // Rich red apple radial gradient with glossy 3D shine
        const appleGrad = ctx.createRadialGradient(-radius * 0.3, -radius * 0.3, radius * 0.15, 0, 0, radius);
        appleGrad.addColorStop(0, '#fecdd3'); // highlight soft rose
        appleGrad.addColorStop(0.3, '#f43f5e'); // vibrant ruby apple
        appleGrad.addColorStop(0.8, '#e11d48'); // rich crimson red
        appleGrad.addColorStop(1, '#881337'); // deep apple shadow
        ctx.fillStyle = appleGrad;

        // Main Apple Body
        ctx.beginPath();
        ctx.arc(0, 1, radius, 0, Math.PI * 2);
        ctx.fill();

        // Apple Dimple at top
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#9f1239';
        ctx.beginPath();
        ctx.ellipse(0, -radius * 0.72, radius * 0.22, radius * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();

        // Curved Apple Stem (褐色小果蒂)
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = Math.max(1.8, radius * 0.16);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, -radius * 0.68);
        ctx.quadraticCurveTo(1.5, -radius * 1.05, 3.2, -radius * 1.25);
        ctx.stroke();

        // Fresh Green Apple Leaf (翠綠蘋果葉片 🍃)
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.ellipse(3.8, -radius * 0.88, 4.5, 2.2, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#15803d';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Glossy Specular Glint (晶瑩高光亮點)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
        ctx.beginPath();
        ctx.arc(-radius * 0.35, -radius * 0.35, radius * 0.28, 0, Math.PI * 2);
        ctx.fill();

        // Secondary soft sparkle
        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.beginPath();
        ctx.arc(radius * 0.28, radius * 0.28, radius * 0.12, 0, Math.PI * 2);
        ctx.fill();
      } else if (food.type === 'GOLDEN') {
        // Golden Apple (璀璨金蘋果，完美統一全場蘋果體系，絕非星星)
        ctx.shadowColor = 'rgba(251, 191, 36, 0.95)';
        ctx.shadowBlur = 18;

        // Rich golden apple radial gradient with glossy 3D shine
        const goldAppleGrad = ctx.createRadialGradient(-radius * 0.3, -radius * 0.3, radius * 0.15, 0, 0, radius);
        goldAppleGrad.addColorStop(0, '#ffffff'); // bright specular center
        goldAppleGrad.addColorStop(0.2, '#fef9c3'); // shimmering soft gold
        goldAppleGrad.addColorStop(0.5, '#fde047'); // vibrant pure gold
        goldAppleGrad.addColorStop(0.8, '#eab308'); // rich amber gold
        goldAppleGrad.addColorStop(1, '#a16207'); // deep golden shadow
        ctx.fillStyle = goldAppleGrad;

        // Main Golden Apple Body
        ctx.beginPath();
        ctx.arc(0, 1, radius, 0, Math.PI * 2);
        ctx.fill();

        // Apple Dimple at top
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#a16207';
        ctx.beginPath();
        ctx.ellipse(0, -radius * 0.72, radius * 0.22, radius * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();

        // Curved Apple Stem (褐色小果蒂)
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = Math.max(1.8, radius * 0.16);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, -radius * 0.68);
        ctx.quadraticCurveTo(1.5, -radius * 1.05, 3.2, -radius * 1.25);
        ctx.stroke();

        // Fresh Emerald Apple Leaf (翠綠蘋果葉片 🍃)
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.ellipse(3.8, -radius * 0.88, 4.5, 2.2, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#15803d';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Glossy Specular Glint (晶瑩黃金高光亮點)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.beginPath();
        ctx.arc(-radius * 0.35, -radius * 0.35, radius * 0.28, 0, Math.PI * 2);
        ctx.fill();

        // Secondary soft sparkle
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(radius * 0.28, radius * 0.28, radius * 0.12, 0, Math.PI * 2);
        ctx.fill();

        // Soft golden glow ring / aura around the golden apple
        ctx.strokeStyle = 'rgba(253, 224, 71, 0.55)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 1, radius * 1.15, 0, Math.PI * 2);
        ctx.stroke();
      } else if (food.type === 'SHIELD') {
        // Monster Plasma Shield Orb (怪獸守護力場盾牌，嚴格只顯示盾牌，絕不顯示棒棒糖 🍭)
        ctx.shadowColor = 'rgba(56, 189, 248, 0.95)';
        ctx.shadowBlur = 16;

        const shieldGrad = ctx.createRadialGradient(0, 0, radius * 0.2, 0, 0, radius);
        shieldGrad.addColorStop(0, '#e0f2fe');
        shieldGrad.addColorStop(0.6, '#38bdf8');
        shieldGrad.addColorStop(1, '#0284c7');
        ctx.fillStyle = shieldGrad;

        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();

        // Cute bubble aura
        ctx.strokeStyle = '#bae6fd';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Pure crisp vector Shield Emblem + 🛡️ (只顯示盾牌，對齊關卡目標 🛡️)
        const sW = radius * 0.92;
        const sH = radius * 1.08;
        const topY = -sH * 0.48;
        const midY = -sH * 0.02;
        const botY = sH * 0.52;

        ctx.save();
        ctx.shadowBlur = 0;
        // Inner metallic shield badge shape
        ctx.beginPath();
        ctx.moveTo(0, topY);
        ctx.lineTo(sW * 0.48, topY + sH * 0.08);
        ctx.lineTo(sW * 0.44, midY);
        ctx.quadraticCurveTo(sW * 0.35, botY * 0.72, 0, botY);
        ctx.quadraticCurveTo(-sW * 0.35, botY * 0.72, -sW * 0.44, midY);
        ctx.lineTo(-sW * 0.48, topY + sH * 0.08);
        ctx.closePath();

        const badgeGrad = ctx.createLinearGradient(0, topY, 0, botY);
        badgeGrad.addColorStop(0, '#ffffff');
        badgeGrad.addColorStop(0.35, '#bae6fd');
        badgeGrad.addColorStop(0.7, '#38bdf8');
        badgeGrad.addColorStop(1, '#0284c7');
        ctx.fillStyle = badgeGrad;
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.6;
        ctx.stroke();

        // Centered clear shield icon 🛡️
        ctx.font = `bold ${Math.floor(radius * 0.85)}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🛡️', 0, 0.5);
        ctx.restore();
      } else if (food.type === 'SLOW') {
        // Grape Gummy Drop (紫葡萄晶凍 🍇 - 純向量立體葡萄串，絕不重影走位)
        ctx.shadowColor = 'rgba(192, 132, 252, 0.95)';
        ctx.shadowBlur = 14;

        // Top stem & vine leaf
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(0, -radius * 0.4);
        ctx.quadraticCurveTo(2, -radius * 0.75, 4, -radius * 0.95);
        ctx.stroke();

        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.ellipse(radius * 0.35, -radius * 0.65, radius * 0.32, radius * 0.18, -Math.PI / 6, 0, Math.PI * 2);
        ctx.fill();

        // Grape cluster berries
        const grapePositions = [
          { x: -radius * 0.38, y: -radius * 0.18, r: radius * 0.32 },
          { x: 0, y: -radius * 0.26, r: radius * 0.34 },
          { x: radius * 0.38, y: -radius * 0.18, r: radius * 0.32 },
          { x: -radius * 0.22, y: radius * 0.2, r: radius * 0.33 },
          { x: radius * 0.22, y: radius * 0.2, r: radius * 0.33 },
          { x: 0, y: radius * 0.58, r: radius * 0.3 },
        ];

        grapePositions.forEach((g) => {
          const gGrad = ctx.createRadialGradient(g.x - g.r * 0.3, g.y - g.r * 0.3, g.r * 0.15, g.x, g.y, g.r);
          gGrad.addColorStop(0, '#f3e8ff');
          gGrad.addColorStop(0.4, '#c084fc');
          gGrad.addColorStop(0.85, '#7e22ce');
          gGrad.addColorStop(1, '#581c87');
          ctx.fillStyle = gGrad;
          ctx.beginPath();
          ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2);
          ctx.fill();

          // Glint
          ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.beginPath();
          ctx.arc(g.x - g.r * 0.35, g.y - g.r * 0.35, g.r * 0.25, 0, Math.PI * 2);
          ctx.fill();
        });
      } else if (food.type === 'COIN') {
        // Golden Chocolate Coin (金幣巧克力)
        ctx.shadowColor = 'rgba(245, 158, 11, 0.9)';
        ctx.shadowBlur = 14;

        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Inner coin rim & star
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.7, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(217, 119, 6, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#b45309';
        ctx.font = `bold ${Math.floor(radius * 0.95)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('★', 0, 0.5);
      } else if (food.type === 'BLUE') {
        // Blue Raspberry Sugar Crystal (藍莓冰晶糖)
        ctx.shadowColor = 'rgba(56, 189, 248, 0.95)';
        ctx.shadowBlur = 14;

        const blueGrad = ctx.createRadialGradient(-radius * 0.3, -radius * 0.3, radius * 0.2, 0, 0, radius);
        blueGrad.addColorStop(0, '#bae6fd');
        blueGrad.addColorStop(0.5, '#38bdf8');
        blueGrad.addColorStop(1, '#0284c7');
        ctx.fillStyle = blueGrad;

        ctx.beginPath();
        ctx.arc(0, 1, radius, 0, Math.PI * 2);
        ctx.fill();

        // Leaf
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#67e8f9';
        ctx.beginPath();
        ctx.ellipse(3, -radius * 0.85, 4, 2, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();

        // Glint
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(-radius * 0.35, -radius * 0.35, radius * 0.28, 0, Math.PI * 2);
        ctx.fill();
      } else if (food.type === 'GREEN') {
        // Crisp Mint Apple Gummy (青蘋果薄荷糖)
        ctx.shadowColor = 'rgba(74, 222, 128, 0.95)';
        ctx.shadowBlur = 14;

        const greenGrad = ctx.createRadialGradient(-radius * 0.3, -radius * 0.3, radius * 0.2, 0, 0, radius);
        greenGrad.addColorStop(0, '#bbf7d0');
        greenGrad.addColorStop(0.5, '#4ade80');
        greenGrad.addColorStop(1, '#16a34a');
        ctx.fillStyle = greenGrad;

        ctx.beginPath();
        ctx.arc(0, 1, radius, 0, Math.PI * 2);
        ctx.fill();

        // Leaf
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#86efac';
        ctx.beginPath();
        ctx.ellipse(3, -radius * 0.85, 4, 2, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();

        // Glint
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(-radius * 0.35, -radius * 0.35, radius * 0.28, 0, Math.PI * 2);
        ctx.fill();
      } else if (food.type === 'CHILI') {
        // Blazing Fire Chili (烈焰辣椒 🌶️ - 純向量辣椒造型)
        ctx.shadowColor = 'rgba(249, 115, 22, 0.95)';
        ctx.shadowBlur = 16;

        // Chili curved body
        const chiliGrad = ctx.createLinearGradient(-radius * 0.5, -radius * 0.7, radius * 0.4, radius * 0.7);
        chiliGrad.addColorStop(0, '#fef08a');
        chiliGrad.addColorStop(0.25, '#f97316');
        chiliGrad.addColorStop(0.65, '#dc2626');
        chiliGrad.addColorStop(1, '#991b1b');
        ctx.fillStyle = chiliGrad;

        ctx.beginPath();
        ctx.moveTo(radius * 0.2, -radius * 0.65);
        ctx.bezierCurveTo(radius * 0.65, -radius * 0.1, radius * 0.35, radius * 0.55, -radius * 0.35, radius * 0.78);
        ctx.bezierCurveTo(-radius * 0.05, radius * 0.35, -radius * 0.32, -radius * 0.05, radius * 0.2, -radius * 0.65);
        ctx.closePath();
        ctx.fill();

        // Specular glint curve
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = Math.max(1, radius * 0.1);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(radius * 0.08, -radius * 0.45);
        ctx.quadraticCurveTo(radius * 0.35, -radius * 0.05, radius * 0.15, radius * 0.3);
        ctx.stroke();

        // Green calyx & stem
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.ellipse(radius * 0.2, -radius * 0.65, radius * 0.25, radius * 0.12, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#15803d';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(radius * 0.2, -radius * 0.65);
        ctx.quadraticCurveTo(radius * 0.35, -radius * 0.88, radius * 0.25, -radius * 1.05);
        ctx.stroke();
      } else if (food.type === 'MAGNET') {
        // Deep Sea Magnetic Pearl / Horseshoe (深海磁石 🧲 - 純向量經典磁石)
        ctx.shadowColor = 'rgba(6, 182, 212, 0.95)';
        ctx.shadowBlur = 16;

        const mR = radius * 0.88;
        const mW = radius * 0.32;

        // U-shaped Horseshoe body
        ctx.lineWidth = mW;
        ctx.lineCap = 'butt';

        // Red arch
        ctx.strokeStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(0, -radius * 0.1, mR * 0.65, Math.PI, 0);
        ctx.stroke();

        // Prongs extending down
        const leftX = -mR * 0.65;
        const rightX = mR * 0.65;
        const topY = -radius * 0.1;
        const midY = radius * 0.3;
        const botY = radius * 0.68;

        // Red upper legs
        ctx.strokeStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(leftX, topY);
        ctx.lineTo(leftX, midY);
        ctx.stroke();

        ctx.strokeStyle = '#3b82f6';
        ctx.beginPath();
        ctx.moveTo(rightX, topY);
        ctx.lineTo(rightX, midY);
        ctx.stroke();

        // Silver/White magnetic pole tips
        ctx.strokeStyle = '#f1f5f9';
        ctx.beginPath();
        ctx.moveTo(leftX, midY);
        ctx.lineTo(leftX, botY);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(rightX, midY);
        ctx.lineTo(rightX, botY);
        ctx.stroke();

        // Magnetic spark wave between poles
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(leftX + mW * 0.4, botY - 2);
        ctx.quadraticCurveTo(0, botY + 4, rightX - mW * 0.4, botY - 2);
        ctx.stroke();
      } else if (food.type === 'DRAGON_EGG') {
        // Ancient Dragon Egg (遠古巨龍蛋 🥚 - 純向量精緻龍紋寶蛋)
        ctx.shadowColor = 'rgba(244, 63, 94, 0.95)';
        ctx.shadowBlur = 18;

        const eW = radius * 0.85;
        const eH = radius * 1.1;

        // Egg base shape
        ctx.beginPath();
        ctx.moveTo(0, -eH);
        ctx.bezierCurveTo(eW * 0.88, -eH * 0.72, eW, eH * 0.45, 0, eH);
        ctx.bezierCurveTo(-eW, eH * 0.45, -eW * 0.88, -eH * 0.72, 0, -eH);
        ctx.closePath();

        const eggGrad = ctx.createRadialGradient(-eW * 0.35, -eH * 0.35, eW * 0.2, 0, 0, eH);
        eggGrad.addColorStop(0, '#fef08a');
        eggGrad.addColorStop(0.35, '#fb7185');
        eggGrad.addColorStop(0.75, '#be123c');
        eggGrad.addColorStop(1, '#4c0519');
        ctx.fillStyle = eggGrad;
        ctx.fill();

        // Golden magical crack runes
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(-eW * 0.4, -eH * 0.1);
        ctx.lineTo(-eW * 0.15, eH * 0.1);
        ctx.lineTo(-eW * 0.3, eH * 0.45);
        ctx.moveTo(-eW * 0.15, eH * 0.1);
        ctx.lineTo(eW * 0.25, 0);
        ctx.lineTo(eW * 0.4, eH * 0.3);
        ctx.stroke();

        // Glossy Specular Shine
        ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
        ctx.beginPath();
        ctx.ellipse(-eW * 0.35, -eH * 0.45, eW * 0.32, eH * 0.18, -Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (food.type === 'RAINBOW') {
        // Rainbow Lollipop (甜蜜彩虹棒棒糖 🍭 - 純向量手繪立體棒棒糖，唯一整體，絕不分裂成兩舊)
        ctx.shadowColor = 'rgba(236, 72, 153, 0.95)';
        ctx.shadowBlur = 16;

        const candyR = radius * 0.75;
        const cx = -radius * 0.12;
        const cy = -radius * 0.15;

        // 1. Crisp White Lollipop Stick (白色糖棒，斜向右下)
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = Math.max(2.4, radius * 0.2);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(cx + candyR * 0.2, cy + candyR * 0.4);
        ctx.lineTo(cx + radius * 0.82, cy + radius * 1.05);
        ctx.stroke();

        // Subtle shaded stick contour
        ctx.strokeStyle = '#fbcfe8';
        ctx.lineWidth = Math.max(1, radius * 0.08);
        ctx.beginPath();
        ctx.moveTo(cx + candyR * 0.25, cy + candyR * 0.45);
        ctx.lineTo(cx + radius * 0.82, cy + radius * 1.05);
        ctx.stroke();

        // 2. Lollipop Candy Head (6色彩虹旋渦糖盤)
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, candyR, 0, Math.PI * 2);
        ctx.clip();

        // 6 vibrant candy rainbow slices
        const rainbowColors = ['#f43f5e', '#fb923c', '#facc15', '#4ade80', '#38bdf8', '#c084fc'];
        for (let i = 0; i < 6; i++) {
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.arc(cx, cy, candyR + 1, (i * Math.PI) / 3, ((i + 1) * Math.PI) / 3);
          ctx.closePath();
          ctx.fillStyle = rainbowColors[i];
          ctx.fill();
        }

        // Concentric white swirl ripples
        ctx.lineWidth = 1.4;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.beginPath();
        ctx.arc(cx, cy, candyR * 0.62, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, cy, candyR * 0.28, 0, Math.PI * 2);
        ctx.stroke();

        // Glossy 3D Candy Glaze Shine (立體水晶高光)
        const glazeGrad = ctx.createLinearGradient(cx - candyR, cy - candyR, cx, cy);
        glazeGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        glazeGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.25)');
        glazeGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = glazeGrad;
        ctx.beginPath();
        ctx.ellipse(cx - candyR * 0.32, cy - candyR * 0.32, candyR * 0.48, candyR * 0.25, -Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Crisp outer candy edge ring
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.arc(cx, cy, candyR, 0, Math.PI * 2);
        ctx.stroke();

        // Little sweet sparkle star
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx - candyR * 0.42, cy - candyR * 0.42, radius * 0.12, 0, Math.PI * 2);
        ctx.fill();
      } else if (food.type === 'BOMB') {
        // 1. Timed Bomb (限時拆彈 💣 - 倒數定時炸彈)
        ctx.shadowColor = 'rgba(239, 68, 68, 0.95)';
        ctx.shadowBlur = 18;

        const bR = radius * 0.88;
        const bombGrad = ctx.createRadialGradient(-bR * 0.35, -bR * 0.35, bR * 0.1, 0, 1, bR);
        bombGrad.addColorStop(0, '#64748b');
        bombGrad.addColorStop(0.3, '#334155');
        bombGrad.addColorStop(0.8, '#0f172a');
        bombGrad.addColorStop(1, '#020617');
        ctx.fillStyle = bombGrad;
        ctx.beginPath();
        ctx.arc(0, 1, bR, 0, Math.PI * 2);
        ctx.fill();

        // Bomb cap
        ctx.fillStyle = '#475569';
        ctx.fillRect(-bR * 0.28, -bR * 1.05, bR * 0.56, bR * 0.3);

        // Curving fuse
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(0, -bR * 1.05);
        ctx.quadraticCurveTo(bR * 0.4, -bR * 1.35, bR * 0.65, -bR * 1.45);
        ctx.stroke();

        // Spark fire
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(bR * 0.65, -bR * 1.45, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(bR * 0.65, -bR * 1.45, 1.8, 0, Math.PI * 2);
        ctx.fill();

        // Digital countdown text
        if (food.bombCountdown !== undefined) {
          const sec = Math.max(0, Math.ceil(food.bombCountdown));
          ctx.shadowBlur = 0;
          ctx.fillStyle = sec <= 3 ? '#ef4444' : '#f59e0b';
          ctx.font = '900 10px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${sec}s`, 0, 1.5);
        }
      } else if (food.type === 'GHOST') {
        // 2. Ghost Mode Orb (幽靈穿透 👻 - 飄逸靈魂法球)
        ctx.shadowColor = 'rgba(192, 132, 252, 0.95)';
        ctx.shadowBlur = 18;

        const gR = radius * 0.9;
        const ghostGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, gR);
        ghostGrad.addColorStop(0, '#ffffff');
        ghostGrad.addColorStop(0.35, '#c084fc');
        ghostGrad.addColorStop(0.8, '#7e22ce');
        ghostGrad.addColorStop(1, '#3b0764');
        ctx.fillStyle = ghostGrad;
        ctx.beginPath();
        ctx.arc(0, 0, gR, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.font = `${Math.floor(gR * 1.25)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('👻', 0, 0);
      } else if (food.type === 'REVERSE') {
        // 7. Reverse Gear Orb (倒後檔 ⏪ - 雙向霓虹轉向器)
        ctx.shadowColor = 'rgba(99, 102, 241, 0.95)';
        ctx.shadowBlur = 18;

        const revR = radius * 0.88;
        const revGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, revR);
        revGrad.addColorStop(0, '#ffffff');
        revGrad.addColorStop(0.35, '#818cf8');
        revGrad.addColorStop(0.8, '#4338ca');
        revGrad.addColorStop(1, '#1e1b4b');
        ctx.fillStyle = revGrad;
        ctx.beginPath();
        ctx.arc(0, 0, revR, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⏪', 0, 0);
      } else if (food.type === 'GLOW_BERRY') {
        // 3. Glow Berry (發光藍莓 🫐 - 夜間迷霧驅散光源)
        ctx.shadowColor = 'rgba(56, 189, 248, 0.95)';
        ctx.shadowBlur = 22;

        const bR = radius * 0.9;
        const bGrad = ctx.createRadialGradient(-bR * 0.35, -bR * 0.35, bR * 0.1, 0, 0, bR);
        bGrad.addColorStop(0, '#e0f2fe');
        bGrad.addColorStop(0.35, '#38bdf8');
        bGrad.addColorStop(0.75, '#0284c7');
        bGrad.addColorStop(1, '#0c4a6e');
        ctx.fillStyle = bGrad;
        ctx.beginPath();
        ctx.arc(0, 0, bR, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.font = `${Math.floor(bR * 1.15)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🫐', 0, 0);
      } else if (food.type === 'KEY') {
        // Key (黃金鑰匙 🗝️)
        ctx.shadowColor = 'rgba(234, 179, 8, 0.95)';
        ctx.shadowBlur = 18;
        ctx.font = `${Math.floor(radius * 1.4)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🗝️', 0, 0);
      } else if (food.type === 'LIGHTNING') {
        // Cyber Overclock Core (電磁超頻核心 ⚡ - 高壓電磁能量水晶)
        ctx.shadowColor = 'rgba(217, 70, 239, 0.95)';
        ctx.shadowBlur = 22;

        const lR = radius * 0.9;
        const lGrad = ctx.createRadialGradient(-lR * 0.35, -lR * 0.35, lR * 0.1, 0, 0, lR);
        lGrad.addColorStop(0, '#ffffff');
        lGrad.addColorStop(0.3, '#38bdf8');
        lGrad.addColorStop(0.7, '#d946ef');
        lGrad.addColorStop(1, '#4a044e');
        ctx.fillStyle = lGrad;
        ctx.beginPath();
        ctx.arc(0, 0, lR, 0, Math.PI * 2);
        ctx.fill();

        // Neon outer ring
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, lR * 1.12, 0, Math.PI * 2);
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.floor(lR * 1.25)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚡', 0, 0);
      }
      ctx.restore();
    });

    // 5. Draw Snake Body & Glow (Cute 3D Candy Gummy Beads)
    if (snake.length > 0) {
      ctx.save();
      // Rainbow Fever / Ghost Mode translucency & aura glows
      if (isLightningActive) {
        ctx.shadowColor = 'rgba(217, 70, 239, 0.98)';
        ctx.shadowBlur = 32;
      } else if (isRainbowActive) {
        const glowHue = Math.floor((Date.now() / 15) % 360);
        ctx.shadowColor = `hsl(${glowHue}, 100%, 65%)`;
        ctx.shadowBlur = 28;
      } else if (isGhostActive) {
        ctx.globalAlpha = 0.65;
        ctx.shadowColor = 'rgba(192, 132, 252, 0.95)';
        ctx.shadowBlur = 24;
      } else if (isKeyAuraActive) {
        ctx.shadowColor = 'rgba(234, 179, 8, 0.95)';
        ctx.shadowBlur = 26;
      } else if (isFireActive) {
        ctx.shadowColor = 'rgba(249, 115, 22, 0.95)';
        ctx.shadowBlur = 24;
      } else if (isMagnetActive) {
        ctx.shadowColor = 'rgba(6, 182, 212, 0.95)';
        ctx.shadowBlur = 22;
      } else if (isShieldActive) {
        ctx.shadowColor = 'rgba(56, 189, 248, 0.9)';
        ctx.shadowBlur = 18;
      } else if (snakeColor === 'RED') {
        ctx.shadowColor = 'rgba(239, 68, 68, 0.95)';
        ctx.shadowBlur = 20;
      } else if (snakeColor === 'BLUE') {
        ctx.shadowColor = 'rgba(56, 189, 248, 0.95)';
        ctx.shadowBlur = 20;
      } else if (snakeColor === 'GREEN') {
        ctx.shadowColor = 'rgba(34, 197, 94, 0.95)';
        ctx.shadowBlur = 20;
      } else {
        ctx.shadowColor = skin.glowColor;
        ctx.shadowBlur = 12;
      }

      // Draw Body Segments from tail to head
      for (let i = snake.length - 1; i >= 1; i--) {
        const seg = snake[i];
        const segX = gridX + seg.x * cellW + cellW / 2;
        const segY = gridY + seg.y * cellH + cellH / 2;

        const progress = i / snake.length; // 0 near head, 1 at tail
        const baseRadius = Math.min(cellW, cellH) / 2;
        const segRadius = (baseRadius - 1.2) * (1 - progress * 0.22);

        // 3D Jelly Bead Gradient with authentic Skin Texture / Rainbow Fever Flow / Chameleon Color Gate Transformation
        const rainbowHue = Math.floor((Date.now() / 10 + i * 24) % 360);
        const segColor = isRainbowActive
          ? `hsl(${rainbowHue}, 95%, 62%)`
          : snakeColor === 'RED'
          ? (i % 2 === 0 ? '#ef4444' : '#dc2626')
          : snakeColor === 'BLUE'
          ? (i % 2 === 0 ? '#38bdf8' : '#0284c7')
          : snakeColor === 'GREEN'
          ? (i % 2 === 0 ? '#4ade80' : '#16a34a')
          : (i % 2 === 0 ? skin.bodyColor : skin.tailColor);

        const beadGrad = ctx.createRadialGradient(
          segX - segRadius * 0.3,
          segY - segRadius * 0.3,
          segRadius * 0.1,
          segX,
          segY,
          segRadius
        );
        const segGlint = snakeColor === 'RED'
          ? '#fee2e2'
          : snakeColor === 'BLUE'
          ? '#e0f2fe'
          : snakeColor === 'GREEN'
          ? '#dcfce7'
          : '#ffffff';
        beadGrad.addColorStop(0, segGlint);
        beadGrad.addColorStop(0.25, segColor);
        beadGrad.addColorStop(1, segColor);
        ctx.fillStyle = beadGrad;

        ctx.beginPath();
        ctx.arc(segX, segY, segRadius, 0, Math.PI * 2);
        ctx.fill();

        // 1. Neon Digital Grid authentic ladder ribs & sparkles
        if (skin.id === 'neon_viper' || skin.id === 'neon_aurora') {
          ctx.strokeStyle = skin.id === 'neon_viper' ? 'rgba(255, 255, 255, 0.88)' : 'rgba(255, 240, 255, 0.9)';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(segX - segRadius * 0.7, segY);
          ctx.lineTo(segX + segRadius * 0.7, segY);
          ctx.stroke();

          // Sparkle star on alternating segments
          if (i % 3 === 0) {
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('✦', segX + segRadius * 0.45, segY - segRadius * 0.35);
          }
        } else if (skin.id === 'neon_caterpillar') {
          // Neon caterpillar bright green outline rings
          ctx.strokeStyle = '#86efac';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.arc(segX, segY, segRadius * 0.65, 0, Math.PI * 2);
          ctx.stroke();
        } else if (i % 3 === 0) {
          // Cute Monster Spots on alternating segments
          ctx.fillStyle = 'rgba(168, 85, 247, 0.45)';
          ctx.beginPath();
          ctx.arc(segX + segRadius * 0.25, segY - segRadius * 0.2, segRadius * 0.32, 0, Math.PI * 2);
          ctx.fill();
        }

        // Glossy Specular glint on upper-left
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(segX - segRadius * 0.35, segY - segRadius * 0.35, segRadius * 0.28, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Head (Cute Expressive Character Face)
      const head = snake[0];
      const headX = gridX + head.x * cellW + cellW / 2;
      const headY = gridY + head.y * cellH + cellH / 2;
      const headRadius = Math.min(cellW, cellH) / 2 - 0.8;

      // 1. Cute Monster Horns / Dragon Ear Fins (Positioned behind head based on direction)
      ctx.save();
      const hornColor = snakeColor === 'RED'
        ? '#fca5a5'
        : snakeColor === 'BLUE'
        ? '#bae6fd'
        : snakeColor === 'GREEN'
        ? '#bbf7d0'
        : '#fde047';
      ctx.fillStyle = hornColor;
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;

      const hornOffsets = {
        UP: [
          { x: headX - headRadius * 0.65, y: headY + headRadius * 0.3, tipX: headX - headRadius * 0.9, tipY: headY + headRadius * 0.7 },
          { x: headX + headRadius * 0.65, y: headY + headRadius * 0.3, tipX: headX + headRadius * 0.9, tipY: headY + headRadius * 0.7 }
        ],
        DOWN: [
          { x: headX - headRadius * 0.65, y: headY - headRadius * 0.3, tipX: headX - headRadius * 0.9, tipY: headY - headRadius * 0.7 },
          { x: headX + headRadius * 0.65, y: headY - headRadius * 0.3, tipX: headX + headRadius * 0.9, tipY: headY - headRadius * 0.7 }
        ],
        LEFT: [
          { x: headX + headRadius * 0.3, y: headY - headRadius * 0.65, tipX: headX + headRadius * 0.7, tipY: headY - headRadius * 0.9 },
          { x: headX + headRadius * 0.3, y: headY + headRadius * 0.65, tipX: headX + headRadius * 0.7, tipY: headY + headRadius * 0.9 }
        ],
        RIGHT: [
          { x: headX - headRadius * 0.3, y: headY - headRadius * 0.65, tipX: headX - headRadius * 0.7, tipY: headY - headRadius * 0.9 },
          { x: headX - headRadius * 0.3, y: headY + headRadius * 0.65, tipX: headX - headRadius * 0.7, tipY: headY + headRadius * 0.9 }
        ],
      }[direction] || [
        { x: headX - headRadius * 0.65, y: headY - headRadius * 0.3, tipX: headX - headRadius * 0.9, tipY: headY - headRadius * 0.7 },
        { x: headX + headRadius * 0.65, y: headY - headRadius * 0.3, tipX: headX + headRadius * 0.9, tipY: headY - headRadius * 0.7 }
      ];

      hornOffsets.forEach((horn) => {
        ctx.beginPath();
        ctx.arc(horn.x, horn.y, headRadius * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });
      ctx.restore();

      // Head 3D Monster Gradient / Rainbow Fever Prism Head / Chameleon Transformation Head
      const headRainbowHue = Math.floor((Date.now() / 8) % 360);
      const headFillColor = isRainbowActive
        ? `hsl(${headRainbowHue}, 100%, 65%)`
        : snakeColor === 'RED'
        ? '#ef4444'
        : snakeColor === 'BLUE'
        ? '#0284c7'
        : snakeColor === 'GREEN'
        ? '#16a34a'
        : skin.headColor;

      const headGrad = ctx.createRadialGradient(
        headX - headRadius * 0.3,
        headY - headRadius * 0.3,
        headRadius * 0.1,
        headX,
        headY,
        headRadius
      );
      const headGlint = snakeColor === 'RED'
        ? '#fee2e2'
        : snakeColor === 'BLUE'
        ? '#e0f2fe'
        : snakeColor === 'GREEN'
        ? '#dcfce7'
        : '#ffffff';
      headGrad.addColorStop(0, headGlint);
      headGrad.addColorStop(0.25, headFillColor);
      headGrad.addColorStop(1, headFillColor);
      ctx.fillStyle = headGrad;

      ctx.beginPath();
      ctx.arc(headX, headY, headRadius, 0, Math.PI * 2);
      ctx.fill();

      // Chameleon Element Aura ring when snake body is transformed
      if (snakeColor && snakeColor !== 'NORMAL' && !isRainbowActive) {
        ctx.save();
        const elemColor = snakeColor === 'RED' ? '#f43f5e' : snakeColor === 'BLUE' ? '#38bdf8' : '#22c55e';
        const pulse = (Math.sin(Date.now() / 140) + 1) * 0.5;
        ctx.strokeStyle = elemColor;
        ctx.lineWidth = 2.2 + pulse * 1.5;
        ctx.shadowColor = elemColor;
        ctx.shadowBlur = 12 + pulse * 8;
        ctx.beginPath();
        ctx.arc(headX, headY, headRadius + 2.5 + pulse * 2, 0, Math.PI * 2);
        ctx.stroke();

        // 4 Cute orbiting elemental energy motes
        const orbitAngle = Date.now() / 300;
        for (let m = 0; m < 4; m++) {
          const angle = orbitAngle + (m * Math.PI) / 2;
          const dist = headRadius + 4 + pulse * 2;
          const mx = headX + Math.cos(angle) * dist;
          const my = headY + Math.sin(angle) * dist;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(mx, my, 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // Shield overlay on head if active
      if (isShieldActive) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(headX, headY, headRadius + 3, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Fire Cloak flame aura overlay on head if active
      if (isFireActive) {
        ctx.save();
        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 2.8;
        const fireR = headRadius + 3.5 + Math.sin(Date.now() / 90) * 3;
        ctx.beginPath();
        ctx.arc(headX, headY, fireR, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(234, 88, 12, 0.6)';
        ctx.lineWidth = 1.5;
        const fireR2 = headRadius + 7.5 + Math.cos(Date.now() / 80) * 3.5;
        ctx.beginPath();
        ctx.arc(headX, headY, fireR2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Golden Vault Key Aura overlay on head if active
      if (isKeyAuraActive) {
        ctx.save();
        ctx.strokeStyle = '#eab308';
        ctx.lineWidth = 2.8;
        const goldR = headRadius + 4 + Math.sin(Date.now() / 90) * 2.5;
        ctx.beginPath();
        ctx.arc(headX, headY, goldR, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(250, 204, 21, 0.6)';
        ctx.lineWidth = 1.6;
        const goldR2 = headRadius + 7.5 + Math.cos(Date.now() / 80) * 2;
        ctx.beginPath();
        ctx.arc(headX, headY, goldR2, 0, Math.PI * 2);
        ctx.stroke();

        // Floating glowing key icon over head
        ctx.font = `${Math.floor(headRadius * 0.95)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🗝️', headX, headY - headRadius - 6 + Math.sin(Date.now() / 110) * 2.5);
        ctx.restore();
      }

      // Rainbow Prismatic Crown / Halo overlay if active
      if (isRainbowActive) {
        ctx.save();
        const haloR = headRadius + 4.5 + Math.sin(Date.now() / 80) * 2.5;
        const rainbowGrad = ctx.createLinearGradient(headX - haloR, headY - haloR, headX + haloR, headY + haloR);
        rainbowGrad.addColorStop(0, '#f43f5e');
        rainbowGrad.addColorStop(0.2, '#fb923c');
        rainbowGrad.addColorStop(0.4, '#facc15');
        rainbowGrad.addColorStop(0.6, '#4ade80');
        rainbowGrad.addColorStop(0.8, '#38bdf8');
        rainbowGrad.addColorStop(1, '#ec4899');
        ctx.strokeStyle = rainbowGrad;
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.arc(headX, headY, haloR, 0, Math.PI * 2);
        ctx.stroke();

        // Floating sweet lollipop icon above head
        ctx.font = `${Math.floor(headRadius * 0.95)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🍭', headX, headY - headRadius - 7 + Math.sin(Date.now() / 90) * 2.5);
        ctx.restore();
      }

      // Magnetic field aura overlay on head if active
      if (isMagnetActive) {
        ctx.save();
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2.5;
        const pulseR = headRadius + 4 + Math.sin(Date.now() / 120) * 3;
        ctx.beginPath();
        ctx.arc(headX, headY, pulseR, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
        ctx.lineWidth = 1.5;
        const pulseR2 = headRadius + 9 + Math.sin(Date.now() / 120 + 1.2) * 4;
        ctx.beginPath();
        ctx.arc(headX, headY, pulseR2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Directional eye & blush offsets
      ctx.shadowBlur = 0; // sharp facial features
      let eye1 = { x: headX - headRadius * 0.42, y: headY - headRadius * 0.25 };
      let eye2 = { x: headX + headRadius * 0.42, y: headY - headRadius * 0.25 };
      let cheek1 = { x: headX - headRadius * 0.62, y: headY + headRadius * 0.15 };
      let cheek2 = { x: headX + headRadius * 0.62, y: headY + headRadius * 0.15 };
      let tonguePos = { x: headX, y: headY - headRadius * 0.95 };

      switch (direction) {
        case 'UP':
          eye1 = { x: headX - headRadius * 0.42, y: headY - headRadius * 0.25 };
          eye2 = { x: headX + headRadius * 0.42, y: headY - headRadius * 0.25 };
          cheek1 = { x: headX - headRadius * 0.62, y: headY + headRadius * 0.15 };
          cheek2 = { x: headX + headRadius * 0.62, y: headY + headRadius * 0.15 };
          tonguePos = { x: headX, y: headY - headRadius * 0.85 };
          break;
        case 'DOWN':
          eye1 = { x: headX - headRadius * 0.42, y: headY + headRadius * 0.25 };
          eye2 = { x: headX + headRadius * 0.42, y: headY + headRadius * 0.25 };
          cheek1 = { x: headX - headRadius * 0.62, y: headY - headRadius * 0.15 };
          cheek2 = { x: headX + headRadius * 0.62, y: headY - headRadius * 0.15 };
          tonguePos = { x: headX, y: headY + headRadius * 0.85 };
          break;
        case 'LEFT':
          eye1 = { x: headX - headRadius * 0.25, y: headY - headRadius * 0.42 };
          eye2 = { x: headX - headRadius * 0.25, y: headY + headRadius * 0.42 };
          cheek1 = { x: headX + headRadius * 0.15, y: headY - headRadius * 0.62 };
          cheek2 = { x: headX + headRadius * 0.15, y: headY + headRadius * 0.62 };
          tonguePos = { x: headX - headRadius * 0.85, y: headY };
          break;
        case 'RIGHT':
          eye1 = { x: headX + headRadius * 0.25, y: headY - headRadius * 0.42 };
          eye2 = { x: headX + headRadius * 0.25, y: headY + headRadius * 0.42 };
          cheek1 = { x: headX - headRadius * 0.15, y: headY - headRadius * 0.62 };
          cheek2 = { x: headX - headRadius * 0.15, y: headY + headRadius * 0.62 };
          tonguePos = { x: headX + headRadius * 0.85, y: headY };
          break;
      }

      // Adorable Rosy Monster Cheeks
      const blushR = Math.max(3, headRadius * 0.26);
      ctx.fillStyle = 'rgba(255, 105, 180, 0.65)';
      ctx.beginPath();
      ctx.arc(cheek1.x, cheek1.y, blushR, 0, Math.PI * 2);
      ctx.arc(cheek2.x, cheek2.y, blushR, 0, Math.PI * 2);
      ctx.fill();

      // Big Expressive Sclera (White)
      const eyeR = Math.max(3.5, cellW * 0.22);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(eye1.x, eye1.y, eyeR, 0, Math.PI * 2);
      ctx.arc(eye2.x, eye2.y, eyeR, 0, Math.PI * 2);
      ctx.fill();

      // Colored Iris
      const irisColor = snakeColor === 'RED'
        ? '#b91c1c'
        : snakeColor === 'BLUE'
        ? '#0369a1'
        : snakeColor === 'GREEN'
        ? '#15803d'
        : (skin.eyeColor || '#059669');
      ctx.fillStyle = irisColor;
      const irisR = eyeR * 0.85;
      ctx.beginPath();
      ctx.arc(eye1.x, eye1.y, irisR, 0, Math.PI * 2);
      ctx.arc(eye2.x, eye2.y, irisR, 0, Math.PI * 2);
      ctx.fill();

      // Dark Pupil
      ctx.fillStyle = '#090d16';
      const pupilR = eyeR * 0.55;
      ctx.beginPath();
      ctx.arc(eye1.x, eye1.y, pupilR, 0, Math.PI * 2);
      ctx.arc(eye2.x, eye2.y, pupilR, 0, Math.PI * 2);
      ctx.fill();

      // Double Sparkle Specular Reflections
      // 1. Primary big star reflection
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(eye1.x - pupilR * 0.35, eye1.y - pupilR * 0.35, pupilR * 0.5, 0, Math.PI * 2);
      ctx.arc(eye2.x - pupilR * 0.35, eye2.y - pupilR * 0.35, pupilR * 0.5, 0, Math.PI * 2);
      ctx.fill();

      // 2. Secondary tiny bottom reflection
      ctx.beginPath();
      ctx.arc(eye1.x + pupilR * 0.3, eye1.y + pupilR * 0.3, pupilR * 0.25, 0, Math.PI * 2);
      ctx.arc(eye2.x + pupilR * 0.3, eye2.y + pupilR * 0.3, pupilR * 0.25, 0, Math.PI * 2);
      ctx.fill();

      // Cute Little Monster Smile with Toothless Tiny Fang
      ctx.fillStyle = '#fb7185';
      ctx.beginPath();
      ctx.arc(tonguePos.x, tonguePos.y, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // 5.5. Draw Roving Enemy Snakes (阻礙蛇 / 巡邏蛇)
    rovingSnakes.forEach((rs) => {
      if (!rs.body || rs.body.length === 0) return;

      ctx.save();
      // Danger Glow aura
      ctx.shadowColor = rs.glowColor;
      ctx.shadowBlur = 12;

      // Draw Body Segments (tail to neck)
      for (let i = rs.body.length - 1; i >= 1; i--) {
        const seg = rs.body[i];
        const segX = gridX + seg.x * cellW + cellW / 2;
        const segY = gridY + seg.y * cellH + cellH / 2;
        const progress = i / rs.body.length;
        const segRadius = (cellW / 2 - 1.2) * (1 - progress * 0.2);

        // 3D Danger Bead Gradient
        const beadGrad = ctx.createRadialGradient(
          segX - segRadius * 0.3,
          segY - segRadius * 0.3,
          segRadius * 0.1,
          segX,
          segY,
          segRadius
        );
        beadGrad.addColorStop(0, '#ffffff');
        beadGrad.addColorStop(0.25, rs.bodyColor);
        beadGrad.addColorStop(1, '#0f172a');
        ctx.fillStyle = beadGrad;

        ctx.beginPath();
        ctx.arc(segX, segY, segRadius, 0, Math.PI * 2);
        ctx.fill();

        // Scale markings
        if (i % 2 === 0) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
          ctx.beginPath();
          ctx.arc(segX, segY, segRadius * 0.35, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw Head
      const head = rs.body[0];
      const headX = gridX + head.x * cellW + cellW / 2;
      const headY = gridY + head.y * cellH + cellH / 2;
      const headRadius = cellW / 2 - 0.8;

      // Dark Spikes / Horns behind head
      const hornOffsets: Record<Direction, Point[]> = {
        UP: [
          { x: headX - headRadius * 0.55, y: headY + headRadius * 0.5 },
          { x: headX + headRadius * 0.55, y: headY + headRadius * 0.5 },
        ],
        DOWN: [
          { x: headX - headRadius * 0.55, y: headY - headRadius * 0.5 },
          { x: headX + headRadius * 0.55, y: headY - headRadius * 0.5 },
        ],
        LEFT: [
          { x: headX + headRadius * 0.5, y: headY - headRadius * 0.55 },
          { x: headX + headRadius * 0.5, y: headY + headRadius * 0.55 },
        ],
        RIGHT: [
          { x: headX - headRadius * 0.5, y: headY - headRadius * 0.55 },
          { x: headX - headRadius * 0.5, y: headY + headRadius * 0.55 },
        ],
      };
      ctx.fillStyle = '#0f172a';
      (hornOffsets[rs.direction] || hornOffsets.RIGHT).forEach((h) => {
        ctx.beginPath();
        ctx.arc(h.x, h.y, headRadius * 0.32, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3D Head
      const headGrad = ctx.createRadialGradient(
        headX - headRadius * 0.3,
        headY - headRadius * 0.3,
        headRadius * 0.1,
        headX,
        headY,
        headRadius
      );
      headGrad.addColorStop(0, '#ffffff');
      headGrad.addColorStop(0.25, rs.headColor);
      headGrad.addColorStop(1, rs.bodyColor);
      ctx.fillStyle = headGrad;

      ctx.beginPath();
      ctx.arc(headX, headY, headRadius, 0, Math.PI * 2);
      ctx.fill();

      // Fierce Slit Eyes
      const eyeR = headRadius * 0.28;
      const eyeOffsets: Record<Direction, [Point, Point]> = {
        UP: [
          { x: headX - headRadius * 0.38, y: headY - headRadius * 0.25 },
          { x: headX + headRadius * 0.38, y: headY - headRadius * 0.25 },
        ],
        DOWN: [
          { x: headX - headRadius * 0.38, y: headY + headRadius * 0.25 },
          { x: headX + headRadius * 0.38, y: headY + headRadius * 0.25 },
        ],
        LEFT: [
          { x: headX - headRadius * 0.25, y: headY - headRadius * 0.38 },
          { x: headX - headRadius * 0.25, y: headY + headRadius * 0.38 },
        ],
        RIGHT: [
          { x: headX + headRadius * 0.25, y: headY - headRadius * 0.38 },
          { x: headX + headRadius * 0.25, y: headY + headRadius * 0.38 },
        ],
      };
      const [e1, e2] = eyeOffsets[rs.direction] || eyeOffsets.RIGHT;

      // Sclera / Glowing Eye
      ctx.shadowBlur = 6;
      ctx.fillStyle = rs.eyeColor;
      ctx.beginPath();
      ctx.arc(e1.x, e1.y, eyeR, 0, Math.PI * 2);
      ctx.arc(e2.x, e2.y, eyeR, 0, Math.PI * 2);
      ctx.fill();

      // Dark Vertical Slit Pupil
      ctx.fillStyle = '#0f172a';
      ctx.shadowBlur = 0;
      const pupilW = Math.max(1.2, eyeR * 0.35);
      const pupilH = eyeR * 1.5;
      ctx.beginPath();
      ctx.ellipse(e1.x, e1.y, pupilW, pupilH / 2, 0, 0, Math.PI * 2);
      ctx.ellipse(e2.x, e2.y, pupilW, pupilH / 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Flickering forked tongue
      if (Math.sin(Date.now() / 150) > 0.35) {
        const tongueDist = headRadius * 1.35;
        const tongueMap: Record<Direction, Point> = {
          UP: { x: headX, y: headY - tongueDist },
          DOWN: { x: headX, y: headY + tongueDist },
          LEFT: { x: headX - tongueDist, y: headY },
          RIGHT: { x: headX + tongueDist, y: headY },
        };
        const tPos = tongueMap[rs.direction];
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.arc(tPos.x, tPos.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // EMP Stun electric spark arcs + STUNNED status indicator
      if (isLightningActive) {
        ctx.save();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.8;
        ctx.shadowColor = '#d946ef';
        ctx.shadowBlur = 10;
        const arcPhase = (Date.now() / 80) % (Math.PI * 2);
        ctx.beginPath();
        for (let a = 0; a < 6; a++) {
          const angle = (a / 6) * Math.PI * 2 + arcPhase;
          const r1 = headRadius * 1.05;
          const r2 = headRadius * 1.45;
          const x1 = headX + Math.cos(angle) * r1;
          const y1 = headY + Math.sin(angle) * r1;
          const x2 = headX + Math.cos(angle + 0.35) * r2;
          const y2 = headY + Math.sin(angle + 0.35) * r2;
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
        }
        ctx.stroke();

        // Stunned badge above roving snake head
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#facc15';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('⚡ STUNNED!', headX, headY - headRadius - 2);
        ctx.restore();
      }

      ctx.restore();
    });

    // 6. Draw Particles (reads from fxRef with fallback to props)
    const activeParticles = fxRef?.current ? fxRef.current.particles : (particles || []);
    activeParticles.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      if (enableGlow) {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
      }
      ctx.beginPath();
      ctx.arc(gridX + p.x * cellW + cellW / 2, gridY + p.y * cellH + cellH / 2, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Helper to draw a crisp, glossy 3D miniature blue apple with stem and leaf
    const drawMiniBlueApple = (
      c: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      r: number
    ) => {
      c.save();
      // Curved brown stem
      c.strokeStyle = '#78350f';
      c.lineWidth = Math.max(1.4, r * 0.22);
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(cx, cy - r * 0.65);
      c.quadraticCurveTo(cx + 1, cy - r * 1.15, cx + r * 0.4, cy - r * 1.35);
      c.stroke();

      // Fresh green leaf
      c.fillStyle = '#22c55e';
      c.beginPath();
      c.ellipse(cx + r * 0.45, cy - r * 0.9, r * 0.45, r * 0.22, Math.PI / 4, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = '#15803d';
      c.lineWidth = 0.6;
      c.stroke();

      // Glossy 3D Blue Apple Body
      const blueGrad = c.createRadialGradient(cx - r * 0.35, cy - r * 0.35, r * 0.15, cx, cy, r);
      blueGrad.addColorStop(0, '#bae6fd');
      blueGrad.addColorStop(0.35, '#38bdf8');
      blueGrad.addColorStop(0.75, '#0284c7');
      blueGrad.addColorStop(1, '#0369a1');
      c.fillStyle = blueGrad;

      c.beginPath();
      c.arc(cx, cy + 0.5, r, 0, Math.PI * 2);
      c.fill();

      // Dimple on top
      c.fillStyle = '#0369a1';
      c.beginPath();
      c.ellipse(cx, cy - r * 0.7, r * 0.22, r * 0.1, 0, 0, Math.PI * 2);
      c.fill();

      // Glint highlight
      c.fillStyle = 'rgba(255, 255, 255, 0.92)';
      c.beginPath();
      c.arc(cx - r * 0.35, cy - r * 0.35, r * 0.28, 0, Math.PI * 2);
      c.fill();

      c.restore();
    };

    // Helper to draw a crisp, glossy 3D miniature red apple with stem and leaf
    const drawMiniRedApple = (
      c: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      r: number
    ) => {
      c.save();
      // Curved brown stem
      c.strokeStyle = '#78350f';
      c.lineWidth = Math.max(1.4, r * 0.22);
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(cx, cy - r * 0.65);
      c.quadraticCurveTo(cx + 1, cy - r * 1.15, cx + r * 0.4, cy - r * 1.35);
      c.stroke();

      // Fresh green leaf
      c.fillStyle = '#22c55e';
      c.beginPath();
      c.ellipse(cx + r * 0.45, cy - r * 0.9, r * 0.45, r * 0.22, Math.PI / 4, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = '#15803d';
      c.lineWidth = 0.6;
      c.stroke();

      // Glossy 3D Red Apple Body
      const redGrad = c.createRadialGradient(cx - r * 0.35, cy - r * 0.35, r * 0.15, cx, cy, r);
      redGrad.addColorStop(0, '#fecdd3');
      redGrad.addColorStop(0.3, '#f43f5e');
      redGrad.addColorStop(0.75, '#e11d48');
      redGrad.addColorStop(1, '#881337');
      c.fillStyle = redGrad;

      c.beginPath();
      c.arc(cx, cy + 0.5, r, 0, Math.PI * 2);
      c.fill();

      // Dimple on top
      c.fillStyle = '#9f1239';
      c.beginPath();
      c.ellipse(cx, cy - r * 0.7, r * 0.22, r * 0.1, 0, 0, Math.PI * 2);
      c.fill();

      // Glint highlight
      c.fillStyle = 'rgba(255, 255, 255, 0.92)';
      c.beginPath();
      c.arc(cx - r * 0.35, cy - r * 0.35, r * 0.28, 0, Math.PI * 2);
      c.fill();

      c.restore();
    };

    // Helper to draw a crisp, glossy 3D miniature green apple with stem and leaf
    const drawMiniGreenApple = (
      c: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      r: number
    ) => {
      c.save();
      // Curved brown stem
      c.strokeStyle = '#78350f';
      c.lineWidth = Math.max(1.4, r * 0.22);
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(cx, cy - r * 0.65);
      c.quadraticCurveTo(cx + 1, cy - r * 1.15, cx + r * 0.4, cy - r * 1.35);
      c.stroke();

      // Fresh leaf
      c.fillStyle = '#86efac';
      c.beginPath();
      c.ellipse(cx + r * 0.45, cy - r * 0.9, r * 0.45, r * 0.22, Math.PI / 4, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = '#15803d';
      c.lineWidth = 0.6;
      c.stroke();

      // Glossy 3D Green Apple Body
      const greenGrad = c.createRadialGradient(cx - r * 0.35, cy - r * 0.35, r * 0.15, cx, cy, r);
      greenGrad.addColorStop(0, '#dcfce7');
      greenGrad.addColorStop(0.3, '#4ade80');
      greenGrad.addColorStop(0.75, '#16a34a');
      greenGrad.addColorStop(1, '#14532d');
      c.fillStyle = greenGrad;

      c.beginPath();
      c.arc(cx, cy + 0.5, r, 0, Math.PI * 2);
      c.fill();

      // Dimple on top
      c.fillStyle = '#14532d';
      c.beginPath();
      c.ellipse(cx, cy - r * 0.7, r * 0.22, r * 0.1, 0, 0, Math.PI * 2);
      c.fill();

      // Glint highlight
      c.fillStyle = 'rgba(255, 255, 255, 0.92)';
      c.beginPath();
      c.arc(cx - r * 0.35, cy - r * 0.35, r * 0.28, 0, Math.PI * 2);
      c.fill();

      c.restore();
    };

    // Helper to draw a crisp, glossy 3D miniature golden apple with stem, leaf and shine
    const drawMiniGoldenApple = (
      c: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      r: number
    ) => {
      c.save();
      // Curved brown stem
      c.strokeStyle = '#78350f';
      c.lineWidth = Math.max(1.4, r * 0.22);
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(cx, cy - r * 0.65);
      c.quadraticCurveTo(cx + 1, cy - r * 1.15, cx + r * 0.4, cy - r * 1.35);
      c.stroke();

      // Fresh green leaf
      c.fillStyle = '#22c55e';
      c.beginPath();
      c.ellipse(cx + r * 0.45, cy - r * 0.9, r * 0.45, r * 0.22, Math.PI / 4, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = '#15803d';
      c.lineWidth = 0.6;
      c.stroke();

      // Glossy 3D Golden Apple Body
      const goldGrad = c.createRadialGradient(cx - r * 0.35, cy - r * 0.35, r * 0.15, cx, cy, r);
      goldGrad.addColorStop(0, '#ffffff');
      goldGrad.addColorStop(0.2, '#fef9c3');
      goldGrad.addColorStop(0.5, '#fde047');
      goldGrad.addColorStop(0.8, '#eab308');
      goldGrad.addColorStop(1, '#a16207');
      c.fillStyle = goldGrad;

      c.beginPath();
      c.arc(cx, cy + 0.5, r, 0, Math.PI * 2);
      c.fill();

      // Dimple on top
      c.fillStyle = '#a16207';
      c.beginPath();
      c.ellipse(cx, cy - r * 0.7, r * 0.22, r * 0.1, 0, 0, Math.PI * 2);
      c.fill();

      // Glint highlight
      c.fillStyle = 'rgba(255, 255, 255, 0.95)';
      c.beginPath();
      c.arc(cx - r * 0.35, cy - r * 0.35, r * 0.28, 0, Math.PI * 2);
      c.fill();

      c.restore();
    };

    // Helper to draw the exact game's signature Golden Star Coin (平時的金幣圖案)
    const drawMiniCoin = (
      c: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      r: number
    ) => {
      c.save();
      // 1. 3D Bottom depth shadow
      c.fillStyle = '#78350f';
      c.beginPath();
      c.arc(cx, cy + 0.8, r, 0, Math.PI * 2);
      c.fill();

      // 2. Outer gold body with rich gradient
      const outerGrad = c.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
      outerGrad.addColorStop(0, '#fde047');
      outerGrad.addColorStop(0.5, '#eab308');
      outerGrad.addColorStop(1, '#b45309');
      c.fillStyle = outerGrad;
      c.beginPath();
      c.arc(cx, cy, r, 0, Math.PI * 2);
      c.fill();

      c.strokeStyle = '#a16207';
      c.lineWidth = 0.8;
      c.stroke();

      // 3. Embossed inner face
      const innerR = r * 0.76;
      const innerGrad = c.createLinearGradient(cx - innerR, cy - innerR, cx + innerR, cy + innerR);
      innerGrad.addColorStop(0, '#fef08a');
      innerGrad.addColorStop(0.4, '#facc15');
      innerGrad.addColorStop(1, '#ca8a04');
      c.fillStyle = innerGrad;
      c.beginPath();
      c.arc(cx, cy, innerR, 0, Math.PI * 2);
      c.fill();

      c.strokeStyle = '#a16207';
      c.lineWidth = 0.6;
      c.stroke();

      // 4. Cute arcade 5-pointed center star (★)
      c.shadowBlur = 0;
      c.fillStyle = '#ffffff';
      c.font = `900 ${Math.floor(r * 1.05)}px sans-serif`;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText('★', cx, cy + 0.3);

      // 5. Glossy highlight reflection
      c.fillStyle = 'rgba(255, 255, 255, 0.75)';
      c.beginPath();
      c.ellipse(cx - r * 0.35, cy - r * 0.35, r * 0.32, r * 0.16, -Math.PI / 4, 0, Math.PI * 2);
      c.fill();

      c.restore();
    };

    // Helper to draw a miniature Ancient Dragon Egg
    const drawMiniDragonEgg = (
      c: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      r: number
    ) => {
      c.save();
      const eW = r * 0.85;
      const eH = r * 1.1;

      c.translate(cx, cy);
      c.beginPath();
      c.moveTo(0, -eH);
      c.bezierCurveTo(eW * 0.88, -eH * 0.72, eW, eH * 0.45, 0, eH);
      c.bezierCurveTo(-eW, eH * 0.45, -eW * 0.88, -eH * 0.72, 0, -eH);
      c.closePath();

      const eggGrad = c.createRadialGradient(-eW * 0.35, -eH * 0.35, eW * 0.2, 0, 0, eH);
      eggGrad.addColorStop(0, '#fef08a');
      eggGrad.addColorStop(0.35, '#fb7185');
      eggGrad.addColorStop(0.75, '#be123c');
      eggGrad.addColorStop(1, '#4c0519');
      c.fillStyle = eggGrad;
      c.fill();

      // Golden magical crack runes
      c.strokeStyle = '#fef08a';
      c.lineWidth = 0.9;
      c.beginPath();
      c.moveTo(-eW * 0.4, -eH * 0.1);
      c.lineTo(-eW * 0.15, eH * 0.1);
      c.lineTo(-eW * 0.3, eH * 0.45);
      c.moveTo(-eW * 0.15, eH * 0.1);
      c.lineTo(eW * 0.25, 0);
      c.lineTo(eW * 0.4, eH * 0.3);
      c.stroke();

      // Glossy shine
      c.fillStyle = 'rgba(255, 255, 255, 0.88)';
      c.beginPath();
      c.ellipse(-eW * 0.35, -eH * 0.45, eW * 0.32, eH * 0.18, -Math.PI / 4, 0, Math.PI * 2);
      c.fill();

      c.restore();
    };

    // 7. Draw Floating Graphical Icons & Feedback (Zero Chinese text - strictly icons, emojis, numbers)
    const activeFloatingTexts = fxRef?.current ? fxRef.current.floatingTexts : (floatingTexts || []);
    activeFloatingTexts.forEach((ft) => {
      // Strip any Chinese/Han characters and punctuation so no words ever block the player
      const cleanText = ft.text
        .replace(/[\u4e00-\u9fa5！：:，。；？（）「」【】]/g, '')
        .trim();
      if (!cleanText) return;

      ctx.save();
      ctx.globalAlpha = ft.alpha;
      ctx.fillStyle = ft.color;
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 10;
      ctx.font = '900 15px "Outfit", "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
      ctx.textBaseline = 'middle';
      const textX = gridX + ft.x * cellW + cellW / 2;
      const textY = gridY + ft.y * cellH + cellH / 2;

      // 1. Dragon Egg + Coin (🥚 +35 🪙)
      if (cleanText.includes('🥚')) {
        const displayText = cleanText.replace(/[🥚🪙\s]+/g, ' ').trim();
        const eggR = 7;
        const coinR = 7.5;
        const eggW = eggR * 1.7;
        const coinW = coinR * 2;
        const gap = 4.5;
        const hasCoin = cleanText.includes('🪙');

        if (displayText) {
          const textMetrics = ctx.measureText(displayText);
          const totalW = eggW + gap + textMetrics.width + (hasCoin ? gap + coinW : 0);
          const startX = textX - totalW / 2;
          const eggCx = startX + eggW / 2;
          const textStartX = startX + eggW + gap;
          drawMiniDragonEgg(ctx, eggCx, textY, eggR);
          ctx.textAlign = 'left';
          ctx.fillText(displayText, textStartX, textY);
          if (hasCoin) {
            const coinCx = textStartX + textMetrics.width + gap + coinR;
            drawMiniCoin(ctx, coinCx, textY, coinR);
          }
        } else {
          drawMiniDragonEgg(ctx, textX, textY, eggR);
        }
      } else if (cleanText.includes('🪙')) {
        // 2. Pure Coin Feedback (🪙 +5) - uses exact game's Golden Star Coin (平時的金幣圖案)
        const displayText = cleanText.replace(/🪙/g, '').trim();
        const coinR = 7.5;
        if (displayText) {
          const textMetrics = ctx.measureText(displayText);
          const gap = 4.5;
          const totalW = coinR * 2 + gap + textMetrics.width;
          const startX = textX - totalW / 2;
          const coinCx = startX + coinR;
          const textStartX = startX + coinR * 2 + gap;
          drawMiniCoin(ctx, coinCx, textY, coinR);
          ctx.textAlign = 'left';
          ctx.fillText(displayText, textStartX, textY);
        } else {
          drawMiniCoin(ctx, textX, textY, coinR);
        }
      } else if (cleanText.includes('🍎')) {
        const displayText = cleanText.replace(/🍎/g, '').trim();
        const appleR = 7;
        if (displayText) {
          const textMetrics = ctx.measureText(displayText);
          const gap = 4;
          const totalW = appleR * 2 + gap + textMetrics.width;
          const appleCx = textX - totalW / 2 + appleR;
          const textStartX = textX - totalW / 2 + appleR * 2 + gap;
          drawMiniRedApple(ctx, appleCx, textY, appleR);
          ctx.textAlign = 'left';
          ctx.fillText(displayText, textStartX, textY);
        } else {
          drawMiniRedApple(ctx, textX, textY, appleR);
        }
      } else if (cleanText.includes('🍏')) {
        const displayText = cleanText.replace(/🍏/g, '').trim();
        const appleR = 7;
        if (displayText) {
          const textMetrics = ctx.measureText(displayText);
          const gap = 4;
          const totalW = appleR * 2 + gap + textMetrics.width;
          const appleCx = textX - totalW / 2 + appleR;
          const textStartX = textX - totalW / 2 + appleR * 2 + gap;
          drawMiniGreenApple(ctx, appleCx, textY, appleR);
          ctx.textAlign = 'left';
          ctx.fillText(displayText, textStartX, textY);
        } else {
          drawMiniGreenApple(ctx, textX, textY, appleR);
        }
      } else if (cleanText.includes('🔷')) {
        const displayText = cleanText.replace(/🔷/g, '').trim();
        const appleR = 7;
        if (displayText) {
          const textMetrics = ctx.measureText(displayText);
          const gap = 4;
          const totalW = appleR * 2 + gap + textMetrics.width;
          const appleCx = textX - totalW / 2 + appleR;
          const textStartX = textX - totalW / 2 + appleR * 2 + gap;
          drawMiniBlueApple(ctx, appleCx, textY, appleR);
          ctx.textAlign = 'left';
          ctx.fillText(displayText, textStartX, textY);
        } else {
          drawMiniBlueApple(ctx, textX, textY, appleR);
        }
      } else if (cleanText.includes('🌟')) {
        const displayText = cleanText.replace(/🌟/g, '').trim();
        const appleR = 7;
        if (displayText) {
          const textMetrics = ctx.measureText(displayText);
          const gap = 4;
          const totalW = appleR * 2 + gap + textMetrics.width;
          const appleCx = textX - totalW / 2 + appleR;
          const textStartX = textX - totalW / 2 + appleR * 2 + gap;
          drawMiniGoldenApple(ctx, appleCx, textY, appleR);
          ctx.textAlign = 'left';
          ctx.fillText(displayText, textStartX, textY);
        } else {
          drawMiniGoldenApple(ctx, textX, textY, appleR);
        }
      } else {
        ctx.textAlign = 'center';
        ctx.fillText(cleanText, textX, textY);
      }
      ctx.restore();
    });

    // 7.5. Night Fog of War (夜間迷霧 🌫️: 蛇頭燈光照明前路，發光漿果照亮全場)
    if (currentMission?.hasFogOfWar && snake.length > 0) {
      ctx.save();
      const head = snake[0];
      const hx = gridX + head.x * cellW + cellW / 2;
      const hy = gridY + head.y * cellH + cellH / 2;
      const fogR = isFullyIlluminated
        ? Math.max(width, height)
        : (currentMission.fogRadius || 4.2) * cellW;

      // Dark radial gradient centered on snake head: lantern light at center, soft realistic fade into dark fog
      const lightGrad = ctx.createRadialGradient(hx, hy, fogR * 0.3, hx, hy, fogR);
      lightGrad.addColorStop(0, 'rgba(3, 7, 18, 0)');
      lightGrad.addColorStop(0.65, 'rgba(3, 7, 18, 0.12)');
      lightGrad.addColorStop(0.85, 'rgba(3, 7, 18, 0.65)');
      lightGrad.addColorStop(1, 'rgba(3, 7, 18, 0.94)');

      ctx.fillStyle = lightGrad;
      ctx.fillRect(0, 0, width, height);

      // Warm lantern glow ring
      ctx.beginPath();
      ctx.arc(hx, hy, fogR * 0.45, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(251, 191, 36, 0.08)';
      ctx.fill();

      // Glimmers for glow berries and ticking bombs in the fog
      foodItems.forEach((f) => {
        if (f.type === 'GLOW_BERRY' || f.type === 'BOMB') {
          const bx = gridX + f.position.x * cellW + cellW / 2;
          const by = gridY + f.position.y * cellH + cellH / 2;
          const bGrad = ctx.createRadialGradient(bx, by, 2, bx, by, cellW * 2.2);
          const color = f.type === 'GLOW_BERRY' ? '56, 189, 248' : '239, 68, 68';
          bGrad.addColorStop(0, `rgba(${color}, 0.55)`);
          bGrad.addColorStop(1, `rgba(${color}, 0)`);
          ctx.fillStyle = bGrad;
          ctx.beginPath();
          ctx.arc(bx, by, cellW * 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Eerie spectral glimmer for obstacles in the deep fog so players never hit sudden invisible traps
      if (!isFullyIlluminated && obstacles && obstacles.length > 0) {
        obstacles.forEach((obs) => {
          const ox = gridX + obs.x * cellW + cellW / 2;
          const oy = gridY + obs.y * cellH + cellH / 2;
          const dist = Math.hypot(ox - hx, oy - hy);
          if (dist > fogR * 0.48) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(ox, oy, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(244, 63, 94, 0.45)';
            ctx.shadowColor = 'rgba(244, 63, 94, 0.8)';
            ctx.shadowBlur = 6;
            ctx.fill();
            ctx.restore();
          }
        });
      }
      ctx.restore();
    }

    // 8. Outer Distinct Boundary Wall, moat, grid lines, and obstacles are baked into the offscreen background cache!
    ctx.restore();
  }, [
    snake,
    direction,
    foodItems,
    obstacles,
    rovingSnakes,
    skin,
    arena,
    showGrid,
    isShieldActive,
    isSlowActive,
    isMagnetActive,
    isFireActive,
    isKeyAuraActive,
    isRainbowActive,
    isGhostActive,
    snakeColor,
    isSlidingOnIce,
    isFullyIlluminated,
    portals,
    currentMission,
    batterySaverEnabled,
    glowEffectsEnabled,
    renderOffscreenBackground,
  ]);

  // Canvas size and animation loop with dynamic FPS throttling & visibility sleep
  useEffect(() => {
    let animId: number;
    let lastFrameTime = performance.now();
    const effectiveFps = batterySaverEnabled ? 30 : (targetFps || 60);
    const frameInterval = 1000 / effectiveFps;
    let pauseTickCount = 0;

    const update = (now: number) => {
      animId = requestAnimationFrame(update);

      // 1. Sleep completely when window/tab is in background or device screen is locked
      if (typeof document !== 'undefined' && document.hidden) {
        return;
      }

      // 2. When paused, throttle canvas redraw to ~2 FPS (every 30 ticks) to minimize CPU/GPU load
      if (isPaused) {
        pauseTickCount++;
        if (pauseTickCount % 30 !== 0) {
          return;
        }
      }

      // 2.5. Update particle & floating text physics directly on fxRef with zero React re-renders (Point 2)
      const fx = fxRef?.current;
      if (fx && !isPaused) {
        if (fx.particles.length > 0) {
          const alphaDecay = batterySaverEnabled ? 0.08 : 0.05;
          const nextParticles: Particle[] = [];
          for (let i = 0; i < fx.particles.length; i++) {
            const p = fx.particles[i];
            const nextAlpha = p.alpha - alphaDecay;
            if (nextAlpha > 0.05) {
              nextParticles.push({
                ...p,
                x: p.x + p.vx * 0.1,
                y: p.y + p.vy * 0.1,
                alpha: nextAlpha,
                size: Math.max(0.5, p.size * 0.95),
              });
            }
          }
          fx.particles = nextParticles;
        }

        if (fx.floatingTexts.length > 0) {
          const nextTexts: FloatingText[] = [];
          for (let i = 0; i < fx.floatingTexts.length; i++) {
            const ft = fx.floatingTexts[i];
            const nextAlpha = ft.alpha - 0.055;
            if (nextAlpha > 0.05) {
              nextTexts.push({
                ...ft,
                y: ft.y - 0.09,
                alpha: nextAlpha,
              });
            }
          }
          fx.floatingTexts = nextTexts;
        }
      }

      // 3. FPS Capping (throttling against high refresh rate displays like 90Hz/120Hz/ProMotion)
      const elapsed = now - lastFrameTime;
      if (elapsed < frameInterval - 1) {
        return;
      }
      lastFrameTime = now - (elapsed % frameInterval);

      try {
        render();
      } catch (err) {
        console.warn('Canvas render error suppressed to prevent freeze:', err);
      }
    };

    animId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animId);
  }, [render, isPaused, batterySaverEnabled, targetFps]);

  // Resize canvas according to container
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const applySize = (contW: number, contH: number) => {
      if (!contW) return;
      const ARENA_PADDING = 8;
      const availW = Math.max(100, contW - ARENA_PADDING * 2);
      const availH = Math.max(100, (contH || contW) - ARENA_PADDING * 2);
      let cellSize = Math.floor(Math.min(availW / GRID_COLS, availH / GRID_ROWS));
      if (cellSize < 10) cellSize = 10;
      const targetWidth = cellSize * GRID_COLS + ARENA_PADDING * 2;
      const targetHeight = cellSize * GRID_ROWS + ARENA_PADDING * 2;
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      canvas.style.width = `${targetWidth}px`;
      canvas.style.height = `${targetHeight}px`;
    };

    if (container.clientWidth) {
      applySize(container.clientWidth, container.clientHeight);
    }

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: contW, height: contH } = entry.contentRect;
        applySize(contW, contH);
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div className="relative w-full h-full max-w-[500px] flex flex-col items-center justify-center mx-auto select-none overflow-hidden pb-[max(env(safe-area-inset-bottom),0.5rem)]">
      {/* 1. Main Canvas Area: Dynamically takes all available space */}
      <div
        ref={containerRef}
        id="game-canvas-container"
        className="relative w-full flex-1 min-h-0 flex items-center justify-center mx-auto touch-none select-none p-1 overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={handleDoubleClick}
      >
        <canvas
          ref={canvasRef}
          className={`block rounded-2xl shadow-2xl transition-all duration-300 ${
            arena.id === 'neon_grid'
              ? 'shadow-cyan-950/80 bg-[#060914]'
              : 'shadow-pink-950/50 bg-slate-950'
          }`}
        />

        {/* Swipe touch feedback pulse */}
        {touchIndicator && (
          <div
            className="absolute w-12 h-12 -ml-6 -mt-6 rounded-full border-2 border-pink-400/90 bg-pink-500/25 pointer-events-none animate-ping"
            style={{ left: touchIndicator.x, top: touchIndicator.y }}
          />
        )}

        {/* Double tap ripple & pause feedback */}
        {doubleTapRipple && (
          <div
            className="absolute -ml-8 -mt-8 w-16 h-16 rounded-full border-2 border-amber-400/90 bg-amber-400/30 flex items-center justify-center pointer-events-none animate-ping z-30"
            style={{ left: doubleTapRipple.x, top: doubleTapRipple.y }}
          >
            <Pause className="w-6 h-6 text-amber-300 fill-amber-300" />
          </div>
        )}

        {/* Double-tap instruction pill (auto-dismisses after 4.5s) */}
        {showDoubleTapHint && !isPaused && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-20 px-2.5 py-0.5 rounded-full bg-slate-900/90 border border-slate-700/60 shadow-sm flex items-center gap-1 text-[10px] text-slate-300 pointer-events-none animate-fade-in select-none">
            <span>👆👆</span>
            <span className="font-semibold text-slate-200">
              {getTranslation('doubleTapToPauseHint', language)}
            </span>
          </div>
        )}

        {/* Paused state modal overlay */}
        {isPaused && (
          <div
            className="absolute inset-0 bg-slate-950/85 flex flex-col items-center justify-center rounded-2xl z-30 select-none p-4 animate-fade-in"
            onDoubleClick={handleDoubleClick}
          >
            <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[280px]">
              <CuteModalBackground
                theme="pause"
                className="w-full p-5 text-white font-bold text-center shadow-2xl flex flex-col items-center gap-4 animate-fade-in"
              >
                {/* Header Icon */}
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/50 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Pause className="w-6 h-6 text-emerald-400 fill-emerald-400" />
                </div>

                <div>
                  <div className="text-xl font-black text-white tracking-wide">
                    {getTranslation('gamePaused', language)}
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                    {getTranslation('doubleTapToResumeHint', language)}
                  </p>
                </div>

                {/* Actions: Resume, Restart, Quit */}
                <div className="w-full flex flex-col gap-2.5 pt-1">
                  {/* 1. 繼續挑戰 (Resume) */}
                  <button
                    type="button"
                    id="btn-pause-resume"
                    onClick={() => {
                      soundEngine.playResume();
                      if (onTogglePause) onTogglePause();
                    }}
                    className="w-full py-3 px-4 rounded-xl min-h-[44px] bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-slate-950 text-slate-950" />
                    <span>{getTranslation('resumeGame', language)}</span>
                  </button>

                  {/* 2. 重新開始 (Restart) - 扣 1 心 */}
                  <button
                    type="button"
                    id="btn-pause-restart"
                    onClick={() => {
                      soundEngine.playClick();
                      if (onRestart) onRestart();
                    }}
                    className="w-full py-3 px-4 rounded-xl min-h-[44px] bg-slate-800 hover:bg-slate-750 border border-amber-500/40 text-amber-300 hover:text-amber-200 font-bold text-xs flex items-center justify-between active:scale-95 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <RotateCcw className="w-4 h-4 text-amber-400" />
                      <span>{getTranslation('restartGame', language)}</span>
                    </div>
                    <span className="text-[11px] font-black text-rose-300 bg-rose-950/70 border border-rose-500/50 px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-sm shrink-0">
                      -1 ❤️
                    </span>
                  </button>

                  {/* 3. 離開遊戲 (Quit / Return Home) - 扣 1 心 */}
                  <button
                    type="button"
                    id="btn-pause-quit"
                    onClick={() => {
                      soundEngine.playClick();
                      if (onQuit) onQuit();
                    }}
                    className="w-full py-3 px-4 rounded-xl min-h-[44px] bg-slate-800/80 hover:bg-rose-950/30 border border-slate-700/80 hover:border-rose-500/50 text-slate-300 hover:text-rose-300 font-bold text-xs flex items-center justify-between active:scale-95 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Home className="w-4 h-4 text-slate-400" />
                      <span>{getTranslation('quitGame', language)}</span>
                    </div>
                    <span className="text-[11px] font-black text-rose-300 bg-rose-950/70 border border-rose-500/50 px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-sm shrink-0">
                      -1 ❤️
                    </span>
                  </button>
                </div>
              </CuteModalBackground>
            </div>
          </div>
        )}

        {/* Active Power-up Status Badges with Live Duration Countdown (Zero backdrop-blur & zero CSS animation churn) */}
        <div className="absolute top-1 left-2 flex flex-wrap gap-1.5 pointer-events-none z-20 max-w-[85%]">
          {isRainbowActive && (
            <div
              className="flex items-center gap-1 px-2.5 h-7 bg-slate-900/90 border border-pink-400/80 rounded-full text-xs font-bold text-pink-100 shadow-sm"
              title="Rainbow Fever Active (2x Score & Wildcard)"
            >
              <span className="text-sm">🍭</span>
              <span className="text-[10px] font-black bg-gradient-to-r from-pink-200 via-yellow-200 to-cyan-200 bg-clip-text text-transparent">
                {language === 'en' ? 'RAINBOW 2X' : language === 'ja' ? '虹色 2倍' : '彩虹狂熱 2倍'}
              </span>
              {powerUpTimeLeft?.rainbow ? (
                <span className="font-mono text-[11px] font-black text-white ml-0.5">
                  {powerUpTimeLeft.rainbow}s
                </span>
              ) : null}
            </div>
          )}
          {isShieldActive && (
            <div className="flex items-center gap-1 px-2 h-7 bg-slate-900/90 border border-sky-400/80 rounded-full text-xs font-bold text-sky-200 shadow-sm" title="Shield Active">
              <span>🛡️</span>
              {powerUpTimeLeft?.shield ? <span className="font-mono text-[11px] font-black">{powerUpTimeLeft.shield}s</span> : null}
            </div>
          )}
          {isFireActive && (
            <div className="flex items-center gap-1 px-2 h-7 bg-slate-900/90 border border-orange-400/80 rounded-full text-xs font-bold text-orange-200 shadow-sm" title="Fire Rush">
              <span>🔥</span>
              {powerUpTimeLeft?.fire ? <span className="font-mono text-[11px] font-black">{powerUpTimeLeft.fire}s</span> : null}
            </div>
          )}
          {isKeyAuraActive && (
            <div className="flex items-center gap-1 px-2 h-7 bg-slate-900/90 border border-amber-400/80 rounded-full text-xs font-bold text-amber-200 shadow-sm" title="Golden Vault Aura">
              <span>🗝️</span>
              <span className="text-[10px] font-black">{language === 'en' ? 'VAULT' : language === 'ja' ? '秘庫' : '秘庫金鐘'}</span>
              {powerUpTimeLeft?.keyAura ? <span className="font-mono text-[11px] font-black">{powerUpTimeLeft.keyAura}s</span> : null}
            </div>
          )}
          {isMagnetActive && (
            <div className="flex items-center gap-1 px-2 h-7 bg-slate-900/90 border border-cyan-400/80 rounded-full text-xs font-bold text-cyan-200 shadow-sm" title="Magnet Field">
              <span>🧲</span>
              {powerUpTimeLeft?.magnet ? <span className="font-mono text-[11px] font-black">{powerUpTimeLeft.magnet}s</span> : null}
            </div>
          )}
          {isSlowActive && (
            <div className="flex items-center gap-1 px-2 h-7 bg-slate-900/90 border border-purple-400/80 rounded-full text-xs font-bold text-purple-200 shadow-sm" title="Slow Motion">
              <span>⏳</span>
              {powerUpTimeLeft?.slow ? <span className="font-mono text-[11px] font-black">{powerUpTimeLeft.slow}s</span> : null}
            </div>
          )}
          {isGhostActive && (
            <div className="flex items-center gap-1 px-2 h-7 bg-slate-900/90 border border-purple-400/80 rounded-full text-xs font-bold text-purple-200 shadow-sm" title="Ghost Mode Active">
              <span>👻</span>
              <span className="text-[10px] font-black">{language === 'en' ? 'GHOST' : language === 'ja' ? 'すり抜け' : '穿透'}</span>
              {powerUpTimeLeft?.ghost ? <span className="font-mono text-[11px] font-black">{powerUpTimeLeft.ghost}s</span> : null}
            </div>
          )}
          {isSlidingOnIce && (
            <div className="flex items-center gap-1 px-2 h-7 bg-slate-900/90 border border-cyan-400/80 rounded-full text-xs font-bold text-cyan-200 shadow-sm" title="Sliding on Ice">
              <span>🧊</span>
              <span className="text-[10px] font-black">{language === 'en' ? 'SLIDING!' : language === 'ja' ? '滑走中!' : '滑行中!'}</span>
            </div>
          )}

          {/* Level Fast Speed Indicator Badge */}
          {currentMission?.snakeSpeed && currentMission.snakeSpeed !== 'NORMAL' && (
            <div
              className={`flex items-center gap-1 px-2 h-7 rounded-full text-xs font-bold shadow-sm border bg-slate-900/90 ${
                currentMission.snakeSpeed === 'TURBO' || currentMission.snakeSpeed === 'EXTREME'
                  ? 'border-rose-400/80 text-rose-200'
                  : currentMission.snakeSpeed === 'VERY_FAST'
                  ? 'border-amber-400/80 text-amber-200'
                  : 'border-emerald-400/70 text-emerald-200'
              }`}
              title={language === 'en' ? `Level Speed: ${currentMission.snakeSpeed}` : language === 'ja' ? `ステージ速度: ${currentMission.snakeSpeed}` : language === 'zh-CN' ? `关卡速度: ${currentMission.snakeSpeed}` : `關卡速度: ${currentMission.snakeSpeed}`}
            >
              <span>⚡</span>
              <span className="text-[10px] font-black">
                {currentMission.snakeSpeed === 'TURBO' || currentMission.snakeSpeed === 'EXTREME'
                  ? (language === 'en' ? 'TURBO' : language === 'ja' ? '狂暴爆速' : language === 'zh-CN' ? '狂暴飙速' : '狂暴飆速')
                  : currentMission.snakeSpeed === 'VERY_FAST'
                  ? (language === 'en' ? 'SPEED RUSH' : language === 'ja' ? '極速スプリント' : language === 'zh-CN' ? '极速冲刺' : '極速衝刺')
                  : (language === 'en' ? 'FAST' : language === 'ja' ? 'スピードUP' : language === 'zh-CN' ? '疾风速' : '疾風速')}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
