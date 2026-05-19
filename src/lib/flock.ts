// Side-scrolling route flyer engine
// Each boid flies from left to right across the visible screen

import { FRAME_SIZE, ANIMATION_META, statusAnimation } from './sprites';
import type { PigeonColor, AgentStatus } from './agents';
import type { RouteFn } from './routes';
import { assignRoute } from './routes';

export interface Boid {
  id: string;
  agentSlug: string;
  agentName: string;
  color: PigeonColor;
  status: AgentStatus;

  // Screen position — birds fly left to right across the viewport
  x: number;
  y: number;
  // Animation
  currentAnim: string;
  frameIndex: number;
  frameTimer: number;
  // Visual
  facingRight: boolean;
  scale: number;
  opacity: number;
  // Emote
  emoteTimer: number;
  showEmote: boolean;
  // Route
  route: RouteFn;
  routePhase: number;
  speed: number;
  baseY: number;
}

export interface FlockConfig {
  scrollSpeed: number;
  birdSpeed: number;
}

export const DEFAULT_FLOCK_CONFIG: FlockConfig = {
  scrollSpeed: 1.0,
  birdSpeed: 60,
};

// Create a new boid for an agent
export function createBoid(
  id: string,
  agentSlug: string,
  agentName: string,
  color: PigeonColor,
  status: AgentStatus,
  canvasWidth: number,
  canvasHeight: number,
  index: number,
  totalAgents: number
): Boid {
  const route = assignRoute(index, totalAgents);
  const speed = 45 + Math.random() * 40;
  const baseY = canvasHeight * 0.2 + Math.random() * canvasHeight * 0.55;
  const routePhase = Math.random() * 2000;
  const initialResult = route(routePhase);

  return {
    id,
    agentSlug,
    agentName,
    color,
    status,
    x: -FRAME_SIZE * 2 - Math.random() * canvasWidth * 0.5,
    y: baseY + initialResult.y * 0.3,
    currentAnim: statusAnimation(status),
    frameIndex: Math.floor(Math.random() * 8),
    frameTimer: 0,
    facingRight: false,
    scale: 0.85 + Math.random() * 0.35,
    opacity: status === 'spawning' ? 0 : 1,
    emoteTimer: Math.random() * 4,
    showEmote: true,
    route,
    routePhase,
    speed,
    baseY,
  };
}

// Update a single boid's animation frame
export function updateAnimation(boid: Boid, dt: number): void {
  const meta = ANIMATION_META[boid.currentAnim];
  if (!meta) return;

  boid.frameTimer += dt;
  const frameDuration = 1 / meta.fps;
  if (boid.frameTimer >= frameDuration) {
    boid.frameTimer -= frameDuration;
    boid.frameIndex = (boid.frameIndex + 1) % meta.frames;
  }

  boid.emoteTimer += dt;
}

// Update boid position — flies left to right across screen
export function updateRoute(
  boid: Boid,
  config: FlockConfig,
  canvasWidth: number,
  canvasHeight: number,
  dt: number,
  allIdle: boolean
): void {
  const speedMult = allIdle ? 0.3 : 1.0;
  const effectiveSpeed = boid.speed * speedMult;

  boid.x += effectiveSpeed * dt;
  boid.routePhase += dt * 60;

  const routeResult = boid.route(boid.routePhase);
  boid.y = boid.baseY + routeResult.y * 0.25;

  // Wrap: when bird exits right side, re-enter from left
  if (boid.x > canvasWidth + FRAME_SIZE * 2) {
    boid.x = -FRAME_SIZE * 2 - Math.random() * 100;
    boid.baseY = canvasHeight * 0.15 + Math.random() * canvasHeight * 0.6;
    boid.speed = 45 + Math.random() * 40;
    boid.routePhase = Math.random() * 2000;
  }

  if (boid.status === 'spawning' && boid.opacity < 1) {
    boid.opacity = Math.min(1, boid.opacity + 0.02);
  }

  boid.facingRight = false;
}

// Legacy no-op (kept for compat)
export function updatePosition(_boid: Boid, _dt: number): void {}

// Change a boid's status (triggers animation change + emote)
export function setBoidStatus(boid: Boid, status: AgentStatus): void {
  if (boid.status === status) return;
  boid.status = status;
  boid.currentAnim = statusAnimation(status);
  boid.frameIndex = 0;
  boid.frameTimer = 0;
  boid.showEmote = true;
  boid.emoteTimer = 0;
}
