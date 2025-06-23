'use server';

import { supabase } from '@/lib/supabaseClient';

export interface ChatMessage {
  id?: string;
  userId: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
}

export async function saveMessageToHistory(message: ChatMessage) {
  const { userId, sessionId, role, content } = message;
  const { data, error } = await supabase
    .from('chat_history')
    .insert([
      { 
        user_id: userId, 
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
    return null;
  }

  return data;
}

export async function getChatHistory(userId: string, sessionId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('chat_history')
    .select('*')
    .eq('user_id', userId)
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
    sessionId: item.session_id,
    role: item.role,
    content: item.content,
    createdAt: item.created_at
  })) || [];
}
