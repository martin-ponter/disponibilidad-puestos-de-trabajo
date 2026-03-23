const FORMATEADOR_MES = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' });
const FORMATEADOR_FECHA_LARGA = new Intl.DateTimeFormat('es-ES', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

export interface DiaCalendario {
  iso: string;
  numero: number;
  perteneceAlMes: boolean;
  esHoy: boolean;
}

export interface MesCalendario {
  etiqueta: string;
  diasSemana: string[];
  dias: DiaCalendario[];
}

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function fromIsoDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

export function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

export function formatDateLong(value: string): string {
  return FORMATEADOR_FECHA_LARGA.format(fromIsoDate(value));
}

export function buildMonth(date: Date): MesCalendario {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const startWeekday = (firstDay.getDay() + 6) % 7;
  const firstVisibleDay = new Date(date.getFullYear(), date.getMonth(), 1 - startWeekday);

  const dias = Array.from({ length: 42 }, (_, index) => {
    const current = new Date(
      firstVisibleDay.getFullYear(),
      firstVisibleDay.getMonth(),
      firstVisibleDay.getDate() + index,
    );

    return {
      iso: toIsoDate(current),
      numero: current.getDate(),
      perteneceAlMes: current.getMonth() === date.getMonth(),
      esHoy: toIsoDate(current) === toIsoDate(new Date()),
    };
  });

  return {
    etiqueta: FORMATEADOR_MES.format(firstDay),
    diasSemana: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
    dias,
  };
}
