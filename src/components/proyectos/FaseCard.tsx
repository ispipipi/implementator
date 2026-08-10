import { ChevronRight } from 'lucide-react';
import { Fase, Tarea } from '../../types';
import { useAppStore, calcCumplimientoGanttFase, calcPctFase, semaforoCumplimientoFase } from '../../store/useAppStore';
import { GlassCard } from '../ui/GlassCard';
import { TrafficLightOrb } from '../ui/TrafficLightOrb';

type Props = {
  fase: Fase;
  tareas: Tarea[];
};

export function FaseCard({ fase, tareas }: Props) {
  const setVista = useAppStore((s) => s.setVista);
  const pct = calcPctFase(fase.id, tareas);
  const cumplimiento = calcCumplimientoGanttFase(fase.id, tareas);
  const semaforo = semaforoCumplimientoFase(fase.id, tareas);
  const tareasFase = tareas.filter((t) => t.faseId === fase.id);

  return (
    <GlassCard interactive className="p-4">
      <button className="flex w-full items-center gap-4 text-left" onClick={() => setVista('fase', fase.proyectoId, fase.id)}>
        <TrafficLightOrb estado={semaforo} size="md" />
        <span className="min-w-0 flex-1">
          <span className="inline-flex rounded-md bg-white/8 px-2 py-1 text-xs font-semibold text-emerald-200">{fase.codigo}</span>
          <span className="mt-2 block truncate text-lg font-semibold text-white">{fase.nombre}</span>
          <span className="mt-1 block text-xs text-slate-500">{tareasFase.length} tareas</span>
        </span>
        <span className="flex gap-5 text-center">
          <span><strong className="block text-lg text-white">{cumplimiento}%</strong><small className="text-xs text-slate-500">Gantt</small></span>
          <span><strong className="block text-lg text-white">{pct}%</strong><small className="text-xs text-slate-500">Avance</small></span>
        </span>
        <ChevronRight className="h-5 w-5 shrink-0 text-slate-500" />
      </button>
    </GlassCard>
  );
}
