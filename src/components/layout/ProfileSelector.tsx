import { BarChart3, Crown, Eye, Leaf, ShieldCheck, Wrench } from 'lucide-react';
import { UsuarioActivo } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { GlassCard } from '../ui/GlassCard';

const perfiles: UsuarioActivo[] = [
  { id: 'paulina-id', nombre: 'Paulina Vigueras', iniciales: 'PV', rol: 'Cerebro Operacional', perfil: 'artbpo_admin', color: '#8b5cf6' },
  { id: 'julio-id', nombre: 'Julio Espinoza', iniciales: 'JE', rol: 'Administrador', perfil: 'artbpo_admin', color: '#3b82f6' },
  { id: 'julissa-id', nombre: 'Julissa Espinoza', iniciales: 'JsE', rol: 'Analista Implementación', perfil: 'artbpo_ejecutivo', color: '#ec4899' },
  { id: 'salvador-id', nombre: 'Salvador Vásquez', iniciales: 'SV', rol: 'Analista Implementación', perfil: 'artbpo_ejecutivo', color: '#f97316' },
  { id: 'tmf-id', nombre: 'TMF', iniciales: 'TMF', rol: 'Supervisor BPO', perfil: 'tmf', color: '#14b8a6' },
  { id: 'agrichile-cliente-id', nombre: 'Agrichile', iniciales: 'AG', rol: 'Frutícola Agrichile', perfil: 'cliente', color: '#22c55e', proyectoClienteId: 'agrichile-id' },
];

const icons = [Crown, Wrench, BarChart3, BarChart3, Eye, Leaf];

export function ProfileSelector() {
  const { usuarioActivo, setUsuarioActivo } = useAppStore();
  if (usuarioActivo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f1117]/95 p-4 backdrop-blur-xl">
      <div className="w-full max-w-4xl animate-fade-in">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
            <ShieldCheck className="h-4 w-4 text-emerald-300" />
            IMPLEMENTATOR
          </div>
          <h1 className="text-4xl font-semibold tracking-normal text-white">Selecciona tu perfil</h1>
          <p className="mt-3 text-slate-400">Los permisos y proyectos visibles se ajustan según el rol activo.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {perfiles.map((perfil, index) => {
            const Icon = icons[index];
            return (
              <GlassCard
                key={perfil.id}
                interactive
                className="p-5"
                role="button"
                tabIndex={0}
                onClick={() => setUsuarioActivo(perfil)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') setUsuarioActivo(perfil);
                }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-white/10"
                    style={{ backgroundColor: `${perfil.color}22`, color: perfil.color }}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold text-white">{perfil.nombre}</h2>
                    <p className="text-sm text-slate-300">{perfil.rol}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                      {perfil.perfil === 'cliente' || perfil.perfil === 'tmf' ? 'Solo lectura' : perfil.perfil.replace('_', ' ')}
                    </p>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>
    </div>
  );
}
