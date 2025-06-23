import { z } from 'zod';

export const AIResponseSchema = z.object({
  response: z.string().describe("The AI's response to the user's query."),
  followUpQuestions: z.array(z.string()).optional().describe('A list of suggested follow-up questions.'),
  sentiment: z.enum(['positive', 'neutral', 'negative']).optional().describe("The sentiment of the user's query.")
});
