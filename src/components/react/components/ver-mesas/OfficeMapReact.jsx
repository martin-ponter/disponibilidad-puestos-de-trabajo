import React from "react";
import { officeMaps } from "../../../../data/maps/office-maps.js";

function pct(value, total) {
	return `${(value / total) * 100}%`;
}

function getDeskClasses(available, isSelected) {
	const base =
		"absolute flex items-center justify-center border text-[10px] sm:text-xs font-semibold transition rounded-2xl";

	if (isSelected) {
		return `${base} border-blue-500 bg-blue-50 text-blue-700 shadow-md shadow-blue-100`;
	}

	if (!available) {
		return `${base} border-rose-200 bg-rose-50 text-rose-700`;
	}

	return `${base} border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300`;
}

export default function OfficeMapReact({
	office,
	room,
	genericDeskData = [],
	selectedDesk,
	onSelectDesk,
	occupiedDeskIds = [],
}) {
	const mapKey = office && room ? `${office}::${room}` : "";
	const customMap = mapKey ? officeMaps[mapKey] : null;
	const occupiedSet = new Set((occupiedDeskIds || []).map(String));

	if (!office || !room) return null;

	if (customMap) {
		return (
			<div className="mx-auto flex w-full justify-center">
				<div
					className="relative w-full max-w-180 overflow-hidden rounded-3xl border border-slate-200 bg-linear-to-br from-slate-100 to-white"
					style={{
						aspectRatio: `${customMap.width} / ${customMap.height}`,
						maxHeight: "calc(100vh - 340px)",
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
										className={`absolute border border-slate-300 bg-transparent ${feature.rounded ? "rounded-3xl" : ""
											}`}
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
						const isAvailable = !occupiedSet.has(String(desk.id));

						return (
							<button
								key={desk.id}
								type="button"
								disabled={!isAvailable}
								onClick={() => {
									if (!isAvailable) return;
									onSelectDesk(desk.id);
								}}
								className={getDeskClasses(isAvailable, selectedDesk === desk.id)}
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
							</button>
						);
					})}
				</div>
			</div>
		);
	}

	return (
		<div className="relative min-h-105 rounded-3xl border border-slate-200 bg-linear-to-br from-slate-100 to-white p-4 sm:min-h-130 sm:p-6">
			<div className="absolute left-4 top-4 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 sm:left-6 sm:top-6">
				Entrada
			</div>

			<div className="absolute right-4 top-4 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 sm:right-6 sm:top-6">
				Ventanas
			</div>

			<div className="absolute left-1/2 top-6 h-14 w-32 -translate-x-1/2 rounded-2xl border border-slate-200 bg-slate-200/70"></div>
			<div className="absolute bottom-6 left-6 right-6 h-3 rounded-full bg-slate-200"></div>

			<div className="grid min-h-90 grid-cols-2 gap-4 pt-20 sm:grid-cols-3 lg:grid-cols-4">
				{genericDeskData.map((desk) => {
					const isAvailable = !occupiedSet.has(String(desk.id));

					return (
						<button
							key={desk.id}
							type="button"
							disabled={!isAvailable}
							onClick={() => {
								if (!isAvailable) return;
								onSelectDesk(desk.id);
							}}
							className={`group relative flex min-h-23 cursor-pointer items-center justify-center rounded-3xl border-2 text-sm font-semibold transition duration-200 ${selectedDesk === desk.id
								? "border-blue-400 bg-blue-50 text-blue-700 shadow-md shadow-blue-100"
								: isAvailable
									? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:scale-[1.02] hover:border-emerald-300"
									: "cursor-not-allowed border-rose-200 bg-rose-50 text-rose-700"
								}`}
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
						</button>
					);
				})}
			</div>
		</div>
	);
}