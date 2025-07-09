import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Doctor, Specialty, Insurance, Appointment } from '../types';

// Check if Supabase is configured before making requests
const checkSupabase = () => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }
};

// Specialties
export const getSpecialties = async (): Promise<Specialty[]> => {
  checkSupabase();
  const { data, error } = await supabase.from('especialidades').select('*');
  if (error) throw error;
  return data.map(item => ({
    id: item.id,
    name: item.nome,
    description: item.nome,
    createdAt: new Date()
  }));
};

export const addSpecialty = async (specialty: Specialty) => {
  checkSupabase();
  const { data, error } = await supabase
    .from('especialidades')
    .insert({ nome: specialty.name })
    .select()
    .single();
  if (error) throw error;
  return { ...specialty, id: data.id, createdAt: new Date() };
};

export const updateSpecialty = async (specialty: Specialty) => {
  checkSupabase();
  const { error } = await supabase
    .from('especialidades')
    .update({ nome: specialty.name })
    .eq('id', specialty.id);
  if (error) throw error;
  return specialty;
};

export const deleteSpecialty = async (id: string) => {
  checkSupabase();
  const { error } = await supabase.from('especialidades').delete().eq('id', id);
  if (error) throw error;
};

// Insurances
export const getInsurances = async (): Promise<Insurance[]> => {
  checkSupabase();
  const { data, error } = await supabase.from('convenios').select('*');
  if (error) throw error;
  return data.map(item => ({
    id: item.id,
    name: item.nome,
    type: 'private' as const
  }));
};

export const addInsurance = async (insurance: Insurance) => {
  checkSupabase();
  const { data, error } = await supabase
    .from('convenios')
    .insert({ nome: insurance.name })
    .select()
    .single();
  if (error) throw error;
  return { ...insurance, id: data.id };
};

export const updateInsurance = async (insurance: Insurance) => {
  checkSupabase();
  const { error } = await supabase
    .from('convenios')
    .update({ nome: insurance.name })
    .eq('id', insurance.id);
  if (error) throw error;
  return insurance;
};

export const deleteInsurance = async (id: string) => {
  checkSupabase();
  const { error } = await supabase.from('convenios').delete().eq('id', id);
  if (error) throw error;
};

// Doctors
export const getDoctors = async (): Promise<Doctor[]> => {
  checkSupabase();
  const { data, error } = await supabase
    .from('medicos')
    .select(`
      *,
      medico_convenios(convenio_id),
      agenda(*)
    `);
  if (error) throw error;
  
  return data.map(item => ({
    id: item.id,
    name: item.nome,
    crm: item.crm,
    specialtyId: item.especialidade_id,
    insurances: item.medico_convenios?.map((mc: any) => mc.convenio_id) || [],
    workingHours: item.agenda?.map((a: any) => ({
      day: getDayFromPortuguese(a.dia_semana),
      startTime: a.horario_inicio,
      endTime: a.horario_fim,
      intervalMinutes: 30
    })) || [],
    createdAt: new Date()
  }));
};

export const addDoctor = async (doctor: Doctor) => {
  checkSupabase();
  const { data: doctorData, error: doctorError } = await supabase
    .from('medicos')
    .insert({
      nome: doctor.name,
      crm: doctor.crm,
      especialidade_id: doctor.specialtyId
    })
    .select()
    .single();
  
  if (doctorError) throw doctorError;

  // Add insurance relationships
  if (doctor.insurances.length > 0) {
    const { error: insuranceError } = await supabase
      .from('medico_convenios')
      .insert(
        doctor.insurances.map(insuranceId => ({
          medico_id: doctorData.id,
          convenio_id: insuranceId
        }))
      );
    if (insuranceError) throw insuranceError;
  }

  // Add working hours
  if (doctor.workingHours.length > 0) {
    const { error: scheduleError } = await supabase
      .from('agenda')
      .insert(
        doctor.workingHours.map(wh => ({
          medico_id: doctorData.id,
          dia_semana: getPortugueseDay(wh.day),
          horario_inicio: wh.startTime,
          horario_fim: wh.endTime
        }))
      );
    if (scheduleError) throw scheduleError;
  }

  return { ...doctor, id: doctorData.id, createdAt: new Date() };
};

export const updateDoctor = async (doctor: Doctor) => {
  checkSupabase();
  const { error: doctorError } = await supabase
    .from('medicos')
    .update({
      nome: doctor.name,
      crm: doctor.crm,
      especialidade_id: doctor.specialtyId
    })
    .eq('id', doctor.id);
  
  if (doctorError) throw doctorError;

  // Update insurance relationships
  await supabase.from('medico_convenios').delete().eq('medico_id', doctor.id);
  if (doctor.insurances.length > 0) {
    const { error: insuranceError } = await supabase
      .from('medico_convenios')
      .insert(
        doctor.insurances.map(insuranceId => ({
          medico_id: doctor.id,
          convenio_id: insuranceId
        }))
      );
    if (insuranceError) throw insuranceError;
  }

  // Update working hours
  await supabase.from('agenda').delete().eq('medico_id', doctor.id);
  if (doctor.workingHours.length > 0) {
    const { error: scheduleError } = await supabase
      .from('agenda')
      .insert(
        doctor.workingHours.map(wh => ({
          medico_id: doctor.id,
          dia_semana: getPortugueseDay(wh.day),
          horario_inicio: wh.startTime,
          horario_fim: wh.endTime
        }))
      );
    if (scheduleError) throw scheduleError;
  }

  return doctor;
};

export const deleteDoctor = async (id: string) => {
  checkSupabase();
  const { error } = await supabase.from('medicos').delete().eq('id', id);
  if (error) throw error;
};

// Appointments
export const getAppointments = async (): Promise<Appointment[]> => {
  checkSupabase();
  const { data, error } = await supabase
    .from('agendamentos')
    .select(`
      *,
      usuarios(*)
    `);
  if (error) throw error;
  
  return data.map(item => ({
    id: item.id,
    doctorId: item.medico_id,
    date: item.data,
    time: item.horario,
    patient: {
      name: item.usuarios?.nome || '',
      birthDate: item.usuarios?.data_nascimento || '',
      city: item.usuarios?.cidade || '',
      phone: item.usuarios?.contato || '',
      email: item.usuarios?.contato || ''
    },
    insuranceId: item.convenio_id,
    status: 'scheduled' as const,
    createdAt: new Date(item.criado_em)
  }));
};

export const addAppointment = async (appointment: Appointment) => {
  checkSupabase();
  // First create user
  const { data: userData, error: userError } = await supabase
    .from('usuarios')
    .insert({
      nome: appointment.patient.name,
      data_nascimento: appointment.patient.birthDate,
      cidade: appointment.patient.city,
      contato: appointment.patient.phone
    })
    .select()
    .single();
  
  if (userError) throw userError;

  // Then create appointment
  const { data: appointmentData, error: appointmentError } = await supabase
    .from('agendamentos')
    .insert({
      usuario_id: userData.id,
      medico_id: appointment.doctorId,
      data: appointment.date,
      horario: appointment.time,
      convenio_id: appointment.insuranceId
    })
    .select()
    .single();
  
  if (appointmentError) throw appointmentError;

  return { ...appointment, id: appointmentData.id, createdAt: new Date() };
};

// Helper functions
const getDayFromPortuguese = (day: string) => {
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

const getPortugueseDay = (day: string) => {
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