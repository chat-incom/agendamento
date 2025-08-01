export interface Specialty {
  id: string;
  name: string;
}

export interface Insurance {
  id: string;
  name: string;
}

export interface WorkingHours {
  day: string;
  startTime: string;
  endTime: string;
  intervalMinutes?: number;
}

export interface Doctor {
  id: string;
  name: string;
  crm: string;
  specialtyId: string;
  insurances: string[];
  workingHours: WorkingHours[];
}

export interface Patient {
  name: string;
  birthDate: string;
  city: string;
  phone: string;
  email: string;
}

export interface Appointment {
  id: string;
  doctorId: string;
  date: string;
  time: string;
  patient: Patient;
  insuranceId?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  createdAt: Date;
}

export interface TimeSlot {
  doctorId: string;
  time: string;
  available: boolean;
  doctorName?: string;
}