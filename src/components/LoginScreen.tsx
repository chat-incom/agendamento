import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext'; // se estiver usando contexto para login
import { Mail, Lock } from 'lucide-react'; // ícones úteis para os campos de login
import { supabase } from '../../lib/supabase'; // login via Supabase


const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [mostrarRecuperarSenha, setMostrarRecuperarSenha] = useState(false);
  const [emailRecuperacao, setEmailRecuperacao] = useState('');
  const [mensagemRecuperacao, setMensagemRecuperacao] = useState('');

  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);
    setErro('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error) {
      setErro(error.message);
    } else {
      navigate('/dashboard');
    }

    setCarregando(false);
  };

  const handleRecuperarSenha = async () => {
    setMensagemRecuperacao('');
    const { error } = await supabase.auth.resetPasswordForEmail(emailRecuperacao, {
      redirectTo: 'http://localhost:5173/reset-password', // Altere para a URL da sua aplicação
    });

    if (error) {
      setMensagemRecuperacao(`Erro: ${error.message}`);
    } else {
      setMensagemRecuperacao('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Entrar na Plataforma</h2>
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Senha</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
              required
            />
          </div>

          <div className="text-right">
            <button
              type="button"
              onClick={() => setMostrarRecuperarSenha(!mostrarRecuperarSenha)}
              className="text-sm text-indigo-600 hover:underline"
            >
              Esqueci minha senha
            </button>
          </div>

          {erro && <p className="text-red-500 text-sm text-center">{erro}</p>}

          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg transition"
          >
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        {mostrarRecuperarSenha && (
          <div className="mt-6 bg-gray-50 p-4 rounded-lg border">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Recuperar senha</h3>
            <input
              type="email"
              placeholder="Digite seu e-mail"
              value={emailRecuperacao}
              onChange={(e) => setEmailRecuperacao(e.target.value)}
              className="w-full px-3 py-2 mb-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <button
              onClick={handleRecuperarSenha}
              className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 transition"
            >
              Enviar e-mail de recuperação
            </button>
            {mensagemRecuperacao && (
              <p className="text-sm text-center mt-2 text-gray-700">{mensagemRecuperacao}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginScreen;

