import { AlertTriangle, CheckCircle2, ClipboardCheck, Gauge, TestTube2 } from 'lucide-react';
import { useMemo } from 'react';
import { usePermisos } from '../../hooks/usePermisos';
import { useAppStore } from '../../store/useAppStore';
import { CumplimientoHrAdminItem, ResponsableCumplimientoHrAdmin } from '../../types';
import { GlassCard } from '../ui/GlassCard';

const responsables: Array<{ value: ResponsableCumplimientoHrAdmin; label: string }> = [
  { value: null, label: 'Sin asignar' },
  { value: 'artBPO', label: 'artBPO' },
  { value: 'TMF', label: 'TMF' },
  { value: 'REX+', label: 'REX+' },
];

const estadoLabel: Record<CumplimientoHrAdminItem['estado'], string> = {
  concluido: 'Concluido',
  en_proceso: 'En proceso',
};

export function CumplimientoHrAdminView() {
  const { cumplimientoHrAdmin, actualizarCumplimientoHrAdmin } = useAppStore();
  const { soloLectura, esCliente } = usePermisos();
  const puedeEditar = !soloLectura && !esCliente;

  const resumen = useMemo(() => {
    const total = cumplimientoHrAdmin.length;
    const concluidos = cumplimientoHrAdmin.filter((item) => item.estado === 'concluido').length;
    const pruebasOk = cumplimientoHrAdmin.filter((item) => item.pruebasRealizadas).length;
    const pendientesSinResponsable = cumplimientoHrAdmin.filter(
      (item) => item.estado === 'en_proceso' && item.responsable === null,
    ).length;
    return {
      total,
      concluidos,
      porcentaje: total ? Math.round((concluidos / total) * 100) : 0,
      pruebasOk,
      pendientesSinResponsable,
    };
  }, [cumplimientoHrAdmin]);

  const actualizarFila = (
    modulo: string,
    cambios: Partial<CumplimientoHrAdminItem>,
  ) => actualizarCumplimientoHrAdmin(modulo, cambios);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <GlassCard className="p-6">
          <p className="text-sm uppercase tracking-[0.18em] text-emerald-300">Control operativo</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Cumplimiento HR Admin</h1>
          <p className="mt-3 max-w-3xl text-sm text-slate-300">
            Seguimiento de configuraciones críticas de HR Admin, con estado, pruebas realizadas y responsable del pendiente cuando todavía no está listo.
          </p>
          {!puedeEditar ? (
            <div className="mt-4 rounded-lg border border-sky-300/20 bg-sky-400/10 px-4 py-3 text-sm text-sky-100">
              Esta vista está en modo lectura para tu perfil.
            </div>
          ) : null}
        </GlassCard>

        <GlassCard className="grid gap-4 p-6 sm:grid-cols-2">
          <ResumenCard
            icon={Gauge}
            label="Avance"
            value={`${resumen.concluidos}/${resumen.total}`}
            detail={`${resumen.porcentaje}% concluido`}
            tone="emerald"
          />
          <ResumenCard
            icon={TestTube2}
            label="Pruebas realizadas"
            value={`${resumen.pruebasOk}`}
            detail={`de ${resumen.total} módulos`}
            tone="blue"
          />
          <ResumenCard
            icon={CheckCircle2}
            label="Módulos concluidos"
            value={`${resumen.concluidos}`}
            detail="listos para cierre"
            tone="emerald"
          />
          <ResumenCard
            icon={AlertTriangle}
            label="Pendientes sin dueño"
            value={`${resumen.pendientesSinResponsable}`}
            detail="requieren asignación"
            tone={resumen.pendientesSinResponsable ? 'amber' : 'slate'}
          />
        </GlassCard>
      </section>

      <GlassCard className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="text-xl font-semibold text-white">Matriz de funcionalidades</h2>
            <p className="mt-1 text-sm text-slate-400">Estado editable con guardado en tiempo real.</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-slate-300">
            <ClipboardCheck className="h-3.5 w-3.5" />
            7 registros
          </span>
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <table className="min-w-full text-sm">
            <thead className="bg-white/[0.03] text-left text-slate-300">
              <tr>
                <th className="px-5 py-3 font-medium">Módulo</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3 font-medium">Pruebas realizadas</th>
                <th className="px-5 py-3 font-medium">Responsable</th>
                <th className="px-5 py-3 font-medium">Observación</th>
              </tr>
            </thead>
            <tbody>
              {cumplimientoHrAdmin.map((item) => {
                const requiereResponsable = item.estado === 'en_proceso' && item.responsable === null;
                return (
                  <tr key={item.modulo} className="border-t border-white/8 align-top">
                    <td className="px-5 py-4">
                      <p className="font-medium text-white">{item.modulo}</p>
                    </td>
                    <td className="px-5 py-4">
                      <select
                        value={item.estado}
                        disabled={!puedeEditar}
                        onChange={(event) =>
                          actualizarFila(item.modulo, {
                            estado: event.target.value as CumplimientoHrAdminItem['estado'],
                          })
                        }
                        className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        <option value="concluido">Concluido</option>
                        <option value="en_proceso">En proceso</option>
                      </select>
                    </td>
                    <td className="px-5 py-4">
                      <label className="inline-flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-slate-200">
                        <input
                          type="checkbox"
                          checked={item.pruebasRealizadas}
                          disabled={!puedeEditar}
                          onChange={(event) =>
                            actualizarFila(item.modulo, {
                              pruebasRealizadas: event.target.checked,
                            })
                          }
                          className="h-4 w-4 rounded border-white/20 bg-transparent text-emerald-400"
                        />
                        <span>{item.pruebasRealizadas ? 'Sí' : 'No'}</span>
                      </label>
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-2">
                        <select
                          value={item.responsable ?? ''}
                          disabled={!puedeEditar || item.estado === 'concluido'}
                          onChange={(event) =>
                            actualizarFila(item.modulo, {
                              responsable: (event.target.value || null) as ResponsableCumplimientoHrAdmin,
                            })
                          }
                          className={`w-full rounded-lg border px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-70 ${
                            requiereResponsable
                              ? 'border-amber-300/40 bg-amber-400/10'
                              : 'border-white/10 bg-white/[0.04]'
                          }`}
                        >
                          {responsables.map((responsable) => (
                            <option key={responsable.label} value={responsable.value ?? ''}>
                              {responsable.label}
                            </option>
                          ))}
                        </select>
                        {requiereResponsable ? (
                          <p className="inline-flex items-center gap-2 text-xs font-medium text-amber-200">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            Falta asignar responsable para este pendiente.
                          </p>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <textarea
                        value={item.observacion}
                        disabled={!puedeEditar}
                        onChange={(event) => actualizarFila(item.modulo, { observacion: event.target.value })}
                        placeholder="Agregar detalle operativo"
                        className="min-h-[84px] w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-70"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="grid gap-4 p-4 lg:hidden">
          {cumplimientoHrAdmin.map((item) => {
            const requiereResponsable = item.estado === 'en_proceso' && item.responsable === null;
            return (
              <GlassCard key={item.modulo} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{item.modulo}</p>
                    <p className="mt-1 text-xs text-slate-400">{estadoLabel[item.estado]}</p>
                  </div>
                  {requiereResponsable ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/10 px-2 py-1 text-[11px] font-medium text-amber-200">
                      <AlertTriangle className="h-3 w-3" />
                      Sin dueño
                    </span>
                  ) : null}
                </div>

                <div className="mt-4 grid gap-3">
                  <label className="grid gap-1 text-sm text-slate-300">
                    Estado
                    <select
                      value={item.estado}
                      disabled={!puedeEditar}
                      onChange={(event) =>
                        actualizarFila(item.modulo, {
                          estado: event.target.value as CumplimientoHrAdminItem['estado'],
                        })
                      }
                      className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-white disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <option value="concluido">Concluido</option>
                      <option value="en_proceso">En proceso</option>
                    </select>
                  </label>

                  <label className="inline-flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-slate-200">
                    <input
                      type="checkbox"
                      checked={item.pruebasRealizadas}
                      disabled={!puedeEditar}
                      onChange={(event) =>
                        actualizarFila(item.modulo, {
                          pruebasRealizadas: event.target.checked,
                        })
                      }
                      className="h-4 w-4 rounded border-white/20 bg-transparent text-emerald-400"
                    />
                    Pruebas realizadas
                  </label>

                  <label className="grid gap-1 text-sm text-slate-300">
                    Responsable
                    <select
                      value={item.responsable ?? ''}
                      disabled={!puedeEditar || item.estado === 'concluido'}
                      onChange={(event) =>
                        actualizarFila(item.modulo, {
                          responsable: (event.target.value || null) as ResponsableCumplimientoHrAdmin,
                        })
                      }
                      className={`rounded-lg border px-3 py-2 text-white disabled:cursor-not-allowed disabled:opacity-70 ${
                        requiereResponsable
                          ? 'border-amber-300/40 bg-amber-400/10'
                          : 'border-white/10 bg-white/[0.04]'
                      }`}
                    >
                      {responsables.map((responsable) => (
                        <option key={responsable.label} value={responsable.value ?? ''}>
                          {responsable.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-1 text-sm text-slate-300">
                    Observación
                    <textarea
                      value={item.observacion}
                      disabled={!puedeEditar}
                      onChange={(event) => actualizarFila(item.modulo, { observacion: event.target.value })}
                      placeholder="Agregar detalle operativo"
                      className="min-h-[92px] rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-white placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-70"
                    />
                  </label>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}

function ResumenCard({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: typeof Gauge;
  label: string;
  value: string;
  detail: string;
  tone: 'emerald' | 'blue' | 'amber' | 'slate';
}) {
  const toneClass =
    tone === 'emerald'
      ? 'bg-emerald-400/10 text-emerald-200 ring-emerald-300/25'
      : tone === 'blue'
        ? 'bg-sky-400/10 text-sky-200 ring-sky-300/25'
        : tone === 'amber'
          ? 'bg-amber-400/10 text-amber-200 ring-amber-300/25'
          : 'bg-white/[0.05] text-slate-200 ring-white/10';

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className={`inline-flex rounded-lg p-2 ring-1 ${toneClass}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-4 text-sm text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </div>
  );
}
