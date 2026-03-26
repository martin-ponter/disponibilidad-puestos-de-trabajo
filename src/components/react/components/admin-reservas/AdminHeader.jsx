export default function AdminHeader() {
  return (
    <>
      <div className="flex flex-row-reverse justify-between">
        <div className="mb-8 flex flex-col items-center gap-5">
          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-100"
          >
            <span>←</span>
            Volver
          </a>

          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 shadow-sm">
            <span>🛠️</span>
            Administrador
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Gestión de puestos
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
            Consulta rápidamente qué empleados están asignados a cada oficina y sala,
            y reasigna su jornada o su mesa cuando sea necesario.
          </p>
        </div>
      </div>
    </>
  );
}