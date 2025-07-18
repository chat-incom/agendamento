// Adicione estas interfaces no início do arquivo
interface Especialidade {
  id: string;
  nome: string;
  criado_por: string | null;
}

interface Convenio {
  id: string;
  nome: string;
  criado_por: string | null;
}

interface Medico {
  id: string;
  nome: string;
  crm: string;
  especialidade_id: string;
  criado_por: string | null;
  created_at: string;
}

interface MedicoConvenio {
  id: string;
  medico_id: string;
  convenio_id: string;
}

interface Agenda {
  id: string;
  medico_id: string;
  dia_semana: string;
  horario_inicio: string;
  horario_fim: string;
  tempo_intervalo: number;
}

interface Agendamento {
  id: string;
  usuario_id: string;
  medico_id: string;
  data: string;
  horario: string;
  convenio_id: string | null;
  criado_em: string;
}

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Validação simples de UUID
function validarUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

// Obtem o usuário autenticado
export async function getUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

// -------- INSERT --------

export async function inserirEspecialidade(nome: string) {
  const user = await getUser();
  const { data, error } = await supabase.from('especialidades').insert([{ nome, criado_por: user?.id }]).select().single();
  if (error) throw error;
  return data;
}

export async function inserirConvenio(nome: string) {
  const user = await getUser();
  const { data, error } = await supabase.from('convenios').insert([{ nome, criado_por: user?.id }]).select().single();
  if (error) throw error;
  return data;
}

export async function inserirMedico(nome: string, crm: string, especialidade_id: string) {
  if (!validarUUID(especialidade_id)) throw new Error('ID de especialidade inválido');
  const user = await getUser();
  const { data, error } = await supabase
    .from('medicos')
    .insert([{ nome, crm, especialidade_id, criado_por: user?.id }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function inserirMedicoConvenio(medico_id: string, convenio_id: string) {
  if (!validarUUID(medico_id) || !validarUUID(convenio_id)) throw new Error('ID inválido');
  const { data, error } = await supabase.from('medico_convenios').insert([{ medico_id, convenio_id }]).select().single();
  if (error) throw error;
  return data;
}

export async function inserirAgenda(medico_id: string, dia: string, horario_inicio: string, horario_fim: string) {
  if (!validarUUID(medico_id)) throw new Error('ID de médico inválido');
  const { data, error } = await supabase
    .from('agenda')
    .insert([{ medico_id, dia, horario_inicio, horario_fim }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function inserirAgendamento(usuario_id: string, medico_id: string, data: string, horario: string, convenio_id?: string) {
  if (!validarUUID(usuario_id) || !validarUUID(medico_id)) throw new Error('ID inválido');
  if (convenio_id && !validarUUID(convenio_id)) throw new Error('Convênio inválido');

  const { data: inserted, error } = await supabase
    .from('agendamentos')
    .insert([{ usuario_id, medico_id, data, horario, convenio_id }])
    .select()
    .single();

  if (error) throw error;
  return inserted;
}

// -------- SELECT --------

export async function listarEspecialidades() {
  const { data, error } = await supabase.from('especialidades').select('*');
  if (error) throw error;
  return data;
}

export async function listarConvenios() {
  const { data, error } = await supabase.from('convenios').select('*');
  if (error) throw error;
  return data;
}

export async function listarMedicos() {
  const { data, error } = await supabase.from('medicos').select('*');
  if (error) throw error;
  return data;
}

export async function listarMedicoConvenios() {
  const { data, error } = await supabase.from('medico_convenios').select('*');
  if (error) throw error;
  return data;
}

export async function listarHorarios() {
  const { data, error } = await supabase.from('agenda').select('*');
  if (error) throw error;
  return data;
}

export async function listarAgendamentos(usuario_id: string) {
  if (!validarUUID(usuario_id)) throw new Error('ID de usuário inválido');
  const { data, error } = await supabase.from('agendamentos').select('*').eq('usuario_id', usuario_id);
  if (error) throw error;
  return data;
}

// -------- UPDATE --------

export async function atualizarMedico(id: string, fields: Partial<{ nome: string; crm: string; especialidade_id: string }>) {
  if (!validarUUID(id)) throw new Error('ID inválido');
  const { data, error } = await supabase.from('medicos').update(fields).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function atualizarEspecialidade(id: string, nome: string) {
  if (!validarUUID(id)) throw new Error('ID inválido');
  const { data, error } = await supabase.from('especialidades').update({ nome }).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function atualizarConvenio(id: string, nome: string) {
  if (!validarUUID(id)) throw new Error('ID inválido');
  const { data, error } = await supabase.from('convenios').update({ nome }).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

// -------- DELETE --------

export async function deletarMedico(id: string) {
  if (!validarUUID(id)) throw new Error('ID inválido');
  const { error } = await supabase.from('medicos').delete().eq('id', id);
  if (error) throw error;
  return true;
}

export async function deletarEspecialidade(id: string) {
  if (!validarUUID(id)) throw new Error('ID inválido');
  const { error } = await supabase.from('especialidades').delete().eq('id', id);
  if (error) throw error;
  return true;
}

export async function deletarConvenio(id: string) {
  if (!validarUUID(id)) throw new Error('ID inválido');
  const { error } = await supabase.from('convenios').delete().eq('id', id);
  if (error) throw error;
  return true;
}

