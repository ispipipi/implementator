import { AlertTriangle, ArrowLeft, ArrowRight, Bell, CalendarDays, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { usePermisos, useProyectosVisibles } from '../../hooks/usePermisos';
import {
  calcCumplimientoGanttFase,
  calcCumplimientoGanttProyecto,
  calcPctFase,
  calcPctProyecto,
  semaforoCumplimientoFase,
  semaforoCumplimientoProyecto,
  useAppStore,
} from '../../store/useAppStore';
import { EstadoSemaforo, Fase, Proyecto, Tarea } from '../../types';
import { alertaVisibleParaUsuario } from '../../utils/assignee';
import { AlertPanel } from '../layout/AlertPanel';
import { TaskStatusGroups } from '../proyectos/TareasDrilldown';
import { TareaEditDrawer } from '../proyectos/TareaEditDrawer';
import { GlassCard } from '../ui/GlassCard';
import { ProgressRing } from '../ui/ProgressRing';
import { StatusBadge } from '../ui/StatusBadge';
import { TrafficLightOrb } from '../ui/TrafficLightOrb';

type NivelDrilldown = 'inicio' | 'proyectos' | 'fases' | 'tareas';

const semaforoPrioridad: Record<EstadoSemaforo, number> = { rojo: 0, amarillo: 1, verde: 2 };

const ordenarPorSemaforo = (a: { estado: EstadoSemaforo; nombre: string }, b: { estado: EstadoSemaforo; nombre: string }) =>
  semaforoPrioridad[a.estado] - semaforoPrioridad[b.estado] || a.nombre.localeCompare(b.nombre);

function Medidor({ label, value, size = 96 }: { label: string; value: number; size?: number }) {
  return (
    <div className="flex min-w-[92px] flex-col items-center gap-2 text-center">
      <ProgressRing value={value} size={size} />
      <span className="max-w-[110px] text-xs font-medium text-slate-400">{label}</span>
    </div>
  );
}

function NavegacionDrilldown({
  nivel,
  proyecto,
  fase,
  volver,
}: {
  nivel: NivelDrilldown;
  proyecto?: Proyecto;
  fase?: Fase;
  volver: () => void;
}) {
  if (nivel === 'inicio') return null;

  return (
    <div className="mb-5 flex flex-wrap items-center gap-2 text-sm">
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-slate-300 transition hover:border-emerald-300/35 hover:text-white"
        onClick={volver}
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
      </button>
      <span className="text-slate-600">/</span>
      <span className="text-slate-400">{nivel === 'proyectos' ? 'Proyectos' : proyecto?.nombre}</span>
      {fase ? (
        <>
          <span className="text-slate-600">/</span>
          <span className="text-emerald-300">{fase.codigo} · {fase.nombre}</span>
        </>
      ) : null}
    </div>
  );
}

export function DashboardView() {
  const proyectos = useProyectosVisibles();
  const { tareas, fases, alertas, usuarioActivo } = useAppStore();
  const { esCliente } = usePermisos();
  const [nivel, setNivel] = useState<NivelDrilldown>('inicio');
  const [proyectoId, setProyectoId] = useState<string | null>(null);
  const [faseId, setFaseId] = useState<string | null>(null);
  const [alertasAbiertas, setAlertasAbiertas] = useState(false);
  const [tareaSeleccionada, setTareaSeleccionada] = useState<Tarea | null>(null);

  const proyectosVisibles = useMemo(() => {
    if (!esCliente) return proyectos;
    return proyectos.filter((proyecto) => proyecto.id === usuarioActivo?.proyectoClienteId);
  }, [esCliente, proyectos, usuarioActivo?.proyectoClienteId]);

  const tareasVisibles = useMemo(
    () => tareas.filter((tarea) => proyectosVisibles.some((proyecto) => proyecto.id === tarea.proyectoId)),
    [proyectosVisibles, tareas],
  );

  const alertasPendientes = useMemo(
    () => alertas.filter((alerta) => !alerta.leida && alertaVisibleParaUsuario(alerta, usuarioActivo)),
    [alertas, usuarioActivo],
  );

  const promedioAvance = proyectosVisibles.length
    ? Math.round(proyectosVisibles.reduce((total, proyecto) => total + calcPctProyecto(proyecto.id, tareas), 0) / proyectosVisibles.length)
    : 0;
  const promedioCumplimiento = proyectosVisibles.length
    ? Math.round(proyectosVisibles.reduce((total, proyecto) => total + calcCumplimientoGanttProyecto(proyecto.id, tareas), 0) / proyectosVisibles.length)
    : 0;
  const estadoPortafolio: EstadoSemaforo = proyectosVisibles.some((proyecto) => semaforoCumplimientoProyecto(proyecto.id, tareas) === 'rojo')
    ? 'rojo'
    : proyectosVisibles.some((proyecto) => semaforoCumplimientoProyecto(proyecto.id, tareas) === 'amarillo')
      ? 'amarillo'
      : 'verde';

  const proyectoActivo = proyectosVisibles.find((proyecto) => proyecto.id === proyectoId);
  const fasesActivas = useMemo(
    () => (proyectoActivo ? fases.filter((fase) => fase.proyectoId === proyectoActivo.id).sort((a, b) => a.orden - b.orden) : []),
    [fases, proyectoActivo],
  );
  const faseActiva = fasesActivas.find((fase) => fase.id === faseId);
  const tareasActivas = useMemo(
    () => (faseActiva ? tareasVisibles.filter((tarea) => tarea.faseId === faseActiva.id) : []),
    [faseActiva, tareasVisibles],
  );

  const abrirProyectos = () => {
    if (esCliente && proyectosVisibles.length === 1) {
      setProyectoId(proyectosVisibles[0].id);
      setFaseId(null);
      setNivel('fases');
      return;
    }
    setNivel('proyectos');
    setProyectoId(null);
    setFaseId(null);
  };

  const abrirProyecto = (id: string) => {
    setProyectoId(id);
    setFaseId(null);
    setNivel('fases');
  };

  const abrirFase = (id: string) => {
    setFaseId(id);
    setNivel('tareas');
  };

  const volver = () => {
    if (nivel === 'tareas') {
      setNivel('fases');
      setFaseId(null);
      return;
    }
    if (nivel === 'fases') {
      setNivel(esCliente ? 'inicio' : 'proyectos');
      setProyectoId(null);
      return;
    }
    setNivel('inicio');
  };

  const proyectoMetricas = (proyecto: Proyecto) => ({
    estado: semaforoCumplimientoProyecto(proyecto.id, tareas),
    cumplimiento: calcCumplimientoGanttProyecto(proyecto.id, tareas),
    avance: calcPctProyecto(proyecto.id, tareas),
  });

  const faseMetricas = (fase: Fase) => ({
    estado: semaforoCumplimientoFase(fase.id, tareas),
    cumplimiento: calcCumplimientoGanttFase(fase.id, tareas),
    avance: calcPctFase(fase.id, tareas),
  });

  return (
    <div className="mx-auto max-w-5xl animate-fade-in">
      <GlassCard className="overflow-hidden p-5 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">Monitoreo de implementaciones</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">IMPLEMENTATOR</h1>
            {nivel === 'inicio' ? <p className="mt-2 text-sm text-slate-400">Estado operacional en una sola vista.</p> : null}
          </div>
          <button
            type="button"
            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition ${alertasPendientes.length ? 'border-red-300/45 bg-red-500/12 text-red-100 hover:bg-red-500/20' : 'border-white/10 bg-white/[0.035] text-slate-300 hover:bg-white/8'}`}
            onClick={() => setAlertasAbiertas((actual) => !actual)}
            aria-label="Mostrar alertas"
          >
            <Bell className="h-4 w-4" />
            <span>{alertasPendientes.length}</span>
            <span className="hidden sm:inline">alertas</span>
          </button>
        </div>

        {nivel === 'inicio' ? (
          <button
            type="button"
            className="mx-auto mt-8 grid w-full max-w-2xl place-items-center rounded-2xl border border-white/10 bg-white/[0.025] px-5 py-8 text-center transition hover:border-emerald-300/35 hover:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-emerald-300/30"
            onClick={abrirProyectos}
          >
            <TrafficLightOrb estado={estadoPortafolio} size="lg" label="Abrir semáforo operacional" />
            <div className="mt-5 grid grid-cols-2 gap-10 sm:gap-16">
              <Medidor label="Cumplimiento Gantt" value={promedioCumplimiento} size={112} />
              <Medidor label="% avance real" value={promedioAvance} size={112} />
            </div>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-emerald-300">
              Ver proyectos
              <ArrowRight className="h-4 w-4" />
            </span>
          </button>
        ) : null}

        {nivel !== 'inicio' ? (
          <div className="mt-7">
            <NavegacionDrilldown nivel={nivel} proyecto={proyectoActivo} fase={faseActiva} volver={volver} />

            {nivel === 'proyectos' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-emerald-300">Nivel 1</p>
                    <h2 className="mt-1 text-2xl font-semibold text-white">Proyectos</h2>
                  </div>
                  <span className="text-sm text-slate-500">{proyectosVisibles.length} visibles</span>
                </div>
                <div className="grid gap-3">
                  {[...proyectosVisibles]
                    .map((proyecto) => ({ proyecto, ...proyectoMetricas(proyecto) }))
                    .sort((a, b) => ordenarPorSemaforo({ estado: a.estado, nombre: a.proyecto.nombre }, { estado: b.estado, nombre: b.proyecto.nombre }))
                    .map(({ proyecto, estado, cumplimiento, avance }) => (
                      <button
                        key={proyecto.id}
                        type="button"
                        className="flex w-full flex-wrap items-center gap-4 rounded-xl border border-white/10 bg-white/[0.025] p-4 text-left transition hover:border-emerald-300/35 hover:bg-white/[0.05] sm:flex-nowrap"
                        onClick={() => abrirProyecto(proyecto.id)}
                      >
                        <TrafficLightOrb estado={estado} size="md" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold text-white">{proyecto.nombre}</span>
                          <span className="mt-1 inline-flex items-center gap-1.5 text-xs text-slate-500"><CalendarDays className="h-3.5 w-3.5" />{proyecto.fechaInicio} · {proyecto.fechaGoLive}</span>
                        </span>
                        <span className="flex gap-5 text-center">
                          <span><strong className="block text-lg text-white">{cumplimiento}%</strong><small className="text-xs text-slate-500">Gantt</small></span>
                          <span><strong className="block text-lg text-white">{avance}%</strong><small className="text-xs text-slate-500">Avance</small></span>
                        </span>
                        <ChevronRight className="h-5 w-5 shrink-0 text-slate-500" />
                      </button>
                    ))}
                </div>
              </div>
            ) : null}

            {nivel === 'fases' && proyectoActivo ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-emerald-300">{proyectoActivo.sistemaOrigen} · REX+</p>
                    <h2 className="mt-1 text-2xl font-semibold text-white">{proyectoActivo.nombre}</h2>
                  </div>
                  <span className="text-sm text-slate-500">{fasesActivas.length} fases</span>
                </div>
                <div className="grid gap-3">
                  {[...fasesActivas]
                    .map((fase) => ({ fase, ...faseMetricas(fase) }))
                    .sort((a, b) => ordenarPorSemaforo({ estado: a.estado, nombre: a.fase.nombre }, { estado: b.estado, nombre: b.fase.nombre }))
                    .map(({ fase, estado, cumplimiento, avance }) => (
                      <button
                        key={fase.id}
                        type="button"
                        className="flex w-full flex-wrap items-center gap-4 rounded-xl border border-white/10 bg-white/[0.025] p-4 text-left transition hover:border-emerald-300/35 hover:bg-white/[0.05] sm:flex-nowrap"
                        onClick={() => abrirFase(fase.id)}
                      >
                        <TrafficLightOrb estado={estado} size="md" />
                        <span className="min-w-0 flex-1">
                          <span className="inline-flex rounded-md bg-white/8 px-2 py-1 text-xs font-semibold text-emerald-200">{fase.codigo}</span>
                          <span className="mt-2 block truncate font-semibold text-white">{fase.nombre}</span>
                        </span>
                        <span className="flex gap-5 text-center">
                          <span><strong className="block text-lg text-white">{cumplimiento}%</strong><small className="text-xs text-slate-500">Gantt</small></span>
                          <span><strong className="block text-lg text-white">{avance}%</strong><small className="text-xs text-slate-500">Avance</small></span>
                        </span>
                        <ChevronRight className="h-5 w-5 shrink-0 text-slate-500" />
                      </button>
                    ))}
                </div>
              </div>
            ) : null}

            {nivel === 'tareas' && proyectoActivo && faseActiva ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-emerald-300">{faseActiva.codigo}</p>
                    <h2 className="mt-1 text-2xl font-semibold text-white">{faseActiva.nombre}</h2>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <TrafficLightOrb estado={faseMetricas(faseActiva).estado} size="sm" />
                    <span className="text-sm text-slate-400">{tareasActivas.length} tareas</span>
                  </div>
                </div>
                <TaskStatusGroups
                  tareas={tareasActivas}
                  scopeId={`dashboard-${faseActiva.id}`}
                  renderTask={(tarea) => (
                    <button
                      key={tarea.id}
                      type="button"
                      className="rounded-lg border border-white/10 bg-white/[0.025] p-3 text-left transition hover:border-emerald-300/35 hover:bg-white/[0.05]"
                      onClick={() => setTareaSeleccionada(tarea)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <StatusBadge estado={tarea.estado} ping={tarea.estado === 'bloqueada'} />
                            {tarea.esMilestone ? <span className="rounded-full bg-amber-400/12 px-2 py-1 text-xs font-medium text-amber-100">Hito</span> : null}
                          </div>
                          <p className="line-clamp-2 text-sm font-semibold text-white">{tarea.nombre}</p>
                          <p className="mt-1 text-xs text-slate-500">{tarea.responsable}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-500" />
                      </div>
                    </button>
                  )}
                />
              </div>
            ) : null}
          </div>
        ) : null}
      </GlassCard>

      {alertasAbiertas ? (
        <div className="relative mx-auto mt-5 max-w-3xl">
          <button type="button" className="absolute right-3 top-3 z-10 text-xs text-slate-500 hover:text-white" onClick={() => setAlertasAbiertas(false)}>
            Cerrar
          </button>
          <AlertPanel />
        </div>
      ) : null}

      {!proyectosVisibles.length ? (
        <div className="mt-5 rounded-xl border border-amber-300/20 bg-amber-400/10 p-4 text-sm text-amber-100">
          <AlertTriangle className="mr-2 inline h-4 w-4" />No hay proyectos visibles para este usuario.
        </div>
      ) : null}

      <TareaEditDrawer tarea={tareaSeleccionada} onClose={() => setTareaSeleccionada(null)} />
    </div>
  );
}
