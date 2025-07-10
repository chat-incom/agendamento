import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ArrowLeft, Calendar, User, Activity, Shield } from 'lucide-react';
import DoctorSelection from './DoctorSelection';
import SpecialtySelection from './SpecialtySelection';
import AppointmentForm from './AppointmentForm';
import { Doctor, Specialty } from '../../types';

export type BookingStep = 'selection' | 'doctor' | 'specialty' | 'appointment';

const BookingSystem: React.FC = () => {
  const { state, dispatch } = useApp();
  const [currentStep, setCurrentStep] = useState<BookingStep>('selection');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedSpecialty, setSelectedSpecialty] = useState<Specialty | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');

  const handleStepChange = (step: BookingStep) => {
    setCurrentStep(step);
  };

  const handleDoctorSelect = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setCurrentStep('appointment');
  };

  const handleSpecialtySelect = (specialty: Specialty) => {
    setSelectedSpecialty(specialty);
    setCurrentStep('appointment');
  };

  const handleBack = () => {
    switch (currentStep) {
      case 'doctor':
      case 'specialty':
        setCurrentStep('selection');
        break;
      case 'appointment':
        setCurrentStep(selectedDoctor ? 'doctor' : 'specialty');
        break;
      default:
        setCurrentStep('selection');
    }
  };

  const handleBackToLogin = () => {
    dispatch({ type: 'SET_VIEW', payload: 'login' });
  };

 const renderStepContent = () => {
  console.log('Renderizando passo:', currentStep);

  switch (currentStep) {
    case 'selection':
      return (
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="bg-blue-600 p-4 rounded-full mx-auto mb-4 w-16 h-16 flex items-center justify-center">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-4">Agendar Consulta</h1>
            <p className="text-xl text-gray-600">Como você gostaria de agendar sua consulta?</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div
              onClick={() => handleStepChange('doctor')}
              className="bg-white rounded-2xl shadow-lg p-8 cursor-pointer hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-2 border-transparent hover:border-blue-500"
            >
              <div className="text-center">
                <div className="bg-blue-100 p-4 rounded-full mx-auto mb-4 w-16 h-16 flex items-center justify-center">
                  <User className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Por Médico</h3>
                <p className="text-gray-600 mb-6">
                  Escolha diretamente o médico de sua preferência e veja os horários disponíveis
                </p>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-700">
                    ✓ Veja os convênios aceitos<br />
                    ✓ Horários personalizados<br />
                    ✓ Especialidade do médico
                  </p>
                </div>
              </div>
            </div>

            <div
              onClick={() => handleStepChange('specialty')}
              className="bg-white rounded-2xl shadow-lg p-8 cursor-pointer hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-2 border-transparent hover:border-green-500"
            >
              <div className="text-center">
                <div className="bg-green-100 p-4 rounded-full mx-auto mb-4 w-16 h-16 flex items-center justify-center">
                  <Activity className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Por Especialidade</h3>
                <p className="text-gray-600 mb-6">
                  Escolha a especialidade e veja todos os horários disponíveis de todos os médicos
                </p>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-700">
                    ✓ Mais opções de horários<br />
                    ✓ Todos os médicos da especialidade<br />
                    ✓ Comparação de convênios
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );

    case 'doctor':
      return <DoctorSelection onDoctorSelect={handleDoctorSelect} />;

    case 'specialty':
      return <SpecialtySelection onSpecialtySelect={handleSpecialtySelect} />;

    case 'form':
      return <AppointmentForm doctor={selectedDoctor} />;

    default:
      return (
        <div className="text-center text-red-600 mt-10">
          Etapa não reconhecida: <strong>{currentStep}</strong>
        </div>
      );
  }
};

            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Shield className="w-5 h-5 text-blue-600 mr-2" />
                Informações importantes
              </h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
                <div>
                  <h4 className="font-medium text-gray-800 mb-1">Agendamento</h4>
                  <p>Rápido e sem complicações</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 mb-1">Confirmação</h4>
                  <p>Confirmação imediata por email</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 mb-1">Cancelamento</h4>
                  <p>Cancele até 24h antes</p>
                </div>
              </div>
            </div>
          </div>
        );
     case 'doctor':
  if (!state.doctors || state.doctors.length === 0) {
    return <p className="text-center">Carregando médicos...</p>;
  }
  return (
    <DoctorSelection
      onDoctorSelect={handleDoctorSelect}
      onBack={handleBack}
    />
  );

case 'specialty':
  if (!state.specialties || state.specialties.length === 0) {
    return <p className="text-center">Carregando especialidades...</p>;
  }
  return (
    <SpecialtySelection
      onSpecialtySelect={handleSpecialtySelect}
      onBack={handleBack}
    />
  );

      case 'appointment':
        return (
          <AppointmentForm
            selectedDoctor={selectedDoctor}
            selectedSpecialty={selectedSpecialty}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            onDateSelect={setSelectedDate}
            onTimeSelect={setSelectedTime}
            onBack={handleBack}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="bg-blue-600 p-2 rounded-lg mr-3">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-800">Agendamento Online</h1>
            </div>
            <div className="flex items-center space-x-4">
              {currentStep !== 'selection' && (
                <button
                  onClick={handleBack}
                  className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Voltar</span>
                </button>
              )}
              <button
                onClick={handleBackToLogin}
                className="text-gray-600 hover:text-blue-600 transition-colors"
              >
                Área Administrativa
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="p-4 sm:p-6 lg:p-8">
        {renderStepContent()}
      </main>
    </div>
  );
};

export default BookingSystem;
