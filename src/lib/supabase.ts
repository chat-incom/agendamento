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
    // Test connection with a simple query
    const { error } = await supabase!.from('especialidades').select('id').limit(1);
    if (error) {
      return { connected: false, error: error.message };
    }
    return { connected: true };
  } catch (err) {
    return { connected: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
  }
};

// Test database tables
export const testDatabaseTables = async () => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase não configurado');
  }

  const tables = ['especialidades', 'medicos', 'convenios', 'agendamentos', 'usuarios', 'agenda', 'medico_convenios'];
  const results: { [key: string]: boolean } = {};

  for (const table of tables) {
    try {
      const { error } = await supabase!.from(table).select('*').limit(1);
      results[table] = !error;
    } catch {
      results[table] = false;
    }
  }

  return results;
};