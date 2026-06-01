import { AlertTriangle, Ban, CalendarDays, CheckCircle2, CircleDashed, Clock3, Flag, Lock, MessageCirclePlus, MessageSquare, OctagonAlert, PlayCircle, Save, Send, UserRound } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Drawer } from '../ui/Drawer';
import { EstadoTarea, Tarea } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { usePermisos } from '../../hooks/usePermisos';
import { StatusBadge } from '../ui/StatusBadge';
import { responsableAsignadoAUsuario } from '../../utils/assignee';
import { diasVencida, tareaEstaVencida } from '../../utils/taskHealth';

type Props = {
  tarea: Tarea | null;
  onClose: () => void;
};

const estados: EstadoTarea[] = ['pendiente', 'en_proceso', 'completada', 'bloqueada', 'cancelada'];
const estadoConfig: Record<EstadoTarea, { label: string; hint: string; icon: typeof CheckCircle2; active: string }> = {
  pendiente: {
    label: 'Pendiente',
    hint: 'Aun no inicia',
    icon: CircleDashed,
    active: 'border-slate-300/40 bg-slate-300/15 text-white',
  },
  en_proceso: {
    label: 'Iniciar',
    hint: 'Estoy trabajando',
    icon: PlayCircle,
    active: 'border-blue-300/50 bg-blue-400/15 text-blue-100',
  },
  completada: {
    label: 'Completar',
    hint: 'Tarea lista',
    icon: CheckCircle2,
    active: 'border-emerald-300/50 bg-emerald-400/15 text-emerald-100',
  },
  bloqueada: {
    label: 'Bloquear',
    hint: 'Requiere ayuda',
    icon: OctagonAlert,
    active: 'border-amber-300/60 bg-amber-400/15 text-amber-100',
  },
  cancelada: {
    label: 'Cancelar',
    hint: 'No aplica',
    icon: Ban,
    active: 'border-red-300/50 bg-red-400/15 text-red-100',
  },
};

export function TareaEditDrawer({ tarea, onClose }: Props) {
  const { actualizarTarea, usuarioActivo, proyectos, fases, tareas, perfiles, ejecutivos } = useAppStore();
  const { puedeCambiarEstadoTarea, puedeEditarDatosTarea, esComercial } = usePermisos();
  const [form, setForm] = useState({
    estado: 'pendiente' as EstadoTarea,
    responsable: '',
    fechaInicioPlan: '',
    fechaFinPlan: '',
    comentarioNuevo: '',
  });

  const tareaActual = tarea ? tareas.find((item) => item.id === tarea.id) ?? tarea : null;
  const proyecto = tareaActual ? proyectos.find((p) => p.id === tareaActual.proyectoId) : null;
  const fase = tareaActual ? fases.find((f) => f.id === tareaActual.faseId) : null;
  const vencida = tareaActual ? tareaEstaVencida(tareaActual) : false;
  const overdueDays = tareaActual ? diasVencida(tareaActual) : 0;
  const puedeReasignar =
    !esComercial &&
    !!usuarioActivo &&
    !!tareaActual &&
    (puedeEditarDatosTarea || responsableAsignadoAUsuario(tareaActual.responsable, usuarioActivo));
  const personasAsignables = useMemo(() => {
    const byName = new Map<string, string>();
    [...perfiles.filter((perfil) => perfil.activo !== false), ...ejecutivos].forEach((persona) => {
      if (persona.nombre.trim()) byName.set(persona.nombre, persona.nombre);
    });
    if (tareaActual?.responsable) byName.set(tareaActual.responsable, tareaActual.responsable);
    return Array.from(byName.values()).sort((a, b) => a.localeCompare(b));
  }, [ejecutivos, perfiles, tareaActual?.responsable]);

  useEffect(() => {
    if (!tareaActual) return;
    setForm({
      estado: tareaActual.estado,
      responsable: tareaActual.responsable,
      fechaInicioPlan: tareaActual.fechaInicioPlan,
      fechaFinPlan: tareaActual.fechaFinPlan,
      comentarioNuevo: '',
    });
  }, [tareaActual?.id]);

  const save = () => {
    if (!tareaActual) return;
    const hoy = new Date().toISOString().slice(0, 10);
    const nuevoComentario = form.comentarioNuevo.trim();
    const comentarios = nuevoComentario
      ? [
          ...(tareaActual.comentarios ?? []),
          {
            id: `comentario-${crypto.randomUUID?.() ?? Date.now()}`,
            texto: nuevoComentario,
            usuario: usuarioActivo?.nombre ?? 'Sistema',
            fecha: new Date().toISOString(),
          },
        ]
      : tareaActual.comentarios;
    const cambios: Partial<Tarea> = {
      estado: form.estado,
      ...(comentarios ? { comentarios } : {}),
      ...(puedeEditarDatosTarea
        ? {
            fechaInicioPlan: form.fechaInicioPlan,
            fechaFinPlan: form.fechaFinPlan,
          }
        : {}),
    };

    if (puedeReasignar && form.responsable !== tareaActual.responsable) {
      cambios.responsable = form.responsable;
    }

    if (form.estado === 'en_proceso' || form.estado === 'completada') {
      cambios.fechaInicioReal = tareaActual.fechaInicioReal ?? hoy;
    }

    if (form.estado === 'completada') {
      cambios.fechaFinReal = tareaActual.fechaFinReal ?? hoy;
    }

    actualizarTarea(tareaActual.id, cambios, usuarioActivo?.nombre ?? 'Sistema');
    setForm((current) => ({ ...current, comentarioNuevo: '' }));
  };

  const comentarios = tareaActual?.comentarios ?? [];
  const formatFecha = (fecha: string) =>
    new Intl.DateTimeFormat('es-CL', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(fecha));

  return (
    <Drawer open={!!tareaActual} title="Ficha de tarea" onClose={onClose}>
      <div className="space-y-3">
        <section className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {tareaActual ? <StatusBadge estado={form.estado} ping={form.estado === 'bloqueada'} /> : null}
            {vencida ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500 px-2.5 py-1 text-xs font-semibold text-white shadow-[0_0_20px_rgba(239,68,68,0.25)]">
                <AlertTriangle className="h-3.5 w-3.5" />
                Vencida hace {overdueDays} dia(s)
              </span>
            ) : null}
            {tareaActual?.esMilestone ? <span className="rounded-full bg-amber-400/12 px-2.5 py-1 text-xs font-medium text-amber-100">Milestone</span> : null}
            {!puedeEditarDatosTarea ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/8 px-2.5 py-1 text-xs text-slate-400">
                <Lock className="h-3.5 w-3.5" />
                {esComercial ? 'Solo lectura' : puedeReasignar ? 'Estado, reasignacion y comentarios' : 'Solo estado y comentarios'}
              </span>
            ) : null}
          </div>
          <h3 className="text-xl font-semibold leading-tight text-white">{tareaActual?.nombre}</h3>
          {tareaActual?.descripcion ? <p className="mt-1 text-sm text-slate-400">{tareaActual.descripcion}</p> : null}
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-300">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.035] px-2.5 py-1.5">
              <Flag className="h-3.5 w-3.5 text-emerald-300" />
              {fase ? `${fase.codigo} · ${fase.nombre}` : 'Fase'}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.035] px-2.5 py-1.5">
              <UserRound className="h-3.5 w-3.5 text-emerald-300" />
              {form.responsable || 'Sin asignar'}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.035] px-2.5 py-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-emerald-300" />
              {form.fechaInicioPlan || '-'} / {form.fechaFinPlan || '-'}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.035] px-2.5 py-1.5">
              <Clock3 className="h-3.5 w-3.5 text-emerald-300" />
              {tareaActual?.duracionDias ?? 0} dia(s)
            </span>
          </div>
          <p className="mt-2 truncate text-xs text-slate-500">{proyecto?.nombre ?? 'Proyecto'}</p>
        </section>

        <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
          <div className="mb-3 flex items-center justify-center gap-2 text-sm font-semibold text-white">
            <CheckCircle2 className="h-4 w-4 text-emerald-300" />
            Cambiar estado
          </div>
          <div className="grid gap-3">
            <label className="grid gap-2 text-sm text-slate-300">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {estados.map((estado) => {
                  const config = estadoConfig[estado];
                  const Icon = config.icon;
                  const active = form.estado === estado;
                  return (
                    <button
                      key={estado}
                      disabled={!puedeCambiarEstadoTarea}
                      className={[
                        'flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg border p-2 text-center transition disabled:cursor-not-allowed disabled:opacity-55',
                        active ? config.active : 'border-white/10 bg-white/[0.035] text-slate-300 hover:border-emerald-300/35 hover:bg-white/8',
                      ].join(' ')}
                      onClick={() => setForm((s) => ({ ...s, estado }))}
                      type="button"
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-xs font-semibold">{config.label}</span>
                    </button>
                  );
                })}
              </div>
            </label>

            <label className="grid gap-1 text-sm text-slate-300">
              Responsable
              <select disabled={!puedeReasignar} className="rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-white disabled:cursor-not-allowed disabled:opacity-60" value={form.responsable} onChange={(e) => setForm((s) => ({ ...s, responsable: e.target.value }))}>
                {personasAsignables.map((persona) => (
                  <option key={persona} value={persona}>
                    {persona}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-2 sm:grid-cols-2">
              <label className="grid gap-2 text-sm text-slate-300">
                Inicio plan
                <input disabled={!puedeEditarDatosTarea} type="date" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60" value={form.fechaInicioPlan} onChange={(e) => setForm((s) => ({ ...s, fechaInicioPlan: e.target.value }))} />
              </label>
              <label className="grid gap-2 text-sm text-slate-300">
                Fin plan
                <input disabled={!puedeEditarDatosTarea} type="date" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60" value={form.fechaFinPlan} onChange={(e) => setForm((s) => ({ ...s, fechaFinPlan: e.target.value }))} />
              </label>
            </div>
          </div>
        </div>

        <section className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 font-semibold text-white">
              <MessageSquare className="h-4 w-4 text-emerald-300" />
              Observaciones
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs text-emerald-100">
              <MessageCirclePlus className="h-3.5 w-3.5" />
              Nuevo mensaje
            </span>
          </div>

          <div className="mb-3 max-h-36 space-y-2 overflow-y-auto pr-1">
            {tareaActual?.observacion ? (
              <div className="rounded-lg border border-white/10 bg-white/[0.035] p-2">
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-medium text-slate-300">Nota anterior</span>
                  <span className="text-slate-500">Migrada desde observacion</span>
                </div>
                <p className="whitespace-pre-wrap text-sm text-slate-300">{tareaActual.observacion}</p>
              </div>
            ) : null}

            {comentarios.length ? (
              comentarios.map((comentario) => (
                <div key={comentario.id} className="rounded-lg border border-emerald-300/10 bg-emerald-400/[0.045] p-2">
                  <div className="mb-1 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-medium text-emerald-100">{comentario.usuario}</span>
                    <span className="text-slate-500">{formatFecha(comentario.fecha)}</span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-slate-200">{comentario.texto}</p>
                </div>
              ))
            ) : !tareaActual?.observacion ? (
              <p className="rounded-lg border border-dashed border-white/10 p-3 text-sm text-slate-500">Sin comentarios todavía.</p>
            ) : null}
          </div>

          <label className="grid gap-2 text-sm text-slate-300">
            Agregar comentario
            <textarea disabled={esComercial} className="min-h-16 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60" placeholder={esComercial ? 'Perfil solo lectura' : 'Escribe una observacion, bloqueo, acuerdo o avance...'} value={form.comentarioNuevo} onChange={(e) => setForm((s) => ({ ...s, comentarioNuevo: e.target.value }))} />
          </label>
        </section>

        {tareaActual?.historial?.length ? (
          <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
            <h3 className="mb-2 text-sm font-semibold text-white">Últimos cambios</h3>
            <div className="grid gap-1 text-xs text-slate-400 sm:grid-cols-2">
              {tareaActual.historial.slice(-4).map((item, index) => (
                <p key={`${item.fecha}-${index}`}>
                  {item.campo}: {item.valorAnterior || '-'} {'>'} {item.valorNuevo || '-'} · {item.usuario}
                </p>
              ))}
            </div>
          </div>
        ) : null}

        {esComercial ? (
          <div className="rounded-lg border border-white/10 bg-white/[0.035] px-4 py-3 text-center text-sm font-medium text-slate-400">
            Perfil solo lectura: no puede modificar estado, responsable ni comentarios.
          </div>
        ) : (
          <button className="mx-auto inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-400 px-4 py-3 font-semibold text-slate-950 shadow-[0_16px_32px_rgba(16,185,129,0.24)] hover:bg-emerald-300 sm:w-fit sm:min-w-72" onClick={save}>
            <Save className="h-4 w-4" />
            {form.comentarioNuevo.trim() ? <Send className="h-4 w-4" /> : null}
            Actualizar tarea
          </button>
        )}
      </div>
    </Drawer>
  );
}
