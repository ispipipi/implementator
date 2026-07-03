import { eachDayOfInterval, format, isSameDay, isWithinInterval, parseISO } from 'date-fns';
import ExcelJS from 'exceljs';
import { Fase, Proyecto, Tarea } from '../types';

const COLORS = {
  brand: '0F766E',
  brandSoft: 'CCFBF1',
  ink: '0F172A',
  muted: '64748B',
  surface: 'F8FAFC',
  border: 'CBD5E1',
  white: 'FFFFFF',
  success: '16A34A',
  successSoft: 'DCFCE7',
  warning: 'D97706',
  warningSoft: 'FEF3C7',
  danger: 'DC2626',
  dangerSoft: 'FEE2E2',
  info: '2563EB',
  infoSoft: 'DBEAFE',
  slateSoft: 'E2E8F0',
} as const;

const estadoLabel: Record<Tarea['estado'], string> = {
  pendiente: 'Pendiente',
  en_proceso: 'En proceso',
  completada: 'Completada',
  bloqueada: 'Bloqueada',
  cancelada: 'Cancelada',
};

const estadoColors: Record<Tarea['estado'], { fill: string; font: string }> = {
  pendiente: { fill: COLORS.slateSoft, font: COLORS.ink },
  en_proceso: { fill: COLORS.infoSoft, font: COLORS.info },
  completada: { fill: COLORS.successSoft, font: COLORS.success },
  bloqueada: { fill: COLORS.dangerSoft, font: COLORS.danger },
  cancelada: { fill: 'F3F4F6', font: COLORS.muted },
};

const slugify = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const setFill = (cell: ExcelJS.Cell, color: string) => {
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: `FF${color}` },
  };
};

const setBorder = (cell: ExcelJS.Cell, color: string = COLORS.border) => {
  cell.border = {
    top: { style: 'thin', color: { argb: `FF${color}` } },
    left: { style: 'thin', color: { argb: `FF${color}` } },
    bottom: { style: 'thin', color: { argb: `FF${color}` } },
    right: { style: 'thin', color: { argb: `FF${color}` } },
  };
};

const setTableHeader = (row: ExcelJS.Row) => {
  row.eachCell((cell) => {
    setFill(cell, COLORS.ink);
    cell.font = { bold: true, color: { argb: `FF${COLORS.white}` }, size: 11 };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    setBorder(cell, COLORS.ink);
  });
};

const applyBodyCell = (cell: ExcelJS.Cell) => {
  cell.font = { size: 10, color: { argb: `FF${COLORS.ink}` } };
  cell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
  setBorder(cell);
};

const addMetricCard = (
  sheet: ExcelJS.Worksheet,
  startCell: string,
  endCell: string,
  title: string,
  value: string | number,
  fill: string,
  fontColor: string,
) => {
  sheet.mergeCells(startCell, endCell);
  const cell = sheet.getCell(startCell);
  cell.value = `${value}\n${title}`;
  cell.font = { name: 'Aptos', size: 14, bold: true, color: { argb: `FF${fontColor}` } };
  cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  setFill(cell, fill);
  setBorder(cell, fill);
};

const calculateResumen = (tareas: Tarea[]) => {
  const total = tareas.length;
  const completadas = tareas.filter((tarea) => tarea.estado === 'completada').length;
  const enProceso = tareas.filter((tarea) => tarea.estado === 'en_proceso').length;
  const bloqueadas = tareas.filter((tarea) => tarea.estado === 'bloqueada').length;
  const vencidas = tareas.filter((tarea) => tarea.estado !== 'completada' && tarea.estado !== 'cancelada' && parseISO(tarea.fechaFinPlan) < new Date()).length;
  const avance = total ? Math.round((completadas / total) * 100) : 0;

  return { total, completadas, enProceso, bloqueadas, vencidas, avance };
};

const createWorkbook = () => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'IMPLEMENTATOR';
  workbook.company = 'artBPO';
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.subject = 'Seguimiento ejecutivo de implementacion';
  workbook.title = 'Reporte Gantt IMPLEMENTATOR';
  return workbook;
};

const buildDetalleSheet = (workbook: ExcelJS.Workbook, proyecto: Proyecto, fases: Fase[], tareas: Tarea[]) => {
  const sheet = workbook.addWorksheet('Detalle ejecutivo', {
    properties: { defaultRowHeight: 22 },
    views: [{ state: 'frozen', ySplit: 8 }],
  });

  const faseById = new Map(fases.map((fase) => [fase.id, fase]));
  const resumen = calculateResumen(tareas);

  sheet.columns = [
    { key: 'fase', width: 18 },
    { key: 'tarea', width: 40 },
    { key: 'responsable', width: 22 },
    { key: 'estado', width: 16 },
    { key: 'milestone', width: 12 },
    { key: 'inicioPlan', width: 14 },
    { key: 'finPlan', width: 14 },
    { key: 'duracion', width: 14 },
    { key: 'inicioReal', width: 14 },
    { key: 'finReal', width: 14 },
    { key: 'observacion', width: 34 },
    { key: 'comentarios', width: 46 },
  ];

  sheet.mergeCells('A1:L1');
  sheet.getCell('A1').value = `IMPLEMENTATOR · ${proyecto.nombre}`;
  sheet.getCell('A1').font = { name: 'Aptos Display', size: 20, bold: true, color: { argb: `FF${COLORS.ink}` } };
  sheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'left' };

  sheet.mergeCells('A2:L2');
  sheet.getCell('A2').value = `${proyecto.razonSocial} · RUT ${proyecto.rut} · Go live ${proyecto.fechaGoLive}`;
  sheet.getCell('A2').font = { size: 11, color: { argb: `FF${COLORS.muted}` } };

  addMetricCard(sheet, 'A4', 'B5', 'Avance general', `${resumen.avance}%`, COLORS.brandSoft, COLORS.brand);
  addMetricCard(sheet, 'C4', 'D5', 'Tareas totales', resumen.total, COLORS.infoSoft, COLORS.info);
  addMetricCard(sheet, 'E4', 'F5', 'Completadas', resumen.completadas, COLORS.successSoft, COLORS.success);
  addMetricCard(sheet, 'G4', 'H5', 'En proceso', resumen.enProceso, COLORS.warningSoft, COLORS.warning);
  addMetricCard(sheet, 'I4', 'J5', 'Bloqueadas', resumen.bloqueadas, COLORS.dangerSoft, COLORS.danger);
  addMetricCard(sheet, 'K4', 'L5', 'Vencidas', resumen.vencidas, resumen.vencidas ? COLORS.dangerSoft : COLORS.slateSoft, resumen.vencidas ? COLORS.danger : COLORS.ink);

  const header = sheet.getRow(8);
  header.values = ['Fase', 'Tarea', 'Responsable', 'Estado', 'Hito', 'Inicio plan', 'Fin plan', 'Duracion', 'Inicio real', 'Fin real', 'Observacion', 'Comentarios'];
  setTableHeader(header);
  header.height = 24;

  const orderedTasks = [...tareas].sort((a, b) => {
    const faseA = faseById.get(a.faseId)?.orden ?? 0;
    const faseB = faseById.get(b.faseId)?.orden ?? 0;
    if (faseA !== faseB) return faseA - faseB;
    return a.fechaInicioPlan.localeCompare(b.fechaInicioPlan);
  });

  orderedTasks.forEach((tarea) => {
    const fase = faseById.get(tarea.faseId);
    const row = sheet.addRow([
      fase ? `${fase.codigo} · ${fase.nombre}` : tarea.faseId,
      tarea.nombre,
      tarea.responsable,
      estadoLabel[tarea.estado],
      tarea.esMilestone ? 'Si' : 'No',
      tarea.fechaInicioPlan,
      tarea.fechaFinPlan,
      tarea.duracionDias,
      tarea.fechaInicioReal ?? '',
      tarea.fechaFinReal ?? '',
      tarea.observacion ?? '',
      tarea.comentarios?.map((comentario) => `${comentario.usuario}: ${comentario.texto}`).join('\n') ?? '',
    ]);

    row.height = 34;
    row.eachCell((cell, colNumber) => {
      applyBodyCell(cell);
      if (colNumber === 4) {
        const palette = estadoColors[tarea.estado];
        setFill(cell, palette.fill);
        cell.font = { size: 10, bold: true, color: { argb: `FF${palette.font}` } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      }
      if (colNumber === 5) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      }
    });
  });

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber >= 9 && rowNumber % 2 === 1) {
      row.eachCell((cell, colNumber) => {
        if (colNumber !== 4) setFill(cell, COLORS.surface);
      });
    }
  });

  return sheet;
};

const buildVisualSheet = (workbook: ExcelJS.Workbook, proyecto: Proyecto, fases: Fase[], tareas: Tarea[]) => {
  const sheet = workbook.addWorksheet('Gantt visual', {
    properties: { defaultRowHeight: 22 },
    views: [{ state: 'frozen', xSplit: 4, ySplit: 8 }],
  });

  const faseById = new Map(fases.map((fase) => [fase.id, fase]));
  const resumen = calculateResumen(tareas);

  const taskDates = tareas.flatMap((tarea) => [parseISO(tarea.fechaInicioPlan), parseISO(tarea.fechaFinPlan)]);
  const fallbackStart = parseISO(proyecto.fechaInicio);
  const fallbackEnd = parseISO(proyecto.fechaGoLive);
  const start = taskDates.length ? new Date(Math.min(...taskDates.map((date) => date.getTime()))) : fallbackStart;
  const end = taskDates.length ? new Date(Math.max(...taskDates.map((date) => date.getTime()))) : fallbackEnd;
  const dates = eachDayOfInterval({ start, end });

  sheet.columns = [
    { key: 'fase', width: 14 },
    { key: 'tarea', width: 34 },
    { key: 'responsable', width: 20 },
    { key: 'estado', width: 14 },
    ...dates.map(() => ({ width: 3.5 })),
  ];

  const lastColumn = 4 + dates.length;
  const lastColumnLetter = sheet.getColumn(lastColumn).letter;

  sheet.mergeCells(`A1:${lastColumnLetter}1`);
  sheet.getCell('A1').value = `Carta Gantt ejecutiva · ${proyecto.nombre}`;
  sheet.getCell('A1').font = { name: 'Aptos Display', size: 20, bold: true, color: { argb: `FF${COLORS.ink}` } };

  sheet.mergeCells(`A2:${lastColumnLetter}2`);
  sheet.getCell('A2').value = `Plan desde ${format(start, 'dd/MM/yyyy')} hasta ${format(end, 'dd/MM/yyyy')} · Avance ${resumen.avance}% · Go live ${proyecto.fechaGoLive}`;
  sheet.getCell('A2').font = { size: 11, color: { argb: `FF${COLORS.muted}` } };

  addMetricCard(sheet, 'A4', 'B5', 'Avance', `${resumen.avance}%`, COLORS.brandSoft, COLORS.brand);
  addMetricCard(sheet, 'C4', 'D5', 'Tareas', resumen.total, COLORS.infoSoft, COLORS.info);
  addMetricCard(sheet, 'E4', 'F5', 'Bloqueadas', resumen.bloqueadas, COLORS.dangerSoft, COLORS.danger);
  addMetricCard(sheet, 'G4', 'H5', 'Vencidas', resumen.vencidas, resumen.vencidas ? COLORS.dangerSoft : COLORS.slateSoft, resumen.vencidas ? COLORS.danger : COLORS.ink);

  const monthRow = sheet.getRow(7);
  const dayRow = sheet.getRow(8);
  monthRow.getCell(1).value = 'Fase';
  monthRow.getCell(2).value = 'Tarea';
  monthRow.getCell(3).value = 'Responsable';
  monthRow.getCell(4).value = 'Estado';
  dayRow.getCell(1).value = 'Fase';
  dayRow.getCell(2).value = 'Tarea';
  dayRow.getCell(3).value = 'Responsable';
  dayRow.getCell(4).value = 'Estado';

  for (let index = 0; index < 4; index += 1) {
    const topCell = monthRow.getCell(index + 1);
    const bottomCell = dayRow.getCell(index + 1);
    setFill(topCell, COLORS.ink);
    setFill(bottomCell, COLORS.ink);
    topCell.font = bottomCell.font = { bold: true, color: { argb: `FF${COLORS.white}` }, size: 10 };
    topCell.alignment = bottomCell.alignment = { vertical: 'middle', horizontal: 'center' };
    setBorder(topCell, COLORS.ink);
    setBorder(bottomCell, COLORS.ink);
  }

  let currentMonth = '';
  let monthStartColumn = 5;
  dates.forEach((date, index) => {
    const column = 5 + index;
    const monthKey = format(date, 'MMMM yyyy');
    const monthCell = monthRow.getCell(column);
    const dayCell = dayRow.getCell(column);

    dayCell.value = format(date, 'dd');
    dayCell.font = { size: 9, bold: true, color: { argb: `FF${COLORS.ink}` } };
    dayCell.alignment = { vertical: 'middle', horizontal: 'center' };
    setFill(dayCell, COLORS.surface);
    setBorder(dayCell);

    if (monthKey !== currentMonth) {
      if (currentMonth) {
        sheet.mergeCells(7, monthStartColumn, 7, column - 1);
        const mergedMonthCell = monthRow.getCell(monthStartColumn);
        mergedMonthCell.value = currentMonth;
        mergedMonthCell.font = { size: 10, bold: true, color: { argb: `FF${COLORS.brand}` } };
        mergedMonthCell.alignment = { vertical: 'middle', horizontal: 'center' };
        setFill(mergedMonthCell, COLORS.brandSoft);
        setBorder(mergedMonthCell, COLORS.brand);
      }
      currentMonth = monthKey;
      monthStartColumn = column;
    }
  });

  if (dates.length) {
    sheet.mergeCells(7, monthStartColumn, 7, 4 + dates.length);
    const mergedMonthCell = monthRow.getCell(monthStartColumn);
    mergedMonthCell.value = currentMonth;
    mergedMonthCell.font = { size: 10, bold: true, color: { argb: `FF${COLORS.brand}` } };
    mergedMonthCell.alignment = { vertical: 'middle', horizontal: 'center' };
    setFill(mergedMonthCell, COLORS.brandSoft);
    setBorder(mergedMonthCell, COLORS.brand);
  }

  const orderedTasks = [...tareas].sort((a, b) => {
    const priority = (task: Tarea) => {
      if (task.estado === 'bloqueada') return 0;
      if (task.estado === 'en_proceso') return 1;
      if (task.estado === 'pendiente') return 2;
      if (task.estado === 'cancelada') return 3;
      return 4;
    };
    const priorityDiff = priority(a) - priority(b);
    if (priorityDiff !== 0) return priorityDiff;
    return a.fechaInicioPlan.localeCompare(b.fechaInicioPlan);
  });

  orderedTasks.forEach((tarea) => {
    const fase = faseById.get(tarea.faseId);
    const row = sheet.addRow([
      fase?.codigo ?? tarea.faseId,
      tarea.nombre,
      tarea.responsable,
      estadoLabel[tarea.estado],
      ...dates.map((date) => {
        if (tarea.esMilestone) return isSameDay(date, parseISO(tarea.fechaInicioPlan)) ? '◆' : '';
        return isWithinInterval(date, { start: parseISO(tarea.fechaInicioPlan), end: parseISO(tarea.fechaFinPlan) }) ? '' : '';
      }),
    ]);

    row.height = 22;
    row.eachCell((cell, index) => {
      applyBodyCell(cell);
      if (index === 4) {
        const palette = estadoColors[tarea.estado];
        setFill(cell, palette.fill);
        cell.font = { size: 10, bold: true, color: { argb: `FF${palette.font}` } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      }
      if (index > 4) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        const date = dates[index - 5];
        const palette = estadoColors[tarea.estado];
        const active = tarea.esMilestone
          ? isSameDay(date, parseISO(tarea.fechaInicioPlan))
          : isWithinInterval(date, { start: parseISO(tarea.fechaInicioPlan), end: parseISO(tarea.fechaFinPlan) });
        if (active) {
          setFill(cell, palette.fill);
          cell.font = { size: 8, bold: true, color: { argb: `FF${palette.font}` } };
          cell.value = tarea.esMilestone ? '◆' : '';
        } else {
          setFill(cell, COLORS.white);
        }
      }
    });
  });

  for (let rowNumber = 9; rowNumber <= sheet.rowCount; rowNumber += 1) {
    if (rowNumber % 2 === 1) {
      const row = sheet.getRow(rowNumber);
      for (let column = 1; column <= 4; column += 1) {
        setFill(row.getCell(column), COLORS.surface);
      }
    }
  }

  return sheet;
};

const triggerDownload = async (workbook: ExcelJS.Workbook, fileName: string) => {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
};

export const downloadGanttWorkbook = async (proyecto: Proyecto, fases: Fase[], tareas: Tarea[]) => {
  const workbook = createWorkbook();
  buildDetalleSheet(workbook, proyecto, fases, tareas);
  buildVisualSheet(workbook, proyecto, fases, tareas);

  const fileName = `implementator-gantt-${slugify(proyecto.nombre)}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  await triggerDownload(workbook, fileName);
};
