import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Activity, User, Search } from 'lucide-react';
import { Specialty } from '../../types/index';
import { supabase } from '../../lib/supabaseClient';

interface SpecialtySelectionProps {
  onSpecialtySelect: (specialty: Specialty) => void;
  onBack: () => void;
}

const SpecialtySelection: React.FC<SpecialtySelectionProps> = ({ onSpecialtySelect, onBack }) => {
  const { state } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSpecialties = state.specialties.filter(specialty =>
    specialty.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDoctorCount = (specialtyId: string) => {
    return state.doctors.filter(d => d.specialtyId === specialtyId).length;
  };

  const getDoctorNames = (specialtyId: string) => {
    return state.doctors
      .filter(d => d.specialtyId === specialtyId)
      .map(d => d.name);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Escolha a Especialidade</h2>
        <p className="text-gray-600">Selecione a especialidade médica desejada</p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar especialidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Specialties Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSpecialties.map((specialty) => {
          const doctorCount = getDoctorCount(specialty.id);
          const doctorNames = getDoctorNames(specialty.id);
          
          return (
            <div
              key={specialty.id}
              onClick={() => onSpecialtySelect(specialty)}
              className="bg-white rounded-xl shadow-md p-6 cursor-pointer hover:shadow-lg transform hover:scale-105 transition-all duration-200 border-2 border-transparent hover:border-green-500"
            >
              <div className="text-center mb-4">
                <div className="bg-green-100 p-3 rounded-full mx-auto mb-3 w-16 h-16 flex items-center justify-center">
                  <Activity className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{specialty.name}</h3>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Médicos disponíveis:</span>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">
                    {doctorCount}
                  </span>
                </div>

                {doctorNames.length > 0 && (
                  <div>
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <User className="w-4 h-4 mr-2" />
                      <span>Médicos:</span>
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      {doctorNames.map((name, index) => (
                        <div key={index}>• {name}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <button className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
                  Ver horários disponíveis
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredSpecialties.length === 0 && (
        <div className="text-center py-12">
          <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">Nenhuma especialidade encontrada</h3>
          <p className="text-gray-500">Tente ajustar o termo de busca</p>
        </div>
      )}
    </div>
  );
};

export default SpecialtySelection;
