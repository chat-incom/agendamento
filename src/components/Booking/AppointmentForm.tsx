import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Calendar, Clock, User, CheckCircle, Shield, Phone, Mail, MapPin } from 'lucide-react';
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
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);

  // Função auxiliar: obter o nome do dia
  const getDayName = (date: string): string => {
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return days[new Date(date).getDay()];
  };

  // Função: gerar horários disponíveis
  const generateTimeSlots = (
    workingHours: {
      day: string;
      startTime: string;
      endTime: string;
      intervalMinutes: number;
    },
    date: string,
    appointments: Appointment[],
    doctorId: string,
    doctorName: string
  ): TimeSlot[] => {
    const slots: TimeSlot[] = [];

    const start = new Date(`${date}T${workingHours.startTime}`);
    const end = new Date(`${date}T${workingHours.endTime}`);

    let current = new Date(start);

    while (current < end) {
      const timeString = current.toTimeString().slice(0, 5); // HH:mm

      const isBooked = appointments.some(
        apt => apt.time.slice(0, 5) === timeString
      );

      slots.push({
        doctorId,
        date,
        time: timeString,
        available: !isBooked,
        doctorName,
      });

      current.setMinutes(current.getMinutes() + workingHours.intervalMinutes);
    }

    return slots;
  };

  // Carregar datas disponíveis
  useEffect(() => {
    const loadAvailableDates = async () => {
      try {
        let doctorIds: string[] = [];

        if (selectedDoctor) {
          doctorIds = [selectedDoctor.id];
        } else if (selectedSpecialty) {
          doctorIds = state.doctors
            .filter(d => d.specialtyId === selectedSpecialty.id)
            .map(d => d.id);
        }

        if (doctorIds.length === 0) {
          setAvailableDates([]);
          return;
        }

        const { data: agendaData, error } = await supabase
          .from('agenda')
          .select('dia_semana, medico_id')
          .in('medico_id', doctorIds);

        if (error) {
          console.error('Erro ao carregar agenda:', error);
          setAvailableDates([]);
          return;
        }

        // Próximos 30 dias
        const next30Days: string[] = [];
        const today = new Date();
        for (let i = 1; i <= 30; i++) {
          const date = new Date(today);
          date.setDate(today.getDate() + i);
          next30Days.push(date.toISOString().split('T')[0]);
        }

        // Dias da semana com médicos disponíveis
        const availableWeekdays = [...new Set(agendaData?.map(a => a.dia_semana) || [])];
        const filteredDates = next30Days.filter(date => {
          const dayName = getDayName(date);
          return availableWeekdays.includes(dayName);
        });

        setAvailableDates(filteredDates);
      } catch (err) {
        console.error('Erro ao carregar datas:', err);
        setAvailableDates([]);
      }
    };

    loadAvailableDates();
  }, [selectedDoctor, selectedSpecialty, state.doctors]);

  // resto do componente...
};


// Função auxiliar para pegar o dia no formato aceito pelo banco
const getDayName = (date: string): string => {
  const days = [
    'Domingo', 'Segunda', 'Terça', 'Quarta',
    'Quinta', 'Sexta', 'Sábado'
  ];
  return days[new Date(date).getDay()];
};

// Função para gerar os horários disponíveis
const generateTimeSlots = (
  workingHours: {
    day: string;
    startTime: string;
    endTime: string;
    intervalMinutes: number;
  },
  date: string,
  appointments: Appointment[],
  doctorId: string
): TimeSlot[] => {
  const slots: TimeSlot[] = [];

  const start = new Date(`${date}T${workingHours.startTime}`);
  const end = new Date(`${date}T${workingHours.endTime}`);

  let current = new Date(start);

  while (current < end) {
    const timeString = current.toTimeString().slice(0, 5); // HH:mm

    const isBooked = appointments.some(
      apt => apt.time.slice(0, 5) === timeString
    );

    slots.push({
      doctorId,
      date,
      time: timeString,
      available: !isBooked,
      doctorName: '', // preenchido depois
    });

    current.setMinutes(current.getMinutes() + workingHours.intervalMinutes);
  }

  return slots;
};
  

  // Carregar horários quando data é selecionada
 useEffect(() => {
  const loadTimeSlots = async () => {
    if (!selectedDate) {
      setTimeSlots([]);
      return;
    }

    setLoading(true);
    try {
      const formattedDate = new Date(selectedDate).toISOString().split('T')[0];
      const dayName = getDayName(selectedDate);

      let doctorIds: string[] = [];
      if (selectedDoctor) {
        doctorIds = [selectedDoctor.id];
      } else if (selectedSpecialty) {
        doctorIds = state.doctors
          .filter(d => d.specialtyId === selectedSpecialty.id)
          .map(d => d.id);
      }

      if (doctorIds.length === 0) {
        console.warn('Nenhum médico encontrado para a especialidade selecionada');
        setTimeSlots([]);
        setLoading(false);
        return;
      }

      console.log('selectedDate:', formattedDate);
      console.log('dayName:', dayName);
      console.log('doctorIds:', doctorIds);

        // Buscar agenda dos médicos para o dia
        const { data: agendaData, error: agendaError } = await supabase
        .from('agenda')
        .select('*')
        .in('medico_id', doctorIds)
        .eq('dia_semana', dayName);

      if (agendaError) {
        console.error('Erro ao carregar agenda:', agendaError);
        setTimeSlots([]);
        return;
      }

      console.log('agendaData:', agendaData);

        // Buscar agendamentos existentes para a data
       const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('agendamentos')
        .select('medico_id, horario')
        .in('medico_id', doctorIds)
        .eq('data', formattedDate);

      if (appointmentsError) {
        console.error('Erro ao carregar agendamentos:', appointmentsError);
      }

      console.log('appointmentsData:', appointmentsData);

      const existingAppointments = appointmentsData || [];
      const allSlots: TimeSlot[] = [];
        
        // Gerar slots para cada médico
        agendaData?.forEach(agenda => {
        const doctor = state.doctors.find(d => d.id === agenda.medico_id);
        if (!doctor) {
          console.warn('Médico não encontrado em state.doctors:', agenda.medico_id);
          return;
        }
         const workingHours = {
          day: agenda.dia_semana,
          startTime: agenda.horario_inicio,
          endTime: agenda.horario_fim,
          intervalMinutes: agenda.tempo_intervalo || 30,
        };

         console.log('Gerando horários para:', doctor.name, workingHours);

        const doctorAppointments = existingAppointments
          .filter(apt => apt.medico_id === agenda.medico_id)
          .map(apt => ({
            id: '',
            doctorId: apt.medico_id,
            date: formattedDate,
            time: apt.horario,
            patient: { name: '', birthDate: '', city: '', phone: '', email: '' },
            status: 'scheduled' as const,
            createdAt: new Date(),
          }));

          const slots = generateTimeSlots(
          workingHours,
          formattedDate,
          doctorAppointments,
          agenda.medico_id
        );
          
          // Adicionar informação do médico aos slots
         const slotsWithDoctor = slots.map(slot => ({
          ...slot,
          doctorName: doctor.name,
        }));

        allSlots.push(...slotsWithDoctor);
      });

      allSlots.sort((a, b) => a.time.localeCompare(b.time));
      setTimeSlots(allSlots);

      console.log('timeSlots gerados:', allSlots);
    } catch (error) {
      console.error('Erro ao carregar horários:', error);
      setTimeSlots([]);
    } finally {
      setLoading(false);
    }
  };

  loadTimeSlots();
}, [selectedDate, selectedDoctor, selectedSpecialty, state.doctors]);

  const getDoctorForTimeSlot = (time: string): Doctor | null => {
    if (selectedDoctor) return selectedDoctor;

    const slot = timeSlots.find(s => s.time === time && s.available);
    return slot ? state.doctors.find(d => d.id === slot.doctorId) || null : null;
  };

  const getAvailableInsurances = (): string[] => {
    const doctor = selectedDoctor || getDoctorForTimeSlot(selectedTime);
    return doctor ? doctor.insurances : [];
  };

  const handleConfirmAppointment = async () => {
    const doctor = selectedDoctor || getDoctorForTimeSlot(selectedTime);
    if (!doctor) return;

    setLoading(true);
    try {
      // Primeiro, criar o usuário
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .insert({
          nome: patientData.name,
          data_nascimento: patientData.birthDate,
          cidade: patientData.city,
          contato: patientData.phone
        })
        .select()
        .single();

      if (userError) {
        console.error('Erro ao criar usuário:', userError);
        alert('Erro ao criar usuário. Tente novamente.');
        return;
      }

      // Depois, criar o agendamento
      const { data: appointmentData, error: appointmentError } = await supabase
        .from('agendamentos')
        .insert({
          usuario_id: userData.id,
          medico_id: doctor.id,
          data: selectedDate,
          horario: selectedTime,
          convenio_id: selectedInsurance || null
        })
        .select()
        .single();

      if (appointmentError) {
        console.error('Erro ao criar agendamento:', appointmentError);
        alert('Erro ao criar agendamento. Tente novamente.');
        return;
      }

      // Atualizar estado local
      const newAppointment: Appointment = {
        id: appointmentData.id,
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
    } catch (error) {
      console.error('Erro ao confirmar agendamento:', error);
      alert('Erro ao confirmar agendamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToBooking = () => {
    dispatch({ type: 'SET_VIEW', payload: 'booking' });
    setShowSuccess(false);
  };

  if (showSuccess) {
    const doctor = selectedDoctor || getDoctorForTimeSlot(selectedTime);
    const specialty = selectedSpecialty || state.specialties.find(s => s.id === doctor?.specialtyId);
    const insurance = selectedInsurance ? state.insurances.find(i => i.id === selectedInsurance) : null;

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
              <p><strong>Médico:</strong> {doctor?.name}</p>
              <p><strong>Especialidade:</strong> {specialty?.name}</p>
              <p><strong>Paciente:</strong> {patientData.name}</p>
              <p><strong>Convênio:</strong> {insurance?.name || 'Particular'}</p>
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

      {/* Progress Steps */}
      <div className="flex justify-center mb-8">
        <div className="flex space-x-4">
          {[
            { key: 'datetime', label: 'Data e Horário', icon: Calendar },
            { key: 'patient', label: 'Dados Pessoais', icon: User },
            { key: 'confirmation', label: 'Confirmação', icon: CheckCircle }
          ].map((step, index) => {
            const isActive = currentStep === step.key;
            const isCompleted = ['patient', 'confirmation'].includes(currentStep) && index < 2;
            const Icon = step.icon;
            
            return (
              <div
                key={step.key}
                className={`flex items-center ${
                  isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isActive ? 'bg-blue-600 text-white' : isCompleted ? 'bg-green-600 text-white' : 'bg-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className="ml-2 text-sm font-medium hidden sm:block">{step.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-8">
        {currentStep === 'datetime' && (
          <>
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Escolha a Data
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 mb-6 max-h-64 overflow-y-auto">
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
                  <div className="font-medium">{new Date(date).getDate()}</div>
                  <div className="text-xs">{formatDate(date).split(',')[1]?.trim()}</div>
                </button>
              ))}
            </div>

            {selectedDate && (
              <>
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Escolha o Horário
                </h3>
                {loading ? (
                  <div className="text-center py-8 text-gray-500">Carregando horários...</div>
                ) : (
                  <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-2">
                    {timeSlots
                      .filter(slot => slot.available)
                      .map((slot, index) => (
                        <button
                          key={`${slot.doctorId}-${slot.time}-${index}`}
                          onClick={() => onTimeSelect(slot.time)}
                          className={`p-2 rounded-lg border text-sm ${
                            selectedTime === slot.time
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-300'
                          }`}
                          title={!selectedDoctor ? `Dr(a). ${slot.doctorName}` : undefined}
                        >
                          {slot.time}
                        </button>
                      ))}
                  </div>
                )}
                
                {!loading && timeSlots.filter(slot => slot.available).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum horário disponível para esta data
                  </div>
                )}
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
            <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Dados Pessoais
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo</label>
                <input
                  type="text"
                  value={patientData.name}
                  onChange={(e) => setPatientData({ ...patientData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data de Nascimento</label>
                <input
                  type="date"
                  value={patientData.birthDate}
                  onChange={(e) => setPatientData({ ...patientData, birthDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                <input
                  type="tel"
                  value={patientData.phone}
                  onChange={(e) => setPatientData({ ...patientData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cidade</label>
                <input
                  type="text"
                  value={patientData.city}
                  onChange={(e) => setPatientData({ ...patientData, city: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={patientData.email}
                  onChange={(e) => setPatientData({ ...patientData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Insurance Selection */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Convênio</label>
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

            <div className="flex justify-between mt-8">
              <button
                onClick={() => setCurrentStep('datetime')}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={() => setCurrentStep('confirmation')}
                disabled={!patientData.name || !patientData.birthDate || !patientData.phone}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continuar
              </button>
            </div>
          </>
        )}

        {currentStep === 'confirmation' && (
          <>
            <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              Confirmar Agendamento
            </h3>
            
            <div className="bg-gray-50 p-6 rounded-lg mb-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Detalhes da Consulta</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Data:</strong> {formatDate(selectedDate)}</p>
                    <p><strong>Horário:</strong> {selectedTime}</p>
                    <p><strong>Médico:</strong> {(selectedDoctor || getDoctorForTimeSlot(selectedTime))?.name}</p>
                    <p><strong>Especialidade:</strong> {selectedSpecialty?.name || state.specialties.find(s => s.id === (selectedDoctor || getDoctorForTimeSlot(selectedTime))?.specialtyId)?.name}</p>
                    <p><strong>Convênio:</strong> {selectedInsurance ? state.insurances.find(i => i.id === selectedInsurance)?.name : 'Particular'}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Dados do Paciente</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Nome:</strong> {patientData.name}</p>
                    <p><strong>Data de Nascimento:</strong> {new Date(patientData.birthDate).toLocaleDateString('pt-BR')}</p>
                    <p><strong>Telefone:</strong> {patientData.phone}</p>
                    <p><strong>Cidade:</strong> {patientData.city}</p>
                    {patientData.email && <p><strong>Email:</strong> {patientData.email}</p>}
                  </div>
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
                disabled={loading}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Confirmando...' : 'Confirmar Agendamento'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AppointmentForm;
