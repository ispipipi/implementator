import { CalendarDays, CheckCircle2, Clock3, FileText, Flag, Lock, MessageSquare, Save, UserRound } from 'lucide-react';
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
  const { actualizarTarea, usuarioActivo, proyectos, fases } = useAppStore();
  const { puedeEditarTareas } = usePermisos();
  const [form, setForm] = useState({
    estado: 'pendiente' as EstadoTarea,
    responsable: '',
    fechaInicioPlan: '',
    fechaFinPlan: '',
    observacion: '',
  });

  const proyecto = tarea ? proyectos.find((p) => p.id === tarea.proyectoId) : null;
  const fase = tarea ? fases.find((f) => f.id === tarea.faseId) : null;

  useEffect(() => {
    if (!tarea) return;
    setForm({
      estado: tarea.estado,
      responsable: tarea.responsable,
      fechaInicioPlan: tarea.fechaInicioPlan,
      fechaFinPlan: tarea.fechaFinPlan,
      observacion: tarea.observacion ?? '',
    });
  }, [tarea]);

  const save = () => {
    if (!tarea) return;
    const hoy = new Date().toISOString().slice(0, 10);
    const cambios = puedeEditarTareas
      ? {
          ...form,
          fechaInicioReal: form.estado === 'en_proceso' || form.estado === 'completada' ? (tarea.fechaInicioReal ?? hoy) : tarea.fechaInicioReal,
          fechaFinReal: form.estado === 'completada' ? (tarea.fechaFinReal ?? hoy) : tarea.fechaFinReal,
        }
      : { observacion: form.observacion };
    actualizarTarea(tarea.id, cambios, usuarioActivo?.nombre ?? 'Sistema');
    onClose();
  };

  return (
    <Drawer open={!!tarea} title="Ficha de tarea" onClose={onClose}>
      <div className="space-y-5">
        <section className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {tarea ? <StatusBadge estado={form.estado} ping={form.estado === 'bloqueada'} /> : null}
            {tarea?.esMilestone ? <span className="rounded-full bg-amber-400/12 px-2.5 py-1 text-xs font-medium text-amber-100">Milestone</span> : null}
            {!puedeEditarTareas ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/8 px-2.5 py-1 text-xs text-slate-400">
                <Lock className="h-3.5 w-3.5" />
                Edicion limitada
              </span>
            ) : null}
          </div>
          <h3 className="text-2xl font-semibold text-white">{tarea?.nombre}</h3>
          <p className="mt-2 text-sm text-slate-400">{tarea?.descripcion || 'Sin descripcion adicional.'}</p>
        </section>

        <div className="grid gap-3 sm:grid-cols-2">
          <InfoTile icon={FileText} label="Proyecto" value={proyecto?.nombre ?? 'Proyecto'} />
          <InfoTile icon={Flag} label="Fase" value={fase ? `${fase.codigo} · ${fase.nombre}` : 'Fase'} />
          <InfoTile icon={UserRound} label="Responsable" value={form.responsable || 'Sin asignar'} />
          <InfoTile icon={Clock3} label="Duracion" value={`${tarea?.duracionDias ?? 0} dia(s)`} />
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
              <select disabled={!puedeEditarTareas} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60" value={form.estado} onChange={(e) => setForm((s) => ({ ...s, estado: e.target.value as EstadoTarea }))}>
                {estados.map((estado) => (
                  <option key={estado} value={estado}>
                    {estado.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm text-slate-300">
              Responsable
              <input disabled={!puedeEditarTareas} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60" value={form.responsable} onChange={(e) => setForm((s) => ({ ...s, responsable: e.target.value }))} />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm text-slate-300">
                Inicio plan
                <input disabled={!puedeEditarTareas} type="date" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60" value={form.fechaInicioPlan} onChange={(e) => setForm((s) => ({ ...s, fechaInicioPlan: e.target.value }))} />
              </label>
              <label className="grid gap-2 text-sm text-slate-300">
                Fin plan
                <input disabled={!puedeEditarTareas} type="date" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60" value={form.fechaFinPlan} onChange={(e) => setForm((s) => ({ ...s, fechaFinPlan: e.target.value }))} />
              </label>
            </div>
          </div>
        </div>

        <label className="grid gap-2 rounded-xl border border-white/10 bg-white/[0.035] p-4 text-sm text-slate-300">
          <span className="inline-flex items-center gap-2 font-semibold text-white">
            <MessageSquare className="h-4 w-4 text-emerald-300" />
            Observaciones y notas
          </span>
          <textarea className="min-h-32 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" placeholder="Agregar observaciones, bloqueos, acuerdos o comentarios de avance..." value={form.observacion} onChange={(e) => setForm((s) => ({ ...s, observacion: e.target.value }))} />
          {!puedeEditarTareas ? <span className="text-xs text-slate-500">Este perfil puede dejar notas, pero no modificar responsable, fechas ni estado.</span> : null}
        </label>

        {tarea?.historial?.length ? (
          <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
            <h3 className="mb-3 text-sm font-semibold text-white">Últimos cambios</h3>
            <div className="space-y-2 text-xs text-slate-400">
              {tarea.historial.slice(-5).map((item, index) => (
                <p key={`${item.fecha}-${index}`}>
                  {item.campo}: {item.valorAnterior || '-'} {'>'} {item.valorNuevo || '-'} · {item.usuario}
                </p>
              ))}
            </div>
          </div>
        ) : null}

        <button className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-400 px-4 py-3 font-semibold text-slate-950 hover:bg-emerald-300" onClick={save}>
          <Save className="h-4 w-4" />
          {puedeEditarTareas ? 'Guardar cambios' : 'Guardar nota'}
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
