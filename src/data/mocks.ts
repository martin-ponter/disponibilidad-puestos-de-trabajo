import type { EmpleadoOption, Reserva, UsuarioApp } from '../types/reservas';
import { toIsoDate } from '../utils/fechas';

const today = toIsoDate(new Date());

export const USUARIO_ACTUAL_MOCK: UsuarioApp = {
  id: 7,
  nombre: 'Diego Gómez',
  isAdmin: false,
};

export const EMPLEADOS_MOCK: EmpleadoOption[] = [
  { id: 7, nombre: 'Diego Gómez', email: 'diego@example.com' },
  { id: 12, nombre: 'Lucía Martín', email: 'lucia@example.com' },
  { id: 21, nombre: 'Carlos Pérez', email: 'carlos@example.com' },
  { id: 34, nombre: 'Ana Ruiz', email: 'ana@example.com' },
];

export const RESERVAS_MOCK: Reserva[] = [
  {
    id: 'mock-1',
    empleadoId: 12,
    empleadoNombre: 'Lucía Martín',
    centroId: 'toledo',
    salaId: 'tol-planta-abierta',
    recursoId: 'tol-p02',
    tipoRecurso: 'puesto',
    modoReserva: 'individual',
    fecha: today,
    horaInicio: '09:00',
    horaFin: '14:00',
    estado: 'confirmada',
    observaciones: 'Trabajo presencial',
  },
  {
    id: 'mock-2',
    empleadoId: 21,
    empleadoNombre: 'Carlos Pérez',
    centroId: 'madrid',
    salaId: 'mad-open',
    recursoId: 'mad-cibeles',
    tipoRecurso: 'sala',
    modoReserva: 'completa',
    fecha: today,
    horaInicio: '11:00',
    horaFin: '12:30',
    estado: 'confirmada',
    observaciones: 'Reunión semanal',
  },
];
