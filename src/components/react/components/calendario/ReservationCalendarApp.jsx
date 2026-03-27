import React, { useEffect, useMemo, useState } from "react";
import ReservationCalendarGrid from "./ReservationCalendarGrid.jsx";
import ReservationDayModal from "./ReservationDayModal.jsx";

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

function normalizeBitrixDate(value) {
	if (!value) return "";

	if (typeof value === "string") {
		if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
		if (/^\d{4}-\d{2}-\d{2}T/.test(value)) return value.slice(0, 10);
	}

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "";

	return formatDate(date);
}

function normalizeTimeValue(value) {
	if (!value) return "";
	if (/^\d{2}:\d{2}$/.test(value)) return value;

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "";

	const hours = String(date.getHours()).padStart(2, "0");
	const minutes = String(date.getMinutes()).padStart(2, "0");
	return `${hours}:${minutes}`;
}

function toMinutes(value) {
	if (!value) return 0;
	const [hours, minutes] = value.split(":").map(Number);
	return hours * 60 + minutes;
}

function rangesOverlap(startA, endA, startB, endB) {
	return toMinutes(startA) < toMinutes(endB) && toMinutes(endA) > toMinutes(startB);
}

function toBitrixDateTime(dateString, timeString) {
	const [year, month, day] = dateString.split("-").map(Number);
	const [hours, minutes] = timeString.split(":").map(Number);
	const date = new Date(year, month - 1, day, hours, minutes, 0);

	const pad = (n) => String(n).padStart(2, "0");
	const offsetMinutes = -date.getTimezoneOffset();
	const sign = offsetMinutes >= 0 ? "+" : "-";
	const absOffset = Math.abs(offsetMinutes);
	const offsetHours = pad(Math.floor(absOffset / 60));
	const offsetMins = pad(absOffset % 60);

	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
		date.getDate()
	)}T${pad(date.getHours())}:${pad(date.getMinutes())}:00${sign}${offsetHours}:${offsetMins}`;
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

	if (status === "bloqueada") {
		return {
			label: "Ausencia",
			badgeClasses: "bg-amber-100 text-amber-700",
		};
	}

	if (notes.includes("no trabaja")) {
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
		const normalizedDate = normalizeBitrixDate(item[FIELD_DATE]);
		if (!normalizedDate) return;

		const existing = map.get(normalizedDate);

		if (!existing || Number(item.id) > Number(existing.id)) {
			map.set(normalizedDate, item);
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
			badge: getStatusMeta(entry),
		});
	}

	return cells;
}

function createEnumMaps(fields) {
	const enumFieldNames = [
		FIELD_CENTER,
		FIELD_RESOURCE_TYPE,
		FIELD_BOOKING_MODE,
		FIELD_STATUS,
	];

	const result = {};

	for (const fieldName of enumFieldNames) {
		const fieldDef = fields?.[fieldName];
		const items = Array.isArray(fieldDef?.items) ? fieldDef.items : [];

		const byId = new Map();
		const byLabel = new Map();

		items.forEach((item) => {
			const id = String(item.ID ?? item.id ?? "");
			const label = String(item.VALUE ?? item.value ?? "");

			if (id) byId.set(id, label);
			if (label) byLabel.set(label.toLowerCase(), item.ID ?? item.id);
		});

		result[fieldName] = { byId, byLabel };
	}

	return result;
}

function resolveEnumLabel(enumMaps, fieldName, value) {
	if (value === undefined || value === null) return value;

	const map = enumMaps[fieldName];
	if (!map) return value;

	return map.byId.get(String(value)) ?? value;
}

function resolveEnumId(enumMaps, fieldName, value) {
	if (value === undefined || value === null) return value;

	const map = enumMaps[fieldName];
	if (!map) return value;

	return map.byLabel.get(String(value).toLowerCase()) ?? value;
}

function normalizeEntry(item, maps) {
	return {
		...item,
		[FIELD_CENTER]: resolveEnumLabel(maps, FIELD_CENTER, item[FIELD_CENTER]),
		[FIELD_RESOURCE_TYPE]: resolveEnumLabel(
			maps,
			FIELD_RESOURCE_TYPE,
			item[FIELD_RESOURCE_TYPE]
		),
		[FIELD_BOOKING_MODE]: resolveEnumLabel(
			maps,
			FIELD_BOOKING_MODE,
			item[FIELD_BOOKING_MODE]
		),
		[FIELD_STATUS]: resolveEnumLabel(maps, FIELD_STATUS, item[FIELD_STATUS]),
	};
}

function isComedorEntry(entry) {
	const resourceType = String(entry?.[FIELD_RESOURCE_TYPE] ?? "").toLowerCase();
	return resourceType === "comedor";
}

function mapEntryForModal(entry, enumMaps) {
	if (!entry) return null;

	return {
		id: entry.id,
		title: entry.title,
		date: normalizeBitrixDate(entry[FIELD_DATE]),
		center: resolveEnumLabel(enumMaps, FIELD_CENTER, entry[FIELD_CENTER]),
		room: entry[FIELD_ROOM],
		resource: entry[FIELD_RESOURCE],
		resourceType: resolveEnumLabel(enumMaps, FIELD_RESOURCE_TYPE, entry[FIELD_RESOURCE_TYPE]),
		bookingMode: resolveEnumLabel(enumMaps, FIELD_BOOKING_MODE, entry[FIELD_BOOKING_MODE]),
		start: entry[FIELD_START],
		end: entry[FIELD_END],
		status: resolveEnumLabel(enumMaps, FIELD_STATUS, entry[FIELD_STATUS]),
		notes: entry[FIELD_NOTES],
		fullDay: entry[FIELD_FULL_DAY],
	};
}

export default function ReservationCalendarApp() {
	const [currentMonth, setCurrentMonth] = useState(new Date());
	const [selectedDate, setSelectedDate] = useState(null);
	const [currentUser, setCurrentUser] = useState(null);
	const [entries, setEntries] = useState([]);
	const [loading, setLoading] = useState(true);
	const [monthLoading, setMonthLoading] = useState(false);
	const [error, setError] = useState("");
	const [isDayModalOpen, setIsDayModalOpen] = useState(false);
	const [confirmation, setConfirmation] = useState(null);
	const [enumMaps, setEnumMaps] = useState({});

	function callBitrix(method, params = {}) {
		return new Promise((resolve, reject) => {
			window.BX24.callMethod(method, params, (result) => {
				if (result.error()) {
					reject(result.error());
					return;
				}
				resolve(result.data());
			});
		});
	}

	async function reloadEntries(userId, maps = enumMaps) {
		const data = await callBitrix("crm.item.list", {
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
				[FIELD_EMPLOYEE]: Number(userId),
			},
		});

		const rawItems = data?.items || [];
		const normalizedItems = rawItems
			.map((item) => normalizeEntry(item, maps))
			.filter((item) => !isComedorEntry(item));

		setEntries(normalizedItems);
	}

	async function getOccupiedDeskIds({
		date,
		office,
		room,
		startTime,
		endTime,
		excludeEntryId,
	}) {
		if (!date || !office || !room || !startTime || !endTime) {
			return [];
		}

		const centerValue = resolveEnumId(enumMaps, FIELD_CENTER, office);

		const data = await callBitrix("crm.item.list", {
			entityTypeId: ENTITY_TYPE_ID,
			select: [
				"id",
				FIELD_CENTER,
				FIELD_ROOM,
				FIELD_RESOURCE,
				FIELD_RESOURCE_TYPE,
				FIELD_DATE,
				FIELD_START,
				FIELD_END,
				FIELD_STATUS,
				FIELD_NOTES,
			],
			filter: {
				[FIELD_DATE]: date,
				[FIELD_CENTER]: centerValue,
				[FIELD_ROOM]: room,
			},
		});

		const items = data?.items || [];

		return items
			.filter((item) => {
				if (excludeEntryId && Number(item.id) === Number(excludeEntryId)) {
					return false;
				}

				const normalizedItem = normalizeEntry(item, enumMaps);
				if (isComedorEntry(normalizedItem)) {
					return false;
				}

				const status = String(
					normalizedItem[FIELD_STATUS] ?? ""
				).toLowerCase();

				if (status === "cancelada") {
					return false;
				}

				const resource = String(normalizedItem[FIELD_RESOURCE] ?? "").trim();
				if (
					!resource ||
					resource.toLowerCase() === "teletrabajo" ||
					resource.toLowerCase() === "evento" ||
					resource.toLowerCase() === "ausencia"
				) {
					return false;
				}

				const itemStart = normalizeTimeValue(normalizedItem[FIELD_START]);
				const itemEnd = normalizeTimeValue(normalizedItem[FIELD_END]);

				if (!itemStart || !itemEnd) {
					return false;
				}

				return rangesOverlap(startTime, endTime, itemStart, itemEnd);
			})
			.map((item) => String(item[FIELD_RESOURCE]))
			.filter(Boolean);
	}

	useEffect(() => {
		if (!window.BX24) {
			setError("BX24 no está disponible en la ventana.");
			setLoading(false);
			return;
		}

		window.BX24.init(async () => {
			try {
				const [user, fieldsResponse] = await Promise.all([
					callBitrix("user.current", {}),
					callBitrix("crm.item.fields", { entityTypeId: ENTITY_TYPE_ID }),
				]);

				const builtEnumMaps = createEnumMaps(fieldsResponse?.fields || {});

				setCurrentUser(user);
				setEnumMaps(builtEnumMaps);

				await reloadEntries(user.ID, builtEnumMaps);
				setLoading(false);
			} catch (err) {
				console.error(err);
				setError("No se pudo cargar el calendario.");
				setLoading(false);
			}
		});
	}, []);

	const visibleMonthEntries = useMemo(() => {
		const year = currentMonth.getFullYear();
		const month = currentMonth.getMonth();

		return entries.filter((entry) => {
			const normalizedDate = normalizeBitrixDate(entry[FIELD_DATE]);
			if (!normalizedDate) return false;

			const [entryYear, entryMonth] = normalizedDate.split("-").map(Number);
			return entryYear === year && entryMonth - 1 === month;
		});
	}, [entries, currentMonth]);

	const entriesByDate = useMemo(
		() => dedupeEntriesByDate(visibleMonthEntries),
		[visibleMonthEntries]
	);

	const calendarCells = useMemo(
		() => buildCalendarCells(currentMonth, entriesByDate, selectedDate),
		[currentMonth, entriesByDate, selectedDate]
	);

	const selectedEntry = selectedDate ? entriesByDate.get(selectedDate) ?? null : null;
	const monthLabel = `${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;

	function handlePrevMonth() {
		setMonthLoading(true);
		setCurrentMonth(
			new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
		);
		setTimeout(() => setMonthLoading(false), 150);
	}

	function handleNextMonth() {
		setMonthLoading(true);
		setCurrentMonth(
			new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
		);
		setTimeout(() => setMonthLoading(false), 150);
	}

	function handleSelectDay(dateValue) {
		setSelectedDate(dateValue);
		setIsDayModalOpen(true);
	}

	function handleCloseDayModal() {
		setIsDayModalOpen(false);
	}

	function openConfirmation(success, title, message) {
		setConfirmation({ success, title, message });
	}

	async function handleSaveWork(payload) {
		try {
			if (!payload.remote && !payload.event && payload.selectedDesk) {
				const occupiedDeskIds = await getOccupiedDeskIds({
					date: payload.date,
					office: payload.office,
					room: payload.room,
					startTime: payload.startTime,
					endTime: payload.endTime,
					excludeEntryId: payload.editingEntry?.id,
				});

				if (occupiedDeskIds.includes(String(payload.selectedDesk))) {
					openConfirmation(
						false,
						"Mesa no disponible",
						`La mesa ${payload.selectedDesk} ya está ocupada en ese tramo horario.`
					);
					return;
				}
			}

			const centerValue = resolveEnumId(enumMaps, FIELD_CENTER, payload.office);
			const resourceTypeValue = resolveEnumId(
				enumMaps,
				FIELD_RESOURCE_TYPE,
				payload.event ? "sala" : "puesto"
			);
			const bookingModeValue = resolveEnumId(
				enumMaps,
				FIELD_BOOKING_MODE,
				payload.event ? "completa" : "individual"
			);
			const statusValue = resolveEnumId(enumMaps, FIELD_STATUS, "activa");

			const resourceValue = payload.event
				? "Evento"
				: payload.remote
					? "Teletrabajo"
					: payload.selectedDesk;

			const notesValue = payload.event
				? "evento"
				: payload.remote
					? "teletrabajo"
					: "";

			const fields = {
				title: payload.editingEntry?.title || `Jornada ${payload.date}`,
				[FIELD_EMPLOYEE]: Number(currentUser.ID),
				[FIELD_CENTER]: centerValue,
				[FIELD_ROOM]: payload.room,
				[FIELD_RESOURCE]: resourceValue,
				[FIELD_RESOURCE_TYPE]: resourceTypeValue,
				[FIELD_BOOKING_MODE]: bookingModeValue,
				[FIELD_DATE]: payload.date,
				[FIELD_START]: toBitrixDateTime(payload.date, payload.startTime),
				[FIELD_END]: toBitrixDateTime(payload.date, payload.endTime),
				[FIELD_STATUS]: statusValue,
				[FIELD_NOTES]: notesValue,
				[FIELD_FULL_DAY]: "N",
			};

			if (payload.editingEntry?.id) {
				await callBitrix("crm.item.update", {
					entityTypeId: ENTITY_TYPE_ID,
					id: Number(payload.editingEntry.id),
					fields,
				});
			} else {
				await callBitrix("crm.item.add", {
					entityTypeId: ENTITY_TYPE_ID,
					fields,
				});
			}

			await reloadEntries(currentUser.ID);
			setIsDayModalOpen(false);

			openConfirmation(
				true,
				payload.editingEntry ? "Jornada actualizada" : "Jornada creada",
				`Se ha guardado correctamente la jornada del día ${formatHumanDate(payload.date)}.`
			);
		} catch (err) {
			console.error("Error guardando jornada:", err);
			openConfirmation(
				false,
				"No se pudo guardar",
				"Ha ocurrido un error al guardar la jornada en Bitrix."
			);
		}
	}

	async function handleSaveAbsence(payload) {
		try {
			const fields = {
				title: payload.editingEntry?.title || `Ausencia ${payload.date}`,
				[FIELD_EMPLOYEE]: Number(currentUser.ID),
				[FIELD_CENTER]: null,
				[FIELD_ROOM]: "",
				[FIELD_RESOURCE]: "Ausencia",
				[FIELD_RESOURCE_TYPE]: resolveEnumId(enumMaps, FIELD_RESOURCE_TYPE, "puesto"),
				[FIELD_BOOKING_MODE]: resolveEnumId(enumMaps, FIELD_BOOKING_MODE, "individual"),
				[FIELD_DATE]: payload.date,
				[FIELD_START]: null,
				[FIELD_END]: null,
				[FIELD_STATUS]: resolveEnumId(enumMaps, FIELD_STATUS, "cancelada"),
				[FIELD_NOTES]: "no trabaja",
				[FIELD_FULL_DAY]: "Y",
			};

			if (payload.editingEntry?.id) {
				await callBitrix("crm.item.update", {
					entityTypeId: ENTITY_TYPE_ID,
					id: Number(payload.editingEntry.id),
					fields,
				});
			} else {
				await callBitrix("crm.item.add", {
					entityTypeId: ENTITY_TYPE_ID,
					fields,
				});
			}

			await reloadEntries(currentUser.ID);
			setIsDayModalOpen(false);

			openConfirmation(
				true,
				payload.editingEntry ? "Ausencia actualizada" : "Ausencia creada",
				`Se ha guardado correctamente el día ${formatHumanDate(payload.date)} como no trabaja.`
			);
		} catch (err) {
			console.error("Error guardando ausencia:", err);
			openConfirmation(
				false,
				"No se pudo guardar",
				"Ha ocurrido un error al guardar el registro de ausencia en Bitrix."
			);
		}
	}

	async function handleDelete(payload) {
		const entryId = payload?.editingEntry?.id;
		const entryDate = payload?.date;

		if (!entryId) return;

		try {
			await callBitrix("crm.item.delete", {
				entityTypeId: ENTITY_TYPE_ID,
				id: Number(entryId),
			});

			setEntries((prev) => prev.filter((item) => Number(item.id) !== Number(entryId)));

			await reloadEntries(currentUser.ID);

			setIsDayModalOpen(false);
			setSelectedDate(null);

			openConfirmation(
				true,
				"Registro eliminado",
				`Se ha eliminado correctamente el registro del día ${formatHumanDate(entryDate)}.`
			);
		} catch (err) {
			console.error("Error eliminando:", err);
			openConfirmation(
				false,
				"No se pudo eliminar",
				"Ha ocurrido un error al eliminar el registro en Bitrix."
			);
		}
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
		<>
			<div className="space-y-4">
				<ReservationCalendarGrid
					monthLabel={monthLabel}
					monthLoading={monthLoading}
					cells={calendarCells}
					onPrevMonth={handlePrevMonth}
					onNextMonth={handleNextMonth}
					onSelectDay={handleSelectDay}
				/>


			</div>

			<ReservationDayModal
				isOpen={isDayModalOpen}
				selectedDate={selectedDate}
				selectedEntry={mapEntryForModal(selectedEntry, enumMaps)}
				onClose={handleCloseDayModal}
				onSaveWork={handleSaveWork}
				onSaveAbsence={handleSaveAbsence}
				onDelete={handleDelete}
				getOccupiedDeskIds={getOccupiedDeskIds}
			/>

			{confirmation ? (
				<div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm">
					<div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
						<div
							className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl ${confirmation.success ? "bg-emerald-100" : "bg-rose-100"
								}`}
						>
							{confirmation.success ? "✅" : "❌"}
						</div>

						<h3 className="text-xl font-semibold text-slate-900">
							{confirmation.title}
						</h3>

						<p className="mt-3 text-sm leading-6 text-slate-600">
							{confirmation.message}
						</p>

						<div className="mt-6 flex justify-end">
							<button
								type="button"
								onClick={() => setConfirmation(null)}
								className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
							>
								Cerrar
							</button>
						</div>
					</div>
				</div>
			) : null}
		</>
	);
}
