import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { Doctor, Specialty, Insurance, Appointment, WorkingHour } from '../types/index';
import * as supabaseLib from '../supabase';

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
  | { type: 'LOGIN'; payload?: string }
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
      supabaseLib.inserirEspecialidade(action.payload.name).catch(console.warn);
      return { ...state, specialties: [...state.specialties, action.payload] };
    case 'ADD_DOCTOR':
      supabaseLib.inserirMedico(action.payload.name, action.payload.crm, action.payload.specialtyId).catch(console.warn);
      return { ...state, doctors: [...state.doctors, action.payload] };
    case 'ADD_INSURANCE':
      supabaseLib.inserirConvenio(action.payload.name).catch(console.warn);
      return { ...state, insurances: [...state.insurances, action.payload] };
    case 'ADD_APPOINTMENT':
      supabaseLib.inserirAgendamento(
        '', // ajuste se tiver ID de usuário
        action.payload.doctorId,
        action.payload.date,
        action.payload.time,
        action.payload.insuranceId
      ).catch(console.warn);
      return { ...state, appointments: [...state.appointments, action.payload] };
    case 'UPDATE_DOCTOR':
      supabaseLib.atualizarMedico(action.payload.id, {
        nome: action.payload.name,
        crm: action.payload.crm,
        especialidade_id: action.payload.specialtyId,
      }).catch(console.warn);
      return {
        ...state,
        doctors: state.doctors.map(d => d.id === action.payload.id ? action.payload : d),
      };
    case 'UPDATE_SPECIALTY':
      supabaseLib.atualizarEspecialidade(action.payload.id, action.payload.name).catch(console.warn);
      return {
        ...state,
        specialties: state.specialties.map(s => s.id === action.payload.id ? action.payload : s),
      };
    case 'UPDATE_INSURANCE':
      supabaseLib.atualizarConvenio(action.payload.id, action.payload.name).catch(console.warn);
      return {
        ...state,
        insurances: state.insurances.map(i => i.id === action.payload.id ? action.payload : i),
      };
    case 'DELETE_DOCTOR':
      supabaseLib.deletarMedico(action.payload).catch(console.warn);
      return {
        ...state,
        doctors: state.doctors.filter(d => d.id !== action.payload),
      };
    case 'DELETE_SPECIALTY':
      supabaseLib.deletarEspecialidade(action.payload).catch(console.warn);
      return {
        ...state,
        specialties: state.specialties.filter(s => s.id !== action.payload),
      };
    case 'DELETE_INSURANCE':
      supabaseLib.deletarConvenio(action.payload).catch(console.warn);
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
        const [specialties, insurances, doctors, appointments, horarios, medicoConvenios] = await Promise.all([
          supabaseLib.listarEspecialidades(),
          supabaseLib.listarConvenios(),
          supabaseLib.listarMedicos(),
          supabaseLib.listarAgendamentos(''), // ajuste se tiver userId
          supabaseLib.listarHorarios(),       // nova função: retorna [{ medico_id, dia, inicio, fim }]
          supabaseLib.listarMedicoConvenios(),// nova função: retorna [{ medico_id, convenio_id }]
        ]);

        const doctorsWithExtras: Doctor[] = doctors.map(d => {
          const workingHours = horarios
            .filter(h => h.medico_id === d.id)
            .map(h => ({
              day: h.dia,
              startTime: h.inicio,
              endTime: h.fim,
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
            createdAt: new Date(),
          };
        });

        dispatch({
          type: 'LOAD_DATA',
          payload: {
            specialties: specialties.map(s => ({ id: s.id, name: s.nome, description: s.nome, createdAt: new Date() })),
            insurances: insurances.map(i => ({ id: i.id, name: i.nome, type: 'private' })),
            doctors: doctorsWithExtras,
            appointments: appointments.map(a => ({
              id: a.id,
              doctorId: a.medico_id,
              date: a.data,
              time: a.horario,
              insuranceId: a.convenio_id,
              status: 'scheduled',
              createdAt: new Date(),
              patient: { name: '', birthDate: '', city: '', phone: '', email: '' }, // ajuste conforme o uso real
            })),
          }
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

