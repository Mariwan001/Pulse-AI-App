'use server';

/**
 * @fileOverview This file defines a Genkit flow for simplifying a given text.
 *
 * - simplifyText - A function that takes a text string and returns a ReadableStream of the simplified text.
 * - SimplifyTextInput - The input type for the simplifyText function.
 */

import { ai } from '@/ai/groq';
import { z } from 'zod';
import type { StreamChunk } from '@/lib/types';

const SimplifyTextInputSchema = z.object({
  originalText: z.string().describe('The text to be simplified by the AI.'),
});
export type SimplifyTextInput = z.infer<typeof SimplifyTextInputSchema>;

// The prompt template string.
const PROMPT_TEMPLATE = `You are an expert simplifier who makes complex things ULTRA ULTRA SIMPLE. Your goal is to take the 'Original Text' provided below and rewrite it using completely different words and explanations that a 5-year-old could understand.

Original Text:
{{{originalText}}}

**CRITICAL RULES:**
- Use the MOST basic, everyday words possible
- Replace EVERY technical term with simple alternatives
- Use completely different sentence structures
- Break everything into tiny, digestible pieces
- Use analogies and examples from everyday life
- Avoid ANY jargon or complex language
- Make it conversational and friendly
- DO NOT use any of the same terminology from the original
- Think of it as explaining to someone who has never heard of this topic before
- Use simple analogies like "it's like..." or "imagine if..."
- Keep sentences short and clear
- Use active voice and simple verbs

Your ultra-simplified version should sound like you're talking to a friend over coffee, using the simplest words possible:`;

export async function simplifyText(
  input: SimplifyTextInput
): Promise<ReadableStream<StreamChunk>> {
  const renderedPrompt = PROMPT_TEMPLATE.replace("{{{originalText}}}", input.originalText);

  const stream = ai.generateStream({
    messages: [
      {
        role: 'user',
        content: [{ text: renderedPrompt }],
      },
    ],
  });

  return new ReadableStream<StreamChunk>({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (chunk.type === 'text' && chunk.content) {
            controller.enqueue({ type: 'text', content: chunk.content });
          }
        }
      } catch (error) {
        console.error("Error during stream generation (simplifyText):", error);
        controller.enqueue({ type: 'error', content: 'Failed to simplify text.' });
      } finally {
        controller.close();
      }
    },
    cancel(reason) {
      console.log("Stream cancelled (simplifyText):", reason);
    }
  });
}
