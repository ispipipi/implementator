import { CalendarDays, ChevronRight, Edit3, Plus } from 'lucide-react';
import { useState } from 'react';
import { usePermisos, useProyectosVisibles } from '../../hooks/usePermisos';
import { useAppStore, calcCumplimientoGanttProyecto, calcPctProyecto, semaforoCumplimientoProyecto } from '../../store/useAppStore';
import { Proyecto } from '../../types';
import { GlassCard } from '../ui/GlassCard';
import { TrafficLightOrb } from '../ui/TrafficLightOrb';
import { ProyectoEditDrawer } from './ProyectoEditDrawer';

export function ProyectosList() {
  const proyectos = useProyectosVisibles();
  const { tareas, setVista } = useAppStore();
  const { puedeEditarProyectos } = usePermisos();
  const [editing, setEditing] = useState<Proyecto | null>(null);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-emerald-300">Portafolio</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Proyectos de implementación</h1>
        </div>
        {puedeEditarProyectos ? (
          <button className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-white/8" onClick={() => setVista('ajustes')}>
            <Plus className="h-4 w-4" />
            Nuevo proyecto
          </button>
        ) : null}
      </div>

      <GlassCard className="p-4 sm:p-5">
      <div className="grid gap-3">
        {proyectos.map((proyecto) => {
          const pct = calcPctProyecto(proyecto.id, tareas);
          const cumplimiento = calcCumplimientoGanttProyecto(proyecto.id, tareas);
          const estado = semaforoCumplimientoProyecto(proyecto.id, tareas);

          return (
            <div key={proyecto.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-white/10 bg-white/[0.025] p-4 transition hover:border-emerald-300/35 hover:bg-white/[0.05] sm:flex-nowrap">
              <button className="flex min-w-0 flex-1 items-center gap-4 text-left" onClick={() => setVista('proyecto', proyecto.id)}>
                <TrafficLightOrb estado={estado} size="md" />
                <span className="min-w-0">
                  <span className="block truncate text-lg font-semibold text-white">{proyecto.nombre}</span>
                  <span className="mt-1 inline-flex items-center gap-1.5 text-xs text-slate-500">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {proyecto.fechaInicio} · {proyecto.fechaGoLive}
                  </span>
                </span>
              </button>
              <div className="flex items-center gap-5 text-center">
                <span><strong className="block text-lg text-white">{cumplimiento}%</strong><small className="text-xs text-slate-500">Gantt</small></span>
                <span><strong className="block text-lg text-white">{pct}%</strong><small className="text-xs text-slate-500">Avance</small></span>
              </div>
              {puedeEditarProyectos ? (
                <button className="rounded-lg border border-white/10 p-2 text-slate-300 hover:bg-white/8" onClick={() => setEditing(proyecto)} aria-label={`Editar ${proyecto.nombre}`}>
                  <Edit3 className="h-4 w-4" />
                </button>
              ) : null}
              <button type="button" className="rounded-lg p-1 text-slate-500 hover:text-white" onClick={() => setVista('proyecto', proyecto.id)} aria-label={`Abrir ${proyecto.nombre}`}>
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          );
        })}
      </div>
      </GlassCard>
      <ProyectoEditDrawer proyecto={editing} onClose={() => setEditing(null)} />
    </div>
  );
}
