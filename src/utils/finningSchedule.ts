import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns';
import { Fase, Proyecto, Tarea } from '../types';

type Rango = Pick<Fase, 'fechaInicioPlan' | 'fechaFinPlan'>;

const normalizar = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim();

const rangosFinning: Record<string, Rango> = {
  PE24: { fechaInicioPlan: '2026-09-01', fechaFinPlan: '2026-09-04' },
  PF25: { fechaInicioPlan: '2026-09-12', fechaFinPlan: '2026-09-30' },
  PM26: { fechaInicioPlan: '2026-10-11', fechaFinPlan: '2026-10-17' },
  PA27: { fechaInicioPlan: '2026-11-11', fechaFinPlan: '2026-11-14' },
  PN28: { fechaInicioPlan: '2026-11-26', fechaFinPlan: '2026-11-28' },
  PD29: { fechaInicioPlan: '2026-12-24', fechaFinPlan: '2026-12-27' },
  OIYC11: { fechaInicioPlan: '2026-09-03', fechaFinPlan: '2026-10-29' },
  GL12: { fechaInicioPlan: '2027-01-01', fechaFinPlan: '2027-01-01' },
};

const codigosParalelo = new Set(['PE24', 'PF25', 'PM26', 'PA27', 'PN28', 'PD29']);

const esFinning = (proyecto: Proyecto) => normalizar(proyecto.nombre).includes('finning');

const reescalarTarea = (tarea: Tarea, faseActual: Fase, rangoNuevo: Rango): Pick<Tarea, 'fechaInicioPlan' | 'fechaFinPlan'> => {
  const origenInicio = parseISO(faseActual.fechaInicioPlan);
  const destinoInicio = parseISO(rangoNuevo.fechaInicioPlan);
  const duracionOrigen = Math.max(1, differenceInCalendarDays(parseISO(faseActual.fechaFinPlan), origenInicio));
  const duracionDestino = Math.max(1, differenceInCalendarDays(parseISO(rangoNuevo.fechaFinPlan), destinoInicio));
  const escala = duracionDestino / duracionOrigen;
  const limitar = (valor: number) => Math.min(duracionDestino, Math.max(0, valor));
  const inicio = limitar(Math.round(differenceInCalendarDays(parseISO(tarea.fechaInicioPlan), origenInicio) * escala));
  const fin = Math.max(inicio, limitar(Math.round(differenceInCalendarDays(parseISO(tarea.fechaFinPlan), origenInicio) * escala)));

  return {
    fechaInicioPlan: format(addDays(destinoInicio, inicio), 'yyyy-MM-dd'),
    fechaFinPlan: format(addDays(destinoInicio, fin), 'yyyy-MM-dd'),
  };
};

const ajusteTareaFinning = (tarea: Tarea, codigoFase: string): Partial<Tarea> => {
  const nombre = normalizar(tarea.nombre);

  if (codigoFase !== 'OIYC11') return {};

  if (nombre.includes('hito: entrega plan de cuentas')) {
    return {
      fechaInicioPlan: '2026-08-21',
      fechaFinPlan: '2026-08-21',
      estado: 'cancelada',
      observacion: 'No aplica según el informe de seguimiento de Finning del 11/09/2026.',
    };
  }

  if (nombre.includes('sharefile')) {
    return {
      estado: 'cancelada',
      observacion: 'No aplica según el informe de seguimiento de Finning del 11/09/2026.',
    };
  }

  if (nombre.includes('parametrizacion archivos banco')) {
    return {
      fechaInicioPlan: '2026-09-14',
      fechaFinPlan: '2026-10-14',
    };
  }

  if (nombre.includes('definicion y configuracion de centralizacion contable')) {
    return {
      fechaInicioPlan: '2026-09-03',
      fechaFinPlan: '2026-10-29',
    };
  }

  return {};
};

export const sincronizarCronogramaFinning = (
  proyectos: Proyecto[],
  fases: Fase[],
  tareas: Tarea[],
) => {
  const proyectoFinning = proyectos.find(esFinning);
  if (!proyectoFinning) return { proyectos, fases, tareas, cambioAplicado: false };

  const fasesActuales = fases.filter((fase) => fase.proyectoId === proyectoFinning.id);
  const fasePorId = new Map(fasesActuales.map((fase) => [fase.id, fase]));
  const fasesActualizadas = fases.map((fase) => {
    if (fase.proyectoId !== proyectoFinning.id) return fase;
    const rango = rangosFinning[fase.codigo];
    return rango ? { ...fase, ...rango } : fase;
  });

  const tareasActualizadas = tareas.map((tarea) => {
    if (tarea.proyectoId !== proyectoFinning.id) return tarea;
    const faseActual = fasePorId.get(tarea.faseId);
    if (!faseActual) return tarea;

    const rango = rangosFinning[faseActual.codigo];
    const fechasReescaladas = rango && (codigosParalelo.has(faseActual.codigo) || faseActual.codigo === 'OIYC11' || faseActual.codigo === 'GL12')
      ? reescalarTarea(tarea, faseActual, rango)
      : {};
    const ajustesEspecificos = ajusteTareaFinning(tarea, faseActual.codigo);

    return {
      ...tarea,
      ...fechasReescaladas,
      ...ajustesEspecificos,
    };
  });

  const proyectosActualizados = proyectos.map((proyecto) =>
    proyecto.id === proyectoFinning.id
      ? { ...proyecto, fechaGoLive: '2027-01-01' }
      : proyecto,
  );

  const cambioAplicado = JSON.stringify({ proyectos: proyectosActualizados, fases: fasesActualizadas, tareas: tareasActualizadas })
    !== JSON.stringify({ proyectos, fases, tareas });

  return {
    proyectos: proyectosActualizados,
    fases: fasesActualizadas,
    tareas: tareasActualizadas,
    cambioAplicado,
  };
};
