import { ai } from '@/ai/groq';
import { getChatHistory, saveMessageToHistory } from '@/ai/flows/chat-history';
import { getUserData, updateUserProfile } from '@/ai/flows/user-data';
import { getCurrentTimeTool } from '@/ai/tools/get-current-time-tool';
import { academicValidationTool } from '@/ai/tools/academic-validation-tool';
import type { StreamChunk, UserPreferences } from '@/lib/types';
import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import systemPrompt from '@/ai/systemPrompt';

// Helper to convert AsyncGenerator to a ReadableStream
function AIStream(res: AsyncGenerator<StreamChunk>): ReadableStream {
  return new ReadableStream({
    async pull(controller) {
      try {
        const { value, done } = await res.next();
        if (done) {
          controller.close();
        } else {
          controller.enqueue(new TextEncoder().encode(JSON.stringify(value) + '\n'));
        }
      } catch (error) {
        controller.error(error);
      }
    },
  });
}

// Function to get user preferences using the secure admin client
async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  try {
    // Use the admin client which has service_role privileges
        const supabaseAdmin = getSupabaseAdminClient();
    const { data, error } = await supabaseAdmin
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    const anyData = data as any;

    return {
      aiName: anyData.ai_name || '',
      userName: anyData.user_name || '',
      responseStyle: anyData.response_style || 'detailed',
      onboardingCompleted: anyData.onboarding_completed || false,
      interests: anyData.interests || '',
      tone: anyData.tone || '',
      favoriteTopics: anyData.favorite_topics || ''
    };
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return null;
  }
}

async function* generateAIResponse(
  prompt: string,
  isSimplerMode: boolean,
  userId?: string,
  sessionId?: string,
  abortSignal?: AbortSignal
): AsyncGenerator<StreamChunk> {
  let userData: any = null;
  let userPreferences: UserPreferences | null = null;
  let history: any[] = [];

  if (userId) {
    const promises = [
      getUserData(userId),
      getUserPreferences(userId),
      sessionId ? getChatHistory(userId, sessionId) : Promise.resolve([]),
    ];

    const [userDataResult, userPreferencesResult, historyResult] = await Promise.all(promises);
    userData = userDataResult;
    userPreferences = userPreferencesResult as UserPreferences | null;
    history = historyResult as any[];
  }

  const updateUserProfileTool = {
    definition: {
      type: 'function' as const,
      function: {
        name: 'update_user_profile',
        description: 'Updates the user\'s profile with new information they share about themselves. Use this to save meaningful details about their life, experiences, preferences, goals, and personal information. This helps build a deeper, more meaningful connection with the user over time.',
        parameters: {
          type: 'object',
          properties: {
            profileData: {
              type: 'object',
              description: 'A JSON object containing the user profile data to save. This can include personal information like name, age, profession, hobbies, interests, goals, experiences, preferences, or any other meaningful details they share about themselves.'
            }
          },
          required: ['profileData']
        }
      }
    },
    run: async (args: { profileData: Record<string, any> }) => {
      if (!userId) {
        console.warn("updateUserProfileTool: userId is missing. Cannot update profile.");
        return;
      }
      await updateUserProfile(userId, args.profileData);
    },
  };

  const getCurrentTimeToolDefinition = {
    definition: {
      type: 'function' as const,
      function: {
        name: 'get_current_time',
        description: 'Get the current time and date for any location worldwide. Supports major cities and locations across all continents.',
        parameters: {
          type: 'object',
          properties: {
            location: {
              type: 'string',
              description: 'The location for which to get the current time (e.g., "Erbil", "Paris", "New York", "Tokyo", "Dubai", "London"). If not provided, returns server time.'
            }
          },
          required: ['location']
        }
      }
    },
    run: async (args: { location: string }) => {
      return await getCurrentTimeTool({ location: args.location });
    },
  };

  const academicValidationToolDefinition = {
    definition: {
      type: 'function' as const,
      function: {
        name: 'validate_academic_answer',
        description: 'Validate academic answers for accuracy, completeness, and adherence to academic standards. Ensures zero errors in homework responses.',
        parameters: {
          type: 'object',
          properties: {
            subject: {
              type: 'string',
              description: 'The academic subject (e.g., "mathematics", "physics", "history", "literature", "chemistry", "biology").'
            },
            question: {
              type: 'string',
              description: 'The original question or problem that was asked.'
            },
            answer: {
              type: 'string',
              description: 'The answer that needs to be validated for accuracy.'
            },
            answerType: {
              type: 'string',
              enum: ['calculation', 'factual', 'analytical', 'creative', 'essay'],
              description: 'The type of answer provided.'
            }
          },
          required: ['subject', 'question', 'answer', 'answerType']
        }
      }
    },
    run: async (args: { subject: string; question: string; answer: string; answerType: "calculation" | "factual" | "analytical" | "creative" | "essay" }) => {
      return await academicValidationTool(args);
    },
  };

  const messages: { role: 'system' | 'user' | 'assistant'; content: string; }[] = [];

  messages.push({ role: 'system', content: systemPrompt });

  // Debug: Log user preferences to help diagnose missing name
  console.log('User Preferences:', userPreferences);

  // Add personalization based on user preferences
  if (userPreferences) {
    if (userPreferences.aiName) {
      messages.push({ role: 'system', content: `**Your Name:** The user has chosen to call you "${userPreferences.aiName}". Use this name when referring to yourself, and let it become part of your identity.` });
    }
    if (userPreferences.userName) {
      messages.push({ role: 'system', content: `**User's Name:** The user's name is "${userPreferences.userName}". Use their name naturally in conversation when appropriate, and let it deepen your connection with them.` });
    }
    if (userPreferences.interests) {
      messages.push({ role: 'system', content: `**User Interests:** The user's interests are: ${userPreferences.interests}. Use these interests to make your responses more relevant and engaging.` });
    }
    if (userPreferences.tone) {
      messages.push({ role: 'system', content: `**Preferred Tone:** The user prefers a "${userPreferences.tone}" tone. Adjust your responses to match this style.` });
    }
    if (userPreferences.favoriteTopics) {
      messages.push({ role: 'system', content: `**Favorite Topics:** The user's favorite topics are: ${userPreferences.favoriteTopics}. Try to incorporate these topics into your suggestions and examples.` });
    }
    if (userPreferences.responseStyle === 'concise') {
      messages.push({ role: 'system', content: `**Response Style:** The user prefers concise and direct responses. Keep your answers brief and to the point while still being helpful and maintaining your human warmth.` });
    } else {
      messages.push({ role: 'system', content: `**Response Style:** The user prefers detailed and comprehensive responses. Provide thorough explanations and detailed answers while maintaining your natural, conversational tone.` });
    }
  }

  // Only include the last 5 user/assistant messages for maximum speed
  let trimmedHistory = history;
  if (history.length > 5) {
    trimmedHistory = history.slice(-5);
  }

  if (trimmedHistory.length > 0) {
    if (trimmedHistory.length > 0 && trimmedHistory[trimmedHistory.length - 1].role === 'user') {
      trimmedHistory.pop();
    }
    messages.push(...trimmedHistory.map(item => ({ role: item.role as 'user' | 'assistant', content: item.content })));
  }

  messages.push({ role: 'user', content: prompt });

  try {
    const stream = ai.generateStream({
      messages,
      tools: [updateUserProfileTool.definition, getCurrentTimeToolDefinition.definition, academicValidationToolDefinition.definition],
      abortSignal,
    });

    let response = '';
    let toolResults: any[] = [];
    
    for await (const chunk of stream) {
      yield chunk;

      if (chunk.type === 'text') {
        response += chunk.content;
      } else if (chunk.type === 'tool_code' && chunk.toolInvocations) {
        for (const toolInvocation of chunk.toolInvocations) {
          let toolResult = null;
          
          if (toolInvocation.toolName === 'update_user_profile') {
            await updateUserProfileTool.run(toolInvocation.args as any);
            toolResult = { success: true, message: 'Profile updated successfully' };
          } else if (toolInvocation.toolName === 'get_current_time') {
            toolResult = await getCurrentTimeToolDefinition.run(toolInvocation.args as any);
          } else if (toolInvocation.toolName === 'validate_academic_answer') {
            toolResult = await academicValidationToolDefinition.run(toolInvocation.args as any);
          }
          
          if (toolResult) {
            toolResults.push({
              toolName: toolInvocation.toolName,
              result: toolResult
            });
          }
        }
      }
    }

    // If we have tool results, we need to feed them back to the AI
    if (toolResults.length > 0) {
      // Add the tool results to the conversation
      const toolMessages = toolResults.map(tool => ({
        role: 'tool' as const,
        content: JSON.stringify(tool.result),
        tool_call_id: tool.toolName
      }));
      
      // Create a new stream with the tool results
      const followUpStream = ai.generateStream({
        messages: [
          ...messages,
          ...toolMessages
        ],
        abortSignal,
      });

      let followUpResponse = '';
      for await (const chunk of followUpStream) {
        yield chunk;
        if (chunk.type === 'text') {
          followUpResponse += chunk.content;
        }
      }
      
      response = followUpResponse;
    }

    if (userId && sessionId && response.trim()) {
      await saveMessageToHistory({ userId, sessionId, role: 'assistant', content: response });
    }
  } catch (error) {
    console.error('Error in generateAIResponse:', error);
    yield { type: 'error' as const, content: "AI error." };
  }
}

export async function POST(req: Request) {
  try {
    const { query, userId, sessionId } = await req.json();
    const abortSignal = req.signal;

    if (userId && sessionId) {
      await saveMessageToHistory({ userId, sessionId, role: 'user', content: query });
    }

    const stream = generateAIResponse(query, false, userId, sessionId, abortSignal);
    
    return new Response(AIStream(stream), {
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });

  } catch (error) {
    if ((error as any).name === 'AbortError') {
      return new NextResponse('Stream aborted', { status: 499 });
    }
    console.error('[API_CHAT_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
