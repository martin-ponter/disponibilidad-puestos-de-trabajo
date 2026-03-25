import React from "react";

export default function ReservationCalendarGrid({
	monthLabel,
	monthLoading,
	cells,
	onPrevMonth,
	onNextMonth,
	onSelectDay,
}) {
	return (
		<div className="rounded-[28px] border border-slate-200 bg-slate-50 p-4 sm:p-6">
			<div className="mb-5 flex items-center justify-between gap-4">
				<button
					type="button"
					onClick={onPrevMonth}
					className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-100"
				>
					←
				</button>

				<div className="text-center">
					<p className="text-lg font-semibold text-slate-900">{monthLabel}</p>
					<p className="text-sm text-slate-500">
						{monthLoading ? "Actualizando..." : "Selecciona un día"}
					</p>
				</div>

				<button
					type="button"
					onClick={onNextMonth}
					className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-100"
				>
					→
				</button>
			</div>

			<div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 sm:gap-3">
				<div className="py-2">Lun</div>
				<div className="py-2">Mar</div>
				<div className="py-2">Mié</div>
				<div className="py-2">Jue</div>
				<div className="py-2">Vie</div>
				<div className="py-2">Sáb</div>
				<div className="py-2">Dom</div>
			</div>

			<div className="mt-3 grid grid-cols-7 gap-2 sm:gap-3">
				{cells.map((cell) => {
					if (cell.type === "empty") {
						return <div key={cell.key} className="h-20 rounded-2xl" />;
					}

					return (
						<button
							key={cell.key}
							type="button"
							onClick={() => onSelectDay(cell.dateValue)}
							className={`min-h-[96px] rounded-2xl border bg-white p-3 text-left transition ${cell.isSelected
									? "border-blue-400 bg-blue-50 ring-2 ring-blue-200"
									: "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
								}`}
						>
							<div className="flex h-full flex-col justify-between gap-2">
								<div className="flex items-start justify-between gap-2">
									<span className="text-base font-semibold text-slate-900">
										{cell.day}
									</span>

									{cell.isToday ? (
										<span className="rounded-full bg-slate-900 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
											Hoy
										</span>
									) : null}
								</div>

								<div className="space-y-1">
									<span
										className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${cell.badge.badgeClasses}`}
									>
										{cell.badge.label}
									</span>

									<p className="text-xs text-slate-500">
										{cell.entry ? "Editar jornada" : "Crear jornada"}
									</p>
								</div>
							</div>
						</button>
					);
				})}
			</div>
		</div>
	);
}