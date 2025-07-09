import { WorkingHours, TimeSlot, Appointment } from '../types';

export const generateTimeSlots = (
  workingHours: WorkingHours,
  date: string,
  appointments: Appointment[],
  doctorId: string
): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const [startHour, startMinute] = workingHours.startTime.split(':').map(Number);
  const [endHour, endMinute] = workingHours.endTime.split(':').map(Number);
  
  const startTime = startHour * 60 + startMinute;
  const endTime = endHour * 60 + endMinute;
  
  // Get booked appointments for this doctor and date
  const bookedSlots = appointments
    .filter(apt => apt.doctorId === doctorId && apt.date === date && apt.status === 'scheduled')
    .map(apt => apt.time);
  
  for (let time = startTime; time < endTime; time += workingHours.intervalMinutes) {
    const hour = Math.floor(time / 60);
    const minute = time % 60;
    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    
    slots.push({
      time: timeString,
      available: !bookedSlots.includes(timeString),
      doctorId,
    });
  }
  
  return slots;
};

export const getDayName = (date: string): string => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayIndex = new Date(date).getDay();
  return days[dayIndex];
};

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatTime = (time: string): string => {
  return time;
};

export const getNextBusinessDays = (count: number): string[] => {
  const days: string[] = [];
  const today = new Date();
  
  for (let i = 1; days.length < count; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    // Skip weekends for simplicity
    if (date.getDay() !== 0 && date.getDay() !== 6) {
      days.push(date.toISOString().split('T')[0]);
    }
  }
  
  return days;