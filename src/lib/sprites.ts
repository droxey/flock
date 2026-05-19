// Sprite manifest and loading utilities for the flock simulator
// All sprites are 48x48 per frame, stored as horizontal strips

import type { PigeonColor, AgentStatus } from './agents';

export const FRAME_SIZE = 48;

// Sprite strip definitions: animation name -> { frames, fps }
export const ANIMATION_META: Record<string, { frames: number; fps: number }> = {
  // All sprite strips are 192px wide = 4 frames of 48px each
  idle_stand_front_3f: { frames: 4, fps: 4 },
  idle_stand_side_3f:  { frames: 4, fps: 4 },
  fly_8f:              { frames: 4, fps: 12 },
  walk_8f:             { frames: 4, fps: 10 },
  peck_8f:             { frames: 4, fps: 8 },
  sit_front_3f:        { frames: 4, fps: 3 },
  sit_side_3f:         { frames: 4, fps: 3 },
  sleep_2f:            { frames: 4, fps: 2 },
};

// Build the sprite URL for a given color + animation
// Assets live in /public/sprites/{color}/{animation}.png
export function spriteUrl(color: PigeonColor, animation: string): string {
  return `/sprites/${color}/${animation}.png`;
}

// Status -> animation name
// All airborne agents use fly_8f so wings actually flap.
// Only grounded / resting statuses use alternate poses.
export function statusAnimation(status: AgentStatus): string {
  const map: Record<AgentStatus, string> = {
    idle:      'fly_8f',
    working:   'fly_8f',
    completed: 'fly_8f',
    error:     'fly_8f',
    sleeping:  'sleep_2f',
    spawning:  'fly_8f',
  };
  return map[status];
}

// Preload a single sprite strip image
export function preloadSprite(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Preload all sprites for a given color set
export function preloadColorSet(
  colors: PigeonColor[],
  animations: string[]
): Promise<Map<string, HTMLImageElement>> {
  const promises: Promise<[string, HTMLImageElement]>[] = [];
  for (const color of colors) {
    for (const anim of animations) {
      const key = `${color}/${anim}`;
      promises.push(preloadSprite(spriteUrl(color, anim)).then(img => [key, img]));
    }
  }
  return Promise.all(promises).then(entries => new Map(entries));
}
