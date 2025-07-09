import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserCheck, Calendar, Stethoscope, Users, Clock, Shield } from 'lucide-react';

const LoginScreen: React.FC = () => {
  const { dispatch } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin') {
      dispatch({ type: 'LOGIN' });
    } else {
      alert('Credenciais inválidas. Use admin/admin para acessar.');
    }
  };

  const handleGuestAccess = () => {
    dispatch({ type: 'SET_VIEW', payload: 'booking' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-5xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-blue-600 p-4 rounded-full mr-4">
              <Stethoscope className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-gray-800">MedApp</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Sistema completo de agendamento médico com interface moderna e intuitiva
          </p>
        </div>

        {/* Main Booking Section */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-2xl p-8 mb-8">
          <div className="text-center text-white">
            <Calendar className="w-16 h-16 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">Agende sua Consulta</h2>
            <p className="text-green-100 mb-6 text-lg">
              Rápido, fácil e sem cadastro necessário. Escolha seu médico ou especialidade preferida.
            </p>
            <button
              onClick={handleGuestAccess}
              className="bg-white text-green-600 py-4 px-12 rounded-xl font-bold text-lg hover:bg-green-50 transform hover:scale-105 transition-all duration-200 shadow-lg"
            >
              Começar Agendamento
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl shadow-md text-center">
            <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-800 text-sm">Médicos Qualificados</h3>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-md text-center">
            <Clock className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-800 text-sm">Horários Flexíveis</h3>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-md text-center">
            <Shield className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-800 text-sm">Convênios Aceitos</h3>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-md text-center">
            <UserCheck className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-800 text-sm">Confirmação Imediata</h3>
          </div>
        </div>

        {/* Admin Login - Smaller Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 max-w-md mx-auto">
          <div className="text-center mb-4">
            <h3 className="text-lg font-bold text-gray-800">Acesso Administrativo</h3>
            <p className="text-sm text-gray-600">Para funcionários da clínica</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="Usuário"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="Senha"
              required
            />
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
            >
              Entrar no Sistema
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;