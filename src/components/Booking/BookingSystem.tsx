import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { format } from 'date-fns';
import { Doctor } from '../../types';

const BookingSystem: React.FC = () => {
  const { state, dispatch } = useApp();

  const [step, setStep] = useState(1);
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedInsuranceId, setSelectedInsuranceId] = useState('');

  const filteredDoctors = selectedSpecialtyId
    ? state.doctors.filter(doc => doc.specialtyId === selectedSpecialtyId)
    : [];

  const selectedDoctor = state.doctors.find(doc => doc.id === selectedDoctorId);

  const availableTimes = selectedDoctor?.workingHours
    .filter(h => h.day === new Date(selectedDate).getDay())
    .flatMap(h => {
      const [startHour, startMin] = h.startTime.split(':').map(Number);
      const [endHour, endMin] = h.endTime.split(':').map(Number);
      const times: string[] = [];
      let hour = startHour;
      let minute = startMin;

      while (hour < endHour || (hour === endHour && minute < endMin)) {
        times.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
        minute += 30;
        if (minute >= 60) {
          minute -= 60;
          hour += 1;
        }
      }

      return times;
    }) || [];

  const handleSubmit = () => {
    if (!selectedDoctorId || !selectedDate || !selectedTime || !selectedInsuranceId) return;

    dispatch({
      type: 'ADD_APPOINTMENT',
      payload: {
        id: Date.now().toString(),
        doctorId: selectedDoctorId,
        date: selectedDate,
        time: selectedTime,
        insuranceId: selectedInsuranceId,
        status: 'scheduled',
        createdAt: new Date(),
        patient: { name: '', birthDate: '', city: '', phone: '', email: '' }
      }
    });

    alert('Agendamento realizado com sucesso!');
    setStep(1);
    setSelectedSpecialtyId('');
    setSelectedDoctorId('');
    setSelectedDate('');
    setSelectedTime('');
    setSelectedInsuranceId('');
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Agendamento</h2>

      {step === 1 && (
        <>
          <label className="block mb-2">Escolha uma especialidade:</label>
          <select
            className="w-full border p-2 mb-4"
            value={selectedSpecialtyId}
            onChange={e => {
              setSelectedSpecialtyId(e.target.value);
              setStep(2);
            }}
          >
            <option value="">Selecione...</option>
            {state.specialties.map(s => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </>
      )}

      {step === 2 && filteredDoctors.length > 0 && (
        <>
          <label className="block mb-2">Escolha um médico:</label>
          <select
            className="w-full border p-2 mb-4"
            value={selectedDoctorId}
            onChange={e => {
              setSelectedDoctorId(e.target.value);
              setStep(3);
            }}
          >
            <option value="">Selecione...</option>
            {filteredDoctors.map(doc => (
              <option key={doc.id} value={doc.id}>
                {doc.name}
              </option>
            ))}
          </select>
        </>
      )}

      {step === 3 && selectedDoctor && (
        <>
          <label className="block mb-2">Escolha uma data:</label>
          <input
            type="date"
            className="w-full border p-2 mb-4"
            value={selectedDate}
            onChange={e => {
              setSelectedDate(e.target.value);
              setStep(4);
            }}
          />
        </>
      )}

      {step === 4 && availableTimes.length > 0 && (
        <>
          <label className="block mb-2">Escolha um horário:</label>
          <select
            className="w-full border p-2 mb-4"
            value={selectedTime}
            onChange={e => {
              setSelectedTime(e.target.value);
              setStep(5);
            }}
          >
            <option value="">Selecione...</option>
            {availableTimes.map((time, idx) => (
              <option key={idx} value={time}>
                {time}
              </option>
            ))}
          </select>
        </>
      )}

      {step === 5 && (
        <>
          <label className="block mb-2">Escolha o convênio:</label>
          <select
            className="w-full border p-2 mb-4"
            value={selectedInsuranceId}
            onChange={e => setSelectedInsuranceId(e.target.value)}
          >
            <option value="">Selecione...</option>
            {state.insurances
              .filter(i => selectedDoctor?.insurances.includes(i.id))
              .map(i => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
          </select>

          <button
            className="w-full bg-blue-600 text-white p-2 rounded"
            onClick={handleSubmit}
            disabled={!selectedInsuranceId}
          >
            Confirmar Agendamento
          </button>
        </>
      )}
    </div>
  );
};

export default BookingSystem;


