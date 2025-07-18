import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Plus, Shield, Edit, Trash2 } from 'lucide-react';
import { Insurance, Doctor } from '../../types/index';
import { supabase } from '../../lib/supabase';

const InsuranceManagement: React.FC = () => {
  const { state, dispatch } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingInsurance, setEditingInsurance] = useState<Insurance | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'private' as 'public' | 'private',
  });
  const [doctorMap, setDoctorMap] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchDoctorsByInsurance = async () => {
      const { data, error } = await supabase
        .from('medico_convenios')
        .select('convenio_id');

      if (!error && data) {
        const countMap = data.reduce((acc, cur) => {
          acc[cur.convenio_id] = (acc[cur.convenio_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        setDoctorMap(countMap);
      }
    };

    fetchDoctorsByInsurance();
  }, []);

  const handleEdit = (insurance: Insurance) => {
    setEditingInsurance(insurance);
    setFormData({
      name: insurance.name,
      type: insurance.type,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este convênio?')) {
      await supabase.from('convenios').delete().eq('id', id);
      dispatch({ type: 'DELETE_INSURANCE', payload: id });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingInsurance) {
      const { data, error } = await supabase
        .from('convenios')
        .update({ name: formData.name, type: formData.type })
        .eq('id', editingInsurance.id);

      if (!error && data) {
        const updatedInsurance: Insurance = {
          ...editingInsurance,
          name: formData.name,
          type: formData.type,
        };
        dispatch({ type: 'UPDATE_INSURANCE', payload: updatedInsurance });
      }
    } else {
      const { data, error } = await supabase
        .from('convenios')
        .insert({ name: formData.name, type: formData.type })
        .select()
        .single();

      if (!error && data) {
        const newInsurance: Insurance = {
          id: data.id,
          name: data.name,
          type: data.type,
        };
        dispatch({ type: 'ADD_INSURANCE', payload: newInsurance });
      }
    }

    setFormData({ name: '', type: 'private' });
    setEditingInsurance(null);
    setShowForm(false);
  };

  const publicInsurances = state.insurances.filter(i => i.type === 'public');
  const privateInsurances = state.insurances.filter(i => i.type === 'private');

  const renderInsuranceCard = (insurance: Insurance, color: string, label: string) => (
    <div key={insurance.id} className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg bg-${color}-100`}>
            <Shield className={`w-4 h-4 text-${color}-600`} />
          </div>
          <div>
            <h4 className="font-semibold text-gray-800">{insurance.name}</h4>
            <p className="text-sm text-gray-600">{label}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button onClick={() => handleEdit(insurance)} className="text-gray-400 hover:text-blue-600 transition-colors">
            <Edit className="w-4 h-4" />
          </button>
          <button onClick={() => handleDelete(insurance.id)} className="text-gray-400 hover:text-red-600 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="mt-2 text-xs text-gray-500">
        {doctorMap[insurance.id] || 0} médicos aceitam
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Convênios</h2>
          <p className="text-gray-600">Gerencie os convênios aceitos pela clínica</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Convênio</span>
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">{editingInsurance ? 'Editar Convênio' : 'Novo Convênio'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Convênio</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'public' | 'private' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="private">Privado</option>
                  <option value="public">Público</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                  {editingInsurance ? 'Atualizar' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Shield className="w-5 h-5 text-green-600 mr-2" />
            Convênios Públicos
          </h3>
          <div className="space-y-3">
            {publicInsurances.map((i) => renderInsuranceCard(i, 'green', 'Público'))}
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Shield className="w-5 h-5 text-blue-600 mr-2" />
            Convênios Privados
          </h3>
          <div className="space-y-3">
            {privateInsurances.map((i) => renderInsuranceCard(i, 'blue', 'Privado'))}
          </div>
        </div>
      </div>

      {state.insurances.length === 0 && (
        <div className="text-center py-12">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum convênio cadastrado</h3>
          <p className="text-gray-500">Comece adicionando um novo convênio</p>
        </div>
      )}
    </div>
  );
};

export default InsuranceManagement;


