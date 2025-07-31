import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Doctor, Specialty, Insurance, WorkingHours } from '../../types';
import { Plus, User, Clock, Shield, Edit, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const DoctorManagement: React.FC = () => {
  const { state, dispatch } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<any>({
    id: null,
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
    monday: 'Segunda',
    tuesday: 'Terça',
    wednesday: 'Quarta',
    thursday: 'Quinta',
    friday: 'Sexta',
    saturday: 'Sábado',
    sunday: 'Domingo',
  };

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        // 1. Buscar médicos
        const { data: doctors, error: doctorError } = await supabase
          .from('medicos')
          .select('id, nome, crm, especialidade_id, created_at');

        if (doctorError) throw doctorError;

        // 2. Buscar convênios
        const { data: medicoConvenios, error: conveniosError } = await supabase
          .from('medico_convenios')
          .select('medico_id, convenio_id');

        if (conveniosError) throw conveniosError;

        // 3. Buscar agenda
        const { data: agendas, error: agendaError } = await supabase
          .from('agenda')
          .select('id, medico_id, dia_semana, horario_inicio, horario_fim, tempo_intervalo');

        if (agendaError) throw agendaError;

        // 4. Montar médicos completos
        const doctorsWithDetails: Doctor[] = doctors.map((doc) => ({
          id: doc.id,
          name: doc.nome,
          crm: doc.crm,
          specialtyId: doc.especialidade_id,
          insurances: medicoConvenios
            .filter((mc) => mc.medico_id === doc.id)
            .map((mc) => mc.convenio_id),
          workingHours: agendas
            .filter((ag) => ag.medico_id === doc.id)
            .map((ag) => ({
              day: Object.keys(dayLabels).find(
                (key) => dayLabels[key] === ag.dia_semana
              ) as keyof typeof dayLabels,
              startTime: ag.horario_inicio,
              endTime: ag.horario_fim,
              intervalMinutes: ag.tempo_intervalo,
            })),
          createdAt: new Date(doc.created_at),
        }));

        dispatch({ type: 'SET_DOCTORS', payload: doctorsWithDetails });
      } catch (err: any) {
        console.error('Erro ao carregar médicos:', err.message);
      }
    };

    fetchDoctors();
  }, [dispatch]);

  const handleInsuranceToggle = (insuranceId: string) => {
    const updatedInsurances = formData.selectedInsurances.includes(insuranceId)
      ? formData.selectedInsurances.filter((id: string) => id !== insuranceId)
      : [...formData.selectedInsurances, insuranceId];

    setFormData({ ...formData, selectedInsurances: updatedInsurances });
  };

  const addWorkingHour = () => {
    if (!formData.workingHours.some((wh: WorkingHours) => wh.day === newWorkingHour.day)) {
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
      workingHours: formData.workingHours.filter((wh: WorkingHours) => wh.day !== day),
    });
  };

  const handleEdit = (doctor: Doctor) => {
    setFormData({
      id: doctor.id,
      name: doctor.name,
      crm: doctor.crm,
      specialtyId: doctor.specialtyId,
      selectedInsurances: doctor.insurances,
      workingHours: doctor.workingHours,
    });
    setShowForm(true);
  };

  const handleDelete = async (doctorId: string) => {
    if (!confirm('Tem certeza que deseja excluir este médico?')) return;

    try {
      await supabase.from('agenda').delete().eq('medico_id', doctorId);
      await supabase.from('medico_convenios').delete().eq('medico_id', doctorId);

      const { error } = await supabase.from('medicos').delete().eq('id', doctorId);
      if (error) throw error;

      dispatch({ type: 'DELETE_DOCTOR', payload: doctorId });
    } catch (err: any) {
      alert('Erro ao excluir médico: ' + err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const doctorId = formData.id;

    try {
      if (doctorId) {
        // ---- UPDATE MÉDICO ----
        const { error } = await supabase
          .from('medicos')
          .update({
            nome: formData.name,
            crm: formData.crm,
            especialidade_id: formData.specialtyId,
          })
          .eq('id', doctorId);

        if (error) throw error;

        // ---- ATUALIZAR CONVÊNIOS ----
        const { data: existingConvenios } = await supabase
          .from('medico_convenios')
          .select('convenio_id')
          .eq('medico_id', doctorId);

        const existingIds = existingConvenios?.map((c) => c.convenio_id) || [];
        const newIds = formData.selectedInsurances;

        const toAdd = newIds.filter((id) => !existingIds.includes(id));
        const toRemove = existingIds.filter((id) => !newIds.includes(id));

        if (toAdd.length > 0) {
          await supabase.from('medico_convenios').insert(
            toAdd.map((cid) => ({ medico_id: doctorId, convenio_id: cid }))
          );
        }

        if (toRemove.length > 0) {
          await supabase
            .from('medico_convenios')
            .delete()
            .eq('medico_id', doctorId)
            .in('convenio_id', toRemove);
        }

        // ---- ATUALIZAR AGENDA ----
        const { data: existingAgenda } = await supabase
          .from('agenda')
          .select('id, dia_semana, horario_inicio, horario_fim, tempo_intervalo')
          .eq('medico_id', doctorId);

        const existingByDay: Record<string, any> = {};
        existingAgenda?.forEach((a) => {
          existingByDay[a.dia_semana] = a;
        });

        for (const wh of formData.workingHours) {
          const dayLabel = dayLabels[wh.day];
          const existing = existingByDay[dayLabel];

          if (existing) {
            if (
              existing.horario_inicio !== wh.startTime ||
              existing.horario_fim !== wh.endTime ||
              existing.tempo_intervalo !== wh.intervalMinutes
            ) {
              await supabase
                .from('agenda')
                .update({
                  horario_inicio: wh.startTime,
                  horario_fim: wh.endTime,
                  tempo_intervalo: wh.intervalMinutes,
                })
                .eq('id', existing.id);
            }
            delete existingByDay[dayLabel];
          } else {
            await supabase.from('agenda').insert({
              medico_id: doctorId,
              dia_semana: dayLabel,
              horario_inicio: wh.startTime,
              horario_fim: wh.endTime,
              tempo_intervalo: wh.intervalMinutes,
            });
          }
        }

        const daysToRemove = Object.values(existingByDay);
        if (daysToRemove.length > 0) {
          await supabase
            .from('agenda')
            .delete()
            .in(
              'id',
              daysToRemove.map((d: any) => d.id)
            );
        }

        dispatch({
          type: 'UPDATE_DOCTOR',
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
      } else {
        // ---- CREATE ----
        const { data, error } = await supabase
          .from('medicos')
          .insert({
            nome: formData.name,
            crm: formData.crm,
            especialidade_id: formData.specialtyId,
          })
          .select()
          .single();

        if (error) throw error;

        if (formData.selectedInsurances.length > 0) {
          await supabase.from('medico_convenios').insert(
            formData.selectedInsurances.map((cid: string) => ({
              medico_id: data.id,
              convenio_id: cid,
            }))
          );
        }

        if (formData.workingHours.length > 0) {
          await supabase.from('agenda').insert(
            formData.workingHours.map((wh: WorkingHours) => ({
              medico_id: data.id,
              dia_semana: dayLabels[wh.day],
              horario_inicio: wh.startTime,
              horario_fim: wh.endTime,
              tempo_intervalo: wh.intervalMinutes,
            }))
          );
        }

        dispatch({
          type: 'ADD_DOCTOR',
          payload: {
            id: data.id,
            name: formData.name,
            crm: formData.crm,
            specialtyId: formData.specialtyId,
            insurances: formData.selectedInsurances,
            workingHours: formData.workingHours,
            createdAt: new Date(),
          },
        });
      }

      setFormData({
        id: null,
        name: '',
        crm: '',
        specialtyId: '',
        selectedInsurances: [],
        workingHours: [],
      });
      setShowForm(false);
    } catch (err: any) {
      alert('Erro ao salvar médico: ' + err.message);
    }
  };

  const getSpecialtyName = (specialtyId: string) => {
    return state.specialties.find((s) => s.id === specialtyId)?.name || 'Especialidade não encontrada';
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

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {formData.id ? 'Editar Médico' : 'Novo Médico'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Médico
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CRM
                  </label>
                  <input
                    type="text"
                    value={formData.crm}
                    onChange={(e) => setFormData({ ...formData, crm: e.target.value })}
                    placeholder="CRM/UF 123456"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Specialty */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Especialidade
                </label>
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

              {/* Insurances */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Convênios Aceitos
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {state.insurances.map((insurance) => (
                    <label key={insurance.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.selectedInsurances.includes(insurance.id)}
                        onChange={() => handleInsuranceToggle(insurance.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{insurance.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Working Hours */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Horários de Trabalho
                </label>

                {/* Add Working Hour */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
                  <select
                    value={newWorkingHour.day}
                    onChange={(e) =>
                      setNewWorkingHour({ ...newWorkingHour, day: e.target.value as any })
                    }
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
                    onChange={(e) =>
                      setNewWorkingHour({ ...newWorkingHour, startTime: e.target.value })
                    }
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <input
                    type="time"
                    value={newWorkingHour.endTime}
                    onChange={(e) =>
                      setNewWorkingHour({ ...newWorkingHour, endTime: e.target.value })
                    }
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <button
                    type="button"
                    onClick={addWorkingHour}
                    className="bg-green-600 text-white px-2 py-1 rounded text-sm hover:bg-green-700"
                  >
                    Adicionar
                  </button>
                </div>

                {/* Working Hours List */}
                <div className="space-y-2">
                  {formData.workingHours.map((wh: WorkingHours) => (
                    <div
                      key={wh.day}
                      className="flex items-center justify-between bg-white p-2 rounded border"
                    >
                      <span className="text-sm">
                        {dayLabels[wh.day]}: {wh.startTime} - {wh.endTime} (intervalo:{' '}
                        {wh.intervalMinutes}min)
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

      {/* Doctors Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {state.doctors.map((doctor) => (
          <div
            key={doctor.id}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
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
                  {doctor.insurances.map((insuranceId) => {
                    const insurance = state.insurances.find((i) => i.id === insuranceId);
                    return (
                      <span
                        key={insuranceId}
                        className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs"
                      >
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

