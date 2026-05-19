// Agent-to-pigeon mapping config
// Each agent gets a unique pigeon color variant matched to its role/category

export type AgentStatus = 'idle' | 'working' | 'completed' | 'error' | 'sleeping' | 'spawning';

export interface AgentConfig {
  slug: string;
  name: string;
  color: PigeonColor;
  category: string;
  emoji: string; // lucide icon name for fallback
}

export type PigeonColor =
  | 'base_gray'
  | 'base_gray_dark'
  | 'black'
  | 'brown_01'
  | 'dark_gray'
  | 'opal_blue'
  | 'opal_pink'
  | 'white';

// Map agent purpose to pigeon color
// Color rationale:
//   white          = orchestrator / social / external-facing
//   black          = code / management / internals
//   base_gray      = communication / scheduling / docs / monitoring
//   dark_gray      = devops / behind-the-scenes / code review
//   brown_01       = infrastructure / data / P2P / grounded
//   opal_blue      = research / searching / scouting
//   opal_pink      = creative / content / esoteric
//   base_gray_dark = security / investigation / stripped-down

export const AGENT_MAP: AgentConfig[] = [
  { slug: 'nebula', name: 'Nebula', color: 'white', category: 'orchestrator', emoji: 'Sparkles' },
  { slug: 'code-agent', name: 'Code Agent', color: 'black', category: 'code', emoji: 'Code' },
  { slug: 'gmail-agent', name: 'Gmail Agent', color: 'base_gray', category: 'communication', emoji: 'Mail' },
  { slug: 'slack-agent', name: 'Slack Agent', color: 'opal_blue', category: 'communication', emoji: 'MessageSquare' },
  { slug: 'github-agent', name: 'GitHub Agent', color: 'dark_gray', category: 'code', emoji: 'GitBranch' },
  { slug: 'web-agent', name: 'Web Agent', color: 'opal_pink', category: 'research', emoji: 'Globe' },
  { slug: 'media-agent', name: 'Media Agent', color: 'opal_pink', category: 'creative', emoji: 'Image' },
  { slug: 'infra-agent', name: 'Infra Agent', color: 'brown_01', category: 'infrastructure', emoji: 'Server' },
  { slug: 'supabase-agent', name: 'Supabase Agent', color: 'brown_01', category: 'data', emoji: 'Database' },
  { slug: 'x-agent', name: 'X Agent', color: 'white', category: 'social', emoji: 'Twitter' },
  { slug: 'agent-manager', name: 'Agent Manager', color: 'black', category: 'management', emoji: 'Settings' },
  { slug: 'incident-response', name: 'Incident Response', color: 'base_gray_dark', category: 'security', emoji: 'Shield' },
  { slug: 'siren', name: 'Siren', color: 'opal_pink', category: 'creative', emoji: 'Megaphone' },
  { slug: 'calendar-agent', name: 'Calendar Agent', color: 'base_gray', category: 'scheduling', emoji: 'Calendar' },
  { slug: 'voice-agent', name: 'Voice Agent', color: 'base_gray', category: 'communication', emoji: 'Mic' },
  { slug: 'research-assets-agent', name: 'Research Assets', color: 'opal_blue', category: 'research', emoji: 'Search' },
  { slug: 'the-job', name: 'The Job', color: 'opal_blue', category: 'research', emoji: 'Briefcase' },
  { slug: 'cold-outreach-ops', name: 'Cold Outreach', color: 'white', category: 'social', emoji: 'Send' },
  { slug: 'sfx-agent', name: 'SFX Agent', color: 'dark_gray', category: 'creative', emoji: 'Music' },
  { slug: 'model-scout', name: 'Model Scout', color: 'opal_blue', category: 'research', emoji: 'Binoculars' },
  { slug: 'product-documentation-steward', name: 'Doc Steward', color: 'base_gray', category: 'docs', emoji: 'FileText' },
  { slug: 'radicle-integrator', name: 'Radicle', color: 'brown_01', category: 'infrastructure', emoji: 'GitFork' },
  { slug: 'software-forensics-agent', name: 'Forensics', color: 'base_gray_dark', category: 'security', emoji: 'Search' },
  { slug: 'itchio-asset-scout', name: 'Itch.io Scout', color: 'opal_pink', category: 'creative', emoji: 'Gamepad2' },
  { slug: 'manifestor', name: 'Manifestor', color: 'opal_pink', category: 'creative', emoji: 'Zap' },
  { slug: 'action-watchdog', name: 'Watchdog', color: 'base_gray', category: 'monitoring', emoji: 'Eye' },
  { slug: 'code-turnaround-tracker', name: 'PR Tracker', color: 'dark_gray', category: 'code', emoji: 'GitPullRequest' },
  { slug: 'nebula-flock-manager', name: 'Flock Manager', color: 'white', category: 'orchestrator', emoji: 'Bird' },
  { slug: 'nebula-health', name: 'Nebula Health', color: 'base_gray', category: 'monitoring', emoji: 'Activity' },
  { slug: 'google-sheets-agent', name: 'Sheets Agent', color: 'brown_01', category: 'data', emoji: 'Sheet' },
];

// Emote mapping: agent status -> emote icon name from the emote pack
export const STATUS_EMOTE: Record<AgentStatus, string> = {
  idle: 'icon_heart',
  working: 'icon_loading',
  completed: 'icon_correct',
  error: 'icon_exclamation',
  sleeping: 'icon_zzz',
  spawning: 'icon_magic',
};

// Animation mapping: agent status -> sprite animation
export const STATUS_ANIMATION: Record<AgentStatus, string> = {
  idle: 'idle_stand_front_3f',
  working: 'fly_8f',
  completed: 'peck_8f',
  error: 'sit_front_3f',
  sleeping: 'sleep_2f',
  spawning: 'fly_8f',
};

// Color -> category label for the UI legend
export const COLOR_CATEGORY: Record<PigeonColor, string> = {
  white: 'Orchestrator / Social',
  black: 'Code / Management',
  base_gray: 'Communication / Docs',
  dark_gray: 'DevOps / Behind Scenes',
  brown_01: 'Infrastructure / Data',
  opal_blue: 'Research / Scouting',
  opal_pink: 'Creative / Content',
  base_gray_dark: 'Security / Investigation',
};
