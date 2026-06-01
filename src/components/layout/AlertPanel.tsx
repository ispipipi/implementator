import { AlertTriangle, Bell, Check, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Tarea } from '../../types';
import { alertaVisibleParaUsuario } from '../../utils/assignee';
import { TareaEditDrawer } from '../proyectos/TareaEditDrawer';
import { GlassCard } from '../ui/GlassCard';

const normalizar = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

export function AlertPanel() {
  const { alertas, proyectos, tareas, marcarAlertaLeida, setVista, usuarioActivo } = useAppStore();
  const [tareaSeleccionada, setTareaSeleccionada] = useState<Tarea | null>(null);
  const pendientes = alertas
    .filter((a) => !a.leida && alertaVisibleParaUsuario(a, usuarioActivo))
    .sort((a, b) => {
      const prioridad = { vencida: 0, bloqueada: 1, reasignada: 2, proxima_vencer: 3, en_riesgo: 4 };
      return prioridad[a.tipo] - prioridad[b.tipo];
    })
    .slice(0, 6);

  const buscarTareaAlerta = (alerta: (typeof alertas)[number]) => {
    const tareaPorId = tareas.find((item) => item.id === alerta.tareaId);
    if (tareaPorId) return tareaPorId;

    const nombreDesdeMensaje = alerta.mensaje.split(':').slice(1).join(':');
    const nombreNormalizado = normalizar(nombreDesdeMensaje);
    if (!nombreNormalizado) return null;

    return (
      tareas.find((item) => item.proyectoId === alerta.proyectoId && normalizar(item.nombre) === nombreNormalizado) ??
      tareas.find((item) => item.proyectoId === alerta.proyectoId && normalizar(item.nombre).includes(nombreNormalizado)) ??
      null
    );
  };

  const abrirAlerta = (alerta: (typeof alertas)[number]) => {
    const tarea = buscarTareaAlerta(alerta);
    if (tarea) {
      setTareaSeleccionada(tarea);
      return;
    }

    setVista('proyecto', alerta.proyectoId);
  };

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
            const esVencida = alerta.tipo === 'vencida';
            const esReasignada = alerta.tipo === 'reasignada';
            return (
              <div
                key={alerta.id}
                className={[
                  'rounded-lg border p-3 transition',
                  esVencida
                    ? 'border-red-400/50 bg-red-500/15 shadow-[0_0_26px_rgba(239,68,68,0.12)] hover:border-red-300/80'
                    : esReasignada
                      ? 'border-blue-300/30 bg-blue-400/10 hover:border-blue-300/55'
                      : 'border-white/8 bg-white/[0.035] hover:border-emerald-300/25 hover:bg-white/8',
                ].join(' ')}
              >
                <button className="w-full text-left text-sm font-medium text-slate-100 hover:text-white" onClick={() => abrirAlerta(alerta)}>
                  <span className="mb-2 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold" style={esVencida ? { background: '#ef4444', color: '#ffffff' } : undefined}>
                    {esVencida ? <AlertTriangle className="h-3.5 w-3.5" /> : esReasignada ? <UserPlus className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
                    {alerta.tipo.replace('_', ' ')}
                  </span>
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
      <TareaEditDrawer tarea={tareaSeleccionada} onClose={() => setTareaSeleccionada(null)} />
    </GlassCard>
  );
}
