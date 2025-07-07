'use server';

import { getSupabaseClient } from '@/lib/supabaseClient';

export interface ChatMessage {
  id?: string;
  userId: string;
  userEmail: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
}

export async function saveMessageToHistory(message: ChatMessage) {
  const supabase = getSupabaseClient();
  const { userId, userEmail, sessionId, role, content } = message;
  
  console.log('saveMessageToHistory: Attempting to save message:', { userId, userEmail, sessionId, role, content: content.substring(0, 50) + '...' });
  
  try {
    const { data, error } = await supabase
      .from('chat_history')
      .insert([
        {
          user_id: userId,
          user_email: userEmail,
          session_id: sessionId,
          role,
          content
        }
      ])
      .select();

    if (error) {
      console.error('--- DETAILED SUPERBASE ERROR ---');
      console.error('CODE:', error.code);
      console.error('MESSAGE:', error.message);
      console.error('DETAILS:', error.details);
      console.error('FULL ERROR:', JSON.stringify(error, null, 2));
      console.error('---------------------------------');
      
      // If the table doesn't exist or has schema issues, try a different approach
      if (error.code === '42P01' || error.code === '22P02') {
        console.log('saveMessageToHistory: Table or schema issue detected, trying alternative approach...');
        
        // Try to create the table if it doesn't exist
        const { error: createError } = await supabase.rpc('create_chat_history_table_if_not_exists');
        if (createError) {
          console.log('saveMessageToHistory: Could not create table, continuing without saving...');
          return null;
        }
        
        // Try the insert again
        const { data: retryData, error: retryError } = await supabase
          .from('chat_history')
          .insert([
            {
              user_id: userId,
              user_email: userEmail,
              session_id: sessionId,
              role,
              content
            }
          ])
          .select();
          
        if (retryError) {
          console.log('saveMessageToHistory: Retry also failed, continuing without saving...');
          return null;
        }
        
        return retryData;
      }
      
      return null;
    }

    console.log('saveMessageToHistory: Message saved successfully');
    return data;
  } catch (catchError) {
    console.error('saveMessageToHistory: Unexpected error:', catchError);
    return null;
  }
}

export async function getChatHistory(userEmail: string, sessionId: string): Promise<ChatMessage[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('chat_history')
    .select('*')
    .eq('user_email', userEmail)
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching chat history:', error);
    return [];
  }

  // Map snake_case columns to camelCase properties
  return data.map(item => ({
    id: item.id,
    userId: item.user_id,
    userEmail: item.user_email,
    sessionId: item.session_id,
    role: item.role,
    content: item.content,
    createdAt: item.created_at
  })) || [];
}
