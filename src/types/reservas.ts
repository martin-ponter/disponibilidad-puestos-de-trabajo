export type TipoRecurso = 'puesto' | 'sala';

export type ModoReserva = 'individual' | 'completa';

export type EstadoReserva = 'pendiente' | 'confirmada' | 'cancelada';

export interface PosicionRecurso {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Recurso {
  id: string;
  nombre: string;
  codigo: string;
  tipo: TipoRecurso;
  modoReserva: ModoReserva;
  capacidad?: number;
  etiquetas?: string[];
  posicion: PosicionRecurso;
}

export interface Sala {
  id: string;
  centroId: string;
  nombre: string;
  codigo: string;
  planta: string;
  descripcion?: string;
  mapa: {
    width: number;
    height: number;
    fondo: string;
  };
  recursos: Recurso[];
}

export interface Centro {
  id: string;
  nombre: string;
  codigo: string;
  ciudad: string;
  direccion: string;
  timezone: string;
  salas: Sala[];
}

export interface Reserva {
  id: string;
  empleadoId: number;
  empleadoNombre: string;
  centroId: string;
  salaId: string;
  recursoId: string;
  tipoRecurso: TipoRecurso;
  modoReserva: ModoReserva;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado: EstadoReserva;
  observaciones?: string;
}

export interface BorradorReserva extends Omit<Reserva, 'id'> {
  id?: string;
}

export interface UsuarioApp {
  id: number;
  nombre: string;
  isAdmin: boolean;
}

export interface EmpleadoOption {
  id: number;
  nombre: string;
  email: string;
}
