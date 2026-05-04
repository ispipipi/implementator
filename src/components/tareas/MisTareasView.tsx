import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useProyectosVisibles } from '../../hooks/usePermisos';
import { useAppStore } from '../../store/useAppStore';
import { Tarea } from '../../types';
import { TareasDrilldown } from '../proyectos/TareasDrilldown';

const getTasksForUser = (tareas: Tarea[], proyectoIds: string[], usuarioNombre: string, perfil?: string) => {
  const visible = tareas.filter((tarea) => proyectoIds.includes(tarea.proyectoId));
  if (perfil === 'artbpo_ejecutivo') {
    return visible.filter((tarea) => tarea.responsable.toLowerCase() === usuarioNombre.toLowerCase());
  }
  return visible;
};

export function MisTareasView() {
  const proyectos = useProyectosVisibles();
  const { tareas, usuarioActivo } = useAppStore();
  const [query, setQuery] = useState('');
  const proyectoIds = proyectos.map((p) => p.id);

  const misTareas = useMemo(() => {
    return getTasksForUser(tareas, proyectoIds, usuarioActivo?.nombre ?? '', usuarioActivo?.perfil);
  }, [proyectoIds, tareas, usuarioActivo]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-emerald-300">Operacion diaria</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Mis tareas</h1>
          <p className="mt-2 text-slate-400">
            {usuarioActivo?.perfil === 'artbpo_ejecutivo'
              ? 'Tareas asignadas directamente a tu nombre, agrupadas por proyecto, fase y tarea.'
              : 'Tareas disponibles para tu perfil, agrupadas por proyecto, fase y tarea.'}
          </p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-white" placeholder="Buscar tarea" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      <TareasDrilldown tareas={misTareas} query={query} />
    </div>
  );
}
