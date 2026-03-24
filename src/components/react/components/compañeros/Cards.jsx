import { useEffect, useMemo, useState } from "react";

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

function normalizeTimeValue(value) {
	if (!value) return "";
	if (/^\d{2}:\d{2}$/.test(value)) return value;

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "";

	const hours = String(date.getHours()).padStart(2, "0");
	const minutes = String(date.getMinutes()).padStart(2, "0");
	return `${hours}:${minutes}`;
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

function inferAvailability(entry) {
	if (!entry) {
		return {
			label: "Sin registrar",
			badgeClasses: "bg-slate-100 text-slate-600 border-slate-200",
			center: "-",
			room: "-",
			resource: "-",
			schedule: "-",
		};
	}

	const status = String(entry[FIELD_STATUS] ?? "").toLowerCase();
	const resourceType = String(entry[FIELD_RESOURCE_TYPE] ?? "").toLowerCase();
	const resource = String(entry[FIELD_RESOURCE] ?? "").toLowerCase();
	const room = String(entry[FIELD_ROOM] ?? "").toLowerCase();
	const notes = String(entry[FIELD_NOTES] ?? "").toLowerCase();

	const centerValue = entry[FIELD_CENTER] ?? "-";
	const roomValue = entry[FIELD_ROOM] ?? "-";
	const resourceValue = entry[FIELD_RESOURCE] ?? "-";

	const start = normalizeTimeValue(entry[FIELD_START]);
	const end = normalizeTimeValue(entry[FIELD_END]);
	const schedule = start && end ? `${start} - ${end}` : "-";

	if (status === "cancelada" || notes.includes("no trabaja")) {
		return {
			label: "No trabaja",
			badgeClasses: "bg-amber-50 text-amber-700 border-amber-200",
			center: "-",
			room: "-",
			resource: "-",
			schedule,
		};
	}

	if (status === "bloqueada") {
		return {
			label: "Ausencia",
			badgeClasses: "bg-amber-50 text-amber-700 border-amber-200",
			center: "-",
			room: "-",
			resource: "-",
			schedule,
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
			badgeClasses: "bg-violet-50 text-violet-700 border-violet-200",
			center: centerValue,
			room: roomValue,
			resource: resourceValue,
			schedule,
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
			badgeClasses: "bg-blue-50 text-blue-700 border-blue-200",
			center: "Teletrabajo",
			room: "-",
			resource: "-",
			schedule,
		};
	}

	return {
		label: "Oficina",
		badgeClasses: "bg-emerald-50 text-emerald-700 border-emerald-200",
		center: centerValue,
		room: roomValue,
		resource: resourceValue,
		schedule,
	};
}

function getUserDisplayData(user) {
	const fullName =
		[user.NAME, user.LAST_NAME].filter(Boolean).join(" ") || "Sin nombre";

	const email = user.EMAIL || "Sin email";
	const phone =
		user.WORK_PHONE || user.PERSONAL_MOBILE || user.PERSONAL_PHONE || "Sin teléfono";
	const position = user.WORK_POSITION || "Sin puesto";
	const avatar = user.PERSONAL_PHOTO || user.PERSONAL_PHOTO_PATH || "";

	return {
		fullName,
		email,
		phone,
		position,
		avatar,
	};
}

function UserCard({ user, entry }) {
	const { fullName, email, phone, position, avatar } = getUserDisplayData(user);
	const availability = inferAvailability(entry);

	return (
		<article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
			<div className="flex items-start gap-4">
				<div className="h-14 w-14 overflow-hidden rounded-2xl bg-slate-100">
					{avatar ? (
						<img
							src={avatar}
							alt={fullName}
							className="h-full w-full object-cover"
						/>
					) : (
						<div className="flex h-full w-full items-center justify-center text-lg font-semibold text-slate-500">
							{fullName.charAt(0).toUpperCase()}
						</div>
					)}
				</div>

				<div className="min-w-0 flex-1">
					<div className="flex flex-wrap items-start justify-between gap-3">
						<div className="min-w-0">
							<h3 className="truncate text-base font-semibold text-slate-900">
								{fullName}
							</h3>
							<p className="mt-1 text-sm text-slate-500">{position}</p>
						</div>

						<span
							className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${availability.badgeClasses}`}
						>
							{availability.label}
						</span>
					</div>

					<div className="mt-4 grid gap-2 text-sm text-slate-600">
						<p>
							<span className="font-medium text-slate-800">Email:</span> {email}
						</p>

						<p>
							<span className="font-medium text-slate-800">Teléfono:</span> {phone}
						</p>

						<p>
							<span className="font-medium text-slate-800">Centro:</span>{" "}
							{availability.center}
						</p>

						<p>
							<span className="font-medium text-slate-800">Sala:</span>{" "}
							{availability.room}
						</p>

						<p>
							<span className="font-medium text-slate-800">Puesto / recurso:</span>{" "}
							{availability.resource}
						</p>

						<p>
							<span className="font-medium text-slate-800">Horario:</span>{" "}
							{availability.schedule}
						</p>
					</div>
				</div>
			</div>
		</article>
	);
}

export default function Cards() {
	const [users, setUsers] = useState([]);
	const [entries, setEntries] = useState([]);
	const [enumMaps, setEnumMaps] = useState({});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

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

				console.log(usersResult)
				console.log(normalizedItems)

				setEnumMaps(maps);
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

	const todayEntriesByUser = useMemo(() => {
		const today = formatDate(new Date());
		const map = new Map();

		entries.forEach((entry) => {
			const entryDate = normalizeBitrixDate(entry[FIELD_DATE]);
			if (entryDate !== today) return;

			const employeeId = String(entry[FIELD_EMPLOYEE] ?? "");
			if (!employeeId) return;

			const existing = map.get(employeeId);

			if (!existing || Number(entry.id) > Number(existing.id)) {
				map.set(employeeId, entry);
			}
		});

		return map;
	}, [entries]);

	const usersWithAvailability = useMemo(() => {
		return users.map((user) => ({
			user,
			entry: todayEntriesByUser.get(String(user.ID)) || null,
		}));
	}, [users, todayEntriesByUser]);

	if (loading) {
		return <div>Cargando compañeros...</div>;
	}

	if (error) {
		return <div>{error}</div>;
	}

	return (
		<>
			<div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
				Usuarios cargados:{" "}
				<span className="font-semibold">{usersWithAvailability.length}</span>
			</div>

			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
				{usersWithAvailability.map(({ user, entry }) => (
					<UserCard key={user.ID} user={user} entry={entry} />
				))}
			</div>
		</>
	);
}