import { useEffect, useState } from "react";

function UserCard({ user }) {
	const fullName =
		[user.NAME, user.LAST_NAME].filter(Boolean).join(" ") || "Sin nombre";

	const email = user.EMAIL || "Sin email";
	const position = user.WORK_POSITION || "Sin puesto";
	const avatar = user.PERSONAL_PHOTO || user.PERSONAL_PHOTO_PATH || "";
	const office = user.UF_DEPARTMENT?.join(", ") || "Sin oficina";
	const status = user.ACTIVE ? "Activo" : "Inactivo";

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
					<h3 className="truncate text-base font-semibold text-slate-900">
						{fullName}
					</h3>
					<p className="mt-1 text-sm text-slate-500">{position}</p>

					<div className="mt-3 space-y-1 text-sm text-slate-600">
						<p>
							<span className="font-medium text-slate-800">Email:</span> {email}
						</p>
						<p>
							<span className="font-medium text-slate-800">Ubicación:</span> {office}
						</p>
						<p>
							<span className="font-medium text-slate-800">Estado:</span> {status}
						</p>
					</div>
				</div>
			</div>
		</article>
	);
}

export default function Cards() {
	const [users, setUsers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		if (typeof window === "undefined") return;

		if (!window.BX24) {
			setError("BX24 no está disponible en la ventana.");
			setLoading(false);
			return;
		}

		let cancelled = false;
		let allUsers = [];

		window.BX24.init(() => {
			window.BX24.callMethod(
				"user.get",
				{
					FILTER: {
						ACTIVE: false,
					},
				},
				function handleResult(result) {
					if (cancelled) return;

					if (result.error()) {
						console.error(result.error());
						setError(
							result.error().ex ||
							result.error().description ||
							"Error al obtener usuarios de Bitrix."
						);
						setLoading(false);
						return;
					}

					const pageData = result.data() || [];
					allUsers = allUsers.concat(pageData);

					if (result.more()) {
						result.next();
						return;
					}

					setUsers(allUsers);
					setLoading(false);
				}
			);
		});

		return () => {
			cancelled = true;
		};
	}, []);

	if (loading) {
		return <div>Cargando compañeros...</div>;
	}

	if (error) {
		return <div>{error}</div>;
	}

	return (
		<>
			<div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
				Usuarios cargados: <span className="font-semibold">{users.length}</span>
			</div>

			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
				{users.map((user) => (
					<UserCard key={user.ID} user={user} />
				))}
			</div>
		</>
	);
}