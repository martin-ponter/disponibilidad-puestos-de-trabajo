type Office = "Toledo" | "Madrid" | "Alcobendas" | "Consuegra";
type ReservationStatus = "office" | "remote" | "event" | "not-working";

interface Desk {
  id: string;
  available: boolean;
}

interface ReservationRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeAvatar: string;
  employeeEmail: string;
  employeePhone: string;
  date: string;
  status: ReservationStatus;
  office: Office | null;
  room: string | null;
  deskId: string | null;
  startTime: string | null;
  endTime: string | null;
}

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
    { id: "T3", available: true },
    { id: "T4", available: true },
    { id: "T5", available: false },
    { id: "T6", available: true },
    { id: "T7", available: true },
    { id: "T8", available: true },
  ],
  Madrid: [
    { id: "M1", available: true },
    { id: "M2", available: true },
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
    { id: "C1", available: true },
    { id: "C2", available: true },
    { id: "C3", available: true },
    { id: "C4", available: true },
    { id: "C5", available: false },
    { id: "C6", available: true },
    { id: "C7", available: true },
    { id: "C8", available: false },
  ],
};

const reservations: ReservationRecord[] = [
  {
    id: "r1",
    employeeId: "u1",
    employeeName: "Pepe García",
    employeeAvatar:
      "https://ui-avatars.com/api/?name=Pepe+Garcia&background=e2e8f0&color=0f172a",
    employeeEmail: "pepe@empresa.com",
    employeePhone: "600111222",
    date: "2026-03-30",
    status: "office",
    office: "Toledo",
    room: "Sala Principal",
    deskId: "T2",
    startTime: "09:00",
    endTime: "14:00",
  },
  {
    id: "r2",
    employeeId: "u2",
    employeeName: "Lucía Martín",
    employeeAvatar:
      "https://ui-avatars.com/api/?name=Lucia+Martin&background=dbeafe&color=1d4ed8",
    employeeEmail: "lucia@empresa.com",
    employeePhone: "600222333",
    date: "2026-03-30",
    status: "office",
    office: "Toledo",
    room: "Sala Principal",
    deskId: "T4",
    startTime: "09:00",
    endTime: "18:00",
  },
  {
    id: "r3",
    employeeId: "u3",
    employeeName: "Carlos Pérez",
    employeeAvatar:
      "https://ui-avatars.com/api/?name=Carlos+Perez&background=fce7f3&color=9d174d",
    employeeEmail: "carlos@empresa.com",
    employeePhone: "600333444",
    date: "2026-03-30",
    status: "remote",
    office: "Madrid",
    room: "Sala A",
    deskId: null,
    startTime: "08:00",
    endTime: "15:00",
  },
  {
    id: "r4",
    employeeId: "u4",
    employeeName: "Marta López",
    employeeAvatar:
      "https://ui-avatars.com/api/?name=Marta+Lopez&background=dcfce7&color=166534",
    employeeEmail: "marta@empresa.com",
    employeePhone: "600444555",
    date: "2026-03-30",
    status: "event",
    office: "Madrid",
    room: "Sala Dirección",
    deskId: null,
    startTime: "10:00",
    endTime: "13:00",
  },
  {
    id: "r5",
    employeeId: "u5",
    employeeName: "Ana Ruiz",
    employeeAvatar:
      "https://ui-avatars.com/api/?name=Ana+Ruiz&background=ede9fe&color=6d28d9",
    employeeEmail: "ana@empresa.com",
    employeePhone: "600555666",
    date: "2026-03-30",
    status: "not-working",
    office: null,
    room: null,
    deskId: null,
    startTime: null,
    endTime: null,
  },
  {
    id: "r6",
    employeeId: "u6",
    employeeName: "Javier Torres",
    employeeAvatar:
      "https://ui-avatars.com/api/?name=Javier+Torres&background=fef3c7&color=92400e",
    employeeEmail: "javier@empresa.com",
    employeePhone: "600666777",
    date: "2026-03-30",
    status: "office",
    office: "Madrid",
    room: "Sala A",
    deskId: "M1",
    startTime: "09:00",
    endTime: "14:00",
  },
];

const adminDate = document.getElementById("admin-date") as HTMLInputElement | null;
const adminOffice = document.getElementById("admin-office") as HTMLSelectElement | null;
const adminRoom = document.getElementById("admin-room") as HTMLSelectElement | null;
const adminSearch = document.getElementById("admin-search") as HTMLInputElement | null;
const adminStatus = document.getElementById("admin-status") as HTMLSelectElement | null;

const tabMap = document.getElementById("tab-map") as HTMLButtonElement | null;
const tabList = document.getElementById("tab-list") as HTMLButtonElement | null;
const resetAdminFilters = document.getElementById("reset-admin-filters") as HTMLButtonElement | null;
const visibleCount = document.getElementById("visible-count") as HTMLSpanElement | null;

const adminMapView = document.getElementById("admin-map-view") as HTMLDivElement | null;
const adminListView = document.getElementById("admin-list-view") as HTMLDivElement | null;

const adminMapSubtitle = document.getElementById("admin-map-subtitle") as HTMLParagraphElement | null;
const adminMapEmptyState = document.getElementById("admin-map-empty-state") as HTMLDivElement | null;
const adminMapWrapper = document.getElementById("admin-map-wrapper") as HTMLDivElement | null;
const adminDesksGrid = document.getElementById("admin-desks-grid") as HTMLDivElement | null;
const assignFirstFreeBtn = document.getElementById("assign-first-free-btn") as HTMLButtonElement | null;

const adminList = document.getElementById("admin-list") as HTMLDivElement | null;
const adminListEmptyState = document.getElementById("admin-list-empty-state") as HTMLDivElement | null;

const drawerEmptyState = document.getElementById("drawer-empty-state") as HTMLDivElement | null;
const drawerContent = document.getElementById("drawer-content") as HTMLDivElement | null;

const drawerAvatar = document.getElementById("drawer-avatar") as HTMLImageElement | null;
const drawerName = document.getElementById("drawer-name") as HTMLHeadingElement | null;
const drawerContact = document.getElementById("drawer-contact") as HTMLParagraphElement | null;
const drawerStatusBadge = document.getElementById("drawer-status-badge") as HTMLDivElement | null;
const drawerCurrentDate = document.getElementById("drawer-current-date") as HTMLSpanElement | null;
const drawerCurrentLocation = document.getElementById("drawer-current-location") as HTMLSpanElement | null;
const drawerCurrentTime = document.getElementById("drawer-current-time") as HTMLSpanElement | null;

const drawerStatus = document.getElementById("drawer-status") as HTMLSelectElement | null;
const drawerOfficeFields = document.getElementById("drawer-office-fields") as HTMLDivElement | null;
const drawerOffice = document.getElementById("drawer-office") as HTMLSelectElement | null;
const drawerRoom = document.getElementById("drawer-room") as HTMLSelectElement | null;
const drawerDesk = document.getElementById("drawer-desk") as HTMLSelectElement | null;
const drawerStartTime = document.getElementById("drawer-start-time") as HTMLInputElement | null;
const drawerEndTime = document.getElementById("drawer-end-time") as HTMLInputElement | null;
const drawerClearDeskBtn = document.getElementById("drawer-clear-desk-btn") as HTMLButtonElement | null;
const drawerSaveBtn = document.getElementById("drawer-save-btn") as HTMLButtonElement | null;

const adminConfirmationModal = document.getElementById("admin-confirmation-modal") as HTMLDivElement | null;
const adminConfirmationIcon = document.getElementById("admin-confirmation-icon") as HTMLDivElement | null;
const adminConfirmationTitle = document.getElementById("admin-confirmation-title") as HTMLHeadingElement | null;
const adminConfirmationMessage = document.getElementById("admin-confirmation-message") as HTMLParagraphElement | null;
const closeAdminConfirmationBtn = document.getElementById("close-admin-confirmation-btn") as HTMLButtonElement | null;

let currentTab: "map" | "list" = "map";
let selectedReservationId: string | null = null;

function formatHumanDate(dateString: string): string {
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
}

function getTodayString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getStatusMeta(status: ReservationStatus) {
  switch (status) {
    case "office":
      return {
        label: "Trabaja en oficina",
        badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
        dot: "bg-emerald-400",
      };
    case "remote":
      return {
        label: "Teletrabajo",
        badge: "border-blue-200 bg-blue-50 text-blue-700",
        dot: "bg-blue-400",
      };
    case "event":
      return {
        label: "Evento",
        badge: "border-violet-200 bg-violet-50 text-violet-700",
        dot: "bg-violet-400",
      };
    case "not-working":
    default:
      return {
        label: "No trabaja",
        badge: "border-amber-200 bg-amber-50 text-amber-700",
        dot: "bg-amber-400",
      };
  }
}

function getReservationById(id: string | null): ReservationRecord | null {
  if (!id) return null;
  return reservations.find((item) => item.id === id) ?? null;
}

function populateAdminRooms(): void {
  if (!adminOffice || !adminRoom) return;

  const officeValue = adminOffice.value as Office | "all";
  adminRoom.innerHTML = "";

  if (officeValue === "all") {
    adminRoom.innerHTML = `<option value="all">Todas</option>`;
    return;
  }

  adminRoom.innerHTML = `<option value="all">Todas</option>`;

  officeRooms[officeValue].forEach((room) => {
    const option = document.createElement("option");
    option.value = room;
    option.textContent = room;
    adminRoom.appendChild(option);
  });
}

function populateDrawerRooms(preselectedRoom?: string | null): void {
  if (!drawerOffice || !drawerRoom) return;

  const officeValue = drawerOffice.value as Office;
  drawerRoom.innerHTML = "";

  officeRooms[officeValue].forEach((room) => {
    const option = document.createElement("option");
    option.value = room;
    option.textContent = room;
    drawerRoom.appendChild(option);
  });

  if (preselectedRoom) {
    drawerRoom.value = preselectedRoom;
  }
}

function populateDrawerDesks(preselectedDesk?: string | null): void {
  if (!drawerOffice || !drawerDesk) return;

  const officeValue = drawerOffice.value as Office;
  drawerDesk.innerHTML = `<option value="">Sin seleccionar</option>`;

  officeDeskData[officeValue].forEach((desk) => {
    const option = document.createElement("option");
    option.value = desk.id;
    option.textContent = `${desk.id}${desk.available ? "" : " · No disponible"}`;
    option.disabled = !desk.available && desk.id !== preselectedDesk;
    drawerDesk.appendChild(option);
  });

  if (preselectedDesk) {
    drawerDesk.value = preselectedDesk;
  }
}

function getFilteredReservations(): ReservationRecord[] {
  if (!adminDate || !adminOffice || !adminRoom || !adminSearch || !adminStatus) return [];

  const dateValue = adminDate.value;
  const officeValue = adminOffice.value;
  const roomValue = adminRoom.value;
  const searchValue = adminSearch.value.trim().toLowerCase();
  const statusValue = adminStatus.value;

  return reservations.filter((item) => {
    const matchesDate = !dateValue || item.date === dateValue;
    const matchesOffice = officeValue === "all" || item.office === officeValue;
    const matchesRoom = roomValue === "all" || item.room === roomValue;
    const matchesStatus = statusValue === "all" || item.status === statusValue;

    const searchTarget = [
      item.employeeName,
      item.employeeEmail,
      item.employeePhone,
      item.office,
      item.room,
      item.deskId,
      item.status,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch = !searchValue || searchTarget.includes(searchValue);

    return matchesDate && matchesOffice && matchesRoom && matchesStatus && matchesSearch;
  });
}

function getFilteredRoomReservations(): ReservationRecord[] {
  if (!adminOffice || !adminRoom) return [];

  const list = getFilteredReservations();
  const officeValue = adminOffice.value;
  const roomValue = adminRoom.value;

  return list.filter((item) => {
    return (
      officeValue !== "all" &&
      roomValue !== "all" &&
      item.office === officeValue &&
      item.room === roomValue
    );
  });
}

function openConfirmation(success: boolean, title: string, message: string): void {
  if (
    !adminConfirmationTitle ||
    !adminConfirmationMessage ||
    !adminConfirmationIcon ||
    !adminConfirmationModal
  ) {
    return;
  }

  adminConfirmationTitle.textContent = title;
  adminConfirmationMessage.textContent = message;
  adminConfirmationIcon.textContent = success ? "✅" : "❌";
  adminConfirmationIcon.className = success
    ? "mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-2xl"
    : "mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-2xl";

  adminConfirmationModal.classList.remove("pointer-events-none", "opacity-0");
}

function closeConfirmation(): void {
  if (!adminConfirmationModal) return;
  adminConfirmationModal.classList.add("pointer-events-none", "opacity-0");
}

function setActiveTab(tab: "map" | "list"): void {
  if (!tabMap || !tabList || !adminMapView || !adminListView) return;

  currentTab = tab;
  const isMap = tab === "map";

  tabMap.className = isMap
    ? "admin-tab inline-flex items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700"
    : "admin-tab inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700";

  tabList.className = !isMap
    ? "admin-tab inline-flex items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700"
    : "admin-tab inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700";

  adminMapView.classList.toggle("hidden", !isMap);
  adminListView.classList.toggle("hidden", isMap);
}

function getDeskCardClasses(
  availability: "free" | "occupied" | "blocked",
  isSelected: boolean
): string {
  const base =
    "desk relative flex min-h-[96px] flex-col items-center justify-center rounded-3xl border-2 p-3 text-center text-sm font-semibold transition duration-200";

  if (availability === "blocked") {
    return `${base} cursor-not-allowed border-rose-200 bg-rose-50 text-rose-700`;
  }

  if (isSelected) {
    return `${base} border-blue-500 bg-blue-50 text-blue-700 shadow-md shadow-blue-100`;
  }

  if (availability === "occupied") {
    return `${base} cursor-pointer border-sky-200 bg-sky-50 text-sky-700 hover:scale-[1.02] hover:border-sky-300`;
  }

  return `${base} cursor-default border-emerald-200 bg-emerald-50 text-emerald-700`;
}

function renderMapView(): void {
  if (
    !adminOffice ||
    !adminRoom ||
    !visibleCount ||
    !adminMapEmptyState ||
    !adminMapWrapper ||
    !adminMapSubtitle ||
    !adminDesksGrid ||
    !assignFirstFreeBtn ||
    !adminDate
  ) {
    return;
  }

  const roomReservations = getFilteredRoomReservations();
  const officeValue = adminOffice.value as Office | "all";
  const roomValue = adminRoom.value;

  visibleCount.textContent = String(getFilteredReservations().length);

  if (officeValue === "all" || roomValue === "all") {
    adminMapEmptyState.classList.remove("hidden");
    adminMapWrapper.classList.add("hidden");
    adminMapSubtitle.textContent = "Selecciona una oficina y una sala para visualizar el plano.";
    assignFirstFreeBtn.disabled = true;
    return;
  }

  adminMapEmptyState.classList.add("hidden");
  adminMapWrapper.classList.remove("hidden");
  adminMapSubtitle.textContent = `${officeValue} · ${roomValue} · ${formatHumanDate(adminDate.value)}`;

  adminDesksGrid.innerHTML = "";

  const desks = officeDeskData[officeValue] || [];

  desks.forEach((desk) => {
    const reservation = roomReservations.find((item) => item.deskId === desk.id);
    const isSelected = reservation?.id === selectedReservationId;

    let availability: "free" | "occupied" | "blocked" = "free";

    if (!desk.available) {
      availability = "blocked";
    } else if (reservation) {
      availability = "occupied";
    }

    const button = document.createElement("button");
    button.type = "button";
    button.className = getDeskCardClasses(availability, Boolean(isSelected));

    if (availability === "free") {
      button.innerHTML = `
        <span class="text-base">${desk.id}</span>
        <span class="mt-2 rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-medium text-emerald-700">
          Libre
        </span>
      `;
    } else if (availability === "blocked") {
      button.innerHTML = `
        <span class="text-base">${desk.id}</span>
        <span class="mt-2 rounded-full bg-rose-100 px-2 py-1 text-[11px] font-medium text-rose-700">
          No disponible
        </span>
      `;
    } else {
      button.innerHTML = `
        <span class="text-base">${desk.id}</span>
        <span class="mt-2 line-clamp-2 text-xs font-medium">${reservation?.employeeName ?? ""}</span>
        <span class="mt-2 rounded-full bg-sky-100 px-2 py-1 text-[11px] font-medium text-sky-700">
          Ocupada
        </span>
      `;

      button.addEventListener("click", () => {
        if (reservation) {
          openDrawer(reservation.id);
          renderMapView();
          renderListView();
        }
      });
    }

    adminDesksGrid.appendChild(button);
  });

  assignFirstFreeBtn.disabled = !selectedReservationId;
}

function renderListView(): void {
  if (!visibleCount || !adminList || !adminListEmptyState) return;

  const data = getFilteredReservations();
  visibleCount.textContent = String(data.length);
  adminList.innerHTML = "";

  if (!data.length) {
    adminListEmptyState.classList.remove("hidden");
    return;
  }

  adminListEmptyState.classList.add("hidden");

  data.forEach((item) => {
    const statusMeta = getStatusMeta(item.status);
    const isSelected = item.id === selectedReservationId;

    const article = document.createElement("article");
    article.className = isSelected
      ? "rounded-3xl border border-blue-300 bg-blue-50 p-4 shadow-sm"
      : "rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300";

    article.innerHTML = `
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex min-w-0 items-start gap-4">
          <img
            src="${item.employeeAvatar}"
            alt="${item.employeeName}"
            class="h-14 w-14 rounded-2xl border border-slate-200 bg-white object-cover"
          />

          <div class="min-w-0">
            <h3 class="truncate text-base font-semibold text-slate-900">${item.employeeName}</h3>
            <p class="mt-1 text-sm text-slate-500">
              ${item.employeeEmail || item.employeePhone || "Sin contacto"}
            </p>

            <div class="mt-3 flex flex-wrap gap-2">
              <span class="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${statusMeta.badge}">
                <span class="h-2.5 w-2.5 rounded-full ${statusMeta.dot}"></span>
                ${statusMeta.label}
              </span>

              <span class="inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                ${formatHumanDate(item.date)}
              </span>
            </div>
          </div>
        </div>

        <div class="grid gap-3 sm:grid-cols-3 lg:min-w-[420px]">
          <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
            <span class="block text-xs font-medium uppercase tracking-wide text-slate-500">Oficina</span>
            <span class="mt-1 block font-medium text-slate-900">${item.office ?? "-"}</span>
          </div>

          <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
            <span class="block text-xs font-medium uppercase tracking-wide text-slate-500">Sala / mesa</span>
            <span class="mt-1 block font-medium text-slate-900">${item.room ?? "-"}${item.deskId ? ` · ${item.deskId}` : ""}</span>
          </div>

          <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
            <span class="block text-xs font-medium uppercase tracking-wide text-slate-500">Horario</span>
            <span class="mt-1 block font-medium text-slate-900">${item.startTime && item.endTime ? `${item.startTime} - ${item.endTime}` : "-"}</span>
          </div>
        </div>
      </div>

      <div class="mt-4 flex justify-end">
        <button
          type="button"
          class="edit-reservation-btn inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          data-id="${item.id}"
        >
          Editar
        </button>
      </div>
    `;

    const editBtn = article.querySelector<HTMLButtonElement>(".edit-reservation-btn");
    editBtn?.addEventListener("click", () => {
      openDrawer(item.id);
      renderMapView();
      renderListView();
    });

    adminList.appendChild(article);
  });
}

function getLocationText(item: ReservationRecord): string {
  if (item.status === "office") {
    return `${item.office ?? "-"} · ${item.room ?? "-"}${item.deskId ? ` · ${item.deskId}` : ""}`;
  }

  if (item.status === "remote") return "Teletrabajo";
  if (item.status === "event") return "Evento";
  return "No trabaja";
}

function openDrawer(reservationId: string): void {
  if (
    !drawerEmptyState ||
    !drawerContent ||
    !drawerAvatar ||
    !drawerName ||
    !drawerContact ||
    !drawerStatusBadge ||
    !drawerCurrentDate ||
    !drawerCurrentLocation ||
    !drawerCurrentTime ||
    !drawerStatus ||
    !drawerStartTime ||
    !drawerEndTime ||
    !drawerOffice
  ) {
    return;
  }

  const item = getReservationById(reservationId);
  if (!item) return;

  selectedReservationId = reservationId;

  drawerEmptyState.classList.add("hidden");
  drawerContent.classList.remove("hidden");

  drawerAvatar.src = item.employeeAvatar;
  drawerAvatar.alt = item.employeeName;
  drawerName.textContent = item.employeeName;
  drawerContact.textContent = item.employeeEmail || item.employeePhone || "Sin contacto";

  const statusMeta = getStatusMeta(item.status);
  drawerStatusBadge.className = `mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${statusMeta.badge}`;
  drawerStatusBadge.innerHTML = `<span class="h-2.5 w-2.5 rounded-full ${statusMeta.dot}"></span>${statusMeta.label}`;

  drawerCurrentDate.textContent = formatHumanDate(item.date);
  drawerCurrentLocation.textContent = getLocationText(item);
  drawerCurrentTime.textContent =
    item.startTime && item.endTime ? `${item.startTime} - ${item.endTime}` : "-";

  drawerStatus.value = item.status;
  drawerStartTime.value = item.startTime ?? "";
  drawerEndTime.value = item.endTime ?? "";

  if (item.office) {
    drawerOffice.value = item.office;
    populateDrawerRooms(item.room);
    populateDrawerDesks(item.deskId);
  } else {
    drawerOffice.value = "Toledo";
    populateDrawerRooms();
    populateDrawerDesks();
    if (drawerDesk) drawerDesk.value = "";
  }

  toggleDrawerFields();
}

function toggleDrawerFields(): void {
  if (!drawerStatus || !drawerOfficeFields || !drawerDesk) return;

  const value = drawerStatus.value as ReservationStatus;
  const needsPhysicalPlace = value === "office";

  drawerOfficeFields.classList.toggle("hidden", value === "not-working");
  drawerDesk.disabled = !needsPhysicalPlace;

  if (value === "not-working") {
    drawerDesk.value = "";
  }

  if (value === "remote" || value === "event") {
    drawerDesk.value = "";
  }
}

function assignFirstFreeDesk(): void {
  if (!drawerOffice || !drawerRoom || !drawerDesk) return;

  const item = getReservationById(selectedReservationId);
  if (!item) return;

  const officeValue = drawerOffice.value as Office;
  const desks = officeDeskData[officeValue];
  const roomValue = drawerRoom.value;

  const occupiedDeskIds = reservations
    .filter(
      (reservation) =>
        reservation.id !== item.id &&
        reservation.date === item.date &&
        reservation.status === "office" &&
        reservation.office === officeValue &&
        reservation.room === roomValue &&
        reservation.deskId
    )
    .map((reservation) => reservation.deskId);

  const firstFree = desks.find(
    (desk) => desk.available && !occupiedDeskIds.includes(desk.id)
  );

  if (!firstFree) {
    openConfirmation(false, "No hay mesas libres", "No se ha encontrado ninguna mesa libre en esa sala.");
    return;
  }

  drawerDesk.value = firstFree.id;
}

function saveDrawerChanges(): void {
  if (!drawerStatus || !drawerStartTime || !drawerEndTime || !drawerOffice || !drawerRoom || !drawerDesk) {
    return;
  }

  const item = getReservationById(selectedReservationId);
  if (!item) return;

  const newStatus = drawerStatus.value as ReservationStatus;

  if (
    (newStatus === "office" || newStatus === "remote" || newStatus === "event") &&
    (!drawerStartTime.value || !drawerEndTime.value)
  ) {
    openConfirmation(false, "Faltan campos", "Debes indicar hora de inicio y fin.");
    return;
  }

  if (
    drawerStartTime.value &&
    drawerEndTime.value &&
    drawerStartTime.value >= drawerEndTime.value
  ) {
    openConfirmation(
      false,
      "Horario inválido",
      "La hora de fin debe ser posterior a la de inicio."
    );
    return;
  }

  item.status = newStatus;

  if (newStatus === "not-working") {
    item.office = null;
    item.room = null;
    item.deskId = null;
    item.startTime = null;
    item.endTime = null;
  } else {
    item.office = drawerOffice.value as Office;
    item.room = drawerRoom.value;
    item.startTime = drawerStartTime.value || null;
    item.endTime = drawerEndTime.value || null;

    if (newStatus === "office") {
      item.deskId = drawerDesk.value || null;
    } else {
      item.deskId = null;
    }
  }

  renderMapView();
  renderListView();
  openDrawer(item.id);

  openConfirmation(
    true,
    "Cambios guardados",
    `La asignación de ${item.employeeName} se ha actualizado correctamente.`
  );
}

function clearDrawerDesk(): void {
  if (!drawerDesk) return;
  drawerDesk.value = "";
}

function renderAll(): void {
  renderMapView();
  renderListView();
}

function resetFilters(): void {
  if (!adminDate || !adminOffice || !adminRoom || !adminSearch || !adminStatus) return;

  adminDate.value = getTodayString();
  adminOffice.value = "all";
  populateAdminRooms();
  adminRoom.value = "all";
  adminSearch.value = "";
  adminStatus.value = "all";
  renderAll();
}

function attachEvents(): void {
  tabMap?.addEventListener("click", () => setActiveTab("map"));
  tabList?.addEventListener("click", () => setActiveTab("list"));

  adminDate?.addEventListener("change", renderAll);
  adminOffice?.addEventListener("change", () => {
    populateAdminRooms();
    if (adminRoom) adminRoom.value = "all";
    renderAll();
  });
  adminRoom?.addEventListener("change", renderAll);
  adminSearch?.addEventListener("input", renderAll);
  adminStatus?.addEventListener("change", renderAll);
  resetAdminFilters?.addEventListener("click", resetFilters);

  drawerStatus?.addEventListener("change", toggleDrawerFields);
  drawerOffice?.addEventListener("change", () => {
    populateDrawerRooms();
    populateDrawerDesks();
  });
  drawerRoom?.addEventListener("change", () => {
    populateDrawerDesks();
  });

  drawerClearDeskBtn?.addEventListener("click", clearDrawerDesk);
  drawerSaveBtn?.addEventListener("click", saveDrawerChanges);
  assignFirstFreeBtn?.addEventListener("click", assignFirstFreeDesk);

  closeAdminConfirmationBtn?.addEventListener("click", closeConfirmation);

  adminConfirmationModal?.addEventListener("click", (e: MouseEvent) => {
    if (e.target === adminConfirmationModal) {
      closeConfirmation();
    }
  });
}

function init(): void {
  if (adminDate) {
    adminDate.value = "2026-03-30";
  }

  populateAdminRooms();
  setActiveTab("map");
  renderAll();
  attachEvents();
}

init();