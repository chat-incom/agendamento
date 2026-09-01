// components/ResetPasswordScreen.tsx
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabaseClient';
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

const ResetPasswordScreen: React.FC = () => {
  const { dispatch } = useApp();
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [sessaoValida, setSessaoValida] = useState<boolean | null>(null);

  useEffect(() => {
    // Verifica se o usuário está autenticado via token de recuperação
    const verificarSessao = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setSessaoValida(true);
      } else {
        // Tenta extrair o token da URL (para casos onde o Supabase não fez automaticamente)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        
        if (accessToken) {
          try {
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: ''
            });
            
            if (error) {
              setSessaoValida(false);
              setErro('Link inválido ou expirado. Solicite um novo reset de senha.');
            } else {
              setSessaoValida(true);
            }
          } catch (error) {
            setSessaoValida(false);
            setErro('Erro ao validar o link de recuperação.');
          }
        } else {
          setSessaoValida(false);
          setErro('Link inválido ou expirado. Solicite um novo reset de senha.');
        }
      }
    };

    verificarSessao();
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
        setMensagem('✅ Senha atualizada com sucesso!');
        
        // Redireciona para o login após 2 segundos
        setTimeout(() => {
          dispatch({ type: 'SET_VIEW', payload: 'login' });
        }, 2000);
      }
    } catch (error) {
      setErro('Erro ao atualizar senha. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  // Se a sessão ainda está sendo verificada
  if (sessaoValida === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando link de recuperação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <button
            onClick={() => dispatch({ type: 'SET_VIEW', payload: 'login' })}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para o login
          </button>

          <div className="text-center mb-6">
            <div className="bg-blue-100 p-3 rounded-full mx-auto mb-3 w-14 h-14 flex items-center justify-center">
              <Lock className="w-7 h-7 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Criar nova senha</h2>
            <p className="text-gray-600 text-sm mt-1">
              Digite sua nova senha abaixo
            </p>
          </div>

          {!sessaoValida ? (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 text-sm">{erro}</p>
                </div>
              </div>
              <button
                onClick={() => dispatch({ type: 'SET_VIEW', payload: 'login' })}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Voltar para o login
              </button>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {erro && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  <div className="flex items-start">
                    <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                    <span>{erro}</span>
                  </div>
                </div>
              )}

              {mensagem && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                  <div className="flex items-start">
                    <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                    <span>{mensagem}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nova senha
                </label>
                <div className="relative">
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
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
                <p className="text-xs text-gray-500 mt-1">
                  A senha deve ter pelo menos 6 caracteres
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar nova senha
                </label>
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Confirme sua nova senha"
                  required
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={carregando}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {carregando ? (
                  <span className="flex items-center justify-center">
                    <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>
                    Atualizando...
                  </span>
                ) : (
                  'Atualizar senha'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordScreen;
