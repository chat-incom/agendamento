import React, { useState, useEffect } from 'react';
import { Plus, Shield, Edit, Trash2 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

type Insurance = {
  id: string;
  nome: string;
  tipo: 'public' | 'private';
};

const InsuranceManagement: React.FC = () => {
  const [insurances, setInsurances] = useState<Insurance[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingInsurance, setEditingInsurance] = useState<Insurance | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'private' as 'public' | 'private',
  });

  const fetchInsurances = async () => {
    const { data, error } = await supabase.from('convenios').select('*');
    if (!error && data) {
      setInsurances(data);
    }
  };

  useEffect(() => {
    fetchInsurances();
  }, []);

  const handleEdit = (insurance: Insurance) => {
    setEditingInsurance(insurance);
    setFormData({ nome: insurance.nome, tipo: insurance.tipo });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este convênio?')) {
      await supabase.from('convenios').delete().eq('id', id);
      fetchInsurances();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingInsurance) {
      await supabase.from('convenios').update({ nome: formData.nome, tipo: formData.tipo }).eq('id', editingInsurance.id);
    } else {
      await supabase.from('convenios').insert({ nome: formData.nome, tipo: formData.tipo });
    }
    setFormData({ nome: '', tipo: 'private' });
    setEditingInsurance(null);
    setShowForm(false);
    fetchInsurances();
  };

  const publicInsurances = insurances.filter(i => i.tipo === 'public');
  const privateInsurances = insurances.filter(i => i.tipo === 'private');

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
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value as 'public' | 'private' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="private">Privado</option>
                  <option value="public">Público</option>
                </select>
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
            {publicInsurances.map((insurance) => (
              <div key={insurance.id} className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <Shield className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">{insurance.nome}</h4>
                      <p className="text-sm text-gray-600">Público</p>
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
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Shield className="w-5 h-5 text-blue-600 mr-2" />
            Convênios Privados
          </h3>
          <div className="space-y-3">
            {privateInsurances.map((insurance) => (
              <div key={insurance.id} className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Shield className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">{insurance.nome}</h4>
                      <p className="text-sm text-gray-600">Privado</p>
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
              </div>
            ))}
          </div>
        </div>
      </div>

      {insurances.length === 0 && (
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

