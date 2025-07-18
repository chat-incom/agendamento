import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Doctor, Specialty, Insurance, WorkingHours } from '../../types';

const DoctorManagement: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [insurances, setInsurances] = useState<Insurance[]>([]);

  const [formData, setFormData] = useState<Omit<Doctor, 'id'>>({
    name: '',
    crm: '',
    specialtyId: '',
    insurances: [],
    workingHours: [],
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    await Promise.all([loadDoctors(), loadSpecialties(), loadInsurances()]);
  };

  const loadDoctors = async () => {
    const { data, error } = await supabase.from('medicos').select(`
      id, nome, crm, especialidade_id,
      medico_convenios ( convenio_id ),
      agenda ( dia_semana, horario_inicio, horario_fim, tempo_intervalo )
    `);

    if (!error && data) {
      const mapped: Doctor[] = data.map((m) => ({
        id: m.id,
        name: m.nome,
        crm: m.crm,
        specialtyId: m.especialidade_id,
        insurances: m.medico_convenios.map(mc => mc.convenio_id),
        workingHours: m.agenda.map((a) => ({
          day: translateDayToKey(a.dia_semana),
          startTime: a.horario_inicio,
          endTime: a.horario_fim,
          intervalMinutes: a.tempo_intervalo,
        })),
      }));
      setDoctors(mapped);
    }
  };

  const loadSpecialties = async () => {
    const { data } = await supabase.from('especialidades').select('*');
    if (data) setSpecialties(data);
  };

  const loadInsurances = async () => {
    const { data } = await supabase.from('convenios').select('*');
    if (data) setInsurances(data);
  };

  const dayLabelsReverse = {
    monday: 'Segunda',
    tuesday: 'Terça',
    wednesday: 'Quarta',
    thursday: 'Quinta',
    friday: 'Sexta',
    saturday: 'Sábado',
    sunday: 'Domingo',
  };

  const translateDayToKey = (day: string): WorkingHours['day'] => {
    const mapping = {
      Segunda: 'monday',
      Terça: 'tuesday',
      Quarta: 'wednesday',
      Quinta: 'thursday',
      Sexta: 'friday',
      Sábado: 'saturday',
      Domingo: 'sunday',
    };
    return mapping[day] || 'monday';
  };

  const handleSave = async () => {
    if (editingId) {
      // UPDATE
      await supabase.from('medicos').update({
        nome: formData.name,
        crm: formData.crm,
        especialidade_id: formData.specialtyId,
      }).eq('id', editingId);

      await supabase.from('medico_convenios').delete().eq('medico_id', editingId);
      await supabase.from('agenda').delete().eq('medico_id', editingId);

      await Promise.all([
        supabase.from('medico_convenios').insert(
          formData.insurances.map((cid) => ({ medico_id: editingId, convenio_id: cid }))
        ),
        supabase.from('agenda').insert(
          formData.workingHours.map((wh) => ({
            medico_id: editingId,
            dia_semana: dayLabelsReverse[wh.day],
            horario_inicio: wh.startTime,
            horario_fim: wh.endTime,
            tempo_intervalo: wh.intervalMinutes,
          }))
        )
      ]);
    } else {
      // INSERT
      const { data: medico } = await supabase.from('medicos').insert({
        nome: formData.name,
        crm: formData.crm,
        especialidade_id: formData.specialtyId,
      }).select().single();

      if (medico) {
        await Promise.all([
          supabase.from('medico_convenios').insert(
            formData.insurances.map((cid) => ({ medico_id: medico.id, convenio_id: cid }))
          ),
          supabase.from('agenda').insert(
            formData.workingHours.map((wh) => ({
              medico_id: medico.id,
              dia_semana: dayLabelsReverse[wh.day],
              horario_inicio: wh.startTime,
              horario_fim: wh.endTime,
              tempo_intervalo: wh.intervalMinutes,
            }))
          )
        ]);
      }
    }

    setShowForm(false);
    setEditingId(null);
    await loadDoctors();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('agenda').delete().eq('medico_id', id);
    await supabase.from('medico_convenios').delete().eq('medico_id', id);
    await supabase.from('medicos').delete().eq('id', id);
    await loadDoctors();
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Gerenciar Médicos</h2>
      <button onClick={() => setShowForm(true)} className="mb-4 bg-blue-500 text-white px-4 py-2 rounded">
        Novo Médico
      </button>

      {showForm && (
        <div className="p-4 border rounded bg-white">
          {/* Campos de formulário (nome, crm, especialidade, convênios, horários) */}
          {/* ... */}
          <button onClick={handleSave} className="mt-4 bg-green-500 text-white px-4 py-2 rounded">
            Salvar
          </button>
        </div>
      )}

      <ul className="mt-4">
        {doctors.map((doctor) => (
          <li key={doctor.id} className="border-b py-2 flex justify-between">
            <div>
              <strong>{doctor.name}</strong> (CRM: {doctor.crm})
            </div>
            <div>
              <button onClick={() => {
                setEditingId(doctor.id);
                setFormData({
                  name: doctor.name,
                  crm: doctor.crm,
                  specialtyId: doctor.specialtyId,
                  insurances: doctor.insurances,
                  workingHours: doctor.workingHours,
                });
                setShowForm(true);
              }} className="mr-2 text-blue-600">Editar</button>
              <button onClick={() => handleDelete(doctor.id)} className="text-red-600">Excluir</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DoctorManagement;
