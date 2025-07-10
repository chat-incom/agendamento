import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseKey);
};

export const getConnectionStatus = async () => {
  if (!supabase) {
    return { connected: false, error: 'Supabase não configurado' };
  }
  
  try {
    const { error } = await supabase.from('especialidades').select('count').limit(1);
    return { connected: !error };
  } catch (error) {
    return { connected: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
};