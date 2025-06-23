'use server';

/**
 * @fileOverview This file defines a Genkit flow for extracting key takeaways from a given text.
 *
 * - extractKeyTakeaways - A function that takes a text string and returns a ReadableStream of the key takeaways.
 * - ExtractKeyTakeawaysInput - The input type for the extractKeyTakeaways function.
 */

import { ai } from '@/ai/groq';
import { z } from 'zod';
import type { StreamChunk } from '@/lib/types';

const ExtractKeyTakeawaysInputSchema = z.object({
  originalText: z.string().describe('The text from which to extract key takeaways.'),
});
export type ExtractKeyTakeawaysInput = z.infer<typeof ExtractKeyTakeawaysInputSchema>;

const PROMPT_TEMPLATE = `You are an expert summarizer. Your goal is to take the 'Original Text' provided below and extract the key takeaways or main points.

Original Text:
{{{originalText}}}

Your key takeaways should:
- Be concise and to the point.
- Capture the most important information.
- Preferably be in bullet points if the content is suitable, otherwise a short paragraph.

Key Takeaways: `;

// const extractKeyTakeawaysPromptObj = ai.definePrompt({ // Removed as not directly used in streaming
//   name: 'extractKeyTakeawaysPrompt',
//   input: {schema: ExtractKeyTakeawaysInputSchema},
//   prompt: PROMPT_TEMPLATE,
// });

export async function extractKeyTakeaways(
  input: ExtractKeyTakeawaysInput
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
        console.error("Error during stream generation (extractKeyTakeaways):", error);
        controller.enqueue({ type: 'error', content: 'Failed to extract key takeaways.' });
      } finally {
        controller.close();
      }
    },
    cancel(reason) {
      console.log("Stream cancelled (extractKeyTakeaways):", reason);
    }
  });
}
