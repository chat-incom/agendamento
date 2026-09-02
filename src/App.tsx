// App.tsx
import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import LoginScreen from './components/LoginScreen';
import AdminDashboard from './components/Admin/AdminDashboard';
import BookingSystem from './components/Booking/BookingSystem';
import ResetPasswordScreen from './components/ResetPasswordScreen'; // ✅ Caminho corrigido

const AppContent: React.FC = () => {
  const { state, dispatch } = useApp();

  // Listener para detectar redirect de reset de senha
  useEffect(() => {
    const handleResetPasswordRedirect = () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const hasAccessToken = hashParams.get('access_token');
      
      if (hasAccessToken && state.currentView === 'login') {
        dispatch({ type: 'SET_VIEW', payload: 'reset-password' });
      }
    };

    handleResetPasswordRedirect();
    window.addEventListener('hashchange', handleResetPasswordRedirect);
    
    return () => {
      window.removeEventListener('hashchange', handleResetPasswordRedirect);
    };
  }, [dispatch, state.currentView]);

  switch (state.currentView) {
    case 'login':
      return <LoginScreen />;
    case 'admin':
      return <AdminDashboard />;
    case 'booking':
      return <BookingSystem />;
    case 'reset-password':
      return <ResetPasswordScreen />;
    default:
      return <LoginScreen />;
  }
};

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
