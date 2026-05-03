import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, FolderKanban } from 'lucide-react';
import { useProyectosVisibles } from '../../hooks/usePermisos';
import { useAppStore, calcPctProyecto, semaforoProyecto } from '../../store/useAppStore';
import { GlassCard } from '../ui/GlassCard';
import { ProgressRing } from '../ui/ProgressRing';
import { TrafficLightOrb } from '../ui/TrafficLightOrb';
import { AlertPanel } from '../layout/AlertPanel';

export function DashboardView() {
  const proyectos = useProyectosVisibles();
  const { tareas, alertas, setVista } = useAppStore();
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
