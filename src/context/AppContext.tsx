import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { Doctor, Specialty, Insurance, Appointment } from '../types/index';
import { supabase } from '../lib/supabaseClient';

interface AppState {
  specialties: Specialty[];
  doctors: Doctor[];
  insurances: Insurance[];
  appointments: Appointment[];
  isLoggedIn: boolean;
  currentView: 'login' | 'admin' | 'booking';
  user: any;
}

type AppAction = 
  | { type: 'SET_VIEW'; payload: 'login' | 'admin' | 'booking' }
  | { type: 'LOGIN'; payload: any }
  | { type: 'LOGOUT' }
  | { type: 'SET_SPECIALTIES'; payload: Specialty[] }
  | { type: 'SET_DOCTORS'; payload: Doctor[] }
  | { type: 'SET_INSURANCES'; payload: Insurance[] }
  | { type: 'SET_APPOINTMENTS'; payload: Appointment[] }
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
  user: null,
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, currentView: action.payload };
    case 'LOGIN':
      return { ...state, isLoggedIn: true, currentView: 'admin', user: action.payload };
    case 'LOGOUT':
      return { ...state, isLoggedIn: false, currentView: 'login', user: null };
    case 'SET_SPECIALTIES':
      return { ...state, specialties: action.payload };
    case 'SET_DOCTORS':
      return { ...state, doctors: action.payload };
    case 'SET_INSURANCES':
      return { ...state, insurances: action.payload };
    case 'SET_APPOINTMENTS':
      return { ...state, appointments: action.payload };
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

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load specialties
        const { data: specialties } = await supabase.from('especialidades').select('*');
        if (specialties) {
          dispatch({
            type: 'SET_SPECIALTIES',
            payload: specialties.map(s => ({ id: s.id, name: s.nome }))
          });
        }

        // Load insurances
        const { data: insurances } = await supabase.from('convenios').select('*');
        if (insurances) {
          dispatch({
            type: 'SET_INSURANCES',
            payload: insurances.map(i => ({ id: i.id, name: i.nome }))
          });
        }

        // Load doctors with schedules and insurances
        const { data: doctors } = await supabase
          .from('medicos')
          .select(`
            *,
            agenda(*),
            medico_convenios(convenio_id)
          `);

        if (doctors) {
          dispatch({
            type: 'SET_DOCTORS',
            payload: doctors.map(d => ({
              id: d.id,
              name: d.nome,
              crm: d.crm,
              specialtyId: d.especialidade_id || '',
              insurances: d.medico_convenios?.map((mc: any) => mc.convenio_id) || [],
              workingHours: d.agenda?.map((a: any) => ({
                day: a.dia_semana?.toLowerCase() || '',
                startTime: a.horario_inicio,
                endTime: a.horario_fim,
                intervalMinutes: a.tempo_intervalo || 30
              })) || []
            }))
          });
        }
      } catch (error) {
        console.error('Error loading data:', error);
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
