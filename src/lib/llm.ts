/**
 * LLM integration for natural language stat queries.
 * Translates user questions into structured query plans.
 */

import Anthropic from "@anthropic-ai/sdk";

export interface QueryPlan {
  sport: "nfl" | "cfb" | "cbb";
  queryType: "team_stats" | "game_search" | "comparison" | "trend" | "ranking" | "general";
  parameters: Record<string, string | number | boolean>;
  explanation: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  message: string;
  queryPlan?: QueryPlan;
  sources?: string[];
}

const SYSTEM_PROMPT = `You are GridIron Intel's AI assistant, specializing in NFL, College Football (CFB), and College Basketball (CBB) statistics and analytics.

You have access to a database with the following data:
- NFL: Games from multiple seasons including scores, quarter-by-quarter data, turnovers, betting lines, weather, and team records
- CFB: College football games with scores, conference data, and playoff information
- CBB: College basketball games with scores, conference data, and tournament bracket data

When a user asks a question, respond with:
1. A clear, concise answer based on the data
2. Relevant statistics to support your answer
3. Any interesting context or insights

If you need to structure a query, output a JSON block with the query plan.
Keep responses focused, data-driven, and engaging for sports fans.

Format numbers nicely (percentages, decimals, etc.) and use proper team names.`;

// Create client lazily to avoid errors when API key is not set
let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY environment variable is not set");
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

export async function generateChatResponse(
  messages: ChatMessage[],
  context?: string
): Promise<ChatResponse> {
  const anthropic = getClient();

  const systemPrompt = context
    ? `${SYSTEM_PROMPT}\n\nCurrent data context:\n${context}`
    : SYSTEM_PROMPT;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: systemPrompt,
    messages: messages.map(m => ({
      role: m.role,
      content: m.content,
    })),
  });

  const textContent = response.content.find(c => c.type === "text");
  const message = textContent?.text ?? "I couldn't generate a response. Please try again.";

  // Try to extract query plan from response if present
  let queryPlan: QueryPlan | undefined;
  const jsonMatch = message.match(/```json\n([\s\S]*?)\n```/);
  if (jsonMatch) {
    try {
      queryPlan = JSON.parse(jsonMatch[1]) as QueryPlan;
    } catch {
      // Not valid JSON, ignore
    }
  }

  return { message, queryPlan };
}

// Parse a natural language query into a structured query plan (without LLM, for simple patterns)
export function parseSimpleQuery(query: string): QueryPlan | null {
  const lower = query.toLowerCase();

  // Team record patterns
  const teamRecordMatch = lower.match(/(?:what is|what's|show me) (?:the )?(.+?)(?:'s)? record/);
  if (teamRecordMatch) {
    return {
      sport: detectSport(lower),
      queryType: "team_stats",
      parameters: { team: teamRecordMatch[1].trim(), stat: "record" },
      explanation: `Looking up team record for ${teamRecordMatch[1].trim()}`,
    };
  }

  // Comparison patterns
  const vsMatch = lower.match(/(.+?) (?:vs|versus|against|compared to) (.+)/);
  if (vsMatch) {
    return {
      sport: detectSport(lower),
      queryType: "comparison",
      parameters: { team1: vsMatch[1].trim(), team2: vsMatch[2].trim() },
      explanation: `Comparing ${vsMatch[1].trim()} vs ${vsMatch[2].trim()}`,
    };
  }

  // Ranking patterns
  if (/(?:top|best|worst|rank|ranking)/.test(lower)) {
    const countMatch = lower.match(/top (\d+)/);
    return {
      sport: detectSport(lower),
      queryType: "ranking",
      parameters: { count: countMatch ? parseInt(countMatch[1]) : 10 },
      explanation: "Looking up rankings",
    };
  }

  return null;
}

export function detectSport(query: string): "nfl" | "cfb" | "cbb" {
  if (/college football|cfb|ncaa football|ncaaf/i.test(query)) return "cfb";
  if (/college basketball|cbb|ncaa basketball|ncaab|march madness/i.test(query)) return "cbb";
  return "nfl"; // default
}

// Usage tracking
export interface UsageRecord {
  userId: string;
  queriesUsed: number;
  dailyLimit: number;
  canQuery: boolean;
}

export function checkUsageLimit(
  queriesUsedToday: number,
  tier: "FREE" | "PRO" | "ADMIN"
): UsageRecord & { remaining: number } {
  const limits: Record<string, number> = {
    FREE: 5,
    PRO: 100,
    ADMIN: 1000,
  };
  const dailyLimit = limits[tier] ?? 5;
  const remaining = Math.max(0, dailyLimit - queriesUsedToday);

  return {
    userId: "",
    queriesUsed: queriesUsedToday,
    dailyLimit,
    canQuery: remaining > 0,
    remaining,
  };
}
