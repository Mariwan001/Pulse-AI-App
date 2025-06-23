'use server';

/**
 * @fileOverview This file defines a Genkit flow for expanding on a given text.
 *
 * - expandText - A function that takes a text string and returns a ReadableStream of the expanded text.
 * - ExpandTextInput - The input type for the expandText function.
 */

import { ai } from '@/ai/groq';
import { z } from 'zod';
import type { StreamChunk } from '@/lib/types';

const ExpandTextInputSchema = z.object({
  originalText: z.string().describe('The text to be expanded upon by the AI.'),
});
export type ExpandTextInput = z.infer<typeof ExpandTextInputSchema>;

const PROMPT_TEMPLATE = `You are an expert elaborator. Your goal is to take the 'Original Text' provided below and expand upon it, providing more detail, context, or further explanation.

Original Text:
{{{originalText}}}

Your expanded version should:
- Add relevant information that builds upon the original text.
- Maintain the core topic and intent of the original text.
- Be more detailed and comprehensive.

Expanded Text: `;

// const expandTextPromptObj = ai.definePrompt({ // Removed as not directly used in streaming
//   name: 'expandTextPrompt',
//   input: {schema: ExpandTextInputSchema},
//   prompt: PROMPT_TEMPLATE,
// });

export async function expandText(
  input: ExpandTextInput
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
        console.error("Error during stream generation (expandText):", error);
        controller.enqueue({ type: 'error', content: 'Failed to expand text.' });
      } finally {
        controller.close();
      }
    },
    cancel(reason) {
      console.log("Stream cancelled (expandText):", reason);
    }
  });
}
