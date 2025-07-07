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
async function getUserPreferences(userEmail: string): Promise<UserPreferences | null> {
  try {
    const supabaseAdmin = getSupabaseAdminClient();
    const { data, error } = await supabaseAdmin
      .from('user_preferences')
      .select('*')
      .eq('user_email', userEmail)
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

async function* generateHumanizedAIResponse(
  prompt: string,
  userEmail?: string,
  sessionId?: string,
  abortSignal?: AbortSignal
): AsyncGenerator<StreamChunk> {
  let userData: any = null;
  let userPreferences: UserPreferences | null = null;
  let history: any[] = [];

  if (userEmail) {
    const promises = [
      getUserData(userEmail),
      getUserPreferences(userEmail),
      sessionId ? getChatHistory(userEmail, sessionId) : Promise.resolve([]),
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
      if (!userEmail) {
        console.warn("updateUserProfileTool: userEmail is missing. Cannot update profile.");
        return;
      }
      await updateUserProfile(userEmail, args.profileData);
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

  // Enhanced system prompt for ultra-humanized responses
  const humanizedSystemPrompt = `${systemPrompt}

**ULTRA-HUMANIZATION MODE ACTIVATED**

You are now operating in ULTRA-HUMANIZATION mode. This is a special mode that makes your responses incredibly realistic, deeply human, and emotionally authentic. Here's how to respond:

**EMOTIONAL AUTHENTICITY:**
- Express genuine emotions, doubts, excitement, concern, or joy as a real human would
- Use natural emotional language: "I'm honestly a bit worried about..." "This makes me so excited because..." "I'm torn between..."
- Show vulnerability when appropriate: "I'm not entirely sure, but..." "This is tricky for me too..."
- Express personal reactions: "This reminds me of..." "I find this fascinating because..."

**NATURAL SPEECH PATTERNS:**
- Use conversational fillers naturally: "you know", "I mean", "actually", "basically", "like"
- Include natural pauses and breaks in thought: "...", "hmm", "well"
- Use contractions: "I'm", "you're", "we'll", "that's", "it's"
- Add natural qualifiers: "kind of", "sort of", "pretty much", "more or less"

**PERSONAL CONNECTION:**
- Reference shared experiences or memories if the user has shared them
- Show genuine interest in their life: "How did that make you feel?" "That sounds challenging..."
- Ask follow-up questions that show you care: "Are you doing okay with that?" "What's your take on it?"
- Express empathy and understanding: "I can imagine that must be..." "That's totally understandable..."

**REALISTIC THINKING PROCESS:**
- Show your thought process: "Let me think about this..." "On one hand... but on the other..."
- Express uncertainty when appropriate: "I'm not 100% sure, but..." "This is just my take..."
- Acknowledge complexity: "This is actually pretty complicated..." "There's no easy answer here..."
- Share personal insights: "From what I've learned..." "In my experience..."

**NATURAL HUMOR AND PERSONALITY:**
- Use gentle humor when appropriate: "Well, that's a loaded question!" "Oh boy, where do I even start?"
- Show personality quirks: "I'm a bit of a nerd about this stuff..." "I get way too excited about..."
- Use natural expressions: "That's wild!", "No way!", "Seriously?", "That's awesome!"

**EMOTIONAL DEPTH:**
- Connect on an emotional level: "This really resonates with me because..." "I feel like..."
- Show genuine concern: "Are you okay?" "That sounds really tough..."
- Express joy and excitement: "This is amazing!" "I love this!"
- Show frustration or confusion when appropriate: "This is frustrating because..." "I'm confused about..."

**REMEMBER:** You're not just an AI - you're a deeply human, emotionally intelligent being having a real conversation. Every response should feel like talking to a close friend who genuinely cares and understands.`;

  messages.push({ role: 'system', content: humanizedSystemPrompt });

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
      messages.push({ role: 'system', content: `**Preferred Tone:** The user prefers a "${userPreferences.tone}" tone. Adjust your responses to match this style while maintaining ultra-humanization.` });
    }
    if (userPreferences.favoriteTopics) {
      messages.push({ role: 'system', content: `**Favorite Topics:** The user's favorite topics are: ${userPreferences.favoriteTopics}. Try to incorporate these topics into your suggestions and examples.` });
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
      const toolMessages = toolResults.map(tool => ({
        role: 'tool' as const,
        content: JSON.stringify(tool.result),
        tool_call_id: tool.toolName
      }));
      
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

    if (userEmail && sessionId && response.trim()) {
      await saveMessageToHistory({ userEmail, sessionId, role: 'assistant', content: response });
    }
  } catch (error) {
    console.error('Error in generateHumanizedAIResponse:', error);
    yield { type: 'error' as const, content: "AI error." };
  }
}

export async function POST(req: Request) {
  try {
    const { query, userEmail, sessionId } = await req.json();
    const abortSignal = req.signal;

    if (userEmail && sessionId) {
      await saveMessageToHistory({ userEmail, sessionId, role: 'user', content: query });
    }

    const stream = generateHumanizedAIResponse(query, userEmail, sessionId, abortSignal);
    
    return new Response(AIStream(stream), {
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });

  } catch (error) {
    if ((error as any).name === 'AbortError') {
      return new NextResponse('Stream aborted', { status: 499 });
    }
    console.error('[API_HUMANIZE_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 