import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check for missing or placeholder values
const isPlaceholderUrl = !supabaseUrl || 
  supabaseUrl.includes('ixqjqjqjqjqjqjqj') || 
  supabaseUrl === 'your-project-url' ||
  supabaseUrl === 'https://your-project-id.supabase.co';

const isPlaceholderKey = !supabaseAnonKey || 
  supabaseAnonKey.includes('example_key_here') || 
  supabaseAnonKey === 'your-anon-key' ||
  supabaseAnonKey === 'your-anon-key-here';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please check your .env file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.');
  console.error('Current values:');
  console.error('VITE_SUPABASE_URL:', supabaseUrl || 'undefined');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '[HIDDEN]' : 'undefined');
}

if (isPlaceholderUrl || isPlaceholderKey) {
  console.warn('⚠️ Placeholder Supabase credentials detected');
  console.warn('For production use, please:');
  console.warn('1. Create a Supabase project at https://supabase.com');
  console.warn('2. Go to Settings > API in your Supabase dashboard');
  console.warn('3. Copy your Project URL and anon/public key');
  console.warn('4. Update your .env file with the real values');
  console.warn('Current URL:', supabaseUrl);
  console.warn('Key status:', isPlaceholderKey ? 'Placeholder detected' : 'Appears valid');
}

// Create Supabase client with fallback for development
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'cirplane-auth-token',
    debug: false
  },
  global: {
    headers: {
      'X-Client-Info': 'cirplane-web',
      'apikey': supabaseAnonKey
    }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 2
    }
  }
});

// Test connection only if we have valid credentials
if (supabaseUrl && supabaseAnonKey && !isPlaceholderUrl && !isPlaceholderKey) {
  supabase.from('user_profiles').select('count', { count: 'exact', head: true })
    .then(({ error }) => {
      if (error) {
        console.error('❌ Database connection test failed:', error.message);
        console.error('Please verify your Supabase project is active and your credentials are correct.');
      } else {
        console.log('✅ Database connection successful');
      }
    })
    .catch((err) => {
      console.error('❌ Network error connecting to Supabase:', err.message);
      console.error('Please check your internet connection and Supabase project status.');
    });
} else {
  console.log('⏳ Supabase client created with placeholder credentials - connection test skipped');
}


export async function listarEspecialidades() {
  if (!supabase) return localData.especialidades;
  const { data, error } = await supabase.from('especialidades').select('*');
  return error ? localData.especialidades : data || [];
}

export async function listarConvenios() {
  if (!supabase) return localData.convenios;
  const { data, error } = await supabase.from('convenios').select('*');
  return error ? localData.convenios : data || [];
}

export async function listarMedicos() {
  if (!supabase) return localData.medicos;
  const { data, error } = await supabase.from('medicos').select('*');
  return error ? localData.medicos : data || [];
}

export async function listarHorarios() {
  if (!supabase) return localData.agenda;
  const { data, error } = await supabase.from('agenda').select('*');
  return error ? localData.agenda : data || [];
}

export async function listarMedicoConvenios() {
  if (!supabase) return localData.medico_convenios;
  const { data, error } = await supabase.from('medico_convenios').select('*');
  return error ? localData.medico_convenios : data || [];
}

export async function listarAgendamentos(userId: string) {
  if (!supabase) return localData.agendamentos;
  const { data, error } = await supabase.from('agendamentos').select('*').eq('usuario_id', userId);
  return error ? localData.agendamentos : data || [];
}

export async function inserirUsuario(nome: string, dataNascimento: string, cidade: string, telefone: string) {
  if (!supabase) {
    return { id: Date.now().toString(), nome, data_nascimento: dataNascimento, cidade, contato: telefone };
  }
  
  const { data, error } = await supabase
    .from('usuarios')
    .insert([{ nome, data_nascimento: dataNascimento, cidade, contato: telefone }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function inserirAgendamento(
  usuarioId: string, 
  medicoId: string, 
  data: string, 
  horario: string, 
  convenioId?: string
) {
  if (!supabase) {
    const agendamento = {
      id: Date.now().toString(),
      usuario_id: usuarioId,
      medico_id: medicoId,
      data,
      horario,
      convenio_id: convenioId,
      created_at: new Date().toISOString()
    };
    localData.agendamentos.push(agendamento);
    return agendamento;
  }
  
  const { data: inserted, error } = await supabase
    .from('agendamentos')
    .insert([{ usuario_id: usuarioId, medico_id: medicoId, data, horario, convenio_id: convenioId }])
    .select()
    .single();
  
  if (error) throw error;
  return inserted;
}
