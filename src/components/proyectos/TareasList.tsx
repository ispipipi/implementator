import { useMemo, useState } from 'react';
import { Tarea } from '../../types';
import { GlassCard } from '../ui/GlassCard';
import { TareaEditDrawer } from './TareaEditDrawer';
import { TareaRow } from './TareaRow';

type Props = {
  tareas: Tarea[];
};

export function TareasList({ tareas }: Props) {
  const [selected, setSelected] = useState<Tarea | null>(null);
  const ordered = useMemo(() => [...tareas].sort((a, b) => a.fechaInicioPlan.localeCompare(b.fechaInicioPlan)), [tareas]);

  return (
    <>
      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="min-w-full text-left">
            <thead className="bg-white/[0.035] text-xs uppercase tracking-[0.14em] text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Tarea</th>
                <th className="px-4 py-3 font-semibold">Responsable</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold">Inicio</th>
                <th className="px-4 py-3 font-semibold">Fin</th>
                <th className="px-4 py-3 text-right font-semibold">Acción</th>
              </tr>
            </thead>
            <tbody>
              {ordered.map((tarea) => (
                <TareaRow key={tarea.id} tarea={tarea} onEdit={setSelected} />
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
      <TareaEditDrawer tarea={selected} onClose={() => setSelected(null)} />
    </>
  );
}
