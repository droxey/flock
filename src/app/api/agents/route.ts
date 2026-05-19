// API route: returns current agent states for the flock
// In a live setup this would query the Nebula API; for now we serve
// a simulated state that the client can also update via message callback

import { NextResponse } from 'next/server';
import { AGENT_MAP } from '@/lib/agents';
import type { AgentStatus } from '@/lib/agents';

// Simulated agent states (in production, fetch from Nebula API)
const agentStates: Record<string, AgentStatus> = {};

// Initialize all agents as idle
for (const agent of AGENT_MAP) {
  if (!(agent.slug in agentStates)) {
    agentStates[agent.slug] = 'idle';
  }
}

export async function GET() {
  const agents = AGENT_MAP.map(agent => ({
    ...agent,
    status: agentStates[agent.slug] || 'idle',
  }));
  return NextResponse.json({ agents, timestamp: Date.now() });
}

export async function POST(req: Request) {
  const { slug, status } = await req.json();
  if (slug && status) {
    agentStates[slug] = status;
  }
  return NextResponse.json({ ok: true });
}
