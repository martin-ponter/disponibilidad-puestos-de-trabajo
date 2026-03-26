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
      available: desk.available !== false,
    }));
  }

  return officeDeskData[office] || [];
}

function getEmptyDeskLocationText(selectedEmptyDesk) {
  if (!selectedEmptyDesk) return "-";
  return `${selectedEmptyDesk.office ?? "-"} · ${selectedEmptyDesk.room ?? "-"}${selectedEmptyDesk.deskId ? ` · ${selectedEmptyDesk.deskId}` : ""
    }`;
}

export default function AdminDrawer({
  selectedReservation,
  selectedEmptyDesk,
  draft,
  onDraftChange,
  onClearDesk,
  onSave,
  onOpenEmployeePicker,
  isSaving,
  formatHumanDate,
  getLocationText,
  getStatusMeta,
  occupiedDeskIds = [],
}) {
  const hasExistingReservation = Boolean(selectedReservation);
  const hasEmptyDeskSelection = Boolean(selectedEmptyDesk);
  const hasDraft = Boolean(draft);

  if (!hasExistingReservation && !hasEmptyDeskSelection && !hasDraft) {
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
              Haz clic en una mesa ocupada, una mesa libre o en un registro de la lista.
            </p>
          </div>
        </div>
      </aside>
    );
  }

  const currentPerson = draft || selectedReservation || null;
  const statusMeta = currentPerson
    ? getStatusMeta(currentPerson.status || "office")
    : getStatusMeta("office");

  const officeValue = draft?.office || selectedEmptyDesk?.office || "Toledo";
  const roomValue = draft?.room || selectedEmptyDesk?.room || "";
  const rooms = getOfficeRoomsFromMaps(officeValue);
  const desks = getDeskDataForOfficeRoom(officeValue, roomValue || rooms[0] || "");
  const showOfficeFields = (draft?.status || "office") !== "not-working";
  const deskDisabled = (draft?.status || "office") !== "office";

  const occupiedDeskIdSet = new Set((occupiedDeskIds || []).map(normalizeDeskId));
  const normalizedDraftDeskId = normalizeDeskId(draft?.deskId);

  const occupiedDesksInCurrentRoom = desks.filter((desk) =>
    occupiedDeskIdSet.has(normalizeDeskId(desk.id))
  );

  const currentDateValue =
    selectedReservation?.date || draft?.date || selectedEmptyDesk?.date || "";

  const currentLocationValue = hasExistingReservation
    ? getLocationText(selectedReservation)
    : getEmptyDeskLocationText(draft || selectedEmptyDesk);

  const currentTimeValue = hasExistingReservation
    ? selectedReservation.startTime && selectedReservation.endTime
      ? `${selectedReservation.startTime} - ${selectedReservation.endTime}`
      : "-"
    : draft?.startTime && draft?.endTime
      ? `${draft.startTime} - ${draft.endTime}`
      : "-";

  const showPickerCta = hasEmptyDeskSelection && !draft?.employeeId;

  return (
    <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70 sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Edición rápida</h2>
          <p className="mt-1 text-sm text-slate-500">
            {hasExistingReservation
              ? "Edita la asignación seleccionada."
              : "Estás preparando una nueva asignación desde una mesa vacía."}
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {currentPerson?.employeeName ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start gap-4">
              <img
                src={currentPerson.employeeAvatar}
                alt={currentPerson.employeeName}
                className="h-14 w-14 rounded-2xl border border-slate-200 bg-white object-cover"
              />

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-semibold text-slate-900">
                      {currentPerson.employeeName}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {currentPerson.employeeEmail ||
                        currentPerson.employeePhone ||
                        "Sin contacto"}
                    </p>
                  </div>

                  {!hasExistingReservation && hasEmptyDeskSelection ? (
                    <button
                      type="button"
                      onClick={onOpenEmployeePicker}
                      disabled={isSaving}
                      className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Cambiar persona
                    </button>
                  ) : null}
                </div>

                <div
                  className={`mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${statusMeta.badge}`}
                >
                  <span className={`h-2.5 w-2.5 rounded-full ${statusMeta.dot}`}></span>
                  {statusMeta.label}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-2xl">
                🪑
              </div>

              <h3 className="text-lg font-semibold text-slate-900">Puesto vacío</h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Has seleccionado una mesa libre. Ahora elige a la persona que quieres asignar a ese puesto.
              </p>

              <button
                type="button"
                onClick={onOpenEmployeePicker}
                disabled={isSaving}
                className="mt-5 inline-flex w-full items-center justify-center rounded-3xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Seleccionar persona
              </button>
            </div>
          </div>
        )}

        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <div className="mb-4">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              {hasExistingReservation ? "Registro actual" : "Hueco seleccionado"}
            </h4>
          </div>

          <div className="space-y-3 text-sm">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <span className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                Fecha
              </span>
              <span className="mt-1 block font-medium text-slate-900">
                {formatHumanDate(currentDateValue)}
              </span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <span className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                Ubicación actual
              </span>
              <span className="mt-1 block font-medium text-slate-900">
                {currentLocationValue}
              </span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <span className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                Horario
              </span>
              <span className="mt-1 block font-medium text-slate-900">
                {currentTimeValue}
              </span>
            </div>
          </div>
        </div>

        {draft ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="mb-4">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Editar asignación
              </h4>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="drawer-date"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Fecha
                </label>
                <input
                  id="drawer-date"
                  type="date"
                  value={draft.date || ""}
                  disabled={isSaving}
                  onChange={(e) => onDraftChange({ date: e.target.value || null })}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition disabled:cursor-not-allowed disabled:opacity-60 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

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
                      {desks.map((desk) => {
                        const normalizedDesk = normalizeDeskId(desk.id);
                        const isOccupied = occupiedDeskIdSet.has(normalizedDesk);
                        const isCurrentDesk = normalizedDesk === normalizedDraftDeskId;
                        const isUnavailable = desk.available === false;
                        const shouldDisable = !isCurrentDesk && (isUnavailable || isOccupied);

                        return (
                          <option
                            key={desk.id}
                            value={desk.id}
                            disabled={shouldDisable}
                            className={
                              isOccupied
                                ? "text-rose-700"
                                : isUnavailable
                                  ? "text-slate-500"
                                  : ""
                            }
                          >
                            {desk.id}
                            {isOccupied
                              ? " · Ocupada"
                              : isUnavailable
                                ? " · No disponible"
                                : ""}
                          </option>
                        );
                      })}
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
        ) : null}

        {showPickerCta ? (
          <div className="rounded-3xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm leading-6 text-blue-800">
              Primero selecciona a la persona y después podrás ajustar fecha, horario, estado, oficina, sala y mesa antes de guardar.
            </p>
          </div>
        ) : null}
      </div>
    </aside>
  );
}