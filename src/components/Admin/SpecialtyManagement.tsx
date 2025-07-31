import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Plus, Edit, Trash2, Activity } from 'lucide-react';
import { Specialty } from '../../types/index';
import { supabase } from '../../lib/supabaseClient';

const SpecialtyManagement: React.FC = () => {
  const { state, dispatch } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingSpecialty, setEditingSpecialty] = useState<Specialty | null>(null);
  const [formData, setFormData] = useState({
    name: '',
  });


  const handleEdit = (specialty: Specialty) => {
    setEditingSpecialty(specialty);
    setFormData({
      name: specialty.name,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta especialidade?')) {
      const { error } = await supabase.from('especialidades').delete().eq('id', id);
      if (!error) {
        dispatch({ type: 'DELETE_SPECIALTY', payload: id });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSpecialty) {
      const { error } = await supabase
        .from('especialidades')
        .update({ nome: formData.name })
        .eq('id', editingSpecialty.id);

      if (!error) {
        dispatch({
          type: 'UPDATE_SPECIALTY',
          payload: {
            ...editingSpecialty,
            name: formData.name,
          },
        });
      }
    } else {
      const { data, error } = await supabase
        .from('especialidades')
        .insert([{ nome: formData.name }])
        .select()
        .single();

      if (data && !error) {
        dispatch({
          type: 'ADD_SPECIALTY',
          payload: {
            id: data.id,
            name: data.nome,
          },
        });
      }
    }
    setFormData({ name: '' });
    setEditingSpecialty(null);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Especialidades Médicas</h2>
          <p className="text-gray-600">Gerencie as especialidades disponíveis na clínica</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Especialidade</span>
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Nova Especialidade</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da Especialidade
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Specialties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {state.specialties.map((specialty) => (
          <div key={specialty.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Activity className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">{specialty.name}</h3>
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleEdit(specialty)}
                  className="text-gray-400 hover:text-blue-600 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(specialty.id)}
                  className="text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {state.doctors.filter(d => d.specialtyId === specialty.id).length} médicos
              </span>
            </div>
          </div>
        ))}
      </div>

      {state.specialties.length === 0 && (
        <div className="text-center py-12">
          <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma especialidade cadastrada</h3>
          <p className="text-gray-500">Comece adicionando uma nova especialidade médica</p>
        </div>
      )}
    </div>
  );
};

export default SpecialtyManagement;
