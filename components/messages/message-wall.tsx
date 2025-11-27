"use client";

import type { UIMessage } from "ai";
import { cn } from "@/lib/utils";

type MessageWallProps = {
  messages: UIMessage[];
  status?: string;
  durations?: Record<string, number>;
  onDurationChange?: (id: string, duration: number) => void;
};

function getMessageText(message: UIMessage): string {
  // Join all text parts into one string
  if (!message.parts) return "";
  return message.parts
    .map((part) => {
      if (part.type === "text") return part.text ?? "";
      return "";
    })
    .join(" ")
    .trim();
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
                "max-w-[80%] text-sm leading-relaxed",
                isUser
                  ? // USER BUBBLE – no more white blob
                    "rounded-3xl bg-[#2a1810] px-4 py-2 text-[#fde6bf]"
                  : // ASSISTANT BUBBLE
                    "rounded-3xl border border-[#3a2114] bg-transparent px-4 py-2 text-foreground"
              )}
            >
              {text}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default MessageWall;
