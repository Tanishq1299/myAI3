"use client";

import * as React from "react";
import type { UIMessage } from "ai";
import { cn } from "@/lib/utils";

type MessageWallProps = {
  messages: UIMessage[];
  status?: string;
  durations?: Record<string, number>;
  onDurationChange?: (id: string, duration: number) => void;
};

// Extract plain text from the message parts
function getMessageText(message: UIMessage): string {
  if (!message.parts) return "";
  return message.parts
    .map((part) => {
      if (part.type === "text") return part.text ?? "";
      return "";
    })
    .join("")
    .trim();
}

// Turn URLs inside the text into clickable <a> links
function renderTextWithLinks(text: string): React.ReactNode[] {
  const urlRegex = /(https?:\/\/[^\s)]+)|(www\.[^\s)]+)/g;
  const nodes: React.ReactNode[] = [];

  let lastIndex = 0;
  let matchIndex = 0;

  for (const match of text.matchAll(urlRegex)) {
    const matchText = match[0];
    const start = match.index ?? 0;

    // Text before the URL
    if (start > lastIndex) {
      nodes.push(text.slice(lastIndex, start));
    }

    // Normalize URL (add https:// if missing)
    const href = matchText.startsWith("http")
      ? matchText
      : `https://${matchText}`;

    nodes.push(
      <a
        key={`link-${matchIndex++}`}
        href={href}
        target="_blank"
        rel="noreferrer"
        className="underline text-primary break-all"
      >
        {matchText}
      </a>
    );

    lastIndex = start + matchText.length;
  }

  // Remaining text after last URL
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

export function MessageWall({
  messages,
}: MessageWallProps) {
  if (!messages || messages.length === 0) {
    return null;
  }

  return (
    <div className="flex w-full max-w-3xl flex-col gap-3">
      {messages.map((message) => {
        const isUser = message.role === "user";
        const text = getMessageText(message);

        if (!text) return null;

        return (
          <div
            key={message.id}
            className={cn(
              "flex w-full",
              isUser ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[80%] text-sm leading-relaxed whitespace-pre-wrap",
                isUser
                  ? // USER BUBBLE – dark brown, readable text, no white blob
                    "rounded-3xl bg-[#2a1810] px-4 py-2 text-[#fde6bf]"
                  : // ASSISTANT BUBBLE – outlined, respects formatting
                    "rounded-3xl border border-[#3a2114] bg-transparent px-4 py-2 text-foreground"
              )}
            >
              {renderTextWithLinks(text)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default MessageWall;
