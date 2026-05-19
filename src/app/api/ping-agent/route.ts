// Message callback: miniapp -> agent
// Sends a message back to the Nebula agent via the proxy

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { content, thread_id } = await req.json();
  const resp = await fetch(`${process.env.NEBULA_PROXY_URL}/internal/proxy/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SANDBOX_AUTH_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      agent_id: process.env.AGENT_ID,
      content,
      ...(thread_id ? { thread_id } : {}),
    }),
  });
  return NextResponse.json(await resp.json(), { status: resp.status });
}
