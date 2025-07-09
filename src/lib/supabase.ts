import { supabase } from './supabaseClient'; // ajuste o caminho conforme seu projeto

// Validação simples de UUID
function validarUUID(id) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

// Pega usuário autenticado
async function getUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Usuário não autenticado');
  return user;
}

// -------- INSERT --------

export async function inserirEspecialidade(nome) {
  const user = await getUser();
  const { data, error } = await supabase
    .from('especialidades')
    .insert([{ nome, criado_por: user.id }]);
  if (error) throw error;
  return data[0];
}

export async function inserirConvenio(nome) {
  const user = await getUser();
  const { data, error } = await supabase
    .from('convenios')
    .insert([{ nome, criado_por: user.id }]);
  if (error) throw error;
  return data[0];
}

export async function inserirMedico(nome, crm, especialidade_id) {
  const user = await getUser();
  if (!validarUUID(especialidade_id)) throw new Error('ID de especialidade inválido');
  const { data, error } = await supabase
    .from('medicos')
    .insert([{ nome, crm, especialidade_id, criado_por: user.id }]);
  if (error) throw error;
  return data[0];
}

export async function inserirMedicoConvenio(medico_id, convenio_id) {
  if (!validarUUID(medico_id)) throw new Error('ID de médico inválido');
  if (!validarUUID(convenio_id)) throw new Error('ID de convênio inválido');
  const { data, error } = await supabase
    .from('medico_convenios')
    .insert([{ medico_id, convenio_id }]);
  if (error) throw error;
  return data[0];
}

export async function inserirAgenda(medico_id, dia_semana, horario_inicio, horario_fim) {
  if (!validarUUID(medico_id)) throw new Error('ID de médico inválido');
  const { data, error } = await supabase
    .from('agenda')
    .insert([{ medico_id, dia_semana, horario_inicio, horario_fim }]);
  if (error) throw error;
  return data[0];
}

export async function inserirUsuario(nome, data_nascimento, cidade, contato) {
  const { data, error } = await supabase
    .from('usuarios')
    .insert([{ nome, data_nascimento, cidade, contato }]);
  if (error) throw error;
  return data[0];
}

export async function inserirAgendamento(usuario_id, medico_id, data, horario, convenio_id) {
  if (!validarUUID(usuario_id)) throw new Error('ID de usuário inválido');
  if (!validarUUID(medico_id)) throw new Error('ID de médico inválido');
  if (convenio_id && !validarUUID(convenio_id)) throw new Error('ID de convênio inválido');

  const { data, error } = await supabase
    .from('agendamentos')
    .insert([{ usuario_id, medico_id, data, horario, convenio_id }]);
  if (error) throw error;
  return data[0];
}

// -------- READ --------

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

export async function listarMedicoConvenios(medico_id) {
  if (!validarUUID(medico_id)) throw new Error('ID de médico inválido');
  const { data, error } = await supabase
    .from('medico_convenios')
    .select('*')
    .eq('medico_id', medico_id);
  if (error) throw error;
  return data;
}

export async function listarAgenda(medico_id) {
  if (!validarUUID(medico_id)) throw new Error('ID de médico inválido');
  const { data, error } = await supabase
    .from('agenda')
    .select('*')
    .eq('medico_id', medico_id);
  if (error) throw error;
  return data;
}

export async function listarUsuarios() {
  const { data, error } = await supabase.from('usuarios').select('*');
  if (error) throw error;
  return data;
}

export async function listarAgendamentos(usuario_id) {
  if (!validarUUID(usuario_id)) throw new Error('ID de usuário inválido');
  const { data, error } = await supabase
    .from('agendamentos')
    .select('*')
    .eq('usuario_id', usuario_id);
  if (error) throw error;
  return data;
}

// -------- UPDATE --------

export async function atualizarEspecialidade(id, novoNome) {
  if (!validarUUID(id)) throw new Error('ID inválido');
  const { data, error } = await supabase
    .from('especialidades')
    .update({ nome: novoNome })
    .eq('id', id);
  if (error) throw error;
  return data[0];
}

export async function atualizarConvenio(id, novoNome) {
  if (!validarUUID(id)) throw new Error('ID inválido');
  const { data, error } = await supabase
    .from('convenios')
    .update({ nome: novoNome })
    .eq('id', id);
  if (error) throw error;
  return data[0];
}

export async function atualizarMedico(id, dados) {
  if (!validarUUID(id)) throw new Error('ID inválido');
  const { data, error } = await supabase
    .from('medicos')
    .update(dados)
    .eq('id', id);
  if (error) throw error;
  return data[0];
}

export async function atualizarAgenda(id, dados) {
  if (!validarUUID(id)) throw new Error('ID inválido');
  const { data, error } = await supabase
    .from('agenda')
    .update(dados)
    .eq('id', id);
  if (error) throw error;
  return data[0];
}

export async function atualizarUsuario(id, dados) {
  if (!validarUUID(id)) throw new Error('ID inválido');
  const { data, error } = await supabase
    .from('usuarios')
    .update(dados)
    .eq('id', id);
  if (error) throw error;
  return data[0];
}

export async function atualizarAgendamento(id, dados) {
  if (!validarUUID(id)) throw new Error('ID inválido');
  const { data, error } = await supabase
    .from('agendamentos')
    .update(dados)
    .eq('id', id);
  if (error) throw error;
  return data[0];
}

// -------- DELETE --------

export async function deletarEspecialidade(id) {
  if (!validarUUID(id)) throw new Error('ID inválido');
  const { error } = await supabase.from('especialidades').delete().eq('id', id);
  if (error) throw error;
  return true;
}

export async function deletarConvenio(id) {
  if (!validarUUID(id)) throw new Error('ID inválido');
  const { error } = await supabase.from('convenios').delete().eq('id', id);
  if (error) throw error;
  return true;
}

export async function deletarMedico(id) {
  if (!validarUUID(id)) throw new Error('ID inválido');
  const { error } = await supabase.from('medicos').delete().eq('id', id);
  if (error) throw error;
  return true;
}

export async function deletarMedicoConvenio(id) {
  if (!validarUUID(id)) throw new Error('ID inválido');
  const { error } = await supabase.from('medico_convenios').delete().eq('id', id);
  if (error) throw error;
  return true;
}

export async function deletarAgenda(id) {
  if (!validarUUID(id)) throw new Error('ID inválido');
  const { error } = await supabase.from('agenda').delete().eq('id', id);
  if (error) throw error;
  return true;
}

export async function deletarUsuario(id) {
  if (!validarUUID(id)) throw new Error('ID inválido');
  const { error } = await supabase.from('usuarios').delete().eq('id', id);
  if (error) throw error;
  return true;
}

export async function deletarAgendamento(id) {
  if (!validarUUID(id)) throw new Error('ID inválido');
  const { error } = await supabase.from('agendamentos').delete().eq('id', id);
  if (error) throw error;
  return true;
}
