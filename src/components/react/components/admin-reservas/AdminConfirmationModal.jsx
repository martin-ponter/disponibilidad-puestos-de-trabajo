export default function AdminConfirmationModal({
  isOpen,
  success,
  title,
  message,
  onClose,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm transition"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={
            success
              ? "mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-2xl"
              : "mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-2xl"
          }
        >
          {success ? "✅" : "❌"}
        </div>

        <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
        <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}