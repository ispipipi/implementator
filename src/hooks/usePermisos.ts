import { useAppStore } from '../store/useAppStore';

export const usePermisos = () => {
  const { usuarioActivo } = useAppStore();
  const perfil = usuarioActivo?.perfil;

  return {
    puedeEditarTareas: perfil === 'artbpo_admin' || perfil === 'artbpo_ejecutivo',
    puedeEditarProyectos: perfil === 'artbpo_admin',
    puedeAdministrar: perfil === 'artbpo_admin',
    esAdmin: perfil === 'artbpo_admin',
    esEjecutivo: perfil === 'artbpo_ejecutivo',
    esTMF: perfil === 'tmf',
    esCliente: perfil === 'cliente',
    soloLectura: perfil === 'tmf' || perfil === 'cliente',
  };
};

export const useProyectosVisibles = () => {
  const { proyectos, usuarioActivo } = useAppStore();
  if (!usuarioActivo) return [];
  return proyectos;
};
