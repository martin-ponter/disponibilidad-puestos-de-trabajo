import { EMPLEADOS_MOCK, USUARIO_ACTUAL_MOCK } from '../data/mocks';
import { bitrixService } from './bitrix';
import { isBitrixUserActive, mapBitrixUserToEmpleado, mapBitrixUserToUsuarioApp } from './bitrixMappers';
import type { BitrixUserItem } from '../types/bitrix';
import type { EmpleadoOption, UsuarioApp } from '../types/reservas';

function logEmployeeError(scope: string, error: unknown): void {
  console.error(`[empleados:${scope}]`, error);
}

export async function cargarUsuarioActual(): Promise<{ usuario: UsuarioApp; source: 'bitrix' | 'mock' }> {
  if (!bitrixService.isReady()) {
    return { usuario: USUARIO_ACTUAL_MOCK, source: 'mock' };
  }

  try {
    const current = await bitrixService.call<BitrixUserItem>('user.current');

    return {
      usuario: mapBitrixUserToUsuarioApp(current, bitrixService.getContext().embedded && Boolean(window.BX24?.isAdmin?.())),
      source: 'bitrix',
    };
  } catch (error) {
    logEmployeeError('usuarioActual', error);
    return { usuario: USUARIO_ACTUAL_MOCK, source: 'mock' };
  }
}

async function cargarEmpleadosBitrix(): Promise<EmpleadoOption[]> {
  const users = await bitrixService.call<BitrixUserItem[]>('user.get', {
    FILTER: {
      ACTIVE: true,
    },
  });

  return users
    .filter(isBitrixUserActive)
    .map(mapBitrixUserToEmpleado)
    .filter((empleado) => empleado.id > 0);
}

export async function cargarEmpleados(): Promise<{ empleados: EmpleadoOption[]; source: 'bitrix' | 'mock' }> {
  if (!bitrixService.isReady()) {
    return { empleados: EMPLEADOS_MOCK, source: 'mock' };
  }

  try {
    const empleados = await cargarEmpleadosBitrix();

    if (empleados.length > 0) {
      return { empleados, source: 'bitrix' };
    }
  } catch (error) {
    logEmployeeError('listar', error);
  }

  return { empleados: EMPLEADOS_MOCK, source: 'mock' };
}
