import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { Calendar, Clock, User, CheckCircle } from 'lucide-react';
import { Doctor, Specialty, Patient, Appointment, TimeSlot } from '../../types/index';
import { generateTimeSlots, getDayName, formatDate, getNextBusinessDays } from '../../utils/timeUtils';
import * as supabaseLib from '../../lib/supabase';

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
  const [datesWithAvailableDoctors, setDatesWithAvailableDoctors] = useState<string[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  const getDoctorForTimeSlot = useCallback((time: string): Doctor | null => {
    if (selectedDoctor) return selectedDoctor;
    
    if (selectedSpecialty && selectedDate) {
      const doctors = state.doctors.filter(doctor => doctor.specialtyId === selectedSpecialty.id);
      
      for (const doctor of doctors) {
        const dayName = getDayName(selectedDate);
        const workingHours = doctor.workingHours.find(wh => wh.day === dayName);
        
        if (workingHours) {
          const slots = generateTimeSlots(
            workingHours, 
            selectedDate, 
            state.appointments || [], 
            doctor.id
          );
          
          const availableSlot = slots.find(s => s.time === time && s.available);
          if (availableSlot) return doctor;
        }
      }
    }
    return null;
  }, [selectedDoctor, selectedSpecialty, selectedDate, state.doctors, state.appointments]);

  const getAvailableInsurances = useCallback((): string[] => {
    const doctor = selectedDoctor || getDoctorForTimeSlot(selectedTime);
    return doctor ? doctor.insurances : [];
  }, [selectedDoctor, selectedTime, getDoctorForTimeSlot]);

  const getAvailableTimeSlots = useCallback((date: string): TimeSlot[] => {
    if (selectedDoctor) {
      const dayName = getDayName(date);
      const workingHours = selectedDoctor.workingHours.find(wh => wh.day === dayName);
      
      return workingHours
        ? generateTimeSlots(workingHours, date, state.appointments || [], selectedDoctor.id)
        : [];
    }

    if (selectedSpecialty) {
      const doctors = state.doctors.filter(d => d.specialtyId === selectedSpecialty.id);
      const allSlots: TimeSlot[] = [];
      
      doctors.forEach(doctor => {
        const dayName = getDayName(date);
        const workingHours = doctor.workingHours.find(wh => wh.day === dayName);
        
        if (workingHours) {
          const slots = generateTimeSlots(
            workingHours, 
            date, 
            state.appointments || [], 
            doctor.id
          );
          allSlots.push(...slots);
        }
      });
      
      return allSlots.sort((a, b) => a.time.localeCompare(b.time));
    }
    
    return [];
  }, [selectedDoctor, selectedSpecialty, state.doctors, state.appointments]);

  useEffect(() => {
    const calculateAvailableDates = () => {
      const availableDates = getNextBusinessDays(14);
      const filteredDates = availableDates.filter((date) => {
        const slots = getAvailableTimeSlots(date);
        return slots.some((slot) => slot.available);
      });
      setDatesWithAvailableDoctors(filteredDates);
    };

    calculateAvailableDates();
  }, [selectedDoctor, selectedSpecialty, state.doctors, state.appointments, getAvailableTimeSlots]);

  const handleConfirmAppointment = async () => {
    const doctor = selectedDoctor || getDoctorForTimeSlot(selectedTime);
    if (!doctor) return;

    try {
      const userData = await supabaseLib.inserirUsuario(
        patientData.name,
        patientData.birthDate,
        patientData.city,
        patientData.phone
      );
      
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

      await supabaseLib.inserirAgendamento(
        userData.id,
        doctor.id,
        selectedDate,
        selectedTime,
        selectedInsurance
      );
      
      dispatch({ type: 'ADD_APPOINTMENT', payload: newAppointment });
      setShowSuccess(true);
    } catch (error) {
      console.error('Erro ao confirmar agendamento:', error);
    }
  };

  if (showSuccess) {
    const doctor = selectedDoctor || getDoctorForTimeSlot(selectedTime);
    const specialtyName = selectedSpecialty?.name || 
      state.specialties.find(s => s.id === doctor?.specialtyId)?.name;
    const insuranceName = selectedInsurance 
      ? state.insurances.find(i => i.id === selectedInsurance)?.name 
      : 'Particular';

    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="bg-green-100 p-4 rounded-full mx-auto mb-6 w-20 h-20 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Agendamento Confirmado!</h2>
          <p className="text-gray-600 mb-6">
            Seu agendamento foi confirmado com sucesso.
          </p>
          <div className="bg-gray-50 p-4 rounded-lg mb-6 text-left">
            <h3 className="font-semibold text-gray-800 mb-2">Detalhes do Agendamento:</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>Data:</strong> {formatDate(selectedDate)}</p>
              <p><strong>Horário:</strong> {selectedTime}</p>
              <p><strong>Médico:</strong> {doctor?.name}</p>
              <p><strong>Especialidade:</strong> {specialtyName}</p>
              <p><strong>Paciente:</strong> {patientData.name}</p>
              <p><strong>Convênio:</strong> {insuranceName}</p>
            </div>
          </div>
          <div className="flex space-x-4 justify-center">
            <button
              onClick={() => dispatch({ type: 'SET_VIEW', payload: 'booking' })}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Fazer Novo Agendamento
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
          {selectedDoctor 
            ? `Agendamento com ${selectedDoctor.name}` 
            : `Agendamento para ${selectedSpecialty?.name}`
          }
        </p>
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
                  return insurance ? (
                    <option key={insuranceId} value={insuranceId}>
                      {insurance.name}
                    </option>
                  ) : null;
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
                  <p><strong>Especialidade:</strong> {
                    selectedSpecialty?.name || 
                    state.specialties.find(s => s.id === (selectedDoctor || getDoctorForTimeSlot(selectedTime))?.specialtyId)?.name
                  }</p>
                </div>
                <div>
                  <p><strong>Paciente:</strong> {patientData.name}</p>
                  <p><strong>Telefone:</strong> {patientData.phone}</p>
                  <p><strong>Email:</strong> {patientData.email}</p>
                  <p><strong>Convênio:</strong> {
                    selectedInsurance 
                      ? state.insurances.find(i => i.id === selectedInsurance)?.name 
                      : 'Particular'
                  }</p>
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