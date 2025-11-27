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

/**
 * Turn plain text into React nodes, with clickable links.
 */
function renderTextWithLinks(text: string, keyPrefix: string): React.ReactNode[] {
  const urlRegex = /(https?:\/\/[^\s)]+)|(www\.[^\s)]+)/g;
  const nodes: React.ReactNode[] = [];

  let lastIndex = 0;
  let matchIndex = 0;

  for (const match of text.matchAll(urlRegex)) {
    const matchText = match[0];
    const start = match.index ?? 0;

    if (start > lastIndex) {
      nodes.push(
        <React.Fragment key={`${keyPrefix}-t-${matchIndex}-pre`}>
          {text.slice(lastIndex, start)}
        </React.Fragment>
      );
    }

    const href = matchText.startsWith("http")
      ? matchText
      : `https://${matchText}`;

    nodes.push(
      <a
        key={`${keyPrefix}-link-${matchIndex}`}
        href={href}
        target="_blank"
        rel="noreferrer"
        className="underline text-primary break-all"
      >
        {matchText}
      </a>
    );

    lastIndex = start + matchText.length;
    matchIndex++;
  }

  if (lastIndex < text.length) {
    nodes.push(
      <React.Fragment key={`${keyPrefix}-t-final`}>
        {text.slice(lastIndex)}
      </React.Fragment>
    );
  }

  return nodes;
}

/**
 * Render a single line of markdown-ish text:
 * - converts **bold** segments to <strong>
 * - still makes URLs clickable
 */
function renderInlineMarkdown(line: string, keyPrefix: string): React.ReactNode[] {
  const boldRegex = /\*\*(.+?)\*\*/g;
  const nodes: React.ReactNode[] = [];

  let lastIndex = 0;
  let boldIndex = 0;

  for (const match of line.matchAll(boldRegex)) {
    const matchText = match[0];
    const boldText = match[1];
    const start = match.index ?? 0;

    if (start > lastIndex) {
      const chunk = line.slice(lastIndex, start);
      nodes.push(
        <React.Fragment key={`${keyPrefix}-chunk-${boldIndex}`}>
          {renderTextWithLinks(chunk, `${keyPrefix}-chunk-${boldIndex}`)}
        </React.Fragment>
      );
    }

    nodes.push(
      <strong key={`${keyPrefix}-bold-${boldIndex}`} className="font-semibold">
        {renderTextWithLinks(boldText, `${keyPrefix}-bold-${boldIndex}`)}
      </strong>
    );

    lastIndex = start + matchText.length;
    boldIndex++;
  }

  if (lastIndex < line.length) {
    const chunk = line.slice(lastIndex);
    nodes.push(
      <React.Fragment key={`${keyPrefix}-chunk-final`}>
        {renderTextWithLinks(chunk, `${keyPrefix}-chunk-final`)}
      </React.Fragment>
    );
  }

  return nodes;
}

/**
 * Render a full markdown-ish block:
 * - blank lines → spacing
 * - '---' → divider
 * - other lines → paragraphs with inline markdown + links
 */
function renderMarkdownBlock(text: string, keyPrefix: string): React.ReactNode {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trimEnd();

    if (!line) {
      // Empty line → small vertical gap
      elements.push(
        <div key={`${keyPrefix}-gap-${idx}`} className="h-1" />
      );
      return;
    }

    if (line.trim() === "---") {
      elements.push(
        <div
          key={`${keyPrefix}-hr-${idx}`}
          className="my-1 h-px w-full bg-border/60"
        />
      );
      return;
    }

    elements.push(
      <p
        key={`${keyPrefix}-p-${idx}`}
        className="text-sm leading-relaxed"
      >
        {renderInlineMarkdown(line, `${keyPrefix}-line-${idx}`)}
      </p>
    );
  });

  return <>{elements}</>;
}

/**
 * Renders all parts of one message:
 * - text parts (with lightweight markdown + links)
 * - tool-call / tool-result parts as small status lines
 */
function renderMessageParts(message: UIMessage): React.ReactNode {
  const parts = (message.parts ?? []) as any[];

  if (!parts.length && (message as any).content) {
    return renderMarkdownBlock(
      String((message as any).content),
      `${message.id}-legacy`
    );
  }

  if (!parts.length) return null;

  return parts.map((part: any, index: number) => {
    if (part.type === "text") {
      const text = part.text ?? "";
      if (!text) return null;

      return (
        <div key={`text-${index}`} className="space-y-1">
          {renderMarkdownBlock(text, `${message.id}-text-${index}`)}
        </div>
      );
    }

    if (part.type === "tool-call") {
      const toolName =
        part.toolName || part.name || (part.tool?.name ?? "tool");
      let argSnippet = "";

      try {
        if (part.args) {
          const raw =
            typeof part.args === "string"
              ? part.args
              : JSON.stringify(part.args);
          argSnippet = raw.length > 80 ? raw.slice(0, 77) + "..." : raw;
        }
      } catch {
        // ignore parsing issues
      }

      return (
        <div
          key={`tool-call-${index}`}
          className="mt-1 text-[0.7rem] italic text-muted-foreground"
        >
          🔧 Using <span className="font-medium">{toolName}</span>
          {argSnippet ? ` – ${argSnippet}` : ""}
        </div>
      );
    }

    if (part.type === "tool-result") {
      const toolName =
        part.toolName || part.name || (part.tool?.name ?? "tool");
      return (
        <div
          key={`tool-result-${index}`}
          className="mt-1 text-[0.7rem] italic text-muted-foreground"
        >
          ✅ Got results from{" "}
          <span className="font-medium">{toolName}</span>
        </div>
      );
    }

    if (part.type === "reasoning") {
      // hide reasoning by default to avoid clutter
      return null;
    }

    return null;
  });
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

        if (!message.parts || message.parts.length === 0) {
          return null;
        }

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
                "max-w-[80%] text-sm leading-relaxed space-y-1",
                isUser
                  ? "rounded-3xl bg-[#2a1810] px-4 py-2 text-[#fde6bf]"
                  : "rounded-3xl border border-[#3a2114] bg-transparent px-4 py-2 text-foreground"
              )}
            >
              {isUser ? (
                // For user messages, just show their text with line breaks preserved
                <p className="whitespace-pre-wrap">
                  {renderTextWithLinks(
                    (message.parts[0] as any).text ?? "",
                    `${message.id}-user`
                  )}
                </p>
              ) : (
                renderMessageParts(message)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default MessageWall;
