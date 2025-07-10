
import { WorkingHours, Appointment, TimeSlot } from '../types/index';

export function generateTimeSlots(
  workingHours: WorkingHours,
  date: string,
  appointments: Appointment[] = [],
  doctorId: string
): TimeSlot[] {
  const slots: TimeSlot[] = [];

  if (!workingHours?.startTime || !workingHours?.endTime || !date) {
    return slots;
  }

  const [startHour, startMinute] = workingHours.startTime.split(':').map(Number);
  const [endHour, endMinute] = workingHours.endTime.split(':').map(Number);

  if (isNaN(startHour) || isNaN(startMinute) || isNaN(endHour) || isNaN(endMinute)) {
    return slots;
  }

  const interval = workingHours.intervalMinutes || 15;
  const startTime = new Date(`${date}T${workingHours.startTime}:00`);
  const endTime = new Date(`${date}T${workingHours.endTime}:00`);

  if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
    return slots;
  }

  const current = new Date(startTime);

  while (current < endTime) {
    const time = current.toTimeString().slice(0, 5);
    const isTaken = appointments.some(
      (appt) => appt.date === date && appt.time === time && appt.doctorId === doctorId
    );

    slots.push({
      doctorId,
      time,
      available: !isTaken,
    });

    current.setMinutes(current.getMinutes() + interval);
  }

  return slots;
}

export function formatDate(dateString: string): string {
  return format(new Date(dateString), 'dd/MM/yyyy, EEEE');
}

export function formatTime(timeString: string): string {
  return timeString.slice(0, 5);
}

export function getDayName(dateString: string): string {
  const date = new Date(dateString);
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
}

export function getNextBusinessDays(count: number): string[] {
  const dates: string[] = [];
  const today = new Date();
  
  for (let i = 1; dates.length < count; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    // Skip weekends
    if (date.getDay() !== 0 && date.getDay() !== 6) {
      dates.push(date.toISOString().split('T')[0]);
    }
  }
  
  return dates;
}
