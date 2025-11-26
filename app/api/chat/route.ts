// app/api/chat/route.ts

import { NextRequest } from "next/server";
import { streamText, tool } from "ai";
import { z } from "zod";

import { MODEL } from "@/config";
import { SYSTEM_PROMPT } from "@/prompts";
import { searchMoviesByQuery } from "@/lib/tmdb";
import {
  loadUserProfile,
  saveUserProfile,
} from "@/lib/pineconeUserProfiles";

// (You can add: export const runtime = "nodejs";  if you ever need it,
// but it's not required for this TypeScript fix.)

export async function POST(req: NextRequest) {
  const body = await req.json();
  const messages = body.messages ?? [];

  const result = await streamText({
    model: MODEL,
    system: SYSTEM_PROMPT,
    messages,

    // -------- TOOLS AVAILABLE TO THE MODEL --------
    tools: {
      tmdb_search_movies: tool({
        description:
          "Search TMDb for movies that match a natural-language description.",
        inputSchema: z.object({
          query: z
            .string()
            .describe(
              "Natural language description of desired movies, e.g. 'slow-burn sci-fi thriller like Arrival'"
            ),
        }),
        // This function is what actually runs when the model calls the tool
        execute: async ({ query }) => {
          const movies = await searchMoviesByQuery(query);
          return { movies };
        },
      }),

      load_user_profile: tool({
        description:
          "Load a user's saved profile (tastes and watch history) from Pinecone by their name.",
        inputSchema: z.object({
          userName: z
            .string()
            .describe("The user's name (case-insensitive)."),
        }),
        execute: asy
