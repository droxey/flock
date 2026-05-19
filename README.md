# Nebula Flock

A live side-scrolling canvas miniapp where each pigeon represents a Nebula agent. Pigeon color, flight route, animation, and emote badge all reflect real agent status.

**Live Demo:** https://droxey-0fad-42003.nebula.me

## Features

- **Live Agent Visualization** — Each Nebula agent is represented as a pigeon flying across a pixel-art cityscape. The flock updates in real-time as agent statuses change.
- **Role-Based Pigeon Colors** — Pigeon color maps to agent role (white for orchestrators, black for code agents, blue for researchers, pink for creative agents, etc.).
- **8 Flight Routes** — Agents follow different parametric flight paths (high, low, diving, looping, mid, straight, bouncy, serpentine) assigned round-robin.
- **Pixel Art Sprites** — 48x48 sprite strips with multiple animation states (fly, walk, peck, sit, sleep, idle) for each of 8 color variants.
- **Emote Overlays** — Status-specific emote icons float above each pigeon (heart for idle, loading spinner for working, checkmark for completed, etc.).
- **Parallax Background** — 6-layer pixel cityscape with parallax scrolling at different speeds for depth.
- **Interactive** — Tap/click a pigeon to see its name, slug, role, status, and color. Hover for tooltip.
- **Idle Easing** — When all agents are idle or sleeping, the parallax scroll smoothly decelerates to a near-standstill.
- **Responsive** — Full-viewport canvas with DPR-aware rendering for crisp pixel art on retina displays.

## Tech Stack

- **Next.js 16** — App Router, React 19, Turbopack
- **Canvas API** — Direct 2D canvas rendering for the flock simulation
- **Tailwind CSS v4** — Utility-first styling for the sidebar UI
- **shadcn/ui** — UI primitives (Button, Card, Dialog, etc.)
- **Lucide React** — Icon library
- **TypeScript** — Full type safety

## Project Structure

```
flock/
├── src/
│   ├── app/
│   │   ├── api/agents/route.ts   # Agent status API (GET/POST)
│   │   ├── api/ping-agent/route.ts
│   │   ├── globals.css            # Global styles + keyframe animations
│   │   ├── layout.tsx             # Root layout
│   │   └── page.tsx               # Main canvas page + animation loop
│   ├── components/ui/             # shadcn/ui components
│   └── lib/
│       ├── agents.ts              # Agent map, color roles, status emotes
│       ├── flock.ts               # Boid struct, creation, route/anim updates
│       ├── renderer.ts            # Canvas drawing (background, sprites, emotes, tooltips)
│       ├── routes.ts              # 8 parametric flight route functions
│       ├── sprites.ts             # Animation metadata, sprite preloading
│       └── utils.ts               # Utility functions
├── public/
│   ├── backgrounds/pixel-city/    # 6 FullHD parallax layers (PNG)
│   ├── sprites/{color}/           # 48x48 sprite strips per color
│   └── emotes/                    # 6 emote icons (PNG)
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
├── eslint.config.mjs
├── components.json
└── .gitignore
```

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:3000 to see the flock.

## Agent Status API

```
GET  /api/agents       → { agents: AgentConfig[], timestamp }
POST /api/agents       → { slug, status } → { ok: true }
```

Valid statuses: `idle | working | completed | error | sleeping | spawning`

## Pigeon Color → Role Mapping

| Color | Role | Example Agents |
|-------|------|----------------|
| white | Orchestrator / Social | Nebula, X Agent, Cold Outreach |
| black | Code / Management | Code Agent, Agent Manager |
| base_gray | Communication / Monitoring | Gmail, Calendar, Watchdog |
| dark_gray | DevOps / Code Review | GitHub Agent, SFX Agent |
| brown_01 | Infrastructure / Data | Infra Agent, Supabase |
| opal_blue | Research / Scouting | Slack Agent, Model Scout |
| opal_pink | Creative / Content | Web Agent, Media Agent, Siren |
| base_gray_dark | Security / Investigation | Incident Response, Forensics |

## License

MIT
