import { AlertTriangle, ArrowRight, BarChart3, CheckCircle2, Clock3, FolderKanban, ListChecks } from 'lucide-react';
import { useProyectosVisibles } from '../../hooks/usePermisos';
import { useAppStore, calcPctFase, calcPctProyecto, semaforoProyecto } from '../../store/useAppStore';
import { GlassCard } from '../ui/GlassCard';
import { ProgressBar } from '../ui/ProgressBar';
import { ProgressRing } from '../ui/ProgressRing';
import { TrafficLightOrb } from '../ui/TrafficLightOrb';
import { AlertPanel } from '../layout/AlertPanel';

export function DashboardView() {
  const proyectos = useProyectosVisibles();
  const { tareas, fases, alertas, setVista, usuarioActivo } = useAppStore();

  if (usuarioActivo?.perfil === 'cliente') {
    const proyectoCliente = proyectos.find((p) => p.id === usuarioActivo.proyectoClienteId) ?? proyectos[0];
    if (!proyectoCliente) {
      return (
        <GlassCard className="p-6 text-slate-300">
          No hay un proyecto cliente asociado a este perfil.
        </GlassCard>
      );
    }

    const tareasProyecto = tareas.filter((t) => t.proyectoId === proyectoCliente.id);
    const fasesProyecto = fases.filter((f) => f.proyectoId === proyectoCliente.id).sort((a, b) => a.orden - b.orden);
    const avance = calcPctProyecto(proyectoCliente.id, tareas);
    const estado = semaforoProyecto(proyectoCliente.id, alertas);

    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="space-y-6">
          <GlassCard className="p-6 sm:p-8">
            <div className="grid gap-8 lg:grid-cols-[1fr_180px] lg:items-center">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-emerald-300">Vista cliente</p>
                <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">{proyectoCliente.nombre}</h1>
                <p className="mt-3 max-w-2xl text-slate-400">
                  Avance de implementacion de tu empresa y cumplimiento por fase. Puedes entrar a cada fase para revisar las tareas asociadas.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button className="inline-flex items-center gap-2 rounded-lg bg-emerald-400 px-4 py-2 font-semibold text-slate-950 hover:bg-emerald-300" onClick={() => setVista('proyecto', proyectoCliente.id)}>
                    Ver ficha del proyecto
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button className="rounded-lg border border-white/10 px-4 py-2 font-medium text-slate-200 hover:bg-white/8" onClick={() => setVista('mis_tareas')}>
                    Mis tareas
                  </button>
                </div>
              </div>
              <div className="flex flex-col items-center gap-4">
                <TrafficLightOrb estado={estado} size="lg" label={estado === 'verde' ? 'En control' : estado === 'amarillo' ? 'Atencion' : 'Critico'} />
                <ProgressRing value={avance} size={126} />
              </div>
            </div>
          </GlassCard>

          <div className="grid gap-4 sm:grid-cols-3">
            <GlassCard className="p-5">
              <BarChart3 className="mb-4 h-5 w-5 text-emerald-300" />
              <p className="text-3xl font-semibold text-white">{avance}%</p>
              <p className="mt-1 text-sm text-slate-400">Avance empresa</p>
            </GlassCard>
            <GlassCard className="p-5">
              <ListChecks className="mb-4 h-5 w-5 text-blue-300" />
              <p className="text-3xl font-semibold text-white">{tareasProyecto.length}</p>
              <p className="mt-1 text-sm text-slate-400">Tareas totales</p>
            </GlassCard>
            <GlassCard className="p-5">
              <CheckCircle2 className="mb-4 h-5 w-5 text-emerald-300" />
              <p className="text-3xl font-semibold text-white">{tareasProyecto.filter((t) => t.estado === 'completada').length}</p>
              <p className="mt-1 text-sm text-slate-400">Tareas completas</p>
            </GlassCard>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-emerald-300">Cumplimiento por fase</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Fases de implementacion</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {fasesProyecto.map((fase) => {
                const pct = calcPctFase(fase.id, tareas);
                const tareasFase = tareasProyecto.filter((t) => t.faseId === fase.id);
                return (
                  <GlassCard key={fase.id} interactive className="p-5">
                    <button className="w-full text-left" onClick={() => setVista('proyecto', proyectoCliente.id, fase.id)}>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <span className="rounded-md bg-white/8 px-2 py-1 text-xs font-semibold text-emerald-200">{fase.codigo}</span>
                          <h3 className="mt-3 font-semibold text-white">{fase.nombre}</h3>
                          <p className="mt-1 text-sm text-slate-500">{tareasFase.length} tarea(s)</p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-slate-500" />
                      </div>
                      <div className="mt-5 mb-2 flex items-center justify-between text-sm">
                        <span className="text-slate-400">Cumplimiento</span>
                        <span className="font-semibold text-white">{pct}%</span>
                      </div>
                      <ProgressBar value={pct} tone={pct === 100 ? 'emerald' : 'blue'} />
                    </button>
                  </GlassCard>
                );
              })}
            </div>
          </div>
        </section>

        <AlertPanel />
      </div>
    );
  }

  const tareasVisibles = tareas.filter((t) => proyectos.some((p) => p.id === t.proyectoId));
  const promedio = proyectos.length
    ? Math.round(proyectos.reduce((acc, p) => acc + calcPctProyecto(p.id, tareas), 0) / proyectos.length)
    : 0;
  const semaforo = alertas.some((a) => !a.leida && a.tipo === 'vencida')
    ? 'rojo'
    : alertas.some((a) => !a.leida)
      ? 'amarillo'
      : 'verde';

  const stats = [
    { label: 'Proyectos activos', value: proyectos.filter((p) => p.estado === 'activo').length, icon: FolderKanban },
    { label: 'Tareas completadas', value: tareasVisibles.filter((t) => t.estado === 'completada').length, icon: CheckCircle2 },
    { label: 'En proceso', value: tareasVisibles.filter((t) => t.estado === 'en_proceso').length, icon: Clock3 },
    { label: 'Alertas abiertas', value: alertas.filter((a) => !a.leida).length, icon: AlertTriangle },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section className="space-y-6">
        <GlassCard className="overflow-hidden p-6 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_220px] lg:items-center">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-emerald-300">Monitoreo de implementaciones</p>
              <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-normal text-white sm:text-5xl">
                IMPLEMENTATOR controla avance, riesgos y go live en una sola vista.
              </h1>
              <p className="mt-4 max-w-2xl text-slate-400">
                artBPO puede navegar desde el portafolio hasta cada fase y tarea, con alertas calculadas desde las fechas planificadas.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button className="inline-flex items-center gap-2 rounded-lg bg-emerald-400 px-4 py-2 font-semibold text-slate-950 hover:bg-emerald-300" onClick={() => setVista('proyectos')}>
                  Ver proyectos
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button className="rounded-lg border border-white/10 px-4 py-2 font-medium text-slate-200 hover:bg-white/8" onClick={() => setVista('reportes')}>
                  Abrir reportes
                </button>
              </div>
            </div>
            <div className="flex flex-col items-center gap-5">
              <TrafficLightOrb estado={semaforo} size="lg" />
              <ProgressRing value={promedio} size={116} />
              <p className="text-center text-sm text-slate-400">Avance promedio del portafolio visible</p>
            </div>
          </div>
        </GlassCard>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <GlassCard key={stat.label} className="p-5">
              <stat.icon className="mb-4 h-5 w-5 text-slate-400" />
              <p className="text-3xl font-semibold text-white">{stat.value}</p>
              <p className="mt-1 text-sm text-slate-400">{stat.label}</p>
            </GlassCard>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {proyectos.slice(0, 4).map((proyecto) => (
            <GlassCard key={proyecto.id} interactive className="p-5">
              <button className="w-full text-left" onClick={() => setVista('proyecto', proyecto.id)}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-white">{proyecto.nombre}</h3>
                    <p className="mt-1 text-sm text-slate-400">{proyecto.sistemaOrigen} · Go live {proyecto.fechaGoLive}</p>
                  </div>
                  <TrafficLightOrb estado={semaforoProyecto(proyecto.id, alertas)} size="sm" />
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-slate-400">Avance</span>
                  <span className="font-semibold text-white">{calcPctProyecto(proyecto.id, tareas)}%</span>
                </div>
              </button>
            </GlassCard>
          ))}
        </div>
      </section>

      <AlertPanel />
    </div>
  );
}
