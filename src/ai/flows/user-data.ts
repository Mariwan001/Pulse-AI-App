'use server';

import { createSupabaseServerClient, getSupabaseAdminClient } from '@/lib/supabase/server';

// This interface is flexible to allow the AI to define the structure.
export interface UserProfileData {
  [key: string]: any;
}

export interface UserData {
  id: string;
  // The 'name' field is kept for potential backward compatibility or other features,
  // but the primary data store is the 'profile' object.
  name: string | null;
  profile: UserProfileData | null;
}

/**
 * Fetches all data for a given user, creating a new user record if one doesn't exist.
 * @param userId The unique identifier for the user.
 * @returns The user's data, including their profile.
 */
export async function getUserData(userId: string): Promise<UserData> {
  const supabaseAdmin = getSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = 'No rows found'
    console.error('Error fetching user data:', error);
    throw error;
  }

  if (data) {
    return data as unknown as UserData;
  } else {
    // User does not exist, create a new one.
    const { data: newUser, error: insertError } = await supabaseAdmin
      .from('users')
      .insert({ id: userId, profile: {} })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating new user:', insertError);
      throw insertError;
    }
    return newUser as unknown as UserData;
  }
}

/**
 * Updates a user's profile with new data.
 * This function merges the new data with the existing profile.
 * @param userId The unique identifier for the user.
 * @param newProfileData The new profile data to merge into the user's profile.
 */
export async function updateUserProfile(
  userId: string,
  newProfileData: Record<string, any>
): Promise<void> {
  const supabase = createSupabaseServerClient();
  try {
    const { data: existingData, error: fetchError } = await supabase
      .from('users')
      .select('profile')
      .eq('id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching user profile for update:', fetchError);
      throw fetchError;
    }

    const existingProfile = existingData?.profile || {};
    const updatedProfile = { ...existingProfile, ...newProfileData };

    const { error: updateError } = await supabase
      .from('users')
      .update({ profile: updatedProfile })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating user profile:', updateError);
      throw updateError;
    }
  } catch (error) {
    console.error('An unexpected error occurred in updateUserProfile:', error);
    throw error;
  }
}


