import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;

if (!supabaseUrl) {
  throw new Error("Missing Supabase URL");
}

const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;

if (!supabaseKey) {
  throw new Error("Missing Supabase key");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export function create_supabase_client() {
  return supabase;
}
