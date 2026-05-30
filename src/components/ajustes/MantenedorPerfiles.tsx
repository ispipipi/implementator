import { Plus, Trash2, UserCog } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { PerfilUsuario } from '../../types';
import { GlassCard } from '../ui/GlassCard';

const tiposPerfil: Array<{ value: PerfilUsuario; label: string }> = [
  { value: 'artbpo_admin', label: 'Administrador' },
  { value: 'artbpo_ejecutivo', label: 'Analista' },
  { value: 'tmf', label: 'TMF' },
  { value: 'cliente', label: 'Cliente' },
];

export function MantenedorPerfiles() {
  const { perfiles, proyectos, crearPerfil, actualizarPerfil, eliminarPerfil } = useAppStore();
  const [form, setForm] = useState({
    nombre: '',
    iniciales: '',
    rol: 'Analista Implementacion',
    perfil: 'artbpo_ejecutivo' as PerfilUsuario,
    color: '#22c55e',
    email: '',
    activo: true,
    proyectoClienteId: '',
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.nombre.trim() || !form.email.trim()) return;
    crearPerfil({
      ...form,
      email: form.email.trim().toLowerCase(),
      proyectoClienteId: form.perfil === 'cliente' ? form.proyectoClienteId || proyectos[0]?.id : undefined,
    });
    setForm((s) => ({ ...s, nombre: '', iniciales: '', email: '', proyectoClienteId: '' }));
  };

  return (
    <GlassCard className="p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-400/12 text-emerald-300">
          <UserCog className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">Mantenedor de perfiles</h2>
          <p className="text-sm text-slate-500">Asocia emails de Firebase Auth con permisos dentro de IMPLEMENTATOR.</p>
        </div>
      </div>

      <form className="grid gap-3 lg:grid-cols-6" onSubmit={submit}>
        <input className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white lg:col-span-2" placeholder="Nombre" value={form.nombre} onChange={(e) => setForm((s) => ({ ...s, nombre: e.target.value }))} />
        <input className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" placeholder="Iniciales" value={form.iniciales} onChange={(e) => setForm((s) => ({ ...s, iniciales: e.target.value }))} />
        <input className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white lg:col-span-2" placeholder="Email login" type="email" value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} />
        <input type="color" className="h-11 rounded-lg border border-white/10 bg-white/5 px-2 py-1" value={form.color} onChange={(e) => setForm((s) => ({ ...s, color: e.target.value }))} />
        <select className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" value={form.perfil} onChange={(e) => setForm((s) => ({ ...s, perfil: e.target.value as PerfilUsuario }))}>
          {tiposPerfil.map((tipo) => (
            <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
          ))}
        </select>
        <input className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white lg:col-span-2" placeholder="Rol visible" value={form.rol} onChange={(e) => setForm((s) => ({ ...s, rol: e.target.value }))} />
        <select
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white lg:col-span-2"
          value={form.proyectoClienteId}
          onChange={(e) => setForm((s) => ({ ...s, proyectoClienteId: e.target.value }))}
          disabled={form.perfil !== 'cliente'}
        >
          <option value="">Proyecto cliente</option>
          {proyectos.map((proyecto) => (
            <option key={proyecto.id} value={proyecto.id}>{proyecto.nombre}</option>
          ))}
        </select>
        <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-400 px-4 py-2 font-semibold text-slate-950 hover:bg-emerald-300">
          <Plus className="h-4 w-4" />
          Crear
        </button>
      </form>

      <div className="mt-5 grid gap-3">
        {perfiles.map((perfil) => (
          <div key={perfil.id} className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-4 lg:grid-cols-12">
            <div className="flex items-center gap-3 lg:col-span-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-semibold" style={{ backgroundColor: `${perfil.color}24`, color: perfil.color }}>
                {perfil.iniciales}
              </span>
              <div className="min-w-0">
                <p className="truncate font-medium text-white">{perfil.nombre}</p>
                <p className="truncate text-sm text-slate-500">{perfil.email || 'Sin email asignado'}</p>
              </div>
            </div>
            <select className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white lg:col-span-2" value={perfil.perfil} onChange={(e) => actualizarPerfil(perfil.id, { perfil: e.target.value as PerfilUsuario })}>
              {tiposPerfil.map((tipo) => (
                <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
              ))}
            </select>
            <input className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white lg:col-span-2" value={perfil.rol} onChange={(e) => actualizarPerfil(perfil.id, { rol: e.target.value })} />
            <input className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white lg:col-span-3" type="email" placeholder="Email" value={perfil.email ?? ''} onChange={(e) => actualizarPerfil(perfil.id, { email: e.target.value.trim().toLowerCase() })} />
            <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
              <input type="checkbox" checked={perfil.activo !== false} onChange={(e) => actualizarPerfil(perfil.id, { activo: e.target.checked })} />
              Activo
            </label>
            <button className="rounded-lg border border-red-400/20 p-2 text-red-300 hover:bg-red-500/10" onClick={() => eliminarPerfil(perfil.id)} aria-label={`Eliminar ${perfil.nombre}`}>
              <Trash2 className="h-4 w-4" />
            </button>
            {perfil.perfil === 'cliente' ? (
              <select className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white lg:col-span-12" value={perfil.proyectoClienteId ?? ''} onChange={(e) => actualizarPerfil(perfil.id, { proyectoClienteId: e.target.value })}>
                <option value="">Proyecto visible para cliente</option>
                {proyectos.map((proyecto) => (
                  <option key={proyecto.id} value={proyecto.id}>{proyecto.nombre}</option>
                ))}
              </select>
            ) : null}
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
