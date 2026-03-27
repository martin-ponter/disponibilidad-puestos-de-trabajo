import { officeMaps } from "../../../data/maps/office-maps";

export const officeRooms = Object.values(officeMaps).reduce((acc, map) => {
  if (!acc[map.office]) {
    acc[map.office] = [];
  }

  if (!acc[map.office].includes(map.room)) {
    acc[map.office].push(map.room);
  }

  return acc;
}, {});

export const officeDeskData = {
  Toledo: [
    { id: "T1", available: true },
    { id: "T2", available: true },
    { id: "T3", available: true },
    { id: "T4", available: true },
    { id: "T5", available: false },
    { id: "T6", available: true },
    { id: "T7", available: true },
    { id: "T8", available: true },
  ],
  Madrid: [
    { id: "M1", available: true },
    { id: "M2", available: true },
    { id: "M3", available: true },
    { id: "M4", available: true },
    { id: "M5", available: false },
    { id: "M6", available: false },
    { id: "M7", available: true },
    { id: "M8", available: true },
  ],
  Consuegra: [
    { id: "C1", available: true },
    { id: "C2", available: true },
    { id: "C3", available: true },
    { id: "C4", available: true },
    { id: "C5", available: false },
    { id: "C6", available: true },
    { id: "C7", available: true },
    { id: "C8", available: false },
  ],
};

export const initialReservations = [
  {
    id: "r1",
    employeeId: "u1",
    employeeName: "Pepe García",
    employeeAvatar:
      "https://ui-avatars.com/api/?name=Pepe+Garcia&background=e2e8f0&color=0f172a",
    employeeEmail: "pepe@empresa.com",
    employeePhone: "600111222",
    date: "2026-03-30",
    status: "office",
    office: "Toledo",
    room: "Sala Principal",
    deskId: "T2",
    startTime: "09:00",
    endTime: "14:00",
  },
  {
    id: "r2",
    employeeId: "u2",
    employeeName: "Lucía Martín",
    employeeAvatar:
      "https://ui-avatars.com/api/?name=Lucia+Martin&background=dbeafe&color=1d4ed8",
    employeeEmail: "lucia@empresa.com",
    employeePhone: "600222333",
    date: "2026-03-30",
    status: "office",
    office: "Toledo",
    room: "Sala Principal",
    deskId: "T4",
    startTime: "09:00",
    endTime: "18:00",
  },
  {
    id: "r3",
    employeeId: "u3",
    employeeName: "Carlos Pérez",
    employeeAvatar:
      "https://ui-avatars.com/api/?name=Carlos+Perez&background=fce7f3&color=9d174d",
    employeeEmail: "carlos@empresa.com",
    employeePhone: "600333444",
    date: "2026-03-30",
    status: "remote",
    office: "Madrid",
    room: "Sala Vistas Plaza de las Cortes",
    deskId: null,
    startTime: "08:00",
    endTime: "15:00",
  },
  {
    id: "r4",
    employeeId: "u4",
    employeeName: "Marta López",
    employeeAvatar:
      "https://ui-avatars.com/api/?name=Marta+Lopez&background=dcfce7&color=166534",
    employeeEmail: "marta@empresa.com",
    employeePhone: "600444555",
    date: "2026-03-30",
    status: "event",
    office: "Madrid",
    room: "Despacho Luis",
    deskId: null,
    startTime: "10:00",
    endTime: "13:00",
  },
  {
    id: "r5",
    employeeId: "u5",
    employeeName: "Ana Ruiz",
    employeeAvatar:
      "https://ui-avatars.com/api/?name=Ana+Ruiz&background=ede9fe&color=6d28d9",
    employeeEmail: "ana@empresa.com",
    employeePhone: "600555666",
    date: "2026-03-30",
    status: "not-working",
    office: null,
    room: null,
    deskId: null,
    startTime: null,
    endTime: null,
  },
  {
    id: "r6",
    employeeId: "u6",
    employeeName: "Javier Torres",
    employeeAvatar:
      "https://ui-avatars.com/api/?name=Javier+Torres&background=fef3c7&color=92400e",
    employeeEmail: "javier@empresa.com",
    employeePhone: "600666777",
    date: "2026-03-30",
    status: "office",
    office: "Madrid",
    room: "Sala Vistas Plaza de las Cortes",
    deskId: "MAD-01",
    startTime: "09:00",
    endTime: "14:00",
  },
];
