import { NextRequest, NextResponse } from "next/server";
import { generateChatResponse, parseSimpleQuery, checkUsageLimit } from "@/lib/llm";
import { checkMessageSafety } from "@/lib/prompt-safety";
import type { ChatMessage } from "@/lib/llm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, tier = "FREE", queriesUsedToday = 0 } = body as {
      messages: ChatMessage[];
      tier?: string;
      queriesUsedToday?: number;
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    // Check safety of the last message
    const lastMessage = messages[messages.length - 1];
    const safetyCheck = checkMessageSafety(lastMessage.content);
    if (!safetyCheck.safe) {
      return NextResponse.json(
        { error: safetyCheck.reason || "Message rejected by safety filter" },
        { status: 400 }
      );
    }

    // Check usage limits
    const usage = checkUsageLimit(queriesUsedToday, tier as "FREE" | "PRO" | "ADMIN");
    if (!usage.canQuery) {
      return NextResponse.json(
        { error: "Daily query limit reached. Upgrade to PRO for more queries.", usage },
        { status: 429 }
      );
    }

    // Try simple pattern matching first
    const simpleQuery = parseSimpleQuery(lastMessage.content);

    // If we have an API key, use the LLM
    if (process.env.ANTHROPIC_API_KEY) {
      const context = simpleQuery
        ? `User query parsed as: ${JSON.stringify(simpleQuery)}`
        : undefined;
      const response = await generateChatResponse(messages, context);
      return NextResponse.json({
        data: response,
        usage: { ...usage, queriesUsed: usage.queriesUsed + 1 },
      });
    }

    // Fallback: return a structured response without LLM
    const fallbackMessage = simpleQuery
      ? `I understand you're asking about ${simpleQuery.explanation}. This would query our ${simpleQuery.sport.toUpperCase()} database for ${simpleQuery.queryType} data. Connect an Anthropic API key for full natural language responses.`
      : `I can help you search NFL, CFB, and CBB statistics. Try asking about team records, comparisons, or rankings. Connect an Anthropic API key for full natural language search.`;

    return NextResponse.json({
      data: {
        message: fallbackMessage,
        queryPlan: simpleQuery ?? undefined,
      },
      usage: { ...usage, queriesUsed: usage.queriesUsed + 1 },
    });
  } catch (err) {
    console.error("POST /api/chat error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
