export interface DatabaseSpecialty {
  id: string;
  nome: string;
  criado_por: string | null;
}

export interface DatabaseInsurance {
  id: string;
  nome: string;
  criado_por: string | null;
}

export interface DatabaseDoctor {
  id: string;
  nome: string;
  crm: string;
  especialidade_id: string | null;
  criado_por: string | null;
  created_at: string;
}

export interface DatabaseSchedule {
  id: string;
  medico_id: string | null;
  dia_semana: string | null;
  horario_inicio: string;
  horario_fim: string;
  tempo_intervalo: number | null;
}

export interface DatabaseAppointment {
  id: string;
  usuario_id: string | null;
  medico_id: string | null;
  data: string;
  horario: string;
  convenio_id: string | null;
  criado_em: string | null;
}

export interface DatabaseUser {
  id: string;
  nome: string;
  data_nascimento: string;
  cidade: string | null;
  contato: string | null;
}

export interface DatabaseDoctorInsurance {
  id: string;
  medico_id: string | null;
  convenio_id: string | null;
}