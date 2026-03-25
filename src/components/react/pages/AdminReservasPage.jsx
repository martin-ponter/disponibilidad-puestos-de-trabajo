import { useEffect, useMemo, useState } from "react";
import AdminHeader from "../components/admin-reservas/AdminHeader";
import AdminFilters from "../components/admin-reservas/AdminFilters";
import AdminMapView from "../components/admin-reservas/AdminMapView";
import AdminListView from "../components/admin-reservas/AdminListView";
import AdminDrawer from "../components/admin-reservas/AdminDrawer";
import AdminConfirmationModal from "../components/admin-reservas/AdminConfirmationModal";
import { officeDeskData, officeRooms } from "../data/adminReservations";
import { officeMaps } from "../../../data/maps/office-maps";

const ENTITY_TYPE_ID = 1058;

const FIELD_EMPLOYEE = "ufCrm22_1774265772";
const FIELD_CENTER = "ufCrm22_1774265887";
const FIELD_ROOM = "ufCrm22_1774266047";
const FIELD_RESOURCE = "ufCrm22_1774266138";
const FIELD_RESOURCE_TYPE = "ufCrm22_1774266164";
const FIELD_BOOKING_MODE = "ufCrm22_1774266190";
const FIELD_DATE = "ufCrm22_1774266223";
const FIELD_START = "ufCrm22_1774266245";
const FIELD_END = "ufCrm22_1774266267";
const FIELD_STATUS = "ufCrm22_1774266293";
const FIELD_NOTES = "ufCrm22_1774266335";
const FIELD_FULL_DAY = "ufCrm22_1774342876";

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatHumanDate(dateString) {
  if (!dateString) return "-";
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
}

function normalizeBitrixDate(value) {
  if (!value) return "";

  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) return value.slice(0, 10);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return formatDate(date);
}

function normalizeTimeValue(value) {
  if (!value) return "";
  if (/^\d{2}:\d{2}$/.test(value)) return value;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function normalizeDeskId(value) {
  return String(value ?? "").trim().toUpperCase();
}

function toMinutes(value) {
  if (!value) return 0;
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function rangesOverlap(startA, endA, startB, endB) {
  return toMinutes(startA) < toMinutes(endB) && toMinutes(endA) > toMinutes(startB);
}

function toBitrixDateTime(dateString, timeString) {
  const [year, month, day] = dateString.split("-").map(Number);
  const [hours, minutes] = timeString.split(":").map(Number);
  const date = new Date(year, month - 1, day, hours, minutes, 0);

  const pad = (n) => String(n).padStart(2, "0");
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absOffset = Math.abs(offsetMinutes);
  const offsetHours = pad(Math.floor(absOffset / 60));
  const offsetMins = pad(absOffset % 60);

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}:00${sign}${offsetHours}:${offsetMins}`;
}

function createEnumMaps(fields) {
  const enumFieldNames = [
    FIELD_CENTER,
    FIELD_ROOM,
    FIELD_RESOURCE_TYPE,
    FIELD_BOOKING_MODE,
    FIELD_STATUS,
  ];

  const result = {};

  for (const fieldName of enumFieldNames) {
    const fieldDef = fields?.[fieldName];
    const items = Array.isArray(fieldDef?.items) ? fieldDef.items : [];

    const byId = new Map();
    const byLabel = new Map();

    items.forEach((item) => {
      const id = String(item.ID ?? item.id ?? "");
      const label = String(item.VALUE ?? item.value ?? "");

      if (id) byId.set(id, label);
      if (label) byLabel.set(label.toLowerCase(), item.ID ?? item.id);
    });

    result[fieldName] = { byId, byLabel };
  }

  return result;
}

function resolveEnumLabel(enumMaps, fieldName, value) {
  if (value === undefined || value === null) return value;
  const map = enumMaps[fieldName];
  if (!map) return value;
  return map.byId.get(String(value)) ?? value;
}

function resolveEnumId(enumMaps, fieldName, value) {
  if (value === undefined || value === null) return value;
  const map = enumMaps[fieldName];
  if (!map) return value;
  return map.byLabel.get(String(value).toLowerCase()) ?? value;
}

function callBitrix(method, params = {}) {
  return new Promise((resolve, reject) => {
    if (!window.BX24) {
      reject(new Error("BX24 no está disponible"));
      return;
    }

    window.BX24.callMethod(method, params, (result) => {
      if (result.error()) {
        reject(result.error());
        return;
      }

      resolve(result);
    });
  });
}

function getAllUsers() {
  return new Promise((resolve, reject) => {
    let allUsers = [];

    window.BX24.callMethod(
      "user.get",
      {
        FILTER: {
          ACTIVE: true,
        },
      },
      function handleResult(result) {
        if (result.error()) {
          reject(result.error());
          return;
        }

        const pageData = result.data() || [];
        allUsers = allUsers.concat(pageData);

        if (result.more()) {
          result.next();
          return;
        }

        resolve(allUsers);
      }
    );
  });
}

function getAllItemsForDate(dateValue) {
  return new Promise((resolve, reject) => {
    let allItems = [];

    window.BX24.callMethod(
      "crm.item.list",
      {
        entityTypeId: ENTITY_TYPE_ID,
        select: [
          "id",
          "title",
          FIELD_EMPLOYEE,
          FIELD_CENTER,
          FIELD_ROOM,
          FIELD_RESOURCE,
          FIELD_RESOURCE_TYPE,
          FIELD_BOOKING_MODE,
          FIELD_DATE,
          FIELD_START,
          FIELD_END,
          FIELD_STATUS,
          FIELD_NOTES,
          FIELD_FULL_DAY,
        ],
        filter: {
          [FIELD_DATE]: dateValue,
        },
      },
      function handleResult(result) {
        if (result.error()) {
          reject(result.error());
          return;
        }

        const pageData = result.data()?.items || [];
        allItems = allItems.concat(pageData);

        if (result.more()) {
          result.next();
          return;
        }

        resolve(allItems);
      }
    );
  });
}

function getUserDisplayData(user) {
  const fullName =
    [user?.NAME, user?.LAST_NAME].filter(Boolean).join(" ") || "Sin nombre";

  const email = user?.EMAIL || "";
  const phone =
    user?.WORK_PHONE || user?.PERSONAL_MOBILE || user?.PERSONAL_PHONE || "";
  const avatar = user?.PERSONAL_PHOTO || user?.PERSONAL_PHOTO_PATH || "";

  return {
    fullName,
    email,
    phone,
    avatar,
  };
}

function getReservationStatus(raw) {
  const status = normalizeText(raw[FIELD_STATUS]);
  const resourceType = normalizeText(raw[FIELD_RESOURCE_TYPE]);
  const resource = normalizeText(raw[FIELD_RESOURCE]);
  const room = normalizeText(raw[FIELD_ROOM]);
  const notes = normalizeText(raw[FIELD_NOTES]);

  if (status === "cancelada" || notes.includes("no trabaja")) {
    return "not-working";
  }

  if (status === "bloqueada") {
    return "not-working";
  }

  if (
    resourceType === "sala" ||
    resource.includes("evento") ||
    room.includes("evento") ||
    notes.includes("evento")
  ) {
    return "event";
  }

  if (
    resource.includes("teletrabajo") ||
    room.includes("teletrabajo") ||
    notes.includes("teletrabajo") ||
    notes.includes("remoto")
  ) {
    return "remote";
  }

  return "office";
}

function getStatusMeta(status) {
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

function getLocationText(item) {
  if (!item) return "-";

  if (item.status === "office") {
    return `${item.office ?? "-"} · ${item.room ?? "-"}${item.deskId ? ` · ${item.deskId}` : ""}`;
  }

  if (item.status === "remote") return "Teletrabajo";
  if (item.status === "event") return "Evento";
  return "No trabaja";
}

function getOfficeRoomsFromMaps(office) {
  if (!office || office === "all") return [];

  const rooms = Object.values(officeMaps)
    .filter((map) => map.office === office)
    .map((map) => map.room);

  if (rooms.length) return rooms;

  return officeRooms[office] || [];
}

function getDeskDataForOfficeRoom(office, room) {
  if (!office || !room) return [];

  const mapKey = `${office}::${room}`;
  const customMap = officeMaps[mapKey];

  if (customMap?.desks?.length) {
    return customMap.desks.map((desk) => ({
      id: desk.id,
      available: true,
    }));
  }

  return officeDeskData[office] || [];
}

function buildReservation(item, user, enumMaps) {
  const { fullName, email, phone, avatar } = getUserDisplayData(user);

  const normalizedCenter = resolveEnumLabel(enumMaps, FIELD_CENTER, item[FIELD_CENTER]);
  const normalizedRoom = resolveEnumLabel(enumMaps, FIELD_ROOM, item[FIELD_ROOM]);
  const normalizedResourceType = resolveEnumLabel(
    enumMaps,
    FIELD_RESOURCE_TYPE,
    item[FIELD_RESOURCE_TYPE]
  );
  const normalizedBookingMode = resolveEnumLabel(
    enumMaps,
    FIELD_BOOKING_MODE,
    item[FIELD_BOOKING_MODE]
  );
  const normalizedStatus = resolveEnumLabel(enumMaps, FIELD_STATUS, item[FIELD_STATUS]);

  const raw = {
    ...item,
    [FIELD_CENTER]: normalizedCenter,
    [FIELD_ROOM]: normalizedRoom,
    [FIELD_RESOURCE_TYPE]: normalizedResourceType,
    [FIELD_BOOKING_MODE]: normalizedBookingMode,
    [FIELD_STATUS]: normalizedStatus,
  };

  const status = getReservationStatus(raw);

  return {
    id: Number(item.id),
    raw,
    employeeId: String(item[FIELD_EMPLOYEE] ?? ""),
    employeeName: fullName,
    employeeEmail: email,
    employeePhone: phone,
    employeeAvatar: avatar,
    date: normalizeBitrixDate(item[FIELD_DATE]),
    office: status === "remote" ? "Teletrabajo" : normalizedCenter || null,
    room: status === "not-working" ? null : normalizedRoom || null,
    deskId:
      status === "office"
        ? normalizeDeskId(String(item[FIELD_RESOURCE] ?? "").trim() || null)
        : null,
    startTime: status === "not-working" ? null : normalizeTimeValue(item[FIELD_START]),
    endTime: status === "not-working" ? null : normalizeTimeValue(item[FIELD_END]),
    status,
    resourceType: normalizedResourceType,
    bookingMode: normalizedBookingMode,
    notes: item[FIELD_NOTES] || "",
    title: item.title || "",
  };
}

export default function AdminReservasPage() {
  const [reservations, setReservations] = useState([]);
  const [currentTab, setCurrentTab] = useState("map");
  const [selectedReservationId, setSelectedReservationId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [usersById, setUsersById] = useState({});
  const [enumMaps, setEnumMaps] = useState({});
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    date: formatDate(new Date()),
    office: "all",
    room: "all",
    search: "",
    status: "all",
  });

  const [confirmation, setConfirmation] = useState({
    isOpen: false,
    success: true,
    title: "",
    message: "",
  });

  useEffect(() => {
    if (!window.BX24) {
      setError("BX24 no está disponible en esta ventana.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    window.BX24.init(async () => {
      try {
        const [users, fieldsResponse] = await Promise.all([
          getAllUsers(),
          callBitrix("crm.item.fields", { entityTypeId: ENTITY_TYPE_ID }),
        ]);

        if (cancelled) return;

        const userMap = {};
        (users || []).forEach((user) => {
          userMap[String(user.ID)] = user;
        });

        setUsersById(userMap);
        setEnumMaps(createEnumMaps(fieldsResponse.data()?.fields || {}));
      } catch (err) {
        console.error(err);
        if (cancelled) return;
        setError("No se pudieron cargar los metadatos del panel de administración.");
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  async function reloadReservationsForDate(
    dateValue,
    maps = enumMaps,
    userMap = usersById,
    keepPageMounted = true
  ) {
    if (keepPageMounted) {
      setDataLoading(true);
    }

    try {
      const items = await getAllItemsForDate(dateValue);

      const normalized = (items || []).map((item) => {
        const user = userMap[String(item[FIELD_EMPLOYEE] ?? "")] || null;
        return buildReservation(item, user, maps);
      });

      setReservations(normalized);
      return normalized;
    } finally {
      if (keepPageMounted) {
        setDataLoading(false);
      }
    }
  }

  useEffect(() => {
    if (!window.BX24) return;
    if (!Object.keys(enumMaps).length) return;

    let cancelled = false;

    async function loadReservations() {
      try {
        if (loading) {
          setError("");
        }

        const items = await getAllItemsForDate(filters.date);

        if (cancelled) return;

        const normalized = (items || []).map((item) => {
          const user = usersById[String(item[FIELD_EMPLOYEE] ?? "")] || null;
          return buildReservation(item, user, enumMaps);
        });

        setReservations(normalized);
        setLoading(false);
        setDataLoading(false);
      } catch (err) {
        console.error(err);
        if (cancelled) return;
        setError(
          err?.ex ||
          err?.description ||
          err?.message ||
          "No se pudieron cargar las asignaciones del día."
        );
        setLoading(false);
        setDataLoading(false);
      }
    }

    if (!loading) {
      setDataLoading(true);
    }

    loadReservations();

    return () => {
      cancelled = true;
    };
  }, [filters.date, enumMaps, usersById]);

  const availableRooms = useMemo(() => {
    return getOfficeRoomsFromMaps(filters.office);
  }, [filters.office]);

  const filteredReservations = useMemo(() => {
    return reservations.filter((item) => {
      const matchesDate = !filters.date || item.date === filters.date;
      const matchesOffice = filters.office === "all" || item.office === filters.office;
      const matchesRoom = filters.room === "all" || item.room === filters.room;
      const matchesStatus = filters.status === "all" || item.status === filters.status;

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

      const matchesSearch =
        !filters.search.trim() ||
        searchTarget.includes(filters.search.trim().toLowerCase());

      return matchesDate && matchesOffice && matchesRoom && matchesStatus && matchesSearch;
    });
  }, [reservations, filters]);

  const mapRoomReservations = useMemo(() => {
    if (filters.office === "all" || filters.room === "all") return [];
    return reservations.filter(
      (item) =>
        item.date === filters.date &&
        item.office === filters.office &&
        item.room === filters.room &&
        item.status === "office"
    );
  }, [reservations, filters.date, filters.office, filters.room]);

  const highlightedReservationIds = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    if (!query) return [];

    return filteredReservations
      .filter(
        (item) =>
          item.office === filters.office &&
          item.room === filters.room &&
          item.status === "office"
      )
      .map((item) => item.id);
  }, [filteredReservations, filters.search, filters.office, filters.room]);

  const selectedReservation = useMemo(() => {
    if (!selectedReservationId) return null;
    return reservations.find((item) => item.id === selectedReservationId) || null;
  }, [reservations, selectedReservationId]);

  useEffect(() => {
    if (!selectedReservation) {
      setDraft(null);
      return;
    }

    setDraft({
      ...selectedReservation,
    });
  }, [selectedReservation]);

  function openConfirmation(success, title, message) {
    setConfirmation({
      isOpen: true,
      success,
      title,
      message,
    });
  }

  function closeConfirmation() {
    setConfirmation((prev) => ({ ...prev, isOpen: false }));
  }

  function handleSelectReservation(id) {
    const item = reservations.find((r) => r.id === id);
    if (!item) return;

    setSelectedReservationId(id);
    setDraft({ ...item });
  }

  function handleDraftChange(patch) {
    setDraft((prev) => {
      if (!prev) return prev;
      return { ...prev, ...patch };
    });
  }

  function handleClearDesk() {
    setDraft((prev) => (prev ? { ...prev, deskId: null } : prev));
  }

  function handleAssignFirstFree() {
    if (!draft || !selectedReservationId || !draft.office || !draft.room) return;

    const desks = getDeskDataForOfficeRoom(draft.office, draft.room);

    const occupiedDeskIds = reservations
      .filter(
        (reservation) =>
          reservation.id !== selectedReservationId &&
          reservation.date === draft.date &&
          reservation.status === "office" &&
          reservation.office === draft.office &&
          reservation.room === draft.room &&
          reservation.deskId &&
          reservation.startTime &&
          reservation.endTime &&
          draft.startTime &&
          draft.endTime &&
          rangesOverlap(
            draft.startTime,
            draft.endTime,
            reservation.startTime,
            reservation.endTime
          )
      )
      .map((reservation) => normalizeDeskId(reservation.deskId));

    const firstFree = desks.find(
      (desk) =>
        desk.available !== false &&
        !occupiedDeskIds.includes(normalizeDeskId(desk.id))
    );

    if (!firstFree) {
      openConfirmation(
        false,
        "No hay mesas libres",
        "No se ha encontrado ninguna mesa libre en esa sala."
      );
      return;
    }

    setDraft((prev) =>
      prev ? { ...prev, deskId: normalizeDeskId(firstFree.id) } : prev
    );
  }

  async function handleSave() {
    if (!draft || !selectedReservationId) return;

    const newStatus = draft.status;

    if (
      (newStatus === "office" || newStatus === "remote" || newStatus === "event") &&
      (!draft.startTime || !draft.endTime)
    ) {
      openConfirmation(false, "Faltan campos", "Debes indicar hora de inicio y fin.");
      return;
    }

    if (draft.startTime && draft.endTime && draft.startTime >= draft.endTime) {
      openConfirmation(
        false,
        "Horario inválido",
        "La hora de fin debe ser posterior a la de inicio."
      );
      return;
    }

    if (newStatus === "office" && (!draft.office || !draft.room || !draft.deskId)) {
      openConfirmation(
        false,
        "Faltan campos",
        "Para trabajo en oficina debes indicar oficina, sala y mesa."
      );
      return;
    }

    if ((newStatus === "remote" || newStatus === "event") && (!draft.office || !draft.room)) {
      openConfirmation(false, "Faltan campos", "Debes indicar oficina y sala.");
      return;
    }

    if (newStatus === "office") {
      const conflictingReservation = reservations.find((reservation) => {
        if (reservation.id === selectedReservationId) return false;
        if (reservation.status !== "office") return false;
        if (reservation.date !== draft.date) return false;
        if (reservation.office !== draft.office) return false;
        if (reservation.room !== draft.room) return false;
        if (normalizeDeskId(reservation.deskId) !== normalizeDeskId(draft.deskId)) return false;
        if (!reservation.startTime || !reservation.endTime) return false;
        if (!draft.startTime || !draft.endTime) return false;

        return rangesOverlap(
          draft.startTime,
          draft.endTime,
          reservation.startTime,
          reservation.endTime
        );
      });

      if (conflictingReservation) {
        openConfirmation(
          false,
          "Mesa ocupada",
          `La mesa ${draft.deskId} ya está ocupada por ${conflictingReservation.employeeName} en ese tramo horario.`
        );
        return;
      }
    }

    try {
      setIsSaving(true);

      const centerValue =
        newStatus === "not-working"
          ? null
          : resolveEnumId(enumMaps, FIELD_CENTER, draft.office);

      const roomValue =
        newStatus === "not-working"
          ? ""
          : resolveEnumId(enumMaps, FIELD_ROOM, draft.room) ?? draft.room;

      const resourceTypeValue = resolveEnumId(
        enumMaps,
        FIELD_RESOURCE_TYPE,
        newStatus === "event" ? "sala" : "puesto"
      );

      const bookingModeValue = resolveEnumId(
        enumMaps,
        FIELD_BOOKING_MODE,
        newStatus === "event" ? "completa" : "individual"
      );

      const statusValue = resolveEnumId(
        enumMaps,
        FIELD_STATUS,
        newStatus === "not-working" ? "cancelada" : "activa"
      );

      const resourceValue =
        newStatus === "not-working"
          ? "Ausencia"
          : newStatus === "remote"
            ? "Teletrabajo"
            : newStatus === "event"
              ? "Evento"
              : normalizeDeskId(draft.deskId);

      const notesValue =
        newStatus === "not-working"
          ? "no trabaja"
          : newStatus === "remote"
            ? "teletrabajo"
            : newStatus === "event"
              ? "evento"
              : "";

      const fields = {
        title:
          draft.title ||
          selectedReservation.title ||
          `${draft.employeeName} · ${formatHumanDate(draft.date)}`,
        [FIELD_EMPLOYEE]: Number(draft.employeeId),
        [FIELD_CENTER]: centerValue,
        [FIELD_ROOM]: roomValue,
        [FIELD_RESOURCE]: resourceValue,
        [FIELD_RESOURCE_TYPE]: resourceTypeValue,
        [FIELD_BOOKING_MODE]: bookingModeValue,
        [FIELD_DATE]: draft.date,
        [FIELD_START]:
          newStatus === "not-working" || !draft.startTime
            ? null
            : toBitrixDateTime(draft.date, draft.startTime),
        [FIELD_END]:
          newStatus === "not-working" || !draft.endTime
            ? null
            : toBitrixDateTime(draft.date, draft.endTime),
        [FIELD_STATUS]: statusValue,
        [FIELD_NOTES]: notesValue,
        [FIELD_FULL_DAY]: newStatus === "not-working" ? "Y" : "N",
      };

      await callBitrix("crm.item.update", {
        entityTypeId: ENTITY_TYPE_ID,
        id: Number(selectedReservationId),
        fields,
      });

      const refreshedReservations = await reloadReservationsForDate(
        draft.date,
        enumMaps,
        usersById,
        false
      );

      const refreshedSelected =
        refreshedReservations.find((item) => item.id === Number(selectedReservationId)) || null;

      setSelectedReservationId(refreshedSelected?.id || null);
      setDraft(refreshedSelected ? { ...refreshedSelected } : null);

      openConfirmation(
        true,
        "Cambios guardados",
        `La asignación de ${draft.employeeName} se ha actualizado correctamente en Bitrix.`
      );
    } catch (err) {
      console.error("Error guardando cambios en Bitrix:", err);
      openConfirmation(
        false,
        "No se pudo guardar",
        err?.ex ||
        err?.description ||
        err?.message ||
        "Ha ocurrido un error al guardar la asignación en Bitrix."
      );
    } finally {
      setIsSaving(false);
    }
  }

  function resetFilters() {
    setFilters({
      date: formatDate(new Date()),
      office: "all",
      room: "all",
      search: "",
      status: "all",
    });
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.06),transparent_28%)]"></div>
          <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <AdminHeader />
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/70">
              <div className="mx-auto max-w-md">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-2xl shadow-sm">
                  ⏳
                </div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Cargando panel de administración
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Estamos obteniendo usuarios y asignaciones reales desde Bitrix.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.06),transparent_28%)]"></div>
          <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <AdminHeader />
            <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center shadow-xl shadow-slate-200/70">
              <div className="mx-auto max-w-md">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
                  ❌
                </div>
                <h3 className="text-lg font-semibold text-slate-900">
                  No se pudo cargar el panel
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{error}</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.06),transparent_28%)]"></div>

        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <AdminHeader />

          <AdminFilters
            filters={filters}
            availableRooms={availableRooms}
            currentTab={currentTab}
            visibleCount={filteredReservations.length}
            onChange={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
            onReset={resetFilters}
            onTabChange={setCurrentTab}
          />

          <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-6">
              {currentTab === "map" && (
                <AdminMapView
                  office={filters.office}
                  room={filters.room}
                  date={filters.date}
                  reservations={mapRoomReservations}
                  highlightedReservationIds={highlightedReservationIds}
                  selectedReservationId={selectedReservationId}
                  onSelectReservation={handleSelectReservation}
                  onAssignFirstFree={handleAssignFirstFree}
                  canAssignFirstFree={Boolean(selectedReservationId)}
                  formatHumanDate={formatHumanDate}
                  isLoading={dataLoading}
                />
              )}

              {currentTab === "list" && (
                <AdminListView
                  reservations={filteredReservations}
                  selectedReservationId={selectedReservationId}
                  onEdit={handleSelectReservation}
                  formatHumanDate={formatHumanDate}
                  getStatusMeta={getStatusMeta}
                />
              )}
            </div>

            <AdminDrawer
              selectedReservation={selectedReservation}
              draft={draft}
              onDraftChange={handleDraftChange}
              onClearDesk={handleClearDesk}
              onSave={handleSave}
              isSaving={isSaving}
              formatHumanDate={formatHumanDate}
              getLocationText={getLocationText}
              getStatusMeta={getStatusMeta}
            />
          </section>
        </div>
      </section>

      <AdminConfirmationModal
        isOpen={confirmation.isOpen}
        success={confirmation.success}
        title={confirmation.title}
        message={confirmation.message}
        onClose={closeConfirmation}
      />
    </main>
  );
}