import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create Supabase client only if both URL and key are available
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey && supabase);
};

// Get connection status
export const getConnectionStatus = async () => {
  if (!isSupabaseConfigured()) {
    return { connected: false, error: 'Supabase não configurado' };
  }
  
  try {
    const { data, error } = await supabase!.from('especialidades').select('count').limit(1);
    return { connected: !error, error: error?.message };
  } catch (err) {
    return { connected: false, error: 'Erro de conexão' };
  }
};