import { supabase, isSupabaseConfigured } from './supabaseClient';

export { supabase, isSupabaseConfigured };

export async function getUser() {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

export async function getConnectionStatus() {
  if (!supabase) {
    return { connected: false, error: 'Supabase não configurado' };
  }
  
  try {
    const { error } = await supabase.from('especialidades').select('count').limit(1);
    return { connected: !error };
  } catch (error) {
    return { connected: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
}

// Funções de dados locais para fallback
const localData = {
  especialidades: [
    { id: '1', nome: 'Cardiologia', created_at: new Date().toISOString() },
    { id: '2', nome: 'Dermatologia', created_at: new Date().toISOString() },
  ],
  convenios: [
    { id: '1', nome: 'Unimed', created_at: new Date().toISOString() },
    { id: '2', nome: 'Bradesco Saúde', created_at: new Date().toISOString() },
  ],
  medicos: [
    { id: '1', nome: 'Dr. João Silva', crm: '12345', especialidade_id: '1', created_at: new Date().toISOString() },
  ],
  agenda: [
    { id: '1', medico_id: '1', dia: 'monday', horario_inicio: '08:00', horario_fim: '17:00' },
  ],
  medico_convenios: [
    { id: '1', medico_id: '1', convenio_id: '1' },
  ],
  agendamentos: [],
  usuarios: [],
};

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