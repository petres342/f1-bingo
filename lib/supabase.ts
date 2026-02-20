import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export type RoomResult = {
  id?: string;
  room_code: string;
  player_name: string;
  score: number;
  total_time: number;
  best_streak: number;
  created_at?: string;
};