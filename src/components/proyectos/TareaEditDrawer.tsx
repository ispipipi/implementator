import { CalendarDays, CheckCircle2, Clock3, FileText, Flag, Lock, MessageCirclePlus, MessageSquare, Save, Send, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Drawer } from '../ui/Drawer';
import { EstadoTarea, Tarea } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { usePermisos } from '../../hooks/usePermisos';
import { StatusBadge } from '../ui/StatusBadge';

type Props = {
  tarea: Tarea | null;
  onClose: () => void;
};

const estados: EstadoTarea[] = ['pendiente', 'en_proceso', 'completada', 'bloqueada', 'cancelada'];

export function TareaEditDrawer({ tarea, onClose }: Props) {
  const { actualizarTarea, usuarioActivo, proyectos, fases, tareas } = useAppStore();
  const { puedeCambiarEstadoTarea, puedeEditarDatosTarea } = usePermisos();
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
            responsable: form.responsable,
            fechaInicioPlan: form.fechaInicioPlan,
            fechaFinPlan: form.fechaFinPlan,
          }
        : {}),
    };

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
      <div className="space-y-5">
        <section className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {tareaActual ? <StatusBadge estado={form.estado} ping={form.estado === 'bloqueada'} /> : null}
            {tareaActual?.esMilestone ? <span className="rounded-full bg-amber-400/12 px-2.5 py-1 text-xs font-medium text-amber-100">Milestone</span> : null}
            {!puedeEditarDatosTarea ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/8 px-2.5 py-1 text-xs text-slate-400">
                <Lock className="h-3.5 w-3.5" />
                Solo estado y comentarios
              </span>
            ) : null}
          </div>
          <h3 className="text-2xl font-semibold text-white">{tareaActual?.nombre}</h3>
          <p className="mt-2 text-sm text-slate-400">{tareaActual?.descripcion || 'Sin descripcion adicional.'}</p>
        </section>

        <div className="grid gap-3 sm:grid-cols-2">
          <InfoTile icon={FileText} label="Proyecto" value={proyecto?.nombre ?? 'Proyecto'} />
          <InfoTile icon={Flag} label="Fase" value={fase ? `${fase.codigo} · ${fase.nombre}` : 'Fase'} />
          <InfoTile icon={UserRound} label="Responsable" value={form.responsable || 'Sin asignar'} />
          <InfoTile icon={Clock3} label="Duracion" value={`${tareaActual?.duracionDias ?? 0} dia(s)`} />
          <InfoTile icon={CalendarDays} label="Inicio plan" value={form.fechaInicioPlan || '-'} />
          <InfoTile icon={CalendarDays} label="Fin plan" value={form.fechaFinPlan || '-'} />
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
            <CheckCircle2 className="h-4 w-4 text-emerald-300" />
            Estado y planificacion
          </div>
          <div className="grid gap-4">
            <label className="grid gap-2 text-sm text-slate-300">
              Estado
              <select disabled={!puedeCambiarEstadoTarea} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60" value={form.estado} onChange={(e) => setForm((s) => ({ ...s, estado: e.target.value as EstadoTarea }))}>
                {estados.map((estado) => (
                  <option key={estado} value={estado}>
                    {estado.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm text-slate-300">
              Responsable
              <input disabled={!puedeEditarDatosTarea} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60" value={form.responsable} onChange={(e) => setForm((s) => ({ ...s, responsable: e.target.value }))} />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
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

        <section className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 font-semibold text-white">
              <MessageSquare className="h-4 w-4 text-emerald-300" />
              Observaciones
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs text-emerald-100">
              <MessageCirclePlus className="h-3.5 w-3.5" />
              Nuevo mensaje
            </span>
          </div>

          <div className="mb-4 max-h-72 space-y-3 overflow-y-auto pr-1">
            {tareaActual?.observacion ? (
              <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-medium text-slate-300">Nota anterior</span>
                  <span className="text-slate-500">Migrada desde observacion</span>
                </div>
                <p className="whitespace-pre-wrap text-sm text-slate-300">{tareaActual.observacion}</p>
              </div>
            ) : null}

            {comentarios.length ? (
              comentarios.map((comentario) => (
                <div key={comentario.id} className="rounded-lg border border-emerald-300/10 bg-emerald-400/[0.045] p-3">
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
            <textarea className="min-h-24 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" placeholder="Escribe una observacion, bloqueo, acuerdo o avance..." value={form.comentarioNuevo} onChange={(e) => setForm((s) => ({ ...s, comentarioNuevo: e.target.value }))} />
          </label>
        </section>

        {tareaActual?.historial?.length ? (
          <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
            <h3 className="mb-3 text-sm font-semibold text-white">Últimos cambios</h3>
            <div className="space-y-2 text-xs text-slate-400">
              {tareaActual.historial.slice(-5).map((item, index) => (
                <p key={`${item.fecha}-${index}`}>
                  {item.campo}: {item.valorAnterior || '-'} {'>'} {item.valorNuevo || '-'} · {item.usuario}
                </p>
              ))}
            </div>
          </div>
        ) : null}

        <button className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-400 px-4 py-3 font-semibold text-slate-950 hover:bg-emerald-300" onClick={save}>
          <Save className="h-4 w-4" />
          {form.comentarioNuevo.trim() ? <Send className="h-4 w-4" /> : null}
          {puedeEditarDatosTarea ? 'Guardar cambios' : 'Guardar estado/comentario'}
        </button>
      </div>
    </Drawer>
  );
}

function InfoTile({ icon: Icon, label, value }: { icon: typeof FileText; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
      <Icon className="mb-3 h-4 w-4 text-slate-500" />
      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-white">{value}</p>
    </div>
  );
}
