// utils/timeUtils.ts
import { WorkingHours, Appointment, TimeSlot } from '../types';

/**
 * Gera os horários disponíveis para um dado período de trabalho do médico,
 * respeitando o intervalo definido na agenda (workingHours.interval).
 */
export function generateTimeSlots(
  workingHours: WorkingHours,
  date: string,
  appointments: Appointment[],
  doctorId: string
): TimeSlot[] {
  const slots: TimeSlot[] = [];

  // Extrai hora e minuto do início e fim do expediente
  const [startHour, startMinute] = workingHours.start.split(':').map(Number);
  const [endHour, endMinute] = workingHours.end.split(':').map(Number);

  // Usa o intervalo definido na agenda, default 15 minutos se não existir
  const interval = workingHours.interval ?? 15;

  // Cria objetos Date para controlar os horários
  const startTime = new Date(`${date}T${workingHours.start}:00`);
  const endTime = new Date(`${date}T${workingHours.end}:00`);

  let current = new Date(startTime);

  // Loop para criar todos os slots até o fim do expediente
  while (current < endTime) {
    const time = current.toTimeString().slice(0, 5); // Formato HH:MM

    // Verifica se já existe uma consulta nesse horário para o médico
    const isTaken = appointments.some(
      (appt) =>
        appt.date === date && appt.time === time && appt.doctorId === doctorId
    );

    slots.push({
      doctorId,
      time,
      available: !isTaken,
    });

    // Incrementa o horário atual pelo intervalo definido
    current.setMinutes(current.getMinutes() + interval);
  }

  return slots;
}
