type Office = "Toledo" | "Madrid" | "Alcobendas" | "Consuegra";
type WorkStatus = "works" | "not-works";
type WorkMode = "office" | "remote" | "event";

interface Desk {
  id: string;
  available: boolean;
}

interface WorkEntry {
  type: "works";
  mode: WorkMode;
  office: Office;
  room: string;
  startTime: string;
  endTime: string;
  deskId: string | null;
}

interface AbsenceEntry {
  type: "not-works";
}

type CalendarEntry = WorkEntry | AbsenceEntry;
type ReservationMap = Record<string, CalendarEntry>;

const officeRooms: Record<Office, string[]> = {
  Toledo: ["Sala Principal", "Sala Norte", "Sala Reuniones", "Open Space"],
  Madrid: ["Sala A", "Sala B", "Sala Dirección", "Sala Colaborativa"],
  Alcobendas: ["Sala Atlas", "Sala Nexo", "Sala Focus"],
  Consuegra: ["Sala Central", "Sala Archivo", "Sala Clientes"],
};

const officeDeskData: Record<Office, Desk[]> = {
  Toledo: [
    { id: "T1", available: true },
    { id: "T2", available: true },
    { id: "T3", available: false },
    { id: "T4", available: true },
    { id: "T5", available: false },
    { id: "T6", available: true },
    { id: "T7", available: true },
    { id: "T8", available: true },
  ],
  Madrid: [
    { id: "M1", available: true },
    { id: "M2", available: false },
    { id: "M3", available: true },
    { id: "M4", available: true },
    { id: "M5", available: false },
    { id: "M6", available: false },
    { id: "M7", available: true },
    { id: "M8", available: true },
  ],
  Alcobendas: [
    { id: "A1", available: true },
    { id: "A2", available: true },
    { id: "A3", available: true },
    { id: "A4", available: false },
    { id: "A5", available: true },
    { id: "A6", available: false },
    { id: "A7", available: true },
    { id: "A8", available: true },
  ],
  Consuegra: [
    { id: "C1", available: false },
    { id: "C2", available: true },
    { id: "C3", available: true },
    { id: "C4", available: true },
    { id: "C5", available: false },
    { id: "C6", available: true },
    { id: "C7", available: true },
    { id: "C8", available: false },
  ],
};

const monthNames: string[] = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const reservationsByDate: ReservationMap = {
  "2026-03-24": {
    type: "works",
    mode: "office",
    office: "Toledo",
    room: "Sala Principal",
    startTime: "09:00",
    endTime: "14:00",
    deskId: "T2",
  },
  "2026-03-26": {
    type: "works",
    mode: "remote",
    office: "Madrid",
    room: "Sala A",
    startTime: "08:00",
    endTime: "15:00",
    deskId: null,
  },
  "2026-03-27": {
    type: "not-works",
  },
};

const calendarGrid = document.getElementById("calendar-grid") as HTMLDivElement | null;
const calendarMonthLabel = document.getElementById("calendar-month-label") as HTMLParagraphElement | null;
const prevMonthBtn = document.getElementById("prev-month-btn") as HTMLButtonElement | null;
const nextMonthBtn = document.getElementById("next-month-btn") as HTMLButtonElement | null;

const selectedDateBadge = document.getElementById("selected-date-badge") as HTMLDivElement | null;
const selectedDateText = document.getElementById("selected-date-text") as HTMLSpanElement | null;

const dayModal = document.getElementById("day-modal") as HTMLDivElement | null;
const closeDayModalBtn = document.getElementById("close-day-modal-btn") as HTMLButtonElement | null;
const modalSelectedDate = document.getElementById("modal-selected-date") as HTMLParagraphElement | null;
const modalMainTitle = document.getElementById("modal-main-title") as HTMLHeadingElement | null;
const modalModeBadge = document.getElementById("modal-mode-badge") as HTMLSpanElement | null;
const modalExistingSummary = document.getElementById("modal-existing-summary") as HTMLParagraphElement | null;
const deleteEntryBtn = document.getElementById("delete-entry-btn") as HTMLButtonElement | null;

const worksCard = document.getElementById("works-card") as HTMLButtonElement | null;
const notWorksCard = document.getElementById("not-works-card") as HTMLButtonElement | null;
const worksSection = document.getElementById("works-section") as HTMLDivElement | null;
const notWorksSection = document.getElementById("not-works-section") as HTMLDivElement | null;

const officeSelect = document.getElementById("office") as HTMLSelectElement | null;
const roomSelect = document.getElementById("room") as HTMLSelectElement | null;
const startTimeInput = document.getElementById("start-time") as HTMLInputElement | null;
const endTimeInput = document.getElementById("end-time") as HTMLInputElement | null;
const remoteCheckbox = document.getElementById("remote-checkbox") as HTMLInputElement | null;
const eventCheckbox = document.getElementById("event-checkbox") as HTMLInputElement | null;

const emptyState = document.getElementById("empty-state") as HTMLDivElement | null;
const mapWrapper = document.getElementById("map-wrapper") as HTMLDivElement | null;
const noDeskNeededState = document.getElementById("no-desk-needed-state") as HTMLDivElement | null;
const desksGrid = document.getElementById("desks-grid") as HTMLDivElement | null;
const mapSubtitle = document.getElementById("map-subtitle") as HTMLParagraphElement | null;

const reserveBtn = document.getElementById("reserve-btn") as HTMLButtonElement | null;
const saveAbsenceBtn = document.getElementById("save-absence-btn") as HTMLButtonElement | null;

const selectedDeskBadge = document.getElementById("selected-desk-badge") as HTMLDivElement | null;
const selectedDeskText = document.getElementById("selected-desk-text") as HTMLSpanElement | null;

const confirmationModal = document.getElementById("confirmation-modal") as HTMLDivElement | null;
const confirmationIcon = document.getElementById("confirmation-icon") as HTMLDivElement | null;
const confirmationTitle = document.getElementById("confirmation-title") as HTMLHeadingElement | null;
const confirmationMessage = document.getElementById("confirmation-message") as HTMLParagraphElement | null;
const closeConfirmationBtn = document.getElementById("close-confirmation-btn") as HTMLButtonElement | null;

const statusCards = Array.from(document.querySelectorAll<HTMLButtonElement>(".status-card"));

let selectedDesk: string | null = null;
let selectedDate: string | null = null;
let selectedStatus: WorkStatus | null = null;
let currentCalendarDate = new Date();
let modalMode: "create" | "edit" = "create";

function ensureRequiredDom(): boolean {
  return Boolean(
    calendarGrid &&
      calendarMonthLabel &&
      prevMonthBtn &&
      nextMonthBtn &&
      selectedDateBadge &&
      selectedDateText &&
      dayModal &&
      closeDayModalBtn &&
      modalSelectedDate &&
      modalMainTitle &&
      modalModeBadge &&
      modalExistingSummary &&
      deleteEntryBtn &&
      worksCard &&
      notWorksCard &&
      worksSection &&
      notWorksSection &&
      officeSelect &&
      roomSelect &&
      startTimeInput &&
      endTimeInput &&
      remoteCheckbox &&
      eventCheckbox &&
      emptyState &&
      mapWrapper &&
      noDeskNeededState &&
      desksGrid &&
      mapSubtitle &&
      reserveBtn &&
      saveAbsenceBtn &&
      selectedDeskBadge &&
      selectedDeskText &&
      confirmationModal &&
      confirmationIcon &&
      confirmationTitle &&
      confirmationMessage &&
      closeConfirmationBtn
  );
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatHumanDate(dateString: string): string {
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
}

function openDayModal(): void {
  if (!dayModal) return;
  dayModal.classList.remove("pointer-events-none", "opacity-0");
}

function closeDayModal(): void {
  if (!dayModal) return;
  dayModal.classList.add("pointer-events-none", "opacity-0");
}

function openConfirmation(success: boolean, message: string, title: string): void {
  if (!confirmationTitle || !confirmationMessage || !confirmationIcon || !confirmationModal) return;

  confirmationTitle.textContent = title;
  confirmationMessage.textContent = message;
  confirmationIcon.textContent = success ? "✅" : "❌";
  confirmationIcon.className = success
    ? "mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-2xl"
    : "mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-2xl";

  confirmationModal.classList.remove("pointer-events-none", "opacity-0");
}

function closeConfirmation(): void {
  if (!confirmationModal) return;
  confirmationModal.classList.add("pointer-events-none", "opacity-0");
}

function getEntryByDate(date: string): CalendarEntry | null {
  return reservationsByDate[date] ?? null;
}

function getCalendarBadge(entry: CalendarEntry | null): { label: string; classes: string } | null {
  if (!entry) return null;

  if (entry.type === "works") {
    if (entry.mode === "remote") {
      return { label: "Teletrabajo", classes: "bg-blue-100 text-blue-700" };
    }

    if (entry.mode === "event") {
      return { label: "Evento", classes: "bg-violet-100 text-violet-700" };
    }

    return { label: "Oficina", classes: "bg-emerald-100 text-emerald-700" };
  }

  return { label: "No trabaja", classes: "bg-amber-100 text-amber-700" };
}

function getEntrySummary(entry: CalendarEntry): string {
  if (entry.type === "works") {
    if (entry.mode === "office") {
      return `Trabaja en oficina · ${entry.office} · ${entry.room} · ${entry.startTime}-${entry.endTime}${entry.deskId ? ` · Mesa ${entry.deskId}` : ""}`;
    }

    if (entry.mode === "remote") {
      return `Teletrabajo · ${entry.office} · ${entry.room} · ${entry.startTime}-${entry.endTime}`;
    }

    return `Evento · ${entry.office} · ${entry.room} · ${entry.startTime}-${entry.endTime}`;
  }

  return "No trabaja";
}

function updateModalHeader(): void {
  if (!selectedDate || !modalMainTitle || !modalSelectedDate || !modalModeBadge || !deleteEntryBtn || !modalExistingSummary) {
    return;
  }

  const existingEntry = getEntryByDate(selectedDate);
  const isEditMode = modalMode === "edit" && existingEntry;

  modalMainTitle.textContent = isEditMode ? "Editar jornada" : "Gestionar jornada";
  modalSelectedDate.textContent = `Fecha seleccionada: ${formatHumanDate(selectedDate)}`;

  modalModeBadge.classList.toggle("hidden", !isEditMode);
  deleteEntryBtn.classList.toggle("hidden", !isEditMode);

  if (isEditMode && existingEntry) {
    modalExistingSummary.classList.remove("hidden");
    modalExistingSummary.textContent = `Registro actual: ${getEntrySummary(existingEntry)}`;
  } else {
    modalExistingSummary.classList.add("hidden");
    modalExistingSummary.textContent = "";
  }
}

function resetStatusCards(): void {
  statusCards.forEach((card) => {
    card.classList.remove("border-blue-400", "bg-blue-50", "ring-2", "ring-blue-200");
    card.classList.add("border-slate-200", "bg-white");
  });
}

function highlightStatusCard(status: WorkStatus): void {
  statusCards.forEach((card) => {
    const isActive = card.dataset.status === status;
    card.classList.toggle("border-blue-400", isActive);
    card.classList.toggle("bg-blue-50", isActive);
    card.classList.toggle("ring-2", isActive);
    card.classList.toggle("ring-blue-200", isActive);

    if (isActive) {
      card.classList.remove("border-slate-200", "bg-white");
    } else {
      card.classList.add("border-slate-200", "bg-white");
    }
  });
}

function resetMapState(): void {
  if (!selectedDeskBadge || !selectedDeskText || !desksGrid || !mapWrapper || !noDeskNeededState || !emptyState || !mapSubtitle) {
    return;
  }

  selectedDesk = null;
  selectedDeskBadge.classList.add("hidden");
  selectedDeskText.textContent = "-";
  desksGrid.innerHTML = "";
  mapWrapper.classList.add("hidden");
  noDeskNeededState.classList.add("hidden");
  emptyState.classList.remove("hidden");
  mapSubtitle.textContent = "Selecciona una oficina y una sala para visualizar el plano.";
}

function resetModalState(): void {
  if (!worksSection || !notWorksSection || !officeSelect || !roomSelect || !startTimeInput || !endTimeInput || !remoteCheckbox || !eventCheckbox || !reserveBtn || !saveAbsenceBtn) {
    return;
  }

  selectedStatus = null;
  selectedDesk = null;
  modalMode = "create";

  resetStatusCards();

  worksSection.classList.add("hidden");
  notWorksSection.classList.add("hidden");

  officeSelect.value = "";
  roomSelect.innerHTML = `<option value="">Primero elige una oficina</option>`;
  roomSelect.disabled = true;
  startTimeInput.value = "";
  endTimeInput.value = "";
  remoteCheckbox.checked = false;
  eventCheckbox.checked = false;

  resetMapState();

  reserveBtn.disabled = true;
  reserveBtn.textContent = "Guardar jornada";
  saveAbsenceBtn.disabled = false;
  saveAbsenceBtn.textContent = "Guardar no trabaja";

  updateModalHeader();
}

function populateRooms(preselectedRoom?: string): void {
  if (!officeSelect || !roomSelect) return;

  const office = officeSelect.value as Office | "";
  roomSelect.innerHTML = "";

  if (!office) {
    roomSelect.disabled = true;
    roomSelect.innerHTML = `<option value="">Primero elige una oficina</option>`;
    renderMap();
    return;
  }

  roomSelect.disabled = false;
  roomSelect.innerHTML = `<option value="">Selecciona una sala</option>`;

  officeRooms[office].forEach((room) => {
    const option = document.createElement("option");
    option.value = room;
    option.textContent = room;
    roomSelect.appendChild(option);
  });

  if (preselectedRoom) {
    roomSelect.value = preselectedRoom;
  }

  renderMap();
}

function getDeskCardClasses(available: boolean, isSelected: boolean): string {
  const base =
    "desk group relative flex min-h-[92px] cursor-pointer items-center justify-center rounded-3xl border-2 text-sm font-semibold transition duration-200";

  if (!available) {
    return `${base} cursor-not-allowed border-rose-200 bg-rose-50 text-rose-700`;
  }

  if (isSelected) {
    return `${base} border-blue-400 bg-blue-50 text-blue-700 shadow-md shadow-blue-100`;
  }

  return `${base} border-emerald-200 bg-emerald-50 text-emerald-700 hover:scale-[1.02] hover:border-emerald-300`;
}

function renderMap(): void {
  if (
    !officeSelect ||
    !roomSelect ||
    !selectedDeskBadge ||
    !selectedDeskText ||
    !emptyState ||
    !mapWrapper ||
    !noDeskNeededState ||
    !mapSubtitle ||
    !desksGrid ||
    !remoteCheckbox ||
    !eventCheckbox
  ) {
    return;
  }

  const office = officeSelect.value as Office | "";
  const room = roomSelect.value;

  selectedDesk = null;
  selectedDeskBadge.classList.add("hidden");
  selectedDeskText.textContent = "-";

  const noDeskNeeded = remoteCheckbox.checked || eventCheckbox.checked;

  if (noDeskNeeded) {
    emptyState.classList.add("hidden");
    mapWrapper.classList.add("hidden");
    noDeskNeededState.classList.remove("hidden");
    mapSubtitle.textContent = "No es necesario seleccionar una mesa.";
    validateReserveButton();
    return;
  }

  noDeskNeededState.classList.add("hidden");

  if (!office || !room) {
    emptyState.classList.remove("hidden");
    mapWrapper.classList.add("hidden");
    mapSubtitle.textContent = "Selecciona una oficina y una sala para visualizar el plano.";
    validateReserveButton();
    return;
  }

  emptyState.classList.add("hidden");
  mapWrapper.classList.remove("hidden");
  mapSubtitle.textContent = `${office} · ${room}`;

  desksGrid.innerHTML = "";

  const desks = officeDeskData[office] || [];

  desks.forEach((desk) => {
    const isSelected = desk.id === selectedDesk;
    const deskButton = document.createElement("button");
    deskButton.type = "button";
    deskButton.dataset.deskId = desk.id;
    deskButton.dataset.available = desk.available ? "true" : "false";
    deskButton.className = getDeskCardClasses(desk.available, isSelected);

    deskButton.innerHTML = `
      <div class="flex flex-col items-center justify-center gap-2">
        <span class="text-base">${desk.id}</span>
        <span class="rounded-full px-2 py-1 text-[11px] font-medium ${
          desk.available
            ? "bg-emerald-100 text-emerald-700"
            : "bg-rose-100 text-rose-700"
        }">
          ${desk.available ? "Disponible" : "Ocupada"}
        </span>
      </div>
    `;

    deskButton.addEventListener("click", () => {
      if (!desk.available || !desksGrid || !selectedDeskText || !selectedDeskBadge) return;

      selectedDesk = desk.id;

      Array.from(desksGrid.querySelectorAll<HTMLElement>(".desk")).forEach((el) => {
        const isAvailable = el.dataset.available === "true";
        const selected = el.dataset.deskId === selectedDesk;
        el.className = getDeskCardClasses(isAvailable, selected);
      });

      selectedDeskText.textContent = selectedDesk;
      selectedDeskBadge.classList.remove("hidden");
      validateReserveButton();
    });

    desksGrid.appendChild(deskButton);
  });

  validateReserveButton();
}

function selectStatus(status: WorkStatus): void {
  if (!worksSection || !notWorksSection) return;

  selectedStatus = status;
  highlightStatusCard(status);

  worksSection.classList.toggle("hidden", status !== "works");
  notWorksSection.classList.toggle("hidden", status !== "not-works");

  validateReserveButton();
}

function validateReserveButton(): void {
  if (!reserveBtn || !officeSelect || !roomSelect || !startTimeInput || !endTimeInput || !remoteCheckbox || !eventCheckbox) {
    return;
  }

  if (selectedStatus !== "works" || !selectedDate) {
    reserveBtn.disabled = true;
    return;
  }

  const hasBasicFields =
    Boolean(officeSelect.value) &&
    Boolean(roomSelect.value) &&
    Boolean(startTimeInput.value) &&
    Boolean(endTimeInput.value);

  const noDeskNeeded = remoteCheckbox.checked || eventCheckbox.checked;

  if (!hasBasicFields) {
    reserveBtn.disabled = true;
    return;
  }

  if (noDeskNeeded) {
    reserveBtn.disabled = false;
    return;
  }

  reserveBtn.disabled = !selectedDesk;
}

function loadEntryIntoModal(entry: CalendarEntry): void {
  if (
    !officeSelect ||
    !startTimeInput ||
    !endTimeInput ||
    !remoteCheckbox ||
    !eventCheckbox ||
    !selectedDeskText ||
    !selectedDeskBadge ||
    !desksGrid
  ) {
    return;
  }

  if (entry.type === "works") {
    selectStatus("works");

    officeSelect.value = entry.office;
    populateRooms(entry.room);

    startTimeInput.value = entry.startTime;
    endTimeInput.value = entry.endTime;

    remoteCheckbox.checked = entry.mode === "remote";
    eventCheckbox.checked = entry.mode === "event";

    renderMap();

    if (entry.mode === "office" && entry.deskId) {
      selectedDesk = entry.deskId;
      selectedDeskText.textContent = entry.deskId;
      selectedDeskBadge.classList.remove("hidden");

      Array.from(desksGrid.querySelectorAll<HTMLElement>(".desk")).forEach((el) => {
        const isAvailable = el.dataset.available === "true";
        const isSelected = el.dataset.deskId === entry.deskId;
        el.className = getDeskCardClasses(isAvailable, isSelected);
      });
    }
  } else {
    selectStatus("not-works");
  }

  validateReserveButton();
}

function openCreateMode(date: string): void {
  if (!selectedDateText || !selectedDateBadge) return;

  selectedDate = date;
  modalMode = "create";
  selectedDateText.textContent = formatHumanDate(date);
  selectedDateBadge.classList.remove("hidden");
  resetModalState();
  updateModalHeader();
  openDayModal();
}

function openEditMode(date: string, entry: CalendarEntry): void {
  if (!selectedDateText || !selectedDateBadge || !reserveBtn || !saveAbsenceBtn) return;

  selectedDate = date;
  modalMode = "edit";
  selectedDateText.textContent = formatHumanDate(date);
  selectedDateBadge.classList.remove("hidden");
  resetModalState();
  modalMode = "edit";
  updateModalHeader();
  loadEntryIntoModal(entry);
  reserveBtn.textContent = "Guardar cambios";
  saveAbsenceBtn.textContent = "Guardar cambios";
  openDayModal();
}

function renderCalendar(): void {
  if (!calendarGrid || !calendarMonthLabel) return;

  calendarGrid.innerHTML = "";

  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();

  calendarMonthLabel.textContent = `${monthNames[month]} ${year}`;

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  let startWeekDay = firstDay.getDay();
  startWeekDay = startWeekDay === 0 ? 6 : startWeekDay - 1;

  const totalDays = lastDay.getDate();

  for (let i = 0; i < startWeekDay; i++) {
    const empty = document.createElement("div");
    empty.className = "h-20 rounded-2xl";
    calendarGrid.appendChild(empty);
  }

  const today = new Date();
  const todayFormatted = formatDate(
    new Date(today.getFullYear(), today.getMonth(), today.getDate())
  );

  for (let day = 1; day <= totalDays; day++) {
    const date = new Date(year, month, day);
    const dateValue = formatDate(date);
    const isToday = dateValue === todayFormatted;
    const isSelected = selectedDate === dateValue;
    const entry = getEntryByDate(dateValue);
    const badge = getCalendarBadge(entry);

    const button = document.createElement("button");
    button.type = "button";
    button.dataset.date = dateValue;
    button.className = `
      min-h-[96px] rounded-2xl border bg-white p-3 text-left transition
      ${isSelected ? "border-blue-400 bg-blue-50 ring-2 ring-blue-200" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"}
    `;

    button.innerHTML = `
      <div class="flex h-full flex-col justify-between gap-2">
        <div class="flex items-start justify-between gap-2">
          <span class="text-base font-semibold text-slate-900">${day}</span>
          ${isToday ? '<span class="rounded-full bg-slate-900 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">Hoy</span>' : ""}
        </div>

        <div class="space-y-1">
          ${
            badge
              ? `<span class="inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${badge.classes}">${badge.label}</span>`
              : `<span class="inline-flex rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-500">Sin registrar</span>`
          }
          <p class="text-xs text-slate-500">${entry ? "Editar jornada" : "Crear jornada"}</p>
        </div>
      </div>
    `;

    button.addEventListener("click", () => {
      const existingEntry = getEntryByDate(dateValue);

      if (existingEntry) {
        openEditMode(dateValue, existingEntry);
      } else {
        openCreateMode(dateValue);
      }

      renderCalendar();
    });

    calendarGrid.appendChild(button);
  }
}

function saveWorkEntry(): void {
  if (!selectedDate || !officeSelect || !roomSelect || !startTimeInput || !endTimeInput || !remoteCheckbox || !eventCheckbox) {
    openConfirmation(false, "No hay una fecha seleccionada.", "No se pudo completar");
    return;
  }

  if (!officeSelect.value || !roomSelect.value || !startTimeInput.value || !endTimeInput.value) {
    openConfirmation(false, "Faltan campos por completar.", "No se pudo completar");
    return;
  }

  if (startTimeInput.value >= endTimeInput.value) {
    openConfirmation(
      false,
      "La hora de fin debe ser posterior a la hora de inicio.",
      "No se pudo completar"
    );
    return;
  }

  const office = officeSelect.value as Office;
  const noDeskNeeded = remoteCheckbox.checked || eventCheckbox.checked;
  const mode: WorkMode = remoteCheckbox.checked
    ? "remote"
    : eventCheckbox.checked
      ? "event"
      : "office";

  if (!noDeskNeeded && !selectedDesk) {
    openConfirmation(
      false,
      "Debes seleccionar una mesa o marcar teletrabajo/evento.",
      "No se pudo completar"
    );
    return;
  }

  const entry: WorkEntry = {
    type: "works",
    mode,
    office,
    room: roomSelect.value,
    startTime: startTimeInput.value,
    endTime: endTimeInput.value,
    deskId: noDeskNeeded ? null : selectedDesk,
  };

  reservationsByDate[selectedDate] = entry;
  modalMode = "edit";
  updateModalHeader();
  renderCalendar();

  const modeLabel =
    mode === "remote"
      ? "teletrabajo"
      : mode === "event"
        ? "evento"
        : `mesa ${selectedDesk}`;

  openConfirmation(
    true,
    `La jornada del día ${formatHumanDate(selectedDate)} se ha guardado correctamente en ${office}, sala ${roomSelect.value}, desde las ${startTimeInput.value} hasta las ${endTimeInput.value}, con asignación: ${modeLabel}.`,
    "Jornada guardada"
  );
}

function saveAbsenceEntry(): void {
  if (!selectedDate) {
    openConfirmation(false, "No hay una fecha seleccionada.", "No se pudo completar");
    return;
  }

  const entry: AbsenceEntry = {
    type: "not-works",
  };

  reservationsByDate[selectedDate] = entry;
  modalMode = "edit";
  updateModalHeader();
  renderCalendar();

  openConfirmation(
    true,
    `El día ${formatHumanDate(selectedDate)} se ha registrado correctamente como no trabaja.`,
    "No trabaja guardado"
  );
}

function deleteCurrentEntry(): void {
  if (!selectedDate || !reservationsByDate[selectedDate]) {
    return;
  }

  delete reservationsByDate[selectedDate];
  const deletedDate = selectedDate;

  closeDayModal();
  renderCalendar();

  openConfirmation(
    true,
    `El registro del día ${formatHumanDate(deletedDate)} se ha eliminado correctamente.`,
    "Registro eliminado"
  );
}

function attachEventListeners(): void {
  worksCard?.addEventListener("click", () => {
    selectStatus("works");
  });

  notWorksCard?.addEventListener("click", () => {
    selectStatus("not-works");
  });

  officeSelect?.addEventListener("change", () => {
    populateRooms();
    validateReserveButton();
  });

  roomSelect?.addEventListener("change", () => {
    selectedDesk = null;
    renderMap();
    validateReserveButton();
  });

  startTimeInput?.addEventListener("change", validateReserveButton);
  endTimeInput?.addEventListener("change", validateReserveButton);

  remoteCheckbox?.addEventListener("change", () => {
    if (!remoteCheckbox || !eventCheckbox) return;
    if (remoteCheckbox.checked) {
      eventCheckbox.checked = false;
    }
    selectedDesk = null;
    renderMap();
    validateReserveButton();
  });

  eventCheckbox?.addEventListener("change", () => {
    if (!remoteCheckbox || !eventCheckbox) return;
    if (eventCheckbox.checked) {
      remoteCheckbox.checked = false;
    }
    selectedDesk = null;
    renderMap();
    validateReserveButton();
  });

  reserveBtn?.addEventListener("click", saveWorkEntry);
  saveAbsenceBtn?.addEventListener("click", saveAbsenceEntry);
  deleteEntryBtn?.addEventListener("click", deleteCurrentEntry);

  prevMonthBtn?.addEventListener("click", () => {
    currentCalendarDate = new Date(
      currentCalendarDate.getFullYear(),
      currentCalendarDate.getMonth() - 1,
      1
    );
    renderCalendar();
  });

  nextMonthBtn?.addEventListener("click", () => {
    currentCalendarDate = new Date(
      currentCalendarDate.getFullYear(),
      currentCalendarDate.getMonth() + 1,
      1
    );
    renderCalendar();
  });

  closeDayModalBtn?.addEventListener("click", closeDayModal);

  dayModal?.addEventListener("click", (e: MouseEvent) => {
    if (e.target === dayModal) closeDayModal();
  });

  closeConfirmationBtn?.addEventListener("click", closeConfirmation);

  confirmationModal?.addEventListener("click", (e: MouseEvent) => {
    if (e.target === confirmationModal) closeConfirmation();
  });
}

function init(): void {
  if (!ensureRequiredDom()) {
    console.error("No se encontraron todos los elementos necesarios para inicializar reserva-mesa.");
    return;
  }

  attachEventListeners();
  renderCalendar();
}

init();