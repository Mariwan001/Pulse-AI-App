'use server';

import { getChatHistory as getHistory, ChatMessage } from '@/ai/flows/chat-history';
import { supabase } from '@/lib/supabaseClient';

export async function getChatHistory(userId: string, sessionId: string): Promise<ChatMessage[]> {
  return getHistory(userId, sessionId);
}

export async function deleteChatHistory(userId: string, sessionId: string): Promise<boolean> {
  const { error } = await supabase
    .from('chat_history')
    .delete()
    .eq('user_id', userId)
    .eq('session_id', sessionId);

  if (error) {
    console.error('Error deleting chat history:', error);
    return false;
  }
  return true;
}
