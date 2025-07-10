import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Doctor, Specialty, Insurance, Appointment } from '../types';

// Check if Supabase is configured before making requests
const checkSupabase = () => {
  if (!isSupabaseConfigured() || !supabase) {
    throw new Error('Supabase não configurado. Verifique a URL e a chave API em ../lib/supabase.');
  }
};

// Test all database operations
export const testDatabaseOperations = async () => {
  const results = {
    specialties: { read: false, write: false },
    doctors: { read: false, write: false },
    insurances: { read: false, write: false },
    appointments: { read: false, write: false }
  };

  try {
    await getSpecialties();
    results.specialties.read = true;
    await getDoctors();
    results.doctors.read = true;
    await getInsurances();
    results.insurances.read = true;
    await getAppointments();
    results.appointments.read = true;
  } catch (error) {
    console.warn('Database test failed:', error instanceof Error ? error.message : error);
  }

  return results;
};

// Specialties
export const getSpecialties = async (): Promise<Specialty[]> => {
  checkSupabase();
  const { data, error } = await supabase!.from('especialidades').select('*');
  if (error) throw new Error(`Erro ao buscar especialidades: ${error.message}`);
  return data?.map(item => ({
    id: item.id?.toString() || '',
    name: item.nome || '',
    description: item.descricao || item.nome || '',
    createdAt: item.created_at ? new Date(item.created_at) : new Date()
  })) || [];
};

export const addSpecialty = async (specialty: Specialty): Promise<Specialty> => {
  checkSupabase();
  const { data, error } = await supabase!
    .from('especialidades')
    .insert({ nome: specialty.name, descricao: specialty.description })
    .select()
    .single();
  if (error) throw new Error(`Erro ao adicionar especialidade: ${error.message}`);
  return { ...specialty, id: data.id?.toString() || '', createdAt: new Date() };
};

export const updateSpecialty = async (specialty: Specialty): Promise<Specialty> => {
  checkSupabase();
  const { error } = await supabase!
    .from('especialidades')
    .update({ nome: specialty.name, descricao: specialty.description })
    .eq('id', specialty.id);
  if (error) throw new Error(`Erro ao atualizar especialidade: ${error.message}`);
  return specialty;
};

export const deleteSpecialty = async (id: string): Promise<void> => {
  checkSupabase();
  const { error } = await supabase!.from('especialidades').delete().eq('id', id);
  if (error) throw new Error(`Erro ao deletar especialidade: ${error.message}`);
};

// Insurances
export const getInsurances = async (): Promise<Insurance[]> => {
  checkSupabase();
  const { data, error } = await supabase!.from('convenios').select('*');
  if (error) throw new Error(`Erro ao buscar convênios: ${error.message}`);
  return data?.map(item => ({
    id: item.id?.toString() || '',
    name: item.nome || '',
    type: item.tipo as 'private' | 'public' || 'private'
  })) || [];
};

export const addInsurance = async (insurance: Insurance): Promise<Insurance> => {
  checkSupabase();
  const { data, error } = await supabase!
    .from('convenios')
    .insert({ nome: insurance.name, tipo: insurance.type })
    .select()
    .single();
  if (error) throw new Error(`Erro ao adicionar convênio: ${error.message}`);
  return { ...insurance, id: data.id?.toString() || '' };
};

export const updateInsurance = async (insurance: Insurance): Promise<Insurance> => {
  checkSupabase();
  const { error } = await supabase!
    .from('convenios')
    .update({ nome: insurance.name, tipo: insurance.type })
    .eq('id', insurance.id);
  if (error) throw new Error(`Erro ao atualizar convênio: ${error.message}`);
  return insurance;
};

export const deleteInsurance = async (id: string): Promise<void> => {
  checkSupabase();
  const { error } = await supabase!.from('convenios').delete().eq('id', id);
  if (error) throw new Error(`Erro ao deletar convênio: ${error.message}`);
};

// Doctors
export const getDoctors = async (): Promise<Doctor[]> => {
  checkSupabase();
  const { data, error } = await supabase!
    .from('medicos')
    .select(`
      *,
      medico_convenios(convenio_id),
      agenda(*)
    `);
  if (error) throw new Error(`Erro ao buscar médicos: ${error.message}`);
  
  return data?.map(item => ({
    id: item.id?.toString() || '',
    name: item.nome || '',
    crm: item.crm || '',
    specialtyId: item.especialidade_id?.toString() || '',
    insurances: (item.medico_convenios as { convenio_id: string }[])?.map(mc => mc.convenio_id) || [],
    workingHours: (item.agenda as { dia_semana: string; horario_inicio: string; horario_fim: string }[])?.map(a => ({
      day: getDayFromPortuguese(a.dia_semana),
      startTime: a.horario_inicio || '08:00',
      endTime: a.horario_fim || '17:00',
      intervalMinutes: 30
    })) || [],
    createdAt: item.created_at ? new Date(item.created_at) : new Date()
  })) || [];
};

export const addDoctor = async (doctor: Doctor): Promise<Doctor> => {
  checkSupabase();
  const { data: doctorData, error: doctorError } = await supabase!
    .from('medicos')
    .insert({
      nome: doctor.name,
      crm: doctor.crm,
      especialidade_id: doctor.specialtyId
    })
    .select()
    .single();
  
  if (doctorError) throw new Error(`Erro ao adicionar médico: ${doctorError.message}`);

  if (doctor.insurances.length > 0) {
    const { error: insuranceError } = await supabase!
      .from('medico_convenios')
      .insert(doctor.insurances.map(insuranceId => ({
        medico_id: doctorData.id?.toString() || '',
        convenio_id: insuranceId
      })));
    if (insuranceError) throw new Error(`Erro ao associar convênios: ${insuranceError.message}`);
  }

  if (doctor.workingHours.length > 0) {
    const { error: scheduleError } = await supabase!
      .from('agenda')
      .insert(doctor.workingHours.map(wh => ({
        medico_id: doctorData.id?.toString() || '',
        dia_semana: getPortugueseDay(wh.day),
        horario_inicio: wh.startTime,
        horario_fim: wh.endTime
      })));
    if (scheduleError) throw new Error(`Erro ao adicionar agenda: ${scheduleError.message}`);
  }

  return { ...doctor, id: doctorData.id?.toString() || '', createdAt: new Date() };
};

export const updateDoctor = async (doctor: Doctor): Promise<Doctor> => {
  checkSupabase();
  const { error: doctorError } = await supabase!
    .from('medicos')
    .update({
      nome: doctor.name,
      crm: doctor.crm,
      especialidade_id: doctor.specialtyId
    })
    .eq('id', doctor.id);
  
  if (doctorError) throw new Error(`Erro ao atualizar médico: ${doctorError.message}`);

  await supabase!.from('medico_convenios').delete().eq('medico_id', doctor.id);
  if (doctor.insurances.length > 0) {
    const { error: insuranceError } = await supabase!
      .from('medico_convenios')
      .insert(doctor.insurances.map(insuranceId => ({
        medico_id: doctor.id,
        convenio_id: insuranceId
      })));
    if (insuranceError) throw new Error(`Erro ao atualizar convênios: ${insuranceError.message}`);
  }

  await supabase!.from('agenda').delete().eq('medico_id', doctor.id);
  if (doctor.workingHours.length > 0) {
    const { error: scheduleError } = await supabase!
      .from('agenda')
      .insert(doctor.workingHours.map(wh => ({
        medico_id: doctor.id,
        dia_semana: getPortugueseDay(wh.day),
        horario_inicio: wh.startTime,
        horario_fim: wh.endTime
      })));
    if (scheduleError) throw new Error(`Erro ao atualizar agenda: ${scheduleError.message}`);
  }

  return doctor;
};

export const deleteDoctor = async (id: string): Promise<void> => {
  checkSupabase();
  const { error } = await supabase!.from('medicos').delete().eq('id', id);
  if (error) throw new Error(`Erro ao deletar médico: ${error.message}`);
};

// Appointments
export const getAppointments = async (): Promise<Appointment[]> => {
  checkSupabase();
  const { data, error } = await supabase!
    .from('agendamentos')
    .select(`
      *,
      usuarios(*)
    `);
  if (error) throw new Error(`Erro ao buscar agendamentos: ${error.message}`);
  
  return data?.map(item => ({
    id: item.id?.toString() || '',
    doctorId: item.medico_id?.toString() || '',
    date: item.data || '',
    time: item.horario || '',
    patient: {
      name: item.usuarios?.nome || '',
      birthDate: item.usuarios?.data_nascimento || '',
      city: item.usuarios?.cidade || '',
      phone: item.usuarios?.contato || '',
      email: item.usuarios?.email || item.usuarios?.contato || ''
    },
    insuranceId: item.convenio_id?.toString() || '',
    status: 'scheduled' as const,
    createdAt: item.criado_em ? new Date(item.criado_em) : new Date()
  })) || [];
};

export const addAppointment = async (appointment: Appointment): Promise<Appointment> => {
  checkSupabase();
  const { data: userData, error: userError } = await supabase!
    .from('usuarios')
    .insert({
      nome: appointment.patient.name,
      data_nascimento: appointment.patient.birthDate,
      cidade: appointment.patient.city,
      contato: appointment.patient.phone,
      email: appointment.patient.email
    })
    .select()
    .single();
  
  if (userError) throw new Error(`Erro ao criar usuário: ${userError.message}`);

  const { data: appointmentData, error: appointmentError } = await supabase!
    .from('agendamentos')
    .insert({
      usuario_id: userData.id?.toString() || '',
      medico_id: appointment.doctorId,
      data: appointment.date,
      horario: appointment.time,
      convenio_id: appointment.insuranceId
    })
    .select()
    .single();
  
  if (appointmentError) throw new Error(`Erro ao criar agendamento: ${appointmentError.message}`);

  return { ...appointment, id: appointmentData.id?.toString() || '', createdAt: new Date() };
};

// Helper functions
const getDayFromPortuguese = (day: string): string => {
  const dayMap: { [key: string]: string } = {
    'Segunda': 'monday',
    'Terça': 'tuesday',
    'Quarta': 'wednesday',
    'Quinta': 'thursday',
    'Sexta': 'friday',
    'Sábado': 'saturday',
    'Domingo': 'sunday'
  };
  return dayMap[day] || 'monday';
};

const getPortugueseDay = (day: string): string => {
  const dayMap: { [key: string]: string } = {
    'monday': 'Segunda',
    'tuesday': 'Terça',
    'wednesday': 'Quarta',
    'thursday': 'Quinta',
    'friday': 'Sexta',
    'saturday': 'Sábado',
    'sunday': 'Domingo'
  };
  return dayMap[day] || 'Segunda';
};
