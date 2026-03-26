import { useEffect, useMemo, useState } from "react";

function getUserName(user) {
	return [user?.NAME, user?.LAST_NAME].filter(Boolean).join(" ") || "Sin nombre";
}

function getUserContact(user) {
	return (
		user?.EMAIL ||
		user?.WORK_PHONE ||
		user?.PERSONAL_MOBILE ||
		user?.PERSONAL_PHONE ||
		"Sin contacto"
	);
}

function getUserAvatar(user) {
	return user?.PERSONAL_PHOTO || user?.PERSONAL_PHOTO_PATH || "";
}

export default function AdminEmployeePickerModal({
	isOpen,
	usersById,
	selectedDesk,
	onClose,
	onSelectUser,
}) {
	const [search, setSearch] = useState("");

	useEffect(() => {
		if (!isOpen) {
			setSearch("");
		}
	}, [isOpen]);

	const users = useMemo(() => {
		return Object.values(usersById || {}).sort((a, b) =>
			getUserName(a).localeCompare(getUserName(b), "es", { sensitivity: "base" })
		);
	}, [usersById]);

	const filteredUsers = useMemo(() => {
		const query = search.trim().toLowerCase();
		if (!query) return users;

		return users.filter((user) => {
			const haystack = [
				getUserName(user),
				user?.EMAIL,
				user?.WORK_PHONE,
				user?.PERSONAL_MOBILE,
				user?.PERSONAL_PHONE,
			]
				.filter(Boolean)
				.join(" ")
				.toLowerCase();

			return haystack.includes(query);
		});
	}, [users, search]);

	if (!isOpen) return null;

	return (
		<div
			className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm"
			onClick={onClose}
		>
			<div
				className="max-h-[90vh] w-full max-w-3/4 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="border-b border-slate-200 px-5 py-4 sm:px-6">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<h3 className="text-xl font-semibold text-slate-900">
								Seleccionar persona
							</h3>
							<p className="mt-1 text-sm text-slate-500">
								{selectedDesk
									? `Mesa seleccionada: ${selectedDesk.office} · ${selectedDesk.room} · ${selectedDesk.deskId}`
									: "Elige la persona que quieres asignar."}
							</p>
						</div>

						<button
							type="button"
							onClick={onClose}
							className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
						>
							Cerrar
						</button>
					</div>

					<div className="mt-4">
						<input
							type="text"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Buscar por nombre, email o teléfono..."
							className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
						/>
					</div>
				</div>

				<div className="max-h-[65vh] overflow-auto p-5 sm:p-6">
					{!filteredUsers.length ? (
						<div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
							<div className="mx-auto max-w-md">
								<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
									👤
								</div>
								<h3 className="text-lg font-semibold text-slate-900">No hay resultados</h3>
								<p className="mt-2 text-sm leading-6 text-slate-500">
									No se ha encontrado ninguna persona que coincida con la búsqueda.
								</p>
							</div>
						</div>
					) : (
						<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
							{filteredUsers.map((user) => {
								const fullName = getUserName(user);
								const contact = getUserContact(user);
								const avatar = getUserAvatar(user);

								return (
									<button
										key={user.ID}
										type="button"
										onClick={() => onSelectUser(user)}
										className="rounded-3xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-[1px] hover:border-blue-300 hover:bg-blue-50"
									>
										<div className="flex items-start gap-4">
											<div className="h-14 w-14 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
												{avatar ? (
													<img
														src={avatar}
														alt={fullName}
														className="h-full w-full object-cover"
													/>
												) : (
													<div className="flex h-full w-full items-center justify-center text-lg font-semibold text-slate-500 truncate">
														{fullName.charAt(0).toUpperCase()}
													</div>
												)}
											</div>

											<div className="min-w-0 flex-1">
												<h4 className="truncate text-base font-semibold text-slate-900">
													{fullName}
												</h4>
												<p className="mt-1 text-sm text-slate-500 truncate">{contact}</p>

												<div className="mt-3 inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
													Seleccionar
												</div>
											</div>
										</div>
									</button>
								);
							})}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}