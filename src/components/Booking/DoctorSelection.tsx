import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { User, Shield, Clock, Search, Filter } from 'lucide-react';
import { Doctor } from '../../types';

interface DoctorSelectionProps {
  onDoctorSelect: (doctor: Doctor) => void;
  onBack: () => void;
}

const DoctorSelection: React.FC<DoctorSelectionProps> = ({ onDoctorSelect, onBack }) => {
  const { state } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);

  const filteredDoctors = state.doctors?.filter((doctor) => {
    const matchesSearch =
      doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.crm.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSpecialty = !selectedSpecialty || doctor.specialtyId === selectedSpecialty;

    return matchesSearch && matchesSpecialty;
  }) || [];

  const getSpecialtyName = (specialtyId: string) => {
    return state.specialties.find(s => s.id === specialtyId)?.name || 'Especialidade não encontrada';
  };

  const getInsuranceNames = (insuranceIds: string[]) => {
    return insuranceIds.map(id => 
      state.insurances.find(i => i.id === id)?.name || 'Convênio não encontrado'
    );
  };

  const getWorkingDaysText = (workingHours: any[]) => {
    if (!workingHours || workingHours.length === 0) return 'Horários não definidos';

    const dayNames: { [key: string]: string } = {
      monday: 'Seg',
      tuesday: 'Ter',
      wednesday: 'Qua',
      thursday: 'Qui',
      friday: 'Sex',
      saturday: 'Sáb',
      sunday: 'Dom'
    };

    const dias = workingHours.map((wh) => {
      const dia = dayNames[wh.day] || wh.day;
      const intervalo = wh.tempo_intervalo ? ` (${wh.tempo_intervalo} min)` : '';
      return `${dia}${intervalo}`;
    });

    return dias.join(', ');
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Escolha seu Médico</h2>
        <p className="text-gray-600">Selecione o médico de sua preferência</p>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou CRM..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <select
              value={selectedSpecialty ?? ''}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todas as especialidades</option>
              {state.specialties.map(specialty => (
                <option key={specialty.id} value={specialty.id}>
                  {specialty.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Doctors Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDoctors.map((doctor) => (
          <div
            key={doctor.id}
            onClick={() => onDoctorSelect(doctor)}
            className="bg-white rounded-xl shadow-md p-6 cursor-pointer hover:shadow-lg transform hover:scale-105 transition-all duration-200 border-2 border-transparent hover:border-blue-500"
          >
            <div className="text-center mb-4">
              <div className="bg-blue-100 p-3 rounded-full mx-auto mb-3 w-16 h-16 flex items-center justify-center">
                <User className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-1">{doctor.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{doctor.crm}</p>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                {getSpecialtyName(doctor.specialtyId)}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <Shield className="w-4 h-4 mr-2" />
                  <span>Convênios aceitos:</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {getInsuranceNames(doctor.insurances).map((insurance, index) => (
                    <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                      {insurance}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>Dias de atendimento:</span>
                </div>
                <p className="text-xs text-gray-600">{getWorkingDaysText(doctor.workingHours)}</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                Agendar com este médico
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredDoctors.length === 0 && (
        <div className="text-center py-12">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">Nenhum médico encontrado</h3>
          <p className="text-gray-500">Tente ajustar os filtros de busca</p>
        </div>
      )}
    </div>
  );
};

export default DoctorSelection;

