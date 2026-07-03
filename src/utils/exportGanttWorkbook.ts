import { eachDayOfInterval, format, isWithinInterval, parseISO } from 'date-fns';
import { utils, writeFile } from 'xlsx';
import { Fase, Proyecto, Tarea } from '../types';

const estadoLabel: Record<Tarea['estado'], string> = {
  pendiente: 'Pendiente',
  en_proceso: 'En proceso',
  completada: 'Completada',
  bloqueada: 'Bloqueada',
  cancelada: 'Cancelada',
};

const slugify = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const buildDetalleRows = (proyecto: Proyecto, fases: Fase[], tareas: Tarea[]) => {
  const faseById = new Map(fases.map((fase) => [fase.id, fase]));

  return tareas.map((tarea) => {
    const fase = faseById.get(tarea.faseId);
    const ultimoCambio = tarea.historial?.[tarea.historial.length - 1];

    return {
      Proyecto: proyecto.nombre,
      Rut: proyecto.rut,
      'Razon social': proyecto.razonSocial,
      Fase: fase ? `${fase.codigo} · ${fase.nombre}` : tarea.faseId,
      Tarea: tarea.nombre,
      Responsable: tarea.responsable,
      Estado: estadoLabel[tarea.estado],
      Milestone: tarea.esMilestone ? 'Si' : 'No',
      'Inicio plan': tarea.fechaInicioPlan,
      'Fin plan': tarea.fechaFinPlan,
      'Duracion (dias)': tarea.duracionDias,
      'Inicio real': tarea.fechaInicioReal ?? '',
      'Fin real': tarea.fechaFinReal ?? '',
      Observacion: tarea.observacion ?? '',
      Comentarios: tarea.comentarios?.map((comentario) => `${comentario.usuario} (${comentario.fecha}): ${comentario.texto}`).join('\n') ?? '',
      'Ultimo cambio': ultimoCambio ? `${ultimoCambio.fecha} · ${ultimoCambio.usuario} · ${ultimoCambio.campo}` : '',
    };
  });
};

const buildMonthMerges = (dates: Date[]) => {
  const merges: Array<{ s: { r: number; c: number }; e: { r: number; c: number } }> = [];

  if (!dates.length) return merges;

  let monthStartIndex = 0;
  for (let index = 1; index <= dates.length; index += 1) {
    const current = dates[index];
    const previous = dates[index - 1];
    const changedMonth = !current || current.getMonth() !== previous.getMonth() || current.getFullYear() !== previous.getFullYear();

    if (changedMonth) {
      merges.push({
        s: { r: 1, c: 4 + monthStartIndex },
        e: { r: 1, c: 4 + index - 1 },
      });
      monthStartIndex = index;
    }
  }

  return merges;
};

const buildVisualSheet = (proyecto: Proyecto, fases: Fase[], tareas: Tarea[]) => {
  const faseById = new Map(fases.map((fase) => [fase.id, fase]));

  const taskDates = tareas.flatMap((tarea) => [parseISO(tarea.fechaInicioPlan), parseISO(tarea.fechaFinPlan)]);
  const fallbackStart = parseISO(proyecto.fechaInicio);
  const fallbackEnd = parseISO(proyecto.fechaGoLive);
  const start = taskDates.length ? new Date(Math.min(...taskDates.map((date) => date.getTime()))) : fallbackStart;
  const end = taskDates.length ? new Date(Math.max(...taskDates.map((date) => date.getTime()))) : fallbackEnd;
  const dates = eachDayOfInterval({ start, end });

  const rows: Array<Array<string | number>> = [];
  rows.push([`Gantt visual · ${proyecto.nombre}`]);
  rows.push(['Fase', 'Tarea', 'Responsable', 'Estado', ...dates.map((date) => format(date, 'MMMM yyyy'))]);
  rows.push(['Fase', 'Tarea', 'Responsable', 'Estado', ...dates.map((date) => format(date, 'dd'))]);

  tareas.forEach((tarea) => {
    const fase = faseById.get(tarea.faseId);
    const inicio = parseISO(tarea.fechaInicioPlan);
    const fin = parseISO(tarea.fechaFinPlan);
    const ganttCells = dates.map((date) => {
      if (!isWithinInterval(date, { start: inicio, end: fin })) return '';
      return tarea.esMilestone ? '◆' : '█';
    });

    rows.push([
      fase ? fase.codigo : tarea.faseId,
      tarea.nombre,
      tarea.responsable,
      estadoLabel[tarea.estado],
      ...ganttCells,
    ]);
  });

  const sheet = utils.aoa_to_sheet(rows);
  sheet['!cols'] = [
    { wch: 14 },
    { wch: 38 },
    { wch: 22 },
    { wch: 16 },
    ...dates.map(() => ({ wch: 4 })),
  ];
  sheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 + dates.length } },
    ...buildMonthMerges(dates),
  ];

  return sheet;
};

export const downloadGanttWorkbook = (proyecto: Proyecto, fases: Fase[], tareas: Tarea[]) => {
  const workbook = utils.book_new();

  const detalleRows = buildDetalleRows(proyecto, fases, tareas);
  const detalleSheet = utils.json_to_sheet(detalleRows.length ? detalleRows : [{ Proyecto: proyecto.nombre, Tarea: 'Sin tareas cargadas' }]);
  detalleSheet['!cols'] = [
    { wch: 24 },
    { wch: 16 },
    { wch: 28 },
    { wch: 28 },
    { wch: 40 },
    { wch: 22 },
    { wch: 16 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 36 },
    { wch: 60 },
    { wch: 34 },
  ];

  const visualSheet = buildVisualSheet(proyecto, fases, tareas);

  utils.book_append_sheet(workbook, detalleSheet, 'Detalle tareas');
  utils.book_append_sheet(workbook, visualSheet, 'Gantt visual');

  const fileName = `implementator-gantt-${slugify(proyecto.nombre)}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  writeFile(workbook, fileName);
};
