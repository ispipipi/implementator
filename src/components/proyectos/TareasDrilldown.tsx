import { AlertTriangle, ChevronDown, ChevronRight, FolderKanban, ListChecks, MessageSquare, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useAppStore, calcPctFase, calcPctProyecto } from '../../store/useAppStore';
import { Tarea } from '../../types';
import { diasVencida, tareaEstaVencida } from '../../utils/taskHealth';
import { GlassCard } from '../ui/GlassCard';
import { ProgressBar } from '../ui/ProgressBar';
import { StatusBadge } from '../ui/StatusBadge';
import { TareaEditDrawer } from './TareaEditDrawer';

type Props = {
  tareas: Tarea[];
  showProjectLevel?: boolean;
  query?: string;
};

const sortByPlan = (a: Tarea, b: Tarea) => a.fechaInicioPlan.localeCompare(b.fechaInicioPlan);

const toggleSet = (set: Set<string>, id: string) => {
  const next = new Set(set);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
};

export function TareasDrilldown({ tareas, showProjectLevel = true, query = '' }: Props) {
  const { proyectos, fases } = useAppStore();
  const [selected, setSelected] = useState<Tarea | null>(null);
  const normalized = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    const ordered = [...tareas].sort(sortByPlan);
    if (!normalized) return ordered;
    return ordered.filter((tarea) => {
      const proyecto = proyectos.find((p) => p.id === tarea.proyectoId);
      const fase = fases.find((f) => f.id === tarea.faseId);
      return [tarea.nombre, tarea.responsable, tarea.estado, proyecto?.nombre, fase?.nombre, fase?.codigo]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized));
    });
  }, [fases, normalized, proyectos, tareas]);

  const projectIds = useMemo(() => Array.from(new Set(filtered.map((tarea) => tarea.proyectoId))), [filtered]);
  const phaseIds = useMemo(() => Array.from(new Set(filtered.map((tarea) => tarea.faseId))), [filtered]);
  const [openProjects, setOpenProjects] = useState<Set<string>>(new Set(projectIds));
  const [openPhases, setOpenPhases] = useState<Set<string>>(new Set(phaseIds));

  useEffect(() => {
    setOpenProjects((current) => new Set([...current, ...projectIds]));
    setOpenPhases((current) => new Set([...current, ...phaseIds]));
  }, [phaseIds, projectIds]);

  const visibleProjects = useMemo(() => {
    const ids = Array.from(new Set(filtered.map((tarea) => tarea.proyectoId)));
    return ids
      .map((id) => proyectos.find((proyecto) => proyecto.id === id))
      .filter(Boolean)
      .sort((a, b) => (a?.nombre ?? '').localeCompare(b?.nombre ?? ''));
  }, [filtered, proyectos]);

  const ensureOpenProject = (id: string) => {
    setOpenProjects((current) => toggleSet(current, id));
  };

  const ensureOpenPhase = (id: string) => {
    setOpenPhases((current) => toggleSet(current, id));
  };

  const renderTask = (tarea: Tarea) => {
    const proyecto = proyectos.find((p) => p.id === tarea.proyectoId);
    const vencida = tareaEstaVencida(tarea);
    const overdueDays = diasVencida(tarea);
    return (
      <button
        key={tarea.id}
        className={[
          'group w-full rounded-lg border p-4 text-left transition',
          vencida
            ? 'border-red-400/50 bg-red-500/15 shadow-[0_0_34px_rgba(239,68,68,0.14)] hover:border-red-300/80 hover:bg-red-500/20'
            : 'border-white/10 bg-white/[0.035] hover:border-emerald-300/35 hover:bg-white/8',
        ].join(' ')}
        onClick={() => setSelected(tarea)}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <StatusBadge estado={tarea.estado} ping={tarea.estado === 'bloqueada'} />
              {vencida ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500 px-2.5 py-1 text-xs font-semibold text-white">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Vencida {overdueDays}d
                </span>
              ) : null}
              {tarea.esMilestone ? <span className="rounded-full bg-amber-400/12 px-2.5 py-1 text-xs font-medium text-amber-100">Milestone</span> : null}
            </div>
            <h4 className="font-semibold text-white transition group-hover:text-emerald-100">{tarea.nombre}</h4>
            <p className="mt-1 text-sm text-slate-400">
              {showProjectLevel ? null : <span>{proyecto?.nombre ?? 'Proyecto'} · </span>}
              Responsable: {tarea.responsable}
            </p>
          </div>
          <div className={`text-left text-sm sm:text-right ${vencida ? 'text-red-100' : 'text-slate-400'}`}>
            <p>Inicio {tarea.fechaInicioPlan}</p>
            <p>Fin {tarea.fechaFinPlan}</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <span>{tarea.duracionDias} dia(s) planificados</span>
          {tarea.observacion || tarea.comentarios?.length ? (
            <span className="inline-flex items-center gap-1 text-emerald-200">
              <MessageSquare className="h-3.5 w-3.5" />
              {tarea.comentarios?.length ? `${tarea.comentarios.length} mensaje(s)` : 'Con notas'}
            </span>
          ) : null}
        </div>
      </button>
    );
  };

  const renderPhases = (projectId: string) => {
    const fasesProyecto = fases
      .filter((fase) => fase.proyectoId === projectId && filtered.some((tarea) => tarea.faseId === fase.id))
      .sort((a, b) => a.orden - b.orden);

    return (
      <div className="space-y-3">
        {fasesProyecto.map((fase) => {
          const tareasFase = filtered.filter((tarea) => tarea.faseId === fase.id);
          const pct = calcPctFase(fase.id, tareas);
          const isOpen = openPhases.has(fase.id);

          return (
            <div key={fase.id} className="rounded-xl border border-white/10 bg-black/10">
              <button className="flex w-full items-center justify-between gap-4 p-4 text-left" onClick={() => ensureOpenPhase(fase.id)}>
                <div className="flex min-w-0 items-center gap-3">
                  {isOpen ? <ChevronDown className="h-5 w-5 shrink-0 text-slate-500" /> : <ChevronRight className="h-5 w-5 shrink-0 text-slate-500" />}
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-300">{fase.codigo}</p>
                    <h3 className="truncate font-semibold text-white">{fase.nombre}</h3>
                    <p className="mt-1 text-sm text-slate-500">{tareasFase.length} tarea(s)</p>
                  </div>
                </div>
                <div className="hidden min-w-36 sm:block">
                  <div className="mb-1 text-right text-sm font-semibold text-white">{pct}%</div>
                  <ProgressBar value={pct} tone={pct === 100 ? 'emerald' : 'blue'} />
                </div>
              </button>
              {isOpen ? <div className="grid gap-3 border-t border-white/10 p-3">{tareasFase.map(renderTask)}</div> : null}
            </div>
          );
        })}
      </div>
    );
  };

  if (!filtered.length) {
    return (
      <GlassCard className="p-6 text-center text-slate-400">
        <Search className="mx-auto mb-3 h-5 w-5 text-slate-500" />
        No hay tareas para mostrar con los filtros actuales.
      </GlassCard>
    );
  }

  if (!showProjectLevel) {
    const projectId = filtered[0]?.proyectoId ?? '';
    return (
      <>
        {renderPhases(projectId)}
        <TareaEditDrawer tarea={selected} onClose={() => setSelected(null)} />
      </>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {visibleProjects.map((proyecto) => {
          if (!proyecto) return null;
          const tareasProyecto = filtered.filter((tarea) => tarea.proyectoId === proyecto.id);
          const pct = calcPctProyecto(proyecto.id, tareas);
          const isOpen = openProjects.has(proyecto.id);

          return (
            <GlassCard key={proyecto.id} className="overflow-hidden">
              <button className="flex w-full items-center justify-between gap-4 p-5 text-left" onClick={() => ensureOpenProject(proyecto.id)}>
                <div className="flex min-w-0 items-center gap-3">
                  {isOpen ? <ChevronDown className="h-5 w-5 shrink-0 text-slate-500" /> : <ChevronRight className="h-5 w-5 shrink-0 text-slate-500" />}
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-400/12 text-emerald-200">
                    <FolderKanban className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold text-white">{proyecto.nombre}</h2>
                    <p className="mt-1 text-sm text-slate-500">{tareasProyecto.length} tarea(s) visibles</p>
                  </div>
                </div>
                <div className="hidden min-w-44 sm:block">
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-slate-400">Avance</span>
                    <span className="font-semibold text-white">{pct}%</span>
                  </div>
                  <ProgressBar value={pct} tone={pct === 100 ? 'emerald' : 'blue'} />
                </div>
              </button>
              {isOpen ? (
                <div className="border-t border-white/10 p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-300">
                    <ListChecks className="h-4 w-4 text-emerald-300" />
                    Fases y tareas
                  </div>
                  {renderPhases(proyecto.id)}
                </div>
              ) : null}
            </GlassCard>
          );
        })}
      </div>
      <TareaEditDrawer tarea={selected} onClose={() => setSelected(null)} />
    </>
  );
}
