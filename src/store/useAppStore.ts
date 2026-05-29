import { addDays, differenceInDays, format, parseISO } from 'date-fns';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PLANTILLA_FASES } from '../data/plantillaFases';
import { SEED_DATA } from '../data/seedData';
import { Alerta, AppState, Fase, Tarea } from '../types';
import { calcPctFase, calcPctProyecto, semaforoProyecto } from '../utils/progressCalc';

const makeId = (prefix: string) => `${prefix}-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;

const generarPlanProyecto = (proyectoId: string, fechaInicio: string, responsable: string) => {
  const fases: Fase[] = [];
  const tareas: Tarea[] = [];
  let fechaCursor = parseISO(fechaInicio);

  PLANTILLA_FASES.forEach((plantillaFase, fi) => {
    const faseId = makeId('fase');
    const faseInicio = fechaCursor;

    plantillaFase.tareas.forEach((t, ti) => {
      const duracion = t.duracionDias || 1;
      const inicio = format(addDays(faseInicio, ti * duracion), 'yyyy-MM-dd');
      const fin = format(addDays(faseInicio, ti * duracion + (t.duracionDias || 0)), 'yyyy-MM-dd');
      tareas.push({
        id: makeId('tarea'),
        faseId,
        proyectoId,
        nombre: t.nombre,
        descripcion: '',
        responsable,
        estado: 'pendiente',
        fechaInicioPlan: inicio,
        fechaFinPlan: fin,
        duracionDias: duracion,
        esMilestone: t.esMilestone || false,
        observacion: '',
        actualizadoEn: new Date().toISOString(),
        historial: [],
      });
    });

    const faseDuracion = plantillaFase.tareas.reduce((acc, t) => acc + (t.duracionDias || 1), 0);
    const faseFinDate = addDays(faseInicio, faseDuracion);
    fases.push({
      id: faseId,
      proyectoId,
      codigo: plantillaFase.codigo,
      nombre: plantillaFase.nombre,
      orden: fi,
      fechaInicioPlan: format(faseInicio, 'yyyy-MM-dd'),
      fechaFinPlan: format(faseFinDate, 'yyyy-MM-dd'),
    });
    fechaCursor = addDays(faseFinDate, 1);
  });

  return { fases, tareas };
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      usuarioActivo: null,
      ejecutivos: SEED_DATA.ejecutivos,
      proyectos: SEED_DATA.proyectos,
      fases: SEED_DATA.fases,
      tareas: SEED_DATA.tareas,
      alertas: [],
      vista: 'dashboard',
      proyectoActivoId: null,
      faseActivaId: null,
      diasAnticipacionAlerta: 3,
      tema: 'noche',
      fuenteGoogleSheetsUrl: '',

      setUsuarioActivo: (u) => set({ usuarioActivo: u }),

      setVista: (vista, proyectoId, faseId) =>
        set({ vista, proyectoActivoId: proyectoId ?? null, faseActivaId: faseId ?? null }),

      setTema: (tema) => set({ tema }),

      alternarTema: () => set((s) => ({ tema: s.tema === 'noche' ? 'dia' : 'noche' })),

      setFuenteGoogleSheetsUrl: (url) => set({ fuenteGoogleSheetsUrl: url }),

      reemplazarPlanificacionProyecto: (proyectoId, fasesImportadas, tareasImportadas, usuario, fechas) => {
        const ahora = new Date().toISOString();
        const fasesConAuditoria = fasesImportadas.map((fase) => ({ ...fase, proyectoId }));
        const tareasConAuditoria = tareasImportadas.map((tarea) => ({
          ...tarea,
          proyectoId,
          actualizadoEn: ahora,
          historial: [
            ...(tarea.historial || []),
            {
              fecha: ahora,
              campo: 'sincronizacion',
              valorAnterior: '',
              valorNuevo: 'Google Sheets',
              usuario,
            },
          ].slice(-10),
        }));

        set((s) => ({
          proyectos: s.proyectos.map((p) =>
            p.id === proyectoId
              ? {
                  ...p,
                  fechaInicio: fechas?.fechaInicio ?? p.fechaInicio,
                  fechaGoLive: fechas?.fechaFin ?? p.fechaGoLive,
                  observaciones: `${p.observaciones}\nPlanificacion sincronizada desde Google Sheets el ${new Date().toLocaleString('es-CL')}.`,
                }
              : p,
          ),
          fases: [...s.fases.filter((fase) => fase.proyectoId !== proyectoId), ...fasesConAuditoria],
          tareas: [...s.tareas.filter((tarea) => tarea.proyectoId !== proyectoId), ...tareasConAuditoria],
          alertas: s.alertas.filter((alerta) => alerta.proyectoId !== proyectoId),
        }));
        get().recalcularAlertas();
      },

      actualizarTarea: (id, cambios, usuario) => {
        const { tareas } = get();
        const tareaActual = tareas.find((t) => t.id === id);
        if (!tareaActual) return;

        const historialEntry = Object.entries(cambios).map(([campo, nuevo]) => ({
          fecha: new Date().toISOString(),
          campo,
          valorAnterior: String(tareaActual[campo as keyof Tarea] ?? ''),
          valorNuevo: String(nuevo ?? ''),
          usuario,
        }));

        set({
          tareas: tareas.map((t) =>
            t.id === id
              ? {
                  ...t,
                  ...cambios,
                  actualizadoEn: new Date().toISOString(),
                  historial: [...(t.historial || []), ...historialEntry].slice(-10),
                }
              : t,
          ),
        });
        get().recalcularAlertas();
      },

      actualizarFechasGantt: (tareaId, inicio, fin) => {
        set((s) => ({
          tareas: s.tareas.map((t) =>
            t.id === tareaId
              ? { ...t, fechaInicioPlan: inicio, fechaFinPlan: fin, actualizadoEn: new Date().toISOString() }
              : t,
          ),
        }));
        get().recalcularAlertas();
      },

      crearTarea: (t) => {
        set((s) => ({
          tareas: [
            ...s.tareas,
            {
              ...t,
              id: makeId('tarea'),
              actualizadoEn: new Date().toISOString(),
              historial: [],
            },
          ],
        }));
        get().recalcularAlertas();
      },

      eliminarTarea: (id) => {
        set((s) => ({
          tareas: s.tareas.filter((t) => t.id !== id),
          alertas: s.alertas.filter((a) => a.tareaId !== id),
        }));
        get().recalcularAlertas();
      },

      marcarAlertaLeida: (id) =>
        set((s) => ({ alertas: s.alertas.map((a) => (a.id === id ? { ...a, leida: true } : a)) })),

      crearProyecto: (p) => {
        const id = makeId('proyecto');
        const responsable = get().ejecutivos.find((e) => e.id === p.ejecutivoId)?.nombre ?? 'Sin asignar';
        const plan = generarPlanProyecto(id, p.fechaInicio, responsable);
        set((s) => ({
          proyectos: [...s.proyectos, { ...p, id, creadoEn: new Date().toISOString() }],
          fases: [...s.fases, ...plan.fases],
          tareas: [...s.tareas, ...plan.tareas],
        }));
        get().recalcularAlertas();
      },

      actualizarProyecto: (id, cambios) =>
        set((s) => ({
          proyectos: s.proyectos.map((p) => (p.id === id ? { ...p, ...cambios } : p)),
        })),

      eliminarProyecto: (id) =>
        set((s) => ({
          proyectos: s.proyectos.filter((p) => p.id !== id),
          fases: s.fases.filter((f) => f.proyectoId !== id),
          tareas: s.tareas.filter((t) => t.proyectoId !== id),
          alertas: s.alertas.filter((a) => a.proyectoId !== id),
        })),

      crearEjecutivo: (e) => set((s) => ({ ejecutivos: [...s.ejecutivos, { ...e, id: makeId('ejecutivo') }] })),

      actualizarEjecutivo: (id, cambios) =>
        set((s) => ({ ejecutivos: s.ejecutivos.map((e) => (e.id === id ? { ...e, ...cambios } : e)) })),

      recalcularAlertas: () => {
        const { tareas, diasAnticipacionAlerta } = get();
        const hoy = new Date();
        const nuevasAlertas: Alerta[] = [];

        tareas.forEach((tarea) => {
          if (tarea.estado === 'completada' || tarea.estado === 'cancelada') return;
          const finPlan = parseISO(tarea.fechaFinPlan);
          const diasDif = differenceInDays(finPlan, hoy);

          if (diasDif < 0) {
            nuevasAlertas.push({
              id: `alerta-vencida-${tarea.id}`,
              proyectoId: tarea.proyectoId,
              tareaId: tarea.id,
              tipo: 'vencida',
              mensaje: `Tarea vencida hace ${Math.abs(diasDif)} día(s): ${tarea.nombre}`,
              leida: false,
              creadaEn: new Date().toISOString(),
            });
          } else if (diasDif <= diasAnticipacionAlerta) {
            nuevasAlertas.push({
              id: `alerta-proxima-${tarea.id}`,
              proyectoId: tarea.proyectoId,
              tareaId: tarea.id,
              tipo: 'proxima_vencer',
              mensaje: `Vence en ${diasDif} día(s): ${tarea.nombre}`,
              leida: false,
              creadaEn: new Date().toISOString(),
            });
          }

          if (tarea.estado === 'bloqueada') {
            nuevasAlertas.push({
              id: `alerta-bloqueada-${tarea.id}`,
              proyectoId: tarea.proyectoId,
              tareaId: tarea.id,
              tipo: 'bloqueada',
              mensaje: `Tarea bloqueada: ${tarea.nombre}`,
              leida: false,
              creadaEn: new Date().toISOString(),
            });
          }
        });

        set({ alertas: nuevasAlertas });
      },
    }),
    {
      name: 'implementator_state',
      version: 3,
      partialize: (state) => ({
        usuarioActivo: state.usuarioActivo,
        ejecutivos: state.ejecutivos,
        proyectos: state.proyectos,
        fases: state.fases,
        tareas: state.tareas,
        alertas: state.alertas,
        diasAnticipacionAlerta: state.diasAnticipacionAlerta,
        tema: state.tema,
        fuenteGoogleSheetsUrl: state.fuenteGoogleSheetsUrl,
      }),
    },
  ),
);

export { calcPctFase, calcPctProyecto, semaforoProyecto };
