import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { Doctor, Specialty, Insurance, Appointment } from '../types/index';
import { supabase } from '../lib/supabase';

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
      supabaseLib.inserirEspecialidade(action.payload.name).catch(err => {
        console.warn('Failed to save specialty:', err.message);
      });
      return { ...state, specialties: [...state.specialties, action.payload] };
    case 'ADD_DOCTOR':
      supabaseLib.inserirMedico(action.payload.name, action.payload.crm, action.payload.specialtyId).catch(err => {
        console.warn('Failed to save doctor:', err.message);
      });
      return { ...state, doctors: [...state.doctors, action.payload] };
    case 'ADD_INSURANCE':
      supabaseLib.inserirConvenio(action.payload.name).catch(err => {
        console.warn('Failed to save insurance:', err.message);
      });
      return { ...state, insurances: [...state.insurances, action.payload] };
    case 'ADD_APPOINTMENT':
      supabaseLib.inserirAgendamento(
        '', // Placeholder para usuario_id, deve ser obtido dinamicamente
        action.payload.doctorId,
        action.payload.date,
        action.payload.time,
        action.payload.insuranceId
      ).catch(err => {
        console.warn('Failed to save appointment:', err.message);
      });
      return { ...state, appointments: [...state.appointments, action.payload] };
    case 'UPDATE_DOCTOR':
      supabaseLib.atualizarMedico(action.payload.id, {
        nome: action.payload.name,
        crm: action.payload.crm,
        especialidade_id: action.payload.specialtyId,
      }).catch(err => {
        console.warn('Failed to update doctor:', err.message);
      });
      return {
        ...state,
        doctors: state.doctors.map(doctor =>
          doctor.id === action.payload.id ? action.payload : doctor
        ),
      };
    case 'UPDATE_SPECIALTY':
      supabaseLib.atualizarEspecialidade(action.payload.id, action.payload.name).catch(err => {
        console.warn('Failed to update specialty:', err.message);
      });
      return {
        ...state,
        specialties: state.specialties.map(specialty =>
          specialty.id === action.payload.id ? action.payload : specialty
        ),
      };
    case 'UPDATE_INSURANCE':
      supabaseLib.atualizarConvenio(action.payload.id, action.payload.name).catch(err => {
        console.warn('Failed to update insurance:', err.message);
      });
      return {
        ...state,
        insurances: state.insurances.map(insurance =>
          insurance.id === action.payload.id ? action.payload : insurance
        ),
      };
    case 'DELETE_DOCTOR':
      supabaseLib.deletarMedico(action.payload).catch(err => {
        console.warn('Failed to delete doctor:', err.message);
      });
      return {
        ...state,
        doctors: state.doctors.filter(doctor => doctor.id !== action.payload),
      };
    case 'DELETE_SPECIALTY':
      supabaseLib.deletarEspecialidade(action.payload).catch(err => {
        console.warn('Failed to delete specialty:', err.message);
      });
      return {
        ...state,
        specialties: state.specialties.filter(specialty => specialty.id !== action.payload),
      };
    case 'DELETE_INSURANCE':
      supabaseLib.deletarConvenio(action.payload).catch(err => {
        console.warn('Failed to delete insurance:', err.message);
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
      console.log('Iniciando carregamento de dados do Supabase às 10:00 PM -03, 09/07/2025...');

      try {
        const [specialties, insurances, doctors, appointments] = await Promise.all([
          supabaseLib.listarEspecialidades(),
          supabaseLib.listarConvenios(),
          supabaseLib.listarMedicos(),
          supabaseLib.listarAgendamentos(''), // Ajuste para um ID de usuário válido ou remova
        ]);

        console.log('Dados carregados com sucesso:', { specialties, insurances, doctors, appointments });
        dispatch({
          type: 'LOAD_DATA',
          payload: {
            specialties: specialties.map(s => ({
              id: s.id,
              name: s.nome,
              description: s.nome, // Ajuste se houver campo de descrição
              createdAt: new Date(),
            })),
            insurances: insurances.map(i => ({
              id: i.id,
              name: i.nome,
              type: 'private', // Ajuste se o tipo estiver no banco
            })),
            doctors: doctors.map(d => ({
              id: d.id,
              name: d.nome,
              crm: d.crm,
              specialtyId: d.especialidade_id,
              insurances: [], // Ajuste para buscar medico_convenios
              workingHours: [], // Ajuste para buscar agenda
              createdAt: new Date(),
            })),
            appointments: appointments.map(a => ({
              id: a.id,
              doctorId: a.medico_id,
              date: a.data,
              time: a.horario,
              patient: { name: '', birthDate: '', city: '', phone: '', email: '' }, // Ajuste para mapear usuarios
              insuranceId: a.convenio_id,
              status: 'scheduled',
              createdAt: new Date(),
            })),
          }
        });
      } catch (error) {
        console.error('Erro ao carregar dados do Supabase:', error instanceof Error ? error.message : error);
        dispatch({
          type: 'LOAD_DATA',
          payload: {
            specialties: initialState.specialties,
            doctors: initialState.doctors,
            insurances: initialState.insurances,
            appointments: initialState.appointments,
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


