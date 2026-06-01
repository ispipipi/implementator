import { AlertTriangle, Search, UsersRound } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useProyectosVisibles } from '../../hooks/usePermisos';
import { useAppStore } from '../../store/useAppStore';
import { Tarea, UsuarioActivo } from '../../types';
import { responsableAsignadoAUsuario } from '../../utils/assignee';
import { tareaEstaVencida } from '../../utils/taskHealth';
import { TareasDrilldown } from '../proyectos/TareasDrilldown';

const getTasksForUser = (tareas: Tarea[], proyectoIds: string[], usuario: UsuarioActivo | null) => {
  const visible = tareas.filter((tarea) => proyectoIds.includes(tarea.proyectoId));
  if (usuario?.perfil === 'artbpo_ejecutivo' || usuario?.perfil === 'artbpo_admin') {
    return visible.filter((tarea) => responsableAsignadoAUsuario(tarea.responsable, usuario));
  }
  return visible;
};

export function MisTareasView() {
  const proyectos = useProyectosVisibles();
  const { tareas, usuarioActivo, perfiles, ejecutivos } = useAppStore();
  const [query, setQuery] = useState('');
  const proyectoIds = useMemo(() => proyectos.map((p) => p.id), [proyectos]);
  const personasAsignables = useMemo(() => {
    const byName = new Map<string, string>();
    [...perfiles.filter((perfil) => perfil.activo !== false), ...ejecutivos].forEach((persona) => {
      if (persona.nombre.trim()) byName.set(persona.nombre, persona.nombre);
    });
    return Array.from(byName.values()).sort((a, b) => a.localeCompare(b));
  }, [ejecutivos, perfiles]);
  const [personaSeleccionada, setPersonaSeleccionada] = useState('');

  const misTareas = useMemo(() => {
    return getTasksForUser(tareas, proyectoIds, usuarioActivo);
  }, [proyectoIds, tareas, usuarioActivo]);
  const vencidas = misTareas.filter(tareaEstaVencida);
  const esAdmin = usuarioActivo?.perfil === 'artbpo_admin';
  const persona = personaSeleccionada || personasAsignables[0] || '';
  const tareasPorPersona = useMemo(() => {
    if (!persona) return [];
    const visible = tareas.filter((tarea) => proyectoIds.includes(tarea.proyectoId));
    return visible.filter((tarea) => responsableAsignadoAUsuario(tarea.responsable, {
      id: persona,
      nombre: persona,
      iniciales: persona.split(' ').map((item) => item[0]).join('').slice(0, 3),
      rol: '',
      perfil: 'artbpo_ejecutivo',
      color: '#94a3b8',
    }));
  }, [persona, proyectoIds, tareas]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-emerald-300">Operacion diaria</p>
          <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">Mis tareas</h1>
          <p className="mt-2 text-slate-400">
            {usuarioActivo?.perfil === 'artbpo_ejecutivo' || usuarioActivo?.perfil === 'artbpo_admin'
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

      {esAdmin ? (
        <section className="space-y-4 pt-2">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-emerald-300">Vista administrador</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Tareas por persona</h2>
              <p className="mt-1 text-sm text-slate-400">Consulta la carga de cualquier responsable sin mezclarla con tus propias tareas.</p>
            </div>
            <label className="grid w-full gap-2 text-sm text-slate-300 sm:w-80">
              Responsable
              <select className="rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-white" value={persona} onChange={(event) => setPersonaSeleccionada(event.target.value)}>
                {personasAsignables.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
            <div className="mb-3 flex items-center gap-2 px-1 text-sm font-semibold text-slate-300">
              <UsersRound className="h-4 w-4 text-emerald-300" />
              {tareasPorPersona.length} tarea(s) asignada(s) a {persona || 'responsable'}
            </div>
            <TareasDrilldown tareas={tareasPorPersona} query={query} />
          </div>
        </section>
      ) : null}
    </div>
  );
}
