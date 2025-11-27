"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useChat } from "@ai-sdk/react";
import {
  ArrowUp,
  Loader2,
  Plus,
  Square,
  Clapperboard,
  Sparkles,
} from "lucide-react";
import { MessageWall } from "@/components/messages/message-wall";
import { ChatHeader, ChatHeaderBlock } from "@/app/parts/chat-header";
import { UIMessage } from "ai";
import { useEffect, useState, useRef } from "react";
import {
  AI_NAME,
  CLEAR_CHAT_TEXT,
  OWNER_NAME,
  WELCOME_MESSAGE,
} from "@/config";
import Link from "next/link";

const formSchema = z.object({
  message: z
    .string()
    .min(1, "Message cannot be empty.")
    .max(2000, "Message must be at most 2000 characters."),
});

const STORAGE_KEY = "chat-messages";

type StorageData = {
  messages: UIMessage[];
  durations: Record<string, number>;
};

const QUICK_PROMPTS: { label: string; prompt: string }[] = [
  {
    label: "Light comedy",
    prompt: "Recommend a light, funny comedy to watch after a long day.",
  },
  {
    label: "Tense thriller",
    prompt: "Suggest a gripping, edge-of-the-seat thriller with great suspense.",
  },
  {
    label: "Emotional drama",
    prompt: "Give me a heartfelt drama that focuses on strong characters.",
  },
  {
    label: "Feel-good family movie",
    prompt: "Recommend a warm, family-friendly movie for a cozy evening.",
  },
];

const loadMessagesFromStorage = (): {
  messages: UIMessage[];
  durations: Record<string, number>;
} => {
  if (typeof window === "undefined") return { messages: [], durations: {} };
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { messages: [], durations: {} };

    const parsed = JSON.parse(stored);
    return {
      messages: parsed.messages || [],
      durations: parsed.durations || {},
    };
  } catch (error) {
    console.error("Failed to load messages from localStorage:", error);
    return { messages: [], durations: {} };
  }
};

const saveMessagesToStorage = (
  messages: UIMessage[],
  durations: Record<string, number>
) => {
  if (typeof window === "undefined") return;
  try {
    const data: StorageData = { messages, durations };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save messages to localStorage:", error);
  }
};

export default function Chat() {
  const [isClient, setIsClient] = useState(false);
  const [durations, setDurations] = useState<Record<string, number>>({});
  const welcomeMessageShownRef = useRef<boolean>(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const stored =
    typeof window !== "undefined"
      ? loadMessagesFromStorage()
      : { messages: [], durations: {} };

  const [initialMessages] = useState<UIMessage[]>(stored.messages);

  const { messages, sendMessage, status, stop, setMessages } = useChat({
    messages: initialMessages,
  });

  useEffect(() => {
    setIsClient(true);
    setDurations(stored.durations);
    setMessages(stored.messages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isClient) {
      saveMessagesToStorage(messages, durations);
    }
  }, [durations, messages, isClient]);

  const handleDurationChange = (key: string, duration: number) => {
    setDurations((prevDurations) => {
      const newDurations = { ...prevDurations };
      newDurations[key] = duration;
      return newDurations;
    });
  };

  useEffect(() => {
    if (
      isClient &&
      initialMessages.length === 0 &&
      !welcomeMessageShownRef.current
    ) {
      const welcomeMessage: UIMessage = {
        id: `welcome-${Date.now()}`,
        role: "assistant",
        parts: [
          {
            type: "text",
            text: WELCOME_MESSAGE,
          },
        ],
      };
      setMessages([welcomeMessage]);
      saveMessagesToStorage([welcomeMessage], {});
      welcomeMessageShownRef.current = true;
    }
  }, [isClient, initialMessages.length, setMessages]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: "",
    },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    const trimmed = data.message.trim();
    if (!trimmed) return;
    sendMessage({ text: trimmed });
    form.reset();
  }

  function clearChat() {
    const newMessages: UIMessage[] = [];
    const newDurations: Record<string, number> = {};
    setMessages(newMessages);
    setDurations(newDurations);
    saveMessagesToStorage(newMessages, newDurations);
    toast.success("Chat cleared");
  }

  const handleQuickPromptClick = (prompt: string) => {
    // Only paste the text into the input; user can press Enter to send.
    form.setValue("message", prompt, { shouldDirty: true });
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="cine-bg flex min-h-screen items-center justify-center font-sans">
      <main className="w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
        {/* Top heading */}
        <div className="mb-6 flex flex-col gap-3 text-center sm:text-left">
          <div className="cine-badge inline-flex self-center rounded-full sm:self-start">
            <div className="flex items-center gap-2 rounded-full bg-background/90 px-3 py-1 text-[0.7rem] font-medium tracking-tight text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span>CineMatch AI</span>
            </div>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Smart movie recommendations tailored to you.
          </h1>
          <p className="mx-auto max-w-xl text-xs text-muted-foreground sm:text-sm">
            Ask CineMatch AI for a comedy, thriller, drama, or anything in
            between. It will respond in a tone that matches the mood you're
            asking for.
          </p>
        </div>

        {/* Chat card */}
        <div className="cine-card flex h-[min(75vh,640px)] flex-col border border-border/60">
          {/* Header */}
          <div className="border-b border-border/60 px-4 py-3">
            <ChatHeader>
              <ChatHeaderBlock className="justify-start gap-2">
                <Clapperboard className="h-4 w-4 text-primary" />
                <p className="text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground">
                  CINEMATCH SESSION
                </p>
              </ChatHeaderBlock>
              <ChatHeaderBlock className="justify-center">
                <p className="text-sm font-medium text-foreground">
                  Chat with {AI_NAME}
                </p>
              </ChatHeaderBlock>
              <ChatHeaderBlock className="justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="cursor-pointer border-border/70 bg-background/60 text-xs"
                  onClick={clearChat}
                >
                  <Plus className="mr-1 h-3 w-3" />
                  {CLEAR_CHAT_TEXT}
                </Button>
              </ChatHeaderBlock>
            </ChatHeader>
          </div>

          {/* Messages */}
          <div className="relative flex-1 overflow-y-auto px-4 py-4">
            <div className="flex min-h-full flex-col items-center justify-end">
              {isClient ? (
                <>
                  <MessageWall
                    messages={messages}
                    status={status}
                    durations={durations}
                    onDurationChange={handleDurationChange}
                  />
                  {status === "submitted" && (
                    <div className="mt-2 flex w-full max-w-3xl justify-start">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </>
              ) : (
                <div className="flex w-full max-w-2xl justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
          </div>

          {/* Input & quick prompts */}
          <div className="border-t border-border/60 px-4 pb-4 pt-3">
            {/* Quick prompt row */}
            <div className="mb-2 flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((qp) => (
                <button
                  key={qp.label}
                  type="button"
                  className="single-char-link text-[0.7rem] sm:text-xs"
                  onClick={() => handleQuickPromptClick(qp.prompt)}
                >
                  <Sparkles className="mr-1 h-3 w-3 text-primary" />
                  {qp.label}
                </button>
              ))}
            </div>

            {/* Input */}
            <form id="chat-form" onSubmit={form.handleSubmit(onSubmit)}>
              <FieldGroup>
                <Controller
                  name="message"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel
                        htmlFor="chat-form-message"
                        className="sr-only"
                      >
                        Message
                      </FieldLabel>
                      <div className="relative h-13">
                        <Input
                          {...field}
                          id="chat-form-message"
                          ref={inputRef}
                          className="h-13 rounded-full border border-[#3a2114] bg-[#27140d] px-5 pr-14 text-sm text-[#fde6bf] placeholder:text-[#c69a6a] shadow-sm"
                          placeholder="Describe what you want to watch..."
                          disabled={status === "streaming"}
                          aria-invalid={fieldState.invalid}
                          autoComplete="off"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              form.handleSubmit(onSubmit)();
                            }
                          }}
                        />
                        {(status === "ready" || status === "error") && (
                          <Button
                            className="absolute right-2 top-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                            type="submit"
                            disabled={!field.value.trim()}
                            size="icon"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                        )}
                        {(status === "streaming" ||
                          status === "submitted") && (
                          <Button
                            className="absolute right-2 top-1.5 rounded-full bg-muted text-foreground hover:bg-muted/80"
                            size="icon"
                            type="button"
                            onClick={() => {
                              stop();
                            }}
                          >
                            <Square className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </Field>
                  )}
                />
              </FieldGroup>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 flex w-full items-center justify-center text-[0.7rem] text-muted-foreground">
          © {new Date().getFullYear()} {OWNER_NAME}
          <span className="mx-1">·</span>
          <Link href="/terms" className="underline">
            Terms of Use
          </Link>
        </div>
      </main>
    </div>
  );
}
