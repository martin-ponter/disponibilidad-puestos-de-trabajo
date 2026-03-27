import { useEffect, useMemo, useState } from "react";
import { officeMaps } from "../../../../data/maps/office-maps.js";
import OfficeMapReact from "../ver-mesas/OfficeMapReact.jsx";

const CUSTOM_OFFICE_ROOMS = Object.values(officeMaps).reduce((acc, map) => {
	if (!acc[map.office]) {
		acc[map.office] = [];
	}

	if (!acc[map.office].includes(map.room)) {
		acc[map.office].push(map.room);
	}

	return acc;
}, {});

const OFFICE_ROOMS = CUSTOM_OFFICE_ROOMS;

const OFFICE_DESK_DATA = {
	Madrid: [
		{ id: "M1" },
		{ id: "M2" },
		{ id: "M3" },
		{ id: "M4" },
		{ id: "M5" },
		{ id: "M6" },
		{ id: "M7" },
		{ id: "M8" },
	],
	Consuegra: [
		{ id: "C1" },
		{ id: "C2" },
		{ id: "C3" },
		{ id: "C4" },
		{ id: "C5" },
		{ id: "C6" },
		{ id: "C7" },
		{ id: "C8" },
	],
};

const CENTER_OPTIONS = ["Toledo", "Madrid", "Consuegra"];
const DEFAULT_START_TIME = "09:00";
const DEFAULT_END_TIME = "18:00";

function formatHumanDate(dateString) {
	const [year, month, day] = dateString.split("-");
	return `${day}/${month}/${year}`;
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

function inferMode(entry) {
	if (!entry) return "office";

	const resourceType = String(entry.resourceType ?? "").toLowerCase();
	const resource = String(entry.resource ?? "").toLowerCase();
	const room = String(entry.room ?? "").toLowerCase();
	const notes = String(entry.notes ?? "").toLowerCase();
	const status = String(entry.status ?? "").toLowerCase();

	if (status === "cancelada" || status === "bloqueada") {
		return "not-works";
	}

	if (
		resourceType === "sala" ||
		resource.includes("evento") ||
		room.includes("evento") ||
		notes.includes("evento")
	) {
		return "event";
	}

	if (
		resource.includes("teletrabajo") ||
		room.includes("teletrabajo") ||
		notes.includes("teletrabajo") ||
		notes.includes("remoto")
	) {
		return "remote";
	}

	return "office";
}

export default function ReservationDayModal({
	isOpen,
	selectedDate,
	selectedEntry,
	onClose,
	onSaveWork,
	onSaveAbsence,
	onDelete,
	getOccupiedDeskIds,
}) {
	const modeFromEntry = inferMode(selectedEntry);
	const isEdit = Boolean(selectedEntry);

	const [workStatus, setWorkStatus] = useState("works");
	const [office, setOffice] = useState("");
	const [room, setRoom] = useState("");
	const [startTime, setStartTime] = useState(DEFAULT_START_TIME);
	const [endTime, setEndTime] = useState(DEFAULT_END_TIME);
	const [remote, setRemote] = useState(false);
	const [event, setEvent] = useState(false);
	const [selectedDesk, setSelectedDesk] = useState(null);
	const [occupiedDeskIds, setOccupiedDeskIds] = useState([]);
	const [loadingOccupied, setLoadingOccupied] = useState(false);

	useEffect(() => {
		if (!isOpen) return;

		if (!selectedEntry) {
			setWorkStatus("works");
			setOffice("");
			setRoom("");
			setStartTime(DEFAULT_START_TIME);
			setEndTime(DEFAULT_END_TIME);
			setRemote(false);
			setEvent(false);
			setSelectedDesk(null);
			setOccupiedDeskIds([]);
			return;
		}

		if (modeFromEntry === "not-works") {
			setWorkStatus("not-works");
			setOffice("");
			setRoom("");
			setStartTime(DEFAULT_START_TIME);
			setEndTime(DEFAULT_END_TIME);
			setRemote(false);
			setEvent(false);
			setSelectedDesk(null);
			setOccupiedDeskIds([]);
			return;
		}

		setWorkStatus("works");
		setOffice(typeof selectedEntry.center === "string" ? selectedEntry.center : "");
		setRoom(selectedEntry.room || "");
		setStartTime(normalizeTimeValue(selectedEntry.start) || DEFAULT_START_TIME);
		setEndTime(normalizeTimeValue(selectedEntry.end) || DEFAULT_END_TIME);
		setRemote(modeFromEntry === "remote");
		setEvent(modeFromEntry === "event");
		setSelectedDesk(modeFromEntry === "office" ? selectedEntry.resource || null : null);
	}, [isOpen, selectedEntry, modeFromEntry]);

	useEffect(() => {
		let cancelled = false;

		async function loadOccupiedDesks() {
			if (
				!isOpen ||
				workStatus !== "works" ||
				remote ||
				event ||
				!selectedDate ||
				!office ||
				!room ||
				!startTime ||
				!endTime ||
				typeof getOccupiedDeskIds !== "function"
			) {
				setOccupiedDeskIds([]);
				return;
			}

			try {
				setLoadingOccupied(true);

				const occupied = await getOccupiedDeskIds({
					date: selectedDate,
					office,
					room,
					startTime,
					endTime,
					excludeEntryId: selectedEntry?.id,
				});

				if (cancelled) return;

				setOccupiedDeskIds((occupied || []).map(String));
			} catch (error) {
				console.error("Error cargando mesas ocupadas:", error);
				if (cancelled) return;
				setOccupiedDeskIds([]);
			} finally {
				if (!cancelled) {
					setLoadingOccupied(false);
				}
			}
		}

		loadOccupiedDesks();

		return () => {
			cancelled = true;
		};
	}, [
		isOpen,
		workStatus,
		remote,
		event,
		selectedDate,
		office,
		room,
		startTime,
		endTime,
		selectedEntry?.id,
		getOccupiedDeskIds,
	]);

	useEffect(() => {
		if (!selectedDesk) return;
		if (!occupiedDeskIds.includes(String(selectedDesk))) return;
		setSelectedDesk(null);
	}, [occupiedDeskIds, selectedDesk]);

	const roomOptions = useMemo(() => {
		return office ? OFFICE_ROOMS[office] || [] : [];
	}, [office]);

	const deskOptions = useMemo(() => {
		return office ? OFFICE_DESK_DATA[office] || [] : [];
	}, [office]);

	const noDeskNeeded = remote || event;
	const needsOffice = !remote;
	const needsRoom = !remote && !event;

	const canSaveWork =
		workStatus === "works" &&
		startTime &&
		endTime &&
		(!needsOffice || office) &&
		(!needsRoom || room) &&
		(noDeskNeeded || selectedDesk) &&
		!loadingOccupied;

	if (!isOpen || !selectedDate) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm">
			<div className="max-h-[90vh] w-full max-w-6xl overflow-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
				<div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur sm:px-6">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<div className="flex flex-wrap items-center gap-3">
								<h3 className="text-xl font-semibold text-slate-900">
									{isEdit ? "Editar jornada" : "Gestionar jornada"}
								</h3>

								{isEdit ? (
									<span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
										Editando registro
									</span>
								) : null}
							</div>

							<p className="mt-1 text-sm text-slate-500">
								Fecha seleccionada: {formatHumanDate(selectedDate)}
							</p>

							{selectedEntry ? (
								<p className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
									Registro actual cargado para edición.
								</p>
							) : null}
						</div>

						<div className="flex flex-wrap items-center gap-3">
							{isEdit ? (
								<button
									type="button"
									onClick={() =>
										onDelete({
											date: selectedDate,
											editingEntry: selectedEntry,
										})
									}
									className="inline-flex items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
								>
									Eliminar registro
								</button>
							) : null}

							<button
								type="button"
								onClick={onClose}
								className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
							>
								Cerrar
							</button>
						</div>
					</div>
				</div>

				<div className="p-5 sm:p-6">
					<div className="mb-6">
						<h4 className="text-base font-semibold text-slate-900">¿Trabajas este día?</h4>
						<p className="mt-1 text-sm text-slate-500">
							Indica si trabajas o si ese día no estarás disponible.
						</p>
					</div>

					<div className="grid gap-4 md:grid-cols-2">
						<button
							type="button"
							onClick={() => setWorkStatus("works")}
							className={`rounded-3xl border p-5 text-left shadow-sm transition ${workStatus === "works"
								? "border-blue-400 bg-blue-50 ring-2 ring-blue-200"
								: "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50"
								}`}
						>
							<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-2xl">
								💼
							</div>
							<h5 className="text-lg font-semibold text-slate-900">Trabaja</h5>
							<p className="mt-2 text-sm leading-6 text-slate-600">
								Trabajaré ese día. Puede ser en oficina, teletrabajo o asistiendo a un evento.
							</p>
						</button>

						<button
							type="button"
							onClick={() => setWorkStatus("not-works")}
							className={`rounded-3xl border p-5 text-left shadow-sm transition ${workStatus === "not-works"
								? "border-blue-400 bg-blue-50 ring-2 ring-blue-200"
								: "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50"
								}`}
						>
							<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-2xl">
								🌴
							</div>
							<h5 className="text-lg font-semibold text-slate-900">No trabaja</h5>
							<p className="mt-2 text-sm leading-6 text-slate-600">
								Ese día no trabajaré. Se registrará simplemente como no trabaja.
							</p>
						</button>
					</div>

					{workStatus === "works" ? (
						<div className="mt-8 grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
							<aside className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
								<div className="mb-5">
									<h4 className="text-lg font-semibold text-slate-900">Datos de la jornada</h4>
									<p className="mt-1 text-sm text-slate-500">
										Completa la información para cargar el plano y gestionar tu reserva.
									</p>
								</div>

								<div className="space-y-5">
									<div>
										<label className="mb-2 block text-sm font-medium text-slate-700">
											Oficina
										</label>
										<select
											value={office}
											onChange={(e) => {
												setOffice(e.target.value);
												setRoom("");
												setSelectedDesk(null);
											}}
											disabled={remote}
											className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-70 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
										>
											<option value="">
												{remote ? "No es necesaria para teletrabajo" : "Selecciona una oficina"}
											</option>
											{CENTER_OPTIONS.map((option) => (
												<option key={option} value={option}>
													{option}
												</option>
											))}
										</select>
									</div>

									<div>
										<label className="mb-2 block text-sm font-medium text-slate-700">
											Sala
										</label>
										<select
											value={room}
											onChange={(e) => {
												setRoom(e.target.value);
												setSelectedDesk(null);
											}}
											disabled={!office || noDeskNeeded}
											className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-70 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
										>
											<option value="">
												{!office
													? "Primero elige una oficina"
													: noDeskNeeded
														? "No es necesaria para teletrabajo o evento"
														: "Selecciona una sala"}
											</option>
											{roomOptions.map((option) => (
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
											Por defecto se propone una jornada completa de 09:00 a 18:00. Puedes cambiarla si lo necesitas.
										</p>
									</div>

									<div className="rounded-2xl border border-slate-200 bg-white p-4">
										<p className="mb-3 text-sm font-medium text-slate-700">Tipo de jornada</p>

										<label className="flex items-start gap-3 rounded-2xl border border-slate-200 p-3 transition hover:bg-slate-50">
											<input
												checked={remote}
												onChange={(e) => {
													const checked = e.target.checked;
													setRemote(checked);
													if (checked) {
														setEvent(false);
														setOffice("");
														setRoom("");
													}
													setSelectedDesk(null);
												}}
												type="checkbox"
												className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
											/>
											<div>
												<span className="block text-sm font-medium text-slate-900">
													Teletrabajo
												</span>
												<span className="mt-1 block text-sm text-slate-500">
													No necesito reservar una mesa en oficina.
												</span>
											</div>
										</label>

										<label className="mt-3 flex items-start gap-3 rounded-2xl border border-slate-200 p-3 transition hover:bg-slate-50">
											<input
												checked={event}
												onChange={(e) => {
													const checked = e.target.checked;
													setEvent(checked);
													if (checked) {
														setRemote(false);
														setRoom("");
													}
													setSelectedDesk(null);
												}}
												type="checkbox"
												className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
											/>
											<div>
												<span className="block text-sm font-medium text-slate-900">
													Evento
												</span>
												<span className="mt-1 block text-sm text-slate-500">
													Estaré fuera de mi puesto habitual y no necesito mesa.
												</span>
											</div>
										</label>
									</div>
								</div>
							</aside>

							<section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
								<div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
									<div>
										<h4 className="text-lg font-semibold text-slate-900">Mapa de la oficina</h4>
										<p className="mt-1 text-sm text-slate-500">
											{office && room
												? `${office} · ${room}`
												: noDeskNeeded
													? "Sin necesidad de mesa"
													: "Selecciona una oficina y una sala para visualizar el plano."}
										</p>
										{loadingOccupied && !noDeskNeeded ? (
											<p className="mt-1 text-xs text-slate-400">
												Comprobando ocupación de mesas...
											</p>
										) : null}
									</div>

									{selectedDesk ? (
										<div className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
											Mesa seleccionada: <span>{selectedDesk}</span>
										</div>
									) : null}
								</div>

								{noDeskNeeded ? (
									<div className="rounded-[28px] border border-blue-200 bg-blue-50 p-6">
										<h5 className="text-lg font-semibold text-slate-900">
											No necesitas seleccionar mesa
										</h5>
										<p className="mt-2 text-sm leading-6 text-slate-600">
											Has marcado teletrabajo o evento. Podrás guardar la jornada sin reservar un
											puesto físico.
										</p>
									</div>
								) : !office || !room ? (
									<div className="flex min-h-[420px] items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
										<div className="max-w-md">
											<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
												🗺️
											</div>
											<h5 className="text-lg font-semibold text-slate-900">Aún no hay plano cargado</h5>
											<p className="mt-2 text-sm leading-6 text-slate-500">
												Cuando elijas una oficina y una sala aparecerá aquí el mapa provisional.
											</p>
										</div>
									</div>
								) : (
									<div className="overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50 p-4 sm:p-6">
										<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
											<div className="rounded-2xl bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
												Plano de ocupación
											</div>
											<div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600">
												Haz clic en una mesa disponible
											</div>
										</div>

										<OfficeMapReact
											office={office}
											room={room}
											genericDeskData={deskOptions}
											selectedDesk={selectedDesk}
											onSelectDesk={setSelectedDesk}
											occupiedDeskIds={occupiedDeskIds}
										/>
									</div>
								)}

								<div className="mt-6 flex justify-end">
									<button
										type="button"
										disabled={!canSaveWork}
										onClick={() =>
											onSaveWork({
												date: selectedDate,
												office,
												room,
												startTime,
												endTime,
												remote,
												event,
												selectedDesk,
												editingEntry: selectedEntry,
											})
										}
										className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:scale-[1.01] hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
									>
										{isEdit ? "Guardar cambios" : "Guardar jornada"}
									</button>
								</div>
							</section>
						</div>
					) : (
						<div className="mt-8">
							<div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
								<div className="mb-5">
									<h4 className="text-lg font-semibold text-slate-900">Jornada no laborable</h4>
									<p className="mt-1 text-sm text-slate-500">
										Se registrará simplemente que ese día no trabajas, sin mostrar ningún motivo.
									</p>
								</div>

								<div className="rounded-3xl border border-slate-200 bg-white p-5">
									<div className="flex items-start gap-4">
										<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-2xl">
											🌴
										</div>

										<div>
											<h5 className="text-base font-semibold text-slate-900">No trabaja</h5>
											<p className="mt-1 text-sm leading-6 text-slate-500">
												Este registro únicamente indica que no trabajarás ese día.
											</p>
										</div>
									</div>
								</div>

								<div className="mt-6 flex justify-end">
									<button
										type="button"
										onClick={() =>
											onSaveAbsence({
												date: selectedDate,
												editingEntry: selectedEntry,
											})
										}
										className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
									>
										{isEdit ? "Guardar cambios" : "Guardar no trabaja"}
									</button>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
