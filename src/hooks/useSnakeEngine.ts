import { useState, useEffect, useRef, useCallback } from 'react';
import { Direction, Point, GameMode, GameOverReason, FoodItem, FoodType, Particle, FloatingText, LevelMission, RovingSnake } from '../types';
import { soundEngine } from '../utils/audio';
import { SupportedLanguage } from '../utils/i18n';
import confetti from 'canvas-confetti';

export const GRID_COLS = 20;
export const GRID_ROWS = 28;


const INITIAL_SNAKE: Point[] = [
  { x: 10, y: 15 },
  { x: 10, y: 16 },
  { x: 10, y: 17 },
  { x: 10, y: 18 },
];

export function generateObstacles(
  hasObstacles?: boolean,
  obstacleType?: LevelMission['obstacleType'],
  portals?: [Point, Point]
): Point[] {
  if (!hasObstacles) return [];
  const type = obstacleType || 'PILLARS';

  let rawList: Point[] = [];

  switch (type) {
    case 'CORNERS':
      rawList = [
        { x: 3, y: 4 }, { x: 4, y: 4 }, { x: 5, y: 4 }, { x: 3, y: 5 }, { x: 4, y: 5 },
        { x: 14, y: 4 }, { x: 15, y: 4 }, { x: 16, y: 4 }, { x: 15, y: 5 }, { x: 16, y: 5 },
        { x: 3, y: 23 }, { x: 4, y: 23 }, { x: 5, y: 23 }, { x: 3, y: 22 }, { x: 4, y: 22 },
        { x: 14, y: 23 }, { x: 15, y: 23 }, { x: 16, y: 23 }, { x: 15, y: 22 }, { x: 16, y: 22 },
      ];
      break;
    case 'CROSS':
      rawList = [
        { x: 6, y: 8 }, { x: 7, y: 8 }, { x: 8, y: 8 }, { x: 9, y: 8 }, { x: 10, y: 8 }, { x: 11, y: 8 }, { x: 12, y: 8 }, { x: 13, y: 8 },
        { x: 10, y: 5 }, { x: 10, y: 6 }, { x: 10, y: 7 },
        { x: 6, y: 23 }, { x: 7, y: 23 }, { x: 8, y: 23 }, { x: 9, y: 23 }, { x: 10, y: 23 }, { x: 11, y: 23 }, { x: 12, y: 23 }, { x: 13, y: 23 },
      ];
      break;
    case 'CORRIDOR':
      rawList = [
        { x: 2, y: 9 }, { x: 3, y: 9 }, { x: 4, y: 9 }, { x: 5, y: 9 }, { x: 6, y: 9 },
        { x: 13, y: 9 }, { x: 14, y: 9 }, { x: 15, y: 9 }, { x: 16, y: 9 }, { x: 17, y: 9 },
        { x: 2, y: 22 }, { x: 3, y: 22 }, { x: 4, y: 22 }, { x: 5, y: 22 }, { x: 6, y: 22 },
        { x: 13, y: 22 }, { x: 14, y: 22 }, { x: 15, y: 22 }, { x: 16, y: 22 }, { x: 17, y: 22 },
      ];
      break;
    case 'MAZE':
      rawList = [
        { x: 4, y: 5 }, { x: 4, y: 6 }, { x: 4, y: 7 }, { x: 4, y: 8 },
        { x: 15, y: 5 }, { x: 15, y: 6 }, { x: 15, y: 7 }, { x: 15, y: 8 },
        { x: 7, y: 6 }, { x: 8, y: 6 }, { x: 11, y: 6 }, { x: 12, y: 6 },
        { x: 4, y: 22 }, { x: 4, y: 23 }, { x: 4, y: 24 }, { x: 4, y: 25 },
        { x: 15, y: 22 }, { x: 15, y: 23 }, { x: 15, y: 24 }, { x: 15, y: 25 },
        { x: 7, y: 23 }, { x: 8, y: 23 }, { x: 11, y: 23 }, { x: 12, y: 23 },
      ];
      break;
    case 'BOX':
      rawList = [
        { x: 6, y: 6 }, { x: 7, y: 6 }, { x: 8, y: 6 }, { x: 11, y: 6 }, { x: 12, y: 6 }, { x: 13, y: 6 },
        { x: 6, y: 7 }, { x: 6, y: 8 }, { x: 6, y: 9 },
        { x: 13, y: 7 }, { x: 13, y: 8 }, { x: 13, y: 9 },
        { x: 6, y: 22 }, { x: 7, y: 22 }, { x: 8, y: 22 }, { x: 11, y: 22 }, { x: 12, y: 22 }, { x: 13, y: 22 },
      ];
      break;
    case 'SCATTERED':
      rawList = [
        { x: 4, y: 6 }, { x: 7, y: 8 }, { x: 12, y: 8 }, { x: 15, y: 6 },
        { x: 4, y: 22 }, { x: 8, y: 23 }, { x: 11, y: 23 }, { x: 15, y: 22 },
        { x: 6, y: 15 }, { x: 13, y: 15 },
      ];
      break;
    case 'DOUBLE_GATE':
      rawList = [
        { x: 3, y: 7 }, { x: 4, y: 7 }, { x: 5, y: 7 }, { x: 14, y: 7 }, { x: 15, y: 7 }, { x: 16, y: 7 },
        { x: 3, y: 23 }, { x: 4, y: 23 }, { x: 5, y: 23 }, { x: 14, y: 23 }, { x: 15, y: 23 }, { x: 16, y: 23 },
      ];
      break;
    case 'SPIRAL':
      rawList = [
        { x: 4, y: 6 }, { x: 5, y: 6 }, { x: 6, y: 6 }, { x: 7, y: 6 }, { x: 8, y: 6 },
        { x: 8, y: 7 }, { x: 8, y: 8 }, { x: 8, y: 9 },
        { x: 11, y: 22 }, { x: 12, y: 22 }, { x: 13, y: 22 }, { x: 14, y: 22 }, { x: 15, y: 22 },
        { x: 11, y: 21 }, { x: 11, y: 20 }, { x: 11, y: 19 },
      ];
      break;
    case 'HOURGLASS':
      rawList = [
        { x: 4, y: 5 }, { x: 5, y: 5 }, { x: 14, y: 5 }, { x: 15, y: 5 },
        { x: 6, y: 7 }, { x: 13, y: 7 },
        { x: 6, y: 21 }, { x: 13, y: 21 },
        { x: 4, y: 23 }, { x: 5, y: 23 }, { x: 14, y: 23 }, { x: 15, y: 23 },
      ];
      break;
    case 'DIAMOND':
      rawList = [
        { x: 9, y: 5 }, { x: 10, y: 5 },
        { x: 6, y: 8 }, { x: 13, y: 8 },
        { x: 6, y: 20 }, { x: 13, y: 20 },
        { x: 9, y: 23 }, { x: 10, y: 23 },
      ];
      break;
    case 'CASTLE':
      rawList = [
        { x: 3, y: 6 }, { x: 3, y: 7 }, { x: 5, y: 6 }, { x: 5, y: 7 },
        { x: 14, y: 6 }, { x: 14, y: 7 }, { x: 16, y: 6 }, { x: 16, y: 7 },
        { x: 3, y: 22 }, { x: 3, y: 23 }, { x: 5, y: 22 }, { x: 5, y: 23 },
        { x: 14, y: 22 }, { x: 14, y: 23 }, { x: 16, y: 22 }, { x: 16, y: 23 },
      ];
      break;
    case 'PYRAMID':
      rawList = [
        { x: 9, y: 5 }, { x: 10, y: 5 },
        { x: 7, y: 7 }, { x: 8, y: 7 }, { x: 11, y: 7 }, { x: 12, y: 7 },
        { x: 5, y: 9 }, { x: 6, y: 9 }, { x: 13, y: 9 }, { x: 14, y: 9 },
      ];
      break;
    case 'CHECKERBOARD':
      rawList = [
        { x: 5, y: 6 }, { x: 6, y: 6 },
        { x: 13, y: 6 }, { x: 14, y: 6 },
        { x: 9, y: 10 }, { x: 10, y: 10 },
        { x: 5, y: 22 }, { x: 6, y: 22 },
        { x: 13, y: 22 }, { x: 14, y: 22 },
      ];
      break;
    case 'TWIN_BRIDGES':
      rawList = [
        { x: 2, y: 8 }, { x: 3, y: 8 }, { x: 4, y: 8 }, { x: 5, y: 8 },
        { x: 14, y: 8 }, { x: 15, y: 8 }, { x: 16, y: 8 }, { x: 17, y: 8 },
        { x: 2, y: 21 }, { x: 3, y: 21 }, { x: 4, y: 21 }, { x: 5, y: 21 },
        { x: 14, y: 21 }, { x: 15, y: 21 }, { x: 16, y: 21 }, { x: 17, y: 21 },
      ];
      break;
    case 'VOLCANO_RIM':
      rawList = [
        { x: 7, y: 7 }, { x: 8, y: 7 }, { x: 11, y: 7 }, { x: 12, y: 7 },
        { x: 5, y: 9 }, { x: 14, y: 9 },
        { x: 5, y: 20 }, { x: 14, y: 20 },
        { x: 7, y: 22 }, { x: 8, y: 22 }, { x: 11, y: 22 }, { x: 12, y: 22 },
      ];
      break;
    case 'CYBER_CIRCUIT':
      rawList = [
        { x: 4, y: 4 }, { x: 5, y: 4 }, { x: 6, y: 4 }, { x: 6, y: 5 }, { x: 6, y: 6 },
        { x: 13, y: 4 }, { x: 14, y: 4 }, { x: 15, y: 4 }, { x: 13, y: 5 }, { x: 13, y: 6 },
        { x: 4, y: 24 }, { x: 5, y: 24 }, { x: 6, y: 24 }, { x: 6, y: 23 }, { x: 6, y: 22 },
        { x: 13, y: 24 }, { x: 14, y: 24 }, { x: 15, y: 24 }, { x: 13, y: 23 }, { x: 13, y: 22 },
      ];
      break;
    case 'CORAL_REEF':
      rawList = [
        { x: 3, y: 5 }, { x: 4, y: 6 }, { x: 5, y: 5 },
        { x: 14, y: 6 }, { x: 15, y: 5 }, { x: 16, y: 6 },
        { x: 8, y: 8 }, { x: 11, y: 8 },
        { x: 3, y: 22 }, { x: 4, y: 23 }, { x: 5, y: 22 },
        { x: 14, y: 23 }, { x: 15, y: 22 }, { x: 16, y: 23 },
      ];
      break;
    case 'ASTRAL_STAR':
      rawList = [
        { x: 9, y: 6 }, { x: 10, y: 6 },
        { x: 5, y: 10 }, { x: 14, y: 10 },
        { x: 5, y: 19 }, { x: 14, y: 19 },
        { x: 9, y: 23 }, { x: 10, y: 23 },
      ];
      break;
    case 'PORTAL_GATE':
      rawList = [
        { x: 3, y: 12 }, { x: 3, y: 16 },
        { x: 16, y: 12 }, { x: 16, y: 16 },
        { x: 5, y: 6 }, { x: 14, y: 6 },
        { x: 5, y: 22 }, { x: 14, y: 22 },
      ];
      break;
    case 'SERPENTINE':
      rawList = [
        { x: 3, y: 6 }, { x: 4, y: 6 }, { x: 5, y: 6 }, { x: 6, y: 6 }, { x: 7, y: 6 },
        { x: 12, y: 10 }, { x: 13, y: 10 }, { x: 14, y: 10 }, { x: 15, y: 10 }, { x: 16, y: 10 },
        { x: 3, y: 21 }, { x: 4, y: 21 }, { x: 5, y: 21 }, { x: 6, y: 21 }, { x: 7, y: 21 },
      ];
      break;
    case 'ZIG_ZAG':
      rawList = [
        { x: 4, y: 6 }, { x: 5, y: 7 }, { x: 6, y: 6 }, { x: 7, y: 7 },
        { x: 12, y: 6 }, { x: 13, y: 7 }, { x: 14, y: 6 }, { x: 15, y: 7 },
        { x: 4, y: 22 }, { x: 5, y: 23 }, { x: 6, y: 22 }, { x: 7, y: 23 },
        { x: 12, y: 22 }, { x: 13, y: 23 }, { x: 14, y: 22 }, { x: 15, y: 23 },
      ];
      break;
    case 'TREASURE_VAULT':
      rawList = [
        { x: 6, y: 7 }, { x: 7, y: 7 }, { x: 12, y: 7 }, { x: 13, y: 7 },
        { x: 5, y: 8 }, { x: 14, y: 8 },
        { x: 5, y: 21 }, { x: 14, y: 21 },
        { x: 6, y: 22 }, { x: 7, y: 22 }, { x: 12, y: 22 }, { x: 13, y: 22 },
      ];
      break;
    case 'BOSS_ARENA':
      rawList = [
        { x: 2, y: 5 }, { x: 3, y: 5 }, { x: 2, y: 6 },
        { x: 16, y: 5 }, { x: 17, y: 5 }, { x: 17, y: 6 },
        { x: 2, y: 22 }, { x: 3, y: 23 }, { x: 2, y: 23 },
        { x: 16, y: 23 }, { x: 17, y: 23 }, { x: 17, y: 22 },
        { x: 9, y: 7 }, { x: 10, y: 7 },
        { x: 9, y: 21 }, { x: 10, y: 21 },
      ];
      break;
    case 'PILLARS':
    default:
      rawList = [
        { x: 5, y: 6 }, { x: 5, y: 7 }, { x: 5, y: 8 },
        { x: 14, y: 6 }, { x: 14, y: 7 }, { x: 14, y: 8 },
        { x: 5, y: 22 }, { x: 5, y: 23 }, { x: 5, y: 24 },
        { x: 14, y: 22 }, { x: 14, y: 23 }, { x: 14, y: 24 },
      ];
      break;
  }

  // Strict safety guarantee: obstacles must NEVER spawn on snake initial spawn or portals!
  const forbidden = [
    { x: 10, y: 14 }, // One step ahead of snake (since initial direction is UP)
    { x: 10, y: 15 },
    { x: 10, y: 16 },
    { x: 10, y: 17 },
    { x: 10, y: 18 },
    ...(portals || []),
  ];
  return rawList.filter(
    (obs) => !forbidden.some((p) => p.x === obs.x && p.y === obs.y)
  );
}

export function generateRovingSnakes(
  count: number = 0,
  speed: LevelMission['rovingSnakeSpeed'] = 'SLOW',
  obstacles: Point[] = []
): RovingSnake[] {
  if (count <= 0) return [];
  const speedTicks = speed === 'FAST' ? 1 : 2;

  const presets = [
    {
      id: 'roving-1',
      head: { x: 4, y: 5 },
      body: [{ x: 4, y: 5 }, { x: 3, y: 5 }, { x: 2, y: 5 }],
      direction: 'RIGHT' as Direction,
      pattern: 'WANDER' as const,
      color: '#f43f5e',
      bodyColor: '#e11d48',
      headColor: '#fb7185',
      glowColor: 'rgba(244, 63, 94, 0.75)',
      eyeColor: '#fef08a',
      name: '赤影毒蛇',
    },
    {
      id: 'roving-2',
      head: { x: 16, y: 9 },
      body: [{ x: 16, y: 9 }, { x: 16, y: 8 }, { x: 16, y: 7 }],
      direction: 'DOWN' as Direction,
      pattern: 'WANDER' as const,
      color: '#8b5cf6',
      bodyColor: '#7c3aed',
      headColor: '#a78bfa',
      glowColor: 'rgba(139, 92, 246, 0.75)',
      eyeColor: '#ef4444',
      name: '幽冥紫蟒',
    },
    {
      id: 'roving-3',
      head: { x: 4, y: 23 },
      body: [{ x: 4, y: 23 }, { x: 3, y: 23 }, { x: 2, y: 23 }],
      direction: 'RIGHT' as Direction,
      pattern: 'WANDER' as const,
      color: '#f59e0b',
      bodyColor: '#d97706',
      headColor: '#fbbf24',
      glowColor: 'rgba(245, 158, 11, 0.75)',
      eyeColor: '#38bdf8',
      name: '熾金魔蛇',
    },
  ];

  return presets.slice(0, count).map((preset) => {
    let validBody = preset.body;
    let attempts = 0;
    while (
      (validBody.some((b) => obstacles.some((o) => o.x === b.x && o.y === b.y)) ||
        validBody.some((b) => INITIAL_SNAKE.some((s) => Math.hypot(s.x - b.x, s.y - b.y) <= 3))) &&
      attempts < 15
    ) {
      attempts++;
      validBody = validBody.map((pt) => ({
        x: Math.min(GRID_COLS - 2, pt.x + 1),
        y: Math.min(GRID_ROWS - 2, pt.y),
      }));
    }
    return {
      id: preset.id,
      body: validBody,
      direction: preset.direction,
      speedTicks,
      tickCounter: 0,
      pattern: preset.pattern,
      color: preset.color,
      bodyColor: preset.bodyColor,
      headColor: preset.headColor,
      glowColor: preset.glowColor,
      eyeColor: preset.eyeColor,
      name: preset.name,
    };
  });
}

export const OPPOSITE_DIRECTIONS: Record<Direction, Direction> = {
  UP: 'DOWN',
  DOWN: 'UP',
  LEFT: 'RIGHT',
  RIGHT: 'LEFT',
};

export const DIRECTION_DELTAS: Record<Direction, Point> = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

export function getSafeWallTurn(
  head: Point,
  dir: Direction,
  obstacles: Point[] = []
): { dir: Direction; next: Point } {
  const candidates: Direction[] =
    dir === 'UP' || dir === 'DOWN' ? ['LEFT', 'RIGHT'] : ['UP', 'DOWN'];

  const dirDeltas = DIRECTION_DELTAS;

  // Filter candidates that strictly stay within the grid arena
  const valid = candidates.filter((d) => {
    const tx = head.x + dirDeltas[d].x;
    const ty = head.y + dirDeltas[d].y;
    return tx >= 0 && tx < GRID_COLS && ty >= 0 && ty < GRID_ROWS;
  });

  let chosen: Direction =
    valid[0] || (dir === 'UP' ? 'DOWN' : dir === 'DOWN' ? 'UP' : dir === 'LEFT' ? 'RIGHT' : 'LEFT');

  if (valid.length > 1) {
    // Prefer non-obstacle candidate if possible
    const nonObs = valid.filter((d) => {
      const tx = head.x + dirDeltas[d].x;
      const ty = head.y + dirDeltas[d].y;
      return !obstacles.some((o) => o.x === tx && o.y === ty);
    });

    if (nonObs.length === 1) {
      chosen = nonObs[0];
    } else {
      // Pick direction heading towards arena center to maximize turning room
      if (dir === 'UP' || dir === 'DOWN') {
        chosen = head.x < GRID_COLS / 2 ? 'RIGHT' : 'LEFT';
      } else {
        chosen = head.y < GRID_ROWS / 2 ? 'DOWN' : 'UP';
      }
    }
  }

  const step = dirDeltas[chosen];
  return {
    dir: chosen,
    next: {
      x: Math.max(0, Math.min(GRID_COLS - 1, head.x + step.x)),
      y: Math.max(0, Math.min(GRID_ROWS - 1, head.y + step.y)),
    },
  };
}

export function getSafeTurn(
  head: Point,
  dir: Direction,
  obstacles: Point[] = [],
  body: Point[] = [],
  rovingSnakes: RovingSnake[] = []
): { dir: Direction; next: Point } {
  const candidates: Direction[] =
    dir === 'UP' || dir === 'DOWN' ? ['LEFT', 'RIGHT'] : ['UP', 'DOWN'];

  const isCompletelySafe = (p: Point) => {
    if (p.x < 0 || p.x >= GRID_COLS || p.y < 0 || p.y >= GRID_ROWS) return false;
    if (obstacles.some((o) => o.x === p.x && o.y === p.y)) return false;
    if (body.slice(0, -1).some((s) => s.x === p.x && s.y === p.y)) return false;
    if (rovingSnakes.some((rs) => rs.body.some((b) => b.x === p.x && b.y === p.y))) return false;
    return true;
  };

  const isSafeFromObs = (p: Point) => {
    if (p.x < 0 || p.x >= GRID_COLS || p.y < 0 || p.y >= GRID_ROWS) return false;
    if (obstacles.some((o) => o.x === p.x && o.y === p.y)) return false;
    return true;
  };

  // 1. Pick a 90-degree turn that is completely free
  for (const d of candidates) {
    const nextP = { x: head.x + DIRECTION_DELTAS[d].x, y: head.y + DIRECTION_DELTAS[d].y };
    if (isCompletelySafe(nextP)) {
      return { dir: d, next: nextP };
    }
  }

  // 2. Pick a 90-degree turn that avoids obstacles and boundary walls
  for (const d of candidates) {
    const nextP = { x: head.x + DIRECTION_DELTAS[d].x, y: head.y + DIRECTION_DELTAS[d].y };
    if (isSafeFromObs(nextP)) {
      return { dir: d, next: nextP };
    }
  }

  // 3. Try reversing if opposite direction is free
  const opp = OPPOSITE_DIRECTIONS[dir];
  const oppP = { x: head.x + DIRECTION_DELTAS[opp].x, y: head.y + DIRECTION_DELTAS[opp].y };
  if (isSafeFromObs(oppP)) {
    return { dir: opp, next: oppP };
  }

  // 4. Default to safe wall turn
  return getSafeWallTurn(head, dir, obstacles);
}

export function getSafeReverseDirection(
  reversedSnake: Point[],
  currentDir: Direction,
  obstacles: Point[] = [],
  rovingSnakes: RovingSnake[] = [],
  isGhostActive: boolean = false
): Direction {
  if (reversedSnake.length < 2) {
    return OPPOSITE_DIRECTIONS[currentDir] || currentDir;
  }

  const newHead = reversedSnake[0];

  // Find the first segment behind the new head with different coordinates (handles duplicate tail segments safely)
  let neckIdx = 1;
  while (
    neckIdx < reversedSnake.length &&
    reversedSnake[neckIdx].x === newHead.x &&
    reversedSnake[neckIdx].y === newHead.y
  ) {
    neckIdx++;
  }

  let primaryDir: Direction;
  if (neckIdx < reversedSnake.length) {
    const neck = reversedSnake[neckIdx];
    const dx = newHead.x - neck.x;
    const dy = newHead.y - neck.y;
    if (dx > 0) primaryDir = 'RIGHT';
    else if (dx < 0) primaryDir = 'LEFT';
    else if (dy > 0) primaryDir = 'DOWN';
    else if (dy < 0) primaryDir = 'UP';
    else primaryDir = OPPOSITE_DIRECTIONS[currentDir] || currentDir;
  } else {
    primaryDir = OPPOSITE_DIRECTIONS[currentDir] || currentDir;
  }

  const getStep = (d: Direction): Point => {
    return {
      x: newHead.x + DIRECTION_DELTAS[d].x,
      y: newHead.y + DIRECTION_DELTAS[d].y,
    };
  };

  const isPointSafe = (p: Point): boolean => {
    if (p.x < 0 || p.x >= GRID_COLS || p.y < 0 || p.y >= GRID_ROWS) {
      return isGhostActive;
    }
    if (!isGhostActive) {
      if (obstacles.some((o) => o.x === p.x && o.y === p.y)) return false;
      // Cannot step back into body segments (exclude new head itself and the very last tail segment which will move)
      const nonTailBody = reversedSnake.slice(1, Math.max(2, reversedSnake.length - 1));
      if (nonTailBody.some((s) => s.x === p.x && s.y === p.y)) return false;
      // Cannot step into roving snakes
      if (rovingSnakes.some((rs) => rs.body.some((b) => b.x === p.x && b.y === p.y))) return false;
    }
    return true;
  };

  // If primary direction is safe, prefer it
  if (isPointSafe(getStep(primaryDir))) {
    return primaryDir;
  }

  // If primary direction would immediately collide with a wall, obstacle, or body:
  // Try turning sideways first (perpendicular), then opposite
  const candidateOrder: Direction[] =
    primaryDir === 'UP' || primaryDir === 'DOWN'
      ? ['LEFT', 'RIGHT', OPPOSITE_DIRECTIONS[primaryDir]]
      : ['UP', 'DOWN', OPPOSITE_DIRECTIONS[primaryDir]];

  for (const cand of candidateOrder) {
    if (isPointSafe(getStep(cand))) {
      return cand;
    }
  }

  // Fallback to primaryDir if all directions seem constrained
  return primaryDir;
}

export interface UseSnakeEngineProps {
  mode: GameMode;
  currentLevel?: LevelMission;
  onGameOver: (
    score: number,
    coinsEarned: number,
    applesEaten: number,
    reason?: GameOverReason,
    snapshot?: {
      levelProgress: {
        normal: number;
        blue: number;
        green: number;
        golden: number;
        shield: number;
        length: number;
        portals?: number;
        magnet?: number;
        chili?: number;
        dragonEgg?: number;
        rainbow?: number;
        bombs?: number;
        colorSequenceCount?: number;
        keys?: number;
        lightning?: number;
      };
      snakeLength: number;
      activeLevel?: LevelMission;
      activeMode?: GameMode;
    }
  ) => void;
  onLevelCleared?: (levelId: number, rewardCoins: number, score?: number, coinsEarned?: number) => void;
  onAchievementProgress?: (id: string, amount: number) => void;
  language?: SupportedLanguage;
  batterySaverEnabled?: boolean;
}

export function useSnakeEngine({
  mode,
  currentLevel,
  language = 'zh-HK',
  batterySaverEnabled = false,
  onGameOver,
  onLevelCleared,
  onAchievementProgress,
}: UseSnakeEngineProps) {
  // Game states
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [direction, setDirection] = useState<Direction>('UP');
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [obstacles, setObstacles] = useState<Point[]>([]);
  const [rovingSnakes, setRovingSnakes] = useState<RovingSnake[]>([]);
  const [score, setScore] = useState<number>(0);
  const [coinsEarned, setCoinsEarned] = useState<number>(0);
  const [applesCount, setApplesCount] = useState<number>(0);
  const [combo, setCombo] = useState<number>(1);
  const [comboTimer, setComboTimer] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [isShieldActive, setIsShieldActive] = useState<boolean>(false);
  const [isSlowActive, setIsSlowActive] = useState<boolean>(false);
  const [isMagnetActive, setIsMagnetActive] = useState<boolean>(false);
  const [isFireActive, setIsFireActive] = useState<boolean>(false);
  const [isGhostActive, setIsGhostActive] = useState<boolean>(false);
  const [isKeyAuraActive, setIsKeyAuraActive] = useState<boolean>(false);
  const [isRainbowActive, setIsRainbowActive] = useState<boolean>(false);
  const [isLightningActive, setIsLightningActive] = useState<boolean>(false);
  const [snakeColor, setSnakeColor] = useState<'NORMAL' | 'RED' | 'BLUE' | 'GREEN'>('NORMAL');
  const [colorSequenceIndex, setColorSequenceIndex] = useState<number>(0);
  const [turnsLeft, setTurnsLeft] = useState<number>(999);
  const [isSlidingOnIce, setIsSlidingOnIce] = useState<boolean>(false);
  const [isFullyIlluminated, setIsFullyIlluminated] = useState<boolean>(false);
  const [powerUpTimeLeft, setPowerUpTimeLeft] = useState<{
    shield: number;
    slow: number;
    fire: number;
    magnet: number;
    ghost: number;
    keyAura?: number;
    rainbow?: number;
    lightning?: number;
  }>({
    shield: 0,
    slow: 0,
    fire: 0,
    magnet: 0,
    ghost: 0,
    keyAura: 0,
    rainbow: 0,
    lightning: 0,
  });
  const [gameOverReason, setGameOverReason] = useState<GameOverReason | null>(null);
  const gameOverReasonRef = useRef<GameOverReason | null>(null);
  const spawnGraceUntilRef = useRef<number>(0);

  // Revive limit tracking (原位復活只限[任務闖關]，且每局只可復活1次)
  const [revivesUsed, setRevivesUsed] = useState<number>(0);
  const revivesUsedRef = useRef<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isLevelCleared, setIsLevelCleared] = useState<boolean>(false);

  // Mission progress in LEVELS mode
  const [levelProgress, setLevelProgress] = useState<{
    normal: number;
    blue: number;
    green: number;
    golden: number;
    shield: number;
    length: number;
    portals: number;
    magnet: number;
    chili: number;
    dragonEgg: number;
    rainbow: number;
    bombs: number;
    colorSequenceCount: number;
    keys: number;
    lightning: number;
    surviveSeconds: number;
  }>({
    normal: 0,
    blue: 0,
    green: 0,
    golden: 0,
    shield: 0,
    length: 4,
    portals: 0,
    magnet: 0,
    chili: 0,
    dragonEgg: 0,
    rainbow: 0,
    bombs: 0,
    colorSequenceCount: 0,
    keys: 0,
    lightning: 0,
    surviveSeconds: 0,
  });

  // FX & Particles (managed via ref for zero React re-render overhead)
  const fxRef = useRef<{ particles: Particle[]; floatingTexts: FloatingText[] }>({
    particles: [],
    floatingTexts: [],
  });

  // Refs for loop & active config
  const modeRef = useRef<GameMode>(mode);
  const currentLevelRef = useRef<LevelMission | undefined>(currentLevel);
  const obstaclesRef = useRef<Point[]>([]);
  const rovingSnakesRef = useRef<RovingSnake[]>([]);
  const onGameOverRef = useRef(onGameOver);
  const onLevelClearedRef = useRef(onLevelCleared);
  const onAchievementProgressRef = useRef(onAchievementProgress);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    currentLevelRef.current = mode === 'LEVELS' ? currentLevel : undefined;
  }, [currentLevel, mode]);

  useEffect(() => {
    onGameOverRef.current = onGameOver;
    onLevelClearedRef.current = onLevelCleared;
    onAchievementProgressRef.current = onAchievementProgress;
  }, [onGameOver, onLevelCleared, onAchievementProgress]);

  useEffect(() => {
    obstaclesRef.current = obstacles;
  }, [obstacles]);

  useEffect(() => {
    rovingSnakesRef.current = rovingSnakes;
  }, [rovingSnakes]);

  const dirRef = useRef<Direction>('UP');
  const nextDirQueue = useRef<Direction[]>([]);
  const isPlayingRef = useRef<boolean>(false);
  const isPausedRef = useRef<boolean>(false);
  const isGameOverRef = useRef<boolean>(false);
  const scoreRef = useRef<number>(0);
  const coinsEarnedRef = useRef<number>(0);
  const applesCountRef = useRef<number>(0);
  const isShieldActiveRef = useRef<boolean>(false);
  const isMagnetActiveRef = useRef<boolean>(false);
  const isFireActiveRef = useRef<boolean>(false);
  const isGhostActiveRef = useRef<boolean>(false);
  const isKeyAuraActiveRef = useRef<boolean>(false);
  const isRainbowActiveRef = useRef<boolean>(false);
  const isLightningActiveRef = useRef<boolean>(false);
  const lightningUntilRef = useRef<number>(0);
  const lightningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const rainbowUntilRef = useRef<number>(0);
  const rainbowTimerRef = useRef<NodeJS.Timeout | null>(null);
  const keyAuraUntilRef = useRef<number>(0);
  const keyAuraTimerRef = useRef<NodeJS.Timeout | null>(null);
  const snakeColorRef = useRef<'NORMAL' | 'RED' | 'BLUE' | 'GREEN'>('NORMAL');
  const colorSequenceIndexRef = useRef<number>(0);
  const turnsLeftRef = useRef<number>(999);
  const isSlidingOnIceRef = useRef<boolean>(false);
  const isFullyIlluminatedUntilRef = useRef<number>(0);
  const lastBombTickRef = useRef<number>(0);
  const reviveShieldUntilRef = useRef<number>(0);
  const shieldUntilRef = useRef<number>(0);
  const shieldTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fireUntilRef = useRef<number>(0);
  const fireTimerRef = useRef<NodeJS.Timeout | null>(null);
  const magnetUntilRef = useRef<number>(0);
  const magnetTimerRef = useRef<NodeJS.Timeout | null>(null);
  const slowUntilRef = useRef<number>(0);
  const slowTimerRef = useRef<NodeJS.Timeout | null>(null);
  const ghostUntilRef = useRef<number>(0);
  const ghostTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLevelClearedRef = useRef<boolean>(false);
  const levelProgressRef = useRef(levelProgress);

  useEffect(() => {
    levelProgressRef.current = levelProgress;
  }, [levelProgress]);
  const isSlowActiveRef = useRef<boolean>(false);
  const foodItemsRef = useRef<FoodItem[]>([]);
  const snakeRef = useRef<Point[]>(INITIAL_SNAKE);
  const comboRef = useRef<number>(1);
  const comboTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync refs
  useEffect(() => {
    dirRef.current = direction;
  }, [direction]);

  useEffect(() => {
    snakeRef.current = snake;
  }, [snake]);

  useEffect(() => {
    foodItemsRef.current = foodItems;
  }, [foodItems]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
    isPausedRef.current = isPaused;
  }, [isPlaying, isPaused]);

  useEffect(() => {
    isGameOverRef.current = isGameOver;
  }, [isGameOver]);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    coinsEarnedRef.current = coinsEarned;
  }, [coinsEarned]);

  useEffect(() => {
    applesCountRef.current = applesCount;
  }, [applesCount]);

  useEffect(() => {
    isShieldActiveRef.current = isShieldActive;
  }, [isShieldActive]);

  useEffect(() => {
    isSlowActiveRef.current = isSlowActive;
  }, [isSlowActive]);

  useEffect(() => {
    isMagnetActiveRef.current = isMagnetActive;
  }, [isMagnetActive]);

  useEffect(() => {
    isFireActiveRef.current = isFireActive;
  }, [isFireActive]);

  useEffect(() => {
    isGhostActiveRef.current = isGhostActive;
  }, [isGhostActive]);

  useEffect(() => {
    isKeyAuraActiveRef.current = isKeyAuraActive;
  }, [isKeyAuraActive]);

  useEffect(() => {
    snakeColorRef.current = snakeColor;
  }, [snakeColor]);

  useEffect(() => {
    colorSequenceIndexRef.current = colorSequenceIndex;
  }, [colorSequenceIndex]);

  useEffect(() => {
    turnsLeftRef.current = turnsLeft;
  }, [turnsLeft]);

  useEffect(() => {
    isSlidingOnIceRef.current = isSlidingOnIce;
  }, [isSlidingOnIce]);

  const addFloatingText = useCallback((text: string, x: number, y: number, color: string) => {
    fxRef.current.floatingTexts.push({
      id: Math.random().toString(),
      text,
      x,
      y,
      color,
      alpha: 1,
      createdAt: Date.now(),
    });
  }, []);

  const tEngine = useCallback(
    (zhHk: string, en: string, ja: string, zhCn?: string) => {
      if (language === 'en') return en;
      if (language === 'ja') return ja;
      if (language === 'zh-CN') return zhCn || zhHk;
      return zhHk;
    },
    [language]
  );

  const spawnParticles = useCallback((gx: number, gy: number, color: string, count: number = 8) => {
    const actualCount = batterySaverEnabled ? Math.max(2, Math.floor(count * 0.35)) : count;
    const newParticles: Particle[] = [];
    for (let i = 0; i < actualCount; i++) {
      const angle = (Math.PI * 2 * i) / actualCount + (Math.random() - 0.5) * 0.5;
      const speed = 1.5 + Math.random() * 2.5;
      newParticles.push({
        x: gx,
        y: gy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 2.5 + Math.random() * 3,
        alpha: 1,
        life: 1,
      });
    }
    fxRef.current.particles.push(...newParticles);
  }, [batterySaverEnabled]);

  // Generate random empty position
  const getRandomFreeTile = useCallback(
    (occupied: Point[]): Point => {
      let pt: Point;
      let collision = true;
      let attempts = 0;

      while (collision && attempts < 200) {
        attempts++;
        pt = {
          x: Math.floor(Math.random() * GRID_COLS),
          y: Math.floor(Math.random() * GRID_ROWS),
        };
        collision = occupied.some((p) => p.x === pt.x && p.y === pt.y);
        if (!collision) return pt;
      }
      return { x: 5, y: 5 };
    },
    []
  );

  // Spawn regular or special apple
  const spawnFood = useCallback(
    (currentSnake: Point[], currentObstacles: Point[], currentFoods: FoodItem[]) => {
      const activeMission = modeRef.current === 'LEVELS' ? currentLevelRef.current : undefined;
      const occupied = [
        ...currentSnake,
        ...currentObstacles,
        ...(activeMission?.hasPortals && activeMission.portals ? activeMission.portals : []),
        ...rovingSnakesRef.current.flatMap((rs) => rs.body),
        ...currentFoods.map((f) => f.position),
      ];
      const pos = getRandomFreeTile(occupied);

      const activeMode = modeRef.current;
      const activeLevel = currentLevelRef.current;

      // Default values
      let type: FoodItem['type'] = 'NORMAL';
      let points = 10;
      let coins = 0;
      let duration: number | undefined;

      // In LEVELS mode, intelligently spawn targeted apples
      if (activeMode === 'LEVELS' && activeLevel) {
        const targets = activeLevel.targets;
        const prog = levelProgressRef.current;
        const candidates: FoodItem['type'][] = [];

        // 1. Explicit target items
        if (targets.blue !== undefined && prog.blue < targets.blue) {
          candidates.push('BLUE', 'BLUE', 'BLUE');
          if (!currentFoods.some((f) => f.type === 'BLUE')) {
            candidates.push('BLUE', 'BLUE', 'BLUE');
          }
        }
        if (targets.green !== undefined && prog.green < targets.green) {
          candidates.push('GREEN', 'GREEN', 'GREEN');
          if (!currentFoods.some((f) => f.type === 'GREEN')) {
            candidates.push('GREEN', 'GREEN', 'GREEN');
          }
        }
        if (targets.golden !== undefined && prog.golden < targets.golden && !currentFoods.some((f) => f.type === 'GOLDEN')) {
          candidates.push('GOLDEN', 'GOLDEN');
        }
        if (targets.normal !== undefined && prog.normal < targets.normal) {
          candidates.push('NORMAL', 'NORMAL');
        }
        if (
          (targets.chili !== undefined && prog.chili < targets.chili) ||
          ((activeLevel.gimmick === 'CHILI' || targets.chili !== undefined) && !currentFoods.some((f) => f.type === 'CHILI'))
        ) {
          candidates.push('CHILI');
        }
        if (
          (targets.magnet !== undefined && prog.magnet < targets.magnet) ||
          ((activeLevel.gimmick === 'MAGNET' || targets.magnet !== undefined) && !currentFoods.some((f) => f.type === 'MAGNET'))
        ) {
          candidates.push('MAGNET');
        }
        if (
          (targets.dragonEgg !== undefined && prog.dragonEgg < targets.dragonEgg) ||
          ((activeLevel.gimmick === 'DRAGON_EGG' || targets.dragonEgg !== undefined) && !currentFoods.some((f) => f.type === 'DRAGON_EGG'))
        ) {
          candidates.push('DRAGON_EGG');
        }
        if (
          (targets.rainbow !== undefined && prog.rainbow < targets.rainbow) ||
          ((activeLevel.gimmick === 'RAINBOW' || targets.rainbow !== undefined) && !currentFoods.some((f) => f.type === 'RAINBOW'))
        ) {
          candidates.push('RAINBOW');
        }
        if (
          (targets.lightning !== undefined && prog.lightning < targets.lightning) ||
          ((activeLevel.gimmick === 'LIGHTNING' || targets.lightning !== undefined || activeLevel.worldId === 5) && !currentFoods.some((f) => f.type === 'LIGHTNING'))
        ) {
          candidates.push('LIGHTNING', 'LIGHTNING');
        }

        // 2. Color Sequence mechanic (RGB): ONLY if the mission explicitly targets colorSequenceCount!
        if (targets.colorSequenceCount !== undefined && targets.colorSequenceCount > 0) {
          const nextExpectedColor = activeLevel.colorSequence?.[colorSequenceIndexRef.current] || 'RED';
          if (nextExpectedColor === 'BLUE') candidates.push('BLUE', 'BLUE', 'BLUE', 'BLUE');
          else if (nextExpectedColor === 'GREEN') candidates.push('GREEN', 'GREEN', 'GREEN', 'GREEN');
          else candidates.push('NORMAL', 'NORMAL', 'NORMAL', 'NORMAL');

          // Always ensure both BLUE and GREEN are in the candidate pool if missing from field
          if (!currentFoods.some((f) => f.type === 'BLUE')) candidates.push('BLUE', 'BLUE', 'BLUE');
          if (!currentFoods.some((f) => f.type === 'GREEN')) candidates.push('GREEN', 'GREEN', 'GREEN');
        }

        // 3. Color Gates mechanic (Chameleon Snake): Ensure all gate colors are present on field
        if (activeLevel.colorGates || activeLevel.gimmick === 'COLOR_GATE') {
          if (!currentFoods.some((f) => f.type === 'BLUE')) candidates.push('BLUE', 'BLUE');
          if (!currentFoods.some((f) => f.type === 'GREEN')) candidates.push('GREEN', 'GREEN');
          candidates.push('BLUE', 'GREEN');
        }

        const bombQuota = targets.bombs ?? (activeLevel.hasBombs || activeLevel.gimmick === 'BOMB' ? 1 : 0);
        if (
          (activeLevel.hasBombs || activeLevel.gimmick === 'BOMB' || (targets.bombs !== undefined && targets.bombs > 0)) &&
          !currentFoods.some((f) => f.type === 'BOMB') &&
          (prog.bombs ?? 0) < bombQuota
        ) {
          candidates.push('BOMB', 'BOMB', 'BOMB');
        }
        if ((activeLevel.hasGhost || activeLevel.gimmick === 'GHOST') && !currentFoods.some((f) => f.type === 'GHOST')) {
          candidates.push('GHOST');
        }
        if ((activeLevel.hasReverse || activeLevel.gimmick === 'REVERSE') && !currentFoods.some((f) => f.type === 'REVERSE')) {
          candidates.push('REVERSE');
        }
        if ((activeLevel.hasFogOfWar || activeLevel.gimmick === 'FOG') && !currentFoods.some((f) => f.type === 'GLOW_BERRY')) {
          candidates.push('GLOW_BERRY', 'GLOW_BERRY');
        }
        if (
          ((targets.keys !== undefined && (prog.keys ?? 0) < targets.keys) || (activeLevel.gimmick === 'KEY_LOCK' && (prog.keys ?? 0) < (targets.keys || 2))) &&
          !currentFoods.some((f) => f.type === 'KEY')
        ) {
          candidates.push('KEY', 'KEY');
        }
        const hasShieldOnBoard = currentFoods.some((f) => f.type === 'SHIELD');
        if (targets.shield !== undefined && prog.shield < targets.shield && !hasShieldOnBoard) {
          candidates.push('SHIELD');
        }

        if (candidates.length > 0 && Math.random() < 0.88) {
          type = candidates[Math.floor(Math.random() * candidates.length)];
        } else {
          // Natural Fruit Variety: Even when no specific color is demanded,
          // spawn Blue, Green, and Golden apples as appetizing bonus delicacies (~25% chance)!
          const bonusRoll = Math.random();
          if (bonusRoll < 0.10) {
            type = 'BLUE';
          } else if (bonusRoll < 0.20) {
            type = 'GREEN';
          } else if (bonusRoll < 0.26) {
            type = 'GOLDEN';
          } else if (activeLevel.worldId === 5 && bonusRoll < 0.40) {
            type = 'LIGHTNING';
          } else {
            type = 'NORMAL';
          }
        }

        // Apply item values
        if (type === 'BLUE') {
          points = 20;
          coins = 2;
        } else if (type === 'GREEN') {
          points = 20;
          coins = 2;
        } else if (type === 'GOLDEN') {
          points = 50;
          coins = 5;
          duration = 10;
        } else if (type === 'LIGHTNING') {
          points = 35;
          coins = 5;
          duration = 10;
        } else if (type === 'SHIELD') {
          points = 25;
          coins = 3;
          duration = 8;
        } else if (type === 'CHILI') {
          points = 35;
          coins = 3;
          duration = 10;
        } else if (type === 'MAGNET') {
          points = 35;
          coins = 3;
          duration = 10;
        } else if (type === 'DRAGON_EGG') {
          points = 60;
          coins = 35;
          duration = 12;
        } else if (type === 'RAINBOW') {
          points = 45;
          coins = 5;
          duration = 10;
        } else if (type === 'BOMB') {
          points = 40;
          coins = 5;
          duration = undefined;
        } else if (type === 'GHOST') {
          points = 25;
          coins = 3;
          duration = 10;
        } else if (type === 'REVERSE') {
          points = 25;
          coins = 3;
          duration = 12;
        } else if (type === 'GLOW_BERRY') {
          points = 20;
          coins = 2;
          duration = 14;
        } else if (type === 'KEY') {
          points = 30;
          coins = 10;
          duration = undefined;
        }
      } else {
        // Arcade random spawning
        const rand = Math.random();
        if (rand < 0.10) {
          type = 'GOLDEN';
          points = 50;
          coins = 5;
          duration = 10;
        } else if (rand < 0.16) {
          type = 'SHIELD';
          points = 25;
          coins = 3;
          duration = 8;
        } else if (rand < 0.22) {
          type = 'COIN';
          points = 15;
          coins = 8;
          duration = 8;
        } else if (rand < 0.28) {
          type = 'SLOW';
          points = 20;
          coins = 2;
          duration = 8;
        } else if (rand < 0.35) {
          type = 'BLUE';
          points = 20;
          coins = 2;
        } else if (rand < 0.42) {
          type = 'GREEN';
          points = 20;
          coins = 2;
        }
      }

      const newFood: FoodItem = {
        id: Math.random().toString(),
        position: pos,
        type,
        points,
        coins,
        duration,
        maxDuration: duration,
        bombCountdown: type === 'BOMB' ? (activeLevel?.bombCountdownSeconds || 12) : undefined,
        maxBombCountdown: type === 'BOMB' ? (activeLevel?.bombCountdownSeconds || 12) : undefined,
      };

      setFoodItems((prev) => {
        let updated = [...prev, newFood];
        // Ensure at least 1 NORMAL apple exists unless mission targets only special foods
        const hasNormal = updated.some((f) => f.type === 'NORMAL');
        if (!hasNormal && type !== 'NORMAL') {
          const normalPos = getRandomFreeTile([...occupied, pos]);
          updated.push({
            id: Math.random().toString(),
            position: normalPos,
            type: 'NORMAL',
            points: 10,
            coins: 0,
          });
        }
        // In LEVELS mode or timed mode, maintain at least 3 apples on screen if targets demand multiple apples
        if (activeMode === 'LEVELS' && activeLevel && (activeLevel.targets.normal || 0) >= 8 && updated.length < 3) {
          const extraPos = getRandomFreeTile([...occupied, ...updated.map((u) => u.position)]);
          updated.push({
            id: Math.random().toString(),
            position: extraPos,
            type: 'NORMAL',
            points: 10,
            coins: 0,
          });
        }
        foodItemsRef.current = updated;
        return updated;
      });
    },
    [getRandomFreeTile]
  );

  // Atomic Game Over Trigger with explicit reason (ensures onGameOver is called strictly ONCE)
  const triggerGameOver = useCallback((reason: GameOverReason = 'OBSTACLE') => {
    // 3-second spawn grace protection: Never trigger game over during the first 3 seconds of entering/starting a level
    if (Date.now() < spawnGraceUntilRef.current) return;
    if (isGameOverRef.current) return;
    isGameOverRef.current = true;
    isPlayingRef.current = false;
    gameOverReasonRef.current = reason;
    setGameOverReason(reason);

    setIsPlaying(false);
    setIsGameOver(true);
    soundEngine.playGameOver();

    const finalScore = scoreRef.current;
    const finalCoins = coinsEarnedRef.current;
    const finalApples = applesCountRef.current;
    const currentSnakeLen = snakeRef.current.length;
    const currentProgSnapshot = {
      ...levelProgressRef.current,
      length: currentSnakeLen,
    };

    if (onGameOverRef.current) {
      onGameOverRef.current(finalScore, finalCoins, finalApples, reason, {
        levelProgress: currentProgSnapshot,
        snakeLength: currentSnakeLen,
        activeLevel: currentLevelRef.current,
        activeMode: modeRef.current || mode,
      });
    }
  }, []);

  // Check and trigger Level Clear condition in LEVELS mode
  const checkLevelCompletion = useCallback(
    (prog: typeof levelProgress, length: number, currentScore?: number, currentCoins?: number) => {
      const activeMode = modeRef.current;
      const activeLevel = currentLevelRef.current;
      if (activeMode !== 'LEVELS' || !activeLevel || isLevelClearedRef.current) return;

      const targets = activeLevel.targets;
      let allMet = true;
      if (targets.normal !== undefined && prog.normal < targets.normal) allMet = false;
      if (targets.blue !== undefined && prog.blue < targets.blue) allMet = false;
      if (targets.green !== undefined && prog.green < targets.green) allMet = false;
      if (targets.golden !== undefined && prog.golden < targets.golden) allMet = false;
      if (targets.shield !== undefined && prog.shield < targets.shield) allMet = false;
      if (targets.length !== undefined && length < targets.length) allMet = false;
      if (targets.portals !== undefined && (prog.portals ?? 0) < targets.portals) allMet = false;
      if (targets.magnet !== undefined && (prog.magnet ?? 0) < targets.magnet) allMet = false;
      if (targets.chili !== undefined && (prog.chili ?? 0) < targets.chili) allMet = false;
      if (targets.dragonEgg !== undefined && (prog.dragonEgg ?? 0) < targets.dragonEgg) allMet = false;
      if (targets.rainbow !== undefined && (prog.rainbow ?? 0) < targets.rainbow) allMet = false;
      if (targets.bombs !== undefined && (prog.bombs ?? 0) < targets.bombs) allMet = false;
      if (targets.colorSequenceCount !== undefined && (prog.colorSequenceCount ?? 0) < targets.colorSequenceCount) allMet = false;
      if (targets.keys !== undefined && (prog.keys ?? 0) < targets.keys) allMet = false;
      if (targets.lightning !== undefined && (prog.lightning ?? 0) < targets.lightning) allMet = false;
      if (targets.surviveSeconds !== undefined && (prog.surviveSeconds ?? 0) < targets.surviveSeconds) allMet = false;

      if (allMet && !isLevelClearedRef.current) {
        isLevelClearedRef.current = true;
        isPlayingRef.current = false;
        setIsPlaying(false);
        setIsLevelCleared(true);
        soundEngine.playLevelClear();
        try {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {
          // ignore
        }
        const finalScore = currentScore !== undefined ? currentScore : scoreRef.current;
        const finalCoins = currentCoins !== undefined ? currentCoins : coinsEarnedRef.current;
        if (onLevelClearedRef.current) {
          onLevelClearedRef.current(
            activeLevel.id,
            activeLevel.rewardCoins,
            finalScore,
            finalCoins
          );
        }
      }
    },
    []
  );

  // Reverse Gear action (尾巴變頭反向行駛)
  const triggerReverseGear = useCallback(() => {
    if (!isPlayingRef.current || isPausedRef.current || isGameOverRef.current) return;
    const curSnake = snakeRef.current;
    if (curSnake.length < 2) return;
    const currentObs = obstaclesRef.current.length > 0 ? obstaclesRef.current : obstacles;
    const reversed = [...curSnake].reverse();
    const newDir = getSafeReverseDirection(
      reversed,
      dirRef.current,
      currentObs,
      rovingSnakesRef.current,
      isGhostActiveRef.current
    );

    snakeRef.current = reversed;
    setSnake(reversed);
    dirRef.current = newDir;
    setDirection(newDir);
    nextDirQueue.current = [];

    soundEngine.playReverse();
    spawnParticles(reversed[0].x, reversed[0].y, '#6366f1', 16);
    addFloatingText(tEngine('⏪ 尾變蛇頭!', '⏪ Reverse Head!', '⏪ 尾頭反転!'), reversed[0].x, reversed[0].y, '#818cf8');
  }, [obstacles, addFloatingText, spawnParticles, tEngine]);

  // Unified food consumption handler (supporting both regular head bites and magnetic suction)
  const consumeFood = useCallback(
    (eaten: FoodItem, fromMagnet: boolean = false, posOverride?: Point) => {
      const pos = posOverride || eaten.position;
      const currentCombo = comboRef.current;
      const isRainbow = isRainbowActiveRef.current;
      const rainbowMultiplier = isRainbow ? 2 : 1;
      const pts = eaten.points * currentCombo * rainbowMultiplier;
      const earnedCoins = eaten.coins * rainbowMultiplier;

      // 1. Update score, coins, and apples eaten count synchronously first
      const nextScore = scoreRef.current + pts;
      const nextCoins = coinsEarnedRef.current + earnedCoins;
      const nextApples = applesCountRef.current + 1;

      scoreRef.current = nextScore;
      coinsEarnedRef.current = nextCoins;
      applesCountRef.current = nextApples;

      setScore(nextScore);
      setCoinsEarned(nextCoins);
      setApplesCount(nextApples);

      if (onAchievementProgressRef.current) {
        onAchievementProgressRef.current('first_bite', 1);
      }

      // 2. Visual and audio FX
      let particleColor = '#ef4444'; // Red Apple (🍎)
      if (eaten.type === 'BLUE') particleColor = '#3b82f6';
      if (eaten.type === 'GREEN') particleColor = '#22c55e';
      if (eaten.type === 'GOLDEN') particleColor = '#fbbf24';
      if (eaten.type === 'SHIELD') particleColor = '#38bdf8';
      if (eaten.type === 'SLOW') particleColor = '#a855f7';
      if (eaten.type === 'COIN') particleColor = '#f59e0b';
      if (eaten.type === 'CHILI') particleColor = '#f97316';
      if (eaten.type === 'MAGNET') particleColor = '#06b6d4';
      if (eaten.type === 'DRAGON_EGG') particleColor = '#e11d48';
      if (eaten.type === 'RAINBOW') particleColor = '#ec4899';
      if (eaten.type === 'BOMB') particleColor = '#ef4444';
      if (eaten.type === 'GHOST') particleColor = '#c084fc';
      if (eaten.type === 'REVERSE') particleColor = '#6366f1';
      if (eaten.type === 'GLOW_BERRY') particleColor = '#38bdf8';
      if (eaten.type === 'KEY') particleColor = '#eab308';
      if (eaten.type === 'LIGHTNING') particleColor = '#d946ef';

      spawnParticles(pos.x, pos.y, particleColor, fromMagnet ? 14 : 12);

      // 3. Item-specific power-up effects & Clean, Non-Intrusive Floating Icons
      const activeMode = modeRef.current;
      const activeLevel = currentLevelRef.current;
      const isTimedGame =
        activeMode === 'TIME_ATTACK' || (activeMode === 'LEVELS' && Boolean(activeLevel?.timeLimit));

      // Chameleon Color Gates mechanic: eating red/blue/green transforms snake body color!
      const hasColorGates = Boolean(
        (activeLevel?.colorGates && activeLevel.colorGates.length > 0) ||
        activeLevel?.gimmick === 'COLOR_GATE'
      );

      if (eaten.type === 'NORMAL') {
        soundEngine.playEat(currentCombo);
        if (hasColorGates) {
          setSnakeColor('RED');
          snakeColorRef.current = 'RED';
          addFloatingText(tEngine('🔴 變身紅蛇！可穿紅閘', '🔴 Red Snake! Pass Red Gates', '🔴 赤ヘビに変身！赤ゲート通過可', '🔴 变身红蛇！可穿红闸'), pos.x, pos.y, '#f43f5e');
        } else if (isTimedGame) {
          const cap = activeMode === 'TIME_ATTACK' ? 90 : Math.max(90, (activeLevel?.timeLimit || 60) + 20);
          setTimeLeft((t) => Math.min(t + 1, cap));
          addFloatingText('🍎 +1s ⏳', pos.x, pos.y, '#ef4444');
        } else {
          addFloatingText(`🍎 +${pts}`, pos.x, pos.y, '#ef4444');
        }
      } else if (eaten.type === 'GOLDEN') {
        soundEngine.playSpecialEat();
        if (onAchievementProgressRef.current) {
          onAchievementProgressRef.current('EAT_GOLDEN', 1);
        }
        if (isTimedGame) {
          const cap = activeMode === 'TIME_ATTACK' ? 90 : Math.max(90, (activeLevel?.timeLimit || 60) + 20);
          setTimeLeft((t) => Math.min(t + 6, cap));
          addFloatingText('🌟 +6s ⏳', pos.x, pos.y, '#fbbf24');
        } else {
          addFloatingText(`🌟 +${pts}`, pos.x, pos.y, '#fbbf24');
        }
      } else if (eaten.type === 'SHIELD') {
        soundEngine.playPowerUp();
        if (onAchievementProgressRef.current) {
          onAchievementProgressRef.current('COLLECT_SHIELD', 1);
        }
        const durationMs = 4000;
        shieldUntilRef.current = Date.now() + durationMs;
        setIsShieldActive(true);
        isShieldActiveRef.current = true;
        setPowerUpTimeLeft((prev) => ({ ...prev, shield: 4 }));
        addFloatingText('🛡️ 4s', pos.x, pos.y, '#38bdf8');
        if (shieldTimerRef.current) clearTimeout(shieldTimerRef.current);
        shieldTimerRef.current = setTimeout(() => {
          if (Date.now() >= shieldUntilRef.current && Date.now() >= reviveShieldUntilRef.current) {
            setIsShieldActive(false);
            isShieldActiveRef.current = false;
            setPowerUpTimeLeft((prev) => ({ ...prev, shield: 0 }));
          }
        }, durationMs);
      } else if (eaten.type === 'SLOW') {
        soundEngine.playPowerUp();
        const durationMs = 6000;
        slowUntilRef.current = Date.now() + durationMs;
        setIsSlowActive(true);
        isSlowActiveRef.current = true;
        setPowerUpTimeLeft((prev) => ({ ...prev, slow: 6 }));
        addFloatingText('⏳ 6s', pos.x, pos.y, '#a855f7');
        if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
        slowTimerRef.current = setTimeout(() => {
          if (Date.now() >= slowUntilRef.current) {
            setIsSlowActive(false);
            isSlowActiveRef.current = false;
            setPowerUpTimeLeft((prev) => ({ ...prev, slow: 0 }));
          }
        }, durationMs);
      } else if (eaten.type === 'COIN') {
        soundEngine.playSpecialEat();
        if (isTimedGame) {
          const cap = activeMode === 'TIME_ATTACK' ? 90 : Math.max(90, (activeLevel?.timeLimit || 60) + 20);
          setTimeLeft((t) => Math.min(t + 4, cap));
        }
        addFloatingText(`🪙 +${eaten.coins}`, pos.x, pos.y, '#f59e0b');
      } else if (eaten.type === 'BLUE') {
        soundEngine.playSpecialEat();
        if (hasColorGates) {
          setSnakeColor('BLUE');
          snakeColorRef.current = 'BLUE';
          addFloatingText(tEngine('🔵 變身藍蛇！可穿藍閘', '🔵 Blue Snake! Pass Blue Gates', '🔵 青ヘビに変身！青ゲート通過可', '🔵 变身蓝蛇！可穿蓝闸'), pos.x, pos.y, '#38bdf8');
        } else if (isTimedGame) {
          const cap = activeMode === 'TIME_ATTACK' ? 90 : Math.max(90, (activeLevel?.timeLimit || 60) + 20);
          setTimeLeft((t) => Math.min(t + 4, cap));
          addFloatingText('🔷 +4s ⏳', pos.x, pos.y, '#38bdf8');
        } else {
          addFloatingText(`🔷 +${pts}`, pos.x, pos.y, '#38bdf8');
        }
      } else if (eaten.type === 'GREEN') {
        soundEngine.playEat(currentCombo);
        if (hasColorGates) {
          setSnakeColor('GREEN');
          snakeColorRef.current = 'GREEN';
          addFloatingText(tEngine('🟢 變身青蛇！可穿綠閘', '🟢 Green Snake! Pass Green Gates', '🟢 緑ヘビに変身！緑ゲート通過可', '🟢 变身青蛇！可穿绿闸'), pos.x, pos.y, '#22c55e');
        } else if (isTimedGame) {
          const cap = activeMode === 'TIME_ATTACK' ? 90 : Math.max(90, (activeLevel?.timeLimit || 60) + 20);
          setTimeLeft((t) => Math.min(t + 4, cap));
          addFloatingText('🍏 +4s ⏳', pos.x, pos.y, '#4ade80');
        } else {
          addFloatingText(`🍏 +${pts}`, pos.x, pos.y, '#4ade80');
        }
      } else if (eaten.type === 'CHILI') {
        soundEngine.playSpecialEat();
        soundEngine.playPowerUp();
        if (isTimedGame) {
          const cap = activeMode === 'TIME_ATTACK' ? 90 : Math.max(90, (activeLevel?.timeLimit || 60) + 20);
          setTimeLeft((t) => Math.min(t + 5, cap));
        }
        const durationMs = 5000;
        fireUntilRef.current = Date.now() + durationMs;
        setIsFireActive(true);
        isFireActiveRef.current = true;
        setPowerUpTimeLeft((prev) => ({ ...prev, fire: 5 }));
        addFloatingText('🌶️ 🔥 5s', pos.x, pos.y, '#f97316');
        if (fireTimerRef.current) clearTimeout(fireTimerRef.current);
        fireTimerRef.current = setTimeout(() => {
          if (Date.now() >= fireUntilRef.current) {
            setIsFireActive(false);
            isFireActiveRef.current = false;
            setPowerUpTimeLeft((prev) => ({ ...prev, fire: 0 }));
          }
        }, durationMs);
      } else if (eaten.type === 'MAGNET') {
        soundEngine.playSpecialEat();
        if (isTimedGame) {
          const cap = activeMode === 'TIME_ATTACK' ? 90 : Math.max(90, (activeLevel?.timeLimit || 60) + 20);
          setTimeLeft((t) => Math.min(t + 5, cap));
        }
        const durationMs = 5000;
        magnetUntilRef.current = Date.now() + durationMs;
        setIsMagnetActive(true);
        isMagnetActiveRef.current = true;
        setPowerUpTimeLeft((prev) => ({ ...prev, magnet: 5 }));
        addFloatingText('🧲 5s', pos.x, pos.y, '#06b6d4');
        if (magnetTimerRef.current) clearTimeout(magnetTimerRef.current);
        magnetTimerRef.current = setTimeout(() => {
          if (Date.now() >= magnetUntilRef.current) {
            setIsMagnetActive(false);
            isMagnetActiveRef.current = false;
            setPowerUpTimeLeft((prev) => ({ ...prev, magnet: 0 }));
          }
        }, durationMs);
      } else if (eaten.type === 'DRAGON_EGG') {
        soundEngine.playSpecialEat();
        if (isTimedGame) {
          const cap = activeMode === 'TIME_ATTACK' ? 90 : Math.max(90, (activeLevel?.timeLimit || 60) + 20);
          setTimeLeft((t) => Math.min(t + 5, cap));
        }
        addFloatingText('🥚 +35 🪙', pos.x, pos.y, '#e11d48');
      } else if (eaten.type === 'LIGHTNING') {
        soundEngine.playSpecialEat();
        soundEngine.playPowerUp();
        if (isTimedGame) {
          const cap = activeMode === 'TIME_ATTACK' ? 90 : Math.max(90, (activeLevel?.timeLimit || 60) + 20);
          setTimeLeft((t) => Math.min(t + 6, cap));
        }
        const durationMs = 5000;
        lightningUntilRef.current = Date.now() + durationMs;
        setIsLightningActive(true);
        isLightningActiveRef.current = true;
        setPowerUpTimeLeft((prev) => ({ ...prev, lightning: 5 }));
        spawnParticles(pos.x, pos.y, '#d946ef', 22);
        spawnParticles(pos.x, pos.y, '#06b6d4', 18);
        addFloatingText(tEngine('⚡ 5s 電磁超頻 (超光速 + EMP癱瘓)', '⚡ 5s Overclock (Hyper-Warp + EMP)', '⚡ 5秒 超光速 (EMP麻痺)', '⚡ 5s 电磁超频 (极速 + EMP瘫痪)'), pos.x, pos.y, '#d946ef');
        if (lightningTimerRef.current) clearTimeout(lightningTimerRef.current);
        lightningTimerRef.current = setTimeout(() => {
          if (Date.now() >= lightningUntilRef.current) {
            setIsLightningActive(false);
            isLightningActiveRef.current = false;
            setPowerUpTimeLeft((prev) => ({ ...prev, lightning: 0 }));
          }
        }, durationMs);
      } else if (eaten.type === 'RAINBOW') {
        soundEngine.playRainbowFever();
        confetti({
          particleCount: 50,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#ff007f', '#ff7f00', '#ffff00', '#00ff7f', '#007fff', '#7f00ff'],
        });

        // 6 秒彩虹狂熱 (Rainbow Fever) 狀態
        const durationMs = 6000;
        rainbowUntilRef.current = Date.now() + durationMs;
        setIsRainbowActive(true);
        isRainbowActiveRef.current = true;
        setPowerUpTimeLeft((prev) => ({ ...prev, rainbow: 6 }));

        if (rainbowTimerRef.current) clearTimeout(rainbowTimerRef.current);
        rainbowTimerRef.current = setTimeout(() => {
          if (Date.now() >= rainbowUntilRef.current) {
            setIsRainbowActive(false);
            isRainbowActiveRef.current = false;
            setPowerUpTimeLeft((prev) => ({ ...prev, rainbow: 0 }));
          }
        }, durationMs);

        // 鎖定滿級 4x 連擊
        setCombo(4);
        comboRef.current = 4;

        if (isTimedGame) {
          const cap = activeMode === 'TIME_ATTACK' ? 90 : Math.max(90, (activeLevel?.timeLimit || 60) + 20);
          setTimeLeft((t) => Math.min(t + 6, cap));
          addFloatingText(tEngine('⏳ +6s 時間獎勵', '⏳ +6s Time Bonus', '⏳ +6秒 時間ボーナス', '⏳ +6s 时间奖励'), pos.x, pos.y, '#38bdf8');
        }

        // 限步關卡獎勵 +3 步數
        if (activeLevel?.gimmick === 'TURN_LIMIT' || activeLevel?.maxTurns) {
          setTurnsLeft((t) => t + 3);
          addFloatingText(tEngine('🔄 +3 轉向步數', '🔄 +3 Turns', '🔄 +3 ターン', '🔄 +3 转向步数'), pos.x, pos.y, '#f59e0b');
        }

        // 爆發 3 顆甜點雨彩蛋 (金果/金幣寶藏)
        const occupied = [
          ...snakeRef.current,
          ...obstaclesRef.current,
          ...foodItemsRef.current.map((f) => f.position),
        ];
        const bonusCandies: FoodItem[] = [];
        for (let i = 0; i < 3; i++) {
          const bPos = getRandomFreeTile(occupied);
          occupied.push(bPos);
          bonusCandies.push({
            id: Math.random().toString(),
            position: bPos,
            type: i % 2 === 0 ? 'GOLDEN' : 'COIN',
            points: 50,
            coins: 5,
            duration: 8,
            maxDuration: 8,
          });
        }
        if (bonusCandies.length > 0) {
          setFoodItems((prev) => [...prev, ...bonusCandies]);
        }

        addFloatingText(tEngine('🌈 6s 彩虹狂熱! 全場雙倍!', '🌈 6s Rainbow Fever! 2x Points!', '🌈 6秒 虹色フィーバー！2倍！', '🌈 6s 彩虹狂热! 全场双倍!'), pos.x, pos.y, '#ec4899');
        const rainbowColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#8b5cf6', '#ec4899'];
        rainbowColors.forEach((c) => spawnParticles(pos.x, pos.y, c, 5));
      } else if (eaten.type === 'BOMB') {
        soundEngine.playBombDefuse();
        if (isTimedGame) {
          const cap = activeMode === 'TIME_ATTACK' ? 90 : Math.max(90, (activeLevel?.timeLimit || 60) + 20);
          setTimeLeft((t) => Math.min(t + 6, cap));
        }
        addFloatingText(tEngine('💣 拆彈成功! +30', '💣 Defused! +30', '💣 解除成功! +30', '💣 拆弹成功! +30'), pos.x, pos.y, '#22c55e');
      } else if (eaten.type === 'GHOST') {
        soundEngine.playGhostMode();
        const durationMs = 4000;
        ghostUntilRef.current = Date.now() + durationMs;
        setIsGhostActive(true);
        isGhostActiveRef.current = true;
        setPowerUpTimeLeft((prev) => ({ ...prev, ghost: 4 }));
        addFloatingText(tEngine('👻 幽靈穿透 4s', '👻 Ghost Phase 4s', '👻 ゴースト通過 4秒', '👻 幽灵穿透 4s'), pos.x, pos.y, '#c084fc');
        if (ghostTimerRef.current) clearTimeout(ghostTimerRef.current);
        ghostTimerRef.current = setTimeout(() => {
          if (Date.now() >= ghostUntilRef.current) {
            setIsGhostActive(false);
            isGhostActiveRef.current = false;
            setPowerUpTimeLeft((prev) => ({ ...prev, ghost: 0 }));
          }
        }, durationMs);
      } else if (eaten.type === 'REVERSE') {
        soundEngine.playReverse();
        if (fromMagnet) {
          triggerReverseGear();
        }
      } else if (eaten.type === 'GLOW_BERRY') {
        soundEngine.playPowerUp();
        isFullyIlluminatedUntilRef.current = Date.now() + 6000;
        setIsFullyIlluminated(true);
        setTimeout(() => {
          if (Date.now() >= isFullyIlluminatedUntilRef.current) {
            setIsFullyIlluminated(false);
          }
        }, 6000);
        addFloatingText(tEngine('🫐 迷霧驅散 6s', '🫐 Fog Cleared 6s', '🫐 霧消散 6秒', '🫐 迷雾驱散 6s'), pos.x, pos.y, '#38bdf8');
      } else if (eaten.type === 'KEY') {
        soundEngine.playSpecialEat();
        soundEngine.playPowerUp();
        soundEngine.playCoin();
        addFloatingText(tEngine('🗝️ 秘庫鑰匙入手!', '🗝️ Vault Key Found!', '🗝️ 鍵を入手!', '🗝️ 秘库钥匙入手!'), pos.x, pos.y, '#eab308');

        // 1. 機關解鎖：震碎場上最近的 2~3 處石柱障礙物，開闢全新坦途
        const currentObs = [...obstaclesRef.current];
        if (currentObs.length > 0) {
          const sortedObs = [...currentObs].sort((a, b) => {
            const distA = Math.hypot(a.x - pos.x, a.y - pos.y);
            const distB = Math.hypot(b.x - pos.x, b.y - pos.y);
            return distA - distB;
          });
          const removeCount = Math.min(3, currentObs.length);
          const toRemove = sortedObs.slice(0, removeCount);
          const toRemoveKeys = new Set(toRemove.map((o) => `${o.x},${o.y}`));
          const remaining = currentObs.filter((o) => !toRemoveKeys.has(`${o.x},${o.y}`));
          setObstacles(remaining);
          obstaclesRef.current = remaining;

          toRemove.forEach((obs, idx) => {
            setTimeout(() => {
              spawnParticles(obs.x, obs.y, '#eab308', 16);
              spawnParticles(obs.x, obs.y, '#fef08a', 10);
              addFloatingText(tEngine('🔓 閘門開通! +15', '🔓 Gate Opened! +15', '🔓 ゲート開放! +15', '🔓 闸门开通! +15'), obs.x, obs.y, '#fbbf24');
            }, idx * 100);
          });
          setScore((s) => s + toRemove.length * 15);
        }

        // 2. 秘庫珍寶噴發：從秘庫中震出稀有寶藏（高分金果、巨龍蛋或金幣袋）
        const occupiedTiles = [
          ...snakeRef.current,
          ...obstaclesRef.current,
          ...foodItemsRef.current.map((f) => f.position),
        ];
        const vaultRoll = Math.random();
        const treasureType: FoodType = vaultRoll < 0.45 ? 'GOLDEN' : vaultRoll < 0.75 ? 'DRAGON_EGG' : 'COIN';
        const treasurePos = getRandomFreeTile(occupiedTiles);
        const treasureDuration = treasureType === 'GOLDEN' ? 12 : treasureType === 'DRAGON_EGG' ? 16 : 14;
        const newTreasure: FoodItem = {
          id: Math.random().toString(),
          position: treasurePos,
          type: treasureType,
          points: treasureType === 'DRAGON_EGG' ? 60 : treasureType === 'GOLDEN' ? 50 : 25,
          coins: treasureType === 'DRAGON_EGG' ? 35 : treasureType === 'GOLDEN' ? 5 : 8,
          duration: treasureDuration,
          maxDuration: treasureDuration,
        };
        foodItemsRef.current = [...foodItemsRef.current, newTreasure];
        setFoodItems((prev) => [...prev, newTreasure]);
        spawnParticles(treasurePos.x, treasurePos.y, '#f59e0b', 16);
        addFloatingText(
          treasureType === 'DRAGON_EGG'
            ? tEngine('🥚 秘庫巨龍蛋現世!', '🥚 Dragon Egg Unlocked!', '🥚 ドラゴンエッグ出現!', '🥚 秘库巨龙蛋现世!')
            : treasureType === 'GOLDEN'
            ? tEngine('🍏 秘庫金果現世!', '🍏 Golden Apple Unlocked!', '🍏 金リンゴ出現!', '🍏 秘库金果现世!')
            : tEngine('💰 秘庫金幣現世!', '💰 Vault Coins Unlocked!', '💰 財宝コイン出現!', '💰 秘库金币现世!'),
          treasurePos.x,
          treasurePos.y,
          '#f59e0b'
        );

        // 3. 激活 6 秒黃金開鎖大師形態（金光磁吸 + 無畏破門金鐘罩）
        const durationMs = 6000;
        keyAuraUntilRef.current = Date.now() + durationMs;
        setIsKeyAuraActive(true);
        isKeyAuraActiveRef.current = true;
        setPowerUpTimeLeft((prev) => ({ ...prev, keyAura: 6 }));
        addFloatingText(tEngine('✨ 黃金金鐘護體 6s', '✨ Golden Aegis 6s', '✨ 黄金バリア 6秒', '✨ 黄金金钟护体 6s'), pos.x, pos.y, '#facc15');

        if (keyAuraTimerRef.current) clearTimeout(keyAuraTimerRef.current);
        keyAuraTimerRef.current = setTimeout(() => {
          if (Date.now() >= keyAuraUntilRef.current) {
            setIsKeyAuraActive(false);
            isKeyAuraActiveRef.current = false;
            setPowerUpTimeLeft((prev) => ({ ...prev, keyAura: 0 }));
          }
        }, durationMs);

        // 4. 限時關卡額外獎勵時間 (+6s)
        if (isTimedGame) {
          const cap = activeMode === 'TIME_ATTACK' ? 90 : Math.max(90, (activeLevel?.timeLimit || 60) + 20);
          setTimeLeft((t) => Math.min(t + 6, cap));
          addFloatingText(tEngine('⏳ +6s 時間獎勵', '⏳ +6s Time Bonus', '⏳ +6秒 時間ボーナス', '⏳ +6s 时间奖励'), pos.x, pos.y, '#38bdf8');
        }

        // 5. 步數限制關卡額外獎勵步數 (+3步)
        if (turnsLeftRef.current < 900) {
          turnsLeftRef.current += 3;
          setTurnsLeft((t) => t + 3);
          addFloatingText(tEngine('🔄 +3 步轉向', '🔄 +3 Turns', '🔄 +3 ターン', '🔄 +3 步转向'), pos.x, pos.y, '#f59e0b');
        }
      }

      // Color sequence puzzle check
      let sequenceCycleCompleted = false;
      if (activeLevel?.colorSequence && activeLevel.colorSequence.length > 0) {
        if (eaten.type === 'RAINBOW') {
          // 彩虹波波糖作為萬能萬用卡 (Wildcard)，自動推進順序
          const nextIdx = colorSequenceIndexRef.current + 1;
          if (nextIdx >= activeLevel.colorSequence.length) {
            colorSequenceIndexRef.current = 0;
            setColorSequenceIndex(0);
            sequenceCycleCompleted = true;
            soundEngine.playColorMatch();
            soundEngine.playPowerUp();
            addFloatingText(tEngine('🌈 萬能彩虹完成順序! +50', '🌈 Rainbow Wild Match! +50', '🌈 オールマイティ虹完成! +50', '🌈 万能彩虹完成顺序! +50'), pos.x, pos.y, '#ec4899');
          } else {
            colorSequenceIndexRef.current = nextIdx;
            setColorSequenceIndex(nextIdx);
            soundEngine.playColorMatch();
            addFloatingText(
              tEngine(
                `🌈 萬能彩虹順序 ${nextIdx}/${activeLevel.colorSequence.length}`,
                `🌈 Rainbow Sequence ${nextIdx}/${activeLevel.colorSequence.length}`,
                `🌈 虹色順序 ${nextIdx}/${activeLevel.colorSequence.length}`,
                `🌈 万能彩虹顺序 ${nextIdx}/${activeLevel.colorSequence.length}`
              ),
              pos.x,
              pos.y,
              '#ec4899'
            );
          }
        } else {
          const curColor: 'RED' | 'BLUE' | 'GREEN' | null =
            eaten.type === 'NORMAL' ? 'RED' : eaten.type === 'BLUE' ? 'BLUE' : eaten.type === 'GREEN' ? 'GREEN' : null;
          if (curColor) {
            const expected = activeLevel.colorSequence[colorSequenceIndexRef.current];
            if (curColor === expected) {
              const nextIdx = colorSequenceIndexRef.current + 1;
              if (nextIdx >= activeLevel.colorSequence.length) {
                colorSequenceIndexRef.current = 0;
                setColorSequenceIndex(0);
                sequenceCycleCompleted = true;
                soundEngine.playColorMatch();
                soundEngine.playPowerUp();
                addFloatingText(tEngine('🎯 顏色順序完成! +50', '🎯 Color Sequence Clear! +50', '🎯 カラー順序達成! +50', '🎯 颜色顺序完成! +50'), pos.x, pos.y, '#d946ef');
              } else {
                colorSequenceIndexRef.current = nextIdx;
                setColorSequenceIndex(nextIdx);
                soundEngine.playColorMatch();
                addFloatingText(
                  tEngine(
                    `✨ 順序 ${nextIdx}/${activeLevel.colorSequence.length}`,
                    `✨ Order ${nextIdx}/${activeLevel.colorSequence.length}`,
                    `✨ 順序 ${nextIdx}/${activeLevel.colorSequence.length}`,
                    `✨ 顺序 ${nextIdx}/${activeLevel.colorSequence.length}`
                  ),
                  pos.x,
                  pos.y,
                  '#a855f7'
                );
              }
            } else {
              colorSequenceIndexRef.current = 0;
              setColorSequenceIndex(0);
              soundEngine.playColorMismatch();
              addFloatingText(tEngine('❌ 順序重置', '❌ Sequence Reset', '❌ 順序リセット', '❌ 顺序重置'), pos.x, pos.y, '#f43f5e');
            }
          }
        }
      }

      // 4. Snake growth
      let targetLen = snakeRef.current.length;
      if (fromMagnet) {
        const curSnake = snakeRef.current;
        const tailSeg = curSnake[curSnake.length - 1] || { x: 10, y: 15 };
        const grownSnake = [...curSnake, { ...tailSeg }];
        snakeRef.current = grownSnake;
        setSnake(grownSnake);
        targetLen = grownSnake.length;
        if (onAchievementProgressRef.current) {
          onAchievementProgressRef.current('length_20', grownSnake.length);
          onAchievementProgressRef.current('length_40', grownSnake.length);
          onAchievementProgressRef.current('t2_length_55', grownSnake.length);
          onAchievementProgressRef.current('t2_length_70', grownSnake.length);
          onAchievementProgressRef.current('t3_length_85', grownSnake.length);
          onAchievementProgressRef.current('t3_length_100', grownSnake.length);
          onAchievementProgressRef.current('t4_length_120', grownSnake.length);
          onAchievementProgressRef.current('SNAKE_LENGTH', grownSnake.length);
        }
      } else {
        targetLen = snakeRef.current.length + 1;
      }

      // 5. Update level progress in LEVELS mode (guaranteed counting towards level targets)
      if (activeMode === 'LEVELS' && activeLevel) {
        const prevProg = levelProgressRef.current;
        const nextProg = {
          ...prevProg,
          normal: prevProg.normal + (eaten.type === 'NORMAL' ? 1 : 0),
          blue: prevProg.blue + (eaten.type === 'BLUE' ? 1 : 0),
          green: prevProg.green + (eaten.type === 'GREEN' ? 1 : 0),
          golden: prevProg.golden + (eaten.type === 'GOLDEN' ? 1 : 0),
          shield: prevProg.shield + (eaten.type === 'SHIELD' ? 1 : 0),
          magnet: prevProg.magnet + (eaten.type === 'MAGNET' ? 1 : 0),
          chili: prevProg.chili + (eaten.type === 'CHILI' ? 1 : 0),
          dragonEgg: prevProg.dragonEgg + (eaten.type === 'DRAGON_EGG' ? 1 : 0),
          rainbow: prevProg.rainbow + (eaten.type === 'RAINBOW' ? 1 : 0),
          bombs: (prevProg.bombs || 0) + (eaten.type === 'BOMB' ? 1 : 0),
          colorSequenceCount: (prevProg.colorSequenceCount || 0) + (sequenceCycleCompleted ? 1 : 0),
          keys: (prevProg.keys || 0) + (eaten.type === 'KEY' ? 1 : 0),
          lightning: (prevProg.lightning || 0) + (eaten.type === 'LIGHTNING' ? 1 : 0),
          length: targetLen,
        };
        levelProgressRef.current = nextProg;
        setLevelProgress(nextProg);
        checkLevelCompletion(nextProg, targetLen, scoreRef.current, coinsEarnedRef.current);
      }

      // 6. Combo tracking (保持彩虹糖及彩虹狂熱期間直接拉滿4倍連擊不被覆蓋)
      if (eaten.type !== 'RAINBOW' && !isRainbowActiveRef.current) {
        setCombo((prevC) => {
          const nextC = Math.min(prevC + 1, 4);
          comboRef.current = nextC;
          if (nextC >= 3 && onAchievementProgressRef.current) {
            onAchievementProgressRef.current('combo_master', 1);
          }
          if (nextC >= 4 && onAchievementProgressRef.current) {
            onAchievementProgressRef.current('t2_combo_4x', 1);
          }
          return nextC;
        });
      }
      setComboTimer(100);
      if (comboTimeoutRef.current) clearTimeout(comboTimeoutRef.current);
      comboTimeoutRef.current = setTimeout(() => {
        if (!isRainbowActiveRef.current) {
          setCombo(1);
          comboRef.current = 1;
          setComboTimer(0);
        }
      }, 3500);

      // 7. Remove eaten food item and spawn replacement
      const remainingFoods = foodItemsRef.current.filter((f) => f.id !== eaten.id);
      foodItemsRef.current = remainingFoods;
      setFoodItems(remainingFoods);

      const currentObstacles = obstaclesRef.current;
      spawnFood(snakeRef.current, currentObstacles, remainingFoods);
    },
    [checkLevelCompletion, spawnFood, spawnParticles, addFloatingText]
  );

  // Initialize game
  const startGame = useCallback((overrideMode?: GameMode, overrideLevel?: LevelMission) => {
    soundEngine.playClick();
    const activeMode = overrideMode || modeRef.current || mode;
    const activeLevel =
      activeMode === 'LEVELS'
        ? (overrideLevel !== undefined
            ? overrideLevel
            : currentLevelRef.current || currentLevel)
        : undefined;

    modeRef.current = activeMode;
    currentLevelRef.current = activeLevel;

    const initSnake = [...INITIAL_SNAKE];
    setSnake(initSnake);
    snakeRef.current = initSnake;
    setDirection('UP');
    dirRef.current = 'UP';
    nextDirQueue.current = [];

    setScore(0);
    setCoinsEarned(0);
    setApplesCount(0);
    scoreRef.current = 0;
    coinsEarnedRef.current = 0;
    applesCountRef.current = 0;
    isGameOverRef.current = false;
    setIsGameOver(false);

    setCombo(1);
    comboRef.current = 1;
    setComboTimer(0);

    // 3-second spawn grace protection against accidental opening roving snake collision
    spawnGraceUntilRef.current = Date.now() + 3000;
    gameOverReasonRef.current = null;
    setGameOverReason(null);

    // Timer
    if (activeMode === 'TIME_ATTACK') {
      setTimeLeft(60);
    } else if (activeMode === 'LEVELS' && activeLevel?.timeLimit) {
      setTimeLeft(activeLevel.timeLimit);
    } else {
      setTimeLeft(0);
    }

    setIsShieldActive(false);
    setIsSlowActive(false);
    setIsMagnetActive(false);
    setIsFireActive(false);
    setIsGhostActive(false);
    setIsRainbowActive(false);
    isRainbowActiveRef.current = false;
    rainbowUntilRef.current = 0;
    if (rainbowTimerRef.current) {
      clearTimeout(rainbowTimerRef.current);
      rainbowTimerRef.current = null;
    }
    setIsSlidingOnIce(false);
    setIsFullyIlluminated(false);
    setSnakeColor('NORMAL');
    setColorSequenceIndex(0);
    const initialTurns = activeLevel?.maxTurns ?? (activeLevel?.gimmick === 'TURN_LIMIT' ? 26 : 999);
    setTurnsLeft(initialTurns);
    setPowerUpTimeLeft({ shield: 0, slow: 0, fire: 0, magnet: 0, ghost: 0, keyAura: 0, rainbow: 0 });
    isShieldActiveRef.current = false;
    isSlowActiveRef.current = false;
    isMagnetActiveRef.current = false;
    isFireActiveRef.current = false;
    isGhostActiveRef.current = false;
    isRainbowActiveRef.current = false;
    setIsRainbowActive(false);
    rainbowUntilRef.current = 0;
    if (rainbowTimerRef.current) {
      clearTimeout(rainbowTimerRef.current);
      rainbowTimerRef.current = null;
    }
    isKeyAuraActiveRef.current = false;
    setIsKeyAuraActive(false);
    keyAuraUntilRef.current = 0;
    if (keyAuraTimerRef.current) {
      clearTimeout(keyAuraTimerRef.current);
      keyAuraTimerRef.current = null;
    }
    isSlidingOnIceRef.current = false;
    snakeColorRef.current = 'NORMAL';
    colorSequenceIndexRef.current = 0;
    turnsLeftRef.current = initialTurns;
    isFullyIlluminatedUntilRef.current = 0;
    lastBombTickRef.current = Date.now();
    reviveShieldUntilRef.current = 0;
    shieldUntilRef.current = 0;
    if (shieldTimerRef.current) {
      clearTimeout(shieldTimerRef.current);
      shieldTimerRef.current = null;
    }
    if (ghostTimerRef.current) {
      clearTimeout(ghostTimerRef.current);
      ghostTimerRef.current = null;
    }
    ghostUntilRef.current = 0;
    fireUntilRef.current = 0;
    if (fireTimerRef.current) {
      clearTimeout(fireTimerRef.current);
      fireTimerRef.current = null;
    }
    magnetUntilRef.current = 0;
    if (magnetTimerRef.current) {
      clearTimeout(magnetTimerRef.current);
      magnetTimerRef.current = null;
    }
    slowUntilRef.current = 0;
    if (slowTimerRef.current) {
      clearTimeout(slowTimerRef.current);
      slowTimerRef.current = null;
    }
    setIsLevelCleared(false);
    isLevelClearedRef.current = false;

    // Reset revives limit for this session (任務闖關每局只可復活一次)
    setRevivesUsed(0);
    revivesUsedRef.current = 0;

    // Reset level mission progress
    const initialProg = {
      normal: 0,
      blue: 0,
      green: 0,
      golden: 0,
      shield: 0,
      length: 4,
      portals: 0,
      magnet: 0,
      chili: 0,
      dragonEgg: 0,
      rainbow: 0,
      bombs: 0,
      colorSequenceCount: 0,
      keys: 0,
      lightning: 0,
      surviveSeconds: 0,
    };
    setLevelProgress(initialProg);
    levelProgressRef.current = initialProg;

    // Obstacles (Strictly sanitized to never clash with portals)
    let obs: Point[] = [];
    if (activeMode === 'LEVELS' && activeLevel?.hasObstacles) {
      obs = generateObstacles(activeLevel.hasObstacles, activeLevel.obstacleType, activeLevel.portals);
    }
    if (activeLevel?.portals && activeLevel.portals.length > 0) {
      obs = obs.filter((o) => !activeLevel.portals!.some((p) => p.x === o.x && p.y === o.y));
    }
    setObstacles(obs);
    obstaclesRef.current = obs;

    // Roving Enemy Snakes (阻礙蛇)
    let roving: RovingSnake[] = [];
    if (activeMode === 'LEVELS' && (activeLevel?.rovingSnakesCount || 0) > 0) {
      let rovingCount = activeLevel?.rovingSnakesCount || 0;
      // 每逢第20關的boss關，如果有三條巡邏蛇，將佢變兩條蛇
      if (activeLevel && activeLevel.id % 20 === 0 && (activeLevel.isBossLevel || activeLevel.gimmick === 'BOSS') && rovingCount === 3) {
        rovingCount = 2;
      }
      roving = generateRovingSnakes(
        rovingCount,
        activeLevel?.rovingSnakeSpeed || 'SLOW',
        obs
      );
    }
    setRovingSnakes(roving);
    rovingSnakesRef.current = roving;

    // Initial Foods (Guaranteed to never occupy portal positions)
    const occupied = [
      ...initSnake,
      ...obs,
      ...(activeLevel?.hasPortals && activeLevel.portals ? activeLevel.portals : []),
    ];
    const initialFoods: FoodItem[] = [];

    // Primary normal red apple
    const firstPos = getRandomFreeTile(occupied);
    occupied.push(firstPos);
    initialFoods.push({
      id: Math.random().toString(),
      position: firstPos,
      type: 'NORMAL',
      points: 10,
      coins: 0,
    });

    // In levels with multiple normal targets or timed mode, spawn 1-2 extra normal apples to start smoothly
    if (activeMode === 'LEVELS' && activeLevel && (activeLevel.targets.normal || 0) >= 6) {
      const extra1 = getRandomFreeTile(occupied);
      occupied.push(extra1);
      initialFoods.push({
        id: Math.random().toString(),
        position: extra1,
        type: 'NORMAL',
        points: 10,
        coins: 0,
      });
      const extra2 = getRandomFreeTile(occupied);
      occupied.push(extra2);
      initialFoods.push({
        id: Math.random().toString(),
        position: extra2,
        type: 'NORMAL',
        points: 10,
        coins: 0,
      });
    }

    // If LEVELS mode targets blue, green, or golden, or needs them for color sequence / gates, spawn them right away!
    if (activeMode === 'LEVELS' && activeLevel) {
      const needsBlue =
        Boolean(activeLevel.targets.blue) ||
        Boolean((activeLevel.targets.colorSequenceCount ?? 0) > 0) ||
        Boolean(activeLevel.colorGates) ||
        activeLevel.gimmick === 'COLOR_GATE';

      const needsGreen =
        Boolean(activeLevel.targets.green) ||
        Boolean((activeLevel.targets.colorSequenceCount ?? 0) > 0) ||
        Boolean(activeLevel.colorGates) ||
        activeLevel.gimmick === 'COLOR_GATE';

      if (needsBlue) {
        const bluePos = getRandomFreeTile(occupied);
        occupied.push(bluePos);
        initialFoods.push({
          id: Math.random().toString(),
          position: bluePos,
          type: 'BLUE',
          points: 20,
          coins: 2,
        });
      }
      if (needsGreen) {
        const greenPos = getRandomFreeTile(occupied);
        occupied.push(greenPos);
        initialFoods.push({
          id: Math.random().toString(),
          position: greenPos,
          type: 'GREEN',
          points: 20,
          coins: 2,
        });
      }
      if (activeLevel.targets.golden && !activeLevel.targets.blue && !activeLevel.targets.green) {
        const goldPos = getRandomFreeTile(occupied);
        occupied.push(goldPos);
        initialFoods.push({
          id: Math.random().toString(),
          position: goldPos,
          type: 'GOLDEN',
          points: 50,
          coins: 5,
          duration: 10,
        });
      }
      if (activeLevel.targets.shield && !activeLevel.targets.blue && !activeLevel.targets.green) {
        const shieldPos = getRandomFreeTile(occupied);
        occupied.push(shieldPos);
        initialFoods.push({
          id: Math.random().toString(),
          position: shieldPos,
          type: 'SHIELD',
          points: 25,
          coins: 3,
          duration: 14,
          maxDuration: 14,
        });
      }
      if (activeLevel.targets.chili || activeLevel.gimmick === 'CHILI') {
        const chiliPos = getRandomFreeTile(occupied);
        occupied.push(chiliPos);
        initialFoods.push({
          id: Math.random().toString(),
          position: chiliPos,
          type: 'CHILI',
          points: 35,
          coins: 3,
          duration: 15,
          maxDuration: 15,
        });
      }
      if (activeLevel.targets.magnet || activeLevel.gimmick === 'MAGNET') {
        const magnetPos = getRandomFreeTile(occupied);
        occupied.push(magnetPos);
        initialFoods.push({
          id: Math.random().toString(),
          position: magnetPos,
          type: 'MAGNET',
          points: 35,
          coins: 3,
          duration: 15,
          maxDuration: 15,
        });
      }
      if (activeLevel.targets.dragonEgg || activeLevel.gimmick === 'DRAGON_EGG') {
        const eggPos = getRandomFreeTile(occupied);
        occupied.push(eggPos);
        initialFoods.push({
          id: Math.random().toString(),
          position: eggPos,
          type: 'DRAGON_EGG',
          points: 60,
          coins: 35,
          duration: 18,
          maxDuration: 18,
        });
      }
      if (activeLevel.targets.rainbow || activeLevel.gimmick === 'RAINBOW') {
        const rPos = getRandomFreeTile(occupied);
        occupied.push(rPos);
        initialFoods.push({
          id: Math.random().toString(),
          position: rPos,
          type: 'RAINBOW',
          points: 45,
          coins: 5,
          duration: 15,
          maxDuration: 15,
        });
      }
      if (activeLevel.hasBombs || activeLevel.gimmick === 'BOMB' || activeLevel.targets.bombs) {
        const bombPos = getRandomFreeTile(occupied);
        occupied.push(bombPos);
        initialFoods.push({
          id: Math.random().toString(),
          position: bombPos,
          type: 'BOMB',
          points: 40,
          coins: 5,
          bombCountdown: activeLevel.bombCountdownSeconds || 12,
          maxBombCountdown: activeLevel.bombCountdownSeconds || 12,
        });
      }
      if (activeLevel.hasGhost || activeLevel.gimmick === 'GHOST') {
        const ghostPos = getRandomFreeTile(occupied);
        occupied.push(ghostPos);
        initialFoods.push({
          id: Math.random().toString(),
          position: ghostPos,
          type: 'GHOST',
          points: 25,
          coins: 3,
          duration: 12,
          maxDuration: 12,
        });
      }
      if (activeLevel.hasReverse || activeLevel.gimmick === 'REVERSE') {
        const revPos = getRandomFreeTile(occupied);
        occupied.push(revPos);
        initialFoods.push({
          id: Math.random().toString(),
          position: revPos,
          type: 'REVERSE',
          points: 25,
          coins: 3,
          duration: 14,
          maxDuration: 14,
        });
      }
      if (activeLevel.hasFogOfWar || activeLevel.gimmick === 'FOG') {
        const berryPos = getRandomFreeTile(occupied);
        occupied.push(berryPos);
        initialFoods.push({
          id: Math.random().toString(),
          position: berryPos,
          type: 'GLOW_BERRY',
          points: 20,
          coins: 2,
          duration: 16,
          maxDuration: 16,
        });
      }
      if (activeLevel.targets.keys || activeLevel.gimmick === 'KEY_LOCK') {
        const keyPos = getRandomFreeTile(occupied);
        occupied.push(keyPos);
        initialFoods.push({
          id: Math.random().toString(),
          position: keyPos,
          type: 'KEY',
          points: 30,
          coins: 10,
        });
      }
    }

    setFoodItems(initialFoods);
    foodItemsRef.current = initialFoods;
    fxRef.current.particles = [];
    fxRef.current.floatingTexts = [];
    isPausedRef.current = false;
    isPlayingRef.current = true;
    isGameOverRef.current = false;
    isLevelClearedRef.current = false;
    setIsGameOver(false);
    setIsPaused(false);
    setIsPlaying(true);
  }, [mode, currentLevel, getRandomFreeTile]);

  // Steer snake
  const changeDirection = useCallback((newDir: Direction) => {
    // If currently sliding on ice, turning is not allowed until sliding off ice
    if (isSlidingOnIceRef.current) {
      return;
    }

    const opposites: Record<Direction, Direction> = {
      UP: 'DOWN',
      DOWN: 'UP',
      LEFT: 'RIGHT',
      RIGHT: 'LEFT',
    };

    const currentOrLastQueued =
      nextDirQueue.current.length > 0
        ? nextDirQueue.current[nextDirQueue.current.length - 1]
        : dirRef.current;

    if (newDir !== currentOrLastQueued && newDir !== opposites[currentOrLastQueued]) {
      if (nextDirQueue.current.length < 2) {
        nextDirQueue.current.push(newDir);
      } else {
        // Player quickly changed their mind: update the latest queued turn so latest input is never lost!
        nextDirQueue.current[nextDirQueue.current.length - 1] = newDir;
      }
      soundEngine.playTurn();

      // 6. Turn limit mechanic: Decrement turnsLeft
      const activeLevel = currentLevelRef.current;
      if (activeLevel?.maxTurns || activeLevel?.gimmick === 'TURN_LIMIT') {
        turnsLeftRef.current = Math.max(0, turnsLeftRef.current - 1);
        setTurnsLeft(turnsLeftRef.current);
        if (turnsLeftRef.current <= 0) {
          // Check if level mission is not already met
          if (!isLevelClearedRef.current) {
            triggerGameOver('OUT_OF_TURNS');
          }
        }
      }
    }
  }, [triggerGameOver]);

  const pauseGame = useCallback((explicitPause?: boolean) => {
    soundEngine.playClick();
    setIsPaused((p) => {
      const next = typeof explicitPause === 'boolean' ? explicitPause : !p;
      isPausedRef.current = next;
      return next;
    });
  }, []);

  // Stop active game session completely (prevents background loop & delayed triggers)
  const stopGame = useCallback(() => {
    isPlayingRef.current = false;
    isPausedRef.current = false;
    isGameOverRef.current = false;
    isLevelClearedRef.current = false;
    setIsPlaying(false);
    setIsPaused(false);
    setIsLevelCleared(false);
    setIsGameOver(false);
    setGameOverReason(null);
    gameOverReasonRef.current = null;
    setIsShieldActive(false);
    setIsSlowActive(false);
    setIsMagnetActive(false);
    setIsFireActive(false);
    setIsGhostActive(false);
    isGhostActiveRef.current = false;
    ghostUntilRef.current = 0;
    if (ghostTimerRef.current) {
      clearTimeout(ghostTimerRef.current);
      ghostTimerRef.current = null;
    }
    if (comboTimeoutRef.current) {
      clearTimeout(comboTimeoutRef.current);
      comboTimeoutRef.current = null;
    }
    setSnakeColor('NORMAL');
    snakeColorRef.current = 'NORMAL';
    setColorSequenceIndex(0);
    colorSequenceIndexRef.current = 0;
    setTurnsLeft(999);
    turnsLeftRef.current = 999;
    setIsSlidingOnIce(false);
    isSlidingOnIceRef.current = false;
    setIsFullyIlluminated(false);
    isFullyIlluminatedUntilRef.current = 0;
    setIsRainbowActive(false);
    isRainbowActiveRef.current = false;
    rainbowUntilRef.current = 0;
    if (rainbowTimerRef.current) {
      clearTimeout(rainbowTimerRef.current);
      rainbowTimerRef.current = null;
    }
    setIsLightningActive(false);
    isLightningActiveRef.current = false;
    lightningUntilRef.current = 0;
    if (lightningTimerRef.current) {
      clearTimeout(lightningTimerRef.current);
      lightningTimerRef.current = null;
    }
    setPowerUpTimeLeft({ shield: 0, slow: 0, fire: 0, magnet: 0, ghost: 0, keyAura: 0, rainbow: 0, lightning: 0 });
    isShieldActiveRef.current = false;
    isSlowActiveRef.current = false;
    isMagnetActiveRef.current = false;
    isFireActiveRef.current = false;
    isKeyAuraActiveRef.current = false;
    setIsKeyAuraActive(false);
    keyAuraUntilRef.current = 0;
    if (keyAuraTimerRef.current) {
      clearTimeout(keyAuraTimerRef.current);
      keyAuraTimerRef.current = null;
    }
    if (shieldTimerRef.current) { clearTimeout(shieldTimerRef.current); shieldTimerRef.current = null; }
    if (fireTimerRef.current) { clearTimeout(fireTimerRef.current); fireTimerRef.current = null; }
    if (magnetTimerRef.current) { clearTimeout(magnetTimerRef.current); magnetTimerRef.current = null; }
    if (slowTimerRef.current) { clearTimeout(slowTimerRef.current); slowTimerRef.current = null; }
    fireUntilRef.current = 0;
    magnetUntilRef.current = 0;
    slowUntilRef.current = 0;
    shieldUntilRef.current = 0;
    setObstacles([]);
    obstaclesRef.current = [];
    setRovingSnakes([]);
    rovingSnakesRef.current = [];
    setFoodItems([]);
    foodItemsRef.current = [];
    fxRef.current.particles = [];
    fxRef.current.floatingTexts = [];
    nextDirQueue.current = [];
    setRevivesUsed(0);
    revivesUsedRef.current = 0;
    setTimeLeft(0);
    // CRITICAL: Cleanly reset snake and direction to INITIAL_SNAKE so previous level snake is never frozen on screen
    const initSnake = [...INITIAL_SNAKE];
    setSnake(initSnake);
    snakeRef.current = initSnake;
    setDirection('UP');
    dirRef.current = 'UP';
    setScore(0);
    scoreRef.current = 0;
  }, []);

  // Revive snake on the spot: keeps exact position, length, and eaten fruits/progress
  // 原位復活只限[任務闖關] (LEVELS)，且只可復活一次
  const reviveSnake = useCallback(() => {
    // 嚴格限制：只限任務闖關 (LEVELS)，且每局最多復活一次
    if (modeRef.current !== 'LEVELS' || revivesUsedRef.current >= 1) {
      return;
    }

    setRevivesUsed((prev) => prev + 1);
    revivesUsedRef.current += 1;

    // 復活後金幣重新由 0 計算（因死亡結算時已將上一段累積金幣派發入帳，不應重覆給玩家）
    setCoinsEarned(0);
    coinsEarnedRef.current = 0;

    // 保持輸掉時的原位所有蛇身座標、蛇長度、已食的蘋果數量與關卡進度完全不變
    const currentSnake = [...snakeRef.current];
    setSnake(currentSnake);
    snakeRef.current = currentSnake;

    // 頭部位置
    const head = currentSnake[0] || { x: 10, y: 14 };

    // 若原方向會立即撞牆或撞障礙物，智慧轉向安全正交方向，避免玩家剛復活第一步撞牆
    let safeDir = dirRef.current;
    const dirDeltas: Record<Direction, Point> = {
      UP: { x: 0, y: -1 },
      DOWN: { x: 0, y: 1 },
      LEFT: { x: -1, y: 0 },
      RIGHT: { x: 1, y: 0 },
    };
    const currentObstacles = obstaclesRef.current.length > 0 ? obstaclesRef.current : obstacles;
    const nextX = head.x + dirDeltas[safeDir].x;
    const nextY = head.y + dirDeltas[safeDir].y;
    const willImmediatelyHit =
      nextX < 0 ||
      nextX >= GRID_COLS ||
      nextY < 0 ||
      nextY >= GRID_ROWS ||
      currentObstacles.some((o) => o.x === nextX && o.y === nextY);

    if (willImmediatelyHit) {
      const safe = getSafeWallTurn(head, safeDir, currentObstacles);
      safeDir = safe.dir;
    }

    setDirection(safeDir);
    dirRef.current = safeDir;
    nextDirQueue.current = [];

    // 4 秒無敵護盾保護（原位復活無敵時間）
    reviveShieldUntilRef.current = Date.now() + 4000;
    setIsShieldActive(true);
    isShieldActiveRef.current = true;
    setTimeout(() => {
      if (Date.now() >= reviveShieldUntilRef.current && Date.now() >= shieldUntilRef.current) {
        setIsShieldActive(false);
        isShieldActiveRef.current = false;
      }
    }, 4000);

    // Push any roving snake that is dangerously close to revived head away
    setRovingSnakes((prev) =>
      prev.map((rs) => {
        const rHead = rs.body[0];
        const dist = Math.hypot(rHead.x - head.x, rHead.y - head.y);
        if (dist < 3) {
          const shiftX = rHead.x < head.x ? -3 : 3;
          const shiftY = rHead.y < head.y ? -3 : 3;
          const shiftedBody = rs.body.map((b) => ({
            x: Math.max(1, Math.min(GRID_COLS - 2, b.x + shiftX)),
            y: Math.max(1, Math.min(GRID_ROWS - 2, b.y + shiftY)),
          }));
          return { ...rs, body: shiftedBody };
        }
        return rs;
      })
    );

    // 倒計時關卡復活只加10秒（若逾時死亡或於倒計時途中死亡，均加 10 秒）
    const activeLevel = currentLevelRef.current;
    if (activeLevel?.timeLimit) {
      const cap = Math.max(90, (activeLevel.timeLimit || 60) + 20);
      setTimeLeft((prev) => Math.min(Math.max(0, prev) + 10, cap));
      addFloatingText('⏳ +10s', head.x, Math.max(0, head.y - 2), '#f59e0b');
    }

    // If turn limit in turn-restricted LEVELS mission, grant an extra 20 turns (轉向關卡復活加20次轉向)
    if (activeLevel?.maxTurns || activeLevel?.gimmick === 'TURN_LIMIT') {
      const currentRemaining = Math.max(0, turnsLeftRef.current !== 999 ? (turnsLeftRef.current || 0) : 0);
      const updatedTurns = currentRemaining + 20;
      turnsLeftRef.current = updatedTurns;
      setTurnsLeft(updatedTurns);
      addFloatingText('🔄 +20', head.x, Math.max(0, head.y - 2), '#38bdf8');
    }

    // 只有因炸彈爆炸而死 (BOMB_EXPLODED)，復活後才需要將炸彈重新倒數 10 秒
    // 如果不是因為炸彈而死，絕對不額外加 10 秒炸彈
    if (gameOverReasonRef.current === 'BOMB_EXPLODED') {
      setFoodItems((prev) => {
        let bombCount = 0;
        const updated = prev.map((f) => {
          if (f.type === 'BOMB') {
            bombCount++;
            return {
              ...f,
              bombCountdown: 10,
              maxBombCountdown: 10,
            };
          }
          return f;
        });

        // 若因炸彈爆炸而場上缺少炸彈，補放一顆 10 秒炸彈供玩家拆除
        if (bombCount === 0) {
          const occupied = [
            ...snakeRef.current,
            ...obstaclesRef.current,
            ...updated.map((f) => f.position),
          ];
          const bombPos = getRandomFreeTile(occupied);
          updated.push({
            id: Math.random().toString(),
            position: bombPos,
            type: 'BOMB',
            points: 40,
            coins: 5,
            bombCountdown: 10,
            maxBombCountdown: 10,
          });
        }

        foodItemsRef.current = updated;

        // 為重置的炸彈顯示「💣 10s」提示
        updated.forEach((f) => {
          if (f.type === 'BOMB') {
            addFloatingText('💣 10s', f.position.x, Math.max(0, f.position.y - 1), '#ef4444');
          }
        });

        return updated;
      });

      lastBombTickRef.current = Date.now();
    }

    addFloatingText('✨ 🛡️', head.x, Math.max(0, head.y - 1), '#fbbf24');
    spawnParticles(head.x, head.y, '#fbbf24', 16);
    soundEngine.playPowerUp();

    setIsGameOver(false);
    isGameOverRef.current = false;
    setGameOverReason(null);
    gameOverReasonRef.current = null;
    setIsPaused(false);
    setIsPlaying(true);
    isPlayingRef.current = true;
  }, [obstacles, addFloatingText, spawnParticles, getRandomFreeTile]);

  // Main game tick
  const updateGame = useCallback(() => {
    if (!isPlayingRef.current || isPausedRef.current) return;

    // Apply next queued direction
    if (nextDirQueue.current.length > 0) {
      const next = nextDirQueue.current.shift()!;
      dirRef.current = next;
      setDirection(next);
    }

    const currentHead = snakeRef.current[0];
    let curDir = dirRef.current;
    let nextHead: Point = { ...currentHead };

    switch (curDir) {
      case 'UP':
        nextHead.y -= 1;
        break;
      case 'DOWN':
        nextHead.y += 1;
        break;
      case 'LEFT':
        nextHead.x -= 1;
        break;
      case 'RIGHT':
        nextHead.x += 1;
        break;
    }

    // Wall collision checks
    let collidedWithWall = false;
    if (nextHead.x < 0 || nextHead.x >= GRID_COLS || nextHead.y < 0 || nextHead.y >= GRID_ROWS) {
      if (isGhostActiveRef.current) {
        // 2. Ghost Mode (幽靈穿透): Screen edge wrap!
        nextHead.x = (nextHead.x + GRID_COLS) % GRID_COLS;
        nextHead.y = (nextHead.y + GRID_ROWS) % GRID_ROWS;
        soundEngine.playTurn();
        spawnParticles(nextHead.x, nextHead.y, '#c084fc', 8);
      } else {
        collidedWithWall = true;
      }
    }

    // Portal Warp Check (空間傳送門 - 嚴格限制僅在 LEVELS 關卡模式下生效)
    const activeMission = modeRef.current === 'LEVELS' ? currentLevelRef.current : undefined;
    if (activeMission?.hasPortals && activeMission.portals && activeMission.portals.length === 2) {
      const [pA, pB] = activeMission.portals;
      if (nextHead.x === pA.x && nextHead.y === pA.y) {
        nextHead = { x: pB.x, y: pB.y };
        soundEngine.playPowerUp();
        spawnParticles(pB.x, pB.y, '#38bdf8', 16);
        addFloatingText('🌀', pB.x, pB.y, '#38bdf8');
        setLevelProgress((prev) => {
          const nextProg = {
            ...prev,
            portals: prev.portals + 1,
          };
          levelProgressRef.current = nextProg;
          checkLevelCompletion(nextProg, snakeRef.current.length);
          return nextProg;
        });
      } else if (nextHead.x === pB.x && nextHead.y === pB.y) {
        nextHead = { x: pA.x, y: pA.y };
        soundEngine.playPowerUp();
        spawnParticles(pA.x, pA.y, '#38bdf8', 16);
        addFloatingText('🌀', pA.x, pA.y, '#38bdf8');
        setLevelProgress((prev) => {
          const nextProg = {
            ...prev,
            portals: prev.portals + 1,
          };
          levelProgressRef.current = nextProg;
          checkLevelCompletion(nextProg, snakeRef.current.length);
          return nextProg;
        });
      }
    }

    // 5. Color Gate Check
    let collidedWithColorGate = false;
    const activeColorGates = activeMission?.colorGates;
    if (activeColorGates && activeColorGates.length > 0) {
      const hitGate = activeColorGates.find((g) => g.x === nextHead.x && g.y === nextHead.y);
      if (hitGate) {
        if (isRainbowActiveRef.current) {
          // 🌈 彩虹萬能穿閘: 任何顏色閘門都直接穿過並解鎖粉碎，獎勵分數！
          soundEngine.playSpecialEat();
          soundEngine.playTurn();
          spawnParticles(hitGate.x, hitGate.y, '#ec4899', 15);
          spawnParticles(hitGate.x, hitGate.y, '#38bdf8', 10);
          spawnParticles(hitGate.x, hitGate.y, '#fbbf24', 10);
          addFloatingText(tEngine('🌈 萬能彩虹穿閘! +25', '🌈 Rainbow Gate Dash! +25', '🌈 虹色ゲートダッシュ! +25', '🌈 万能彩虹穿闸! +25'), hitGate.x, hitGate.y, '#ec4899');
          setScore((s) => s + 25);
          setCoinsEarned((c) => c + 3);
        } else if (snakeColorRef.current !== hitGate.color) {
          collidedWithColorGate = true;
        } else {
          soundEngine.playTurn();
          spawnParticles(hitGate.x, hitGate.y, hitGate.color === 'RED' ? '#f43f5e' : hitGate.color === 'BLUE' ? '#38bdf8' : '#22c55e', 8);
        }
      }
    }

    // Obstacle collision (Ghost mode can pass ordinary obstacles)
    const currentObstacles = obstaclesRef.current;
    const collidedWithObstacle = isGhostActiveRef.current
      ? false
      : currentObstacles.some((o) => o.x === nextHead.x && o.y === nextHead.y);

    // Self collision (Ghost mode can pass through own body)
    const collidedWithSelf = isGhostActiveRef.current
      ? false
      : snakeRef.current.slice(0, -1).some((seg) => seg.x === nextHead.x && seg.y === nextHead.y);

    // Roving snake collision (阻礙蛇碰撞)
    const collidedWithRoving = isGhostActiveRef.current
      ? false
      : rovingSnakesRef.current.some((rs) =>
          rs.body.some((seg) => seg.x === nextHead.x && seg.y === nextHead.y)
        );

    // Fire Cloak / Golden Key Aura obstacle smasher!
    if ((isFireActiveRef.current || isKeyAuraActiveRef.current) && collidedWithObstacle) {
      setObstacles((prev) => prev.filter((o) => !(o.x === nextHead.x && o.y === nextHead.y)));
      obstaclesRef.current = obstaclesRef.current.filter((o) => !(o.x === nextHead.x && o.y === nextHead.y));
      soundEngine.playPowerUp();
      if (isKeyAuraActiveRef.current) {
        soundEngine.playCoin();
        spawnParticles(nextHead.x, nextHead.y, '#eab308', 18);
        spawnParticles(nextHead.x, nextHead.y, '#fef08a', 10);
        addFloatingText(tEngine('🔓 破門而入! +20 🪙+5', '🔓 Gate Breached! +20 🪙+5', '🔓 扉突破! +20 🪙+5', '🔓 破门而入! +20 🪙+5'), nextHead.x, nextHead.y, '#fbbf24');
        setScore((s) => s + 20);
        setCoinsEarned((c) => c + 5);
      } else {
        spawnParticles(nextHead.x, nextHead.y, '#f97316', 16);
        addFloatingText('💥 +15', nextHead.x, nextHead.y, '#f97316');
        setScore((s) => s + 15);
        setCoinsEarned((c) => c + 3);
      }
    } else if (collidedWithWall || collidedWithObstacle || collidedWithSelf || collidedWithRoving || collidedWithColorGate) {
      // If the level has already been cleared (e.g. via portal warp), never trigger death!
      if (isLevelClearedRef.current) return;

      const isShieldProtected =
        Date.now() < spawnGraceUntilRef.current ||
        Date.now() < reviveShieldUntilRef.current ||
        Date.now() < shieldUntilRef.current ||
        isShieldActiveRef.current ||
        isRainbowActiveRef.current ||
        isLightningActiveRef.current;

      if (isShieldProtected) {
        // 4秒超能無敵護盾保護（道具護盾與復活護盾均享 4 秒無敵）：
        if (collidedWithWall) {
          const safe = getSafeWallTurn(currentHead, curDir, currentObstacles);
          curDir = safe.dir;
          dirRef.current = safe.dir;
          setDirection(safe.dir);
          nextDirQueue.current = [];
          nextHead = safe.next;
          soundEngine.playTurn();
        } else if (collidedWithObstacle || collidedWithColorGate) {
          const safe = getSafeTurn(currentHead, curDir, currentObstacles, snakeRef.current, rovingSnakesRef.current);
          curDir = safe.dir;
          dirRef.current = safe.dir;
          setDirection(safe.dir);
          nextDirQueue.current = [];
          nextHead = safe.next;
          soundEngine.playTurn();
          spawnParticles(currentHead.x, currentHead.y, '#38bdf8', 10);
        } else if (collidedWithRoving) {
          // Repel roving snakes near collision point safely by reversing them
          setRovingSnakes((prev) =>
            prev.map((rs) => {
              if (rs.body.some((b) => Math.hypot(b.x - nextHead.x, b.y - nextHead.y) <= 3)) {
                const opp = OPPOSITE_DIRECTIONS[rs.direction];
                const reversed = [...rs.body].reverse();
                return { ...rs, direction: opp, body: reversed };
              }
              return rs;
            })
          );
          const safe = getSafeTurn(currentHead, curDir, currentObstacles, snakeRef.current, rovingSnakesRef.current);
          curDir = safe.dir;
          dirRef.current = safe.dir;
          setDirection(safe.dir);
          nextDirQueue.current = [];
          nextHead = safe.next;
          soundEngine.playPowerUp();
          spawnParticles(currentHead.x, currentHead.y, '#38bdf8', 12);
        } else if (collidedWithSelf) {
          // 護盾保護期間可安全穿越自身蛇身
          soundEngine.playTurn();
          spawnParticles(nextHead.x, nextHead.y, '#38bdf8', 6);
        }
      } else {
        // Game Over with specific cause
        const reason: GameOverReason = collidedWithColorGate
          ? 'WRONG_COLOR_GATE'
          : collidedWithWall
          ? 'WALL'
          : collidedWithObstacle
          ? 'OBSTACLE'
          : collidedWithRoving
          ? 'ROVING_SNAKE'
          : 'SELF';
        triggerGameOver(reason);
        return;
      }
    }

    // 4. Ice Tile Slip Check (滑冰地面: 踩上去會一直滑到撞牆或離開店面先停)
    const activeIceTiles = activeMission?.iceTiles;
    if (activeIceTiles && activeIceTiles.some((t) => t.x === nextHead.x && t.y === nextHead.y)) {
      if (!isSlidingOnIceRef.current) {
        isSlidingOnIceRef.current = true;
        setIsSlidingOnIce(true);
        soundEngine.playIceSlide();
      }
    } else if (isSlidingOnIceRef.current) {
      isSlidingOnIceRef.current = false;
      setIsSlidingOnIce(false);
    }

    // Check food collision with nextHead
    const foods = foodItemsRef.current;
    const eatenIdx = foods.findIndex(
      (f) => f.position.x === nextHead.x && f.position.y === nextHead.y
    );

    let willGrow = false;
    let isReverseEaten = false;

    if (eatenIdx >= 0) {
      const eaten = foods[eatenIdx];
      if (eaten.type === 'REVERSE') {
        isReverseEaten = true;
      }
      willGrow = true;
      consumeFood(eaten, false, nextHead);
    }

    // Move player snake body (update synchronously so roving snakes immediately see current player body)
    const prevSnake = snakeRef.current;
    let newSnake = [nextHead, ...(willGrow ? prevSnake : prevSnake.slice(0, -1))];

    if (isReverseEaten) {
      // 尾變蛇頭: 反轉剛踏入道具後形成的完整連續蛇身，保證首尾完全調轉，絕不出現中途斷裂
      newSnake = [...newSnake].reverse();
      const currentObs = obstaclesRef.current.length > 0 ? obstaclesRef.current : obstacles;
      const newDir = getSafeReverseDirection(
        newSnake,
        dirRef.current,
        currentObs,
        rovingSnakesRef.current,
        isGhostActiveRef.current
      );
      dirRef.current = newDir;
      setDirection(newDir);
      nextDirQueue.current = [];
      spawnParticles(newSnake[0].x, newSnake[0].y, '#6366f1', 16);
      addFloatingText(tEngine('⏪ 尾變蛇頭!', '⏪ Reverse Head!', '⏪ 尾頭反転!'), newSnake[0].x, newSnake[0].y, '#818cf8');
    }

    snakeRef.current = newSnake;
    setSnake(newSnake);

    // If magnet, golden key aura, or rainbow fever is active, also absorb any foods adjacent to nextHead or touching the new snake body
    if (isMagnetActiveRef.current || isKeyAuraActiveRef.current || isRainbowActiveRef.current) {
      const currentHeadPos = newSnake[0];
      const remainingCurrentFoods = [...foodItemsRef.current];
      for (const f of remainingCurrentFoods) {
        const dist = Math.abs(currentHeadPos.x - f.position.x) + Math.abs(currentHeadPos.y - f.position.y);
        const touches = newSnake.some((s) => s.x === f.position.x && s.y === f.position.y);
        if (dist <= 1 || touches) {
          consumeFood(f, true, f.position);
        }
      }
    }

    if (onAchievementProgressRef.current) {
      onAchievementProgressRef.current('length_20', newSnake.length);
      onAchievementProgressRef.current('length_40', newSnake.length);
      onAchievementProgressRef.current('t2_length_55', newSnake.length);
      onAchievementProgressRef.current('t2_length_70', newSnake.length);
      onAchievementProgressRef.current('t3_length_85', newSnake.length);
      onAchievementProgressRef.current('t3_length_100', newSnake.length);
      onAchievementProgressRef.current('t4_length_120', newSnake.length);
      onAchievementProgressRef.current('SNAKE_LENGTH', newSnake.length);
    }

    // Update Roving Snakes (實體阻擋互不穿透：巡邏蛇將玩家蛇身視為不可穿越的「堅固磚牆」，遇到蛇身必須調頭，絕不重疊；但蛇身也不會暴斃)
    if (rovingSnakesRef.current.length > 0) {
      const currentPlayerBody = newSnake;
      const currentObs = obstaclesRef.current.length > 0 ? obstaclesRef.current : obstacles;

      const dirDeltas: Record<Direction, Point> = {
        UP: { x: 0, y: -1 },
        DOWN: { x: 0, y: 1 },
        LEFT: { x: -1, y: 0 },
        RIGHT: { x: 1, y: 0 },
      };
      const opposites: Record<Direction, Direction> = {
        UP: 'DOWN',
        DOWN: 'UP',
        LEFT: 'RIGHT',
        RIGHT: 'LEFT',
      };

      const updatedRovingSnakes = rovingSnakesRef.current.map((rs, idx) => {
        // EMP 電磁脈衝波：超頻期間全面癱瘓場上所有巡邏機械蛇！
        if (isLightningActiveRef.current) {
          return rs;
        }
        rs.tickCounter += 1;
        if (rs.tickCounter < rs.speedTicks) {
          return rs;
        }
        rs.tickCounter = 0;

        const curHead = rs.body[0];

        // 判定目標格子是否受阻：邊界、障礙磚牆、傳送門、其他巡邏蛇、自身身軀，以及【玩家蛇身（不可穿透之堅固磚牆）】
        const isTileBlocked = (pt: Point): boolean => {
          if (pt.x < 0 || pt.x >= GRID_COLS || pt.y < 0 || pt.y >= GRID_ROWS) return true;
          if (currentObs.some((o) => o.x === pt.x && o.y === pt.y)) return true;
          // Avoid spatial warp portals so roving snakes do not camp on warp gates
          if (activeMission?.hasPortals && activeMission.portals?.some((p) => p.x === pt.x && p.y === pt.y)) {
            return true;
          }
          // Avoid other roving snakes
          for (let j = 0; j < rovingSnakesRef.current.length; j++) {
            if (j !== idx) {
              if (rovingSnakesRef.current[j].body.some((b) => b.x === pt.x && b.y === pt.y)) {
                return true;
              }
            }
          }
          // Avoid self body
          if (rs.body.slice(0, -1).some((b) => b.x === pt.x && b.y === pt.y)) return true;
          // 堅固磚牆：玩家蛇身全段（頭部、身段、尾巴）絕對不可侵入，絕不重疊
          if (currentPlayerBody.some((pb) => pb.x === pt.x && pb.y === pt.y)) return true;
          return false;
        };

        const forwardPt = {
          x: curHead.x + dirDeltas[rs.direction].x,
          y: curHead.y + dirDeltas[rs.direction].y,
        };

        const isFacingPlayer = currentPlayerBody.some(
          (pb) => pb.x === forwardPt.x && pb.y === forwardPt.y
        );
        const forwardBlocked = isTileBlocked(forwardPt);

        // 90度側向轉向候選
        const sideDirs =
          rs.direction === 'UP' || rs.direction === 'DOWN'
            ? (['LEFT', 'RIGHT'] as Direction[])
            : (['UP', 'DOWN'] as Direction[]);

        const freeSideDirs = sideDirs.filter((d) => {
          const testPt = { x: curHead.x + dirDeltas[d].x, y: curHead.y + dirDeltas[d].y };
          return !isTileBlocked(testPt);
        });

        // 180度調頭判定（以蛇尾向外延伸的方向作為新蛇頭方向）
        const canReverseTurn = (): { canReverse: boolean; newHead: Point; reversedBody: Point[]; newDir: Direction } => {
          if (rs.body.length < 2) {
            const oppDir = opposites[rs.direction];
            const oppPt = { x: curHead.x + dirDeltas[oppDir].x, y: curHead.y + dirDeltas[oppDir].y };
            if (!isTileBlocked(oppPt)) {
              return { canReverse: true, newHead: oppPt, reversedBody: [oppPt], newDir: oppDir };
            }
            return { canReverse: false, newHead: curHead, reversedBody: rs.body, newDir: rs.direction };
          }
          const tail = rs.body[rs.body.length - 1];
          const prevSeg = rs.body[rs.body.length - 2];
          let tailDir: Direction = opposites[rs.direction];
          if (tail.x > prevSeg.x) tailDir = 'RIGHT';
          else if (tail.x < prevSeg.x) tailDir = 'LEFT';
          else if (tail.y > prevSeg.y) tailDir = 'DOWN';
          else if (tail.y < prevSeg.y) tailDir = 'UP';

          const tailStepPt = { x: tail.x + dirDeltas[tailDir].x, y: tail.y + dirDeltas[tailDir].y };
          if (!isTileBlocked(tailStepPt)) {
            const rev = [...rs.body].reverse();
            return { canReverse: true, newHead: tailStepPt, reversedBody: rev, newDir: tailDir };
          }
          return { canReverse: false, newHead: curHead, reversedBody: rs.body, newDir: rs.direction };
        };

        // 情況 1：前方直面玩家蛇身 -> 視為堅固磚牆，遇到蛇身必須調頭/轉向，絕不重疊，且不傷玩家
        if (isFacingPlayer) {
          // 若有可通行的側向空位，優先轉向側方避開
          if (freeSideDirs.length > 0) {
            const chosenDir = freeSideDirs[Math.floor(Math.random() * freeSideDirs.length)];
            const nextRovingHead = {
              x: curHead.x + dirDeltas[chosenDir].x,
              y: curHead.y + dirDeltas[chosenDir].y,
            };
            return {
              ...rs,
              direction: chosenDir,
              body: [nextRovingHead, ...rs.body.slice(0, -1)],
            };
          }
          // 兩側受阻（如狹窄通道），立即執行 180 度調頭
          const rev = canReverseTurn();
          if (rev.canReverse) {
            return {
              ...rs,
              direction: rev.newDir,
              body: [rev.newHead, ...rev.reversedBody.slice(0, -1)],
            };
          }
          // 四周完全無路可走時，原地靜止等待，絕不侵入玩家蛇身
          return rs;
        }

        // 情況 2：前方受常規障礙物或邊界阻擋
        if (forwardBlocked) {
          if (freeSideDirs.length > 0) {
            const chosenDir = freeSideDirs[Math.floor(Math.random() * freeSideDirs.length)];
            const nextRovingHead = {
              x: curHead.x + dirDeltas[chosenDir].x,
              y: curHead.y + dirDeltas[chosenDir].y,
            };
            return {
              ...rs,
              direction: chosenDir,
              body: [nextRovingHead, ...rs.body.slice(0, -1)],
            };
          }
          const rev = canReverseTurn();
          if (rev.canReverse) {
            return {
              ...rs,
              direction: rev.newDir,
              body: [rev.newHead, ...rev.reversedBody.slice(0, -1)],
            };
          }
          return rs;
        }

        // 情況 3：前方暢通正常行進（15%機率靈巧側轉漫遊）
        let chosenDir = rs.direction;
        if (freeSideDirs.length > 0 && Math.random() < 0.15) {
          chosenDir = freeSideDirs[Math.floor(Math.random() * freeSideDirs.length)];
        }

        const nextRovingHead = {
          x: curHead.x + dirDeltas[chosenDir].x,
          y: curHead.y + dirDeltas[chosenDir].y,
        };

        // 終極防線：若計算出的位置剛好是玩家身體，立刻調頭或原地停留，絕不踏入玩家身體
        if (currentPlayerBody.some((pb) => pb.x === nextRovingHead.x && pb.y === nextRovingHead.y)) {
          const rev = canReverseTurn();
          if (rev.canReverse) {
            return {
              ...rs,
              direction: rev.newDir,
              body: [rev.newHead, ...rev.reversedBody.slice(0, -1)],
            };
          }
          return rs;
        }

        return {
          ...rs,
          direction: chosenDir,
          body: [nextRovingHead, ...rs.body.slice(0, -1)],
        };
      });

      setRovingSnakes(updatedRovingSnakes);
      rovingSnakesRef.current = updatedRovingSnakes;
    }
  }, [obstacles, spawnFood, spawnParticles, addFloatingText, triggerGameOver]);

  // Game loop speed calculation (提高難度，針對無聊關卡、飆速關、後期世界動態加速)
  const getSpeed = useCallback(() => {
    if (isSlowActive) return 170;
    let base = 114;
    const currentM = modeRef.current;
    const activeLevel = currentLevelRef.current || currentLevel;

    if (currentM === 'SURVIVAL') {
      base = Math.max(68, 105 - Math.floor(score / 50) * 4);
    } else if (currentM === 'TIME_ATTACK') {
      base = 92;
    } else if (currentM === 'LEVELS' && activeLevel) {
      // 1. 關卡明確設定基礎速度
      if (typeof activeLevel.baseSpeedMs === 'number') {
        base = activeLevel.baseSpeedMs;
      } else if (activeLevel.snakeSpeed) {
        switch (activeLevel.snakeSpeed) {
          case 'EXTREME':
            base = 74;
            break;
          case 'TURBO':
            base = 82;
            break;
          case 'VERY_FAST':
            base = 90;
            break;
          case 'FAST':
            base = 98;
            break;
          case 'NORMAL':
          default:
            base = 112;
            break;
        }
      } else {
        // 2. 動態難度演算法：依據世界與關卡機制提升速度
        const id = activeLevel.id;
        const worldIndex = Math.floor((id - 1) / 20); // 0 to 19
        const isPlainLevel = !activeLevel.hasObstacles && (!activeLevel.rovingSnakesCount || activeLevel.rovingSnakesCount === 0);
        const isSpeedRush = Boolean(activeLevel.timeLimit) || activeLevel.gimmick === 'CHILI';
        const isBoss = Boolean(activeLevel.isBossLevel);

        if (isSpeedRush) {
          base = Math.max(72, 84 - Math.floor(worldIndex * 0.8));
        } else if (isBoss) {
          base = Math.max(75, 88 - Math.floor(id * 0.05));
        } else if (isPlainLevel) {
          // 無障礙單純吃蘋果關卡：靈敏快速節奏避免冗長拖沓
          base = Math.max(76, 88 - Math.floor(worldIndex * 0.8));
        } else {
          base = Math.max(76, 96 - worldIndex * 1.2);
        }
      }

      // 隨著蛇身長度增長自然提速
      const length = snake.length;
      if (length > 4) {
        base = Math.max(64, base - Math.floor((length - 4) / 4) * 2.2);
      }
    } else {
      // Classic smooth responsive progression (Snappy & agile 98ms base instead of sluggish 118ms)
      const length = snake.length;
      base = Math.max(68, 98 - Math.floor(length / 4) * 2.8);
    }

    // ⚡ 電磁超頻核心：光速疾行，暴降至 46ms 極速！
    if (isLightningActive) return 46;
    // 烈焰衝鋒：辣椒火衣衝刺提升速度
    if (isFireActive) return Math.max(48, Math.floor(base * 0.72));
    return Math.max(42, Math.round(base));
  }, [score, snake.length, isSlowActive, isFireActive, isLightningActive, currentLevel]);

  const updateGameRef = useRef(updateGame);
  updateGameRef.current = updateGame;

  const getSpeedRef = useRef(getSpeed);
  getSpeedRef.current = getSpeed;

  // Main Game Loop: Smooth, drift-free delta-time tick loop
  // NEVER torn down or restarted when score/snake length/speed updates, eliminating pause hiccups!
  useEffect(() => {
    if (!isPlaying || isPaused || isGameOver) return;

    let animId: number;
    let lastTickTime = performance.now();

    const loop = (now: number) => {
      animId = requestAnimationFrame(loop);

      if (typeof document !== 'undefined' && document.hidden) return;
      if (isPausedRef.current || !isPlayingRef.current || isGameOverRef.current) return;

      const currentInterval = getSpeedRef.current();
      const elapsed = now - lastTickTime;

      if (elapsed >= currentInterval) {
        lastTickTime = now - (elapsed % currentInterval);
        try {
          updateGameRef.current();
        } catch (err) {
          console.warn('Game tick error:', err);
        }
      }
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, isPaused, isGameOver]);

  // Countdown Timer (for TIME_ATTACK or timed LEVELS missions)
  useEffect(() => {
    if (!isPlaying || isPaused || isGameOver) return;
    const activeLevel = currentLevelRef.current || currentLevel;
    const isTimed = mode === 'TIME_ATTACK' || (mode === 'LEVELS' && Boolean(activeLevel?.timeLimit));
    if (!isTimed) return;

    const timer = setInterval(() => {
      // Never trigger timeout during initial 3-second spawn grace of level start
      if (Date.now() < spawnGraceUntilRef.current) return;

      setTimeLeft((prev) => {
        // Strict guard: if prev is 0 or negative due to level transition from non-timed level,
        // recover the level's designated timeLimit instead of immediately dying!
        if (prev <= 0) {
          const fallback = currentLevelRef.current?.timeLimit || currentLevel?.timeLimit || (mode === 'TIME_ATTACK' ? 60 : 75);
          return fallback;
        }
        if (prev <= 1) {
          if (Date.now() < spawnGraceUntilRef.current) {
            return currentLevelRef.current?.timeLimit || currentLevel?.timeLimit || (mode === 'TIME_ATTACK' ? 60 : 75);
          }
          clearInterval(timer);
          triggerGameOver('TIMEOUT');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlaying, isPaused, isGameOver, mode, currentLevel?.timeLimit, triggerGameOver]);

  // Survival Timer tracking for missions with targets.surviveSeconds
  useEffect(() => {
    if (!isPlaying || isPaused || isGameOver) return;
    const activeLevel = currentLevelRef.current || currentLevel;
    if (mode !== 'LEVELS' || !activeLevel?.targets.surviveSeconds) return;

    const timer = setInterval(() => {
      setLevelProgress((prev) => {
        const nextSurvive = (prev.surviveSeconds || 0) + 1;
        const updated = { ...prev, surviveSeconds: nextSurvive };
        levelProgressRef.current = updated;
        checkLevelCompletion(updated, snakeRef.current.length, scoreRef.current, coinsEarnedRef.current);
        return updated;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlaying, isPaused, isGameOver, mode, currentLevel?.targets.surviveSeconds, checkLevelCompletion]);

  // Decay bonus food duration and powerup timer tracking (battery-optimized: only updates state when values actually change)
  useEffect(() => {
    if (!isPlaying || isPaused || isGameOver) return;
    const timer = setInterval(() => {
      // 1. Bomb ticking and decaying foods
      const currentFoods = foodItemsRef.current;
      const hasDecayingFoods = currentFoods.some((f) => f.bombCountdown !== undefined || f.duration !== undefined);

      if (hasDecayingFoods) {
        let bombExploded = false;
        setFoodItems((prev) => {
          let hasBomb = false;
          const updated = prev.map((f) => {
            if (f.type === 'BOMB' && f.bombCountdown !== undefined) {
              hasBomb = true;
              const nextCount = Math.max(0, f.bombCountdown - 0.1);
              if (nextCount <= 0) {
                bombExploded = true;
              }
              return { ...f, bombCountdown: nextCount };
            }
            if (f.duration !== undefined) {
              return { ...f, duration: f.duration - 0.1 };
            }
            return f;
          });

          if (hasBomb && Date.now() - lastBombTickRef.current >= 1000) {
            lastBombTickRef.current = Date.now();
            soundEngine.playBombTick();
          }

          const filtered = updated.filter((f) => f.duration === undefined || f.duration > 0);
          foodItemsRef.current = filtered;
          return filtered;
        });

        if (bombExploded && !isGameOverRef.current && !isLevelClearedRef.current) {
          soundEngine.playExplosion();
          triggerGameOver('BOMB_EXPLODED');
          return;
        }
      }

      // Magnetic food attraction & absorption effect (only executes when a magnet/aura powerup is active)
      if ((isMagnetActiveRef.current || isKeyAuraActiveRef.current || isRainbowActiveRef.current || isLightningActiveRef.current) && snakeRef.current.length > 0) {
        const head = snakeRef.current[0];
        const currentSnake = snakeRef.current;
        const currentFoods = [...foodItemsRef.current];
        const toAbsorb: FoodItem[] = [];
        const movedFoods: FoodItem[] = [];

        for (const f of currentFoods) {
          const dx = head.x - f.position.x;
          const dy = head.y - f.position.y;
          const dist = Math.abs(dx) + Math.abs(dy);
          const touchesSnake = currentSnake.some(
            (s) => s.x === f.position.x && s.y === f.position.y
          );

          // If already adjacent to head or touching snake body: absorb immediately!
          if (dist <= 1 || touchesSnake) {
            toAbsorb.push(f);
            continue;
          }

          // Within magnet pull radius (dist <= 6): pull 1 step closer to head
          if (dist <= 6) {
            const stepX = dx !== 0 ? (dx > 0 ? 1 : -1) : 0;
            const stepY = dy !== 0 ? (dy > 0 ? 1 : -1) : 0;
            const newPos = {
              x: f.position.x + (Math.abs(dx) >= Math.abs(dy) ? stepX : 0),
              y: f.position.y + (Math.abs(dy) > Math.abs(dx) ? stepY : 0),
            };
            const newDist = Math.abs(head.x - newPos.x) + Math.abs(head.y - newPos.y);
            const newTouchesSnake = currentSnake.some(
              (s) => s.x === newPos.x && s.y === newPos.y
            );

            if (newDist <= 1 || newTouchesSnake) {
              toAbsorb.push({ ...f, position: newPos });
            } else {
              movedFoods.push({ ...f, position: newPos });
            }
          } else {
            movedFoods.push(f);
          }
        }

        // Update positions of moved foods
        if (movedFoods.length !== currentFoods.length || toAbsorb.length > 0) {
          foodItemsRef.current = movedFoods;
          setFoodItems(movedFoods);
        }

        // Absorb all captured foods (updating score, snake length, and mission targets)
        for (const item of toAbsorb) {
          consumeFood(item, true, item.position);
        }
      }

      // Check if any powerup is currently active before computing or updating powerUpTimeLeft
      const hasActivePowerUp =
        isShieldActiveRef.current ||
        isSlowActiveRef.current ||
        isFireActiveRef.current ||
        isMagnetActiveRef.current ||
        isGhostActiveRef.current ||
        isKeyAuraActiveRef.current ||
        isRainbowActiveRef.current ||
        isLightningActiveRef.current;

      if (hasActivePowerUp) {
        const now = Date.now();
        const sSec = Math.max(0, Math.ceil((Math.max(shieldUntilRef.current, reviveShieldUntilRef.current) - now) / 1000));
        const slSec = Math.max(0, Math.ceil((slowUntilRef.current - now) / 1000));
        const fSec = Math.max(0, Math.ceil((fireUntilRef.current - now) / 1000));
        const mSec = Math.max(0, Math.ceil((magnetUntilRef.current - now) / 1000));
        const gSec = Math.max(0, Math.ceil((ghostUntilRef.current - now) / 1000));
        const kaSec = Math.max(0, Math.ceil((keyAuraUntilRef.current - now) / 1000));
        const rSec = Math.max(0, Math.ceil((rainbowUntilRef.current - now) / 1000));
        const lSec = Math.max(0, Math.ceil((lightningUntilRef.current - now) / 1000));

        setPowerUpTimeLeft((prev) => {
          if (
            prev.shield === sSec &&
            prev.slow === slSec &&
            prev.fire === fSec &&
            prev.magnet === mSec &&
            prev.ghost === gSec &&
            prev.keyAura === kaSec &&
            prev.rainbow === rSec &&
            prev.lightning === lSec
          ) {
            return prev;
          }
          return { shield: sSec, slow: slSec, fire: fSec, magnet: mSec, ghost: gSec, keyAura: kaSec, rainbow: rSec, lightning: lSec };
        });

        if (sSec <= 0 && isShieldActiveRef.current) {
          setIsShieldActive(false);
          isShieldActiveRef.current = false;
        }
        if (slSec <= 0 && isSlowActiveRef.current) {
          setIsSlowActive(false);
          isSlowActiveRef.current = false;
        }
        if (fSec <= 0 && isFireActiveRef.current) {
          setIsFireActive(false);
          isFireActiveRef.current = false;
        }
        if (mSec <= 0 && isMagnetActiveRef.current) {
          setIsMagnetActive(false);
          isMagnetActiveRef.current = false;
        }
        if (gSec <= 0 && isGhostActiveRef.current) {
          setIsGhostActive(false);
          isGhostActiveRef.current = false;
        }
        if (kaSec <= 0 && isKeyAuraActiveRef.current) {
          setIsKeyAuraActive(false);
          isKeyAuraActiveRef.current = false;
        }
        if (rSec <= 0 && isRainbowActiveRef.current) {
          setIsRainbowActive(false);
          isRainbowActiveRef.current = false;
        }
        if (lSec <= 0 && isLightningActiveRef.current) {
          setIsLightningActive(false);
          isLightningActiveRef.current = false;
        }
      }
    }, 100);

    return () => clearInterval(timer);
  }, [isPlaying, isPaused, isGameOver, consumeFood, triggerGameOver]);

  return {
    snake,
    direction,
    foodItems,
    obstacles,
    rovingSnakes,
    score,
    coinsEarned,
    applesCount,
    combo,
    comboTimer,
    timeLeft,
    isShieldActive,
    isSlowActive,
    isMagnetActive,
    isFireActive,
    isGhostActive,
    isKeyAuraActive,
    isRainbowActive,
    isLightningActive,
    snakeColor,
    colorSequenceIndex,
    turnsLeft,
    isSlidingOnIce,
    isFullyIlluminated,
    powerUpTimeLeft,
    portals:
      (modeRef.current === 'LEVELS' || mode === 'LEVELS') && (currentLevelRef.current || currentLevel)?.hasPortals
        ? (currentLevelRef.current || currentLevel)?.portals
        : undefined,
    isPlaying,
    isPaused,
    isGameOver,
    gameOverReason,
    isLevelCleared,
    levelProgress,
    particles: fxRef.current.particles,
    floatingTexts: fxRef.current.floatingTexts,
    fxRef,
    revivesUsed,
    canRevive: mode === 'LEVELS' && revivesUsed < 1,
    currentSpeedMs: getSpeed(),
    startGame,
    stopGame,
    pauseGame,
    changeDirection,
    reviveSnake,
    triggerReverseGear,
  };
}
