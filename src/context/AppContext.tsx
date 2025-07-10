import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { Doctor, Specialty, Insurance, Appointment } from '../types';
import * as db from '../services/database';

interface AppState {
  specialties: Specialty[];
  doctors: Doctor[];
  insurances: Insurance[];
  appointments: Appointment[];
  isLoggedIn: boolean;
  currentView: 'login' | 'admin' | 'booking';
  isLoading: boolean;
}

type AppAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOAD_DATA'; payload: { specialties: Specialty[]; doctors: Doctor[]; insurances: Insurance[]; appointments: Appointment[] } }
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
  specialties: [],
  doctors: [],
  insurances: [],
  appointments: [],
  isLoggedIn: false,
  currentView: 'login',
  isLoading: false,
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'LOAD_DATA':
      return { ...state, ...action.payload, isLoading: false };
    case 'SET_VIEW':
      return { ...state, currentView: action.payload };
    case 'LOGIN':
      return { ...state, isLoggedIn: true, currentView: 'admin' };
    case 'LOGOUT':
      return { ...state, isLoggedIn: false, currentView: 'login' };
    case 'ADD_SPECIALTY':
      db.addSpecialty(action.payload).catch(err => {
        console.warn('Failed to save specialty to database:', err.message);
      });
      return { ...state, specialties: [...state.specialties, action.payload] };
    case 'ADD_DOCTOR':
      db.addDoctor(action.payload).catch(err => {
        console.warn('Failed to save doctor to database:', err.message);
      });
      return { ...state, doctors: [...state.doctors, action.payload] };
    case 'ADD_INSURANCE':
      db.addInsurance(action.payload).catch(err => {
        console.warn('Failed to save insurance to database:', err.message);
      });
      return { ...state, insurances: [...state.insurances, action.payload] };
    case 'ADD_APPOINTMENT':
      db.addAppointment(action.payload).catch(err => {
        console.warn('Failed to save appointment to database:', err.message);
      });
      return { ...state, appointments: [...state.appointments, action.payload] };
    case 'UPDATE_DOCTOR':
      db.updateDoctor(action.payload).catch(err => {
        console.warn('Failed to update doctor in database:', err.message);
      });
      return {
        ...state,
        doctors: state.doctors.map(doctor =>
          doctor.id === action.payload.id ? action.payload : doctor
        ),
      };
    case 'UPDATE_SPECIALTY':
      db.updateSpecialty(action.payload).catch(err => {
        console.warn('Failed to update specialty in database:', err.message);
      });
      return {
        ...state,
        specialties: state.specialties.map(specialty =>
          specialty.id === action.payload.id ? action.payload : specialty
        ),
      };
    case 'UPDATE_INSURANCE':
      db.updateInsurance(action.payload).catch(err => {
        console.warn('Failed to update insurance in database:', err.message);
      });
      return {
        ...state,
        insurances: state.insurances.map(insurance =>
          insurance.id === action.payload.id ? action.payload : insurance
        ),
      };
    case 'DELETE_DOCTOR':
      db.deleteDoctor(action.payload).catch(err => {
        console.warn('Failed to delete doctor from database:', err.message);
      });
      return {
        ...state,
        doctors: state.doctors.filter(doctor => doctor.id !== action.payload),
      };
    case 'DELETE_SPECIALTY':
      db.deleteSpecialty(action.payload).catch(err => {
        console.warn('Failed to delete specialty from database:', err.message);
      });
      return {
        ...state,
        specialties: state.specialties.filter(specialty => specialty.id !== action.payload),
      };
    case 'DELETE_INSURANCE':
      db.deleteInsurance(action.payload).catch(err => {
        console.warn('Failed to delete insurance from database:', err.message);
      });
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
    const loadData = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      console.log('Iniciando carregamento de dados do Supabase...');

      try {
        const [specialties, doctors, insurances, appointments] = await Promise.all([
          db.getSpecialties(),
          db.getDoctors(),
          db.getInsurances(),
          db.getAppointments()
        ]);

        console.log('Dados carregados com sucesso:', { specialties, doctors, insurances, appointments });
        dispatch({
          type: 'LOAD_DATA',
          payload: { specialties, doctors, insurances, appointments }
        });
      } catch (error) {
        console.error('Erro ao carregar dados do Supabase:', error instanceof Error ? error.message : error);
        // Fallback para dados iniciais em caso de erro
        dispatch({
          type: 'LOAD_DATA',
          payload: {
            specialties: initialState.specialties,
            doctors: initialState.doctors,
            insurances: initialState.insurances,
            appointments: initialState.appointments
          }
        });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    loadData();
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
