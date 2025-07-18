import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Plus, User, Clock, Shield, Edit, Trash2 } from 'lucide-react';
import { Doctor, WorkingHours } from '../../types/index';

const DoctorManagement: React.FC = () => {
  const { state, dispatch } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    crm: '',
    specialtyId: '',
    selectedInsurances: [] as string[],
    workingHours: [] as WorkingHours[],
  });

  const defaultWorkingHours: WorkingHours = {
    day: 'monday',
    startTime: '08:00',
    endTime: '17:00',
    intervalMinutes: 15,
  };

  const [newWorkingHour, setNewWorkingHour] = useState<WorkingHours>(defaultWorkingHours);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);

  const dayLabels = {
    monday: 'Segunda-feira',
    tuesday: 'Terça-feira',
    wednesday: 'Quarta-feira',
    thursday: 'Quinta-feira',
    friday: 'Sexta-feira',
    saturday: 'Sábado',
    sunday: 'Domingo',
  };

  const handleEdit = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setFormData({
      name: doctor.name,
      crm: doctor.crm,
      specialtyId: doctor.specialtyId,
      selectedInsurances: doctor.insurances,
      workingHours: doctor.workingHours,
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este médico?')) {
      dispatch({ type: 'DELETE_DOCTOR', payload: id });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingDoctor) {
      const updatedDoctor: Doctor = {
        ...editingDoctor,
        name: formData.name,
        crm: formData.crm,
        specialtyId: formData.specialtyId,
        insurances: formData.selectedInsurances,
        workingHours: formData.workingHours,
      };

      dispatch({ type: 'UPDATE_DOCTOR', payload: updatedDoctor });
    } else {
      const newDoctor: Doctor = {
        id: Date.now().toString(),
        name: formData.name,
        crm: formData.crm,
        specialtyId: formData.specialtyId,
        insurances: formData.selectedInsurances,
        workingHours: formData.workingHours,
        createdAt: new Date(),
      };

      dispatch({ type: 'ADD_DOCTOR', payload: newDoctor });
    }

    setFormData({ name: '', crm: '', specialtyId: '', selectedInsurances: [], workingHours: [] });
    setEditingDoctor(null);
    setShowForm(false);
  };

  const handleInsuranceToggle = (insuranceId: string) => {
    const updatedInsurances = formData.selectedInsurances.includes(insuranceId)
      ? formData.selectedInsurances.filter((id) => id !== insuranceId)
      : [...formData.selectedInsurances, insuranceId];

    setFormData({ ...formData, selectedInsurances: updatedInsurances });
  };

  const addWorkingHour = () => {
    if (!formData.workingHours.some((wh) => wh.day === newWorkingHour.day)) {
      setFormData({
        ...formData,
        workingHours: [...formData.workingHours, newWorkingHour],
      });
      setNewWorkingHour(defaultWorkingHours);
    }
  };

  const removeWorkingHour = (day: string) => {
    setFormData({
      ...formData,
      workingHours: formData.workingHours.filter((wh) => wh.day !== day),
    });
  };

  const getSpecialtyName = (specialtyId: string) => {
    return state.specialties.find((s) => s.id === specialtyId)?.name || 'Especialidade não encontrada';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Médicos</h2>
          <p className="text-gray-600">Gerencie os médicos da clínica</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Médico</span>
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">{editingDoctor ? 'Editar Médico' : 'Novo Médico'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CRM</label>
                  <input
                    type="text"
                    value={formData.crm}
                    onChange={(e) => setFormData({ ...formData, crm: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Especialidade</label>
                <select
                  value={formData.specialtyId}
                  onChange={(e) => setFormData({ ...formData, specialtyId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Selecione uma especialidade</option>
                  {state.specialties.map((specialty) => (
                    <option key={specialty.id} value={specialty.id}>
                      {specialty.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Convênios</label>
                <div className="grid grid-cols-2 gap-2">
                  {state.insurances.map((insurance) => (
                    <label key={insurance.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.selectedInsurances.includes(insurance.id)}
                        onChange={() => handleInsuranceToggle(insurance.id)}
                        className="mr-2"
                      />
                      {insurance.name}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancelar
                </button>
<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">Horários de Atendimento</label>

  <div className="flex flex-col md:flex-row gap-2 items-center mb-2">
    <select
      value={newWorkingHour.day}
      onChange={(e) => setNewWorkingHour({ ...newWorkingHour, day: e.target.value as WorkingHours['day'] })}
      className="px-3 py-2 border border-gray-300 rounded-md"
    >
      {Object.entries(dayLabels).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>

    <input
      type="time"
      value={newWorkingHour.startTime}
      onChange={(e) => setNewWorkingHour({ ...newWorkingHour, startTime: e.target.value })}
      className="px-3 py-2 border border-gray-300 rounded-md"
    />

    <input
      type="time"
      value={newWorkingHour.endTime}
      onChange={(e) => setNewWorkingHour({ ...newWorkingHour, endTime: e.target.value })}
      className="px-3 py-2 border border-gray-300 rounded-md"
    />

    <input
      type="number"
      min={1}
      value={newWorkingHour.intervalMinutes}
      onChange={(e) => setNewWorkingHour({ ...newWorkingHour, intervalMinutes: Number(e.target.value) })}
      className="w-24 px-3 py-2 border border-gray-300 rounded-md"
      placeholder="Intervalo"
    />

    <button
      type="button"
      onClick={addWorkingHour}
      className="bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 transition-colors"
    >
      Adicionar
    </button>
  </div>

  <ul className="list-disc ml-5 space-y-1 text-sm text-gray-700">
    {formData.workingHours.map((wh) => (
      <li key={wh.day} className="flex justify-between items-center">
        <span>
          {dayLabels[wh.day]}: {wh.startTime} - {wh.endTime} ({wh.intervalMinutes} min)
        </span>
        <button
          type="button"
          onClick={() => removeWorkingHour(wh.day)}
          className="text-red-600 text-xs hover:underline"
        >
          Remover
        </button>
      </li>
    ))}
  </ul>
</div>

                
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  {editingDoctor ? 'Atualizar' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {state.doctors.map((doctor) => (
          <div key={doctor.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{doctor.name}</h3>
                  <p className="text-sm text-gray-600">{doctor.crm}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleEdit(doctor)}
                  className="text-gray-400 hover:text-blue-600 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(doctor.id)}
                  className="text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-700">Especialidade:</span>
                <p className="text-sm text-gray-600">{getSpecialtyName(doctor.specialtyId)}</p>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-700">Convênios:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {doctor.insurances.map((insuranceId) => {
                    const insurance = state.insurances.find(i => i.id === insuranceId);
                    return insurance ? (
                      <span key={insuranceId} className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                        {insurance.name}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-700">Horários:</span>
                <div className="text-xs text-gray-600 mt-1">
                  {doctor.workingHours.map((wh) => (
                    <div key={wh.day}>
                      {dayLabels[wh.day as keyof typeof dayLabels]}: {wh.startTime} - {wh.endTime}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {state.doctors.length === 0 && (
        <div className="text-center py-12">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum médico cadastrado</h3>
          <p className="text-gray-500">Comece adicionando um novo médico</p>
        </div>
      )}
    </div>
  );
};

export default DoctorManagement;
