import type { BitrixCrmItem, BitrixUserItem } from '../types/bitrix';
import type { EmpleadoOption, Reserva, UsuarioApp } from '../types/reservas';

function readValue(source: Record<string, unknown>, key: string): unknown {
  const keyVariants = [key, key.toUpperCase(), key.toLowerCase()];

  for (const variant of keyVariants) {
    if (variant in source) {
      return source[variant];
    }
  }

  const fields = source.fields as Record<string, unknown> | undefined;

  if (fields) {
    for (const variant of keyVariants) {
      if (variant in fields) {
        return fields[variant];
      }
    }
  }

  return undefined;
}

function asString(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value);
}

function asNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function asBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  return String(value).toUpperCase() === 'Y' || String(value).toLowerCase() === 'true' || String(value) === '1';
}

export interface BitrixReservaFieldMap {
  empleadoAsignado: string;
  centro: string;
  sala: string;
  recurso: string;
  tipoRecurso: string;
  modoReserva: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado: string;
  observaciones: string;
}

export function mapBitrixUserToUsuarioApp(user: BitrixUserItem, isAdmin: boolean): UsuarioApp {
  return {
    id: asNumber(user.ID),
    nombre: [user.NAME, user.LAST_NAME].filter(Boolean).join(' ').trim() || `Usuario ${user.ID ?? ''}`.trim(),
    isAdmin,
  };
}

export function mapBitrixUserToEmpleado(user: BitrixUserItem): EmpleadoOption {
  return {
    id: asNumber(user.ID),
    nombre: [user.NAME, user.LAST_NAME].filter(Boolean).join(' ').trim() || `Usuario ${user.ID ?? ''}`.trim(),
    email: asString(user.EMAIL),
  };
}

export function mapBitrixItemToReserva(
  item: BitrixCrmItem,
  fieldMap: BitrixReservaFieldMap,
  empleados: EmpleadoOption[] = [],
): Reserva {
  const empleadoId = asNumber(readValue(item, fieldMap.empleadoAsignado) ?? item.assignedById ?? item.createdBy);
  const empleadoNombre = empleados.find((empleado) => empleado.id === empleadoId)?.nombre ?? `Empleado ${empleadoId}`;

  return {
    id: asString(readValue(item, 'id') ?? item.id),
    empleadoId,
    empleadoNombre,
    centroId: asString(readValue(item, fieldMap.centro)),
    salaId: asString(readValue(item, fieldMap.sala)),
    recursoId: asString(readValue(item, fieldMap.recurso)),
    tipoRecurso: asString(readValue(item, fieldMap.tipoRecurso)) as Reserva['tipoRecurso'],
    modoReserva: asString(readValue(item, fieldMap.modoReserva)) as Reserva['modoReserva'],
    fecha: asString(readValue(item, fieldMap.fecha)),
    horaInicio: asString(readValue(item, fieldMap.horaInicio)),
    horaFin: asString(readValue(item, fieldMap.horaFin)),
    estado: (asString(readValue(item, fieldMap.estado)) || 'pendiente') as Reserva['estado'],
    observaciones: asString(readValue(item, fieldMap.observaciones)),
  };
}

export function isBitrixUserActive(user: BitrixUserItem): boolean {
  const active = user.ACTIVE;

  if (active === undefined) {
    return true;
  }

  return asBoolean(active);
}
