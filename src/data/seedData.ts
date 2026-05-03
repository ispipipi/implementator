import { addDays, format } from 'date-fns';
import { Ejecutivo, EstadoTarea, Fase, Proyecto, Tarea } from '../types';
import { PLANTILLA_FASES } from './plantillaFases';

export const EJECUTIVOS_SEED: Ejecutivo[] = [
  {
    id: 'paulina-id',
    nombre: 'Paulina Vigueras',
    iniciales: 'PV',
    rol: 'Cerebro Operacional',
    perfil: 'artbpo_admin',
    color: '#8b5cf6',
  },
  {
    id: 'julio-id',
    nombre: 'Julio Espinoza',
    iniciales: 'JE',
    rol: 'Administrador',
    perfil: 'artbpo_admin',
    color: '#3b82f6',
  },
  {
    id: 'julissa-id',
    nombre: 'Julissa Espinoza',
    iniciales: 'JsE',
    rol: 'Analista Implementación',
    perfil: 'artbpo_ejecutivo',
    color: '#ec4899',
  },
  {
    id: 'salvador-id',
    nombre: 'Salvador Vásquez',
    iniciales: 'SV',
    rol: 'Analista Implementación',
    perfil: 'artbpo_ejecutivo',
    color: '#f97316',
  },
];

export const PROYECTO_AGRICHILE: Proyecto = {
  id: 'agrichile-id',
  nombre: 'Frutícola Agrichile S.A.',
  rut: '96.618.010-2',
  razonSocial: 'Frutícola Agrichile S.A.',
  representanteLegal: 'Representante Legal Agrichile',
  direccion: "Camino Agricola s/n, Region de O'Higgins",
  cajaCompensacion: 'Los Andes',
  mutualidad: 'ACHS',
  porcentajeCotizacionMutual: 0.93,
  sistemaOrigen: 'Visma',
  ejecutivoId: 'julissa-id',
  supervisorId: 'paulina-id',
  fechaInicio: '2026-05-04',
  fechaGoLive: '2026-08-01',
  estado: 'activo',
  observaciones: 'Cliente migración desde Visma. Empresa frutícola sector agroindustrial.',
  creadoEn: '2026-05-04T09:00:00Z',
};

export function generarFasesYTareasAgrichile() {
  const fases: Fase[] = [];
  const tareas: Tarea[] = [];
  let fechaCursor = new Date('2026-05-04');

  PLANTILLA_FASES.forEach((plantillaFase, fi) => {
    const faseId = `agrichile-fase-${fi}`;
    const faseInicio = fechaCursor;

    const tareasGeneradas: Tarea[] = plantillaFase.tareas.map((t, ti) => {
      const tareaId = `agrichile-tarea-${fi}-${ti}`;
      const duracion = t.duracionDias || 1;
      const inicio = format(addDays(faseInicio, ti * duracion), 'yyyy-MM-dd');
      const fin = format(addDays(faseInicio, ti * duracion + (t.duracionDias || 0)), 'yyyy-MM-dd');
      let estado: EstadoTarea = 'pendiente';

      if (fi === 0) estado = 'completada';
      else if (fi === 1 && ti < 4) estado = 'completada';
      else if (fi === 1 && ti < 6) estado = 'en_proceso';
      else if (fi === 2 && ti === 0) estado = 'en_proceso';

      const fechaInicioReal = estado === 'completada' || estado === 'en_proceso' ? inicio : undefined;
      const fechaFinReal = estado === 'completada' ? fin : undefined;

      return {
        id: tareaId,
        faseId,
        proyectoId: 'agrichile-id',
        nombre: t.nombre,
        descripcion: '',
        responsable: fi < 2 ? 'Julissa Espinoza' : 'Salvador Vásquez',
        estado,
        fechaInicioPlan: inicio,
        fechaFinPlan: fin,
        fechaInicioReal,
        fechaFinReal,
        duracionDias: duracion,
        esMilestone: t.esMilestone || false,
        observacion: '',
        actualizadoEn: '2026-05-04T09:00:00Z',
        historial: [],
      };
    });

    const faseDuracion = plantillaFase.tareas.reduce((acc, t) => acc + (t.duracionDias || 1), 0);
    const faseFinDate = addDays(faseInicio, faseDuracion);

    fases.push({
      id: faseId,
      proyectoId: 'agrichile-id',
      codigo: plantillaFase.codigo,
      nombre: plantillaFase.nombre,
      orden: fi,
      fechaInicioPlan: format(faseInicio, 'yyyy-MM-dd'),
      fechaFinPlan: format(faseFinDate, 'yyyy-MM-dd'),
      fechaInicioReal: fi === 0 ? format(faseInicio, 'yyyy-MM-dd') : undefined,
      fechaFinReal: fi === 0 ? format(faseFinDate, 'yyyy-MM-dd') : undefined,
    });

    tareas.push(...tareasGeneradas);
    fechaCursor = addDays(faseFinDate, 1);
  });

  return { fases, tareas };
}

export const SEED_DATA = {
  ejecutivos: EJECUTIVOS_SEED,
  proyectos: [PROYECTO_AGRICHILE],
  ...generarFasesYTareasAgrichile(),
};
