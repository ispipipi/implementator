import {
  AlertTriangle,
  BadgeCheck,
  ClipboardCheck,
  FileCheck2,
  FileText,
  Gauge,
  Landmark,
  MessageSquareText,
  Settings2,
  ShieldCheck,
  TestTube2,
  UsersRound,
} from 'lucide-react';
import { useMemo } from 'react';
import { usePermisos } from '../../hooks/usePermisos';
import { useAppStore } from '../../store/useAppStore';
import { CumplimientoHrAdminItem, ResponsableCumplimientoHrAdmin } from '../../types';
import { GlassCard } from '../ui/GlassCard';
import { ProgressRing } from '../ui/ProgressRing';

const responsables: Array<{ value: ResponsableCumplimientoHrAdmin; label: string }> = [
  { value: null, label: 'Sin asignar' },
  { value: 'artBPO', label: 'artBPO' },
  { value: 'TMF', label: 'TMF' },
  { value: 'REX+', label: 'REX+' },
];

const moduleIcons = [Settings2, Landmark, ShieldCheck, UsersRound, FileCheck2, FileText, BadgeCheck];

type Props = {
  proyectoId?: string;
};

export function CumplimientoHrAdminView({ proyectoId }: Props) {
  const {
    proyectos,
    proyectoActivoId,
    cumplimientoHrAdminPorProyecto,
    actualizarCumplimientoHrAdminProyecto,
  } = useAppStore();
  const { soloLectura, esCliente } = usePermisos();
  const id = proyectoId ?? proyectoActivoId ?? proyectos[0]?.id;
  const proyecto = proyectos.find((item) => item.id === id);
  const puedeEditar = !soloLectura && !esCliente;
  const cumplimientoHrAdmin = id ? (cumplimientoHrAdminPorProyecto[id] ?? []) : [];

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
      pruebasOk,
      pendientesSinResponsable,
      porcentaje: total ? Math.round((concluidos / total) * 100) : 0,
    };
  }, [cumplimientoHrAdmin]);

  if (!proyecto || !id) {
    return (
      <GlassCard className="p-8">
        <p className="text-slate-300">Selecciona un proyecto para revisar su HR Admin.</p>
      </GlassCard>
    );
  }

  const actualizarFila = (modulo: string, cambios: Partial<CumplimientoHrAdminItem>) => {
    actualizarCumplimientoHrAdminProyecto(id, modulo, cambios);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <section className="relative overflow-hidden rounded-2xl border border-emerald-300/20 bg-gradient-to-br from-emerald-400/[0.16] via-white/[0.07] to-sky-400/[0.08] p-5 shadow-2xl shadow-black/20 sm:p-7">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-emerald-300/10 blur-3xl" />
        <div className="relative grid gap-7 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
              <ShieldCheck className="h-4 w-4" />
              HR Admin · control por proyecto
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{proyecto.nombre}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Vista operativa de la configuración, pruebas y pendientes de HR Admin para esta implementación.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-slate-300">
              <span className="rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5">Origen: {proyecto.sistemaOrigen}</span>
              <span className="rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5">Destino: REX+</span>
              <span className="rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5">{resumen.total} módulos</span>
            </div>
            {!puedeEditar ? (
              <div className="mt-5 inline-flex items-center gap-2 rounded-xl border border-sky-300/20 bg-sky-400/10 px-3 py-2 text-xs text-sky-100">
                <ClipboardCheck className="h-4 w-4" />
                Esta vista está en modo lectura para tu perfil.
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-5 rounded-2xl border border-white/10 bg-black/10 px-5 py-4">
            <ProgressRing value={resumen.porcentaje} size={112} />
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Cumplimiento</p>
              <p className="mt-1 text-2xl font-semibold text-white">{resumen.porcentaje}%</p>
              <p className="mt-1 text-xs text-slate-400">{resumen.concluidos} de {resumen.total} listos</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ResumenCard icon={Gauge} label="Avance" value={`${resumen.porcentaje}%`} detail="módulos concluidos" tone="emerald" />
        <ResumenCard icon={TestTube2} label="Pruebas" value={`${resumen.pruebasOk}/${resumen.total}`} detail="validaciones realizadas" tone="blue" />
        <ResumenCard icon={BadgeCheck} label="Listos" value={`${resumen.concluidos}`} detail="preparados para cierre" tone="violet" />
        <ResumenCard
          icon={AlertTriangle}
          label="Requieren atención"
          value={`${resumen.pendientesSinResponsable}`}
          detail={resumen.pendientesSinResponsable ? 'pendientes sin responsable' : 'sin pendientes críticos'}
          tone={resumen.pendientesSinResponsable ? 'amber' : 'slate'}
        />
      </section>

      <section className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">Mapa operativo</p>
          <h2 className="mt-1 text-2xl font-semibold text-white">Módulos HR Admin</h2>
          <p className="mt-1 text-sm text-slate-400">Cada tarjeta muestra el último estado registrado para {proyecto.nombre}.</p>
        </div>
        <span className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-400 sm:inline-flex">
          <MessageSquareText className="h-3.5 w-3.5" />
          Actualización compartida
        </span>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {cumplimientoHrAdmin.map((item, index) => (
          <ModuloCard
            key={item.modulo}
            item={item}
            index={index}
            puedeEditar={puedeEditar}
            onChange={actualizarFila}
          />
        ))}
      </section>
    </div>
  );
}

function ModuloCard({
  item,
  index,
  puedeEditar,
  onChange,
}: {
  item: CumplimientoHrAdminItem;
  index: number;
  puedeEditar: boolean;
  onChange: (modulo: string, cambios: Partial<CumplimientoHrAdminItem>) => void;
}) {
  const Icon = moduleIcons[index % moduleIcons.length];
  const concluido = item.estado === 'concluido';
  const sinResponsable = !concluido && item.responsable === null;

  return (
    <GlassCard className={`overflow-hidden p-5 transition duration-200 hover:-translate-y-0.5 ${sinResponsable ? 'border-amber-300/35' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ${concluido ? 'bg-emerald-400/12 text-emerald-300 ring-emerald-300/20' : 'bg-sky-400/12 text-sky-300 ring-sky-300/20'}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Módulo {String(index + 1).padStart(2, '0')}</p>
            <h3 className="mt-1 text-base font-semibold leading-6 text-white">{item.modulo}</h3>
          </div>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${concluido ? 'bg-emerald-400/15 text-emerald-200' : 'bg-sky-400/15 text-sky-200'}`}>
          {concluido ? 'Concluido' : 'En proceso'}
        </span>
      </div>

      <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full transition-all ${concluido ? 'w-full bg-emerald-400' : 'w-1/2 bg-sky-400'}`} />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1.5 text-xs font-medium text-slate-400">
          Estado
          <select
            value={item.estado}
            disabled={!puedeEditar}
            onChange={(event) => onChange(item.modulo, { estado: event.target.value as CumplimientoHrAdminItem['estado'] })}
            className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2.5 text-sm text-white outline-none transition focus:border-emerald-300/50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <option value="concluido">Concluido</option>
            <option value="en_proceso">En proceso</option>
          </select>
        </label>
        <label className="grid gap-1.5 text-xs font-medium text-slate-400">
          Responsable
          <select
            value={item.responsable ?? ''}
            disabled={!puedeEditar || concluido}
            onChange={(event) => onChange(item.modulo, { responsable: (event.target.value || null) as ResponsableCumplimientoHrAdmin })}
            className={`rounded-xl border px-3 py-2.5 text-sm text-white outline-none transition focus:border-emerald-300/50 disabled:cursor-not-allowed disabled:opacity-70 ${sinResponsable ? 'border-amber-300/40 bg-amber-400/10' : 'border-white/10 bg-white/[0.05]'}`}
          >
            {responsables.map((responsable) => (
              <option key={responsable.label} value={responsable.value ?? ''}>{responsable.label}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.025] px-3 py-2.5">
        <label className="inline-flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={item.pruebasRealizadas}
            disabled={!puedeEditar}
            onChange={(event) => onChange(item.modulo, { pruebasRealizadas: event.target.checked })}
            className="h-4 w-4 rounded border-white/20 bg-transparent text-emerald-400"
          />
          Pruebas realizadas
        </label>
        {sinResponsable ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-200">
            <AlertTriangle className="h-3.5 w-3.5" />
            Asignar responsable
          </span>
        ) : null}
      </div>

      <label className="mt-4 grid gap-1.5 text-xs font-medium text-slate-400">
        Observación operativa
        <textarea
          value={item.observacion}
          disabled={!puedeEditar}
          onChange={(event) => onChange(item.modulo, { observacion: event.target.value })}
          placeholder="Escribe el último avance, bloqueo o acuerdo"
          className="min-h-[78px] resize-y rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-300/50 disabled:cursor-not-allowed disabled:opacity-70"
        />
      </label>
    </GlassCard>
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
  tone: 'emerald' | 'blue' | 'violet' | 'amber' | 'slate';
}) {
  const toneClass =
    tone === 'emerald'
      ? 'bg-emerald-400/10 text-emerald-200 ring-emerald-300/25'
      : tone === 'blue'
        ? 'bg-sky-400/10 text-sky-200 ring-sky-300/25'
        : tone === 'violet'
          ? 'bg-violet-400/10 text-violet-200 ring-violet-300/25'
          : tone === 'amber'
            ? 'bg-amber-400/10 text-amber-200 ring-amber-300/25'
            : 'bg-white/[0.05] text-slate-200 ring-white/10';

  return (
    <GlassCard className="p-4">
      <div className={`inline-flex rounded-xl p-2.5 ring-1 ${toneClass}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-4 text-xs font-medium uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{detail}</p>
    </GlassCard>
  );
}
