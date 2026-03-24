import { officeDeskData } from "../../data/adminReservations";

function getDeskCardClasses(availability, isSelected) {
  const base =
    "relative flex min-h-[96px] flex-col items-center justify-center rounded-3xl border-2 p-3 text-center text-sm font-semibold transition duration-200";

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

export default function AdminMapView({
  office,
  room,
  date,
  reservations,
  selectedReservationId,
  onSelectReservation,
  onAssignFirstFree,
  canAssignFirstFree,
  formatHumanDate,
}) {
  const shouldShowEmpty = office === "all" || room === "all";

  if (shouldShowEmpty) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70 sm:p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Mapa de sala</h2>
            <p className="mt-1 text-sm text-slate-500">
              Selecciona una oficina y una sala para visualizar el plano.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
            Haz clic en una mesa ocupada o en un empleado de la lista para editar.
          </div>
        </div>

        <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2 xl:grid-cols-4">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-emerald-400"></span>
              Libre
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-sky-400"></span>
              Ocupada
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-blue-500"></span>
              Seleccionada
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-rose-400"></span>
              No disponible
            </div>
          </div>
        </div>

        <div className="flex min-h-[420px] items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <div className="max-w-md">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
              🗺️
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Aún no hay plano cargado</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Selecciona oficina y sala para ver el mapa y las asignaciones del día.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const desks = officeDeskData[office] || [];
  const roomReservations = reservations.filter(
    (item) => item.office === office && item.room === room
  );

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70 sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Mapa de sala</h2>
          <p className="mt-1 text-sm text-slate-500">
            {office} · {room} · {formatHumanDate(date)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
          Haz clic en una mesa ocupada o en un empleado de la lista para editar.
        </div>
      </div>

      <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2 xl:grid-cols-4">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-emerald-400"></span>
            Libre
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-sky-400"></span>
            Ocupada
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-blue-500"></span>
            Seleccionada
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-rose-400"></span>
            No disponible
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50 p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="rounded-2xl bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
            Plano de asignaciones
          </div>

          <button
            type="button"
            onClick={onAssignFirstFree}
            disabled={!canAssignFirstFree}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Asignar primera libre
          </button>
        </div>

        <div className="relative min-h-[420px] rounded-[24px] border border-slate-200 bg-gradient-to-br from-slate-100 to-white p-4 sm:min-h-[520px] sm:p-6">
          <div className="absolute left-4 top-4 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 sm:left-6 sm:top-6">
            Entrada
          </div>

          <div className="absolute right-4 top-4 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 sm:right-6 sm:top-6">
            Ventanas
          </div>

          <div className="absolute left-1/2 top-6 h-14 w-32 -translate-x-1/2 rounded-2xl border border-slate-200 bg-slate-200/70"></div>
          <div className="absolute bottom-6 left-6 right-6 h-3 rounded-full bg-slate-200"></div>

          <div className="grid min-h-[360px] grid-cols-2 gap-4 pt-20 sm:grid-cols-3 lg:grid-cols-4">
            {desks.map((desk) => {
              const reservation = roomReservations.find((item) => item.deskId === desk.id);
              const isSelected = reservation?.id === selectedReservationId;

              let availability = "free";
              if (!desk.available) availability = "blocked";
              else if (reservation) availability = "occupied";

              return (
                <button
                  key={desk.id}
                  type="button"
                  disabled={availability !== "occupied"}
                  onClick={() => reservation && onSelectReservation(reservation.id)}
                  className={getDeskCardClasses(availability, Boolean(isSelected))}
                >
                  {availability === "free" && (
                    <>
                      <span className="text-base">{desk.id}</span>
                      <span className="mt-2 rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-medium text-emerald-700">
                        Libre
                      </span>
                    </>
                  )}

                  {availability === "blocked" && (
                    <>
                      <span className="text-base">{desk.id}</span>
                      <span className="mt-2 rounded-full bg-rose-100 px-2 py-1 text-[11px] font-medium text-rose-700">
                        No disponible
                      </span>
                    </>
                  )}

                  {availability === "occupied" && (
                    <>
                      <span className="text-base">{desk.id}</span>
                      <span className="mt-2 line-clamp-2 text-xs font-medium">
                        {reservation?.employeeName ?? ""}
                      </span>
                      <span className="mt-2 rounded-full bg-sky-100 px-2 py-1 text-[11px] font-medium text-sky-700">
                        Ocupada
                      </span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}