import { useEffect, useState } from 'react';
import { Drawer } from '../ui/Drawer';
import { EstadoTarea, Tarea } from '../../types';
import { useAppStore } from '../../store/useAppStore';

type Props = {
  tarea: Tarea | null;
  onClose: () => void;
};

const estados: EstadoTarea[] = ['pendiente', 'en_proceso', 'completada', 'bloqueada', 'cancelada'];

export function TareaEditDrawer({ tarea, onClose }: Props) {
  const { actualizarTarea, usuarioActivo } = useAppStore();
  const [form, setForm] = useState({
    estado: 'pendiente' as EstadoTarea,
    responsable: '',
    fechaInicioPlan: '',
    fechaFinPlan: '',
    observacion: '',
  });

  useEffect(() => {
    if (!tarea) return;
    setForm({
      estado: tarea.estado,
      responsable: tarea.responsable,
      fechaInicioPlan: tarea.fechaInicioPlan,
      fechaFinPlan: tarea.fechaFinPlan,
      observacion: tarea.observacion ?? '',
    });
  }, [tarea]);

  const save = () => {
    if (!tarea) return;
    actualizarTarea(tarea.id, form, usuarioActivo?.nombre ?? 'Sistema');
    onClose();
  };

  return (
    <Drawer open={!!tarea} title={tarea?.nombre ?? 'Editar tarea'} onClose={onClose}>
      <div className="space-y-5">
        <label className="grid gap-2 text-sm text-slate-300">
          Estado
          <select className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" value={form.estado} onChange={(e) => setForm((s) => ({ ...s, estado: e.target.value as EstadoTarea }))}>
            {estados.map((estado) => (
              <option key={estado} value={estado}>
                {estado.replace('_', ' ')}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm text-slate-300">
          Responsable
          <input className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" value={form.responsable} onChange={(e) => setForm((s) => ({ ...s, responsable: e.target.value }))} />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm text-slate-300">
            Inicio plan
            <input type="date" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" value={form.fechaInicioPlan} onChange={(e) => setForm((s) => ({ ...s, fechaInicioPlan: e.target.value }))} />
          </label>
          <label className="grid gap-2 text-sm text-slate-300">
            Fin plan
            <input type="date" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" value={form.fechaFinPlan} onChange={(e) => setForm((s) => ({ ...s, fechaFinPlan: e.target.value }))} />
          </label>
        </div>

        <label className="grid gap-2 text-sm text-slate-300">
          Observación
          <textarea className="min-h-28 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" value={form.observacion} onChange={(e) => setForm((s) => ({ ...s, observacion: e.target.value }))} />
        </label>

        {tarea?.historial?.length ? (
          <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
            <h3 className="mb-3 text-sm font-semibold text-white">Últimos cambios</h3>
            <div className="space-y-2 text-xs text-slate-400">
              {tarea.historial.slice(-5).map((item, index) => (
                <p key={`${item.fecha}-${index}`}>
                  {item.campo}: {item.valorAnterior || '-'} {'>'} {item.valorNuevo || '-'} · {item.usuario}
                </p>
              ))}
            </div>
          </div>
        ) : null}

        <button className="w-full rounded-lg bg-emerald-400 px-4 py-3 font-semibold text-slate-950 hover:bg-emerald-300" onClick={save}>
          Guardar cambios
        </button>
      </div>
    </Drawer>
  );
}
