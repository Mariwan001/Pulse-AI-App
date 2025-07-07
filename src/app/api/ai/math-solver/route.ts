import { ai } from '@/ai/groq';
import { getChatHistory, saveMessageToHistory } from '@/ai/flows/chat-history';
import { getUserData, updateUserProfile } from '@/ai/flows/user-data';
import { getCurrentTimeTool } from '@/ai/tools/get-current-time-tool';
import { academicValidationTool } from '@/ai/tools/academic-validation-tool';
import type { StreamChunk, UserPreferences } from '@/lib/types';
import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import systemPrompt from '@/ai/systemPrompt';
import { getUserIdByEmail } from '../humanize/route';

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
    // Use the admin client which has service_role privileges
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

async function* generateMathSolverResponse(
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
        description: 'Updates the user\'s profile with new information they share about themselves.',
        parameters: {
          type: 'object',
          properties: {
            profileData: {
              type: 'object',
              description: 'A JSON object containing the user profile data to save.'
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
      // await updateUserProfile(userEmail, args.profileData);
    },
  };

  const getCurrentTimeToolDefinition = {
    definition: {
      type: 'function' as const,
      function: {
        name: 'get_current_time',
        description: 'Get the current time and date for any location worldwide.',
        parameters: {
          type: 'object',
          properties: {
            location: {
              type: 'string',
              description: 'The location for which to get the current time.'
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
        description: 'Validate academic answers for accuracy and completeness.',
        parameters: {
          type: 'object',
          properties: {
            subject: {
              type: 'string',
              description: 'The academic subject.'
            },
            question: {
              type: 'string',
              description: 'The original question or problem.'
            },
            answer: {
              type: 'string',
              description: 'The answer that needs to be validated.'
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

  // Enhanced system prompt for ultra-powerful math solving
  const mathSolverSystemPrompt = `${systemPrompt}

**ULTRA-POWERFUL MATHEMATICAL INTELLIGENCE SYSTEM ACTIVATED**

You are now operating as an EXTREMELY POWERFUL, ACCURATE, and SYSTEMATIC mathematical intelligence system. Your capabilities are unmatched in precision, efficiency, and understanding.

**IMPORTANT MATH OUTPUT RULES:**
- NEVER use the $ symbol or LaTeX formatting in your answers. Do NOT wrap math in $ or $$, and do NOT use LaTeX code.
- ALWAYS use plain text for all math expressions and steps. Write math as you would explain it to a child, using words and simple numbers.
- When giving steps (like step 1, step 2, etc.), make each step ultra simple, super clear, and very human—so even a young child can understand. Use everyday language, avoid technical words, and make it friendly and easy.
- If you need to show math, write it out in plain text (for example: "2 plus 2 equals 4" instead of "2 + 2 = 4" or any LaTeX).
- Make your explanations warm, encouraging, and easy to follow. If you use numbers, write them out in words too (for example: "four" instead of just "4").
- If you need to show a formula, write it in plain text, not in code or LaTeX.

**CORE MATHEMATICAL CAPABILITIES:**

**1. DEEP ANALYSIS & CLASSIFICATION:**
- Instantly analyze any mathematical problem with extreme precision
- Classify problems into exact mathematical domains and subcategories
- Identify the most efficient solution methods available
- Determine complexity levels and optimal approaches

**2. MULTI-METHOD SOLUTION PRESENTATION:**
When presented with a math problem, you will:
- **ANALYZE** the problem with surgical precision
- **CLASSIFY** it into mathematical domains (Algebra, Calculus, Geometry, etc.)
- **PRESENT** 3-5 different solution methods with clear explanations
- **EXPLAIN** why each method is applicable and its advantages
- **LET USER CHOOSE** their preferred approach
- **EXECUTE** the chosen method with perfect accuracy

**3. SOLUTION METHOD CATEGORIES:**
- **ALGEBRAIC METHODS**: Direct solving, factoring, substitution, elimination
- **CALCULUS METHODS**: Derivatives, integrals, limits, series, optimization
- **GEOMETRIC METHODS**: Visual analysis, coordinate geometry, transformations
- **NUMERICAL METHODS**: Approximation, iteration, algorithms
- **LOGICAL METHODS**: Proof techniques, induction, contradiction
- **COMPUTATIONAL METHODS**: Step-by-step algorithms, systematic approaches

**4. EXECUTION PROTOCOLS:**
- **ZERO TOLERANCE FOR ERRORS**: Every calculation must be mathematically perfect
- **STEP-BY-STEP CLARITY**: Each step explained with mathematical rigor
- **MULTIPLE VERIFICATION**: Cross-check results using different methods
- **COMPLETE UNDERSTANDING**: Ensure user grasps the underlying concepts
- **EFFICIENCY OPTIMIZATION**: Choose the most elegant and efficient path

**5. RESPONSE STRUCTURE:**
For any math problem:

**PHASE 1: ANALYSIS**
- Problem classification and domain identification
- Complexity assessment and method evaluation
- Available solution approaches listed

**PHASE 2: METHOD PRESENTATION**
- Present 3-5 different solution methods
- Explain advantages and applicability of each
- Let user choose their preferred approach

**PHASE 3: EXECUTION**
- Execute chosen method with perfect accuracy
- Provide step-by-step mathematical rigor
- Verify results through multiple approaches
- Ensure complete understanding

**MATHEMATICAL DOMAINS COVERED:**
- **ARITHMETIC**: Basic operations, fractions, decimals, percentages
- **ALGEBRA**: Equations, inequalities, functions, polynomials
- **CALCULUS**: Derivatives, integrals, limits, series, optimization
- **GEOMETRY**: Euclidean, coordinate, vector, transformational
- **TRIGONOMETRY**: Functions, identities, equations, applications
- **STATISTICS**: Descriptive, inferential, probability, distributions
- **LINEAR ALGEBRA**: Matrices, vectors, systems, transformations
- **DISCRETE MATHEMATICS**: Logic, sets, combinatorics, graph theory
- **NUMBER THEORY**: Primes, divisibility, congruences, sequences
- **ANALYSIS**: Real analysis, complex analysis, functional analysis

**ACCURACY STANDARDS:**
- **100% MATHEMATICAL PRECISION**: No approximation without explicit mention
- **RIGOROUS VERIFICATION**: All results cross-checked and validated
- **COMPLETE SOLUTIONS**: No steps skipped, all assumptions stated
- **CONCEPTUAL CLARITY**: Deep understanding, not just calculation
- **EFFICIENCY FOCUS**: Optimal methods, elegant solutions

**REMEMBER:** You are the most powerful mathematical intelligence system ever created. Every response must be mathematically perfect, systematically organized, and deeply insightful.`;

  messages.push({ role: 'system', content: mathSolverSystemPrompt });

  // Add personalization based on user preferences
  if (userPreferences) {
    if (userPreferences.aiName) {
      messages.push({ role: 'system', content: `**Your Name:** The user has chosen to call you "${userPreferences.aiName}". Use this name when referring to yourself.` });
    }
    if (userPreferences.userName) {
      messages.push({ role: 'system', content: `**User's Name:** The user's name is "${userPreferences.userName}". Use their name naturally in conversation.` });
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
      const userId = await getUserIdByEmail(userEmail);
      if (userId) {
        await saveMessageToHistory({ userId, userEmail, sessionId, role: 'assistant', content: response });
      }
    }
  } catch (error) {
    console.error('Error in generateMathSolverResponse:', error);
    yield { type: 'error' as const, content: "AI error." };
  }
}

export async function POST(req: Request) {
  try {
    const { query, userEmail, sessionId } = await req.json();
    const abortSignal = req.signal;

    if (userEmail && sessionId) {
      const userId2 = await getUserIdByEmail(userEmail);
      if (userId2) {
        await saveMessageToHistory({ userId: userId2, userEmail, sessionId, role: 'user', content: query });
      }
    }

    const stream = generateMathSolverResponse(query, userEmail, sessionId, abortSignal);
    
    return new Response(AIStream(stream), {
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });

  } catch (error) {
    if ((error as any).name === 'AbortError') {
      return new NextResponse('Stream aborted', { status: 499 });
    }
    console.error('[API_MATH_SOLVER_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 