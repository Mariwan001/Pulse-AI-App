'use server';

import { ai } from '@/ai/groq';
import { z } from 'zod';

const TranslateTextInputSchema = z.object({
  originalText: z.string().describe('The text to be translated by the AI.'),
  targetLanguage: z.string().describe('The language to translate the text into.'),
});
export type TranslateTextInput = z.infer<typeof TranslateTextInputSchema>;

// The prompt template string.
const PROMPT_TEMPLATE = `You are an expert translator. Your goal is to translate the 'Original Text' provided below into the specified target language while maintaining the original meaning, tone, and style.

Original Text:
{{{originalText}}}

Target Language: {{{targetLanguage}}}

Your translation should:
- Accurately convey the original meaning
- Maintain the tone and style of the original text
- Be natural and fluent in the target language
- Preserve any cultural context or nuances where possible
- Avoid literal translations that might sound awkward

Translation:`;

export async function translateText(
  input: TranslateTextInput
): Promise<ReadableStream<Uint8Array>> {
  // Validate input
  TranslateTextInputSchema.parse(input);

  // Render the prompt
  const renderedPrompt = PROMPT_TEMPLATE
    .replace("{{{originalText}}}", input.originalText)
    .replace("{{{targetLanguage}}}", input.targetLanguage);

  // Prepare messages for the AI
  const messages = [
    { role: 'system', content: 'You are an expert translator.' },
    { role: 'user', content: renderedPrompt }
  ];

  // Create a ReadableStream from ai.generateStream
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      let translation = '';
      try {
        for await (const chunk of ai.generateStream({ messages })) {
          if (chunk.type === 'text' && chunk.content) {
            translation += chunk.content;
            controller.enqueue(encoder.encode(chunk.content));
          }
        }
      } catch (error) {
        console.error("Error during stream generation (translateText):", error);
        controller.error(error);
      } finally {
        controller.close();
      }
    },
    cancel(reason) {
      console.log("Stream cancelled (translateText):", reason);
    }
  });
} 