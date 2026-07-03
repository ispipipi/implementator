import Gantt, { GanttTask } from 'frappe-gantt';
import { format } from 'date-fns';
import { Download } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Fase, Proyecto, Tarea } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { downloadGanttWorkbook } from '../../utils/exportGanttWorkbook';
import { GlassCard } from '../ui/GlassCard';

type Props = {
  tareas: Tarea[];
  exportConfig?: {
    proyecto: Proyecto;
    fases: Fase[];
    tareas: Tarea[];
  };
};

const progressByState = {
  pendiente: 0,
  en_proceso: 45,
  completada: 100,
  bloqueada: 20,
  cancelada: 0,
};

export function GanttView({ tareas, exportConfig }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const ganttRef = useRef<Gantt | null>(null);
  const actualizarFechasGantt = useAppStore((s) => s.actualizarFechasGantt);
  const [exportando, setExportando] = useState(false);

  const ganttTasks = useMemo<GanttTask[]>(
    () =>
      tareas.map((t) => ({
        id: t.id,
        name: t.nombre,
        start: t.fechaInicioPlan,
        end: t.fechaFinPlan,
        progress: progressByState[t.estado],
        dependencies: '',
        custom_class: `task-${t.estado.replace('_', '-')} ${t.esMilestone ? 'milestone' : ''}`,
      })),
    [tareas],
  );

  useEffect(() => {
    if (!containerRef.current || !ganttTasks.length) return;
    containerRef.current.innerHTML = '';
    ganttRef.current = new Gantt(containerRef.current, ganttTasks, {
      view_mode: 'Week',
      language: 'es',
      on_date_change: (task, start, end) => {
        actualizarFechasGantt(task.id, format(start, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd'));
      },
      custom_popup_html: (task) => `
        <div class="p-3">
          <strong>${task.name}</strong>
          <p>${task.start} / ${task.end}</p>
          <p>Avance: ${task.progress ?? 0}%</p>
        </div>
      `,
    });
  }, [actualizarFechasGantt, ganttTasks]);

  const exportarExcel = async () => {
    if (!exportConfig || exportando) return;
    try {
      setExportando(true);
      await downloadGanttWorkbook(exportConfig.proyecto, exportConfig.fases, exportConfig.tareas);
    } finally {
      setExportando(false);
    }
  };

  return (
    <GlassCard className="p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-white">Carta Gantt</h3>
          <p className="text-sm text-slate-500">Arrastra tareas para actualizar fechas planificadas.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-2 text-xs text-slate-400">
            <span>Semana</span>
            <span className="text-slate-600">·</span>
            <span>{tareas.length} tareas</span>
          </div>
          {exportConfig ? (
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white hover:bg-white/10 disabled:cursor-wait disabled:opacity-60"
              onClick={exportarExcel}
              disabled={exportando}
            >
              <Download className="h-4 w-4" />
              {exportando ? 'Generando Excel...' : 'Descargar Excel'}
            </button>
          ) : null}
        </div>
      </div>
      <div ref={containerRef} className="gantt-container min-h-[360px] overflow-x-auto rounded-lg border border-white/10 bg-[#11141d] p-2 scrollbar-thin" />
    </GlassCard>
  );
}
