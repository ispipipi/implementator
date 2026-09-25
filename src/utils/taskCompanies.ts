import { EmpresaProyecto, Proyecto, Tarea } from '../types';

export const obtenerIdsEmpresaTarea = (tarea: Tarea) => Array.from(new Set([
  ...(tarea.empresaIds ?? []),
  ...(tarea.empresaId ? [tarea.empresaId] : []),
].filter(Boolean)));

export const obtenerEmpresasTarea = (tarea: Tarea, proyecto?: Proyecto | null): EmpresaProyecto[] => {
  if (!proyecto?.empresas?.length) return [];

  const ids = obtenerIdsEmpresaTarea(tarea);
  if (ids.length) return proyecto.empresas.filter((empresa) => ids.includes(empresa.id));

  return proyecto.empresas.filter((empresa) => tarea.id.includes(`-${empresa.id}-`));
};
