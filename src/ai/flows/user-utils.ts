import { getSupabaseAdminClient } from '@/lib/supabase/server';

export async function getUserIdByEmail(userEmail: string): Promise<string | null> {
  try {
    const supabaseAdmin = getSupabaseAdminClient();
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', userEmail)
      .single();
    if (error || !data) return null;
    return (data as { id: string | null }).id;
  } catch {
    return null;
  }
} 