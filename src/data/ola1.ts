import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns';
import { EmpresaProyecto, Fase, Proyecto, Tarea } from '../types';
import { GANTT_FRUTICOLA_FASES, GANTT_FRUTICOLA_SOURCE, GANTT_FRUTICOLA_TAREAS } from './ganttFruticola';

export const OLA_1_ID = 'ola-1-id';
export const OLA_1_FECHA_INICIO = '2026-10-01';

const nombresEmpresas = [
  'RAUDA CHILE ALSP LIMITADA',
  'SUMITOMO MITSUI BANKING CORPORATION',
  'COMERCIAL GREENVIC S.A.',
  'UNILODE AVIATION SOLUTIONS SPA',
  'NUTRIEN AG SOLUTIONS CHILE S.A.',
  'ICON CHILE LTDA',
  'Grupo Consorcio',
  'Grupo Enaco',
  'Grupo Patria',
];

export const OLA_1_EMPRESAS: EmpresaProyecto[] = nombresEmpresas.map((nombre, index) => ({
  id: `ola-1-empresa-${String(index + 1).padStart(2, '0')}`,
  nombre,
  estado: 'confirmada',
}));

const fechaBase = parseISO(GANTT_FRUTICOLA_SOURCE.fechaInicio);
const nuevaFechaBase = parseISO(OLA_1_FECHA_INICIO);
const desplazamientoDias = differenceInCalendarDays(nuevaFechaBase, fechaBase);
const desplazarFecha = (fecha: string) => format(addDays(parseISO(fecha), desplazamientoDias), 'yyyy-MM-dd');

export const OLA_1_FASES: Fase[] = GANTT_FRUTICOLA_FASES.map((fase) => ({
  ...fase,
  id: `ola-1-${fase.codigo.toLowerCase()}`,
  proyectoId: OLA_1_ID,
  fechaInicioPlan: desplazarFecha(fase.fechaInicioPlan),
  fechaFinPlan: desplazarFecha(fase.fechaFinPlan),
}));

export const OLA_1_TAREAS: Tarea[] = OLA_1_EMPRESAS.flatMap((empresa) =>
  GANTT_FRUTICOLA_TAREAS.map((tarea) => ({
    ...tarea,
    id: `ola-1-${empresa.id}-${tarea.id.replace('agrichile-gantt-', '')}`,
    faseId: OLA_1_FASES.find((fase) => fase.id === `ola-1-${GANTT_FRUTICOLA_FASES.find((item) => item.id === tarea.faseId)?.codigo.toLowerCase()}`)?.id ?? `ola-1-${tarea.faseId.replace('agrichile-gantt-fase-', '')}`,
    proyectoId: OLA_1_ID,
    empresaId: empresa.id,
    fechaInicioPlan: desplazarFecha(tarea.fechaInicioPlan),
    fechaFinPlan: desplazarFecha(tarea.fechaFinPlan),
    actualizadoEn: new Date().toISOString(),
    historial: [],
  })),
);

const fechaFinOla = OLA_1_TAREAS.reduce((max, tarea) => (tarea.fechaFinPlan > max ? tarea.fechaFinPlan : max), OLA_1_FECHA_INICIO);

export const PROYECTO_OLA_1: Proyecto = {
  id: OLA_1_ID,
  nombre: 'Ola 1',
  empresas: OLA_1_EMPRESAS,
  rut: 'Pendiente',
  razonSocial: 'Ola 1 - Implementación REX+',
  representanteLegal: 'Pendiente',
  direccion: 'Pendiente',
  cajaCompensacion: 'Pendiente',
  mutualidad: 'Pendiente',
  porcentajeCotizacionMutual: 0,
  sistemaOrigen: 'Visma',
  ejecutivoId: 'julissa-id',
  supervisorId: 'paulina-id',
  fechaInicio: OLA_1_FECHA_INICIO,
  fechaGoLive: fechaFinOla,
  estado: 'activo',
  observaciones: 'Ola de implementación para las nueve empresas informadas.',
  creadoEn: '2026-09-25T12:00:00Z',
};
