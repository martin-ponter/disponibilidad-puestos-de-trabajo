import { RESERVAS_MOCK } from '../data/mocks';
import { bitrixService } from './bitrix';
import { mapBitrixItemToReserva, type BitrixReservaFieldMap } from './bitrixMappers';
import type { BitrixCrmItem } from '../types/bitrix';
import type { BorradorReserva, EmpleadoOption, Reserva } from '../types/reservas';

const ENTITY_TYPE_ID = Number(import.meta.env.PUBLIC_BITRIX_ENTITY_TYPE_ID ?? 0);

export const CAMPOS_SPA: BitrixReservaFieldMap = {
  empleadoAsignado: import.meta.env.PUBLIC_BITRIX_FIELD_EMPLEADO_ASIGNADO ?? 'assignedById',
  centro: import.meta.env.PUBLIC_BITRIX_FIELD_CENTRO ?? 'ufCrmCenter',
  sala: import.meta.env.PUBLIC_BITRIX_FIELD_SALA ?? 'ufCrmSala',
  recurso: import.meta.env.PUBLIC_BITRIX_FIELD_RECURSO ?? 'ufCrmRecurso',
  tipoRecurso: import.meta.env.PUBLIC_BITRIX_FIELD_TIPO_RECURSO ?? 'ufCrmTipoRecurso',
  modoReserva: import.meta.env.PUBLIC_BITRIX_FIELD_MODO_RESERVA ?? 'ufCrmModoReserva',
  fecha: import.meta.env.PUBLIC_BITRIX_FIELD_FECHA ?? 'ufCrmFecha',
  horaInicio: import.meta.env.PUBLIC_BITRIX_FIELD_HORA_INICIO ?? 'ufCrmHoraInicio',
  horaFin: import.meta.env.PUBLIC_BITRIX_FIELD_HORA_FIN ?? 'ufCrmHoraFin',
  estado: import.meta.env.PUBLIC_BITRIX_FIELD_ESTADO ?? 'ufCrmEstado',
  observaciones: import.meta.env.PUBLIC_BITRIX_FIELD_OBSERVACIONES ?? 'ufCrmObservaciones',
};

export interface ReservaQuery {
  fecha: string;
  centroId?: string;
  salaId?: string;
}

function logReservaError(scope: string, error: unknown, extra?: unknown): void {
  console.error(`[reservas:${scope}]`, error, extra ?? '');
}

function buildTitle(reserva: BorradorReserva): string {
  return `${reserva.fecha} | ${reserva.centroId} | ${reserva.recursoId}`;
}

function hasBitrixReservaConfig(): boolean {
  return bitrixService.isReady() && ENTITY_TYPE_ID > 0;
}

function buildReservaFilter(query: ReservaQuery): Record<string, unknown> {
  const filter: Record<string, unknown> = {
    [CAMPOS_SPA.fecha]: query.fecha,
  };

  if (query.centroId) {
    filter[CAMPOS_SPA.centro] = query.centroId;
  }

  if (query.salaId) {
    filter[CAMPOS_SPA.sala] = query.salaId;
  }

  return filter;
}

export function mapReservaToBitrixFields(reserva: BorradorReserva): Record<string, unknown> {
  return {
    title: buildTitle(reserva),
    [CAMPOS_SPA.empleadoAsignado]: reserva.empleadoId,
    [CAMPOS_SPA.centro]: reserva.centroId,
    [CAMPOS_SPA.sala]: reserva.salaId,
    [CAMPOS_SPA.recurso]: reserva.recursoId,
    [CAMPOS_SPA.tipoRecurso]: reserva.tipoRecurso,
    [CAMPOS_SPA.modoReserva]: reserva.modoReserva,
    [CAMPOS_SPA.fecha]: reserva.fecha,
    [CAMPOS_SPA.horaInicio]: reserva.horaInicio,
    [CAMPOS_SPA.horaFin]: reserva.horaFin,
    [CAMPOS_SPA.estado]: reserva.estado,
    [CAMPOS_SPA.observaciones]: reserva.observaciones ?? '',
  };
}

export async function crearReservaBitrix(reserva: BorradorReserva): Promise<unknown> {
  if (!ENTITY_TYPE_ID) {
    throw new Error('Falta configurar PUBLIC_BITRIX_ENTITY_TYPE_ID para la SPA de reservas.');
  }

  return bitrixService.call('crm.item.add', {
    entityTypeId: ENTITY_TYPE_ID,
    fields: mapReservaToBitrixFields(reserva),
  });
}

export async function listarReservasBitrix(
  query: ReservaQuery,
  empleados: EmpleadoOption[] = [],
): Promise<Reserva[]> {
  if (!ENTITY_TYPE_ID) {
    return [];
  }

  const items = await bitrixService.call<{ items?: BitrixCrmItem[] } | BitrixCrmItem[]>('crm.item.list', {
    entityTypeId: ENTITY_TYPE_ID,
    filter: buildReservaFilter(query),
    select: [
      'id',
      'title',
      CAMPOS_SPA.empleadoAsignado,
      CAMPOS_SPA.centro,
      CAMPOS_SPA.sala,
      CAMPOS_SPA.recurso,
      CAMPOS_SPA.tipoRecurso,
      CAMPOS_SPA.modoReserva,
      CAMPOS_SPA.fecha,
      CAMPOS_SPA.horaInicio,
      CAMPOS_SPA.horaFin,
      CAMPOS_SPA.estado,
      CAMPOS_SPA.observaciones,
    ],
  });

  const normalizedItems = Array.isArray(items) ? items : (items.items ?? []);

  return normalizedItems
    .map((item) => mapBitrixItemToReserva(item, CAMPOS_SPA, empleados))
    .filter((reserva) => reserva.fecha === query.fecha)
    .filter((reserva) => !query.centroId || reserva.centroId === query.centroId)
    .filter((reserva) => !query.salaId || reserva.salaId === query.salaId);
}

let reservasMockStore: Reserva[] = [...RESERVAS_MOCK];

export async function listarReservasMock(query: ReservaQuery): Promise<Reserva[]> {
  return reservasMockStore
    .filter((reserva) => reserva.fecha === query.fecha)
    .filter((reserva) => !query.centroId || reserva.centroId === query.centroId)
    .filter((reserva) => !query.salaId || reserva.salaId === query.salaId);
}

export async function crearReservaMock(reserva: BorradorReserva): Promise<Reserva> {
  const nuevaReserva: Reserva = {
    ...reserva,
    id: `mock-${Date.now()}`,
  };

  reservasMockStore = [...reservasMockStore, nuevaReserva];
  return nuevaReserva;
}

export async function listarReservasPorFecha(
  query: ReservaQuery,
  empleados: EmpleadoOption[] = [],
): Promise<{ reservas: Reserva[]; source: 'bitrix' | 'mock' }> {
  if (hasBitrixReservaConfig()) {
    try {
      const reservas = await listarReservasBitrix(query, empleados);
      return { reservas, source: 'bitrix' };
    } catch (error) {
      logReservaError('listar', error, query);
    }
  }

  return {
    reservas: await listarReservasMock(query),
    source: 'mock',
  };
}

export async function guardarReserva(
  reserva: BorradorReserva,
): Promise<{ reserva: Reserva | unknown; source: 'bitrix' | 'mock' }> {
  if (hasBitrixReservaConfig()) {
    try {
      const result = await crearReservaBitrix(reserva);
      return { reserva: result, source: 'bitrix' };
    } catch (error) {
      logReservaError('crear', error, reserva);
      throw error;
    }
  }

  return {
    reserva: await crearReservaMock(reserva),
    source: 'mock',
  };
}
