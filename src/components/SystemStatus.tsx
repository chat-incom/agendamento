import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Database, Globe, Github } from 'lucide-react';
import { getConnectionStatus, isSupabaseConfigured } from '../lib/supabase';

interface ConnectionTest {
  name: string;
  status: 'checking' | 'success' | 'error' | 'warning';
  message: string;
  icon: React.ReactNode;
}

const SystemStatus: React.FC = () => {
  const [tests, setTests] = useState<ConnectionTest[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runAllTests = async () => {
    setIsRunning(true);
    const newTests: ConnectionTest[] = [];

    // Test 1: Environment Variables
    newTests.push({
      name: 'Variáveis de Ambiente',
      status: 'checking',
      message: 'Verificando configuração...',
      icon: <Database className="w-4 h-4" />
    });

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      newTests[0] = {
        ...newTests[0],
        status: 'success',
        message: 'Variáveis configuradas corretamente'
      };
    } else {
      newTests[0] = {
        ...newTests[0],
        status: 'warning',
        message: 'Supabase não configurado - funcionando offline'
      };
    }

    setTests([...newTests]);

    // Test 2: Supabase Connection
    newTests.push({
      name: 'Conexão Supabase',
      status: 'checking',
      message: 'Testando conexão...',
      icon: <Database className="w-4 h-4" />
    });

    setTests([...newTests]);

    if (isSupabaseConfigured()) {
      try {
        const connectionResult = await getConnectionStatus();
        newTests[1] = {
          ...newTests[1],
          status: connectionResult.connected ? 'success' : 'error',
          message: connectionResult.connected ? 'Conectado ao Supabase' : `Erro: ${connectionResult.error}`
        };
      } catch (error) {
        newTests[1] = {
          ...newTests[1],
          status: 'error',
          message: 'Falha na conexão com Supabase'
        };
      }
    } else {
      newTests[1] = {
        ...newTests[1],
        status: 'warning',
        message: 'Supabase não configurado'
      };
    }

    setTests([...newTests]);

    // Test 3: Database Tables
    newTests.push({
      name: 'Tabelas do Banco',
      status: 'checking',
      message: 'Verificando estrutura...',
      icon: <Database className="w-4 h-4" />
    });

    setTests([...newTests]);

    if (isSupabaseConfigured()) {
      try {
        const { supabase } = await import('../lib/supabase');
        if (supabase) {
          const tables = ['especialidades', 'medicos', 'convenios', 'agendamentos', 'usuarios'];
          let allTablesExist = true;
          
          for (const table of tables) {
            const { error } = await supabase.from(table).select('*').limit(1);
            if (error) {
              allTablesExist = false;
              break;
            }
          }

          newTests[2] = {
            ...newTests[2],
            status: allTablesExist ? 'success' : 'error',
            message: allTablesExist ? 'Todas as tabelas existem' : 'Algumas tabelas não encontradas'
          };
        }
      } catch (error) {
        newTests[2] = {
          ...newTests[2],
          status: 'error',
          message: 'Erro ao verificar tabelas'
        };
      }
    } else {
      newTests[2] = {
        ...newTests[2],
        status: 'warning',
        message: 'Usando dados locais'
      };
    }

    setTests([...newTests]);

    // Test 4: Frontend Application
    newTests.push({
      name: 'Aplicação Frontend',
      status: 'success',
      message: 'React app funcionando',
      icon: <Globe className="w-4 h-4" />
    });

    setTests([...newTests]);

    // Test 5: Local Storage
    newTests.push({
      name: 'Armazenamento Local',
      status: 'checking',
      message: 'Testando localStorage...',
      icon: <Database className="w-4 h-4" />
    });

    setTests([...newTests]);

    try {
      localStorage.setItem('test', 'value');
      localStorage.removeItem('test');
      newTests[4] = {
        ...newTests[4],
        status: 'success',
        message: 'localStorage funcionando'
      };
    } catch (error) {
      newTests[4] = {
        ...newTests[4],
        status: 'error',
        message: 'localStorage não disponível'
      };
    }

    setTests([...newTests]);
    setIsRunning(false);
  };

  useEffect(() => {
    runAllTests();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'checking':
        return <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'checking':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Status do Sistema</h3>
        <button
          onClick={runAllTests}
          disabled={isRunning}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
          <span>Verificar Novamente</span>
        </button>
      </div>

      <div className="space-y-3">
        {tests.map((test, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border ${getStatusColor(test.status)}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {test.icon}
                <span className="font-medium text-gray-800">{test.name}</span>
              </div>
              {getStatusIcon(test.status)}
            </div>
            <p className="text-sm text-gray-600 mt-2">{test.message}</p>
          </div>
        ))}
      </div>

      {/* Connection Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-800 mb-2">Resumo das Conexões:</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p>• <strong>Frontend:</strong> React + Vite (funcionando)</p>
          <p>• <strong>Backend:</strong> Supabase {isSupabaseConfigured() ? '(configurado)' : '(não configurado)'}</p>
          <p>• <strong>Deploy:</strong> Netlify (automático via GitHub)</p>
          <p>• <strong>Dados:</strong> {isSupabaseConfigured() ? 'Persistentes no Supabase' : 'Locais (temporários)'}</p>
        </div>
      </div>

      {!isSupabaseConfigured() && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-800">Configuração Necessária</span>
          </div>
          <p className="text-sm text-blue-700 mb-3">
            Para salvar dados permanentemente, configure o Supabase:
          </p>
          <button
            onClick={() => window.open('https://bolt.new/setup/supabase', '_blank')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
          >
            Configurar Supabase
          </button>
        </div>
      )}
    </div>
  );
};

export default SystemStatus;