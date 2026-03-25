export default function AdminListView({
  reservations,
  selectedReservationId,
  onEdit,
  formatHumanDate,
  getStatusMeta,
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70 sm:p-6 max-h-screen">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900">Lista de asignaciones</h2>
        <p className="mt-1 text-sm text-slate-500">
          Revisa y edita rápidamente las jornadas del equipo.
        </p>
      </div>

      {!reservations.length && (
        <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <div className="mx-auto max-w-md">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
              👥
            </div>
            <h3 className="text-lg font-semibold text-slate-900">No hay resultados</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              No se han encontrado asignaciones que coincidan con los filtros actuales.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {reservations.map((item) => {
          const statusMeta = getStatusMeta(item.status);
          const isSelected = item.id === selectedReservationId;

          return (
            <article
              key={item.id}
              className={
                isSelected
                  ? "rounded-3xl border border-blue-300 bg-blue-50 p-4 shadow-sm"
                  : "rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300"
              }
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-start gap-4">
                  <img
                    src={item.employeeAvatar}
                    alt={item.employeeName}
                    className="h-14 w-14 rounded-2xl border border-slate-200 bg-white object-cover"
                  />

                  <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold text-slate-900">
                      {item.employeeName}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {item.employeeEmail || item.employeePhone || "Sin contacto"}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${statusMeta.badge}`}
                      >
                        <span className={`h-2.5 w-2.5 rounded-full ${statusMeta.dot}`}></span>
                        {statusMeta.label}
                      </span>

                      <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {formatHumanDate(item.date)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[420px]">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                    <span className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                      Oficina
                    </span>
                    <span className="mt-1 block font-medium text-slate-900">
                      {item.office ?? "-"}
                    </span>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                    <span className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                      Sala / mesa
                    </span>
                    <span className="mt-1 block font-medium text-slate-900">
                      {item.room ?? "-"}
                      {item.deskId ? ` · ${item.deskId}` : ""}
                    </span>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                    <span className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                      Horario
                    </span>
                    <span className="mt-1 block font-medium text-slate-900">
                      {item.startTime && item.endTime
                        ? `${item.startTime} - ${item.endTime}`
                        : "-"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => onEdit(item.id)}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Editar
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}