import { AlertTriangle, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useProyectosVisibles } from '../../hooks/usePermisos';
import { useAppStore } from '../../store/useAppStore';
import { Tarea, UsuarioActivo } from '../../types';
import { responsableAsignadoAUsuario } from '../../utils/assignee';
import { tareaEstaVencida } from '../../utils/taskHealth';
import { TareasDrilldown } from '../proyectos/TareasDrilldown';

const getTasksForUser = (tareas: Tarea[], proyectoIds: string[], usuario: UsuarioActivo | null) => {
  const visible = tareas.filter((tarea) => proyectoIds.includes(tarea.proyectoId));
  if (usuario?.perfil === 'artbpo_ejecutivo') {
    return visible.filter((tarea) => responsableAsignadoAUsuario(tarea.responsable, usuario));
  }
  return visible;
};

export function MisTareasView() {
  const proyectos = useProyectosVisibles();
  const { tareas, usuarioActivo } = useAppStore();
  const [query, setQuery] = useState('');
  const proyectoIds = proyectos.map((p) => p.id);

  const misTareas = useMemo(() => {
    return getTasksForUser(tareas, proyectoIds, usuarioActivo);
  }, [proyectoIds, tareas, usuarioActivo]);
  const vencidas = misTareas.filter(tareaEstaVencida);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-emerald-300">Operacion diaria</p>
          <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">Mis tareas</h1>
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

      {vencidas.length ? (
        <div className="rounded-xl border border-red-400/40 bg-red-500/15 p-4 shadow-[0_0_36px_rgba(239,68,68,0.16)]">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500 text-white">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold text-red-100">{vencidas.length} tarea(s) vencida(s) requieren atención inmediata</p>
              <p className="text-sm text-red-200/80">Están destacadas en rojo dentro del listado para entrar directo a gestionarlas.</p>
            </div>
          </div>
        </div>
      ) : null}

      <TareasDrilldown tareas={misTareas} query={query} />
    </div>
  );
}
