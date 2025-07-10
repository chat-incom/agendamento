// DoctorManagement.tsx
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Plus, User, Clock, Shield, Edit, Trash2 } from 'lucide-react';
import { Doctor, WorkingHours } from '../../types/index';
import { supabase } from '../../lib/supabaseClient';

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

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este médico?')) {
      const { error } = await supabase.from('medicos').delete().eq('id', id);
      if (!error) dispatch({ type: 'DELETE_DOCTOR', payload: id });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data: existingDoctors, error: fetchError } = await supabase
      .from('medicos')
      .select('*')
      .eq('crm', formData.crm);

    if (fetchError) {
      console.error('Erro ao verificar CRM existente:', fetchError.message);
      return;
    }

    if (
      existingDoctors.length > 0 &&
      (!editingDoctor || existingDoctors[0].id !== editingDoctor.id)
    ) {
      alert('Já existe um médico cadastrado com este CRM.');
      return;
    }

    if (editingDoctor) {
      const updatedDoctor: Doctor = {
        ...editingDoctor,
        name: formData.name,
        crm: formData.crm,
        specialtyId: formData.specialtyId,
        insurances: formData.selectedInsurances,
        workingHours: formData.workingHours,
      };

      const { error } = await supabase
        .from('medicos')
        .update(updatedDoctor)
        .eq('id', editingDoctor.id);

      if (!error) dispatch({ type: 'UPDATE_DOCTOR', payload: updatedDoctor });
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

      const { error } = await supabase.from('medicos').insert([newDoctor]);

      if (!error) dispatch({ type: 'ADD_DOCTOR', payload: newDoctor });
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
      {/* Form, Lista e restante do componente continuam os mesmos */}
    </div>
  );
};

export default DoctorManagement;
