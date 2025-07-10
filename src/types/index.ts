import { WorkingHours, Appointment, TimeSlot } from '../types/index';

export function generateTimeSlots(
  workingHours: WorkingHours,
  date: string,
  appointments: Appointment[] = [],
  doctorId: string
): TimeSlot[] {
  const slots: TimeSlot[] = [];

  if (!workingHours?.startTime || !workingHours?.endTime || !date) {
    throw new Error('Invalid input: startTime, endTime, or date is missing');
  }

  const [startHour, startMinute] = workingHours.startTime.split(':').map(Number);
  const [endHour, endMinute] = workingHours.endTime.split(':').map(Number);

  if (
    isNaN(startHour) || isNaN(startMinute) ||
    isNaN(endHour) || isNaN(endMinute) ||
    startHour < 0 || startHour > 23 || endHour < 0 || endHour > 23 ||
    startMinute < 0 || startMinute > 59 || endMinute < 0 || endMinute > 59
  ) {
    throw new Error('Invalid time format in workingHours');
  }

  const interval = Math.max(workingHours.intervalMinutes ?? 15, 1);

  const startTime = new Date(`${date}T${workingHours.startTime}:00`);
  const endTime = new Date(`${date}T${workingHours.endTime}:00`);

  if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
    throw new Error('Invalid date or time construction');
  }

  const current = new Date(startTime);

  while (current < endTime) {
    const time = current.toTimeString().slice(0, 5);

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
