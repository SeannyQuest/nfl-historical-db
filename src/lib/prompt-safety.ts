const BLOCKED_PATTERNS = [
  /ignore\s+(previous|above|all)\s+(instructions|prompts)/i,
  /you\s+are\s+now\s+/i,
  /act\s+as\s+(if|though)\s+you/i,
  /pretend\s+you\s+are/i,
  /system\s*prompt/i,
  /\bDAN\b/,
  /jailbreak/i,
  /bypass\s+(safety|filter|restriction)/i,
  /reveal\s+(your|the)\s+(system|initial)\s+prompt/i,
  /what\s+are\s+your\s+instructions/i,
];

const MAX_MESSAGE_LENGTH = 2000;

export interface SafetyCheckResult {
  safe: boolean;
  reason?: string;
  sanitizedContent?: string;
}

export function checkMessageSafety(content: string): SafetyCheckResult {
  // Length check
  if (content.length > MAX_MESSAGE_LENGTH) {
    return {
      safe: false,
      reason: `Message too long (${content.length} chars, max ${MAX_MESSAGE_LENGTH})`,
    };
  }

  // Empty check
  if (!content.trim()) {
    return { safe: false, reason: "Empty message" };
  }

  // Pattern matching
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(content)) {
      return {
        safe: false,
        reason: "Message contains restricted content",
      };
    }
  }

  // Sanitize: strip any potential markdown injection or code blocks trying to execute
  const sanitized = content
    .replace(/```[\s\S]*?```/g, "[code block removed]")
    .replace(/<script[\s\S]*?<\/script>/gi, "[script removed]")
    .replace(/<[^>]+>/g, ""); // Strip HTML

  return {
    safe: true,
    sanitizedContent: sanitized,
  };
}

export function sanitizeResponse(response: string): string {
  // Remove any accidentally leaked system prompt content
  return response
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/javascript:/gi, "");
}
