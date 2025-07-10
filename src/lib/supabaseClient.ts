import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;


  try {
    const { error } = await supabase.from('especialidades').select('count').limit(1);
    return { connected: !error };
  } catch (error) {
    return { connected: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
};
