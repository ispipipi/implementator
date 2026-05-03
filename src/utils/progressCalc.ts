import { Alerta, EstadoSemaforo, Tarea } from '../types';

export const calcPctFase = (faseId: string, tareas: Tarea[]) => {
  const t = tareas.filter((task) => task.faseId === faseId);
  if (!t.length) return 0;
  return Math.round((t.filter((task) => task.estado === 'completada').length / t.length) * 100);
};

export const calcPctProyecto = (proyectoId: string, tareas: Tarea[]) => {
  const t = tareas.filter((task) => task.proyectoId === proyectoId);
  if (!t.length) return 0;
  return Math.round((t.filter((task) => task.estado === 'completada').length / t.length) * 100);
};

export const semaforoProyecto = (proyectoId: string, alertas: Alerta[]): EstadoSemaforo => {
  const a = alertas.filter((alerta) => alerta.proyectoId === proyectoId && !alerta.leida);
  if (a.some((alerta) => alerta.tipo === 'vencida')) return 'rojo';
  if (a.some((alerta) => alerta.tipo === 'proxima_vencer' || alerta.tipo === 'bloqueada')) return 'amarillo';
  return 'verde';
};
