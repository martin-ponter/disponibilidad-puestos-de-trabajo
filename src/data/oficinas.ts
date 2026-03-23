import type { Centro } from '../types/reservas';

export const CENTROS: Centro[] = [
  {
    id: 'toledo',
    nombre: 'Centro Toledo',
    codigo: 'TOL',
    ciudad: 'Toledo',
    direccion: 'Av. de Irlanda 18, Toledo',
    timezone: 'Europe/Madrid',
    salas: [
      {
        id: 'tol-planta-abierta',
        centroId: 'toledo',
        nombre: 'Planta Abierta',
        codigo: 'TOL-PA',
        planta: 'Planta 2',
        descripcion: 'Zona abierta con puestos flexibles y una sala ágil.',
        mapa: {
          width: 100,
          height: 68,
          fondo:
            'linear-gradient(135deg, rgba(17,56,62,0.18), rgba(236,117,87,0.10)), linear-gradient(0deg, #fbf5eb, #fffdf7)',
        },
        recursos: [
          { id: 'tol-p01', nombre: 'Puesto P01', codigo: 'P01', tipo: 'puesto', modoReserva: 'individual', etiquetas: ['Ventana', 'Dock USB-C'], posicion: { x: 12, y: 18, width: 14, height: 16 } },
          { id: 'tol-p02', nombre: 'Puesto P02', codigo: 'P02', tipo: 'puesto', modoReserva: 'individual', etiquetas: ['Silencioso'], posicion: { x: 30, y: 18, width: 14, height: 16 } },
          { id: 'tol-p03', nombre: 'Puesto P03', codigo: 'P03', tipo: 'puesto', modoReserva: 'individual', etiquetas: ['Doble monitor'], posicion: { x: 48, y: 18, width: 14, height: 16 } },
          { id: 'tol-p04', nombre: 'Puesto P04', codigo: 'P04', tipo: 'puesto', modoReserva: 'individual', etiquetas: ['Dock USB-C'], posicion: { x: 12, y: 40, width: 14, height: 16 } },
          { id: 'tol-p05', nombre: 'Puesto P05', codigo: 'P05', tipo: 'puesto', modoReserva: 'individual', etiquetas: ['Cerca de impresora'], posicion: { x: 30, y: 40, width: 14, height: 16 } },
          { id: 'tol-sala-agil', nombre: 'Sala Ágil', codigo: 'SA1', tipo: 'sala', modoReserva: 'completa', capacidad: 6, etiquetas: ['Pantalla', 'Pizarra'], posicion: { x: 68, y: 18, width: 20, height: 38 } },
        ],
      },
      {
        id: 'tol-focus',
        centroId: 'toledo',
        nombre: 'Zona Focus',
        codigo: 'TOL-ZF',
        planta: 'Planta 1',
        descripcion: 'Área de concentración con puestos y una sala de revisión.',
        mapa: {
          width: 100,
          height: 62,
          fondo:
            'linear-gradient(145deg, rgba(29,92,102,0.14), rgba(246,196,93,0.12)), linear-gradient(0deg, #f8f1e7, #fffdfa)',
        },
        recursos: [
          { id: 'tol-f01', nombre: 'Puesto F01', codigo: 'F01', tipo: 'puesto', modoReserva: 'individual', etiquetas: ['Silencioso'], posicion: { x: 10, y: 16, width: 16, height: 18 } },
          { id: 'tol-f02', nombre: 'Puesto F02', codigo: 'F02', tipo: 'puesto', modoReserva: 'individual', etiquetas: ['Doble monitor'], posicion: { x: 30, y: 16, width: 16, height: 18 } },
          { id: 'tol-f03', nombre: 'Puesto F03', codigo: 'F03', tipo: 'puesto', modoReserva: 'individual', etiquetas: ['Ventana'], posicion: { x: 50, y: 16, width: 16, height: 18 } },
          { id: 'tol-review', nombre: 'Sala Review', codigo: 'SR1', tipo: 'sala', modoReserva: 'completa', capacidad: 4, etiquetas: ['Videollamada'], posicion: { x: 70, y: 14, width: 20, height: 34 } },
        ],
      },
    ],
  },
  {
    id: 'madrid',
    nombre: 'Centro Madrid',
    codigo: 'MAD',
    ciudad: 'Madrid',
    direccion: 'Paseo de la Castellana 89, Madrid',
    timezone: 'Europe/Madrid',
    salas: [
      {
        id: 'mad-open',
        centroId: 'madrid',
        nombre: 'Open Space Norte',
        codigo: 'MAD-ON',
        planta: 'Planta 5',
        descripcion: 'Zona principal con puestos compartidos y sala grande.',
        mapa: {
          width: 100,
          height: 70,
          fondo:
            'linear-gradient(135deg, rgba(123,60,40,0.10), rgba(17,56,62,0.12)), linear-gradient(0deg, #fcf8ef, #fffdf8)',
        },
        recursos: [
          { id: 'mad-n01', nombre: 'Puesto N01', codigo: 'N01', tipo: 'puesto', modoReserva: 'individual', etiquetas: ['Dock USB-C'], posicion: { x: 12, y: 16, width: 12, height: 14 } },
          { id: 'mad-n02', nombre: 'Puesto N02', codigo: 'N02', tipo: 'puesto', modoReserva: 'individual', etiquetas: ['Ventana'], posicion: { x: 28, y: 16, width: 12, height: 14 } },
          { id: 'mad-n03', nombre: 'Puesto N03', codigo: 'N03', tipo: 'puesto', modoReserva: 'individual', etiquetas: ['Doble monitor'], posicion: { x: 44, y: 16, width: 12, height: 14 } },
          { id: 'mad-n04', nombre: 'Puesto N04', codigo: 'N04', tipo: 'puesto', modoReserva: 'individual', etiquetas: ['Silencioso'], posicion: { x: 12, y: 38, width: 12, height: 14 } },
          { id: 'mad-n05', nombre: 'Puesto N05', codigo: 'N05', tipo: 'puesto', modoReserva: 'individual', etiquetas: ['Cerca equipo'], posicion: { x: 28, y: 38, width: 12, height: 14 } },
          { id: 'mad-cibeles', nombre: 'Sala Cibeles', codigo: 'SCB', tipo: 'sala', modoReserva: 'completa', capacidad: 10, etiquetas: ['Pantalla', 'VC', 'Pizarra'], posicion: { x: 62, y: 16, width: 24, height: 36 } },
        ],
      },
      {
        id: 'mad-proyecto',
        centroId: 'madrid',
        nombre: 'Zona Proyecto',
        codigo: 'MAD-ZP',
        planta: 'Planta 4',
        descripcion: 'Espacio para equipos de proyecto y reuniones rápidas.',
        mapa: {
          width: 100,
          height: 66,
          fondo:
            'linear-gradient(140deg, rgba(246,196,93,0.12), rgba(36,84,92,0.12)), linear-gradient(0deg, #fff8ee, #fffdf9)',
        },
        recursos: [
          { id: 'mad-z01', nombre: 'Puesto Z01', codigo: 'Z01', tipo: 'puesto', modoReserva: 'individual', etiquetas: ['Dock USB-C'], posicion: { x: 14, y: 20, width: 14, height: 16 } },
          { id: 'mad-z02', nombre: 'Puesto Z02', codigo: 'Z02', tipo: 'puesto', modoReserva: 'individual', etiquetas: ['Pizarra cercana'], posicion: { x: 32, y: 20, width: 14, height: 16 } },
          { id: 'mad-z03', nombre: 'Puesto Z03', codigo: 'Z03', tipo: 'puesto', modoReserva: 'individual', etiquetas: ['Ventana'], posicion: { x: 50, y: 20, width: 14, height: 16 } },
          { id: 'mad-retro', nombre: 'Sala Retro', codigo: 'SRE', tipo: 'sala', modoReserva: 'completa', capacidad: 8, etiquetas: ['Pantalla'], posicion: { x: 70, y: 18, width: 18, height: 32 } },
        ],
      },
    ],
  },
];
