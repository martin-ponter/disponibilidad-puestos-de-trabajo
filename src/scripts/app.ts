import { CENTROS } from '../data/oficinas';
import { EMPLEADOS_MOCK, USUARIO_ACTUAL_MOCK } from '../data/mocks';
import { bitrixService } from '../services/bitrix';
import { cargarEmpleados, cargarUsuarioActual } from '../services/empleados';
import { guardarReserva, listarReservasPorFecha } from '../services/reservas';
import { getCentro, getSala } from '../services/salasReunion';
import { addMonths, buildMonth, formatDateLong, fromIsoDate, toIsoDate } from '../utils/fechas';
import { puedeReservarParaEmpleado } from '../utils/permisos';
import { haySolape } from '../utils/solapes';
import type {
  BorradorReserva,
  Centro,
  EmpleadoOption,
  Recurso,
  Reserva,
  Sala,
  UsuarioApp,
} from '../types/reservas';

type DataSource = 'bitrix' | 'mock';

interface AppState {
  centros: Centro[];
  centroId: string;
  salaId: string;
  fechaSeleccionada: string;
  monthCursor: Date;
  usuario: UsuarioApp;
  empleados: EmpleadoOption[];
  reservasDia: Reserva[];
  recursoSeleccionadoId: string | null;
  modalAbierta: boolean;
  cargandoReservas: boolean;
  guardandoReserva: boolean;
  errorFormulario: string | null;
  errorCarga: string | null;
  requestSeq: number;
  entornoEmbebido: boolean;
  usuarioSource: DataSource;
  empleadosSource: DataSource;
  reservasSource: DataSource;
}

const today = new Date();

const defaultState: AppState = {
  centros: CENTROS,
  centroId: CENTROS[0]?.id ?? '',
  salaId: CENTROS[0]?.salas[0]?.id ?? '',
  fechaSeleccionada: toIsoDate(today),
  monthCursor: new Date(today.getFullYear(), today.getMonth(), 1),
  usuario: USUARIO_ACTUAL_MOCK,
  empleados: EMPLEADOS_MOCK,
  reservasDia: [],
  recursoSeleccionadoId: null,
  modalAbierta: false,
  cargandoReservas: false,
  guardandoReserva: false,
  errorFormulario: null,
  errorCarga: null,
  requestSeq: 0,
  entornoEmbebido: false,
  usuarioSource: 'mock',
  empleadosSource: 'mock',
  reservasSource: 'mock',
};

function logApp(scope: string, error: unknown, extra?: unknown): void {
  console.error(`[app:${scope}]`, error, extra ?? '');
}

function getActiveCenter(state: AppState): Centro {
  return getCentro(state.centros, state.centroId);
}

function getActiveRoom(state: AppState): Sala {
  return getSala(getActiveCenter(state), state.salaId);
}

function getSelectedResource(state: AppState): Recurso | null {
  if (!state.recursoSeleccionadoId) {
    return null;
  }

  return getActiveRoom(state).recursos.find((item) => item.id === state.recursoSeleccionadoId) ?? null;
}

function getAllowedEmployees(state: AppState): EmpleadoOption[] {
  if (state.usuario.isAdmin) {
    return state.empleados;
  }

  const selfEmployee = state.empleados.find((empleado) => empleado.id === state.usuario.id);

  return selfEmployee ? [selfEmployee] : [{ id: state.usuario.id, nombre: state.usuario.nombre, email: '' }];
}

function getResourceReservations(state: AppState, recursoId: string): Reserva[] {
  return state.reservasDia.filter(
    (reserva) =>
      reserva.centroId === state.centroId
      && reserva.salaId === state.salaId
      && reserva.recursoId === recursoId,
  );
}

function getRoomReservations(state: AppState): Reserva[] {
  return state.reservasDia.filter(
    (reserva) => reserva.centroId === state.centroId && reserva.salaId === state.salaId,
  );
}

function getDataModeLabel(state: AppState): string {
  if (state.entornoEmbebido) {
    if (state.reservasSource === 'bitrix') {
      return 'Bitrix24 activo';
    }

    return 'Bitrix24 con fallback local';
  }

  return 'Modo local';
}

function updateHero(root: HTMLElement, state: AppState): void {
  const centerLabel = root.querySelector<HTMLElement>('[data-hero-centro]');
  const dateLabel = root.querySelector<HTMLElement>('[data-hero-fecha]');
  const roomLabel = root.querySelector<HTMLElement>('[data-hero-sala]');
  const countLabel = root.querySelector<HTMLElement>('[data-hero-count]');
  const appMessage = root.querySelector<HTMLElement>('[data-app-message]');

  if (centerLabel) centerLabel.textContent = getActiveCenter(state).nombre;
  if (dateLabel) dateLabel.textContent = formatDateLong(state.fechaSeleccionada);
  if (roomLabel) roomLabel.textContent = getActiveRoom(state).nombre;
  if (countLabel) countLabel.textContent = `${getRoomReservations(state).length} reservas del dia`;

  if (appMessage) {
    appMessage.textContent = state.errorCarga ?? `Origen de datos: ${getDataModeLabel(state)}.`;
    appMessage.dataset.status = state.errorCarga ? 'error' : 'info';
  }
}

function renderCenterMeta(root: HTMLElement, state: AppState): void {
  const meta = root.querySelector<HTMLElement>('[data-centro-meta]');
  const center = getActiveCenter(state);

  if (meta) {
    meta.innerHTML = `<strong>${center.nombre}</strong><span>${center.direccion}</span>`;
  }
}

function renderCalendar(root: HTMLElement, state: AppState): void {
  const label = root.querySelector<HTMLElement>('[data-calendar-label]');
  const grid = root.querySelector<HTMLElement>('[data-calendar-grid]');
  const month = buildMonth(state.monthCursor);

  if (label) {
    label.textContent = month.etiqueta;
  }

  if (!grid) {
    return;
  }

  grid.innerHTML = month.dias
    .map((dia) => {
      const classNames = [
        'calendar__day',
        dia.perteneceAlMes ? '' : 'is-muted',
        dia.esHoy ? 'is-today' : '',
        dia.iso === state.fechaSeleccionada ? 'is-selected' : '',
      ]
        .filter(Boolean)
        .join(' ');

      return `<button type="button" class="${classNames}" data-calendar-day="${dia.iso}"><span>${dia.numero}</span></button>`;
    })
    .join('');
}

function renderRoom(root: HTMLElement, state: AppState): void {
  const roomSelect = root.querySelector<HTMLSelectElement>('[data-sala-selector]');
  const roomMeta = root.querySelector<HTMLElement>('[data-sala-meta]');
  const roomMap = root.querySelector<HTMLElement>('[data-room-map]');
  const roomDate = root.querySelector<HTMLElement>('[data-room-date]');
  const status = root.querySelector<HTMLElement>('[data-bitrix-status]');
  const resourcePanel = root.querySelector<HTMLElement>('[data-resource-panel]');
  const center = getActiveCenter(state);
  const room = getActiveRoom(state);
  const selectedResource = getSelectedResource(state);

  if (roomSelect) {
    roomSelect.innerHTML = center.salas
      .map((sala) => `<option value="${sala.id}" ${sala.id === room.id ? 'selected' : ''}>${sala.nombre}</option>`)
      .join('');
  }

  if (roomMeta) {
    roomMeta.innerHTML = `<strong>${room.nombre}</strong><span>${room.planta} | ${room.descripcion ?? ''}</span>`;
  }

  if (roomDate) {
    roomDate.textContent = formatDateLong(state.fechaSeleccionada);
  }

  if (status) {
    if (state.cargandoReservas) {
      status.textContent = 'Cargando reservas';
    } else {
      status.textContent = getDataModeLabel(state);
    }
  }

  if (resourcePanel) {
    if (selectedResource) {
      const reservas = getResourceReservations(state, selectedResource.id);
      resourcePanel.innerHTML = `<strong>${selectedResource.nombre}</strong><span>${reservas.length ? `${reservas.length} reservas en la fecha seleccionada.` : 'Sin reservas para la fecha seleccionada.'}</span>`;
    } else {
      resourcePanel.innerHTML = '<strong>Pulsa un recurso para reservar</strong><span>Los puestos y salas siguen el mismo flujo de reserva.</span>';
    }
  }

  if (!roomMap) {
    return;
  }

  roomMap.setAttribute(
    'style',
    `background:${room.mapa.fondo}; aspect-ratio:${room.mapa.width} / ${room.mapa.height};`,
  );

  roomMap.innerHTML = room.recursos
    .map((recurso) => {
      const hasBookings = getResourceReservations(state, recurso.id).length > 0;
      const classNames = [
        'resource',
        recurso.tipo === 'sala' ? 'resource--room' : 'resource--desk',
        hasBookings ? 'resource--busy' : '',
        state.recursoSeleccionadoId === recurso.id ? 'resource--selected' : '',
      ]
        .filter(Boolean)
        .join(' ');

      return `
        <button
          type="button"
          class="${classNames}"
          style="left:${recurso.posicion.x}%; top:${recurso.posicion.y}%; width:${recurso.posicion.width}%; height:${recurso.posicion.height}%;"
          data-resource-id="${recurso.id}"
          aria-label="Reservar ${recurso.nombre}"
        >
          <span>${recurso.codigo}</span>
        </button>
      `;
    })
    .join('');
}

function syncSelectors(root: HTMLElement, state: AppState): void {
  const centerSelect = root.querySelector<HTMLSelectElement>('[data-centro-selector]');
  const roomSelect = root.querySelector<HTMLSelectElement>('[data-sala-selector]');

  if (centerSelect) {
    centerSelect.value = state.centroId;
  }

  if (roomSelect) {
    roomSelect.value = state.salaId;
  }
}

function renderEmployeeOptions(root: HTMLElement, state: AppState): void {
  const employeeSelect = root.querySelector<HTMLSelectElement>('[data-input-empleado-id]');
  const employeeName = root.querySelector<HTMLInputElement>('[data-input-empleado]');
  const allowedEmployees = getAllowedEmployees(state);
  const selectedValue = employeeSelect?.value ? Number(employeeSelect.value) : allowedEmployees[0]?.id ?? state.usuario.id;
  const selectedEmployee = allowedEmployees.find((empleado) => empleado.id === selectedValue) ?? allowedEmployees[0];

  if (employeeSelect) {
    employeeSelect.innerHTML = allowedEmployees
      .map((empleado) => `<option value="${empleado.id}">${empleado.nombre}</option>`)
      .join('');
    employeeSelect.value = String(selectedEmployee?.id ?? state.usuario.id);
    employeeSelect.disabled = !state.usuario.isAdmin && allowedEmployees.length <= 1;
  }

  if (employeeName && selectedEmployee) {
    employeeName.value = selectedEmployee.nombre;
  }
}

function showFormError(root: HTMLElement, message: string | null): void {
  const error = root.querySelector<HTMLElement>('[data-form-error]');

  if (!error) {
    return;
  }

  if (!message) {
    error.hidden = true;
    error.textContent = '';
    return;
  }

  error.hidden = false;
  error.textContent = message;
}

function readDraft(form: HTMLFormElement): BorradorReserva {
  const data = new FormData(form);

  return {
    empleadoId: Number(data.get('empleadoId') ?? 0),
    empleadoNombre: String(data.get('empleadoNombre') ?? ''),
    centroId: String(data.get('centroId') ?? ''),
    salaId: String(data.get('salaId') ?? ''),
    recursoId: String(data.get('recursoId') ?? ''),
    tipoRecurso: String(data.get('tipoRecurso') ?? 'puesto') as BorradorReserva['tipoRecurso'],
    modoReserva: String(data.get('modoReserva') ?? 'individual') as BorradorReserva['modoReserva'],
    fecha: String(data.get('fecha') ?? ''),
    horaInicio: String(data.get('horaInicio') ?? ''),
    horaFin: String(data.get('horaFin') ?? ''),
    estado: String(data.get('estado') ?? 'pendiente') as BorradorReserva['estado'],
    observaciones: String(data.get('observaciones') ?? ''),
  };
}

function validateDraft(state: AppState, draft: BorradorReserva): string | null {
  if (!draft.centroId || !draft.salaId || !draft.recursoId || !draft.fecha || !draft.horaInicio || !draft.horaFin) {
    return 'Completa centro, sala, recurso, fecha y tramo horario.';
  }

  if (!draft.empleadoId || !draft.empleadoNombre) {
    return 'Selecciona un empleado para la reserva.';
  }

  if (draft.horaFin <= draft.horaInicio) {
    return 'La hora de fin debe ser posterior a la hora de inicio.';
  }

  if (!puedeReservarParaEmpleado(state.usuario, draft.empleadoId)) {
    return 'No tienes permisos para reservar para otro empleado.';
  }

  const reservaCandidata: Reserva = { ...draft, id: 'draft' };
  const hayReservaSolapada = state.reservasDia.some((reserva) => haySolape(reserva, reservaCandidata));

  if (hayReservaSolapada) {
    return 'Ya existe una reserva solapada para ese recurso en el tramo horario elegido.';
  }

  return null;
}

function updateModal(root: HTMLElement, state: AppState): void {
  const dialog = root.querySelector<HTMLDialogElement>('[data-booking-modal]');
  const recurso = getSelectedResource(state);
  const center = getActiveCenter(state);
  const room = getActiveRoom(state);

  if (!dialog || !recurso) {
    return;
  }

  const title = dialog.querySelector<HTMLElement>('[data-modal-title]');
  const resourceLabel = dialog.querySelector<HTMLElement>('[data-modal-resource]');
  const context = dialog.querySelector<HTMLElement>('[data-modal-context]');
  const fecha = dialog.querySelector<HTMLInputElement>('[data-input-fecha]');
  const centroId = dialog.querySelector<HTMLInputElement>('[data-input-centro]');
  const salaId = dialog.querySelector<HTMLInputElement>('[data-input-sala]');
  const recursoId = dialog.querySelector<HTMLInputElement>('[data-input-recurso]');
  const tipo = dialog.querySelector<HTMLInputElement>('[data-input-tipo]');
  const modo = dialog.querySelector<HTMLInputElement>('[data-input-modo]');
  const note = dialog.querySelector<HTMLElement>('[data-permissions-note]');
  const submitButton = dialog.querySelector<HTMLButtonElement>('[type="submit"]');

  if (title) title.textContent = `Reservar ${recurso.nombre}`;
  if (resourceLabel) resourceLabel.textContent = `${recurso.nombre} | ${recurso.tipo}`;
  if (context) context.textContent = `${center.nombre} | ${room.nombre} | ${formatDateLong(state.fechaSeleccionada)}`;
  if (fecha) fecha.value = state.fechaSeleccionada;
  if (centroId) centroId.value = center.id;
  if (salaId) salaId.value = room.id;
  if (recursoId) recursoId.value = recurso.id;
  if (tipo) tipo.value = recurso.tipo;
  if (modo) modo.value = recurso.modoReserva;
  if (note) {
    note.textContent = state.usuario.isAdmin
      ? 'Como admin puedes editar cualquier reserva.'
      : 'Solo puedes reservar para ti mismo.';
  }

  if (submitButton) {
    submitButton.disabled = state.guardandoReserva;
    submitButton.textContent = state.guardandoReserva ? 'Guardando...' : 'Guardar reserva';
  }

  renderEmployeeOptions(root, state);
  showFormError(root, state.errorFormulario);
}

function render(root: HTMLElement, state: AppState): void {
  syncSelectors(root, state);
  updateHero(root, state);
  renderCenterMeta(root, state);
  renderCalendar(root, state);
  renderRoom(root, state);
  updateModal(root, state);
}

function closeModal(root: HTMLElement, state: AppState): void {
  state.modalAbierta = false;
  state.errorFormulario = null;
  const dialog = root.querySelector<HTMLDialogElement>('[data-booking-modal]');
  if (dialog?.open) {
    dialog.close();
  }
  showFormError(root, null);
}

function openModal(root: HTMLElement, state: AppState, resourceId: string): void {
  state.recursoSeleccionadoId = resourceId;
  state.modalAbierta = true;
  state.errorFormulario = null;
  render(root, state);
  root.querySelector<HTMLDialogElement>('[data-booking-modal]')?.showModal();
}

async function syncReservations(root: HTMLElement, state: AppState): Promise<void> {
  const requestId = state.requestSeq + 1;
  state.requestSeq = requestId;
  state.cargandoReservas = true;
  state.errorCarga = null;
  render(root, state);

  try {
    const { reservas, source } = await listarReservasPorFecha(
      {
        fecha: state.fechaSeleccionada,
        centroId: state.centroId,
        salaId: state.salaId,
      },
      state.empleados,
    );

    if (state.requestSeq !== requestId) {
      return;
    }

    state.reservasDia = reservas;
    state.reservasSource = source;
  } catch (error) {
    logApp('reservas', error);
    state.errorCarga = 'No se pudieron cargar las reservas.';
  } finally {
    if (state.requestSeq === requestId) {
      state.cargandoReservas = false;
      render(root, state);
    }
  }
}

async function bootstrap(root: HTMLElement, state: AppState): Promise<void> {
  try {
    const context = await bitrixService.init();
    state.entornoEmbebido = context.embedded;
  } catch (error) {
    logApp('bitrixInit', error);
    state.entornoEmbebido = false;
  }

  try {
    const [{ usuario, source: usuarioSource }, { empleados, source: empleadosSource }] = await Promise.all([
      cargarUsuarioActual(),
      cargarEmpleados(),
    ]);

    state.usuario = usuario;
    state.usuarioSource = usuarioSource;
    state.empleados = empleados;
    state.empleadosSource = empleadosSource;

    if (!state.empleados.some((empleado) => empleado.id === state.usuario.id)) {
      state.empleados = [
        ...state.empleados,
        { id: state.usuario.id, nombre: state.usuario.nombre, email: '' },
      ];
    }
  } catch (error) {
    logApp('bootstrapData', error);
    state.errorCarga = 'No se pudieron cargar usuario o empleados.';
  }

  render(root, state);
  await syncReservations(root, state);
}

function changeRoom(root: HTMLElement, state: AppState, direction: -1 | 1): void {
  const rooms = getActiveCenter(state).salas;
  const currentIndex = rooms.findIndex((room) => room.id === state.salaId);
  const nextIndex = (currentIndex + direction + rooms.length) % rooms.length;
  state.salaId = rooms[nextIndex]?.id ?? state.salaId;
  state.recursoSeleccionadoId = null;
  render(root, state);
  void syncReservations(root, state);
}

export function mountApp(): void {
  const root = document.querySelector<HTMLElement>('[data-reservas-app]');

  if (!root) {
    return;
  }

  const state = { ...defaultState };
  render(root, state);

  root.addEventListener('change', (event) => {
    const target = event.target as HTMLElement;

    if (target instanceof HTMLSelectElement && target.matches('[data-centro-selector]')) {
      state.centroId = target.value;
      state.salaId = getActiveCenter(state).salas[0]?.id ?? '';
      state.recursoSeleccionadoId = null;
      render(root, state);
      void syncReservations(root, state);
      return;
    }

    if (target instanceof HTMLSelectElement && target.matches('[data-sala-selector]')) {
      state.salaId = target.value;
      state.recursoSeleccionadoId = null;
      render(root, state);
      void syncReservations(root, state);
      return;
    }

    if (target instanceof HTMLSelectElement && target.matches('[data-input-empleado-id]')) {
      const selectedEmployee = state.empleados.find((empleado) => empleado.id === Number(target.value));
      const employeeName = root.querySelector<HTMLInputElement>('[data-input-empleado]');

      if (employeeName && selectedEmployee) {
        employeeName.value = selectedEmployee.nombre;
      }

      showFormError(root, null);
      return;
    }

    if (
      target instanceof HTMLInputElement
      && (target.matches('[data-input-fecha]') || target.matches('[data-input-hora-inicio]') || target.matches('[data-input-hora-fin]'))
    ) {
      showFormError(root, null);
    }
  });

  root.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    const dayButton = target.closest<HTMLElement>('[data-calendar-day]');
    const resourceButton = target.closest<HTMLElement>('[data-resource-id]');

    if (target.matches('[data-calendar-prev]')) {
      state.monthCursor = addMonths(state.monthCursor, -1);
      renderCalendar(root, state);
      return;
    }

    if (target.matches('[data-calendar-next]')) {
      state.monthCursor = addMonths(state.monthCursor, 1);
      renderCalendar(root, state);
      return;
    }

    if (target.matches('[data-sala-prev]')) {
      changeRoom(root, state, -1);
      return;
    }

    if (target.matches('[data-sala-next]')) {
      changeRoom(root, state, 1);
      return;
    }

    if (dayButton?.dataset.calendarDay) {
      state.fechaSeleccionada = dayButton.dataset.calendarDay;
      const selectedDate = fromIsoDate(state.fechaSeleccionada);
      state.monthCursor = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      state.recursoSeleccionadoId = null;
      void syncReservations(root, state);
      return;
    }

    if (resourceButton?.dataset.resourceId) {
      openModal(root, state, resourceButton.dataset.resourceId);
      return;
    }

    if (target.matches('[data-modal-close]')) {
      closeModal(root, state);
    }
  });

  const dialog = root.querySelector<HTMLDialogElement>('[data-booking-modal]');
  dialog?.addEventListener('close', () => {
    if (state.modalAbierta) {
      closeModal(root, state);
    }
  });

  const form = root.querySelector<HTMLFormElement>('[data-booking-form]');
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const draft = readDraft(form);
    const error = validateDraft(state, draft);

    if (error) {
      state.errorFormulario = error;
      showFormError(root, error);
      return;
    }

    state.errorFormulario = null;
    state.guardandoReserva = true;
    updateModal(root, state);

    try {
      const { source } = await guardarReserva(draft);
      state.reservasSource = source;
      await syncReservations(root, state);
      closeModal(root, state);
    } catch (submissionError) {
      logApp('guardarReserva', submissionError, draft);
      state.errorFormulario = submissionError instanceof Error
        ? submissionError.message
        : 'No se pudo guardar la reserva.';
      showFormError(root, state.errorFormulario);
    } finally {
      state.guardandoReserva = false;
      updateModal(root, state);
    }
  });

  void bootstrap(root, state);
}
