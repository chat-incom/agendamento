import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Doctor, Specialty, Insurance, Appointment, Patient } from '../types';

interface AppState {
  specialties: Specialty[];
  doctors: Doctor[];
  insurances: Insurance[];
  appointments: Appointment[];
  isLoggedIn: boolean;
  currentView: 'login' | 'admin' | 'booking';
}

type AppAction = 
  | { type: 'SET_VIEW'; payload: 'login' | 'admin' | 'booking' }
  | { type: 'LOGIN' }
  | { type: 'LOGOUT' }
  | { type: 'ADD_SPECIALTY'; payload: Specialty }
  | { type: 'ADD_DOCTOR'; payload: Doctor }
  | { type: 'ADD_INSURANCE'; payload: Insurance }
  | { type: 'ADD_APPOINTMENT'; payload: Appointment }
  | { type: 'UPDATE_DOCTOR'; payload: Doctor }
  | { type: 'UPDATE_SPECIALTY'; payload: Specialty }
  | { type: 'UPDATE_INSURANCE'; payload: Insurance }
  | { type: 'DELETE_DOCTOR'; payload: string }
  | { type: 'DELETE_SPECIALTY'; payload: string }
  | { type: 'DELETE_INSURANCE'; payload: string };

const initialState: AppState = {
  specialties: [
    { id: '1', name: 'Cardiologia', description: 'Especialidade focada no coração e sistema circulatório', createdAt: new Date() },
    { id: '2', name: 'Dermatologia', description: 'Cuidados com a pele, cabelos e unhas', createdAt: new Date() },
    { id: '3', name: 'Pediatria', description: 'Especialidade médica dedicada ao cuidado infantil', createdAt: new Date() },
  ],
  doctors: [
    {
      id: '1',
      name: 'Dr. João Silva',
      crm: 'CRM/SP 123456',
      specialtyId: '1',
      insurances: ['1', '2'],
      workingHours: [
        { day: 'monday', startTime: '08:00', endTime: '17:00', intervalMinutes: 30 },
        { day: 'tuesday', startTime: '08:00', endTime: '17:00', intervalMinutes: 30 },
        { day: 'wednesday', startTime: '08:00', endTime: '17:00', intervalMinutes: 30 },
        { day: 'thursday', startTime: '08:00', endTime: '17:00', intervalMinutes: 30 },
        { day: 'friday', startTime: '08:00', endTime: '17:00', intervalMinutes: 30 },
      ],
      createdAt: new Date(),
    },
  ],
  insurances: [
    { id: '1', name: 'SUS', type: 'public' },
    { id: '2', name: 'Unimed', type: 'private' },
    { id: '3', name: 'Bradesco Saúde', type: 'private' },
    { id: '4', name: 'Amil', type: 'private' },
  ],
  appointments: [],
  isLoggedIn: false,
  currentView: 'login',
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, currentView: action.payload };
    case 'LOGIN':
      return { ...state, isLoggedIn: true, currentView: 'admin' };
    case 'LOGOUT':
      return { ...state, isLoggedIn: false, currentView: 'login' };
    case 'ADD_SPECIALTY':
      return { ...state, specialties: [...state.specialties, action.payload] };
    case 'ADD_DOCTOR':
      return { ...state, doctors: [...state.doctors, action.payload] };
    case 'ADD_INSURANCE':
      return { ...state, insurances: [...state.insurances, action.payload] };
    case 'ADD_APPOINTMENT':
      return { ...state, appointments: [...state.appointments, action.payload] };
    case 'UPDATE_DOCTOR':
      return {
        ...state,
        doctors: state.doctors.map(doctor =>
          doctor.id === action.payload.id ? action.payload : doctor
        ),
      };
    case 'UPDATE_SPECIALTY':
      return {
        ...state,
        specialties: state.specialties.map(specialty =>
          specialty.id === action.payload.id ? action.payload : specialty
        ),
      };
    case 'UPDATE_INSURANCE':
      return {
        ...state,
        insurances: state.insurances.map(insurance =>
          insurance.id === action.payload.id ? action.payload : insurance
        ),
      };
    case 'DELETE_DOCTOR':
      return {
        ...state,
        doctors: state.doctors.filter(doctor => doctor.id !== action.payload),
      };
    case 'DELETE_SPECIALTY':
      return {
        ...state,
        specialties: state.specialties.filter(specialty => specialty.id !== action.payload),
      };
    case 'DELETE_INSURANCE':
      return {
        ...state,
        insurances: state.insurances.filter(insurance => insurance.id !== action.payload),
      };
    default:
      return state;
  }
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}>({
  state: initialState,
  dispatch: () => {},
});

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};