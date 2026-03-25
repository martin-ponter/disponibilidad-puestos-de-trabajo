import React from "react";

function formatDate(date) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
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

	if (!start || !end) return true;

	if (endMinutes < startMinutes) {
		return point >= startMinutes || point < endMinutes;
	}

	return point >= startMinutes && point < endMinutes;
}

const FIELD_CENTER = "ufCrm22_1774265887";
const FIELD_ROOM = "ufCrm22_1774266047";
const FIELD_RESOURCE = "ufCrm22_1774266138";
const FIELD_RESOURCE_TYPE = "ufCrm22_1774266164";
const FIELD_START = "ufCrm22_1774266245";
const FIELD_END = "ufCrm22_1774266267";
const FIELD_STATUS = "ufCrm22_1774266293";
const FIELD_NOTES = "ufCrm22_1774266335";

export function getUserDisplayData(user) {
	const fullName =
		[user.NAME, user.LAST_NAME].filter(Boolean).join(" ") || "Sin nombre";

	const email = user.EMAIL || "Sin email";
	const avatar = user.PERSONAL_PHOTO || user.PERSONAL_PHOTO_PATH || "";

	return {
		fullName,
		email,
		avatar,
	};
}

export function inferAvailability(entry, selectedTime = "") {
	if (!entry) {
		return {
			label: "Sin registrar",
			badgeClasses: "bg-slate-100 text-slate-600 border-slate-200",
			center: "-",
			room: "-",
			resource: "-",
			schedule: "-",
			sortOffice: "-",
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

	if (selectedTime && start && end && !pointInRange(selectedTime, start, end)) {
		return {
			label: "Sin registrar",
			badgeClasses: "bg-slate-100 text-slate-600 border-slate-200",
			center: "-",
			room: "-",
			resource: "-",
			schedule: "-",
			sortOffice: "-",
		};
	}

	if (status === "cancelada" || notes.includes("no trabaja")) {
		return {
			label: "No trabaja",
			badgeClasses: "bg-amber-50 text-amber-700 border-amber-200",
			center: "-",
			room: "-",
			resource: "-",
			schedule: "-",
			sortOffice: "-",
		};
	}

	if (status === "bloqueada") {
		return {
			label: "Ausencia",
			badgeClasses: "bg-amber-50 text-amber-700 border-amber-200",
			center: "-",
			room: "-",
			resource: "-",
			schedule: "-",
			sortOffice: "-",
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
			sortOffice: centerValue,
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
			sortOffice: "Teletrabajo",
		};
	}

	return {
		label: "Oficina",
		badgeClasses: "bg-emerald-50 text-emerald-700 border-emerald-200",
		center: centerValue,
		room: roomValue,
		resource: resourceValue,
		schedule,
		sortOffice: centerValue,
	};
}

export default function UserCard({ user, entry, selectedTime }) {
	const { fullName, email, avatar } = getUserDisplayData(user);
	const availability = inferAvailability(entry, selectedTime);

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
							<p className="mt-1 text-sm text-slate-500">{email}</p>
						</div>

						<span
							className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${availability.badgeClasses}`}
						>
							{availability.label}
						</span>
					</div>

					<div className="mt-4 grid gap-2 text-sm text-slate-600">
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