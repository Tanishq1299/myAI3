import { openai } from "@ai-sdk/openai";
import { fireworks } from "@ai-sdk/fireworks";
import { wrapLanguageModel, extractReasoningMiddleware } from "ai";

//
// MODEL – still pure OpenAI as required
//
export const MODEL = openai("gpt-4.1");

// If you want to use a Fireworks model, uncomment the following code and set the FIREWORKS_API_KEY in Vercel
// NOTE: Use middleware when the reasoning tag is different than think. (Use ChatGPT to help you understand the middleware)
// export const MODEL = wrapLanguageModel({
//     model: fireworks('fireworks/deepseek-r1-0528'),
//     middleware: extractReasoningMiddleware({ tagName: 'think' }), // Use this only when using Deepseek
// });

//
// DATE/TIME STRING FOR PROMPT
//
function getDateAndTime(): string {
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });
    const timeStr = now.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
    });
    return `The day today is ${dateStr} and the time right now is ${timeStr}.`;
}

export const DATE_AND_TIME = getDateAndTime();

//
// BRANDING
//
export const AI_NAME = "CineMatch AI";
export const OWNER_NAME = "Tanishq Mengi & Swagatika Dash";

export const WELCOME_MESSAGE = `Hello! I'm ${AI_NAME}, a personalized movie assistant created by ${OWNER_NAME}.`;

export const CLEAR_CHAT_TEXT = "New";

//
// MODERATION MESSAGES (unchanged)
//
export const MODERATION_DENIAL_MESSAGE_SEXUAL =
    "I can't discuss explicit sexual content. Please ask something else.";
export const MODERATION_DENIAL_MESSAGE_SEXUAL_MINORS =
    "I can't discuss content involving minors in a sexual context. Please ask something else.";
export const MODERATION_DENIAL_MESSAGE_HARASSMENT =
    "I can't engage with harassing content. Please be respectful.";
export const MODERATION_DENIAL_MESSAGE_HARASSMENT_THREATENING =
    "I can't engage with threatening or harassing content. Please be respectful.";
export const MODERATION_DENIAL_MESSAGE_HATE =
    "I can't engage with hateful content. Please be respectful.";
export const MODERATION_DENIAL_MESSAGE_HATE_THREATENING =
    "I can't engage with threatening hate speech. Please be respectful.";
export const MODERATION_DENIAL_MESSAGE_ILLICIT =
    "I can't discuss illegal activities. Please ask something else.";
export const MODERATION_DENIAL_MESSAGE_ILLICIT_VIOLENT =
    "I can't discuss violent illegal activities. Please ask something else.";
export const MODERATION_DENIAL_MESSAGE_SELF_HARM =
    "I can't discuss self-harm. If you're struggling, please reach out to a mental health professional or crisis helpline.";
export const MODERATION_DENIAL_MESSAGE_SELF_HARM_INTENT =
    "I can't discuss self-harm intentions. If you're struggling, please reach out to a mental health professional or crisis helpline.";
export const MODERATION_DENIAL_MESSAGE_SELF_HARM_INSTRUCTIONS =
    "I can't provide instructions related to self-harm. If you're struggling, please reach out to a mental health professional or crisis helpline.";
export const MODERATION_DENIAL_MESSAGE_VIOLENCE =
    "I can't discuss violent content. Please ask something else.";
export const MODERATION_DENIAL_MESSAGE_VIOLENCE_GRAPHIC =
    "I can't discuss graphic violent content. Please ask something else.";
export const MODERATION_DENIAL_MESSAGE_DEFAULT =
    "Your message violates our guidelines. I can't answer that.";

// PINECONE CONFIG – still using the my-ai index from the tutorial.
// We will treat Pinecone as BOTH:
// 1) a movie knowledge base (synced from TMDb / your own docs)
// 2) a personalization store (user tastes, watch history metadata).
export const PINECONE_TOP_K = 40;
export const PINECONE_INDEX_NAME = "my-ai";

//
// TMDb CONFIG – central place for API + image base
// (TMDB_API_KEY must be set in Vercel + .env.local)
//
export const TMDB_API_KEY = process.env.TMDB_API_KEY ?? "";

if (!TMDB_API_KEY) {
    console.warn(
        "Warning: TMDB_API_KEY is not set – TMDb-based tools will not work."
    );
}

// Helpful constants for server-side TMDb tools
export const TMDB_API_BASE_URL = "https://api.themoviedb.org/3";
export const TMDB_POSTER_BASE_URL = "https://image.tmdb.org/t/p/w500";
