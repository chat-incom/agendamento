export interface Specialty {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
}

export interface Insurance {
  id: string;
  name: string;
  type: 'public' | 'private';
}

export interface Doctor {
  id: string;
  name: string;
  crm: string;
  specialtyId: string;
  insurances: string[];
  workingHours: WorkingHours[];
  createdAt: Date;
}

export interface WorkingHours {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  startTime: string;
  endTime: string;
  intervalMinutes: number;
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
  status: 'scheduled' | 'cancelled' | 'completed';
  createdAt: Date;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  doctorId: string;
}