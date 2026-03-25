import { officeDeskData, officeRooms } from "../../data/adminReservations";
import { officeMaps } from "../../../../data/maps/office-maps";

function normalizeDeskId(value) {
  return String(value ?? "").trim().toUpperCase();
}

function getOfficeRoomsFromMaps(office) {
  if (!office) return [];

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

export default function AdminDrawer({
  selectedReservation,
  draft,
  onDraftChange,
  onClearDesk,
  onSave,
  isSaving,
  formatHumanDate,
  getLocationText,
  getStatusMeta,
}) {
  if (!selectedReservation || !draft) {
    return (
      <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70 sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Edición rápida</h2>
            <p className="mt-1 text-sm text-slate-500">
              Selecciona una asignación para editarla.
            </p>
          </div>
        </div>

        <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <div className="mx-auto max-w-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
              ✏️
            </div>
            <h3 className="text-base font-semibold text-slate-900">Nada seleccionado</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Haz clic en una mesa ocupada o en un registro de la lista para editar la
              asignación de ese empleado.
            </p>
          </div>
        </div>
      </aside>
    );
  }

  const statusMeta = getStatusMeta(selectedReservation.status);
  const officeValue = draft.office || "Toledo";
  const rooms = getOfficeRoomsFromMaps(officeValue);
  const desks = getDeskDataForOfficeRoom(officeValue, draft.room || rooms[0] || "");
  const showOfficeFields = draft.status !== "not-working";
  const deskDisabled = draft.status !== "office";

  return (
    <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70 sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Edición rápida</h2>
          <p className="mt-1 text-sm text-slate-500">Selecciona una asignación para editarla.</p>
        </div>
      </div>

      <div className="space-y-5">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-start gap-4">
            <img
              src={selectedReservation.employeeAvatar}
              alt={selectedReservation.employeeName}
              className="h-14 w-14 rounded-2xl border border-slate-200 bg-white object-cover"
            />

            <div className="min-w-0 flex-1">
              <h3 className="truncate text-lg font-semibold text-slate-900">
                {selectedReservation.employeeName}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {selectedReservation.employeeEmail ||
                  selectedReservation.employeePhone ||
                  "Sin contacto"}
              </p>

              <div
                className={`mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${statusMeta.badge}`}
              >
                <span className={`h-2.5 w-2.5 rounded-full ${statusMeta.dot}`}></span>
                {statusMeta.label}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <div className="mb-4">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Registro actual
            </h4>
          </div>

          <div className="space-y-3 text-sm">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <span className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                Fecha
              </span>
              <span className="mt-1 block font-medium text-slate-900">
                {formatHumanDate(selectedReservation.date)}
              </span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <span className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                Ubicación actual
              </span>
              <span className="mt-1 block font-medium text-slate-900">
                {getLocationText(selectedReservation)}
              </span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <span className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                Horario
              </span>
              <span className="mt-1 block font-medium text-slate-900">
                {selectedReservation.startTime && selectedReservation.endTime
                  ? `${selectedReservation.startTime} - ${selectedReservation.endTime}`
                  : "-"}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <div className="mb-4">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Editar asignación
            </h4>
          </div>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="drawer-status"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Estado
              </label>
              <select
                id="drawer-status"
                value={draft.status}
                disabled={isSaving}
                onChange={(e) => {
                  const value = e.target.value;

                  if (value === "not-working") {
                    onDraftChange({
                      status: value,
                      office: null,
                      room: null,
                      deskId: null,
                      startTime: null,
                      endTime: null,
                    });
                    return;
                  }

                  if (value === "remote" || value === "event") {
                    onDraftChange({
                      status: value,
                      deskId: null,
                    });
                    return;
                  }

                  onDraftChange({ status: value });
                }}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition disabled:cursor-not-allowed disabled:opacity-60 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="office">Trabaja en oficina</option>
                <option value="remote">Teletrabajo</option>
                <option value="event">Evento</option>
                <option value="not-working">No trabaja</option>
              </select>
            </div>

            {showOfficeFields && (
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="drawer-office"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Oficina
                  </label>
                  <select
                    id="drawer-office"
                    value={officeValue}
                    disabled={isSaving}
                    onChange={(e) => {
                      const newOffice = e.target.value;
                      const nextRooms = getOfficeRoomsFromMaps(newOffice);
                      const firstRoom = nextRooms[0] || "";
                      onDraftChange({
                        office: newOffice,
                        room: firstRoom,
                        deskId: "",
                      });
                    }}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition disabled:cursor-not-allowed disabled:opacity-60 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="Toledo">Toledo</option>
                    <option value="Madrid">Madrid</option>
                    <option value="Alcobendas">Alcobendas</option>
                    <option value="Consuegra">Consuegra</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="drawer-room"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Sala
                  </label>
                  <select
                    id="drawer-room"
                    value={draft.room || ""}
                    disabled={isSaving}
                    onChange={(e) => onDraftChange({ room: e.target.value, deskId: "" })}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition disabled:cursor-not-allowed disabled:opacity-60 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                  >
                    {rooms.map((room) => (
                      <option key={room} value={room}>
                        {room}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="drawer-desk"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Mesa
                  </label>
                  <select
                    id="drawer-desk"
                    value={draft.deskId || ""}
                    disabled={deskDisabled || isSaving}
                    onChange={(e) =>
                      onDraftChange({
                        deskId: e.target.value ? normalizeDeskId(e.target.value) : null,
                      })
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition disabled:cursor-not-allowed disabled:opacity-60 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">Sin seleccionar</option>
                    {desks.map((desk) => (
                      <option
                        key={desk.id}
                        value={desk.id}
                        disabled={desk.available === false && desk.id !== draft.deskId}
                      >
                        {desk.id}
                        {desk.available === false ? " · No disponible" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="drawer-start-time"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Hora de inicio
                </label>
                <input
                  id="drawer-start-time"
                  type="time"
                  value={draft.startTime || ""}
                  disabled={isSaving}
                  onChange={(e) => onDraftChange({ startTime: e.target.value || null })}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition disabled:cursor-not-allowed disabled:opacity-60 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label
                  htmlFor="drawer-end-time"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Hora de fin
                </label>
                <input
                  id="drawer-end-time"
                  type="time"
                  value={draft.endTime || ""}
                  disabled={isSaving}
                  onChange={(e) => onDraftChange({ endTime: e.target.value || null })}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition disabled:cursor-not-allowed disabled:opacity-60 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClearDesk}
              disabled={isSaving}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Quitar mesa
            </button>

            <button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}