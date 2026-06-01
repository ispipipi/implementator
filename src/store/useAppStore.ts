import { addDays, differenceInDays, format, parseISO } from 'date-fns';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PLANTILLA_FASES } from '../data/plantillaFases';
import { SEED_DATA } from '../data/seedData';
import { PERFILES_SEED } from '../data/perfiles';
import { GOOGLE_SHEETS_GANTT_URL } from '../data/googleSheetsSource';
import { Alerta, AppState, ExpedienteProyecto, Fase, Tarea } from '../types';
import { saveWorkspaceState } from '../services/remoteState';
import { calcPctFase, calcPctProyecto, semaforoProyecto } from '../utils/progressCalc';
import { normalizarResponsable } from '../utils/assignee';

const makeId = (prefix: string) => `${prefix}-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;

const guardarRemoto = (state: AppState, motivo: string) => {
  void saveWorkspaceState(state, motivo).catch((error) => {
    console.warn('No se pudo guardar el estado remoto', error);
  });
};

const expedienteVacio = (): ExpedienteProyecto => ({ documentos: [], accesos: [] });

const asegurarPerfilesBase = (perfiles: AppState['perfiles']) => {
  const ids = new Set(perfiles.map((perfil) => perfil.id));
  const emails = new Set(perfiles.map((perfil) => perfil.email?.toLowerCase()).filter(Boolean));
  const faltantes = PERFILES_SEED.filter((perfil) => !ids.has(perfil.id) && (!perfil.email || !emails.has(perfil.email.toLowerCase())));
  return faltantes.length ? [...perfiles, ...faltantes] : perfiles;
};

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
      perfiles: PERFILES_SEED,
      ejecutivos: SEED_DATA.ejecutivos,
      proyectos: SEED_DATA.proyectos,
      fases: SEED_DATA.fases,
      tareas: SEED_DATA.tareas,
      alertas: [],
      expedientes: {},
      vista: 'dashboard',
      proyectoActivoId: null,
      faseActivaId: null,
      diasAnticipacionAlerta: 3,
      tema: 'noche',
      fuenteGoogleSheetsUrl: GOOGLE_SHEETS_GANTT_URL,
      sincronizadoRemotoEn: undefined,

      setUsuarioActivo: (u) => set({ usuarioActivo: u }),

      setVista: (vista, proyectoId, faseId) =>
        set({ vista, proyectoActivoId: proyectoId ?? null, faseActivaId: faseId ?? null }),

      setTema: (tema) => set({ tema }),

      alternarTema: () => set((s) => ({ tema: s.tema === 'noche' ? 'dia' : 'noche' })),

      setFuenteGoogleSheetsUrl: (url) => {
        set({ fuenteGoogleSheetsUrl: url });
        guardarRemoto(get(), 'fuente_google_sheets');
      },

      aplicarEstadoCompartido: (estado) =>
        set({
          perfiles: asegurarPerfilesBase(estado.perfiles ?? get().perfiles),
          ejecutivos: estado.ejecutivos ?? get().ejecutivos,
          proyectos: estado.proyectos ?? get().proyectos,
          fases: estado.fases ?? get().fases,
          tareas: estado.tareas ?? get().tareas,
          alertas: estado.alertas ?? get().alertas,
          expedientes: estado.expedientes ?? get().expedientes,
          diasAnticipacionAlerta: estado.diasAnticipacionAlerta ?? get().diasAnticipacionAlerta,
          fuenteGoogleSheetsUrl: estado.fuenteGoogleSheetsUrl ?? get().fuenteGoogleSheetsUrl,
          sincronizadoRemotoEn: new Date().toISOString(),
        }),

      crearPerfil: (perfil) => {
        set((s) => ({ perfiles: [...s.perfiles, { ...perfil, id: makeId('perfil') }] }));
        guardarRemoto(get(), 'crear_perfil');
      },

      actualizarPerfil: (id, cambios) => {
        set((s) => ({
          perfiles: s.perfiles.map((perfil) => (perfil.id === id ? { ...perfil, ...cambios } : perfil)),
          usuarioActivo: s.usuarioActivo?.id === id ? { ...s.usuarioActivo, ...cambios } : s.usuarioActivo,
        }));
        guardarRemoto(get(), 'actualizar_perfil');
      },

      eliminarPerfil: (id) => {
        set((s) => ({
          perfiles: s.perfiles.filter((perfil) => perfil.id !== id),
          usuarioActivo: s.usuarioActivo?.id === id ? null : s.usuarioActivo,
        }));
        guardarRemoto(get(), 'eliminar_perfil');
      },

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
        guardarRemoto(get(), 'sincronizar_planificacion');
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
        guardarRemoto(get(), 'actualizar_tarea');
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
        guardarRemoto(get(), 'actualizar_fechas_gantt');
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
        guardarRemoto(get(), 'crear_tarea');
      },

      eliminarTarea: (id) => {
        set((s) => ({
          tareas: s.tareas.filter((t) => t.id !== id),
          alertas: s.alertas.filter((a) => a.tareaId !== id),
        }));
        get().recalcularAlertas();
        guardarRemoto(get(), 'eliminar_tarea');
      },

      marcarAlertaLeida: (id) =>
        {
          set((s) => ({ alertas: s.alertas.map((a) => (a.id === id ? { ...a, leida: true } : a)) }));
          guardarRemoto(get(), 'marcar_alerta_leida');
        },

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
        guardarRemoto(get(), 'crear_proyecto');
      },

      actualizarProyecto: (id, cambios) => {
        set((s) => ({
          proyectos: s.proyectos.map((p) => (p.id === id ? { ...p, ...cambios } : p)),
        }));
        guardarRemoto(get(), 'actualizar_proyecto');
      },

      eliminarProyecto: (id) => {
        set((s) => ({
          proyectos: s.proyectos.filter((p) => p.id !== id),
          fases: s.fases.filter((f) => f.proyectoId !== id),
          tareas: s.tareas.filter((t) => t.proyectoId !== id),
          alertas: s.alertas.filter((a) => a.proyectoId !== id),
        }));
        guardarRemoto(get(), 'eliminar_proyecto');
      },

      crearEjecutivo: (e) => {
        set((s) => ({ ejecutivos: [...s.ejecutivos, { ...e, id: makeId('ejecutivo') }] }));
        guardarRemoto(get(), 'crear_ejecutivo');
      },

      actualizarEjecutivo: (id, cambios) => {
        set((s) => ({ ejecutivos: s.ejecutivos.map((e) => (e.id === id ? { ...e, ...cambios } : e)) }));
        guardarRemoto(get(), 'actualizar_ejecutivo');
      },

      agregarDocumentoExpediente: (proyectoId, documento) => {
        const usuario = get().usuarioActivo?.nombre ?? 'Sistema';
        set((s) => {
          const expediente = s.expedientes[proyectoId] ?? expedienteVacio();
          return {
            expedientes: {
              ...s.expedientes,
              [proyectoId]: {
                ...expediente,
                documentos: [
                  ...expediente.documentos,
                  {
                    ...documento,
                    id: makeId('doc'),
                    creadoPor: usuario,
                    creadoEn: new Date().toISOString(),
                  },
                ],
              },
            },
          };
        });
        guardarRemoto(get(), 'agregar_documento_expediente');
      },

      eliminarDocumentoExpediente: (proyectoId, documentoId) => {
        set((s) => {
          const expediente = s.expedientes[proyectoId] ?? expedienteVacio();
          return {
            expedientes: {
              ...s.expedientes,
              [proyectoId]: {
                ...expediente,
                documentos: expediente.documentos.filter((documento) => documento.id !== documentoId),
              },
            },
          };
        });
        guardarRemoto(get(), 'eliminar_documento_expediente');
      },

      guardarAccesoExpediente: (proyectoId, acceso) => {
        const usuario = get().usuarioActivo?.nombre ?? 'Sistema';
        const id = acceso.id ?? makeId('acceso');
        set((s) => {
          const expediente = s.expedientes[proyectoId] ?? expedienteVacio();
          const nextAcceso = {
            ...acceso,
            id,
            actualizadoPor: usuario,
            actualizadoEn: new Date().toISOString(),
          };
          const existe = expediente.accesos.some((item) => item.id === id);
          return {
            expedientes: {
              ...s.expedientes,
              [proyectoId]: {
                ...expediente,
                accesos: existe
                  ? expediente.accesos.map((item) => (item.id === id ? nextAcceso : item))
                  : [...expediente.accesos, nextAcceso],
              },
            },
          };
        });
        guardarRemoto(get(), 'guardar_acceso_expediente');
      },

      eliminarAccesoExpediente: (proyectoId, accesoId) => {
        set((s) => {
          const expediente = s.expedientes[proyectoId] ?? expedienteVacio();
          return {
            expedientes: {
              ...s.expedientes,
              [proyectoId]: {
                ...expediente,
                accesos: expediente.accesos.filter((acceso) => acceso.id !== accesoId),
              },
            },
          };
        });
        guardarRemoto(get(), 'eliminar_acceso_expediente');
      },

      recalcularAlertas: () => {
        const { tareas, diasAnticipacionAlerta, alertas } = get();
        const hoy = new Date();
        const alertasExistentes = new Map(alertas.map((alerta) => [alerta.id, alerta]));
        const nuevasAlertas: Alerta[] = [];
        const agregarAlerta = (alerta: Omit<Alerta, 'leida' | 'creadaEn'>) => {
          const existente = alertasExistentes.get(alerta.id);
          nuevasAlertas.push({
            ...alerta,
            leida: existente?.leida ?? false,
            creadaEn: existente?.creadaEn ?? new Date().toISOString(),
          });
        };

        tareas.forEach((tarea) => {
          if (tarea.estado === 'completada' || tarea.estado === 'cancelada') return;
          const finPlan = parseISO(tarea.fechaFinPlan);
          const diasDif = differenceInDays(finPlan, hoy);

          if (diasDif < 0) {
            agregarAlerta({
              id: `alerta-vencida-${tarea.id}`,
              proyectoId: tarea.proyectoId,
              tareaId: tarea.id,
              tipo: 'vencida',
              mensaje: `Tarea vencida hace ${Math.abs(diasDif)} día(s): ${tarea.nombre}`,
            });
          } else if (diasDif <= diasAnticipacionAlerta) {
            agregarAlerta({
              id: `alerta-proxima-${tarea.id}`,
              proyectoId: tarea.proyectoId,
              tareaId: tarea.id,
              tipo: 'proxima_vencer',
              mensaje: `Vence en ${diasDif} día(s): ${tarea.nombre}`,
            });
          }

          if (tarea.estado === 'bloqueada') {
            agregarAlerta({
              id: `alerta-bloqueada-${tarea.id}`,
              proyectoId: tarea.proyectoId,
              tareaId: tarea.id,
              tipo: 'bloqueada',
              mensaje: `Tarea bloqueada: ${tarea.nombre}`,
            });
          }

          const cambiosResponsable = (tarea.historial ?? []).filter((item) => item.campo === 'responsable');
          const ultimoCambioResponsable = cambiosResponsable[cambiosResponsable.length - 1];
          const responsableActual = normalizarResponsable(tarea.responsable);
          const responsableNuevo = normalizarResponsable(ultimoCambioResponsable?.valorNuevo);
          const responsableAnterior = normalizarResponsable(ultimoCambioResponsable?.valorAnterior);

          if (ultimoCambioResponsable && responsableActual && responsableActual === responsableNuevo && responsableNuevo !== responsableAnterior) {
            agregarAlerta({
              id: `alerta-reasignada-${tarea.id}-${ultimoCambioResponsable.fecha}`,
              proyectoId: tarea.proyectoId,
              tareaId: tarea.id,
              tipo: 'reasignada',
              mensaje: `Nueva tarea asignada a ${tarea.responsable}: ${tarea.nombre}`,
              destinatario: tarea.responsable,
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
        perfiles: state.perfiles,
        ejecutivos: state.ejecutivos,
        proyectos: state.proyectos,
        fases: state.fases,
        tareas: state.tareas,
        alertas: state.alertas,
        expedientes: state.expedientes,
        diasAnticipacionAlerta: state.diasAnticipacionAlerta,
        tema: state.tema,
        fuenteGoogleSheetsUrl: state.fuenteGoogleSheetsUrl,
      }),
    },
  ),
);

export { calcPctFase, calcPctProyecto, semaforoProyecto };
