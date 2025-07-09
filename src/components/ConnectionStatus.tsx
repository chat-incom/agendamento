import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { getConnectionStatus, isSupabaseConfigured } from '../lib/supabase';

const ConnectionStatus: React.FC = () => {
  const [status, setStatus] = useState<{ connected: boolean; error?: string }>({ connected: false });
  const [isChecking, setIsChecking] = useState(false);

  const checkConnection = async () => {
    setIsChecking(true);
    try {
      const result = await getConnectionStatus();
      setStatus(result);
    } catch (error) {
      setStatus({ connected: false, error: 'Erro ao verificar conexão' });
    }
    setIsChecking(false);
  };

  useEffect(() => {
    if (isSupabaseConfigured()) {
      checkConnection();
    }
  }, []);

  if (!isSupabaseConfigured()) {
    return (
      <div className="flex items-center space-x-2 text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
        <AlertCircle className="w-4 h-4" />
        <span className="text-sm">Supabase não configurado</span>
        <button
          onClick={() => window.open('https://bolt.new/setup/supabase', '_blank')}
          className="text-xs bg-orange-600 text-white px-2 py-1 rounded hover:bg-orange-700"
        >
          Configurar
        </button>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
      status.connected 
        ? 'text-green-600 bg-green-50' 
        : 'text-red-600 bg-red-50'
    }`}>
      {isChecking ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : status.connected ? (
        <Wifi className="w-4 h-4" />
      ) : (
        <WifiOff className="w-4 h-4" />
      )}
      <span className="text-sm">
        {isChecking ? 'Verificando...' : status.connected ? 'Conectado' : 'Desconectado'}
      </span>
      {status.error && (
        <span className="text-xs opacity-75">({status.error})</span>
      )}
      <button
        onClick={checkConnection}
        disabled={isChecking}
        className="text-xs bg-current bg-opacity-20 px-2 py-1 rounded hover:bg-opacity-30 disabled:opacity-50"
      >
        Testar
      </button>
    </div>
  );
};

export default ConnectionStatus;