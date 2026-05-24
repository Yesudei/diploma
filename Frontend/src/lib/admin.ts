import { supabase } from './supabase';

export async function getIsAdmin(userId: string): Promise<boolean> {
  if (!userId) return false;

  const { data, error } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data?.is_admin);
}
