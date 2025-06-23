'use server';

/**
 * @fileOverview This file defines a Genkit flow for explaining a given text with an analogy.
 *
 * - explainWithAnalogy - A function that takes a text string and returns a ReadableStream of the explanation with an analogy.
 * - ExplainWithAnalogyInput - The input type for the explainWithAnalogy function.
 */

import { ai } from '@/ai/groq';
import { z } from 'zod';
import type { StreamChunk } from '@/lib/types';

const ExplainWithAnalogyInputSchema = z.object({
  originalText: z.string().describe('The text/concept to be explained with an analogy by the AI.'),
});
export type ExplainWithAnalogyInput = z.infer<typeof ExplainWithAnalogyInputSchema>;

const PROMPT_TEMPLATE = `You are a creative explainer. Your goal is to take the 'Original Text' (which describes a concept or idea) provided below and explain it using a helpful and insightful analogy.

Original Text/Concept:
{{{originalText}}}

Your explanation with an analogy should:
- Clearly state the analogy.
- Explain how the analogy relates to the original concept.
- Make the original concept easier to understand through the analogy.
- Be creative and relatable.

Explanation with Analogy: `;

// const explainWithAnalogyPromptObj = ai.definePrompt({ // Removed as not directly used in streaming
//   name: 'explainWithAnalogyPrompt',
//   input: {schema: ExplainWithAnalogyInputSchema},
//   prompt: PROMPT_TEMPLATE,
// });

export async function explainWithAnalogy(
  input: ExplainWithAnalogyInput
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
        console.error("Error during stream generation (explainWithAnalogy):", error);
        controller.enqueue({ type: 'error', content: 'Failed to explain with analogy.' });
      } finally {
        controller.close();
      }
    },
    cancel(reason) {
      console.log("Stream cancelled (explainWithAnalogy):", reason);
    }
  });
}
