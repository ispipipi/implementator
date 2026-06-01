import { useAppStore } from '../store/useAppStore';

export const usePermisos = () => {
  const { usuarioActivo } = useAppStore();
  const perfil = usuarioActivo?.perfil;

  return {
    puedeEditarTareas: perfil === 'artbpo_admin' || perfil === 'artbpo_ejecutivo',
    puedeEditarDatosTarea: perfil === 'artbpo_admin',
    puedeCambiarEstadoTarea: !!usuarioActivo && perfil !== 'comercial',
    puedeEditarProyectos: perfil === 'artbpo_admin',
    puedeAdministrar: perfil === 'artbpo_admin',
    esAdmin: perfil === 'artbpo_admin',
    esEjecutivo: perfil === 'artbpo_ejecutivo',
    esTMF: perfil === 'tmf',
    esCliente: perfil === 'cliente',
    esComercial: perfil === 'comercial',
    soloLectura: perfil === 'tmf' || perfil === 'cliente' || perfil === 'comercial',
  };
};

export const useProyectosVisibles = () => {
  const { proyectos, usuarioActivo } = useAppStore();
  if (!usuarioActivo) return [];
  return proyectos;
};
