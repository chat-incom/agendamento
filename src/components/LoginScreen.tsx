import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserCheck, Calendar, Stethoscope, Users, Clock } from 'lucide-react';

const LoginScreen: React.FC = () => {
  const { dispatch } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple mock login
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
      <div className="max-w-6xl w-full grid md:grid-cols-2 gap-8 items-center">
        {/* Hero Section */}
        <div className="text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start mb-6">
            <div className="bg-blue-600 p-3 rounded-full mr-4">
              <Stethoscope className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800">MedApp</h1>
          </div>
          
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Sistema completo de agendamento médico. Gerencie especialidades, médicos e consultas 
            com facilidade e eficiência.
          </p>
          
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <Users className="w-8 h-8 text-blue-600 mb-2" />
              <h3 className="font-semibold text-gray-800">Médicos</h3>
              <p className="text-sm text-gray-600">Cadastre e gerencie profissionais</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <Calendar className="w-8 h-8 text-green-600 mb-2" />
              <h3 className="font-semibold text-gray-800">Agenda</h3>
              <p className="text-sm text-gray-600">Configure horários de atendimento</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <Clock className="w-8 h-8 text-orange-600 mb-2" />
              <h3 className="font-semibold text-gray-800">Agendamento</h3>
              <p className="text-sm text-gray-600">Interface intuitiva para pacientes</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <UserCheck className="w-8 h-8 text-purple-600 mb-2" />
              <h3 className="font-semibold text-gray-800">Convênios</h3>
              <p className="text-sm text-gray-600">Gerenciamento de planos de saúde</p>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white p-8 rounded-2xl shadow-xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Acesso ao Sistema</h2>
            <p className="text-gray-600">Faça login para gerenciar o sistema</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Usuário
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Digite seu usuário"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Digite sua senha"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
            >
              Entrar no Sistema
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-center">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 rounded-xl shadow-lg mb-4">
                <Calendar className="w-12 h-12 text-white mx-auto mb-3" />
                <h3 className="text-xl font-bold text-white mb-2">Agende sua Consulta</h3>
                <p className="text-green-100 mb-4">Rápido, fácil e sem cadastro necessário</p>
                <button
                  onClick={handleGuestAccess}
                  className="bg-white text-green-600 py-3 px-8 rounded-lg font-bold hover:bg-green-50 transform hover:scale-105 transition-all duration-200 shadow-md"
                >
                  Começar Agendamento
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
