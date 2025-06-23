'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a concise title for a chat conversation based on the chat history.
 *
 * - generateChatTitle - A function that takes chat history as input and returns a generated title for the chat.
 * - GenerateChatTitleInput - The input type for the generateChatTitle function, which is an array of strings representing the chat history.
 * - GenerateChatTitleOutput - The output type for the generateChatTitle function, which is a string representing the generated title.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

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
  return generateChatTitleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateChatTitlePrompt',
  model: 'anthropic/claude-3-sonnet-20240229',
  input: {schema: GenerateChatTitleInputSchema},
  output: {schema: GenerateChatTitleOutputSchema},
  prompt: `You are an AI assistant that generates concise titles for chat conversations.

  Based on the following chat history, generate a title that summarizes the conversation. The title should be no more than 5 words.
  Chat History:
  {{#each chatHistory}}
  - {{{this}}}
  {{/each}}
  `,
});

const generateChatTitleFlow = ai.defineFlow(
  {
    name: 'generateChatTitleFlow',
    inputSchema: GenerateChatTitleInputSchema,
    outputSchema: GenerateChatTitleOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
