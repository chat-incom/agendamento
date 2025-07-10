import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Calendar, Clock, User, Phone, Mail, MapPin, Shield, CheckCircle } from 'lucide-react';
import { Doctor, Specialty, Patient, Appointment, TimeSlot } from '../../types';
import { generateTimeSlots, getDayName, formatDate, getNextBusinessDays } from '../../utils/timeUtils';

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
  const { state, dispatch } = useApp() || { state: { doctors: [], appointments: [], specialties: [], insurances: [] }, dispatch: () => {} }; // Fallback
  const [currentStep, setCurrentStep] = useState<'datetime' | 'patient' | 'confirmation'>('datetime');
  const [selectedInsurance, setSelectedInsurance] = useState<string>('');
  const [patientData, setPatientData] = useState<Patient>({
    name: '',
    birthDate: '',
    city: '',
    phone: '',
    email: '',
  });
  const [datesWithAvailableDoctors, setDatesWithAvailableDoctors] = useState<string[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  // Calcula datas disponíveis quando os dados mudarem
  useEffect(() => {
    const availableDates = getNextBusinessDays(14);
    const filteredDates = availableDates.filter(date => {
      return getAvailableTimeSlots(date).some(slot => slot.available);
    });
    setDatesWithAvailableDoctors(filteredDates);
  }, [selectedDoctor, selectedSpecialty, state.doctors, state.appointments]);

  const getAvailableTimeSlots = (date: string): TimeSlot[] => {
    if (selectedDoctor) {
      const dayName = getDayName(date);
      const workingHours = selectedDoctor.workingHours.find(wh => wh.day === dayName);
      if (!workingHours) return [];
      return generateTimeSlots(workingHours, date, state.appointments || [], selectedDoctor.id);
    } else if (selectedSpecialty) {
      const doctors = state.doctors?.filter(d => d.specialtyId === selectedSpecialty.id) || [];
      const allSlots: TimeSlot[] = [];
      doctors.forEach(doctor => {
        const dayName = getDayName(date);
        const workingHours = doctor.workingHours.find(wh => wh.day === dayName);
        if (workingHours) {
          const slots = generateTimeSlots(workingHours, date, state.appointments || [], doctor.id);
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
      const doctors = state.doctors?.filter(doctor => doctor.specialtyId === selectedSpecialty.id) || [];
      for (const doctor of doctors) {
        const dayName = getDayName(selectedDate);
        const workingHours = doctor.workingHours.find(wh => wh.day === dayName);
        if (workingHours) {
          const slots = generateTimeSlots(workingHours, selectedDate, state.appointments || [], doctor.id);
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
          <div className={`flex items-center ${currentStep === 'datetime' ? 'text-blue-600' : currentStep === 'patient' || currentStep === 'confirmation' ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'datetime' ? 'bg-blue-600 text-white' : currentStep === 'patient' || currentStep === 'confirmation' ? 'bg-green-600 text-white' : 'bg-gray-300'}`}>
              1
            </div>
            <span className="ml-2 text-sm font-medium">Data e Horário</span>
          </div>
          <div className={`flex items-center ${currentStep === 'patient' ? 'text-blue-600' : currentStep === 'confirmation' ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'patient' ? 'bg-blue-600 text-white' : currentStep === 'confirmation' ? 'bg-green-600 text-white' : 'bg-gray-300'}`}>
              2
            </div>
            <span className="ml-2 text-sm font-medium">Dados Pessoais</span>
          </div>
          <div className={`flex items-center ${currentStep === 'confirmation' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'confirmation' ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
              3
            </div>
            <span className="ml-2 text-sm font-medium">Confirmação</span>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-lg p-8">
        {currentStep === 'datetime' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Escolha a Data
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                {datesWithAvailableDoctors.map((date) => (
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
            </div>
            {selectedDate && (
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Escolha o Horário
                </h3>
                <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-2">
                  {getAvailableTimeSlots(selectedDate)
                    .filter(slot => slot.available)
                    .map((slot) => (
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
                {getAvailableTimeSlots(selectedDate).filter(slot => slot.available).length === 0 && (
                  <p className="text-gray-500 text-center py-4">
                    Nenhum horário disponível para esta data
                  </p>
                )}
              </div>
            )}
            {selectedDate && selectedTime && (
              <div className="flex justify-end">
                <button
                  onClick={() => setCurrentStep('patient')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Continuar
                </button>
              </div>
            )}
          </div>
        )}
        {currentStep === 'patient' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Dados Pessoais
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={patientData.name}
                  onChange={(e) => setPatientData({ ...patientData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Nascimento *
                </label>
                <input
                  type="date"
                  value={patientData.birthDate}
                  onChange={(e) => setPatientData({ ...patientData, birthDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone *
                </label>
                <input
                  type="tel"
                  value={patientData.phone}
                  onChange={(e) => setPatientData({ ...patientData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={patientData.email}
                  onChange={(e) => setPatientData({ ...patientData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cidade *
              </label>
              <input
                type="text"
                value={patientData.city}
                onChange={(e) => setPatientData({ ...patientData, city: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Convênio
              </label>
              <select
                value={selectedInsurance}
                onChange={(e) => setSelectedInsurance(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Particular</option>
                {getAvailableInsurances().map(insuranceId => {
                  const insurance = state.insurances.find(i => i.id === insuranceId);
                  return (
                    <option key={insuranceId} value={insuranceId}>
                      {insurance?.name}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="flex justify-between">
              <button
                onClick={() => setCurrentStep('datetime')}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={() => setCurrentStep('confirmation')}
                disabled={!patientData.name || !patientData.birthDate || !patientData.phone || !patientData.email || !patientData.city}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Revisar
              </button>
            </div>
          </div>
        )}
        {currentStep === 'confirmation' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              Confirmar Agendamento
            </h3>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-4">Detalhes do Agendamento:</h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>Data:</strong> {formatDate(selectedDate)}</p>
                  <p><strong>Horário:</strong> {selectedTime}</p>
                  <p><strong>Médico:</strong> {(selectedDoctor || getDoctorForTimeSlot(selectedTime))?.name}</p>
                  <p><strong>Especialidade:</strong> {selectedSpecialty?.name || state.specialties.find(s => s.id === (selectedDoctor || getDoctorForTimeSlot(selectedTime))?.specialtyId)?.name}</p>
                </div>
                <div>
                  <p><strong>Paciente:</strong> {patientData.name}</p>
                  <p><strong>Telefone:</strong> {patientData.phone}</p>
                  <p><strong>Email:</strong> {patientData.email}</p>
                  <p><strong>Convênio:</strong> {selectedInsurance ? state.insurances.find(i => i.id === selectedInsurance)?.name : 'Particular'}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-between">
              <button
                onClick={() => setCurrentStep('patient')}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={handleConfirmAppointment}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                Confirmar Agendamento
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentForm;
