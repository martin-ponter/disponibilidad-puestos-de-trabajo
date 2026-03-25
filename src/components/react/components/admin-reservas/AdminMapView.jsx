import { useMemo, useState } from "react";
import { officeDeskData } from "../../data/adminReservations";
import { officeMaps } from "../../../../data/maps/office-maps";
import UserCard from "../compañeros/CardIndividual.jsx";

function pct(value, total) {
  return `${(value / total) * 100}%`;
}

function normalizeDeskId(value) {
  return String(value ?? "").trim().toUpperCase();
}

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

function getDeskCardClasses(availability, isSelected, isHighlighted) {
  const base =
    "absolute flex items-center justify-center border text-[9px] sm:text-[11px] font-semibold transition rounded-2xl";

  if (availability === "blocked") {
    return `${base} cursor-not-allowed border-slate-300 bg-slate-100 text-slate-500`;
  }

  if (isHighlighted) {
    return `${base} border-blue-200 bg-blue-200 text-blue-700 cursor-pointer hover:border-blue-300 ${isSelected ? "ring-2 ring-slate-400" : ""
      }`;
  }

  if (availability === "occupied") {
    return `${base} border-rose-200 bg-rose-50 text-rose-700 cursor-pointer hover:border-rose-300 ${isSelected ? "ring-2 ring-slate-400" : ""
      }`;
  }

  return `${base} cursor-default border-emerald-200 bg-emerald-50 text-emerald-700 ${isSelected ? "ring-2 ring-slate-400" : ""
    }`;
}

function getGenericDeskClasses(availability, isSelected, isHighlighted) {
  const base =
    "relative flex min-h-[96px] flex-col items-center justify-center rounded-3xl border-2 p-3 text-center text-sm font-semibold transition duration-200";

  if (availability === "blocked") {
    return `${base} cursor-not-allowed border-slate-300 bg-slate-100 text-slate-500`;
  }

  if (isHighlighted) {
    return `${base} cursor-pointer border-blue-200 bg-blue-50 text-blue-700 hover:scale-[1.02] hover:border-blue-300 ${isSelected ? "ring-2 ring-slate-400" : ""
      }`;
  }

  if (availability === "occupied") {
    return `${base} cursor-pointer border-rose-200 bg-rose-50 text-rose-700 hover:scale-[1.02] hover:border-rose-300 ${isSelected ? "ring-2 ring-slate-400" : ""
      }`;
  }

  return `${base} cursor-default border-emerald-200 bg-emerald-50 text-emerald-700 ${isSelected ? "ring-2 ring-slate-400" : ""
    }`;
}

export default function AdminMapView({
  office,
  room,
  date,
  reservations,
  highlightedReservationIds = [],
  selectedReservationId,
  onSelectReservation,
  onAssignFirstFree,
  canAssignFirstFree,
  formatHumanDate,
  isLoading = false,
}) {
  const [hoveredDeskId, setHoveredDeskId] = useState("");
  const [hoverCard, setHoverCard] = useState(null);

  const shouldShowEmpty = office === "all" || room === "all";

  const mapKey = `${office}::${room}`;
  const customMap = officeMaps[mapKey] || null;

  const roomReservations = useMemo(() => {
    return reservations.filter((item) => item.office === office && item.room === room);
  }, [reservations, office, room]);

  const reservationByDeskId = useMemo(() => {
    return roomReservations.reduce((acc, item) => {
      const key = normalizeDeskId(item.deskId);
      if (key) acc[key] = item;
      return acc;
    }, {});
  }, [roomReservations]);

  const highlightedReservationIdSet = useMemo(() => {
    return new Set((highlightedReservationIds || []).map(Number));
  }, [highlightedReservationIds]);

  const hoveredReservation = useMemo(() => {
    if (!hoveredDeskId) return null;
    return reservationByDeskId[hoveredDeskId] || null;
  }, [hoveredDeskId, reservationByDeskId]);

  const hoveredUser = useMemo(() => {
    if (!hoveredReservation) return {};

    return {
      NAME:
        hoveredReservation.employeeName?.split(" ").slice(0, -1).join(" ") ||
        hoveredReservation.employeeName ||
        "",
      LAST_NAME:
        hoveredReservation.employeeName?.split(" ").slice(-1).join(" ") || "",
      EMAIL: hoveredReservation.employeeEmail || "",
      PERSONAL_PHOTO: hoveredReservation.employeeAvatar || "",
      PERSONAL_PHOTO_PATH: hoveredReservation.employeeAvatar || "",
    };
  }, [hoveredReservation]);

  const genericDesks = officeDeskData[office] || [];

  function handleDeskMouseEnter(deskId, event) {
    const normalizedDeskId = normalizeDeskId(deskId);
    if (!reservationByDeskId[normalizedDeskId]) return;

    setHoveredDeskId(normalizedDeskId);
    setHoverCard(getHoverCardPosition(event));
  }

  function handleDeskMouseMove(deskId, event) {
    const normalizedDeskId = normalizeDeskId(deskId);
    if (!reservationByDeskId[normalizedDeskId]) return;

    setHoverCard(getHoverCardPosition(event));
  }

  function handleDeskMouseLeave(deskId) {
    const normalizedDeskId = normalizeDeskId(deskId);
    if (hoveredDeskId === normalizedDeskId) {
      setHoveredDeskId("");
      setHoverCard(null);
    }
  }

  if (shouldShowEmpty) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70 sm:p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Mapa de sala</h2>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
            <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2 xl:grid-cols-5">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-emerald-400"></span>
                Libre
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-rose-400"></span>
                Ocupada
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-blue-400"></span>
                Búsqueda
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-slate-400"></span>
                Seleccionada
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-slate-300"></span>
                No disponible
              </div>
            </div>
          </div>
        </div>

        <div className="flex min-h-[420px] items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <div className="max-w-md">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
              🗺️
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Aún no hay plano cargado</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Selecciona oficina y sala para ver el mapa y las asignaciones del día.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70 sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Mapa de sala</h2>
          <p className="mt-1 text-sm text-slate-500">
            {office} · {room} · {formatHumanDate(date)}
          </p>
        </div>

        <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2 xl:grid-cols-5">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-emerald-400"></span>
              Libre
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-rose-400"></span>
              Ocupada
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-blue-400"></span>
              Búsqueda
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-slate-400"></span>
              Seleccionada
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-slate-300"></span>
              No disponible
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-visible rounded-[28px] border border-slate-200 bg-slate-50 p-5 sm:p-7">
        <div className="relative flex min-h-[460px] items-center justify-center rounded-[24px] border border-slate-200 bg-gradient-to-br from-slate-100 to-white p-5 sm:min-h-[620px] sm:p-8 overflow-visible">
          {customMap ? (
            <div className="mx-auto flex w-full justify-center px-2 sm:px-4">
              <div
                className="relative w-full max-w-[900px] overflow-visible rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-100 to-white"
                style={{
                  aspectRatio: `${customMap.width} / ${customMap.height}`,
                  maxHeight: "calc(100vh - 220px)",
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
                          className="absolute flex items-center justify-center text-[9px] sm:text-[11px] font-semibold tracking-wide text-slate-500"
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
                          className={`absolute border border-slate-300 bg-transparent ${feature.rounded ? "rounded-[24px]" : ""
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
                  const normalizedDesk = normalizeDeskId(desk.id);
                  const reservation = reservationByDeskId[normalizedDesk];
                  const isSelected = reservation?.id === selectedReservationId;
                  const isHighlighted = reservation
                    ? highlightedReservationIdSet.has(Number(reservation.id))
                    : false;

                  let availability = "free";
                  if (reservation) availability = "occupied";

                  return (
                    <div
                      key={desk.id}
                      onMouseEnter={(e) => handleDeskMouseEnter(desk.id, e)}
                      onMouseMove={(e) => handleDeskMouseMove(desk.id, e)}
                      onMouseLeave={() => handleDeskMouseLeave(desk.id)}
                      className={`${getDeskCardClasses(
                        availability,
                        Boolean(isSelected),
                        isHighlighted
                      )} ${availability === "occupied" ? "cursor-pointer" : "cursor-default"}`}
                      style={{
                        left: pct(desk.x, customMap.width),
                        top: pct(desk.y, customMap.height),
                        width: pct(desk.w, customMap.width),
                        height: pct(desk.h, customMap.height),
                      }}
                      onClick={() => reservation && onSelectReservation(reservation.id)}
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
            <div className="relative w-full rounded-[24px] border border-slate-200 bg-gradient-to-br from-slate-100 to-white p-5 sm:min-h-[620px] sm:p-8 overflow-visible">
              <div className="absolute left-4 top-4 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 sm:left-6 sm:top-6">
                Entrada
              </div>

              <div className="absolute right-4 top-4 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 sm:right-6 sm:top-6">
                Ventanas
              </div>

              <div className="absolute left-1/2 top-6 h-14 w-32 -translate-x-1/2 rounded-2xl border border-slate-200 bg-slate-200/70"></div>
              <div className="absolute bottom-6 left-6 right-6 h-3 rounded-full bg-slate-200"></div>

              <div className="grid min-h-[420px] grid-cols-2 gap-5 pt-24 sm:grid-cols-3 lg:grid-cols-4">
                {genericDesks.map((desk) => {
                  const normalizedDesk = normalizeDeskId(desk.id);
                  const reservation = reservationByDeskId[normalizedDesk];
                  const isSelected = reservation?.id === selectedReservationId;
                  const isHighlighted = reservation
                    ? highlightedReservationIdSet.has(Number(reservation.id))
                    : false;

                  let availability = "free";
                  if (desk.available === false) availability = "blocked";
                  else if (reservation) availability = "occupied";

                  return (
                    <div
                      key={desk.id}
                      onMouseEnter={(e) => handleDeskMouseEnter(desk.id, e)}
                      onMouseMove={(e) => handleDeskMouseMove(desk.id, e)}
                      onMouseLeave={() => handleDeskMouseLeave(desk.id)}
                      onClick={() => reservation && onSelectReservation(reservation.id)}
                      className={`${getGenericDeskClasses(
                        availability,
                        Boolean(isSelected),
                        isHighlighted
                      )} ${availability === "occupied" ? "cursor-pointer" : "cursor-default"}`}
                    >
                      <span className="text-base">{desk.id}</span>

                      {availability === "free" && (
                        <span className="mt-2 rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-medium text-emerald-700">
                          Libre
                        </span>
                      )}

                      {availability === "blocked" && (
                        <span className="mt-2 rounded-full bg-slate-200 px-2 py-1 text-[11px] font-medium text-slate-600">
                          No disponible
                        </span>
                      )}

                      {availability === "occupied" && (
                        <span
                          className={`mt-2 rounded-full px-2 py-1 text-[11px] font-medium ${isHighlighted
                            ? "bg-blue-100 text-blue-700"
                            : "bg-rose-100 text-rose-700"
                            }`}
                        >
                          {isHighlighted ? "Coincide" : "Ocupada"}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="absolute inset-0 z-20 flex items-center justify-center rounded-[24px] bg-white/55 backdrop-blur-[1px]">
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
                Actualizando datos...
              </div>
            </div>
          ) : null}

          {hoveredReservation && hoverCard ? (
            <div
              className="fixed z-50 w-[340px] pointer-events-none"
              style={{
                left: `${hoverCard.left}px`,
                top: `${hoverCard.top}px`,
              }}
            >
              <div className="mb-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-lg">
                <p className="text-sm font-semibold text-slate-900">Mesa {hoveredDeskId}</p>
                <p className="text-xs text-slate-500">Asignación activa del día</p>
              </div>

              <UserCard
                user={hoveredUser}
                entry={hoveredReservation.raw}
                selectedTime={hoveredReservation.startTime || ""}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}