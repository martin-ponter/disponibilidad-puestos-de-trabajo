import { useEffect, useMemo, useState } from "react";

const monthNames = [
	"Enero",
	"Febrero",
	"Marzo",
	"Abril",
	"Mayo",
	"Junio",
	"Julio",
	"Agosto",
	"Septiembre",
	"Octubre",
	"Noviembre",
	"Diciembre",
];

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

const ENTITY_TYPE_ID = 1058;

function formatDate(date) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

function formatHumanDate(dateString) {
	const [year, month, day] = dateString.split("-");
	return `${day}/${month}/${year}`;
}

function getMonthRange(date) {
	const year = date.getFullYear();
	const month = date.getMonth();

	const start = new Date(year, month, 1);
	const end = new Date(year, month + 1, 0);

	return {
		start: formatDate(start),
		end: formatDate(end),
	};
}

function getStatusMeta(entry) {
	if (!entry) {
		return {
			label: "Sin registrar",
			badgeClasses: "bg-slate-100 text-slate-500",
		};
	}

	const resourceType = String(entry[FIELD_RESOURCE_TYPE] ?? "").toLowerCase();
	const status = String(entry[FIELD_STATUS] ?? "").toLowerCase();
	const resource = String(entry[FIELD_RESOURCE] ?? "").toLowerCase();
	const room = String(entry[FIELD_ROOM] ?? "").toLowerCase();
	const notes = String(entry[FIELD_NOTES] ?? "").toLowerCase();

	if (status === "cancelada") {
		return {
			label: "No trabaja",
			badgeClasses: "bg-amber-100 text-amber-700",
		};
	}

	if (
		resourceType === "sala" ||
		resource.includes("evento") ||
		room.includes("evento") ||
		notes.includes("evento")
	) {
		return {
			label: "Evento",
			badgeClasses: "bg-violet-100 text-violet-700",
		};
	}

	if (
		resource.includes("teletrabajo") ||
		room.includes("teletrabajo") ||
		notes.includes("teletrabajo") ||
		notes.includes("remoto")
	) {
		return {
			label: "Teletrabajo",
			badgeClasses: "bg-blue-100 text-blue-700",
		};
	}

	if (status === "bloqueada") {
		return {
			label: "Ausencia",
			badgeClasses: "bg-amber-100 text-amber-700",
		};
	}

	return {
		label: "Oficina",
		badgeClasses: "bg-emerald-100 text-emerald-700",
	};
}

function getEntrySummary(entry) {
	if (!entry) return "";

	const center = entry[FIELD_CENTER] ?? "-";
	const room = entry[FIELD_ROOM] ?? "-";
	const resource = entry[FIELD_RESOURCE] ?? "-";
	const start = entry[FIELD_START] ?? "-";
	const end = entry[FIELD_END] ?? "-";
	const statusMeta = getStatusMeta(entry);

	return `${statusMeta.label} · ${center} · ${room} · ${resource} · ${start} - ${end}`;
}

function dedupeEntriesByDate(items) {
	const map = new Map();

	items.forEach((item) => {
		const date = item[FIELD_DATE];
		if (!date) return;

		const existing = map.get(date);

		if (!existing || Number(item.id) > Number(existing.id)) {
			map.set(date, item);
		}
	});

	return map;
}

function buildCalendarCells(currentMonth, entriesByDate, selectedDate) {
	const year = currentMonth.getFullYear();
	const month = currentMonth.getMonth();

	const firstDay = new Date(year, month, 1);
	const lastDay = new Date(year, month + 1, 0);

	let startWeekDay = firstDay.getDay();
	startWeekDay = startWeekDay === 0 ? 6 : startWeekDay - 1;

	const totalDays = lastDay.getDate();
	const cells = [];

	for (let i = 0; i < startWeekDay; i += 1) {
		cells.push({ type: "empty", key: `empty-${i}` });
	}

	const today = new Date();
	const todayFormatted = formatDate(
		new Date(today.getFullYear(), today.getMonth(), today.getDate())
	);

	for (let day = 1; day <= totalDays; day += 1) {
		const date = new Date(year, month, day);
		const dateValue = formatDate(date);
		const entry = entriesByDate.get(dateValue) ?? null;

		cells.push({
			type: "day",
			key: dateValue,
			day,
			dateValue,
			isToday: dateValue === todayFormatted,
			isSelected: selectedDate === dateValue,
			entry,
		});
	}

	return cells;
}

export default function CalendarCard() {
	const [currentMonth, setCurrentMonth] = useState(new Date());
	const [selectedDate, setSelectedDate] = useState(null);
	const [currentUser, setCurrentUser] = useState(null);
	const [entries, setEntries] = useState([]);
	const [loading, setLoading] = useState(true);
	const [monthLoading, setMonthLoading] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		if (!window.BX24) {
			setError("BX24 no está disponible en la ventana.");
			setLoading(false);
			return;
		}

		window.BX24.init(() => {
			window.BX24.callMethod("user.current", {}, (userResult) => {
				if (userResult.error()) {
					setError("No se pudo obtener el usuario actual.");
					setLoading(false);
					return;
				}

				const user = userResult.data();
				setCurrentUser(user);
			});
		});
	}, []);

	useEffect(() => {
		if (!currentUser) return;
		if (!window.BX24) return;

		const { start, end } = getMonthRange(currentMonth);

		setMonthLoading(true);
		setError("");

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
					[FIELD_EMPLOYEE]: Number(currentUser.ID),
					[FIELD_DATE]: {
						from: start,
						to: end,
					},
				},
			},
			(result) => {
				if (result.error()) {
					setError("No se pudieron cargar los registros del calendario.");
					setLoading(false);
					setMonthLoading(false);
					return;
				}

				const items = result.data()?.items || [];
				setEntries(items);
				setLoading(false);
				setMonthLoading(false);
			}
		);
	}, [currentMonth, currentUser]);

	const entriesByDate = useMemo(() => dedupeEntriesByDate(entries), [entries]);

	const calendarCells = useMemo(
		() => buildCalendarCells(currentMonth, entriesByDate, selectedDate),
		[currentMonth, entriesByDate, selectedDate]
	);

	const selectedEntry = selectedDate ? entriesByDate.get(selectedDate) ?? null : null;

	const monthLabel = `${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;

	function handlePrevMonth() {
		setCurrentMonth(
			new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
		);
	}

	function handleNextMonth() {
		setCurrentMonth(
			new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
		);
	}

	function mapEntryForModal(entry) {
		if (!entry) return null;

		return {
			id: entry.id,
			title: entry.title,
			date: entry[FIELD_DATE],
			center: entry[FIELD_CENTER],
			room: entry[FIELD_ROOM],
			resource: entry[FIELD_RESOURCE],
			resourceType: entry[FIELD_RESOURCE_TYPE],
			bookingMode: entry[FIELD_BOOKING_MODE],
			start: entry[FIELD_START],
			end: entry[FIELD_END],
			status: entry[FIELD_STATUS],
			notes: entry[FIELD_NOTES],
			fullDay: entry[FIELD_FULL_DAY],
		};
	}

	function handleSelectDay(dateValue) {
		setSelectedDate(dateValue);

		const badge = document.getElementById("selected-date-badge");
		const text = document.getElementById("selected-date-text");

		if (badge && text) {
			text.textContent = formatHumanDate(dateValue);
			badge.classList.remove("hidden");
		}

		const entry = entriesByDate.get(dateValue) ?? null;

		window.dispatchEvent(
			new CustomEvent("reservation-day-selected", {
				detail: {
					date: dateValue,
					entry: mapEntryForModal(entry),
				},
			})
		);
	}

	if (loading) {
		return (
			<div className="rounded-[28px] border border-slate-200 bg-slate-50 p-8 text-center">
				<div className="mx-auto max-w-md">
					<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
						⏳
					</div>
					<h3 className="text-lg font-semibold text-slate-900">Cargando calendario</h3>
					<p className="mt-2 text-sm leading-6 text-slate-500">
						Estamos obteniendo tus registros desde Bitrix.
					</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="rounded-[28px] border border-rose-200 bg-rose-50 p-8 text-center">
				<div className="mx-auto max-w-md">
					<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
						❌
					</div>
					<h3 className="text-lg font-semibold text-slate-900">
						No se pudo cargar el calendario
					</h3>
					<p className="mt-2 text-sm leading-6 text-slate-600">{error}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="rounded-[28px] border border-slate-200 bg-slate-50 p-4 sm:p-6">
				<div className="mb-5 flex items-center justify-between gap-4">
					<button
						type="button"
						onClick={handlePrevMonth}
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
						onClick={handleNextMonth}
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
					{calendarCells.map((cell) => {
						if (cell.type === "empty") {
							return <div key={cell.key} className="h-20 rounded-2xl" />;
						}

						const badge = getStatusMeta(cell.entry);

						return (
							<button
								key={cell.key}
								type="button"
								onClick={() => handleSelectDay(cell.dateValue)}
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
											className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${badge.badgeClasses}`}
										>
											{badge.label}
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

			{selectedDate ? (
				<div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
					<div className="flex flex-col gap-2">
						<h3 className="text-base font-semibold text-slate-900">
							Día seleccionado: {formatHumanDate(selectedDate)}
						</h3>

						{selectedEntry ? (
							<>
								<p className="text-sm text-slate-600">
									Registro actual: {getEntrySummary(selectedEntry)}
								</p>
								<p className="text-xs text-slate-500">
									Se ha encontrado un registro para este día.
								</p>
							</>
						) : (
							<>
								<p className="text-sm text-slate-600">
									No hay ningún registro guardado para este día.
								</p>
								<p className="text-xs text-slate-500">
									Desde aquí ya puedes conectar la apertura del modal de creación.
								</p>
							</>
						)}
					</div>
				</div>
			) : null}
		</div>
	);
}

