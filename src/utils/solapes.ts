import type { Reserva } from '../types/reservas';

function toMinutes(hour: string): number {
  const [hours, minutes] = hour.split(':').map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

export function haySolape(a: Reserva, b: Reserva): boolean {
  if (a.fecha !== b.fecha || a.recursoId !== b.recursoId) {
    return false;
  }

  return toMinutes(a.horaInicio) < toMinutes(b.horaFin)
    && toMinutes(b.horaInicio) < toMinutes(a.horaFin);
}
