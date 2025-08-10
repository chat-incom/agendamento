import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Calendar, Lock, Mail, Eye, EyeOff } from 'lucide-react';

const LoginScreen: React.FC = () => {
  const { dispatch } = useApp();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarRecuperarSenha, setMostrarRecuperarSenha] = useState(false);
  const [emailRecuperacao, setEmailRecuperacao] = useState('');
  const [mensagemRecuperacao, setMensagemRecuperacao] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);
    setErro('');

    // Simulação de login - substitua pela lógica real de autenticação
    try {
      if (email === 'admin@clinica.com' && senha === 'admin123') {
        dispatch({ 
          type: 'LOGIN', 
          payload: { email, role: 'admin' } 
        });
      } else {
        setErro('Email ou senha incorretos');
      }
    } catch (error) {
      setErro('Erro ao fazer login. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  const handleRecuperarSenha = async () => {
    setMensagemRecuperacao('');
    
    if (!emailRecuperacao) {
      setMensagemRecuperacao('Por favor, digite seu e-mail');
      return;
    }

    try {
      // Simulação de recuperação de senha
      setMensagemRecuperacao('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
    } catch (error) {
      setMensagemRecuperacao('Erro ao enviar e-mail de recuperação');
    }
  };

  const handleGoToBooking = () => {
    dispatch({ type: 'SET_VIEW', payload: 'booking' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-blue-600 p-4 rounded-full mx-auto mb-4 w-16 h-16 flex items-center justify-center">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Sistema de Agendamento</h1>
          <p className="text-gray-600">Faça login para acessar o painel administrativo</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Entrar</h2>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="seu@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Lock className="w-4 h-4 inline mr-2" />
                Senha
              </label>
              <div className="relative">
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Digite sua senha"
                  required
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {mostrarSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="text-right">
              <button
                type="button"
                onClick={() => setMostrarRecuperarSenha(!mostrarRecuperarSenha)}
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
              >
                Esqueci minha senha
              </button>
            </div>

            {erro && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={carregando}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {carregando ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          {/* Credenciais de demonstração */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 text-center mb-2">Credenciais de demonstração:</p>
            <p className="text-xs text-gray-500 text-center">
              <strong>Email:</strong> admin@clinica.com<br />
              <strong>Senha:</strong> admin123
            </p>
          </div>

          {/* Recuperação de senha */}
          {mostrarRecuperarSenha && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Recuperar senha</h3>
              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="Digite seu e-mail"
                  value={emailRecuperacao}
                  onChange={(e) => setEmailRecuperacao(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleRecuperarSenha}
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Enviar e-mail de recuperação
                </button>
                {mensagemRecuperacao && (
                  <p className={`text-sm text-center ${
                    mensagemRecuperacao.includes('enviado') ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {mensagemRecuperacao}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Botão para agendamento público */}
        <div className="text-center">
          <button
            onClick={handleGoToBooking}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Agendar Consulta
          </button>
          <p className="text-sm text-gray-600 mt-2">
            Não precisa de login para agendar uma consulta
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;