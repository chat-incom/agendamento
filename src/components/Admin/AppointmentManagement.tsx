import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Calendar, Clock, User, Shield, CheckCircle, XCircle } from 'lucide-react';
import { formatDate, formatTime } from '../../utils/timeUtils';

type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled';

interface Appointment {
  id: string;
  data: string;
  horario: string;
  status: AppointmentStatus;
  convenio_id: string | null;
  medico_id: string;
  usuario_id: string;
  criado_em?: string;
  paciente: {
    nome: string;
    contato: string;
    cidade: string;
  };
  medico: {
    nome: string;
    especialidade: {
      nome: string;
    };
  };
  convenio?: {
    nome: string;
  };
}

const AppointmentManagement: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAppointments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('agendamentos')
      .select(`
        id, data, horario, status, criado_em,
        usuario_id,
        medico_id,
        convenio_id,
        usuarios:usuario_id (nome, contato, cidade),
        medicos:medico_id (
          nome,
          especialidades:especialidade_id (nome)
        ),
        convenios:convenio_id (nome)
      `);

    if (error) {
      console.error('Erro ao carregar agendamentos:', error.message);
    } else {
      const parsed = data.map((item: any) => ({
        id: item.id,
        data: item.data,
        horario: item.horario,
        status: item.status ?? 'scheduled',
        convenio_id: item.convenio_id,
        medico_id: item.medico_id,
        usuario_id: item.usuario_id,
        criado_em: item.criado_em,
        paciente: {
          nome: item.usuarios?.nome ?? 'Desconhecido',
          contato: item.usuarios?.contato ?? '-',
          cidade: item.usuarios?.cidade ?? '-'
        },
        medico: {
          nome: item.medicos?.nome ?? 'Desconhecido',
          especialidade: {
            nome: item.medicos?.especialidades?.nome ?? '-'
          }
        },
        convenio: {
          nome: item.convenios?.nome ?? 'Particular'
        }
      }));
      setAppointments(parsed);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'Agendado';
      case 'completed':
        return 'Concluído';
      case 'cancelled':
        return 'Cancelado';
      default:
        return 'Desconhecido';
    }
  };

  const scheduledAppointments = appointments.filter(a => a.status === 'scheduled');
  const completedAppointments = appointments.filter(a => a.status === 'completed');
  const cancelledAppointments = appointments.filter(a => a.status === 'cancelled');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Agendamentos</h2>
          <p className="text-gray-600">Visualize e gerencie os agendamentos</p>
        </div>
        <div className="flex space-x-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{scheduledAppointments.length}</div>
            <div className="text-sm text-gray-600">Agendados</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{completedAppointments.length}</div>
            <div className="text-sm text-gray-600">Concluídos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{cancelledAppointments.length}</div>
            <div className="text-sm text-gray-600">Cancelados</div>
          </div>
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Próximos Agendamentos</h3>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Carregando...</div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum agendamento encontrado</h3>
            <p className="text-gray-500">Os agendamentos aparecerão aqui quando forem criados</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {appointments
              .sort((a, b) =>
                new Date(a.data + 'T' + a.horario).getTime() - new Date(b.data + 'T' + b.horario).getTime()
              )
              .map((appointment) => (
                <div key={appointment.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-medium text-gray-900">{appointment.paciente.nome}</h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                            {getStatusIcon(appointment.status)}
                            <span className="ml-1">{getStatusText(appointment.status)}</span>
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-gray-500">
                          <div className="flex items-center space-x-4">
                            <span>{appointment.medico.nome}</span>
                            <span>•</span>
                            <span>{appointment.medico.especialidade.nome}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {formatDate(appointment.data)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatTime(appointment.horario)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-900">
                          {appointment.paciente.contato}
                        </div>
                        <div className="text-sm text-gray-500">
                          {appointment.paciente.cidade}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center text-sm text-gray-900">
                          <Shield className="w-4 h-4 mr-1" />
                          {appointment.convenio?.nome ?? 'Particular'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentManagement;
