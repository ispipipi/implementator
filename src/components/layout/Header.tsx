import { BriefcaseBusiness, Building2, CalendarRange, ListTodo, LogOut, Moon, Settings, Sun } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { usePermisos } from '../../hooks/usePermisos';
import { auth } from '../../services/firebaseClient';
import { useAppStore } from '../../store/useAppStore';
import { Breadcrumb } from './Breadcrumb';

export function Header() {
  const { usuarioActivo, setVista, tema, alternarTema } = useAppStore();
  const { puedeAdministrar } = usePermisos();

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0f1117]/78 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button className="flex items-center gap-3" onClick={() => setVista('dashboard')}>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-400/12 text-emerald-300 ring-1 ring-emerald-300/20">
              IM
            </div>
            <div className="text-left">
              <p className="text-lg font-semibold text-white">IMPLEMENTATOR</p>
              <p className="text-xs text-slate-500">artBPO Software Implementation</p>
            </div>
          </button>

          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/8" onClick={() => setVista('proyectos')}>
              <BriefcaseBusiness className="h-4 w-4" />
              Proyectos
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/8" onClick={() => setVista('mis_tareas')}>
              <ListTodo className="h-4 w-4" />
              Mis tareas
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/8" onClick={() => setVista('info_cliente')}>
              <Building2 className="h-4 w-4" />
              Info cliente
            </button>
            {puedeAdministrar ? (
              <>
                <button className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/8" onClick={() => setVista('gantt_admin')}>
                  <CalendarRange className="h-4 w-4" />
                  Gantt admin
                </button>
                <button className="rounded-lg border border-white/10 p-2 text-slate-300 hover:bg-white/8" onClick={() => setVista('ajustes')} aria-label="Ajustes">
                  <Settings className="h-5 w-5" />
                </button>
              </>
            ) : null}
            <button
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/8"
              onClick={alternarTema}
              aria-label={tema === 'noche' ? 'Cambiar a modo dia' : 'Cambiar a modo noche'}
              title={tema === 'noche' ? 'Modo dia' : 'Modo noche'}
            >
              {tema === 'noche' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span className="hidden sm:inline">{tema === 'noche' ? 'Dia' : 'Noche'}</span>
            </button>
            {usuarioActivo ? (
              <button
                className="flex items-center gap-2 rounded-lg border border-white/10 py-1.5 pl-2 pr-3 text-sm text-slate-200 hover:bg-white/8"
                onClick={() => {
                  if (auth) void signOut(auth);
                  useAppStore.setState({ usuarioActivo: null });
                }}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-md text-xs font-semibold" style={{ backgroundColor: `${usuarioActivo.color}26`, color: usuarioActivo.color }}>
                  {usuarioActivo.iniciales}
                </span>
                <span className="hidden sm:block">{usuarioActivo.nombre}</span>
                <LogOut className="h-4 w-4 text-slate-500" />
              </button>
            ) : null}
          </div>
        </div>
        <Breadcrumb />
      </div>
    </header>
  );
}
