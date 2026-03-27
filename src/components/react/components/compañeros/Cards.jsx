import { useEffect, useMemo, useState } from "react";
import UserCard, { getUserDisplayData, inferAvailability } from "./CardIndividual.jsx";

const ENTITY_TYPE_ID = 1058;

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

function formatDate(date) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
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

function normalizeEntry(entry, enumMaps) {
	return {
		...entry,
		[FIELD_CENTER]: resolveEnumLabel(enumMaps, FIELD_CENTER, entry[FIELD_CENTER]),
		[FIELD_RESOURCE_TYPE]: resolveEnumLabel(
			enumMaps,
			FIELD_RESOURCE_TYPE,
			entry[FIELD_RESOURCE_TYPE]
		),
		[FIELD_BOOKING_MODE]: resolveEnumLabel(
			enumMaps,
			FIELD_BOOKING_MODE,
			entry[FIELD_BOOKING_MODE]
		),
		[FIELD_STATUS]: resolveEnumLabel(enumMaps, FIELD_STATUS, entry[FIELD_STATUS]),
	};
}

function normalizeText(value) {
	return String(value ?? "")
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.trim();
}

function getSearchScore(user, entry, selectedTime, query) {
	if (!query) return 1;

	const { fullName, email } = getUserDisplayData(user);
	const availability = inferAvailability(entry, selectedTime);

	const normalizedQuery = normalizeText(query);
	const fullNameNormalized = normalizeText(fullName);
	const emailNormalized = normalizeText(email);
	const centerNormalized = normalizeText(availability.center);
	const roomNormalized = normalizeText(availability.room);
	const resourceNormalized = normalizeText(availability.resource);
	const statusNormalized = normalizeText(availability.label);

	if (!normalizedQuery) return 1;

	const nameTokens = fullNameNormalized.split(/\s+/).filter(Boolean);

	if (fullNameNormalized.startsWith(normalizedQuery)) return 100;
	if (nameTokens.some((token) => token.startsWith(normalizedQuery))) return 90;
	if (emailNormalized.startsWith(normalizedQuery)) return 80;
	if (centerNormalized.startsWith(normalizedQuery)) return 70;
	if (roomNormalized.startsWith(normalizedQuery)) return 65;
	if (resourceNormalized.startsWith(normalizedQuery)) return 60;
	if (statusNormalized.startsWith(normalizedQuery)) return 55;

	if (fullNameNormalized.includes(normalizedQuery)) return 40;
	if (emailNormalized.includes(normalizedQuery)) return 30;
	if (centerNormalized.includes(normalizedQuery)) return 25;
	if (roomNormalized.includes(normalizedQuery)) return 20;
	if (resourceNormalized.includes(normalizedQuery)) return 15;
	if (statusNormalized.includes(normalizedQuery)) return 10;

	return 0;
}

export default function Cards() {
	const [users, setUsers] = useState([]);
	const [entries, setEntries] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [officeFilter, setOfficeFilter] = useState("all");
	const [dateFilter, setDateFilter] = useState(formatDate(new Date()));
	const [timeFilter, setTimeFilter] = useState("");
	const [sortBy, setSortBy] = useState("name-asc");

	function callBitrix(method, params = {}) {
		return new Promise((resolve, reject) => {
			window.BX24.callMethod(method, params, (result) => {
				if (result.error()) {
					reject(result.error());
					return;
				}
				resolve(result);
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

	function getAllItems() {
		return new Promise((resolve, reject) => {
			let allItems = [];

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
				},
				function handleResult(result) {
					if (result.error()) {
						reject(result.error());
						return;
					}

					const pageData = result.data()?.items || [];
					allItems = allItems.concat(pageData);

					if (result.more()) {
						result.next();
						return;
					}

					resolve(allItems);
				}
			);
		});
	}

	useEffect(() => {
		if (typeof window === "undefined") return;

		if (!window.BX24) {
			setError("BX24 no está disponible en la ventana.");
			setLoading(false);
			return;
		}

		let cancelled = false;

		window.BX24.init(async () => {
			try {
				const [usersResult, fieldsResult, itemsResult] = await Promise.all([
					getAllUsers(),
					callBitrix("crm.item.fields", { entityTypeId: ENTITY_TYPE_ID }),
					getAllItems(),
				]);

				if (cancelled) return;

				const maps = createEnumMaps(fieldsResult.data()?.fields || {});
				const normalizedItems = (itemsResult || []).map((item) =>
					normalizeEntry(item, maps)
				);

				setUsers(usersResult || []);
				setEntries(normalizedItems);
				setLoading(false);
			} catch (err) {
				console.error(err);
				if (cancelled) return;

				setError(
					err?.ex ||
					err?.description ||
					err?.message ||
					"Error al obtener usuarios y disponibilidad desde Bitrix."
				);
				setLoading(false);
			}
		});

		return () => {
			cancelled = true;
		};
	}, []);

	const entriesByUserForSelectedDate = useMemo(() => {
		const map = new Map();

		entries.forEach((entry) => {
			const entryDate = normalizeBitrixDate(entry[FIELD_DATE]);
			if (entryDate !== dateFilter) return;

			const employeeId = String(entry[FIELD_EMPLOYEE] ?? "");
			if (!employeeId) return;

			const existing = map.get(employeeId);

			if (!existing || Number(entry.id) > Number(existing.id)) {
				map.set(employeeId, entry);
			}
		});

		return map;
	}, [entries, dateFilter]);

	const usersWithAvailability = useMemo(() => {
		return users.map((user) => ({
			user,
			entry: entriesByUserForSelectedDate.get(String(user.ID)) || null,
		}));
	}, [users, entriesByUserForSelectedDate]);

	const filteredUsers = useMemo(() => {
		const result = usersWithAvailability
			.map(({ user, entry }) => {
				const { fullName } = getUserDisplayData(user);
				const availability = inferAvailability(entry, timeFilter);
				const searchScore = getSearchScore(user, entry, timeFilter, search);

				return {
					user,
					entry,
					availability,
					fullName,
					searchScore,
				};
			})
			.filter(({ availability, searchScore }) => {
				if (statusFilter !== "all" && availability.label !== statusFilter) {
					return false;
				}

				if (officeFilter !== "all" && availability.center !== officeFilter) {
					return false;
				}

				if (search.trim() && searchScore <= 0) {
					return false;
				}

				return true;
			});

		result.sort((a, b) => {
			if (search.trim() && b.searchScore !== a.searchScore) {
				return b.searchScore - a.searchScore;
			}

			switch (sortBy) {
				case "name-desc":
					return b.fullName.localeCompare(a.fullName, "es");
				case "status-asc":
					return a.availability.label.localeCompare(b.availability.label, "es");
				case "office-asc":
					return String(a.availability.sortOffice).localeCompare(
						String(b.availability.sortOffice),
						"es"
					);
				case "name-asc":
				default:
					return a.fullName.localeCompare(b.fullName, "es");
			}
		});

		return result;
	}, [usersWithAvailability, search, statusFilter, officeFilter, timeFilter, sortBy]);

	function resetFilters() {
		setSearch("");
		setStatusFilter("all");
		setOfficeFilter("all");
		setDateFilter(formatDate(new Date()));
		setTimeFilter("");
		setSortBy("name-asc");
	}

	if (loading) {
		return <div>Cargando compañeros...</div>;
	}

	if (error) {
		return <div>{error}</div>;
	}

	return (
		<>
			<section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70 sm:p-6">
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
					<div className="md:col-span-2 xl:col-span-2 min-w-0">
						<label
							htmlFor="search"
							className="mb-2 block text-sm font-medium text-slate-700"
						>
							Buscar
						</label>
						<input
							id="search"
							type="text"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Buscar por nombre, oficina, estado, email..."
							className="block w-full min-w-0 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
						/>
					</div>

					<div>
						<label
							htmlFor="status-filter"
							className="mb-2 block text-sm font-medium text-slate-700"
						>
							Filtrar por estado
						</label>
						<select
							id="status-filter"
							value={statusFilter}
							onChange={(e) => setStatusFilter(e.target.value)}
							className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
						>
							<option value="all">Todos</option>
							<option value="Oficina">Oficina</option>
							<option value="Teletrabajo">Teletrabajo</option>
							<option value="Evento">Evento</option>
							<option value="No trabaja">No trabaja</option>
							<option value="Ausencia">Ausencia</option>
							<option value="Sin registrar">Sin registrar</option>
						</select>
					</div>

					<div>
						<label
							htmlFor="office-filter"
							className="mb-2 block text-sm font-medium text-slate-700"
						>
							Filtrar por oficina
						</label>
						<select
							id="office-filter"
							value={officeFilter}
							onChange={(e) => setOfficeFilter(e.target.value)}
							className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
						>
							<option value="all">Todas</option>
							<option value="Toledo">Toledo</option>
							<option value="Madrid">Madrid</option>
							<option value="Consuegra">Consuegra</option>
							<option value="Teletrabajo">Teletrabajo</option>
							<option value="-">Sin centro</option>
						</select>
					</div>

					<div>
						<label
							htmlFor="date-filter"
							className="mb-2 block text-sm font-medium text-slate-700"
						>
							Fecha
						</label>
						<input
							id="date-filter"
							type="date"
							value={dateFilter}
							onChange={(e) => setDateFilter(e.target.value)}
							className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
						/>
					</div>

					<div>
						<label
							htmlFor="time-filter"
							className="mb-2 block text-sm font-medium text-slate-700"
						>
							Hora
						</label>
						<input
							id="time-filter"
							type="time"
							value={timeFilter}
							onChange={(e) => setTimeFilter(e.target.value)}
							className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
						/>
					</div>

					<div>
						<label
							htmlFor="sort-by"
							className="mb-2 block text-sm font-medium text-slate-700"
						>
							Ordenar por
						</label>
						<select
							id="sort-by"
							value={sortBy}
							onChange={(e) => setSortBy(e.target.value)}
							className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
						>
							<option value="name-asc">Nombre A → Z</option>
							<option value="name-desc">Nombre Z → A</option>
							<option value="status-asc">Estado A → Z</option>
							<option value="office-asc">Oficina A → Z</option>
						</select>
					</div>
				</div>

				<div className="mt-5 flex flex-wrap items-center gap-3">
					<div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
						Total visibles:{" "}
						<span className="font-semibold text-slate-900">
							{filteredUsers.length}
						</span>
					</div>

					<button
						type="button"
						onClick={resetFilters}
						className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
					>
						Limpiar filtros
					</button>
				</div>
			</section>

			<section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70 sm:p-6">
				<div className="mb-5 flex items-center justify-between gap-4">
					<div>
						<h2 className="text-lg font-semibold text-slate-900">Compañeros</h2>
						<p className="mt-1 text-sm text-slate-500">
							Vista rápida del estado y ubicación actual del equipo.
						</p>
					</div>
				</div>

				<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
					{filteredUsers.map(({ user, entry }) => (
						<UserCard
							key={user.ID}
							user={user}
							entry={entry}
							selectedTime={timeFilter}
						/>
					))}
				</div>
			</section>
		</>
	);
}
