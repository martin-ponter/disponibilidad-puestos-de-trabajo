import React, { useMemo } from "react";

const COMEDOR_MAPS = {
	Toledo: {
	name: "Comedor Toledo",
	width: 1000,
	height: 620,
	hasWindows: false,
	tables: [
		{
			id: "table-toledo-main",
			x: 455,
			y: 120,
			w: 140,
			h: 300,
			label: "Mesa central",
			seats: [
				{ id: "TOL-CMDR-01", x: 320, y: 150 },
				{ id: "TOL-CMDR-02", x: 320, y: 235 },
				{ id: "TOL-CMDR-03", x: 320, y: 320 },
				{ id: "TOL-CMDR-04", x: 320, y: 405 },

				{ id: "TOL-CMDR-05", x: 700, y: 150 },
				{ id: "TOL-CMDR-06", x: 700, y: 235 },
				{ id: "TOL-CMDR-07", x: 700, y: 320 },
				{ id: "TOL-CMDR-08", x: 700, y: 405 },

				{ id: "TOL-CMDR-09", x: 522, y: 530 },
			],
		},
	],
},
	Madrid: {
		name: "Comedor Madrid",
		width: 1000,
		height: 620,
		hasWindows: false,
		tables: [
			{
				id: "table-madrid-main",
				x: 250,
				y: 220,
				w: 500,
				h: 140,
				label: "Mesa central",
				seats: [
					{ id: "MAD-CMDR-01", x: 350, y: 100 },
					{ id: "MAD-CMDR-02", x: 500, y: 100 },
					{ id: "MAD-CMDR-03", x: 650, y: 100 },
					{ id: "MAD-CMDR-04", x: 350, y: 415 },
					{ id: "MAD-CMDR-05", x: 500, y: 415 },
					{ id: "MAD-CMDR-06", x: 650, y: 415 },
				],
			},
		],
	},
	
};

function pct(value, total) {
	return `${(value / total) * 100}%`;
}

function getSeatClasses(isOccupied, isSelected) {
	const base =
		"absolute flex items-center justify-center rounded-full border text-[9px] font-semibold transition";

	if (isSelected) {
		return `${base} border-blue-500 bg-blue-50 text-blue-700 shadow-md shadow-blue-100`;
	}

	if (isOccupied) {
		return `${base} cursor-not-allowed border-rose-200 bg-rose-50 text-rose-700`;
	}

	return `${base} border-emerald-200 bg-emerald-50 text-emerald-700 hover:scale-105 hover:border-emerald-300`;
}

function getSeatLabelOffset(seatId, office) {
	if (office === "Toledo") {
		if (seatId === "TOL-CMDR-09") {
			return {
				left: "50%",
				top: "100%",
				transform: "translate(-50%, 12px)",
			};
		}

		const num = Number(seatId.split("-").pop());

		if (num >= 1 && num <= 4) {
			return {
				right: "100%",
				top: "50%",
				transform: "translate(-18px, -50%)",
			};
		}

		return {
			left: "100%",
			top: "50%",
			transform: "translate(18px, -50%)",
		};
	}

	return {
		left: "50%",
		top: "100%",
		transform: "translate(-50%, 8px)",
	};
}

export default function ComedorMapReact({
	office,
	selectedSeat,
	onSelectSeat,
	occupiedSeatIds = [],
}) {
	const map = COMEDOR_MAPS[office];

	const occupiedSet = useMemo(
		() => new Set((occupiedSeatIds || []).map(String)),
		[occupiedSeatIds]
	);

	if (!map) {
		return (
			<div className="flex min-h-[420px] items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-white p-8 text-center">
				<div className="max-w-md">
					<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-2xl shadow-sm">
						🗺️
					</div>
					<h4 className="text-lg font-semibold text-slate-900">
						No hay mapa de comedor disponible
					</h4>
					<p className="mt-2 text-sm leading-6 text-slate-500">
						Selecciona una oficina válida para visualizar su plano.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="mx-auto flex w-full justify-center">
			<div
				className="relative w-full max-w-[900px] overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-100 to-white"
				style={{
					aspectRatio: `${map.width} / ${map.height}`,
					maxHeight: "calc(100vh - 260px)",
				}}
			>
				<div className="absolute left-[3%] top-[4%] rounded-2xl bg-white/90 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
					{map.name}
				</div>

				{map.hasWindows !== false ? (
					<>
						<div className="absolute left-[2%] top-[15%] h-[68%] w-[2px] bg-slate-300" />
						<div className="absolute left-[1%] top-[50%] -translate-y-1/2 -rotate-90 text-[10px] font-semibold tracking-wide text-slate-400">
							VENTANA
						</div>
					</>
				) : null}

				<div className="absolute bottom-[4%] right-[6%] rounded-2xl bg-white/90 px-4 py-2 text-xs font-semibold text-slate-500 shadow-sm">
					ENTRADA
				</div>

				{map.tables.map((table) => (
					<React.Fragment key={table.id}>
						<div
							className="absolute rounded-[28px] border border-slate-300 bg-slate-200/80 shadow-inner"
							style={{
								left: pct(table.x, map.width),
								top: pct(table.y, map.height),
								width: pct(table.w, map.width),
								height: pct(table.h, map.height),
							}}
						/>

						<div
							className="absolute flex items-center justify-center text-xs font-semibold tracking-wide text-slate-500"
							style={{
								left: pct(table.x, map.width),
								top: pct(table.y + table.h / 2 - 12, map.height),
								width: pct(table.w, map.width),
								height: "24px",
							}}
						>
							{table.label}
						</div>

						{table.seats.map((seat) => {
							const isOccupied = occupiedSet.has(String(seat.id));
							const isSelected = selectedSeat === seat.id;
							const labelPosition = getSeatLabelOffset(seat.id, office);

							return (
								<div
									key={seat.id}
									className="absolute"
									style={{
                                        left: `calc(${pct(seat.x, map.width)} - 24px)`,
                                        top: `calc(${pct(seat.y, map.height)} - 24px)`,
                                        width: "48px",
                                        height: "48px",
                                        overflow: "visible",
                                    }}
								>
									<button
										type="button"
										disabled={isOccupied}
										onClick={() => {
											if (isOccupied) return;
											onSelectSeat?.(seat.id);
										}}
										className={getSeatClasses(isOccupied, isSelected)}
										style={{
											width: "48px",
											height: "48px",
										}}
										title={seat.id}
									>
										<span>{seat.id.split("-").pop()}</span>
									</button>

									<div
										className="pointer-events-none absolute whitespace-nowrap text-[10px] font-semibold text-slate-500"
										style={labelPosition}
									>
										{seat.id}
									</div>
								</div>
							);
						})}
					</React.Fragment>
				))}
			</div>
		</div>
	);
}
