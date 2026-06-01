import { Mail, Plus, Trash2, UsersRound } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { enviarCorreoAccesoPerfil } from '../../services/userAccess';
import { useAppStore } from '../../store/useAppStore';
import { GlassCard } from '../ui/GlassCard';

const colores = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6', '#22c55e', '#06b6d4'];

const inicialesDesdeNombre = (nombre: string) =>
  nombre
    .trim()
    .split(/\s+/)
    .map((parte) => parte[0])
    .join('')
    .slice(0, 3)
    .toUpperCase();

export function MantenedorUsuarios() {
  const { perfiles: usuarios, perfilesAcceso, proyectos, crearUsuario, actualizarUsuario, eliminarUsuario } = useAppStore();
  const [emailEnProceso, setEmailEnProceso] = useState('');
  const [mensajeAcceso, setMensajeAcceso] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const perfilDefault = perfilesAcceso[0]?.id ?? 'artbpo_ejecutivo';
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    perfil: perfilDefault,
    proyectoClienteId: '',
  });
  const perfilSeleccionado = perfilesAcceso.find((perfil) => perfil.id === form.perfil);
  const requiereProyectoCliente = perfilSeleccionado?.accesos.esCliente ?? form.perfil === 'cliente';

  const enviarAcceso = async (email: string) => {
    const emailNormalizado = email.trim().toLowerCase();
    setMensajeAcceso(null);

    if (!emailNormalizado) {
      setMensajeAcceso({ tipo: 'error', texto: 'Asigna un correo antes de enviar el acceso.' });
      return;
    }

    setEmailEnProceso(emailNormalizado);
    try {
      const resultado = await enviarCorreoAccesoPerfil(emailNormalizado);
      setMensajeAcceso({ tipo: 'ok', texto: `${resultado} Destinatario: ${emailNormalizado}` });
    } catch (error) {
      setMensajeAcceso({
        tipo: 'error',
        texto: error instanceof Error ? error.message : 'No se pudo enviar el correo de acceso.',
      });
    } finally {
      setEmailEnProceso('');
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const nombre = form.nombre.trim();
    const email = form.email.trim().toLowerCase();
    if (!nombre || !email || !form.perfil) return;

    crearUsuario({
      nombre,
      email,
      perfil: form.perfil,
      proyectoClienteId: requiereProyectoCliente ? form.proyectoClienteId || proyectos[0]?.id : undefined,
      iniciales: inicialesDesdeNombre(nombre),
      rol: perfilSeleccionado?.nombre ?? 'Usuario',
      color: colores[usuarios.length % colores.length],
      activo: true,
    });
    setForm({ nombre: '', email: '', perfil: perfilDefault, proyectoClienteId: '' });
    await enviarAcceso(email);
  };

  const perfilEsCliente = (perfilId: string) => perfilesAcceso.find((perfil) => perfil.id === perfilId)?.accesos.esCliente ?? perfilId === 'cliente';

  return (
    <GlassCard className="p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-400/12 text-emerald-300">
          <UsersRound className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">Mantenedor de usuarios</h2>
          <p className="text-sm text-slate-500">Crea, edita y elimina usuarios. Cada usuario debe tener nombre, correo y perfil.</p>
        </div>
      </div>

      <form className="grid gap-3 lg:grid-cols-6" onSubmit={submit}>
        <input className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white lg:col-span-2" placeholder="Nombre" value={form.nombre} onChange={(event) => setForm((current) => ({ ...current, nombre: event.target.value }))} />
        <input className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white lg:col-span-2" placeholder="Correo" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
        <select className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" value={form.perfil} onChange={(event) => setForm((current) => ({ ...current, perfil: event.target.value, proyectoClienteId: '' }))}>
          {perfilesAcceso.map((perfil) => (
            <option key={perfil.id} value={perfil.id}>{perfil.nombre}</option>
          ))}
        </select>
        <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-400 px-4 py-2 font-semibold text-slate-950 hover:bg-emerald-300">
          <Plus className="h-4 w-4" />
          Crear usuario
        </button>
        {requiereProyectoCliente ? (
          <select className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white lg:col-span-3" value={form.proyectoClienteId} onChange={(event) => setForm((current) => ({ ...current, proyectoClienteId: event.target.value }))}>
            <option value="">Proyecto cliente</option>
            {proyectos.map((proyecto) => (
              <option key={proyecto.id} value={proyecto.id}>{proyecto.nombre}</option>
            ))}
          </select>
        ) : null}
      </form>

      {mensajeAcceso ? (
        <p className={`mt-3 rounded-lg border p-3 text-sm ${mensajeAcceso.tipo === 'ok' ? 'border-emerald-300/20 bg-emerald-400/10 text-emerald-100' : 'border-red-400/20 bg-red-500/10 text-red-100'}`}>
          {mensajeAcceso.texto}
        </p>
      ) : null}

      <div className="mt-5 grid gap-3">
        {usuarios.map((usuario) => {
          const perfil = perfilesAcceso.find((item) => item.id === usuario.perfil);
          const esCliente = perfilEsCliente(usuario.perfil);
          const email = (usuario.email ?? '').trim().toLowerCase();

          return (
            <div key={usuario.id} className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-4 lg:grid-cols-12">
              <input className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white lg:col-span-3" value={usuario.nombre} onChange={(event) => actualizarUsuario(usuario.id, { nombre: event.target.value, iniciales: inicialesDesdeNombre(event.target.value) })} />
              <input className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white lg:col-span-3" type="email" placeholder="Correo" value={usuario.email ?? ''} onChange={(event) => actualizarUsuario(usuario.id, { email: event.target.value.trim().toLowerCase() })} />
              <select className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white lg:col-span-3" value={usuario.perfil} onChange={(event) => actualizarUsuario(usuario.id, { perfil: event.target.value, rol: perfilesAcceso.find((item) => item.id === event.target.value)?.nombre ?? usuario.rol, proyectoClienteId: perfilEsCliente(event.target.value) ? usuario.proyectoClienteId || proyectos[0]?.id : undefined })}>
                {perfilesAcceso.map((item) => (
                  <option key={item.id} value={item.id}>{item.nombre}</option>
                ))}
              </select>
              <button
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-300/20 px-3 py-2 text-sm font-medium text-emerald-100 hover:bg-emerald-400/10 disabled:cursor-not-allowed disabled:opacity-60 lg:col-span-2"
                disabled={emailEnProceso === email}
                onClick={() => enviarAcceso(email)}
              >
                <Mail className="h-4 w-4" />
                {emailEnProceso === email ? 'Enviando...' : 'Enviar acceso'}
              </button>
              <button className="rounded-lg border border-red-400/20 p-2 text-red-300 hover:bg-red-500/10" onClick={() => eliminarUsuario(usuario.id)} aria-label={`Eliminar ${usuario.nombre}`}>
                <Trash2 className="h-4 w-4" />
              </button>
              {esCliente ? (
                <select className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white lg:col-span-6" value={usuario.proyectoClienteId ?? ''} onChange={(event) => actualizarUsuario(usuario.id, { proyectoClienteId: event.target.value })}>
                  <option value="">Proyecto cliente</option>
                  {proyectos.map((proyecto) => (
                    <option key={proyecto.id} value={proyecto.id}>{proyecto.nombre}</option>
                  ))}
                </select>
              ) : null}
              <p className="text-xs text-slate-500 lg:col-span-6">Perfil actual: {perfil?.nombre ?? usuario.perfil}</p>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
