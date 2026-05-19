'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as Icons from 'lucide-react';
import { AGENT_MAP, COLOR_CATEGORY, STATUS_EMOTE } from '@/lib/agents';
import type { AgentStatus, PigeonColor } from '@/lib/agents';
import { FRAME_SIZE, ANIMATION_META, statusAnimation, preloadColorSet } from '@/lib/sprites';
import { createBoid, updateRoute, updateAnimation, setBoidStatus, DEFAULT_FLOCK_CONFIG } from '@/lib/flock';
import type { Boid, FlockConfig } from '@/lib/flock';
import { drawParallaxBackground, drawBoid, preloadEmotes } from '@/lib/renderer';

interface AgentState {
  slug: string;
  name: string;
  color: PigeonColor;
  category: string;
  emoji: string;
  status: AgentStatus;
}

const STATUS_LABELS: Record<AgentStatus, string> = {
  idle: 'Idle',
  working: 'Working',
  completed: 'Completed',
  error: 'Error',
  sleeping: 'Sleeping',
  spawning: 'Spawning',
};

const STATUS_DOT: Record<AgentStatus, string> = {
  idle: '#60a5fa',
  working: '#facc15',
  completed: '#4ade80',
  error: '#f87171',
  sleeping: '#a78bfa',
  spawning: '#f472b6',
};

const COLOR_HEX: Record<PigeonColor, string> = {
  white: '#fafafa',
  black: '#18181b',
  base_gray: '#78716c',
  dark_gray: '#44403c',
  brown_01: '#92400e',
  opal_blue: '#60a5fa',
  opal_pink: '#f472b6',
  base_gray_dark: '#292524',
};

export default function FlockPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boidsRef = useRef<Boid[]>([]);
  const spritesRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const animFrameRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0 });
  const scrollRef = useRef(0);
  const idleEaseRef = useRef(1); // 1 = full speed, 0 = fully eased to stop
  const lastTimeRef = useRef(0);
  const spritePreviewRef = useRef<HTMLCanvasElement>(null);
  const [agents, setAgents] = useState<AgentState[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Boid | null>(null);
  const [config, setConfig] = useState<FlockConfig>({ ...DEFAULT_FLOCK_CONFIG });
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showInfo, setShowInfo] = useState(false);

  // Fetch agent states from API
  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch('/api/agents');
      const data = await res.json();
      setAgents(data.agents);
      return data.agents as AgentState[];
    } catch {
      return [];
    }
  }, []);

  // Initialize boids from agent list
  const initBoids = useCallback((agentList: AgentState[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const existing = new Map(boidsRef.current.map(b => [b.agentSlug, b]));
    const totalAgents = agentList.length;

    boidsRef.current = agentList.map((agent, index) => {
      const existingBoid = existing.get(agent.slug);
      if (existingBoid) {
        setBoidStatus(existingBoid, agent.status);
        return existingBoid;
      }
      const dpr = window.devicePixelRatio || 1;
      return createBoid(
        agent.slug,
        agent.slug,
        agent.name,
        agent.color,
        agent.status,
        canvas.width / dpr,
        canvas.height / dpr,
        index,
        totalAgents
      );
    });
  }, []);

  // Animation loop
  const animate = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const rawDt = (timestamp - lastTimeRef.current) / 1000;
    const dt = Math.min(rawDt, 0.05); // cap to avoid spiral
    lastTimeRef.current = timestamp;

    const boids = boidsRef.current;

    // Determine if all agents are idle
    const allIdle = boids.length > 0 && boids.every(b => b.status === 'idle' || b.status === 'sleeping');

    // Ease factor: smoothly interpolate toward target
    const targetEase = (paused || allIdle) ? 0.15 : 1.0;
    idleEaseRef.current += (targetEase - idleEaseRef.current) * dt * 2; // smooth lerp

    // CSS pixel dimensions (canvas is DPR-scaled, ctx is scaled by dpr)
    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.width / dpr;
    const cssH = canvas.height / dpr;

    if (!paused) {
      // Advance parallax scroll offset
      scrollRef.current += config.scrollSpeed * idleEaseRef.current * dt * 60;

      for (const boid of boids) {
        updateRoute(boid, config, cssW, cssH, dt, allIdle);
        updateAnimation(boid, dt);
      }
    }

    // Draw
    ctx.clearRect(0, 0, cssW, cssH);
    drawParallaxBackground(ctx, cssW, cssH, scrollRef.current);

    for (const boid of boids) {
      drawBoid(ctx, boid, spritesRef.current, mouseRef.current.x, mouseRef.current.y);
    }

    animFrameRef.current = requestAnimationFrame(animate);
  }, [paused, config]);

  // Setup canvas and start animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    // Preload sprites and emotes, then fetch agents
    const colors = [...new Set(AGENT_MAP.map(a => a.color))];
    const anims = Object.keys(ANIMATION_META);

    Promise.all([
      preloadColorSet(colors, anims),
      preloadEmotes(),
    ]).then(([sprites]) => {
      spritesRef.current = sprites;
      return fetchAgents();
    }).then((agentList) => {
      if (agentList.length > 0) {
        initBoids(agentList);
      }
      setLoading(false);
      animFrameRef.current = requestAnimationFrame(animate);
    });

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [fetchAgents, initBoids, animate]);

  // Poll agents periodically
  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch('/api/agents');
      const data = await res.json();
      const agentList = data.agents as AgentState[];
      setAgents(agentList);
      initBoids(agentList);
    }, 5000);
    return () => clearInterval(interval);
  }, [initBoids]);

  // Draw sprite preview when selected agent changes
  useEffect(() => {
    if (!selectedAgent || !spritePreviewRef.current) return;
    const canvas = spritePreviewRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const size = 64;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, size, size);
    // Draw background color swatch
    ctx.fillStyle = COLOR_HEX[selectedAgent.color] + '22';
    ctx.fillRect(0, 0, size, size);
    // Draw the sprite frame
    const spriteKey = `${selectedAgent.color}_${selectedAgent.currentAnim}`;
    const spriteImg = spritesRef.current.get(spriteKey);
    if (spriteImg && spriteImg.complete) {
      const frame = selectedAgent.frameIndex || 0;
      const srcX = frame * FRAME_SIZE;
      // Scale up 48px sprite to fill 64px canvas (pixelated)
      const scale = size / FRAME_SIZE;
      ctx.save();
      if (!selectedAgent.facingRight) {
        ctx.translate(size, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(spriteImg, srcX, 0, FRAME_SIZE, FRAME_SIZE, 0, 0, FRAME_SIZE * scale, FRAME_SIZE * scale);
      ctx.restore();
    }
    // Draw emote overlay
    const emoteImg = new Image();
    emoteImg.onload = () => {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(emoteImg, size - 22, 2, 20, 20);
    };
    emoteImg.src = `/emotes/${STATUS_EMOTE[selectedAgent.status]}.png`;
  }, [selectedAgent]);

  // Hit-test: find boid at screen coordinates
  const hitTest = useCallback((clientX: number, clientY: number): Boid | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Check in reverse so topmost (last drawn) is picked first
    const boids = boidsRef.current;
    for (let i = boids.length - 1; i >= 0; i--) {
      const boid = boids[i];
      const w = FRAME_SIZE * boid.scale;
      const h = FRAME_SIZE * boid.scale;
      const bx = boid.x - w / 2;
      const by = boid.y - h / 2;
      if (x >= bx && x <= bx + w && y >= by && y <= by + h) {
        return boid;
      }
    }
    return null;
  }, []);

  // Pointer down handler (works for both mouse and touch)
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const boid = hitTest(e.clientX, e.clientY);
    if (boid) {
      setSelectedAgent(boid);
      setShowInfo(true);
    } else {
      setShowInfo(false);
      setSelectedAgent(null);
    }
  }, [hitTest]);

  // Track mouse position for hover
  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    mouseRef.current.x = e.clientX - rect.left;
    mouseRef.current.y = e.clientY - rect.top;
  }, []);

  return (
    <div className="relative h-dvh w-dvh overflow-hidden bg-black select-none">
      {/* Full-screen canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full cursor-pointer touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
      />

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
            <p className="text-sm text-white/60">Loading flock...</p>
          </div>
        </div>
      )}

      {/* Top bar — minimal branding */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-3 pb-2 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
        <div>
          <h1 className="text-base font-semibold text-white tracking-tight">Nebula Flock</h1>
          <p className="text-[11px] text-white/50">{agents.length} agents</p>
        </div>
        <button
          onClick={() => setPaused(!paused)}
          className="pointer-events-auto h-9 w-9 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          aria-label={paused ? 'Resume' : 'Pause'}
        >
          {paused ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          )}
        </button>
      </div>

      {/* Speed control — bottom left, subtle */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full px-3 py-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/50"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        <input
          type="range"
          min="0.2"
          max="3.0"
          step="0.1"
          value={config.scrollSpeed}
          onChange={(e) => setConfig(prev => ({ ...prev, scrollSpeed: parseFloat(e.target.value) }))}
          className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
        />
      </div>

      {/* Tap hint — fades after first tap */}
      {!showInfo && !loading && (
        <div className="absolute bottom-20 left-0 right-0 z-20 flex justify-center pointer-events-none">
          <p className="text-xs text-white/30 animate-pulse">Tap a pigeon to see info</p>
        </div>
      )}

      {/* Pixel agent card — slides up on tap */}
      {showInfo && selectedAgent && (() => {
        const agentInfo = AGENT_MAP.find(a => a.slug === selectedAgent.agentSlug);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const LucideIcon = agentInfo?.emoji ? (Icons as any)[agentInfo.emoji] as React.ComponentType<any> | undefined : null;
        const colorHex = COLOR_HEX[selectedAgent.color];
        const roleLabel = COLOR_CATEGORY[selectedAgent.color];
        return (
          <div
            className="absolute bottom-0 left-0 right-0 z-30 border-t-2"
            style={{
              animation: 'slideUp 0.25s ease-out',
              backgroundColor: 'rgba(10, 10, 14, 0.95)',
              borderTopColor: colorHex,
            }}
          >
            {/* Color accent bar at top */}
            <div className="h-0.5 w-full" style={{ backgroundColor: colorHex }} />

            <div className="px-4 pb-5 pt-3">
              {/* Row 1: Sprite preview + Name + Lucide icon */}
              <div className="flex items-center gap-3">
                {/* Pixel sprite preview */}
                <div
                  className="h-16 w-16 border flex-shrink-0 overflow-hidden"
                  style={{ borderColor: colorHex + '66', backgroundColor: '#0a0a0e' }}
                >
                  <canvas
                    ref={spritePreviewRef}
                    className="w-full h-full"
                    style={{ imageRendering: 'pixelated' }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {LucideIcon && <LucideIcon className="h-4 w-4 flex-shrink-0" style={{ color: colorHex }} />}
                    <p className="text-sm font-semibold text-white truncate">{selectedAgent.agentName}</p>
                  </div>
                  <p className="text-[11px] text-white/40 mt-0.5">{selectedAgent.agentSlug}</p>
                  <p className="text-[10px] text-white/25 mt-0.5">{roleLabel}</p>
                </div>
              </div>

              {/* Row 2: Status with emote + color swatch */}
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
                <div className="flex items-center gap-2">
                  {/* Emote icon */}
                  <img
                    src={`/emotes/${STATUS_EMOTE[selectedAgent.status]}.png`}
                    alt={selectedAgent.status}
                    className="h-5 w-5"
                    style={{ imageRendering: 'pixelated' }}
                  />
                  <span className="text-xs font-medium text-white/70">{STATUS_LABELS[selectedAgent.status]}</span>
                  <div
                    className="h-2 w-2 rounded-full ml-1"
                    style={{ backgroundColor: STATUS_DOT[selectedAgent.status] }}
                  />
                </div>

                {/* Color swatch + label */}
                <div className="flex items-center gap-1.5">
                  <div
                    className="h-3 w-3 border"
                    style={{ backgroundColor: colorHex, borderColor: colorHex + '88' }}
                  />
                  <span className="text-[10px] text-white/30">{selectedAgent.color}</span>
                </div>
              </div>

              {/* Row 3: Close */}
              <button
                onClick={() => { setShowInfo(false); setSelectedAgent(null); }}
                className="w-full h-9 mt-3 text-xs font-medium transition-colors"
                style={{
                  backgroundColor: colorHex + '15',
                  color: colorHex,
                  border: `1px solid ${colorHex}33`,
                }}
              >
                Close
              </button>
            </div>
          </div>
        );
      })()}

      {/* Inline keyframe for slide-up animation */}
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
