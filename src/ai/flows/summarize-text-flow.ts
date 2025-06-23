'use server';

import { ai } from '@/ai/groq';
import { z } from 'zod';

const SummarizeTextInputSchema = z.object({
  originalText: z.string().describe('The text to be summarized by the AI.'),
});
export type SummarizeTextInput = z.infer<typeof SummarizeTextInputSchema>;

// The prompt template string.
const PROMPT_TEMPLATE = `You are an expert summarizer. Your goal is to take the 'Original Text' provided below and create a concise, informative summary that captures the key points and main ideas.

Original Text:
{{{originalText}}}

Your summary should:
- Be significantly shorter than the original while maintaining the core message
- Focus on the most important information and main ideas
- Be clear and easy to understand
- Maintain the original tone and style where appropriate
- Avoid adding any new information not present in the original text

Summary: `;

export async function summarizeText(
  input: SummarizeTextInput
): Promise<ReadableStream<Uint8Array>> {
  const renderedPrompt = PROMPT_TEMPLATE.replace("{{{originalText}}}", input.originalText);

  const stream = ai.generateStream({
    messages: [
      {
        role: 'user',
        content: [{ text: renderedPrompt }],
      },
    ],
  });

  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (chunk.type === 'text' && chunk.content) {
            controller.enqueue(encoder.encode(chunk.content));
          }
        }
      } catch (error) {
        console.error("Error during stream generation (summarizeText):", error);
        controller.error(error);
      } finally {
        controller.close();
      }
    },
    cancel(reason) {
      console.log("Stream cancelled (summarizeText):", reason);
    }
  });
} 