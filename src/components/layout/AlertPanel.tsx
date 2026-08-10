import { AlertTriangle, Bell, CheckCircle2, ChevronDown, ChevronRight, Clock3, ShieldAlert, UserPlus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Tarea } from '../../types';
import { alertaVisibleParaUsuario } from '../../utils/assignee';
import { diasParaVencimiento } from '../../utils/taskHealth';
import { TareaEditDrawer } from '../proyectos/TareaEditDrawer';
import { GlassCard } from '../ui/GlassCard';

const normalizar = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

const etiquetaTipoAlerta: Record<string, string> = {
  vencida: 'Vencida',
  proxima_vencer: 'Próxima',
  bloqueada: 'Bloqueada',
  en_riesgo: 'En riesgo',
  reasignada: 'Reasignada',
  solicitud_reasignacion: 'Por aceptar',
  reasignacion_rechazada: 'Rechazada',
};

type GrupoAlerta = 'criticas' | 'hoy' | 'proximas' | 'reasignadas' | 'otras';

const grupoConfig: Record<GrupoAlerta, { label: string; empty: string; tone: string; dot: string }> = {
  criticas: { label: 'Críticas', empty: 'No hay alertas críticas.', tone: 'text-red-500', dot: 'bg-red-500' },
  hoy: { label: 'Hoy', empty: 'No hay alertas para hoy.', tone: 'text-amber-500', dot: 'bg-amber-400' },
  proximas: { label: 'Próximas', empty: 'No hay alertas próximas.', tone: 'text-orange-500', dot: 'bg-orange-400' },
  reasignadas: { label: 'Reasignaciones', empty: 'No hay reasignaciones pendientes.', tone: 'text-sky-500', dot: 'bg-sky-400' },
  otras: { label: 'Otras', empty: 'No hay otras alertas.', tone: 'text-slate-500', dot: 'bg-slate-400' },
};

const prioridadTipo: Record<string, number> = {
  vencida: 0,
  bloqueada: 1,
  solicitud_reasignacion: 2,
  reasignacion_rechazada: 3,
  reasignada: 4,
  proxima_vencer: 5,
  en_riesgo: 6,
};

const esCritica = (tipo: string) => tipo === 'vencida' || tipo === 'bloqueada' || tipo === 'en_riesgo';
const esReasignacion = (tipo: string) => tipo === 'reasignada' || tipo === 'solicitud_reasignacion' || tipo === 'reasignacion_rechazada';

export function AlertPanel() {
  const { alertas, proyectos, tareas, marcarAlertaLeida, setVista, usuarioActivo } = useAppStore();
  const [tareaSeleccionada, setTareaSeleccionada] = useState<Tarea | null>(null);
  const [grupoActivo, setGrupoActivo] = useState<'todas' | GrupoAlerta>('todas');
  const [gruposAbiertos, setGruposAbiertos] = useState<Set<GrupoAlerta>>(new Set(['criticas']));

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

  const pendientes = useMemo(() => {
    const unicas = new Map<string, (typeof alertas)[number]>();
    alertas
      .filter((alerta) => !alerta.leida && alertaVisibleParaUsuario(alerta, usuarioActivo))
      .forEach((alerta) => {
        const anterior = unicas.get(alerta.tareaId);
        if (!anterior || new Date(alerta.creadaEn).getTime() >= new Date(anterior.creadaEn).getTime()) {
          unicas.set(alerta.tareaId, alerta);
        }
      });

    return Array.from(unicas.values()).sort((a, b) => {
      const prioridad = (prioridadTipo[a.tipo] ?? 9) - (prioridadTipo[b.tipo] ?? 9);
      if (prioridad !== 0) return prioridad;
      return new Date(a.creadaEn).getTime() - new Date(b.creadaEn).getTime();
    });
  }, [alertas, usuarioActivo]);

  const clasificarAlerta = (alerta: (typeof alertas)[number]): GrupoAlerta => {
    const tarea = buscarTareaAlerta(alerta);
    if (esCritica(alerta.tipo)) return 'criticas';
    if (esReasignacion(alerta.tipo)) return 'reasignadas';
    if (alerta.tipo === 'proxima_vencer') return tarea && diasParaVencimiento(tarea) === 0 ? 'hoy' : 'proximas';
    return 'otras';
  };

  const grupos = useMemo(() => {
    const base: Record<GrupoAlerta, typeof pendientes> = {
      criticas: [],
      hoy: [],
      proximas: [],
      reasignadas: [],
      otras: [],
    };
    pendientes.forEach((alerta) => base[clasificarAlerta(alerta)].push(alerta));
    return base;
  }, [pendientes]);

  const gruposVisibles = grupoActivo === 'todas' ? (Object.keys(grupoConfig) as GrupoAlerta[]) : [grupoActivo];
  const toggleGrupo = (grupo: GrupoAlerta) =>
    setGruposAbiertos((current) => {
      const next = new Set(current);
      if (next.has(grupo)) next.delete(grupo);
      else next.add(grupo);
      return next;
    });

  return (
    <GlassCard className="overflow-hidden p-0">
      <div className="border-b border-white/10 px-5 py-5 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
              <Bell className="h-3.5 w-3.5" />
              Centro operacional
            </div>
            <h3 className="mt-2 text-xl font-semibold text-white">Alertas</h3>
          </div>
          <div className={`flex h-11 min-w-11 items-center justify-center rounded-2xl border text-sm font-semibold ${pendientes.length ? 'border-red-300/35 bg-red-500/10 text-red-200' : 'border-white/10 bg-white/[0.04] text-slate-400'}`}>
            {pendientes.length}
          </div>
        </div>
      </div>

      <div className="border-b border-white/10 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setGrupoActivo('todas')}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${grupoActivo === 'todas' ? 'border-emerald-300/45 bg-emerald-400/12 text-emerald-100' : 'border-white/10 bg-white/[0.035] text-slate-400 hover:text-white'}`}
          >
            Todas <span className="ml-1 opacity-60">{pendientes.length}</span>
          </button>
          {(Object.keys(grupoConfig) as GrupoAlerta[]).map((grupo) => (
            <button
              key={grupo}
              type="button"
              onClick={() => setGrupoActivo(grupo)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${grupoActivo === grupo ? 'border-emerald-300/45 bg-emerald-400/12 text-emerald-100' : 'border-white/10 bg-white/[0.035] text-slate-400 hover:text-white'}`}
            >
              {grupoConfig[grupo].label} <span className="ml-1 opacity-60">{grupos[grupo].length}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3 p-5 sm:p-6">
        {pendientes.length ? (
          gruposVisibles.map((grupo) => {
            const items = grupos[grupo];
            const abierto = gruposAbiertos.has(grupo) || grupoActivo !== 'todas';
            const config = grupoConfig[grupo];
            if (!items.length && grupoActivo === 'todas') return null;

            return (
              <section key={grupo} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">
                <button type="button" className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left" onClick={() => toggleGrupo(grupo)}>
                  <span className="flex items-center gap-2.5">
                    <span className={`h-2 w-2 rounded-full ${config.dot} ${grupo === 'criticas' && items.length ? 'animate-pulse' : ''}`} />
                    <span className={`text-sm font-semibold ${config.tone}`}>{config.label}</span>
                  </span>
                  <span className="flex items-center gap-2 text-xs text-slate-500">
                    {items.length}
                    {abierto ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </span>
                </button>

                {abierto ? (
                  <div className="border-t border-white/10">
                    {items.length ? items.map((alerta) => {
                      const proyecto = proyectos.find((p) => p.id === alerta.proyectoId);
                      const tarea = buscarTareaAlerta(alerta);
                      const critica = esCritica(alerta.tipo);
                      const reasignacion = esReasignacion(alerta.tipo);
                      const Icono = critica ? ShieldAlert : reasignacion ? UserPlus : alerta.tipo === 'proxima_vencer' ? Clock3 : AlertTriangle;

                      return (
                        <div key={alerta.id} className="group flex items-start gap-3 border-b border-white/8 px-4 py-4 last:border-b-0 hover:bg-white/[0.035]">
                          <span className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${critica ? 'bg-red-500/12 text-red-300' : reasignacion ? 'bg-sky-400/12 text-sky-300' : 'bg-amber-400/12 text-amber-300'}`}>
                            <Icono className="h-4 w-4" />
                          </span>
                          <button type="button" className="min-w-0 flex-1 text-left" onClick={() => abrirAlerta(alerta)}>
                            <span className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${critica ? 'text-red-300' : reasignacion ? 'text-sky-300' : 'text-amber-300'}`}>
                              {etiquetaTipoAlerta[alerta.tipo] ?? alerta.tipo.replace(/_/g, ' ')}
                            </span>
                            <span className="mt-1 block line-clamp-2 text-sm font-medium text-slate-100 group-hover:text-white">{tarea?.nombre ?? alerta.mensaje}</span>
                            <span className="mt-1 block truncate text-xs text-slate-500">{proyecto?.nombre ?? 'Proyecto'} · {alerta.mensaje}</span>
                          </button>
                          <button
                            type="button"
                            className="mt-1 rounded-lg p-1.5 text-slate-600 opacity-70 transition hover:bg-emerald-400/10 hover:text-emerald-300 group-hover:opacity-100"
                            onClick={() => marcarAlertaLeida(alerta.id)}
                            aria-label="Marcar alerta como leída"
                            title="Marcar como leída"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    }) : <p className="px-4 py-4 text-sm text-slate-500">{config.empty}</p>}
                  </div>
                ) : null}
              </section>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 px-5 py-10 text-center">
            <CheckCircle2 className="mx-auto h-7 w-7 text-emerald-300" />
            <p className="mt-3 text-sm font-medium text-slate-300">Todo bajo control</p>
            <p className="mt-1 text-xs text-slate-500">No hay alertas pendientes.</p>
          </div>
        )}
      </div>

      <TareaEditDrawer tarea={tareaSeleccionada} onClose={() => setTareaSeleccionada(null)} />
    </GlassCard>
  );
}
