import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { Doctor, Specialty, Insurance, Appointment, WorkingHour } from '../types';
import * as supabaseLib from '../supabase';

interface AppState {
  specialties: Specialty[];
  doctors: Doctor[];
  insurances: Insurance[];
  appointments: Appointment[];
  isLoggedIn: boolean;
  currentView: 'login' | 'admin' | 'booking';
  isLoading: boolean;
  userId: string | null;
}

type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOAD_DATA'; payload: { specialties: Specialty[]; doctors: Doctor[]; insurances: Insurance[]; appointments: Appointment[]; userId: string | null } }
  | { type: 'SET_VIEW'; payload: 'login' | 'admin' | 'booking' }
  | { type: 'LOGIN'; payload: string }
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
  userId: null,
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'LOAD_DATA':
      return {
        ...state,
        specialties: action.payload.specialties,
        doctors: action.payload.doctors,
        insurances: action.payload.insurances,
        appointments: action.payload.appointments,
        userId: action.payload.userId,
        isLoading: false,
      };
    case 'SET_VIEW':
      return { ...state, currentView: action.payload };
    case 'LOGIN':
      return { ...state, isLoggedIn: true, currentView: 'admin', userId: action.payload };
    case 'LOGOUT':
      return { ...state, isLoggedIn: false, currentView: 'login', userId: null };
    case 'ADD_SPECIALTY':
      return { ...state, specialties: [...state.specialties, action.payload] };
    case 'ADD_DOCTOR':
      return { ...state, doctors: [...state.doctors, action.payload] };
    case 'ADD_INSURANCE':
      return { ...state, insurances: [...state.insurances, action.payload] };
    case 'ADD_APPOINTMENT':
      supabaseLib.inserirAgendamento(
        state.userId ?? null,
        action.payload.doctorId,
        action.payload.date,
        action.payload.time,
        action.payload.insuranceId
      ).catch(console.warn);
      return { ...state, appointments: [...state.appointments, action.payload] };
    case 'UPDATE_DOCTOR':
      return {
        ...state,
        doctors: state.doctors.map(d => (d.id === action.payload.id ? action.payload : d)),
      };
    case 'UPDATE_SPECIALTY':
      return {
        ...state,
        specialties: state.specialties.map(s => (s.id === action.payload.id ? action.payload : s)),
      };
    case 'UPDATE_INSURANCE':
      return {
        ...state,
        insurances: state.insurances.map(i => (i.id === action.payload.id ? action.payload : i)),
      };
    case 'DELETE_DOCTOR':
      return {
        ...state,
        doctors: state.doctors.filter(d => d.id !== action.payload),
      };
    case 'DELETE_SPECIALTY':
      return {
        ...state,
        specialties: state.specialties.filter(s => s.id !== action.payload),
      };
    case 'DELETE_INSURANCE':
      return {
        ...state,
        insurances: state.insurances.filter(i => i.id !== action.payload),
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
      try {
        const user = await supabaseLib.getUser().catch(() => null);
        const userId = user?.id ?? null;

        const [specialties, insurances, doctors, appointments, horarios, medicoConvenios] =
          await Promise.all([
            supabaseLib.listarEspecialidades(),
            supabaseLib.listarConvenios(),
            supabaseLib.listarMedicos(),
            supabaseLib.listarAgendamentos(userId),
            supabaseLib.listarHorarios(),
            supabaseLib.listarMedicoConvenios(),
          ]);

        const doctorsWithExtras: Doctor[] = doctors.map(d => {
          const workingHours = horarios
            .filter(h => h.medico_id === d.id)
            .map(h => ({
              day: h.dia,
              startTime: h.horario_inicio,
              endTime: h.horario_fim,
            }));

          const doctorInsurances = medicoConvenios
            .filter(mc => mc.medico_id === d.id)
            .map(mc => mc.convenio_id);

          return {
            id: d.id,
            name: d.nome,
            crm: d.crm,
            specialtyId: d.especialidade_id,
            insurances: doctorInsurances,
            workingHours,
            createdAt: new Date(d.created_at ?? new Date()),
          };
        });

        dispatch({
          type: 'LOAD_DATA',
          payload: {
            userId,
            specialties: specialties.map(s => ({
              id: s.id,
              name: s.nome,
              description: '',
              createdAt: new Date(s.created_at ?? new Date()),
            })),
            insurances: insurances.map(i => ({
              id: i.id,
              name: i.nome,
              type: 'private',
            })),
            doctors: doctorsWithExtras,
            appointments: appointments.map(a => ({
              id: a.id,
              doctorId: a.medico_id,
              date: a.data,
              time: a.horario,
              insuranceId: a.convenio_id,
              status: 'scheduled',
              createdAt: new Date(a.created_at ?? new Date()),
              patient: { name: '', birthDate: '', city: '', phone: '', email: '' },
            })),
          },
        });
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
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


