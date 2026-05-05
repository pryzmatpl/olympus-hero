#!/usr/bin/env node
/**
 * MCP stdio server for Agent Drive: verify tokens, read room state, queue proposals (human approval still required in-app).
 * Requires MONGO_URI (and JWT not needed). Run: `node server/mcp/agentDriveServer.mjs`
 */
import dotenv from 'dotenv';
dotenv.config();

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { verifyAgentDriveToken } from '../agentAuth.js';
import { getSharedStoryRoom, mutateSharedStoryRoom } from '../sharedStory.js';
import { moderateProposalText } from '../moderation.js';

const mcp = new McpServer(
  { name: 'olympus-hero-agent-drive', version: '1.0.0' },
  { instructions: 'Use agent drive token (adh_...) from the hero owner. Proposals require owner approval in the web UI.' }
);

function textJson(obj) {
  return { content: [{ type: 'text', text: JSON.stringify(obj, null, 2) }] };
}

mcp.registerTool(
  'verify_agent_token',
  {
    description: 'Validate an Agent Drive token and return hero / owner scope.',
    inputSchema: z.object({
      token: z.string().describe('Full plaintext token including adh_ prefix'),
    }),
  },
  async ({ token }) => {
    const v = await verifyAgentDriveToken(token);
    if (!v) return textJson({ ok: false });
    return textJson({
      ok: true,
      heroId: v.heroId,
      ownerUserId: v.ownerUserId,
      roomId: v.roomId,
    });
  }
);

mcp.registerTool(
  'get_room_state',
  {
    description: 'Load shared story room metadata and recent messages (truncated).',
    inputSchema: z.object({
      roomId: z.string().uuid(),
    }),
  },
  async ({ roomId }) => {
    const room = await getSharedStoryRoom(roomId);
    if (!room) return textJson({ ok: false, error: 'not_found' });
    const tail = (room.messages || []).slice(-30).map((m) => ({
      id: m.id,
      sender: m.sender?.name,
      isSystem: m.sender?.id === 'system',
      preview: String(m.content || '').replace(/<[^>]+>/g, '').slice(0, 200),
      timestamp: m.timestamp,
    }));
    return textJson({
      ok: true,
      roomId: room.id,
      title: room.title,
      mode: room.mode,
      agentDriveEnabled: !!room.agentDriveEnabled,
      ownerUserId: room.ownerUserId,
      pendingAgentActions: room.pendingAgentActions || [],
      recentMessages: tail,
    });
  }
);

mcp.registerTool(
  'propose_hero_action',
  {
    description:
      'Queue a hero action for human approval (same as socket agent_action_proposed). Owner must approve in the app.',
    inputSchema: z.object({
      agentToken: z.string(),
      roomId: z.string().uuid(),
      actionText: z.string().max(4000),
    }),
  },
  async ({ agentToken, roomId, actionText }) => {
    const v = await verifyAgentDriveToken(agentToken);
    if (!v) return textJson({ ok: false, error: 'invalid_token' });
    const mod = moderateProposalText(actionText);
    if (!mod.ok) return textJson({ ok: false, error: mod.reason });

    const room = await getSharedStoryRoom(roomId);
    if (!room) return textJson({ ok: false, error: 'room_not_found' });
    if (!room.agentDriveEnabled) return textJson({ ok: false, error: 'agent_drive_disabled' });
    const allowed = room.participants.some((p) => p.id === v.heroId);
    if (!allowed) return textJson({ ok: false, error: 'hero_not_participant' });

    const proposalId = uuidv4();
    await mutateSharedStoryRoom(roomId, (r) => {
      if (!Array.isArray(r.pendingAgentActions)) r.pendingAgentActions = [];
      r.pendingAgentActions.push({
        id: proposalId,
        heroId: v.heroId,
        tokenId: v.tokenRecord.id,
        actionText: mod.text,
        status: 'pending',
        createdAt: new Date(),
      });
    });

    return textJson({
      ok: true,
      proposalId,
      message: 'Queued for owner approval in the web client.',
    });
  }
);

mcp.registerTool(
  'get_action_status',
  {
    description: 'Look up a pending or resolved proposal by id in a room.',
    inputSchema: z.object({
      roomId: z.string().uuid(),
      proposalId: z.string().uuid(),
    }),
  },
  async ({ roomId, proposalId }) => {
    const room = await getSharedStoryRoom(roomId);
    if (!room) return textJson({ ok: false, error: 'not_found' });
    const p = (room.pendingAgentActions || []).find((x) => x.id === proposalId);
    return textJson({ ok: !!p, proposal: p || null });
  }
);

const transport = new StdioServerTransport();
await mcp.connect(transport);
