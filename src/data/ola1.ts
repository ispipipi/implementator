import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns';
import { EmpresaProyecto, Fase, Proyecto, Tarea } from '../types';
import { GANTT_FRUTICOLA_FASES, GANTT_FRUTICOLA_SOURCE, GANTT_FRUTICOLA_TAREAS } from './ganttFruticola';

export const OLA_1_ID = 'ola-1-id';
export const OLA_1_FECHA_INICIO = '2026-06-01';

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

const idFase = (codigo: string) => `ola-1-${codigo.toLowerCase()}`;
const fasesFuentePorCodigo = new Map(GANTT_FRUTICOLA_FASES.map((fase) => [fase.codigo, fase]));
const faseParaleloFuente = fasesFuentePorCodigo.get('PA25');
const faseGoLiveFuente = fasesFuentePorCodigo.get('GL11');
const codigosFasesConservadas = ['P1', 'P2', 'MVAR3', 'CB4', 'SDV8', 'OIYC10'];

const fasesConservadas: Fase[] = codigosFasesConservadas.map((codigo, orden) => {
  const fase = fasesFuentePorCodigo.get(codigo);
  if (!fase) throw new Error(`No se encontró la fase fuente ${codigo}`);

  return {
    ...fase,
    id: idFase(codigo),
    proyectoId: OLA_1_ID,
    orden,
    fechaInicioPlan: desplazarFecha(fase.fechaInicioPlan),
    fechaFinPlan: desplazarFecha(fase.fechaFinPlan),
  };
});

const fasesParalelo: Fase[] = [
  {
    id: idFase('PF26'),
    proyectoId: OLA_1_ID,
    codigo: 'PF26',
    nombre: 'Paralelo (frío) · Septiembre 26',
    orden: 6,
    fechaInicioPlan: '2026-09-01',
    fechaFinPlan: '2026-09-30',
  },
  {
    id: idFase('PC26'),
    proyectoId: OLA_1_ID,
    codigo: 'PC26',
    nombre: 'Paralelo en caliente · Octubre 26',
    orden: 7,
    fechaInicioPlan: '2026-10-01',
    fechaFinPlan: '2026-10-31',
  },
  {
    id: idFase('GL26'),
    proyectoId: OLA_1_ID,
    codigo: 'GL26',
    nombre: 'Go Live · Noviembre 26',
    orden: 8,
    fechaInicioPlan: '2026-11-02',
    fechaFinPlan: '2026-11-02',
  },
];

export const OLA_1_FASES: Fase[] = [...fasesConservadas, ...fasesParalelo];

const faseOlaPorCodigo = new Map(OLA_1_FASES.map((fase) => [fase.codigo, fase]));
const tareasParaleloFuente = GANTT_FRUTICOLA_TAREAS.filter((tarea) => tarea.faseId === faseParaleloFuente?.id);
const tareaGoLiveFuente = GANTT_FRUTICOLA_TAREAS.find((tarea) => tarea.faseId === faseGoLiveFuente?.id);

const desplazarTareaParalelo = (tarea: Tarea, fechaInicio: string) => {
  const inicioFuente = faseParaleloFuente?.fechaInicioPlan ?? tarea.fechaInicioPlan;
  const offsetInicio = differenceInCalendarDays(parseISO(tarea.fechaInicioPlan), parseISO(inicioFuente));
  const offsetFin = differenceInCalendarDays(parseISO(tarea.fechaFinPlan), parseISO(inicioFuente));

  return {
    fechaInicioPlan: format(addDays(parseISO(fechaInicio), offsetInicio), 'yyyy-MM-dd'),
    fechaFinPlan: format(addDays(parseISO(fechaInicio), offsetFin), 'yyyy-MM-dd'),
  };
};

const construirTarea = (
  empresa: EmpresaProyecto,
  tareaFuente: Tarea,
  faseId: string,
  idSufijo: string,
  fechas?: Pick<Tarea, 'fechaInicioPlan' | 'fechaFinPlan'>,
): Tarea => ({
  ...tareaFuente,
  id: `ola-1-${empresa.id}-${idSufijo}`,
  faseId,
  proyectoId: OLA_1_ID,
  empresaId: empresa.id,
  ...(fechas ?? {
    fechaInicioPlan: desplazarFecha(tareaFuente.fechaInicioPlan),
    fechaFinPlan: desplazarFecha(tareaFuente.fechaFinPlan),
  }),
  actualizadoEn: new Date().toISOString(),
  historial: [],
});

const construirTareasEmpresa = (empresa: EmpresaProyecto) => {
  const tareasBase = GANTT_FRUTICOLA_TAREAS
    .filter((tarea) => {
      const faseFuente = GANTT_FRUTICOLA_FASES.find((fase) => fase.id === tarea.faseId);
      return faseFuente && codigosFasesConservadas.includes(faseFuente.codigo);
    })
    .map((tarea) => {
      const faseFuente = GANTT_FRUTICOLA_FASES.find((fase) => fase.id === tarea.faseId);
      const faseDestino = faseFuente ? faseOlaPorCodigo.get(faseFuente.codigo) : undefined;
      if (!faseDestino) throw new Error(`No se encontró fase Ola 1 para ${faseFuente?.codigo ?? tarea.faseId}`);

      return construirTarea(
        empresa,
        tarea,
        faseDestino.id,
        tarea.id.replace('agrichile-gantt-', ''),
      );
    });

  const construirParalelo = (fase: Fase, prefijo: string) => tareasParaleloFuente.map((tarea) =>
    construirTarea(
      empresa,
      tarea,
      fase.id,
      `${prefijo}-${tarea.id.replace('agrichile-gantt-', '')}`,
      desplazarTareaParalelo(tarea, fase.fechaInicioPlan),
    ));

  const tareasGoLive = tareaGoLiveFuente && faseOlaPorCodigo.get('GL26')
    ? [construirTarea(
        empresa,
        tareaGoLiveFuente,
        faseOlaPorCodigo.get('GL26')!.id,
        'go-live-noviembre-26',
        {
          fechaInicioPlan: '2026-11-02',
          fechaFinPlan: '2026-11-02',
        },
      )]
    : [];

  return [
    ...tareasBase,
    ...construirParalelo(faseOlaPorCodigo.get('PF26')!, 'paralelo-frio'),
    ...construirParalelo(faseOlaPorCodigo.get('PC26')!, 'paralelo-caliente'),
    ...tareasGoLive,
  ];
};

export const OLA_1_TAREAS: Tarea[] = OLA_1_EMPRESAS.flatMap(construirTareasEmpresa);

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
  fechaGoLive: '2026-11-02',
  estado: 'activo',
  observaciones: 'Ola de implementación para las nueve empresas informadas. Incluye un paralelo frío en septiembre, un paralelo en caliente en octubre y Go Live en noviembre de 2026.',
  creadoEn: '2026-09-25T12:00:00Z',
};
