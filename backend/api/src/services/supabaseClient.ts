import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env';

type ServiceSupabaseClient = SupabaseClient;

let cachedClient: ServiceSupabaseClient | null = null;

export const getSupabaseClient = (): ServiceSupabaseClient => {
  if (cachedClient) {
    return cachedClient;
  }

  cachedClient = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      persistSession: false
    }
  });

  return cachedClient;
};
