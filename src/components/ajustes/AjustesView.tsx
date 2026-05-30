import { Lock } from 'lucide-react';
import { usePermisos } from '../../hooks/usePermisos';
import { GlassCard } from '../ui/GlassCard';
import { MantenedorEjecutivos } from './MantenedorEjecutivos';
import { MantenedorPerfiles } from './MantenedorPerfiles';
import { MantenedorPlantilla } from './MantenedorPlantilla';
import { MantenedorProyectos } from './MantenedorProyectos';

export function AjustesView() {
  const { puedeAdministrar } = usePermisos();

  if (!puedeAdministrar) {
    return (
      <GlassCard className="p-6">
        <Lock className="mb-4 h-8 w-8 text-slate-500" />
        <h1 className="text-2xl font-semibold text-white">Acceso restringido</h1>
        <p className="mt-2 text-slate-400">Solo perfiles artBPO admin pueden administrar proyectos, ejecutivos y plantillas.</p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-emerald-300">Administración</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Ajustes</h1>
      </div>
      <MantenedorPerfiles />
      <MantenedorProyectos />
      <MantenedorEjecutivos />
      <MantenedorPlantilla />
    </div>
  );
}
