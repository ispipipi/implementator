import { Bell, Check } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { GlassCard } from '../ui/GlassCard';

export function AlertPanel() {
  const { alertas, proyectos, marcarAlertaLeida, setVista } = useAppStore();
  const pendientes = alertas.filter((a) => !a.leida).slice(0, 6);

  return (
    <GlassCard className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-amber-300" />
          <h3 className="font-semibold text-white">Alertas</h3>
        </div>
        <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-xs text-amber-200">{pendientes.length}</span>
      </div>
      <div className="space-y-3">
        {pendientes.length ? (
          pendientes.map((alerta) => {
            const proyecto = proyectos.find((p) => p.id === alerta.proyectoId);
            return (
              <div key={alerta.id} className="rounded-lg border border-white/8 bg-white/[0.035] p-3">
                <button className="text-left text-sm font-medium text-slate-100 hover:text-white" onClick={() => setVista('proyecto', alerta.proyectoId)}>
                  {alerta.mensaje}
                </button>
                <div className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-500">
                  <span className="truncate">{proyecto?.nombre ?? 'Proyecto'}</span>
                  <button className="inline-flex items-center gap-1 text-emerald-300 hover:text-emerald-200" onClick={() => marcarAlertaLeida(alerta.id)}>
                    <Check className="h-3.5 w-3.5" />
                    Leída
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <p className="rounded-lg border border-white/8 bg-white/[0.035] p-3 text-sm text-slate-400">Sin alertas pendientes.</p>
        )}
      </div>
    </GlassCard>
  );
}
