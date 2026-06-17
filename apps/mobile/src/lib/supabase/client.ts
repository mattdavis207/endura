import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;

if (!supabaseUrl) {
  throw new Error("Missing Supabase URL");
}

const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;

if (!supabaseKey) {
  throw new Error("Missing Supabase key");
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  }}
);

export function create_supabase_client() {
  return supabase;
}
