// Canvas renderer for the side-scrolling route flyer
// Draws parallax background, sprite strips, emote overlays, and agent labels

import { FRAME_SIZE, ANIMATION_META } from './sprites';
import type { Boid } from './flock';
import type { AgentStatus } from './agents';

// Emote icon paths (from the emote pack, 48x48 individual icons)
const EMOTE_PATHS: Record<AgentStatus, string> = {
  idle:      '/emotes/icon_heart.png',
  working:   '/emotes/icon_loading.png',
  completed: '/emotes/icon_correct.png',
  error:     '/emotes/icon_exclamation.png',
  sleeping:  '/emotes/icon_zzz.png',
  spawning:  '/emotes/icon_magic.png',
};

// Cache for loaded emote images
const emoteCache = new Map<string, HTMLImageElement>();

// Preload emote icons
export function preloadEmotes(): Promise<void> {
  const uniquePaths = [...new Set(Object.values(EMOTE_PATHS))];
  return Promise.all(
    uniquePaths.map(path => {
      if (emoteCache.has(path)) return Promise.resolve();
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => { emoteCache.set(path, img); resolve(); };
        img.onerror = () => resolve(); // graceful fallback
        img.src = path;
      })
    })
  ).then(() => {});
}

// Draw a single boid (pigeon sprite)
export function drawBoid(
  ctx: CanvasRenderingContext2D,
  boid: Boid,
  spriteCache: Map<string, HTMLImageElement>,
  mouseX: number,
  mouseY: number
): void {
  const key = `${boid.color}/${boid.currentAnim}`;
  const sprite = spriteCache.get(key);
  if (!sprite || !sprite.complete || sprite.naturalWidth === 0) return;

  const meta = ANIMATION_META[boid.currentAnim];
  if (!meta) return;

  // Clamp frameIndex to actual frames in the image to prevent flashing/clipping
  const actualFrames = Math.floor(sprite.naturalWidth / FRAME_SIZE);
  const safeFrame = boid.frameIndex % actualFrames;

  const srcX = safeFrame * FRAME_SIZE;
  const srcY = 0;
  const srcW = FRAME_SIZE;
  const srcH = FRAME_SIZE;

  const destW = FRAME_SIZE * boid.scale;
  const destH = FRAME_SIZE * boid.scale;
  const destX = boid.x - destW / 2;
  const destY = boid.y - destH / 2;

  ctx.save();
  ctx.globalAlpha = boid.opacity;
  ctx.imageSmoothingEnabled = false; // crisp pixel art

  // Flip if facing left
  if (!boid.facingRight) {
    ctx.translate(boid.x, boid.y);
    ctx.scale(-1, 1);
    ctx.translate(-boid.x, -boid.y);
  }

  ctx.drawImage(sprite, srcX, srcY, srcW, srcH, destX, destY, destW, destH);
  ctx.restore();

  // Draw emote overlay above the pigeon — always visible, gentle bob
  if (boid.showEmote) {
    const emotePath = EMOTE_PATHS[boid.status];
    const emote = emoteCache.get(emotePath);
    if (emote) {
      const emoteSize = 28;
      const emoteX = boid.x - emoteSize / 2;
      const floatBob = Math.sin(boid.emoteTimer * 1.8) * 4;
      const emoteY = boid.y - destH / 2 - emoteSize - 6 + floatBob;
      ctx.save();
      ctx.globalAlpha = boid.opacity * 0.95;
      ctx.imageSmoothingEnabled = false; // crisp pixel art emote
      ctx.drawImage(emote, 0, 0, 48, 48, emoteX, emoteY, emoteSize, emoteSize);
      ctx.restore();
    }
  }

  // Draw agent name on hover
  const isHovered =
    mouseX >= destX && mouseX <= destX + destW &&
    mouseY >= destY && mouseY <= destY + destH;

  if (isHovered) {
    drawTooltip(ctx, boid, boid.x, boid.y - destH / 2 - 8);
  }
}

// Draw tooltip for hovered boid
function drawTooltip(
  ctx: CanvasRenderingContext2D,
  boid: Boid,
  x: number,
  y: number
): void {
  const text = `${boid.agentName} (${boid.status})`;
  ctx.save();
  ctx.font = '11px system-ui, sans-serif';
  const metrics = ctx.measureText(text);
  const padding = 6;
  const w = metrics.width + padding * 2;
  const h = 20;
  const tx = x - w / 2;
  const ty = y - h - 4;

  // Background
  ctx.fillStyle = 'rgba(15, 15, 20, 0.85)';
  ctx.beginPath();
  ctx.roundRect(tx, ty, w, h, 4);
  ctx.fill();

  // Border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Text
  ctx.fillStyle = '#e4e4e7';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, ty + h / 2);
  ctx.restore();
}

// --- Pixel City parallax background ---

interface BackgroundLayer {
  src: string;
  speed: number;
  opacity: number;
}

const PIXEL_CITY_LAYERS: BackgroundLayer[] = [
  { src: '/backgrounds/pixel-city/layer01.png', speed: 0.04, opacity: 1 },
  { src: '/backgrounds/pixel-city/layer02.png', speed: 0.10, opacity: 1 },
  { src: '/backgrounds/pixel-city/layer03.png', speed: 0.18, opacity: 1 },
  { src: '/backgrounds/pixel-city/layer04.png', speed: 0.32, opacity: 1 },
  { src: '/backgrounds/pixel-city/layer05.png', speed: 0.55, opacity: 1 },
  { src: '/backgrounds/pixel-city/layer06.png', speed: 0.90, opacity: 1 },
];

const backgroundCache = new Map<string, HTMLImageElement>();

function getBackgroundImage(src: string): HTMLImageElement | null {
  if (typeof Image === 'undefined') return null;

  const cached = backgroundCache.get(src);
  if (cached) return cached;

  const img = new Image();
  img.src = src;
  backgroundCache.set(src, img);
  return img;
}

function drawFallbackSky(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, '#1f2b5f');
  grad.addColorStop(0.58, '#44559a');
  grad.addColorStop(1, '#16152a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
}

function drawImageLayer(
  ctx: CanvasRenderingContext2D,
  layer: BackgroundLayer,
  width: number,
  height: number,
  scrollOffset: number
): void {
  const img = getBackgroundImage(layer.src);
  if (!img || !img.complete || img.naturalWidth === 0 || img.naturalHeight === 0) return;

  // Scale so the layer fully covers the canvas (cover-fit)
  const scale = Math.max(height / img.naturalHeight, width / img.naturalWidth);
  const drawW = img.naturalWidth * scale;
  const drawH = img.naturalHeight * scale;
  // Center vertically; if drawH > height, shift up so the middle of the image aligns
  const y = (height - drawH) / 2;
  const scroll = (scrollOffset * layer.speed) % drawW;

  ctx.save();
  ctx.imageSmoothingEnabled = false; // crisp pixel art, no blurry upscaling
  ctx.globalAlpha = layer.opacity;

  // Tile enough copies to cover the screen even when shifted
  for (let x = -scroll - drawW; x < width + drawW; x += drawW) {
    ctx.drawImage(img, x, y, drawW, drawH);
  }

  ctx.restore();
}

// Main parallax background draw using the uploaded Pixel City layers.
// When allIdle is true, eases scroll speed to near-standstill.
export function drawParallaxBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scrollOffset: number
): void {
  drawFallbackSky(ctx, width, height);

  for (const layer of PIXEL_CITY_LAYERS) {
    drawImageLayer(ctx, layer, width, height, scrollOffset);
  }
}

// Keep the old drawBackground for backward compat (redirects to parallax)
export function drawBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scrollOffset: number = 0
): void {
  drawParallaxBackground(ctx, width, height, scrollOffset);
}

// Draw status legend overlay
export function drawLegend(
  ctx: CanvasRenderingContext2D,
  boids: Boid[],
  width: number
): void {
  // Count by status
  const counts: Record<string, number> = {};
  for (const b of boids) {
    counts[b.status] = (counts[b.status] || 0) + 1;
  }

  const entries = Object.entries(counts);
  if (entries.length === 0) return;

  ctx.save();
  ctx.font = '11px system-ui, sans-serif';
  const padding = 8;
  const lineHeight = 18;
  const w = 140;
  const h = entries.length * lineHeight + padding * 2 + 24;

  // Position: top-right
  const x = width - w - 12;
  const y = 12;

  // Background
  ctx.fillStyle = 'rgba(15, 15, 20, 0.8)';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 6);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Title
  ctx.fillStyle = '#a1a1aa';
  ctx.font = '10px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('FLOCK STATUS', x + padding, y + padding + 10);

  // Status counts
  ctx.font = '11px system-ui, sans-serif';
  const statusColors: Record<string, string> = {
    idle: '#a1a1aa',
    working: '#60a5fa',
    completed: '#4ade80',
    error: '#f87171',
    sleeping: '#78716c',
    spawning: '#c084fc',
  };

  entries.forEach(([status, count], i) => {
    const ey = y + padding + 24 + i * lineHeight;
    ctx.fillStyle = statusColors[status] || '#a1a1aa';
    ctx.beginPath();
    ctx.arc(x + padding + 5, ey - 3, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e4e4e7';
    ctx.fillText(`${status}: ${count}`, x + padding + 14, ey);
  });

  ctx.restore();
}
