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
      const completion = await openai.chat.completions.create(params, { signal: abortSignal });

      let toolFunctionName: string | null = null;
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
          // Reset for next potential tool call in the same response
          toolFunctionName = null;
          toolArguments = '';
        }
      }
    } catch (error: any) {
      console.error('[GROQ_ERROR] Error:', error);
      if (error && error.status === 503) {
        yield {
          type: 'error',
          content: "The AI service is currently unavailable (Error 503). This is a temporary issue on their end. Please try again in a few moments."
        };
      } else {
        yield {
          type: 'error',
          content: "I apologize, but I've encountered an unexpected error while trying to connect to the AI service. Please try again."
        };
      }
    }
  },
}; 