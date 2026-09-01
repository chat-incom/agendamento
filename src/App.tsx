import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import LoginScreen from './components/LoginScreen';
import AdminDashboard from './components/Admin/AdminDashboard';
import BookingSystem from './components/Booking/BookingSystem';
import ResetPasswordScreen from './components/Booking/ResetPasswordScreen';

const AppContent: React.FC = () => {
  const { state } = useApp();

  switch (state.currentView) {
    case 'login':
      return <LoginScreen />;
    case 'admin':
      return <AdminDashboard />;
    case 'booking':
      return <BookingSystem />;
    case 'reset-password': // Adicione o novo caso
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
