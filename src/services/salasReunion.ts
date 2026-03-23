import type { Centro, Sala } from '../types/reservas';

export function getCentro(centros: Centro[], centroId: string): Centro {
  const centro = centros.find((item) => item.id === centroId);

  if (!centro) {
    throw new Error(`Centro no encontrado: ${centroId}`);
  }

  return centro;
}

export function getSala(centro: Centro, salaId: string): Sala {
  const sala = centro.salas.find((item) => item.id === salaId);

  if (!sala) {
    throw new Error(`Sala no encontrada: ${salaId}`);
  }

  return sala;
}
