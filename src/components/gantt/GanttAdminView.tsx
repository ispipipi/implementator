import { differenceInCalendarDays, parseISO } from 'date-fns';
import { Lock, Plus, Save, Trash2 } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { usePermisos } from '../../hooks/usePermisos';
import { useAppStore } from '../../store/useAppStore';
import { EstadoTarea, Tarea } from '../../types';
import { GanttView } from './GanttView';
import { GlassCard } from '../ui/GlassCard';
import { StatusBadge } from '../ui/StatusBadge';

const estados: EstadoTarea[] = ['pendiente', 'en_proceso', 'completada', 'bloqueada', 'cancelada'];

const calcDuracion = (inicio: string, fin: string) => Math.max(0, differenceInCalendarDays(parseISO(fin), parseISO(inicio)));

export function GanttAdminView() {
  const { proyectos, fases, tareas, ejecutivos, actualizarTarea, crearTarea, eliminarTarea, usuarioActivo } = useAppStore();
  const { puedeAdministrar } = usePermisos();
  const [proyectoId, setProyectoId] = useState(proyectos[0]?.id ?? '');

  const fasesProyecto = useMemo(() => fases.filter((fase) => fase.proyectoId === proyectoId).sort((a, b) => a.orden - b.orden), [fases, proyectoId]);
  const tareasProyecto = useMemo(() => tareas.filter((tarea) => tarea.proyectoId === proyectoId).sort((a, b) => a.fechaInicioPlan.localeCompare(b.fechaInicioPlan)), [tareas, proyectoId]);
  const proyecto = proyectos.find((p) => p.id === proyectoId);

  const [form, setForm] = useState({
    faseId: fasesProyecto[0]?.id ?? '',
    nombre: '',
    responsable: ejecutivos.find((e) => e.perfil === 'artbpo_ejecutivo')?.nombre ?? '',
    estado: 'pendiente' as EstadoTarea,
    fechaInicioPlan: proyecto?.fechaInicio ?? new Date().toISOString().slice(0, 10),
    fechaFinPlan: proyecto?.fechaInicio ?? new Date().toISOString().slice(0, 10),
    esMilestone: false,
  });

  const currentFaseId = form.faseId || fasesProyecto[0]?.id || '';

  useEffect(() => {
    setForm((s) => ({
      ...s,
      faseId: fasesProyecto[0]?.id ?? '',
      fechaInicioPlan: proyecto?.fechaInicio ?? s.fechaInicioPlan,
      fechaFinPlan: proyecto?.fechaInicio ?? s.fechaFinPlan,
    }));
  }, [fasesProyecto, proyecto]);

  if (!puedeAdministrar) {
    return (
      <GlassCard className="p-6">
        <Lock className="mb-4 h-8 w-8 text-slate-500" />
        <h1 className="text-2xl font-semibold text-white">Acceso restringido</h1>
        <p className="mt-2 text-slate-400">Solo Administrador y Cerebro Operacional pueden modificar la Gantt completa.</p>
      </GlassCard>
    );
  }

  const updateTask = (tarea: Tarea, cambios: Partial<Tarea>) => {
    const next = { ...cambios };
    if (next.fechaInicioPlan || next.fechaFinPlan) {
      const inicio = next.fechaInicioPlan ?? tarea.fechaInicioPlan;
      const fin = next.fechaFinPlan ?? tarea.fechaFinPlan;
      next.duracionDias = calcDuracion(inicio, fin);
    }
    actualizarTarea(tarea.id, next, usuarioActivo?.nombre ?? 'Administrador');
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.nombre.trim() || !proyectoId || !currentFaseId) return;
    crearTarea({
      faseId: currentFaseId,
      proyectoId,
      nombre: form.nombre,
      descripcion: '',
      responsable: form.responsable || 'Sin asignar',
      estado: form.estado,
      fechaInicioPlan: form.fechaInicioPlan,
      fechaFinPlan: form.fechaFinPlan,
      duracionDias: calcDuracion(form.fechaInicioPlan, form.fechaFinPlan),
      esMilestone: form.esMilestone,
      observacion: '',
    });
    setForm((s) => ({ ...s, nombre: '', esMilestone: false }));
  };

  const deleteTask = (tarea: Tarea) => {
    if (window.confirm(`Eliminar la tarea "${tarea.nombre}"?`)) {
      eliminarTarea(tarea.id);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-emerald-300">Administracion</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Gantt completa</h1>
          <p className="mt-2 text-slate-400">Vista de administrador para ajustar fechas, estados, responsables y estructura de tareas.</p>
        </div>
        <select className="min-w-72 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" value={proyectoId} onChange={(e) => setProyectoId(e.target.value)}>
          {proyectos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
      </div>

      <GanttView tareas={tareasProyecto} />

      <GlassCard className="p-5">
        <h2 className="mb-4 text-xl font-semibold text-white">Agregar tarea</h2>
        <form className="grid gap-3 lg:grid-cols-6" onSubmit={submit}>
          <select className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" value={currentFaseId} onChange={(e) => setForm((s) => ({ ...s, faseId: e.target.value }))}>
            {fasesProyecto.map((fase) => (
              <option key={fase.id} value={fase.id}>
                {fase.codigo} · {fase.nombre}
              </option>
            ))}
          </select>
          <input className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white lg:col-span-2" placeholder="Nombre de tarea" value={form.nombre} onChange={(e) => setForm((s) => ({ ...s, nombre: e.target.value }))} />
          <input className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" placeholder="Responsable" value={form.responsable} onChange={(e) => setForm((s) => ({ ...s, responsable: e.target.value }))} />
          <input type="date" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" value={form.fechaInicioPlan} onChange={(e) => setForm((s) => ({ ...s, fechaInicioPlan: e.target.value }))} />
          <input type="date" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" value={form.fechaFinPlan} onChange={(e) => setForm((s) => ({ ...s, fechaFinPlan: e.target.value }))} />
          <select className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" value={form.estado} onChange={(e) => setForm((s) => ({ ...s, estado: e.target.value as EstadoTarea }))}>
            {estados.map((estado) => (
              <option key={estado} value={estado}>
                {estado.replace('_', ' ')}
              </option>
            ))}
          </select>
          <label className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300">
            <input type="checkbox" checked={form.esMilestone} onChange={(e) => setForm((s) => ({ ...s, esMilestone: e.target.checked }))} />
            Milestone
          </label>
          <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-400 px-4 py-2 font-semibold text-slate-950 hover:bg-emerald-300">
            <Plus className="h-4 w-4" />
            Agregar
          </button>
        </form>
      </GlassCard>

      <GlassCard className="overflow-hidden">
        <div className="border-b border-white/10 p-5">
          <h2 className="text-xl font-semibold text-white">Editar tareas</h2>
          <p className="mt-1 text-sm text-slate-500">Los cambios se guardan al modificar cada campo.</p>
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="min-w-[1180px] w-full text-left">
            <thead className="bg-white/[0.035] text-xs uppercase tracking-[0.14em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Tarea</th>
                <th className="px-4 py-3">Fase</th>
                <th className="px-4 py-3">Responsable</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Inicio</th>
                <th className="px-4 py-3">Fin</th>
                <th className="px-4 py-3">Milestone</th>
                <th className="px-4 py-3 text-right">Eliminar</th>
              </tr>
            </thead>
            <tbody>
              {tareasProyecto.map((tarea) => (
                <tr key={tarea.id} className="border-b border-white/8 last:border-0">
                  <td className="px-4 py-3">
                    <input className="w-full min-w-64 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" value={tarea.nombre} onChange={(e) => updateTask(tarea, { nombre: e.target.value })} />
                  </td>
                  <td className="px-4 py-3">
                    <select className="w-full min-w-48 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" value={tarea.faseId} onChange={(e) => updateTask(tarea, { faseId: e.target.value })}>
                      {fasesProyecto.map((fase) => (
                        <option key={fase.id} value={fase.id}>
                          {fase.codigo}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input className="w-full min-w-44 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" value={tarea.responsable} onChange={(e) => updateTask(tarea, { responsable: e.target.value })} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="mb-2">
                      <StatusBadge estado={tarea.estado} />
                    </div>
                    <select className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" value={tarea.estado} onChange={(e) => updateTask(tarea, { estado: e.target.value as EstadoTarea })}>
                      {estados.map((estado) => (
                        <option key={estado} value={estado}>
                          {estado.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input type="date" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" value={tarea.fechaInicioPlan} onChange={(e) => updateTask(tarea, { fechaInicioPlan: e.target.value })} />
                  </td>
                  <td className="px-4 py-3">
                    <input type="date" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" value={tarea.fechaFinPlan} onChange={(e) => updateTask(tarea, { fechaFinPlan: e.target.value })} />
                  </td>
                  <td className="px-4 py-3">
                    <label className="inline-flex items-center gap-2 text-sm text-slate-300">
                      <input type="checkbox" checked={tarea.esMilestone} onChange={(e) => updateTask(tarea, { esMilestone: e.target.checked })} />
                      Si
                    </label>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="inline-flex items-center gap-2 rounded-lg border border-red-400/20 px-3 py-2 text-sm text-red-300 hover:bg-red-500/10" onClick={() => deleteTask(tarea)}>
                      <Trash2 className="h-4 w-4" />
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Save className="h-4 w-4" />
        Los cambios quedan persistidos en el navegador mediante localStorage.
      </div>
    </div>
  );
}
