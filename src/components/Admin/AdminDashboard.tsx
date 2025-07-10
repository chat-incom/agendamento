import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LogOut, Plus, Users, Calendar, Shield, Activity } from 'lucide-react';

import SpecialtyManagement from './SpecialtyManagement';
import DoctorManagement from './DoctorManagement';
import InsuranceManagement from './InsuranceManagement';
import AppointmentManagement from './AppointmentManagement';

const AdminDashboard: React.FC = () => {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState<'specialties' | 'doctors' | 'insurances' | 'appointments'>('specialties');

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  const tabs = [
    { id: 'status', label: 'Status', icon: Activity, count: 0 },
    { id: 'specialties', label: 'Especialidades', icon: Activity, count: state.specialties.length },
    { id: 'doctors', label: 'Médicos', icon: Users, count: state.doctors.length },
    { id: 'insurances', label: 'Convênios', icon: Shield, count: state.insurances.length },
    { id: 'appointments', label: 'Agendamentos', icon: Calendar, count: state.appointments.length },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="bg-blue-600 p-2 rounded-lg mr-3">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-800">Painel Administrativo</h1>
            </div>
            <div className="flex items-center space-x-4">
              <ConnectionStatus />
              <button
                onClick={() => dispatch({ type: 'SET_VIEW', payload: 'booking' })}
                className="text-gray-600 hover:text-blue-600 transition-colors"
              >
                Ver Agendamentos
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as unknown)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  <span className="bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'status' && <SystemStatus />}
        {activeTab === 'specialties' && <SpecialtyManagement />}
        {activeTab === 'doctors' && <DoctorManagement />}
        {activeTab === 'insurances' && <InsuranceManagement />}
        {activeTab === 'appointments' && <AppointmentManagement />}
      </main>
    </div>
  );
};

export default AdminDashboard;
