export default function AdminFilters({
  filters,
  availableRooms,
  currentTab,
  visibleCount,
  onChange,
  onReset,
  onTabChange,
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70 sm:p-6">
      <div className="grid gap-4 xl:grid-cols-[220px_220px_220px_minmax(0,1fr)_220px]">
        <div>
          <label htmlFor="admin-date" className="mb-2 block text-sm font-medium text-slate-700">
            Fecha
          </label>
          <input
            id="admin-date"
            type="date"
            value={filters.date}
            onChange={(e) => onChange({ date: e.target.value })}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div>
          <label htmlFor="admin-office" className="mb-2 block text-sm font-medium text-slate-700">
            Oficina
          </label>
          <select
            id="admin-office"
            value={filters.office}
            onChange={(e) => onChange({ office: e.target.value, room: "all" })}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">Todas</option>
            <option value="Toledo">Toledo</option>
            <option value="Madrid">Madrid</option>
            <option value="Consuegra">Consuegra</option>
          </select>
        </div>

        <div>
          <label htmlFor="admin-room" className="mb-2 block text-sm font-medium text-slate-700">
            Sala
          </label>
          <select
            id="admin-room"
            value={filters.room}
            onChange={(e) => onChange({ room: e.target.value })}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">Todas</option>
            {availableRooms.map((room) => (
              <option key={room} value={room}>
                {room}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="admin-search" className="mb-2 block text-sm font-medium text-slate-700">
            Buscar empleado
          </label>
          <input
            id="admin-search"
            type="text"
            placeholder="Nombre, email o mesa..."
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div>
          <label htmlFor="admin-status" className="mb-2 block text-sm font-medium text-slate-700">
            Estado
          </label>
          <select
            id="admin-status"
            value={filters.status}
            onChange={(e) => onChange({ status: e.target.value })}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">Todos</option>
            <option value="office">Oficina</option>
            <option value="remote">Teletrabajo</option>
            <option value="event">Evento</option>
            <option value="not-working">No trabaja</option>
          </select>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onTabChange("map")}
            className={
              currentTab === "map"
                ? "inline-flex items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700"
                : "inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
            }
          >
            Vista mapa
          </button>

          <button
            type="button"
            onClick={() => onTabChange("list")}
            className={
              currentTab === "list"
                ? "inline-flex items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700"
                : "inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
            }
          >
            Vista lista
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
            Registros visibles: <span className="font-semibold text-slate-900">{visibleCount}</span>
          </div>

          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Limpiar filtros
          </button>
        </div>
      </div>
    </section>
  );
}
