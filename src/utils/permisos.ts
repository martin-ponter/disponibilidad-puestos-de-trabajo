import type { Reserva, UsuarioApp } from '../types/reservas';

export function puedeReservarParaEmpleado(usuario: UsuarioApp, empleadoId: number): boolean {
  return usuario.isAdmin || usuario.id === empleadoId;
}

export function puedeModificarReserva(usuario: UsuarioApp, reserva: Reserva): boolean {
  return usuario.isAdmin || usuario.id === reserva.empleadoId;
}
