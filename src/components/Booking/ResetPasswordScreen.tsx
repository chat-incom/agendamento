import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';

const ResetPasswordScreen: React.FC = () => {
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Verifica se o usuário está autenticado via token de recuperação
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setErro('Link inválido ou expirado. Solicite um novo reset de senha.');
      }
    };
    checkSession();
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setMensagem('');

    // Validações
    if (novaSenha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setErro('As senhas não coincidem');
      return;
    }

    setCarregando(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: novaSenha
      });

      if (error) {
        setErro('Erro ao atualizar senha: ' + error.message);
      } else {
        setMensagem('Senha atualizada com sucesso!');
        // Redireciona para o login após 2 segundos
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (error) {
      setErro('Erro ao atualizar senha. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <button
            onClick={() => navigate('/login')}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para o login
          </button>

          <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
            Criar nova senha
          </h2>
          <p className="text-center text-gray-600 mb-6">
            Digite sua nova senha abaixo
          </p>

          {erro && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
              {erro}
            </div>
          )}

          {mensagem && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">
              {mensagem}
            </div>
          )}

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Lock className="w-4 h-4 inline mr-2" />
                Nova senha
              </label>
              <div className="relative">
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Digite sua nova senha"
                  required
                  minLength={6}
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar nova senha
              </label>
              <input
                type={mostrarSenha ? 'text' : 'password'}
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Confirme sua nova senha"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={carregando}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              {carregando ? 'Atualizando...' : 'Atualizar senha'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordScreen;
