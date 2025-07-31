import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Doctor, Specialty, Insurance, WorkingHours } from '../../types';
import { Plus, User, Clock, Shield, Edit, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const DoctorManagement: React.FC = () => {
  const { state, dispatch } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingDoctorId, setEditingDoctorId] = useState<string | null>(null);

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
    intervalMinutes: 30,
  };

  const [newWorkingHour, setNewWorkingHour] = useState<WorkingHours>(defaultWorkingHours);

  const dayLabels: Record<string, string> = {
    monday: 'Segunda-feira',
    tuesday: 'Terça-feira',
    wednesday: 'Quarta-feira',
    thursday: 'Quinta-feira',
    friday: 'Sexta-feira',
    saturday: 'Sábado',
    sunday: 'Domingo',
  };

const dayMapToDb: Record<string, string> = {
  monday: 'Segunda',
  tuesday: 'Terça',
  wednesday: 'Quarta',
  thursday: 'Quinta',
  friday: 'Sexta',
  saturday: 'Sábado',
  sunday: 'Domingo',
};

  
  // 🔹 Carregar médicos do Supabase
  useEffect(() => {
    const loadDoctors = async () => {
      const { data, error } = await supabase
        .from('medicos')
        .select(`
          *,
          agenda(*),
          medico_convenios(convenio_id)
        `);
      if (error) {
        console.error('Erro ao carregar médicos:', error);
        return;
      }
      if (data) {
        dispatch({
          type: 'SET_DOCTORS',
          payload: data.map((d: any) => ({
            id: d.id,
            name: d.nome,
            crm: d.crm,
            specialtyId: d.especialidade_id || '',
            insurances: d.medico_convenios?.map((mc: any) => mc.convenio_id) || [],
            workingHours:
              d.agenda?.map((a: any) => ({
                day: a.dia_semana?.toLowerCase() || '',
                startTime: a.horario_inicio,
                endTime: a.horario_fim,
                intervalMinutes: a.tempo_intervalo || 30,
              })) || [],
            createdAt: d.created_at ? new Date(d.created_at) : new Date(),
          })),
        });
      }
    };
    loadDoctors();
  }, [dispatch]);

  // 🔹 Submeter formulário (criar ou editar)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingDoctorId) {
      // Atualização
      const { error } = await supabase
        .from('medicos')
        .update({
          nome: formData.name,
          crm: formData.crm,
          especialidade_id: formData.specialtyId,
        })
        .eq('id', editingDoctorId);

      if (error) {
        console.error('Erro ao atualizar médico:', error);
        return;
      }

      // Atualizar convênios (simples: deleta e insere novamente)
      await supabase.from('medico_convenios').delete().eq('medico_id', editingDoctorId);
      await supabase
        .from('medico_convenios')
        .insert(formData.selectedInsurances.map((id) => ({ medico_id: editingDoctorId, convenio_id: id })));

      // Atualizar agenda
      await supabase.from('agenda').delete().eq('medico_id', editingDoctorId);
     
      await supabase
  .from('agenda')
  .insert(
    formData.workingHours.map((wh) => ({
      medico_id: editingDoctorId,
      dia_semana: dayMapToDb[wh.day], // ✅ Correto!
      horario_inicio: wh.startTime,
      horario_fim: wh.endTime,
      tempo_intervalo: wh.intervalMinutes,
    }))
  );

      dispatch({
        type: 'UPDATE_DOCTOR',
        payload: {
          id: editingDoctorId,
          name: formData.name,
          crm: formData.crm,
          specialtyId: formData.specialtyId,
          insurances: formData.selectedInsurances,
          workingHours: formData.workingHours,
          createdAt: new Date(),
        },
      });
    } else {
      // Criação
      const { data, error } = await supabase
        .from('medicos')
        .insert({
          nome: formData.name,
          crm: formData.crm,
          especialidade_id: formData.specialtyId,
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar médico:', error);
        return;
      }

      const doctorId = data.id;

      await supabase
        .from('medico_convenios')
        .insert(formData.selectedInsurances.map((id) => ({ medico_id: doctorId, convenio_id: id })));

await supabase
  .from('agenda')
  .insert(
    formData.workingHours.map((wh) => ({
      medico_id: doctorId,
      dia_semana: dayMapToDb[wh.day], 
      horario_inicio: wh.startTime,
      horario_fim: wh.endTime,
      tempo_intervalo: wh.intervalMinutes,
    }))
  );


      dispatch({
        type: 'ADD_DOCTOR',
        payload: {
          id: doctorId,
          name: formData.name,
          crm: formData.crm,
          specialtyId: formData.specialtyId,
          insurances: formData.selectedInsurances,
          workingHours: formData.workingHours,
          createdAt: new Date(),
        },
      });
    }

    resetForm();
  };

  // 🔹 Editar
  const handleEdit = (doctor: Doctor) => {
    setFormData({
      name: doctor.name,
      crm: doctor.crm,
      specialtyId: doctor.specialtyId,
      selectedInsurances: doctor.insurances,
      workingHours: doctor.workingHours,
    });
    setEditingDoctorId(doctor.id);
    setShowForm(true);
  };

  // 🔹 Excluir
  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('medicos').delete().eq('id', id);
    if (error) {
      console.error('Erro ao deletar médico:', error);
      return;
    }

    await supabase.from('medico_convenios').delete().eq('medico_id', id);
    await supabase.from('agenda').delete().eq('medico_id', id);

    dispatch({ type: 'DELETE_DOCTOR', payload: id });
  };

  // 🔹 Funções auxiliares
  const handleInsuranceToggle = (insuranceId: string) => {
    const updated = formData.selectedInsurances.includes(insuranceId)
      ? formData.selectedInsurances.filter((id) => id !== insuranceId)
      : [...formData.selectedInsurances, insuranceId];
    setFormData({ ...formData, selectedInsurances: updated });
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

  const getSpecialtyName = (specialtyId: string) =>
    state.specialties.find((s) => s.id === specialtyId)?.name || 'Especialidade não encontrada';

  const resetForm = () => {
    setFormData({
      name: '',
      crm: '',
      specialtyId: '',
      selectedInsurances: [],
      workingHours: [],
    });
    setEditingDoctorId(null);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Médicos</h2>
          <p className="text-gray-600">Gerencie os médicos e suas agendas</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Médico</span>
        </button>
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingDoctorId ? 'Editar Médico' : 'Novo Médico'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nome e CRM */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Médico</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CRM</label>
                  <input
                    type="text"
                    value={formData.crm}
                    onChange={(e) => setFormData({ ...formData, crm: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
              </div>

              {/* Especialidade */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Especialidade</label>
                <select
                  value={formData.specialtyId}
                  onChange={(e) => setFormData({ ...formData, specialtyId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Selecione</option>
                  {state.specialties.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Convênios */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Convênios</label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {state.insurances.map((i) => (
                    <label key={i.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.selectedInsurances.includes(i.id)}
                        onChange={() => handleInsuranceToggle(i.id)}
                      />
                      <span>{i.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Agenda */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Horários</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
                  <select
                    value={newWorkingHour.day}
                    onChange={(e) => setNewWorkingHour({ ...newWorkingHour, day: e.target.value as any })}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    {Object.entries(dayLabels).map(([day, label]) => (
                      <option key={day} value={day}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="time"
                    value={newWorkingHour.startTime}
                    onChange={(e) => setNewWorkingHour({ ...newWorkingHour, startTime: e.target.value })}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <input
                    type="time"
                    value={newWorkingHour.endTime}
                    onChange={(e) => setNewWorkingHour({ ...newWorkingHour, endTime: e.target.value })}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <button
                    type="button"
                    onClick={addWorkingHour}
                    className="bg-green-600 text-white px-2 py-1 rounded text-sm"
                  >
                    Adicionar
                  </button>
                </div>

                <div className="space-y-2">
                  {formData.workingHours.map((wh) => (
                    <div key={wh.day} className="flex items-center justify-between bg-white p-2 rounded border">
                      <span className="text-sm">
                        {dayLabels[wh.day]}: {wh.startTime} - {wh.endTime} (intervalo: {wh.intervalMinutes}min)
                      </span>
                      <button
                        type="button"
                        onClick={() => removeWorkingHour(wh.day)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancelar
                </button>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md">
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista de médicos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {state.doctors.map((doctor) => (
          <div key={doctor.id} className="bg-white rounded-lg shadow-md p-6">
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
                <button onClick={() => handleEdit(doctor)} className="text-gray-400 hover:text-blue-600">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(doctor.id)} className="text-gray-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Especialidade:</span>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                  {getSpecialtyName(doctor.specialtyId)}
                </span>
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Shield className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-600">Convênios:</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {doctor.insurances.map((id) => {
                    const insurance = state.insurances.find((i) => i.id === id);
                    return (
                      <span key={id} className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                        {insurance?.name}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-600">Horários:</span>
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                  {doctor.workingHours.map((wh) => (
                    <div key={wh.day}>
                      {dayLabels[wh.day]}: {wh.startTime} - {wh.endTime}
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


