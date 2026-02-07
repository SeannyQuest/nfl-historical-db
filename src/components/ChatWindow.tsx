"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatWindowProps {
  tier?: string;
}

export default function ChatWindow({ tier = "FREE" }: ChatWindowProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Welcome to GridIron Intel AI! Ask me anything about NFL, College Football, or College Basketball stats.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [queriesUsed, setQueriesUsed] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          tier,
          queriesUsedToday: queriesUsed,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: data.error || "Something went wrong. Please try again.",
          timestamp: new Date(),
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: data.data.message,
          timestamp: new Date(),
        }]);
        if (data.usage) {
          setQueriesUsed(data.usage.queriesUsed);
        }
      }
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Network error. Please check your connection and try again.",
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  }

  const suggestedQuestions = [
    "Top 10 NFL teams by wins",
    "Chiefs vs Eagles comparison",
    "College football conference rankings",
    "March Madness biggest upsets",
  ];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#d4af37] to-[#b8941e] text-[#0a0f1a] shadow-lg transition-transform hover:scale-110"
        aria-label="Open AI Chat"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex h-[500px] w-[380px] flex-col rounded-xl border border-[#1e2a45] bg-[#141b2d] shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1e2a45] px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-[#d4af37]" />
          <span className="text-sm font-semibold text-white">GridIron Intel AI</span>
          <span className="rounded bg-[#1e2a45] px-1.5 py-0.5 text-[10px] text-[#8899aa]">{tier}</span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-[#8899aa] transition-colors hover:text-white"
          aria-label="Close chat"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
              msg.role === "user"
                ? "bg-[#d4af37] text-[#0a0f1a]"
                : "bg-[#1e2a45] text-[#e0e0e0]"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-lg bg-[#1e2a45] px-3 py-2 text-sm text-[#8899aa]">
              <span className="animate-pulse">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions (only show if few messages) */}
      {messages.length <= 1 && (
        <div className="border-t border-[#1e2a45] px-4 py-2">
          <p className="mb-1 text-[10px] uppercase tracking-wide text-[#8899aa]">Try asking</p>
          <div className="flex flex-wrap gap-1">
            {suggestedQuestions.map((q) => (
              <button
                key={q}
                onClick={() => setInput(q)}
                className="rounded-full border border-[#2a3a55] px-2 py-0.5 text-[11px] text-[#8899aa] transition-colors hover:border-[#d4af37] hover:text-[#d4af37]"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-[#1e2a45] px-4 py-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about any stat..."
            disabled={loading}
            className="flex-1 rounded border border-[#2a3a55] bg-[#0d1321] px-3 py-2 text-sm text-[#e0e0e0] outline-none placeholder:text-[#556677] focus:border-[#d4af37] disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded bg-gradient-to-br from-[#d4af37] to-[#b8941e] px-3 py-2 text-sm font-bold text-[#0a0f1a] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
