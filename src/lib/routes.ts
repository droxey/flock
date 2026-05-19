// Parametric route functions for side-scrolling pigeon paths.
// Each route maps worldX -> { y offset from center, visual scale }

export interface RouteResult {
  /** y offset from canvas center (negative = higher on screen) */
  y: number;
  /** visual scale multiplier (0.9-1.2) for natural size variation */
  scale: number;
}

export type RouteFn = (worldX: number) => RouteResult;

// Helper: gentle noise seeded by x, so each pigeon's movement looks organic
function seededSin(x: number, amplitude: number, period: number, phase: number): number {
  return Math.sin((x / period) * Math.PI * 2 + phase) * amplitude;
}

function seededCos(x: number, amplitude: number, period: number, phase: number): number {
  return Math.cos((x / period) * Math.PI * 2 + phase) * amplitude;
}

// --- Route definitions ---

/** High on screen, gentle sine wave */
export function highRoute(worldX: number): RouteResult {
  const y = seededSin(worldX, 30, 600, 0) - 120;
  const scale = 0.95 + seededCos(worldX, 0.05, 500, 0);
  return { y, scale };
}

/** Low on screen, tight sine wave */
export function lowRoute(worldX: number): RouteResult {
  const y = seededSin(worldX, 20, 400, 1.2) + 100;
  const scale = 0.9 + seededCos(worldX, 0.07, 350, 0.5);
  return { y, scale };
}

/** Starts high, dives down then back up (two sine components) */
export function divingRoute(worldX: number): RouteResult {
  const dive = seededSin(worldX, 80, 1200, 0);
  const ripple = seededSin(worldX, 25, 250, 0.8);
  const y = dive + ripple - 50;
  const scale = 1.05 + seededCos(worldX, 0.1, 600, 1.0);
  return { y, scale };
}

/** Does occasional loops using aperiodic bumps */
export function loopingRoute(worldX: number): RouteResult {
  const base = seededSin(worldX, 35, 700, 2.0);
  // Aperiodic bump: product of two incommensurate sines creates loop-like motion
  const loop = Math.sin((worldX / 300) * Math.PI) * Math.sin((worldX / 227) * Math.PI) * 40;
  const y = base + loop;
  const scale = 0.92 + seededCos(worldX, 0.08, 450, 1.7);
  return { y, scale };
}

/** Middle of screen, moderate amplitude */
export function midRoute(worldX: number): RouteResult {
  const y = seededSin(worldX, 40, 550, 0.4);
  const scale = 1.0 + seededCos(worldX, 0.06, 480, 0.3);
  return { y, scale };
}

/** Nearly straight line with tiny variation */
export function straightRoute(worldX: number): RouteResult {
  const y = seededSin(worldX, 8, 800, 1.5);
  const scale = 0.98 + seededCos(worldX, 0.03, 700, 0.9);
  return { y, scale };
}

/** Large amplitude, short period - bouncy */
export function bouncyRoute(worldX: number): RouteResult {
  const y = seededSin(worldX, 65, 250, 0.0);
  const scale = 0.88 + seededCos(worldX, 0.12, 200, 0.0);
  return { y, scale };
}

/** Gentle serpentine near center */
export function serpentineRoute(worldX: number): RouteResult {
  const y = seededSin(worldX, 50, 800, 0.0) + seededSin(worldX, 15, 300, 1.0);
  const scale = 1.02 + seededCos(worldX, 0.04, 550, 2.0);
  return { y, scale };
}

// --- Preset list ---

export const ROUTE_PRESETS: RouteFn[] = [
  highRoute,
  lowRoute,
  divingRoute,
  loopingRoute,
  midRoute,
  straightRoute,
  bouncyRoute,
  serpentineRoute,
];

// --- Assignment ---

/**
 * Assign each agent a different route based on its index.
 * Distributes evenly across available routes, cycling if more agents than routes.
 */
export function assignRoute(index: number, totalAgents: number): RouteFn {
  const routeIndex = index % ROUTE_PRESETS.length;
  return ROUTE_PRESETS[routeIndex];
}
