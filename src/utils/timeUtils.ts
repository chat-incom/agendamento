import { WorkingHours, Appointment, TimeSlot } from '../types';

export function generateTimeSlots(
  workingHours: WorkingHours,
  date: string,
  appointments: Appointment[] = [],
  doctorId: string
): TimeSlot[] {
  const slots: TimeSlot[] = [];

  // Validações básicas
  if (!workingHours?.start || !workingHours?.end || !date) {
    throw new Error('Invalid input: start, end, or date is missing');
  }

  const [startHour, startMinute] = workingHours.start.split(':').map(Number);
  const [endHour, endMinute] = workingHours.end.split(':').map(Number);

  if (
    isNaN(startHour) || isNaN(startMinute) ||
    isNaN(endHour) || isNaN(endMinute) ||
    startHour < 0 || startHour > 23 || endHour < 0 || endHour > 23 ||
    startMinute < 0 || startMinute > 59 || endMinute < 0 || endMinute > 59
  ) {
    throw new Error('Invalid time format in workingHours');
  }

  const interval = Math.max(workingHours.interval ?? 15, 1); // Garante intervalo positivo

  const startTime = new Date(`${date}T${workingHours.start}:00`);
  const endTime = new Date(`${date}T${workingHours.end}:00`);

  if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
    throw new Error('Invalid date or time construction');
  }

  let current = new Date(startTime);

  while (current < endTime) {
    const time = current.toTimeString().slice(0, 5); // Formato HH:MM

    const isTaken = Array.isArray(appointments) ? appointments.some(
      (appt) => appt.date === date && appt.time === time && appt.doctorId === doctorId
    ) : false;

    slots.push({
      doctorId,
      time,
      available: !isTaken,
    });

    current.setMinutes(current.getMinutes() + interval);
  }

  return slots;
}
