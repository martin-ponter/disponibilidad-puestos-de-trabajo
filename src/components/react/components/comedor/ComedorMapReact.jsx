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
				x: 430,
				y: 150,
				w: 180,
				h: 300,
				label: "Mesa central",
				seats: [
					{ id: "TOL-CMDR-01", x: 380, y: 190 },
					{ id: "TOL-CMDR-02", x: 380, y: 250 },
					{ id: "TOL-CMDR-03", x: 380, y: 310 },
					{ id: "TOL-CMDR-04", x: 380, y: 370 },

					{ id: "TOL-CMDR-05", x: 660, y: 190 },
					{ id: "TOL-CMDR-06", x: 660, y: 250 },
					{ id: "TOL-CMDR-07", x: 660, y: 310 },
					{ id: "TOL-CMDR-08", x: 660, y: 370 },

					{ id: "TOL-CMDR-09", x: 520, y: 500 },
				],
			},
		],
	},
	Madrid: {
		name: "Comedor Madrid",
		width: 1000,
		height: 620,
		tables: [
			{
				id: "table-1",
				x: 180,
				y: 120,
				w: 260,
				h: 115,
				label: "Mesa A",
				seats: [
					{ id: "COM-MAD-01", x: 220, y: 80 },
					{ id: "COM-MAD-02", x: 320, y: 80 },
					{ id: "COM-MAD-03", x: 220, y: 255 },
					{ id: "COM-MAD-04", x: 320, y: 255 },
				],
			},
			{
				id: "table-2",
				x: 560,
				y: 120,
				w: 260,
				h: 115,
				label: "Mesa B",
				seats: [
					{ id: "COM-MAD-05", x: 600, y: 80 },
					{ id: "COM-MAD-06", x: 700, y: 80 },
					{ id: "COM-MAD-07", x: 600, y: 255 },
					{ id: "COM-MAD-08", x: 700, y: 255 },
				],
			},
			{
				id: "table-3",
				x: 180,
				y: 380,
				w: 260,
				h: 115,
				label: "Mesa C",
				seats: [
					{ id: "COM-MAD-09", x: 220, y: 340 },
					{ id: "COM-MAD-10", x: 320, y: 340 },
					{ id: "COM-MAD-11", x: 220, y: 515 },
					{ id: "COM-MAD-12", x: 320, y: 515 },
				],
			},
			{
				id: "table-4",
				x: 560,
				y: 380,
				w: 260,
				h: 115,
				label: "Mesa D",
				seats: [
					{ id: "COM-MAD-13", x: 600, y: 340 },
					{ id: "COM-MAD-14", x: 700, y: 340 },
					{ id: "COM-MAD-15", x: 600, y: 515 },
					{ id: "COM-MAD-16", x: 700, y: 515 },
				],
			},
		],
	},
	Alcobendas: {
		name: "Comedor Alcobendas",
		width: 1000,
		height: 620,
		tables: [
			{
				id: "table-1",
				x: 150,
				y: 130,
				w: 180,
				h: 260,
				label: "Mesa 1",
				seats: [
					{ id: "COM-ALC-01", x: 110, y: 165 },
					{ id: "COM-ALC-02", x: 110, y: 265 },
					{ id: "COM-ALC-03", x: 370, y: 165 },
					{ id: "COM-ALC-04", x: 370, y: 265 },
				],
			},
			{
				id: "table-2",
				x: 410,
				y: 130,
				w: 180,
				h: 260,
				label: "Mesa 2",
				seats: [
					{ id: "COM-ALC-05", x: 370, y: 165 },
					{ id: "COM-ALC-06", x: 370, y: 265 },
					{ id: "COM-ALC-07", x: 630, y: 165 },
					{ id: "COM-ALC-08", x: 630, y: 265 },
				],
			},
			{
				id: "table-3",
				x: 670,
				y: 130,
				w: 180,
				h: 260,
				label: "Mesa 3",
				seats: [
					{ id: "COM-ALC-09", x: 630, y: 165 },
					{ id: "COM-ALC-10", x: 630, y: 265 },
					{ id: "COM-ALC-11", x: 890, y: 165 },
					{ id: "COM-ALC-12", x: 890, y: 265 },
				],
			},
			{
				id: "table-4",
				x: 350,
				y: 430,
				w: 300,
				h: 90,
				label: "Barra",
				seats: [
					{ id: "COM-ALC-13", x: 370, y: 555 },
					{ id: "COM-ALC-14", x: 450, y: 555 },
					{ id: "COM-ALC-15", x: 530, y: 555 },
					{ id: "COM-ALC-16", x: 610, y: 555 },
				],
			},
		],
	},
	Consuegra: {
		name: "Comedor Consuegra",
		width: 1000,
		height: 620,
		tables: [
			{
				id: "table-1",
				x: 235,
				y: 150,
				w: 530,
				h: 90,
				label: "Mesa central",
				seats: [
					{ id: "COM-CON-01", x: 280, y: 110 },
					{ id: "COM-CON-02", x: 380, y: 110 },
					{ id: "COM-CON-03", x: 480, y: 110 },
					{ id: "COM-CON-04", x: 580, y: 110 },
					{ id: "COM-CON-05", x: 680, y: 110 },
					{ id: "COM-CON-06", x: 280, y: 260 },
					{ id: "COM-CON-07", x: 380, y: 260 },
					{ id: "COM-CON-08", x: 480, y: 260 },
					{ id: "COM-CON-09", x: 580, y: 260 },
					{ id: "COM-CON-10", x: 680, y: 260 },
				],
			},
			{
				id: "table-2",
				x: 315,
				y: 380,
				w: 370,
				h: 80,
				label: "Mesa apoyo",
				seats: [
					{ id: "COM-CON-11", x: 360, y: 340 },
					{ id: "COM-CON-12", x: 470, y: 340 },
					{ id: "COM-CON-13", x: 580, y: 340 },
					{ id: "COM-CON-14", x: 360, y: 485 },
					{ id: "COM-CON-15", x: 470, y: 485 },
					{ id: "COM-CON-16", x: 580, y: 485 },
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
		"absolute flex items-center justify-center rounded-full border text-[11px] font-semibold transition";

	if (isSelected) {
		return `${base} border-blue-500 bg-blue-50 text-blue-700 shadow-md shadow-blue-100`;
	}

	if (isOccupied) {
		return `${base} cursor-not-allowed border-rose-200 bg-rose-50 text-rose-700`;
	}

	return `${base} border-emerald-200 bg-emerald-50 text-emerald-700 hover:scale-105 hover:border-emerald-300`;
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
						Selecciona una oficina válida para visualizar su plano provisional.
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

				<div className="absolute right-[3%] top-[4%] rounded-2xl border border-slate-200 bg-white/90 px-4 py-2 text-xs text-slate-500 shadow-sm">
					Plano provisional
				</div>

				<div className="absolute left-[2%] top-[15%] h-[68%] w-[2px] bg-slate-300" />
				<div className="absolute left-[1%] top-[50%] -translate-y-1/2 -rotate-90 text-[10px] font-semibold tracking-wide text-slate-400">
					VENTANA
				</div>

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

							return (
								<button
									key={seat.id}
									type="button"
									disabled={isOccupied}
									onClick={() => {
										if (isOccupied) return;
										onSelectSeat?.(seat.id);
									}}
									className={getSeatClasses(isOccupied, isSelected)}
									style={{
										left: `calc(${pct(seat.x, map.width)} - 24px)`,
										top: `calc(${pct(seat.y, map.height)} - 24px)`,
										width: "48px",
										height: "48px",
									}}
									title={seat.id}
								>
									<span>{seat.id.split("-").slice(-1)[0]}</span>
								</button>
							);
						})}
					</React.Fragment>
				))}
			</div>
		</div>
	);
}