import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { useEffect } from 'react';
import { Doctor, Specialty, Insurance, Appointment, Patient } from '../types';
import * as db from '../services/database';

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

// Load initial data from database
const loadInitialData = async () => {
  try {
    const [specialties, doctors, insurances, appointments] = await Promise.all([
      db.getSpecialties(),
      db.getDoctors(), 
      db.getInsurances(),
      db.getAppointments()
    ]);
    return { specialties, doctors, insurances, appointments };
  } catch (error) {
    console.error('Error loading data:', error);
    return null;
  }
};

const initialState: AppState = {
  specialties: [],
  doctors: [],
  insurances: [],
  appointments: [],
  isLoggedIn: false,
  currentView: 'login',
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'LOAD_DATA':
      return { ...state, ...action.payload };
    case 'SET_VIEW':
      return { ...state, currentView: action.payload };
    case 'LOGIN':
      return { ...state, isLoggedIn: true, currentView: 'admin' };
    case 'LOGOUT':
      return { ...state, isLoggedIn: false, currentView: 'login' };
    case 'ADD_SPECIALTY':
      db.addSpecialty(action.payload).catch(console.error);
      return { ...state, specialties: [...state.specialties, action.payload] };
    case 'ADD_DOCTOR':
      db.addDoctor(action.payload).catch(console.error);
      return { ...state, doctors: [...state.doctors, action.payload] };
    case 'ADD_INSURANCE':
      db.addInsurance(action.payload).catch(console.error);
      return { ...state, insurances: [...state.insurances, action.payload] };
    case 'ADD_APPOINTMENT':
      db.addAppointment(action.payload).catch(console.error);
      return { ...state, appointments: [...state.appointments, action.payload] };
    case 'UPDATE_DOCTOR':
      db.updateDoctor(action.payload).catch(console.error);
      return {
        ...state,
        doctors: state.doctors.map(doctor =>
          doctor.id === action.payload.id ? action.payload : doctor
        ),
      };
    case 'UPDATE_SPECIALTY':
      db.updateSpecialty(action.payload).catch(console.error);
      return {
        ...state,
        specialties: state.specialties.map(specialty =>
          specialty.id === action.payload.id ? action.payload : specialty
        ),
      };
    case 'UPDATE_INSURANCE':
      db.updateInsurance(action.payload).catch(console.error);
      return {
        ...state,
        insurances: state.insurances.map(insurance =>
          insurance.id === action.payload.id ? action.payload : insurance
        ),
      };
    case 'DELETE_DOCTOR':
      db.deleteDoctor(action.payload).catch(console.error);
      return {
        ...state,
        doctors: state.doctors.filter(doctor => doctor.id !== action.payload),
      };
    case 'DELETE_SPECIALTY':
      db.deleteSpecialty(action.payload).catch(console.error);
      return {
        ...state,
        specialties: state.specialties.filter(specialty => specialty.id !== action.payload),
      };
    case 'DELETE_INSURANCE':
      db.deleteInsurance(action.payload).catch(console.error);
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

  useEffect(() => {
    loadInitialData().then(data => {
      if (data) {
        dispatch({ type: 'LOAD_DATA' as any, payload: data });
      }
    });
  }, []);

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