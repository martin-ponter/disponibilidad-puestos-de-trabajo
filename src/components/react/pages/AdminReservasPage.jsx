import { useMemo, useState } from "react";
import AdminHeader from "../components/admin-reservas/AdminHeader";
import AdminFilters from "../components/admin-reservas/AdminFilters";
import AdminMapView from "../components/admin-reservas/AdminMapView";
import AdminListView from "../components/admin-reservas/AdminListView";
import AdminDrawer from "../components/admin-reservas/AdminDrawer";
import AdminConfirmationModal from "../components/admin-reservas/AdminConfirmationModal";
import {
  initialReservations,
  officeDeskData,
  officeRooms,
} from "../../../data/adminReservations";

function formatHumanDate(dateString) {
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
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
  if (item.status === "office") {
    return `${item.office ?? "-"} · ${item.room ?? "-"}${item.deskId ? ` · ${item.deskId}` : ""}`;
  }

  if (item.status === "remote") return "Teletrabajo";
  if (item.status === "event") return "Evento";
  return "No trabaja";
}

export default function AdminReservasPage() {
  const [reservations, setReservations] = useState(initialReservations);
  const [currentTab, setCurrentTab] = useState("map");
  const [selectedReservationId, setSelectedReservationId] = useState(null);
  const [draft, setDraft] = useState(null);

  const [filters, setFilters] = useState({
    date: "2026-03-30",
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

  const availableRooms = useMemo(() => {
    if (filters.office === "all") return [];
    return officeRooms[filters.office] || [];
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

  const filteredRoomReservations = useMemo(() => {
    if (filters.office === "all" || filters.room === "all") return [];
    return filteredReservations.filter(
      (item) => item.office === filters.office && item.room === filters.room
    );
  }, [filteredReservations, filters.office, filters.room]);

  const selectedReservation = useMemo(() => {
    if (!selectedReservationId) return null;
    return reservations.find((item) => item.id === selectedReservationId) || null;
  }, [reservations, selectedReservationId]);

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

    const desks = officeDeskData[draft.office] || [];
    const occupiedDeskIds = reservations
      .filter(
        (reservation) =>
          reservation.id !== selectedReservationId &&
          reservation.date === draft.date &&
          reservation.status === "office" &&
          reservation.office === draft.office &&
          reservation.room === draft.room &&
          reservation.deskId
      )
      .map((reservation) => reservation.deskId);

    const firstFree = desks.find(
      (desk) => desk.available && !occupiedDeskIds.includes(desk.id)
    );

    if (!firstFree) {
      openConfirmation(
        false,
        "No hay mesas libres",
        "No se ha encontrado ninguna mesa libre en esa sala."
      );
      return;
    }

    setDraft((prev) => (prev ? { ...prev, deskId: firstFree.id } : prev));
  }

  function handleSave() {
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

    const updatedDraft =
      newStatus === "not-working"
        ? {
            ...draft,
            office: null,
            room: null,
            deskId: null,
            startTime: null,
            endTime: null,
          }
        : {
            ...draft,
            deskId: newStatus === "office" ? draft.deskId || null : null,
          };

    setReservations((prev) =>
      prev.map((item) => (item.id === selectedReservationId ? updatedDraft : item))
    );

    setDraft(updatedDraft);

    openConfirmation(
      true,
      "Cambios guardados",
      `La asignación de ${updatedDraft.employeeName} se ha actualizado correctamente.`
    );
  }

  function resetFilters() {
    setFilters({
      date: "2026-03-30",
      office: "all",
      room: "all",
      search: "",
      status: "all",
    });
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
                  reservations={filteredRoomReservations}
                  selectedReservationId={selectedReservationId}
                  onSelectReservation={handleSelectReservation}
                  onAssignFirstFree={handleAssignFirstFree}
                  canAssignFirstFree={Boolean(selectedReservationId)}
                  formatHumanDate={formatHumanDate}
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