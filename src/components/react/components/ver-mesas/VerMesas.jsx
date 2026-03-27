import { useEffect, useMemo, useState } from "react";
import UserCard from "../compañeros/CardIndividual.jsx";

const FIELD_EMPLOYEE = "ufCrm22_1774265772";

export default function ViewDesksReact({
	officeRooms,
	customMaps,
	genericOfficeDeskData,
	ENTITY_TYPE_ID,
	FIELD_CENTER,
	FIELD_ROOM,
	FIELD_RESOURCE,
	FIELD_RESOURCE_TYPE,
	FIELD_DATE,
	FIELD_START,
	FIELD_END,
	FIELD_STATUS,
	FIELD_NOTES,
}) {
	const [office, setOffice] = useState("");
	const [room, setRoom] = useState("");
	const [date, setDate] = useState("");
	const [time, setTime] = useState("");
	const [enumMaps, setEnumMaps] = useState({});
	const [bitrixReady, setBitrixReady] = useState(false);
	const [occupiedDeskIds, setOccupiedDeskIds] = useState([]);
	const [deskAssignments, setDeskAssignments] = useState({});
	const [usersById, setUsersById] = useState({});
	const [hoveredDeskId, setHoveredDeskId] = useState("");
	const [hoverCard, setHoverCard] = useState(null);
	const [status, setStatus] = useState("empty");
	const [subtitle, setSubtitle] = useState(
		"Selecciona oficina, sala y día para visualizar el plano."
	);

	const rooms = useMemo(() => {
		return office && Array.isArray(officeRooms[office]) ? officeRooms[office] : [];
	}, [office, officeRooms]);

	const effectiveTime = useMemo(() => {
		return time || getNowTime();
	}, [time]);

	const canRenderMap = Boolean(office && room && date);

	const hoveredAssignment = useMemo(() => {
		if (!hoveredDeskId) return null;
		return deskAssignments[hoveredDeskId] || null;
	}, [hoveredDeskId, deskAssignments]);

	const hoveredUser = useMemo(() => {
		if (!hoveredAssignment?.userId) return {};
		return usersById[hoveredAssignment.userId] || {};
	}, [hoveredAssignment, usersById]);

	useEffect(() => {
		const today = new Date();
		const yyyy = today.getFullYear();
		const mm = String(today.getMonth() + 1).padStart(2, "0");
		const dd = String(today.getDate()).padStart(2, "0");
		setDate(`${yyyy}-${mm}-${dd}`);
	}, []);

	useEffect(() => {
		if (!window.BX24) {
			setSubtitle("BX24 no está disponible en esta ventana.");
			return;
		}

		window.BX24.init(async () => {
			try {
				const [fieldsResponse, users] = await Promise.all([
					callBitrix("crm.item.fields", {
						entityTypeId: ENTITY_TYPE_ID,
					}),
					getAllUsers(),
				]);

				const userMap = {};
				(users || []).forEach((user) => {
					userMap[String(user.ID)] = user;
				});

				setUsersById(userMap);

				setEnumMaps(
					createEnumMaps(fieldsResponse?.fields || {}, {
						FIELD_CENTER,
						FIELD_ROOM,
						FIELD_RESOURCE_TYPE,
						FIELD_STATUS,
					})
				);

				setBitrixReady(true);
			} catch (error) {
				console.error("Error inicializando Bitrix:", error);
				setSubtitle("No se pudieron cargar los metadatos de Bitrix.");
			}
		});
	}, [ENTITY_TYPE_ID, FIELD_CENTER, FIELD_ROOM, FIELD_RESOURCE_TYPE, FIELD_STATUS]);

	useEffect(() => {
		setRoom("");
		setOccupiedDeskIds([]);
		setDeskAssignments({});
		setHoveredDeskId("");
		setHoverCard(null);
		setStatus("empty");
		setSubtitle("Selecciona oficina, sala y día para visualizar el plano.");
	}, [office]);

	useEffect(() => {
		if (!canRenderMap) {
			setOccupiedDeskIds([]);
			setDeskAssignments({});
			setHoveredDeskId("");
			setHoverCard(null);
			setStatus("empty");
			setSubtitle("Selecciona oficina, sala y día para visualizar el plano.");
			return;
		}

		if (!bitrixReady || !window.BX24) {
			setOccupiedDeskIds([]);
			setDeskAssignments({});
			setHoveredDeskId("");
			setHoverCard(null);
			setStatus("empty");
			setSubtitle("Bitrix no está listo todavía.");
			return;
		}

		let cancelled = false;

		async function loadMap() {
			setStatus("loading");
			setSubtitle(`${office} · ${room} · ${formatHumanDate(date)} · ${effectiveTime}`);

			try {
				const assignments = await getOccupiedDeskAssignments({
					office,
					room,
					date,
					time: effectiveTime,
					enumMaps,
					ENTITY_TYPE_ID,
					FIELD_EMPLOYEE,
					FIELD_CENTER,
					FIELD_ROOM,
					FIELD_RESOURCE,
					FIELD_RESOURCE_TYPE,
					FIELD_DATE,
					FIELD_START,
					FIELD_END,
					FIELD_STATUS,
					FIELD_NOTES,
				});

				if (cancelled) return;

				const deskIds = Object.keys(assignments);

				setDeskAssignments(assignments);
				setOccupiedDeskIds(deskIds);
				setHoveredDeskId((currentHovered) =>
					assignments[currentHovered] ? currentHovered : ""
				);
				setHoverCard(null);
				setStatus("ready");
			} catch (error) {
				console.error("Error cargando ocupación de mesas:", error);
				if (cancelled) return;
				setOccupiedDeskIds([]);
				setDeskAssignments({});
				setHoveredDeskId("");
				setHoverCard(null);
				setStatus("empty");
				setSubtitle("No se pudo cargar la ocupación real de las mesas.");
			}
		}

		loadMap();

		return () => {
			cancelled = true;
		};
	}, [
		office,
		room,
		date,
		effectiveTime,
		bitrixReady,
		enumMaps,
		canRenderMap,
		ENTITY_TYPE_ID,
		FIELD_CENTER,
		FIELD_ROOM,
		FIELD_RESOURCE,
		FIELD_RESOURCE_TYPE,
		FIELD_DATE,
		FIELD_START,
		FIELD_END,
		FIELD_STATUS,
		FIELD_NOTES,
	]);

	const occupiedSet = useMemo(
		() => new Set((occupiedDeskIds || []).map((id) => normalizeDeskId(id))),
		[occupiedDeskIds]
	);

	const mapKey = office && room ? `${office}::${room}` : "";
	const customMap = mapKey ? customMaps[mapKey] : null;
	const genericDesks = office ? genericOfficeDeskData[office] || [] : [];

	function getHoverCardPosition(event) {
		const offset = 18;
		const cardWidth = 340;
		const cardHeight = 260;

		let x = event.clientX + offset;
		let y = event.clientY + offset;

		const maxX = window.innerWidth - cardWidth - 16;
		const maxY = window.innerHeight - cardHeight - 16;

		if (x > maxX) {
			x = event.clientX - cardWidth - offset;
		}

		if (y > maxY) {
			y = Math.max(16, maxY);
		}

		return {
			left: Math.max(16, x),
			top: Math.max(16, y),
		};
	}

	function handleDeskMouseEnter(deskId, event) {
		const normalizedDeskId = normalizeDeskId(deskId);
		if (!deskAssignments[normalizedDeskId]) return;

		setHoveredDeskId(normalizedDeskId);
		setHoverCard(getHoverCardPosition(event));
	}

	function handleDeskMouseMove(deskId, event) {
		const normalizedDeskId = normalizeDeskId(deskId);
		if (!deskAssignments[normalizedDeskId]) return;

		setHoverCard(getHoverCardPosition(event));
	}

	function handleDeskMouseLeave(deskId) {
		const normalizedDeskId = normalizeDeskId(deskId);
		if (hoveredDeskId === normalizedDeskId) {
			setHoveredDeskId("");
			setHoverCard(null);
		}
	}

	return (
		<main className="min-h-screen bg-slate-50 text-slate-900">
			<section className="relative overflow-hidden">
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.06),transparent_28%)]" />

				<div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
					<div className="flex flex-row-reverse justify-between pt-5 pb-2">
						<div className="mb-8 flex h-min justify-between gap-4">
							<a
								href="/"
								className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-100"
							>
								<span>←</span>
								Volver
							</a>
						</div>

						<div className="mb-8">
							<h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
								Ver mesas por oficina y sala
							</h1>

							<p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
								Selecciona oficina, sala y día. La hora es opcional: si no la
								indicas, se tomará automáticamente la hora actual para mostrar el
								estado del mapa.
							</p>
						</div>
					</div>

					<div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
						<aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70">
							<div className="mb-6">
								<h2 className="text-lg font-semibold text-slate-900">
									Filtros de consulta
								</h2>
								<p className="mt-1 text-sm text-slate-500">
									Completa los campos para cargar el mapa de mesas
									correspondiente.
								</p>
							</div>

							<form
								id="view-desks-form"
								className="space-y-5"
								onSubmit={(e) => e.preventDefault()}
							>
								<div>
									<label
										htmlFor="office"
										className="mb-2 block text-sm font-medium text-slate-700"
									>
										Oficina
									</label>
									<select
										id="office"
										name="office"
										value={office}
										onChange={(e) => setOffice(e.target.value)}
										className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
									>
										<option value="">Selecciona una oficina</option>
										<option value="Toledo">Toledo</option>
										<option value="Madrid">Madrid</option>
										<option value="Consuegra">Consuegra</option>
									</select>
								</div>

								<div>
									<label
										htmlFor="room"
										className="mb-2 block text-sm font-medium text-slate-700"
									>
										Sala
									</label>
									<select
										id="room"
										name="room"
										value={room}
										onChange={(e) => setRoom(e.target.value)}
										disabled={!office || rooms.length === 0}
										className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-70 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
									>
										{!office ? (
											<option value="">Primero elige una oficina</option>
										) : rooms.length === 0 ? (
											<option value="">No hay salas disponibles</option>
										) : (
											<>
												<option value="">Selecciona una sala</option>
												{rooms.map((roomItem) => (
													<option key={roomItem} value={roomItem}>
														{roomItem}
													</option>
												))}
											</>
										)}
									</select>
								</div>

								<div>
									<label
										htmlFor="date"
										className="mb-2 block text-sm font-medium text-slate-700"
									>
										Día
									</label>
									<input
										id="date"
										name="date"
										type="date"
										value={date}
										onChange={(e) => setDate(e.target.value)}
										className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
									/>
								</div>

								<div>
									<label
										htmlFor="time"
										className="mb-2 block text-sm font-medium text-slate-700"
									>
										Hora
										<span className="font-normal text-slate-500"> (opcional)</span>
									</label>
									<input
										id="time"
										name="time"
										type="time"
										value={time}
										onChange={(e) => setTime(e.target.value)}
										className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
									/>
								</div>

								<div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
									<div className="mb-3 flex items-center justify-between">
										<span className="text-sm font-medium text-slate-700">
											Estado de las mesas
										</span>
									</div>

									<div className="grid grid-cols-1 gap-3 text-sm text-slate-600 sm:grid-cols-2">
										<div className="flex items-center gap-2">
											<span className="h-3 w-3 rounded-full bg-emerald-400"></span>
											Disponible
										</div>
										<div className="flex items-center gap-2">
											<span className="h-3 w-3 rounded-full bg-rose-400"></span>
											Ocupada
										</div>
									</div>
								</div>

								<div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
									<p className="text-sm leading-6 text-blue-800">
										Si no seleccionas una hora, el sistema tomará automáticamente
										la hora actual.
									</p>
								</div>
							</form>
						</aside>

						<section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70">
							<div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
								<div>
									<h2 className="text-lg font-semibold text-slate-900">
										Mapa de la oficina
									</h2>
									<p className="mt-1 text-sm text-slate-500">{subtitle}</p>
								</div>

								<div
									className={`rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 ${canRenderMap ? "" : "hidden"}`}
								>
									Hora aplicada: <span>{effectiveTime}</span>
								</div>
							</div>

							{status === "empty" && (
								<div className="flex min-h-[420px] items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
									<div className="max-w-md">
										<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
											🗺️
										</div>
										<h3 className="text-lg font-semibold text-slate-900">
											Aún no hay plano cargado
										</h3>
										<p className="mt-2 text-sm leading-6 text-slate-500">
											Cuando elijas una oficina, una sala y un día aparecerá aquí
											el mapa de mesas.
										</p>
									</div>
								</div>
							)}

							{status === "loading" && (
								<div className="flex min-h-[420px] items-center justify-center rounded-[28px] border border-slate-200 bg-slate-50 p-8 text-center">
									<div className="max-w-md">
										<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
											⏳
										</div>
										<h3 className="text-lg font-semibold text-slate-900">
											Cargando ocupación
										</h3>
										<p className="mt-2 text-sm leading-6 text-slate-500">
											Estamos consultando Bitrix para obtener el estado real de
											las mesas.
										</p>
									</div>
								</div>
							)}

							{status === "ready" && (
								<div className="overflow-visible rounded-[28px] border border-slate-200 bg-slate-50 p-4 sm:p-6">
									<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
										<div className="rounded-2xl bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
											Plano de ocupación
										</div>
										<div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600">
											Pasa el cursor por una mesa ocupada
										</div>
									</div>

									<div className="relative flex min-h-[420px] items-center justify-center rounded-[24px] border border-slate-200 bg-gradient-to-br from-slate-100 to-white p-4 sm:min-h-[520px] sm:p-6 overflow-visible">
										{customMap ? (
											<div className="mx-auto flex w-full justify-center">
												<div
													className="relative w-full max-w-[720px] overflow-visible rounded-[24px] border border-slate-200 bg-gradient-to-br from-slate-100 to-white"
													style={{
														aspectRatio: `${customMap.width} / ${customMap.height}`,
														maxHeight: "calc(100vh - 320px)",
													}}
												>
													{customMap.features
														.filter((feature) => feature.type !== "door")
														.map((feature) => {
															const style = {
																left: pct(feature.x, customMap.width),
																top: pct(feature.y, customMap.height),
																width: pct(feature.w, customMap.width),
																height: pct(feature.h, customMap.height),
															};

															if (feature.type === "label") {
																return (
																	<div
																		key={feature.id}
																		className="absolute flex items-center justify-center text-[10px] sm:text-xs font-semibold tracking-wide text-slate-500"
																		style={style}
																	>
																		{feature.text}
																	</div>
																);
															}

															if (feature.type === "rect") {
																return (
																	<div
																		key={feature.id}
																		className={`absolute border border-slate-300 bg-transparent ${feature.rounded ? "rounded-[24px]" : ""}`}
																		style={style}
																	/>
																);
															}

															if (feature.type === "line") {
																return (
																	<div
																		key={feature.id}
																		className="absolute bg-slate-300"
																		style={style}
																	/>
																);
															}

															return null;
														})}

													{customMap.desks.map((desk) => {
														const normalizedDeskId = normalizeDeskId(desk.id);
														const isAvailable = !occupiedSet.has(normalizedDeskId);
														const isHovered = hoveredDeskId === normalizedDeskId;

														return (
															<div
																key={desk.id}
																onMouseEnter={(e) => handleDeskMouseEnter(desk.id, e)}
																onMouseMove={(e) => handleDeskMouseMove(desk.id, e)}
																onMouseLeave={() => handleDeskMouseLeave(desk.id)}
																className={`${getDeskCardClasses(isAvailable)} ${isHovered ? "ring-2 ring-slate-400" : ""} ${!isAvailable ? "cursor-pointer" : "cursor-default"}`}
																style={{
																	left: pct(desk.x, customMap.width),
																	top: pct(desk.y, customMap.height),
																	width: pct(desk.w, customMap.width),
																	height: pct(desk.h, customMap.height),
																}}
															>
																<div className="flex flex-col items-center justify-center px-1 text-center leading-tight">
																	<span>{desk.id}</span>
																</div>
															</div>
														);
													})}
												</div>
											</div>
										) : (
											<div className="relative w-full rounded-[24px] border border-slate-200 bg-gradient-to-br from-slate-100 to-white p-4 sm:min-h-[520px] sm:p-6 overflow-visible">
												<div className="absolute left-4 top-4 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 sm:left-6 sm:top-6">
													Entrada
												</div>

												<div className="absolute right-4 top-4 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 sm:right-6 sm:top-6">
													Ventanas
												</div>

												<div className="absolute left-1/2 top-6 h-14 w-32 -translate-x-1/2 rounded-2xl border border-slate-200 bg-slate-200/70"></div>
												<div className="absolute bottom-6 left-6 right-6 h-3 rounded-full bg-slate-200"></div>

												<div className="grid min-h-[360px] grid-cols-2 gap-4 pt-20 sm:grid-cols-3 lg:grid-cols-4">
													{genericDesks.map((desk) => {
														const normalizedDeskId = normalizeDeskId(desk.id);
														const isAvailable = !occupiedSet.has(normalizedDeskId);
														const isHovered = hoveredDeskId === normalizedDeskId;

														return (
															<div
																key={desk.id}
																onMouseEnter={(e) => handleDeskMouseEnter(desk.id, e)}
																onMouseMove={(e) => handleDeskMouseMove(desk.id, e)}
																onMouseLeave={() => handleDeskMouseLeave(desk.id)}
																className={`${getGenericDeskClasses(isAvailable)} ${isHovered ? "ring-2 ring-slate-400" : ""} ${!isAvailable ? "cursor-pointer" : "cursor-default"}`}
															>
																<div className="flex flex-col items-center justify-center gap-2">
																	<span className="text-base">{desk.id}</span>
																	<span
																		className={`rounded-full px-2 py-1 text-[11px] font-medium ${isAvailable
																				? "bg-emerald-100 text-emerald-700"
																				: "bg-rose-100 text-rose-700"
																			}`}
																	>
																		{isAvailable ? "Disponible" : "Ocupada"}
																	</span>
																</div>
															</div>
														);
													})}
												</div>
											</div>
										)}

										{hoveredAssignment && hoverCard ? (
											<div
												className="fixed z-50 w-[340px] pointer-events-none"
												style={{
													left: `${hoverCard.left}px`,
													top: `${hoverCard.top}px`,
												}}
											>
												<div className="mb-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-lg">
													<p className="text-sm font-semibold text-slate-900">
														Mesa {hoveredDeskId}
													</p>
													<p className="text-xs text-slate-500">
														Reserva activa a las {effectiveTime}
													</p>
												</div>

												<UserCard
													user={hoveredUser}
													entry={hoveredAssignment.entry}
													selectedTime={effectiveTime}
												/>
											</div>
										) : null}
									</div>
								</div>
							)}
						</section>
					</div>
				</div>
			</section>
		</main>
	);
}

function getNowTime() {
	const now = new Date();
	const hours = String(now.getHours()).padStart(2, "0");
	const minutes = String(now.getMinutes()).padStart(2, "0");
	return `${hours}:${minutes}`;
}

function formatHumanDate(dateString) {
	const [year, month, day] = dateString.split("-");
	return `${day}/${month}/${year}`;
}

function pct(value, total) {
	return `${(value / total) * 100}%`;
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

function pointInRange(time, start, end) {
	const point = toMinutes(time);
	const startMinutes = toMinutes(start);
	const endMinutes = toMinutes(end);

	if (endMinutes < startMinutes) {
		return point >= startMinutes || point < endMinutes;
	}

	return point >= startMinutes && point < endMinutes;
}

function normalizeDeskId(value) {
	return String(value ?? "").trim().toUpperCase();
}

function getDeskCardClasses(available) {
	const base =
		"absolute flex items-center justify-center border text-[10px] sm:text-xs font-semibold transition rounded-2xl";

	if (!available) {
		return `${base} border-rose-200 bg-rose-50 text-rose-700`;
	}

	return `${base} border-emerald-200 bg-emerald-50 text-emerald-700`;
}

function getGenericDeskClasses(available) {
	return `desk relative flex min-h-[92px] items-center justify-center rounded-3xl border-2 text-sm font-semibold transition duration-200 ${available
			? "border-emerald-200 bg-emerald-50 text-emerald-700"
			: "border-rose-200 bg-rose-50 text-rose-700"
		}`;
}

function createEnumMaps(fields, keys) {
	const enumFieldNames = [
		keys.FIELD_CENTER,
		keys.FIELD_ROOM,
		keys.FIELD_RESOURCE_TYPE,
		keys.FIELD_STATUS,
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

function callBitrix(method, params = {}) {
	return new Promise((resolve, reject) => {
		if (!window.BX24) {
			reject(new Error("BX24 no está disponible"));
			return;
		}

		window.BX24.callMethod(method, params, (result) => {
			if (result.error()) {
				reject(result.error());
				return;
			}

			resolve(result.data());
		});
	});
}

function getAllUsers() {
	return new Promise((resolve, reject) => {
		let allUsers = [];

		window.BX24.callMethod(
			"user.get",
			{
				FILTER: {
					ACTIVE: true,
				},
			},
			function handleResult(result) {
				if (result.error()) {
					reject(result.error());
					return;
				}

				const pageData = result.data() || [];
				allUsers = allUsers.concat(pageData);

				if (result.more()) {
					result.next();
					return;
				}

				resolve(allUsers);
			}
		);
	});
}

function normalizeEntry(entry, enumMaps, keys) {
	return {
		...entry,
		[keys.FIELD_CENTER]: resolveEnumLabel(enumMaps, keys.FIELD_CENTER, entry[keys.FIELD_CENTER]),
		[keys.FIELD_ROOM]: resolveEnumLabel(enumMaps, keys.FIELD_ROOM, entry[keys.FIELD_ROOM]),
		[keys.FIELD_RESOURCE_TYPE]: resolveEnumLabel(
			enumMaps,
			keys.FIELD_RESOURCE_TYPE,
			entry[keys.FIELD_RESOURCE_TYPE]
		),
		[keys.FIELD_STATUS]: resolveEnumLabel(enumMaps, keys.FIELD_STATUS, entry[keys.FIELD_STATUS]),
	};
}

async function getOccupiedDeskAssignments({
	office,
	room,
	date,
	time,
	enumMaps,
	ENTITY_TYPE_ID,
	FIELD_EMPLOYEE,
	FIELD_CENTER,
	FIELD_ROOM,
	FIELD_RESOURCE,
	FIELD_RESOURCE_TYPE,
	FIELD_DATE,
	FIELD_START,
	FIELD_END,
	FIELD_STATUS,
	FIELD_NOTES,
}) {
	const centerValue = resolveEnumId(enumMaps, FIELD_CENTER, office);
	const roomValueForFilter = resolveEnumId(enumMaps, FIELD_ROOM, room) ?? room;

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
			FIELD_DATE,
			FIELD_START,
			FIELD_END,
			FIELD_STATUS,
			FIELD_NOTES,
		],
		filter: {
			[FIELD_DATE]: date,
			[FIELD_CENTER]: centerValue,
			[FIELD_ROOM]: roomValueForFilter,
		},
	});

	const items = data?.items || [];
	const assignments = {};

	items.forEach((item) => {
		const statusLabel = String(
			resolveEnumLabel(enumMaps, FIELD_STATUS, item[FIELD_STATUS]) ?? ""
		).toLowerCase();

		const resourceTypeLabel = String(
			resolveEnumLabel(enumMaps, FIELD_RESOURCE_TYPE, item[FIELD_RESOURCE_TYPE]) ?? ""
		).toLowerCase();

		const roomLabel = String(
			resolveEnumLabel(enumMaps, FIELD_ROOM, item[FIELD_ROOM]) ?? ""
		).toLowerCase();

		const resource = String(item[FIELD_RESOURCE] ?? "").trim();
		const resourceNormalized = resource.toLowerCase();
		const notes = String(item[FIELD_NOTES] ?? "").toLowerCase();

		if (statusLabel === "cancelada") return;
		if (statusLabel === "bloqueada") return;
		if (notes.includes("no trabaja")) return;

		if (
			resourceTypeLabel === "sala" ||
			resourceNormalized.includes("evento") ||
			roomLabel.includes("evento") ||
			notes.includes("evento")
		) {
			return;
		}

		if (
			resourceNormalized.includes("teletrabajo") ||
			roomLabel.includes("teletrabajo") ||
			notes.includes("teletrabajo") ||
			notes.includes("remoto")
		) {
			return;
		}

		if (
			resourceNormalized.includes("ausencia") ||
			resourceNormalized.includes("vacaciones")
		) {
			return;
		}

		const start = normalizeTimeValue(item[FIELD_START]);
		const end = normalizeTimeValue(item[FIELD_END]);

		if (!resource) return;

		if (start && end && !pointInRange(time, start, end)) {
			return;
		}

		const deskId = normalizeDeskId(resource);
		const normalized = normalizeEntry(item, enumMaps, {
			FIELD_CENTER,
			FIELD_ROOM,
			FIELD_RESOURCE_TYPE,
			FIELD_STATUS,
		});

		const existing = assignments[deskId];
		if (!existing || Number(item.id) > Number(existing.entry.id)) {
			assignments[deskId] = {
				userId: String(item[FIELD_EMPLOYEE] ?? ""),
				entry: normalized,
			};
		}
	});

	return assignments;
}
