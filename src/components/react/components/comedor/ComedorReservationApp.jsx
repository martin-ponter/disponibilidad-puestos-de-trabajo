import React, { useEffect, useMemo, useState } from "react";
import ComedorMapReact from "./ComedorMapReact.jsx";

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

const CENTER_OPTIONS = ["Toledo", "Madrid", "Alcobendas", "Consuegra"];
const COMEDOR_ROOM_BY_OFFICE = {
	Toledo: "Comedor Toledo",
	Madrid: "Comedor Madrid",
	Alcobendas: "Comedor Alcobendas",
	Consuegra: "Comedor Consuegra",
};

const DEFAULT_START_TIME = "14:00";
const DEFAULT_END_TIME = "15:00";

function formatDate(date) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

function formatHumanDate(dateString) {
	if (!dateString) return "";
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

function isActiveEntry(entry) {
	const status = String(entry?.[FIELD_STATUS] ?? "").toLowerCase();
	return status !== "cancelada";
}

function getTodayDate() {
	const today = new Date();
	return formatDate(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
}

export default function ComedorReservationApp() {
	const [currentUser, setCurrentUser] = useState(null);
	const [entries, setEntries] = useState([]);
	const [enumMaps, setEnumMaps] = useState({});
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const [confirmation, setConfirmation] = useState(null);

	const [date, setDate] = useState(getTodayDate());
	const [office, setOffice] = useState("");
	const [startTime, setStartTime] = useState(DEFAULT_START_TIME);
	const [endTime, setEndTime] = useState(DEFAULT_END_TIME);
	const [selectedSeat, setSelectedSeat] = useState(null);
	const [occupiedSeatIds, setOccupiedSeatIds] = useState([]);
	const [loadingOccupied, setLoadingOccupied] = useState(false);

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
			.filter((item) => isComedorEntry(item));
		setEntries(normalizedItems);
	}

	async function getOccupiedSeatIds({
		date,
		office,
		startTime,
		endTime,
		excludeEntryId,
	}) {
		if (!date || !office || !startTime || !endTime) {
			return [];
		}

		const room = COMEDOR_ROOM_BY_OFFICE[office];
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

				const normalized = normalizeEntry(item, enumMaps);

				if (!isComedorEntry(normalized) || !isActiveEntry(normalized)) {
					return false;
				}

				const itemStart = normalizeTimeValue(normalized[FIELD_START]);
				const itemEnd = normalizeTimeValue(normalized[FIELD_END]);

				if (!itemStart || !itemEnd) return false;

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
				setError("No se pudo cargar la reserva de comedor.");
				setLoading(false);
			}
		});
	}, []);

	const userComedorEntries = useMemo(() => {
		return entries.filter((entry) => isComedorEntry(entry));
	}, [entries]);

	const currentReservation = useMemo(() => {
		return (
			userComedorEntries
				.filter((entry) => normalizeBitrixDate(entry[FIELD_DATE]) === date)
				.sort((a, b) => Number(b.id) - Number(a.id))[0] || null
		);
	}, [userComedorEntries, date]);

	useEffect(() => {
		if (!currentReservation) {
			setOffice("");
			setStartTime(DEFAULT_START_TIME);
			setEndTime(DEFAULT_END_TIME);
			setSelectedSeat(null);
			return;
		}

		setOffice(String(currentReservation[FIELD_CENTER] ?? ""));
		setStartTime(normalizeTimeValue(currentReservation[FIELD_START]) || DEFAULT_START_TIME);
		setEndTime(normalizeTimeValue(currentReservation[FIELD_END]) || DEFAULT_END_TIME);
		setSelectedSeat(String(currentReservation[FIELD_RESOURCE] ?? "") || null);
	}, [currentReservation]);

	useEffect(() => {
		let cancelled = false;

		async function loadOccupiedSeats() {
			if (!date || !office || !startTime || !endTime || typeof getOccupiedSeatIds !== "function") {
				setOccupiedSeatIds([]);
				return;
			}

			try {
				setLoadingOccupied(true);

				const occupied = await getOccupiedSeatIds({
					date,
					office,
					startTime,
					endTime,
					excludeEntryId: currentReservation?.id,
				});

				if (cancelled) return;
				setOccupiedSeatIds((occupied || []).map(String));
			} catch (err) {
				console.error("Error cargando ocupación de comedor:", err);
				if (cancelled) return;
				setOccupiedSeatIds([]);
			} finally {
				if (!cancelled) {
					setLoadingOccupied(false);
				}
			}
		}

		loadOccupiedSeats();

		return () => {
			cancelled = true;
		};
	}, [date, office, startTime, endTime, currentReservation?.id]);

	useEffect(() => {
		if (!selectedSeat) return;
		if (!occupiedSeatIds.includes(String(selectedSeat))) return;
		setSelectedSeat(null);
	}, [occupiedSeatIds, selectedSeat]);

	function openConfirmation(success, title, message) {
		setConfirmation({ success, title, message });
	}

	const canSave =
		date &&
		office &&
		startTime &&
		endTime &&
		selectedSeat &&
		startTime < endTime &&
		!loadingOccupied &&
		!saving;

	async function handleSave() {
		if (!canSave) return;

		try {
			setSaving(true);

			const occupiedSeatIdsNow = await getOccupiedSeatIds({
				date,
				office,
				startTime,
				endTime,
				excludeEntryId: currentReservation?.id,
			});

			if (occupiedSeatIdsNow.includes(String(selectedSeat))) {
				openConfirmation(
					false,
					"Asiento no disponible",
					`El asiento ${selectedSeat} ya está ocupado en ese tramo horario.`
				);
				setSaving(false);
				return;
			}

			const centerValue = resolveEnumId(enumMaps, FIELD_CENTER, office);
			const resourceTypeValue = resolveEnumId(enumMaps, FIELD_RESOURCE_TYPE, "comedor");
			const bookingModeValue = resolveEnumId(enumMaps, FIELD_BOOKING_MODE, "individual");
			const statusValue = resolveEnumId(enumMaps, FIELD_STATUS, "activa");
			const roomValue = COMEDOR_ROOM_BY_OFFICE[office];

			const fields = {
				title: currentReservation?.title || `Reserva comedor ${date}`,
				[FIELD_EMPLOYEE]: Number(currentUser.ID),
				[FIELD_CENTER]: centerValue,
				[FIELD_ROOM]: roomValue,
				[FIELD_RESOURCE]: selectedSeat,
				[FIELD_RESOURCE_TYPE]: resourceTypeValue,
				[FIELD_BOOKING_MODE]: bookingModeValue,
				[FIELD_DATE]: date,
				[FIELD_START]: toBitrixDateTime(date, startTime),
				[FIELD_END]: toBitrixDateTime(date, endTime),
				[FIELD_STATUS]: statusValue,
				[FIELD_NOTES]: "reserva comedor",
				[FIELD_FULL_DAY]: "N",
			};

			if (currentReservation?.id) {
				await callBitrix("crm.item.update", {
					entityTypeId: ENTITY_TYPE_ID,
					id: Number(currentReservation.id),
					fields,
				});
			} else {
				await callBitrix("crm.item.add", {
					entityTypeId: ENTITY_TYPE_ID,
					fields,
				});
			}

			await reloadEntries(currentUser.ID);

			openConfirmation(
				true,
				currentReservation ? "Reserva actualizada" : "Reserva creada",
				`Se ha guardado correctamente tu reserva de comedor del día ${formatHumanDate(
					date
				)} en ${office}, asiento ${selectedSeat}, de ${startTime} a ${endTime}.`
			);
		} catch (err) {
			console.error("Error guardando reserva de comedor:", err);
			openConfirmation(
				false,
				"No se pudo guardar",
				"Ha ocurrido un error al guardar la reserva de comedor en Bitrix."
			);
		} finally {
			setSaving(false);
		}
	}

	async function handleDelete() {
		if (!currentReservation?.id) return;

		try {
			setSaving(true);

			await callBitrix("crm.item.delete", {
				entityTypeId: ENTITY_TYPE_ID,
				id: Number(currentReservation.id),
			});

			await reloadEntries(currentUser.ID);
			setSelectedSeat(null);
			setOffice("");
			setStartTime(DEFAULT_START_TIME);
			setEndTime(DEFAULT_END_TIME);

			openConfirmation(
				true,
				"Reserva eliminada",
				`Se ha eliminado correctamente tu reserva de comedor del día ${formatHumanDate(
					date
				)}.`
			);
		} catch (err) {
			console.error("Error eliminando reserva de comedor:", err);
			openConfirmation(
				false,
				"No se pudo eliminar",
				"Ha ocurrido un error al eliminar la reserva de comedor en Bitrix."
			);
		} finally {
			setSaving(false);
		}
	}

	if (loading) {
		return (
			<div className="rounded-[28px] border border-slate-200 bg-slate-50 p-8 text-center">
				<div className="mx-auto max-w-md">
					<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
						⏳
					</div>
					<h3 className="text-lg font-semibold text-slate-900">Cargando comedor</h3>
					<p className="mt-2 text-sm leading-6 text-slate-500">
						Estamos obteniendo la información desde Bitrix.
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
						No se pudo cargar la reserva de comedor
					</h3>
					<p className="mt-2 text-sm leading-6 text-slate-600">{error}</p>
				</div>
			</div>
		);
	}

	return (
		<>
			<div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
				<aside className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
					<div className="mb-5">
						<h3 className="text-lg font-semibold text-slate-900">Datos de la reserva</h3>
						<p className="mt-1 text-sm text-slate-500">
							Configura la oficina, el día y el tramo horario para cargar el mapa del comedor.
						</p>
					</div>

					<div className="space-y-5">
						<div>
							<label className="mb-2 block text-sm font-medium text-slate-700">
								Fecha
							</label>
							<input
								type="date"
								value={date}
								min={getTodayDate()}
								onChange={(e) => setDate(e.target.value)}
								className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
							/>
						</div>

						<div>
							<label className="mb-2 block text-sm font-medium text-slate-700">
								Oficina
							</label>
							<select
								value={office}
								onChange={(e) => {
									setOffice(e.target.value);
									setSelectedSeat(null);
								}}
								className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
							>
								<option value="">Selecciona una oficina</option>
								{CENTER_OPTIONS.map((option) => (
									<option key={option} value={option}>
										{option}
									</option>
								))}
							</select>
						</div>

						<div className="grid gap-4 sm:grid-cols-2">
							<div>
								<label className="mb-2 block text-sm font-medium text-slate-700">
									Hora de inicio
								</label>
								<input
									value={startTime}
									onChange={(e) => setStartTime(e.target.value)}
									type="time"
									className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
								/>
							</div>

							<div>
								<label className="mb-2 block text-sm font-medium text-slate-700">
									Hora de fin
								</label>
								<input
									value={endTime}
									onChange={(e) => setEndTime(e.target.value)}
									type="time"
									className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
								/>
							</div>
						</div>

						<div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
							<p className="text-sm leading-6 text-blue-800">
								Este flujo usa un plano provisional del comedor. Más adelante podrás sustituirlo
								por el mapa real manteniendo esta misma lógica.
							</p>
						</div>

						{currentReservation ? (
							<div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
								<p className="text-sm font-medium text-amber-800">
									Ya tienes una reserva ese día
								</p>
								<p className="mt-1 text-sm leading-6 text-amber-700">
									Se han cargado tus datos actuales para que puedas editarlos o eliminar la
									reserva.
								</p>
							</div>
						) : null}

						{selectedSeat ? (
							<div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
								<p className="text-sm font-medium text-blue-800">
									Asiento seleccionado
								</p>
								<p className="mt-1 text-sm text-blue-700">{selectedSeat}</p>
							</div>
						) : null}
					</div>
				</aside>

				<section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
					<div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<h3 className="text-lg font-semibold text-slate-900">Mapa del comedor</h3>
							<p className="mt-1 text-sm text-slate-500">
								{office
									? `${office} · ${COMEDOR_ROOM_BY_OFFICE[office]}`
									: "Selecciona una oficina para visualizar el plano del comedor."}
							</p>
							{loadingOccupied ? (
								<p className="mt-1 text-xs text-slate-400">
									Comprobando ocupación de asientos...
								</p>
							) : null}
						</div>

						<div className="flex flex-wrap gap-2 text-xs">
							<span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-medium text-emerald-700">
								Disponible
							</span>
							<span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 font-medium text-rose-700">
								Ocupado
							</span>
							<span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 font-medium text-blue-700">
								Seleccionado
							</span>
						</div>
					</div>

					{!office ? (
						<div className="flex min-h-[460px] items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
							<div className="max-w-md">
								<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
									🍽️
								</div>
								<h4 className="text-lg font-semibold text-slate-900">
									Aún no hay comedor cargado
								</h4>
								<p className="mt-2 text-sm leading-6 text-slate-500">
									Cuando elijas una oficina aparecerá aquí el plano provisional del comedor.
								</p>
							</div>
						</div>
					) : (
						<div className="overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50 p-4 sm:p-6">
							<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
								<div className="rounded-2xl bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
									Haz clic en un asiento disponible
								</div>

								{selectedSeat ? (
									<div className="rounded-2xl border border-blue-200 bg-white px-4 py-2 text-sm text-blue-700">
										Seleccionado: {selectedSeat}
									</div>
								) : null}
							</div>

							<ComedorMapReact
								office={office}
								selectedSeat={selectedSeat}
								onSelectSeat={setSelectedSeat}
								occupiedSeatIds={occupiedSeatIds}
							/>
						</div>
					)}

					<div className="mt-6 flex flex-wrap justify-end gap-3">
						{currentReservation ? (
							<button
								type="button"
								onClick={handleDelete}
								disabled={saving}
								className="inline-flex items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
							>
								Eliminar reserva
							</button>
						) : null}

						<button
							type="button"
							disabled={!canSave}
							onClick={handleSave}
							className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:scale-[1.01] hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
						>
							{currentReservation ? "Guardar cambios" : "Guardar reserva"}
						</button>
					</div>
				</section>
			</div>

			{confirmation ? (
				<div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm">
					<div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
						<div
							className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl ${
								confirmation.success ? "bg-emerald-100" : "bg-rose-100"
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
