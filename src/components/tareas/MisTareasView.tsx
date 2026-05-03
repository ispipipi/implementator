import { CheckCircle2, Lock, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useProyectosVisibles } from '../../hooks/usePermisos';
import { useAppStore } from '../../store/useAppStore';
import { EstadoTarea, Tarea } from '../../types';
import { GlassCard } from '../ui/GlassCard';
import { StatusBadge } from '../ui/StatusBadge';

const estados: EstadoTarea[] = ['pendiente', 'en_proceso', 'completada', 'bloqueada', 'cancelada'];

const getTasksForUser = (tareas: Tarea[], proyectoIds: string[], usuarioNombre: string, perfil?: string) => {
  const visible = tareas.filter((tarea) => proyectoIds.includes(tarea.proyectoId));
  if (perfil === 'artbpo_ejecutivo') {
    return visible.filter((tarea) => tarea.responsable.toLowerCase() === usuarioNombre.toLowerCase());
  }
  return visible;
};

export function MisTareasView() {
  const proyectos = useProyectosVisibles();
  const { tareas, usuarioActivo, actualizarTarea, setVista } = useAppStore();
  const [query, setQuery] = useState('');
  const puedeCambiarEstado = usuarioActivo?.perfil === 'artbpo_ejecutivo' || usuarioActivo?.perfil === 'artbpo_admin';
  const proyectoIds = proyectos.map((p) => p.id);

  const misTareas = useMemo(() => {
    const base = getTasksForUser(tareas, proyectoIds, usuarioActivo?.nombre ?? '', usuarioActivo?.perfil);
    const normalized = query.trim().toLowerCase();
    if (!normalized) return base;
    return base.filter((tarea) => tarea.nombre.toLowerCase().includes(normalized) || tarea.responsable.toLowerCase().includes(normalized));
  }, [proyectoIds, query, tareas, usuarioActivo]);

  const updateEstado = (tarea: Tarea, estado: EstadoTarea) => {
    actualizarTarea(
      tarea.id,
      {
        estado,
        fechaInicioReal: estado === 'en_proceso' || estado === 'completada' ? (tarea.fechaInicioReal ?? new Date().toISOString().slice(0, 10)) : tarea.fechaInicioReal,
        fechaFinReal: estado === 'completada' ? new Date().toISOString().slice(0, 10) : tarea.fechaFinReal,
      },
      usuarioActivo?.nombre ?? 'Sistema',
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-emerald-300">Operacion diaria</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Mis tareas</h1>
          <p className="mt-2 text-slate-400">
            {usuarioActivo?.perfil === 'artbpo_ejecutivo'
              ? 'Tareas asignadas directamente a tu nombre.'
              : 'Vista simple de tareas disponibles para tu perfil.'}
          </p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-white" placeholder="Buscar tarea" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      <div className="grid gap-3">
        {misTareas.map((tarea) => {
          const proyecto = proyectos.find((p) => p.id === tarea.proyectoId);
          return (
            <GlassCard key={tarea.id} className="p-4">
              <div className="grid gap-4 lg:grid-cols-[1fr_180px_190px] lg:items-center">
                <button className="min-w-0 text-left" onClick={() => setVista('proyecto', tarea.proyectoId, tarea.faseId)}>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <StatusBadge estado={tarea.estado} ping={tarea.estado === 'bloqueada'} />
                    <span className="rounded-full bg-white/8 px-2.5 py-1 text-xs text-slate-400">{proyecto?.nombre ?? 'Proyecto'}</span>
                  </div>
                  <h2 className="font-semibold text-white">{tarea.nombre}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {tarea.fechaInicioPlan} a {tarea.fechaFinPlan} · Responsable: {tarea.responsable}
                  </p>
                </button>

                <div className="text-sm text-slate-400">
                  {tarea.esMilestone ? 'Milestone' : `${tarea.duracionDias} dia(s)`}
                </div>

                {puedeCambiarEstado ? (
                  <label className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                    <select className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" value={tarea.estado} onChange={(e) => updateEstado(tarea, e.target.value as EstadoTarea)}>
                      {estados.map((estado) => (
                        <option key={estado} value={estado}>
                          {estado.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-400">
                    <Lock className="h-4 w-4" />
                    Solo lectura
                  </div>
                )}
              </div>
            </GlassCard>
          );
        })}
      </div>

      {!misTareas.length ? (
        <GlassCard className="p-6 text-center text-slate-400">
          No hay tareas para mostrar con los filtros actuales.
        </GlassCard>
      ) : null}
    </div>
  );
}
