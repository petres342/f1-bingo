import { createClient } from '@supabase/supabase-js';

export function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseKey);
}

// No module-level client creation at all
export const supabase = {
  from: (table: string) => getSupabase().from(table),
  channel: (name: string) => getSupabase().channel(name),
  removeChannel: (channel: any) => getSupabase().removeChannel(channel),
};

export type RoomResult = {
  id?: string;
  room_code: string;
  player_name: string;
  score: number;
  total_time: number;
  best_streak: number;
  created_at?: string;
};