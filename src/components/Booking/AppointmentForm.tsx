import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Calendar, Clock, User, CheckCircle } from 'lucide-react';
import { Doctor, Specialty, Patient, Appointment, TimeSlot } from '../../types/index';
import { generateTimeSlots, getDayName, formatDate, getNextBusinessDays } from '../../utils/timeUtils';
import { supabase } from '../../lib/supabaseClient';

interface AppointmentFormProps {
  selectedDoctor: Doctor | null;
  selectedSpecialty: Specialty | null;
  selectedDate: string;
  selectedTime: string;
  onDateSelect: (date: string) => void;
  onTimeSelect: (time: string) => void;
  onBack: () => void;
}

const AppointmentForm: React.FC<AppointmentFormProps> = ({
  selectedDoctor,
  selectedSpecialty,
  selectedDate,
  selectedTime,
  onDateSelect,
  onTimeSelect,
  onBack,
}) => {
  const { state, dispatch } = useApp();
  const [currentStep, setCurrentStep] = useState<'datetime' | 'patient' | 'confirmation'>('datetime');
  const [selectedInsurance, setSelectedInsurance] = useState<string>('');
  const [patientData, setPatientData] = useState<Patient>({
    name: '',
    birthDate: '',
    city: '',
    phone: '',
    email: '',
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [availableWeekdays, setAvailableWeekdays] = useState<string[]>([]);

  useEffect(() => {
    const fetchAgendaDays = async () => {
      if (selectedDoctor?.id) {
        const { data, error } = await supabase
          .from('agenda')
          .select('dia_semana')
          .eq('medico_id', selectedDoctor.id);

        if (error) {
          console.error('Erro ao buscar agenda do médico:', error);
          return;
        }

        if (data) {
          const dias = data.map((item) => item.dia_semana);
          setAvailableWeekdays([...new Set(dias)]);
        }
      } else if (selectedSpecialty?.id) {
        const doctors = state.doctors.filter(d => d.specialtyId === selectedSpecialty.id);
        const doctorIds = doctors.map(d => d.id);

        const { data, error } = await supabase
          .from('agenda')
          .select('dia_semana, medico_id')
          .in('medico_id', doctorIds);

        if (error) {
          console.error('Erro ao buscar agenda por especialidade:', error);
          return;
        }

        if (data) {
          const dias = data.map((item) => item.dia_semana);
          setAvailableWeekdays([...new Set(dias)]);
        }
      }
    };

    fetchAgendaDays();
  }, [selectedDoctor, selectedSpecialty, state.doctors]);

  const allNextDates = getNextBusinessDays(14);
  const availableDates = allNextDates.filter(date =>
    availableWeekdays.includes(getDayName(date))
  );

  const getAvailableTimeSlots = (date: string): TimeSlot[] => {
    if (selectedDoctor) {
      const dayName = getDayName(date);
      const workingHours = selectedDoctor.workingHours.find(wh => wh.day === dayName);
      if (!workingHours) return [];

      return generateTimeSlots(workingHours, date, state.appointments, selectedDoctor.id);
    } else if (selectedSpecialty) {
      const doctors = state.doctors.filter(d => d.specialtyId === selectedSpecialty.id);
      const allSlots: TimeSlot[] = [];

      doctors.forEach(doctor => {
        const dayName = getDayName(date);
        const workingHours = doctor.workingHours.find(wh => wh.day === dayName);
        if (workingHours) {
          const slots = generateTimeSlots(workingHours, date, state.appointments, doctor.id);
          allSlots.push(...slots);
        }
      });

      return allSlots.sort((a, b) => a.time.localeCompare(b.time));
    }

    return [];
  };

  const getDoctorForTimeSlot = (time: string): Doctor | null => {
    if (selectedDoctor) return selectedDoctor;

    if (selectedSpecialty && selectedDate) {
      const doctors = state.doctors.filter(d => d.specialtyId === selectedSpecialty.id);

      for (const doctor of doctors) {
        const dayName = getDayName(selectedDate);
        const workingHours = doctor.workingHours.find(wh => wh.day === dayName);
        if (workingHours) {
          const slots = generateTimeSlots(workingHours, selectedDate, state.appointments, doctor.id);
          const availableSlot = slots.find(s => s.time === time && s.available);
          if (availableSlot) return doctor;
        }
      }
    }

    return null;
  };

  const getAvailableInsurances = (): string[] => {
    const doctor = selectedDoctor || getDoctorForTimeSlot(selectedTime);
    return doctor ? doctor.insurances : [];
  };

  const handleConfirmAppointment = () => {
    const doctor = selectedDoctor || getDoctorForTimeSlot(selectedTime);
    if (!doctor) return;

    const newAppointment: Appointment = {
      id: Date.now().toString(),
      doctorId: doctor.id,
      date: selectedDate,
      time: selectedTime,
      patient: patientData,
      insuranceId: selectedInsurance || undefined,
      status: 'scheduled',
      createdAt: new Date(),
    };

    dispatch({ type: 'ADD_APPOINTMENT', payload: newAppointment });
    setShowSuccess(true);
  };

  const handleBackToBooking = () => {
    dispatch({ type: 'SET_VIEW', payload: 'booking' });
    setShowSuccess(false);
  };

  if (showSuccess) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="bg-green-100 p-4 rounded-full mx-auto mb-6 w-20 h-20 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Agendamento Confirmado!</h2>
          <p className="text-gray-600 mb-6">
            Seu agendamento foi confirmado com sucesso. Você receberá um email de confirmação em breve.
          </p>
          <div className="bg-gray-50 p-4 rounded-lg mb-6 text-left">
            <h3 className="font-semibold text-gray-800 mb-2">Detalhes do Agendamento:</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>Data:</strong> {formatDate(selectedDate)}</p>
              <p><strong>Horário:</strong> {selectedTime}</p>
              <p><strong>Médico:</strong> {(selectedDoctor || getDoctorForTimeSlot(selectedTime))?.name}</p>
              <p><strong>Especialidade:</strong> {selectedSpecialty?.name || state.specialties.find(s => s.id === (selectedDoctor || getDoctorForTimeSlot(selectedTime))?.specialtyId)?.name}</p>
              <p><strong>Paciente:</strong> {patientData.name}</p>
              <p><strong>Convênio:</strong> {selectedInsurance ? state.insurances.find(i => i.id === selectedInsurance)?.name : 'Particular'}</p>
            </div>
          </div>

          <div className="flex space-x-4 justify-center">
            <button
              onClick={handleBackToBooking}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Fazer Novo Agendamento
            </button>
            <button
              onClick={() => dispatch({ type: 'SET_VIEW', payload: 'login' })}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Voltar ao Início
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Finalizar Agendamento</h2>
        <p className="text-gray-600">
          {selectedDoctor ? `Agendamento com ${selectedDoctor.name}` : `Agendamento para ${selectedSpecialty?.name}`}
        </p>
      </div>

      <div className="flex justify-center mb-8">
        <div className="flex space-x-4">
          {/* Etapas do progresso */}
          {['datetime', 'patient', 'confirmation'].map((step, index) => (
            <div
              key={step}
              className={`flex items-center ${
                currentStep === step
                  ? 'text-blue-600'
                  : ['patient', 'confirmation'].includes(currentStep) && index < 2
                  ? 'text-green-600'
                  : 'text-gray-400'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep === step
                    ? 'bg-blue-600 text-white'
                    : ['patient', 'confirmation'].includes(currentStep) && index < 2
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-300'
                }`}
              >
                {index + 1}
              </div>
              <span className="ml-2 text-sm font-medium">
                {step === 'datetime'
                  ? 'Data e Horário'
                  : step === 'patient'
                  ? 'Dados Pessoais'
                  : 'Confirmação'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-8">
        {currentStep === 'datetime' && (
          <>
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Escolha a Data
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 mb-6">
              {availableDates.map(date => (
                <button
                  key={date}
                  onClick={() => onDateSelect(date)}
                  className={`p-3 rounded-lg border text-sm ${
                    selectedDate === date
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-300'
                  }`}
                >
                  {formatDate(date).split(',')[0]}
                </button>
              ))}
            </div>

            {selectedDate && (
              <>
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Escolha o Horário
                </h3>
                <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-2">
                  {getAvailableTimeSlots(selectedDate)
                    .filter(slot => slot.available)
                    .map(slot => (
                      <button
                        key={`${slot.doctorId}-${slot.time}`}
                        onClick={() => onTimeSelect(slot.time)}
                        className={`p-2 rounded-lg border text-sm ${
                          selectedTime === slot.time
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-300'
                        }`}
                      >
                        {slot.time}
                      </button>
                    ))}
                </div>
              </>
            )}

            {selectedDate && selectedTime && (
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setCurrentStep('patient')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Continuar
                </button>
              </div>
            )}
          </>
        )}

        {currentStep === 'patient' && (
          <>
            {/* Seu formulário de dados pessoais continua aqui... */}
          </>
        )}

        {currentStep === 'confirmation' && (
          <>
            {/* Etapa de revisão da consulta... */}
          </>
        )}
      </div>
    </div>
  );
};

export default AppointmentForm;

