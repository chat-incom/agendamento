import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Doctor, Specialty, Insurance, WorkingHours } from '../../types';
import { Plus, User, Clock, Shield, Edit, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

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
    intervalMinutes: 30,
  };

  const [newWorkingHour, setNewWorkingHour] = useState<WorkingHours>(defaultWorkingHours);

  const dayLabels = {
    monday: 'Segunda',
    tuesday: 'Terça',
    wednesday: 'Quarta',
    thursday: 'Quinta',
    friday: 'Sexta',
    saturday: 'Sábado',
    sunday: 'Domingo',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data: medicoData, error: medicoError } = await supabase
        .from('medicos')
        .insert([
          {
            nome: formData.name,
            crm: formData.crm,
            especialidade_id: formData.specialtyId,
          },
        ])
        .select();

      if (medicoError || !medicoData || medicoData.length === 0) {
        console.error('Erro ao cadastrar médico:', medicoError);
        alert('Erro ao cadastrar o médico.');
        return;
      }

      const medicoId = medicoData[0].id;

      const conveniosToInsert = formData.selectedInsurances.map((convenioId) => ({
        medico_id: medicoId,
        convenio_id: convenioId,
      }));

      if (conveniosToInsert.length > 0) {
        const { error: conveniosError } = await supabase
          .from('medico_convenios')
          .insert(conveniosToInsert);

        if (conveniosError) {
          console.error('Erro ao vincular convênios:', conveniosError);
          alert('Erro ao vincular convênios ao médico.');
          return;
        }
      }

      const agendaToInsert = formData.workingHours.map((wh) => ({
        medico_id: medicoId,
        dia_semana: dayLabels[wh.day],
        horario_inicio: wh.startTime,
        horario_fim: wh.endTime,
        tempo_intervalo: wh.intervalMinutes,
      }));

      if (agendaToInsert.length > 0) {
        const { error: agendaError } = await supabase
          .from('agenda')
          .insert(agendaToInsert);

        if (agendaError) {
          console.error('Erro ao cadastrar agenda:', agendaError);
          alert('Erro ao cadastrar os horários de trabalho.');
          return;
        }
      }

      dispatch({
        type: 'ADD_DOCTOR',
        payload: {
          id: medicoId,
          name: formData.name,
          crm: formData.crm,
          specialtyId: formData.specialtyId,
          insurances: formData.selectedInsurances,
          workingHours: formData.workingHours,
          createdAt: new Date().toISOString(),
        },
      });

      setFormData({
        name: '',
        crm: '',
        specialtyId: '',
        selectedInsurances: [],
        workingHours: [],
      });
      setShowForm(false);
      alert('Médico cadastrado com sucesso!');
    } catch (err) {
      console.error('Erro inesperado:', err);
      alert('Erro inesperado ao cadastrar médico.');
    }
  };

  const handleInsuranceToggle = (insuranceId: string) => {
    const updatedInsurances = formData.selectedInsurances.includes(insuranceId)
      ? formData.selectedInsurances.filter(id => id !== insuranceId)
      : [...formData.selectedInsurances, insuranceId];

    setFormData({ ...formData, selectedInsurances: updatedInsurances });
  };

  const addWorkingHour = () => {
    if (!formData.workingHours.some(wh => wh.day === newWorkingHour.day)) {
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
      workingHours: formData.workingHours.filter(wh => wh.day !== day),
    });
  };

  const getSpecialtyName = (specialtyId: string) => {
    return state.specialties.find(s => s.id === specialtyId)?.name || 'Especialidade não encontrada';
  };

  useEffect(() => {
    const fetchDoctors = async () => {
      const { data: medicos, error } = await supabase.from('medicos').select('*');
      if (!error && medicos) {
        dispatch({ type: 'SET_DOCTORS', payload: medicos });
      }
    };
    fetchDoctors();
  }, []);

  return (
    <div className="space-y-6">
      {/* Aqui continua o restante do código da interface como estava */}
    </div>
  );
};

export default DoctorManagement;


