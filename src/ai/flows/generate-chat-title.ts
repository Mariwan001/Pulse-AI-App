'use server';

/**
 * @fileOverview This file defines a function for generating a concise title for a chat conversation based on the chat history using the custom Groq AI implementation.
 *
 * - generateChatTitle - A function that takes chat history as input and returns a generated title for the chat.
 * - GenerateChatTitleInput - The input type for the generateChatTitle function, which is an array of strings representing the chat history.
 * - GenerateChatTitleOutput - The output type for the generateChatTitle function, which is a string representing the generated title.
 */

import { ai } from '@/ai/groq';
import { z } from 'zod';

const GenerateChatTitleInputSchema = z.object({
  chatHistory: z
    .array(z.string())
    .describe('An array of strings representing the chat history.'),
});
export type GenerateChatTitleInput = z.infer<typeof GenerateChatTitleInputSchema>;

const GenerateChatTitleOutputSchema = z.object({
  title: z.string().describe('A concise title generated for the chat conversation.'),
});
export type GenerateChatTitleOutput = z.infer<typeof GenerateChatTitleOutputSchema>;

export async function generateChatTitle(input: GenerateChatTitleInput): Promise<GenerateChatTitleOutput> {
  // Validate input
  GenerateChatTitleInputSchema.parse(input);

  // Construct the prompt
  const chatHistoryText = input.chatHistory.map(line => `- ${line}`).join('\n');
  const prompt = `You are an AI assistant that generates concise titles for chat conversations.\n\nBased on the following chat history, generate a title that summarizes the conversation. The title should be no more than 5 words.\nChat History:\n${chatHistoryText}`;

  // Prepare messages for the AI
  const messages = [
    { role: 'system', content: 'You are an AI assistant that generates concise titles for chat conversations.' },
    { role: 'user', content: prompt }
  ];

  // Call the AI and get the response
  let title = '';
  for await (const chunk of ai.generateStream({ messages })) {
    if (chunk.type === 'text' && chunk.content) {
      title += chunk.content;
    }
  }

  // Clean up the title (remove extra whitespace, newlines, etc.)
  title = title.trim().replace(/^"|"$/g, '');

  // Validate output
  const output = GenerateChatTitleOutputSchema.parse({ title });
  return output;
}
