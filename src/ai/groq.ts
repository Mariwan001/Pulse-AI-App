import OpenAI from 'openai';
import { config } from 'dotenv';
import type { StreamChunk } from '@/lib/types';

// Load environment variables from .env.local
config({ path: '.env.local' });

const modelName = 'llama3-8b-8192';

// This is a wrapper to match the genkit interface
export const ai = {
  generateStream: async function* ({ messages, tools, abortSignal }: { messages: any[]; tools?: any[]; abortSignal?: AbortSignal }): AsyncGenerator<StreamChunk> {
    const groqApiKey = process.env.GROQ_API_KEY;

    if (!groqApiKey) {
      console.error('[GROQ_CONFIG] Missing GROQ_API_KEY environment variable');
      yield {
        type: 'error',
        content: "I apologize, but the server is not configured correctly (missing API key). Please contact the administrator."
      };
      return;
    }

    const openai = new OpenAI({
      apiKey: groqApiKey,
      baseURL: 'https://api.groq.com/openai/v1',
    });

    console.log(`[GROQ_LOG] Using model: ${modelName}`);

    const params: OpenAI.Chat.ChatCompletionCreateParams = {
        messages: messages,
        model: modelName,
        temperature: 0.1, // EXTREMELY LOW TEMPERATURE FOR MAXIMUM PRECISION
        max_tokens: 8192,
        top_p: 0.1, // VERY LOW TOP_P FOR MAXIMUM ACCURACY
        frequency_penalty: 0.0, // NO FREQUENCY PENALTY FOR CONSISTENCY
        presence_penalty: 0.0, // NO PRESENCE PENALTY FOR FOCUS
        stream: true,
    };

    if (tools) {
        params.tools = tools;
        params.tool_choice = 'auto';
    }

    try {
      let attempt = 0;
      let lastError = null;
      while (attempt < 3) {
        try {
          const completion = await openai.chat.completions.create(params, { signal: abortSignal });

          let toolFunctionName = null;
          let toolArguments = '';

          for await (const chunk of completion) {
            const delta = chunk.choices[0]?.delta;

            if (delta?.content) {
              yield { type: 'text', content: delta.content };
            }

            if (delta?.tool_calls) {
              const toolCall = delta.tool_calls[0];
              if (toolCall.function?.name) {
                toolFunctionName = toolCall.function.name;
              }
              if (toolCall.function?.arguments) {
                toolArguments += toolCall.function.arguments;
              }
            }

            if (chunk.choices[0]?.finish_reason === 'tool_calls') {
              if (toolFunctionName && toolArguments) {
                yield {
                  type: 'tool_code',
                  toolInvocations: [{
                    toolName: toolFunctionName,
                    args: JSON.parse(toolArguments),
                  }]
                };
              }
              toolFunctionName = null;
              toolArguments = '';
            }
          }
          return;
        } catch (error) {
          lastError = error;
          attempt++;
          if (attempt < 3) {
            await new Promise(res => setTimeout(res, 500));
          }
        }
      }
      console.error('[GROQ_ERROR] Error after retries:', lastError);
      yield {
        type: 'error',
        content: "Sorry, something went wrong with the AI. Please try again in a moment!"
      };
    } catch (error) {
      console.error('[GROQ_ERROR] Unexpected outer error:', error);
      yield {
        type: 'error',
        content: "Sorry, something went wrong with the AI. Please try again in a moment!"
      };
    }
  },
}; 