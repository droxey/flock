# AGENTS.md — Nebula Flock

This file provides instructions for AI coding assistants (Nebula, ChatGPT, Claude, Codex, etc.) working on the Nebula Flock project.

## Project Overview

Nebula Flock is a Next.js 16 miniapp that renders a live side-scrolling canvas where each pigeon represents a Nebula agent. The canvas uses the 2D Canvas API for rendering — NOT DOM elements. All visual output (backgrounds, sprites, emotes, text) is drawn via `ctx.drawImage()`, `ctx.fillText()`, etc.

**Live URL:** https://droxey-0fad-42003.nebula.me

## Architecture

### Rendering Pipeline (per frame)
1. `ctx.clearRect()` — clear canvas
2. `drawParallaxBackground()` — 6-layer pixel city with parallax scroll
3. For each boid: `drawBoid()` — sprite + emote overlay + hover tooltip
4. `drawLegend()` — status count overlay (top-right)

### Key Files
- `src/app/page.tsx` — Main page, animation loop, canvas setup, DPR handling
- `src/lib/renderer.ts` — All canvas drawing (background, sprites, emotes, tooltips)
- `src/lib/flock.ts` — Boid struct, `createBoid()`, `updateRoute()`, `updateAnimation()`
- `src/lib/routes.ts` — 8 parametric flight route functions
- `src/lib/sprites.ts` — `ANIMATION_META`, `statusAnimation()`, `preloadColorSet()`
- `src/lib/agents.ts` — `AGENT_MAP`, `COLOR_CATEGORY`, `STATUS_EMOTE`, types
- `src/app/api/agents/route.ts` — GET returns agent list, POST updates status
- `src/app/globals.css` — Tailwind + keyframe animations

### Coordinate System
- Canvas uses DPR scaling: `canvas.width = cssWidth * dpr`, then `ctx.scale(dpr, dpr)`
- All drawing functions receive **CSS pixel dimensions** (not DPR-scaled)
- Boid positions (`x`, `y`) are in CSS pixel space
- Mouse coordinates are in CSS pixel space

## Critical Rules

### Canvas Rendering
- **NEVER** use DOM elements for the flock visualization — everything is canvas
- **ALWAYS** set `ctx.imageSmoothingEnabled = false` before drawing pixel art (sprites, backgrounds, emotes)
- **ALWAYS** use `ctx.save()` / `ctx.restore()` around drawing operations that modify state (translate, scale, globalAlpha, imageSmoothingEnabled)
- **NEVER** draw sprites with frame indices that exceed the actual image width — use `Math.floor(sprite.naturalWidth / FRAME_SIZE)` to determine actual frame count
- **ALWAYS** pass CSS pixel dimensions to drawing functions, not `canvas.width`/`canvas.height` (which are DPR-scaled)

### Sprite Animation
- Sprite PNGs are 48px per frame, horizontal strips
- Frame counts in `ANIMATION_META` MUST match actual image dimensions
- Animation timing: `frameTimer += dt`, advance frame when `frameTimer >= 1/fps`
- `frameIndex` must be clamped: `frameIndex % actualFrames`

### Background Rendering
- Background layers are 1920x1080 FullHD PNGs
- Use cover-fit scaling: `scale = Math.max(height / img.naturalHeight, width / img.naturalWidth)`
- Tile with seamless wrapping: `scroll = (scrollOffset * layer.speed) % drawW`
- Draw enough tiles to cover: `for (x = -scroll - drawW; x < width + drawW; x += drawW)`

### DPR Handling
```typescript
const dpr = window.devicePixelRatio || 1;
const cssW = canvas.width / dpr;
const cssH = canvas.height / dpr;
// Pass cssW, cssH to all drawing functions
```

### Pixel Art Assets
- Sprites: `public/sprites/{color}/{animation}.png` — 48px per frame, horizontal strip
- Backgrounds: `public/backgrounds/pixel-city/layer01-06.png` — 1920x1080
- Emotes: `public/emotes/icon_{name}.png` — 48x48 individual icons
- When adding new sprites, ensure frame count in `ANIMATION_META` matches `naturalWidth / 48`

## Next.js Conventions

### App Router
- Use `'use client'` directive for components with interactivity (canvas, state, effects)
- API routes go in `src/app/api/*/route.ts`
- Page components export default function

### Styling
- Tailwind CSS v4 with semantic tokens: `bg-background`, `text-foreground`, `text-muted-foreground`, `border`, `bg-primary`, `bg-destructive`
- Mobile-first responsive design
- Use `h-dvh` and `w-dvh` for full-viewport canvas
- Avoid `vh` units (use `dvh` for mobile browser chrome compatibility)

### TypeScript
- Strict mode enabled
- Use `type` for interfaces, `interface` for object shapes
- Avoid `any` — use `unknown` with type guards when needed
- Import types with `import type { ... }`

### Build & Deploy
```bash
npm run build    # Next.js production build (Turbopack)
npm run dev      # Dev server with hot reload
npm start        # Production server
```

## Miniapp-Specific Patterns

### Nebula Miniapp Integration
- Miniapps run in a Nebula sandbox with supervisord
- Public URL via `expose_service` tunnel
- Use `rebuild_miniapp()` after code changes (not just `restart_service`)
- Miniapp project dir: `~/.miniapps/bin/{id}/`

### Canvas Performance
- Preload all sprites and emotes before starting animation loop
- Use `requestAnimationFrame` for the render loop
- Cap delta time: `dt = Math.min(rawDt, 0.05)` to avoid spiral of death
- Cache loaded images in `Map<string, HTMLImageElement>`
- Don't create new objects in the render loop

### Animation Loop Pattern
```typescript
const animate = (timestamp: number) => {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp;
  
  // Update state
  for (const boid of boids) {
    updateRoute(boid, ...);
    updateAnimation(boid, dt);
  }
  
  // Draw
  ctx.clearRect(0, 0, cssW, cssH);
  drawParallaxBackground(ctx, cssW, cssH, scrollOffset);
  for (const boid of boids) drawBoid(ctx, boid, ...);
  
  requestAnimationFrame(animate);
};
```

## Common Pitfalls

1. **Sprite flashing** — Caused by frame index exceeding actual image frames. Always use `safeFrame = frameIndex % actualFrames`.
2. **Blurry pixel art** — Caused by missing `imageSmoothingEnabled = false`. Set it before every `drawImage` call for pixel art.
3. **Background too large/small** — Caused by passing DPR-scaled dimensions instead of CSS pixels to drawing functions.
4. **Memory leaks** — Always cancel animation frame in cleanup: `cancelAnimationFrame(animFrameRef.current)`.
5. **Stale closures** — Use refs (`useRef`) for values that change but shouldn't trigger re-renders of the animation callback.

## Adding a New Agent

1. Add entry to `AGENT_MAP` in `src/lib/agents.ts` with slug, name, color, category, emoji
2. Ensure sprite PNG exists at `public/sprites/{color}/fly_8f.png`
3. The agent will automatically appear in the flock on next API poll

## Adding a New Flight Route

1. Add function to `src/lib/routes.ts`: `(phase: number) => { x: number, y: number }`
2. Add entry to the `routes` array
3. Routes are assigned round-robin by agent index in `assignRoute()`

## Testing

- Visual testing: Run `npm run dev` and verify flock renders correctly
- API testing: `curl http://localhost:3000/api/agents`
- Sprite verification: Check `naturalWidth / 48` matches `ANIMATION_META` frame counts
- Background verification: Confirm layers tile seamlessly at different scroll offsets
