export type SistemaOrigen = 'Visma' | 'Meta4' | 'Talana' | 'Workday' | 'BUK' | 'Otro';

export type EstadoTarea = 'pendiente' | 'en_proceso' | 'completada' | 'bloqueada' | 'cancelada';

export type EstadoSemaforo = 'verde' | 'amarillo' | 'rojo';

export type PerfilApp = 'artbpo_admin' | 'artbpo_ejecutivo';

export type TemaApp = 'dia' | 'noche';

export interface UsuarioActivo {
  id: string;
  nombre: string;
  iniciales: string;
  rol: string;
  perfil: PerfilApp | 'tmf' | 'cliente';
  color: string;
  proyectoClienteId?: string;
}

export interface Ejecutivo {
  id: string;
  nombre: string;
  iniciales: string;
  rol: string;
  perfil: 'artbpo_admin' | 'artbpo_ejecutivo';
  color: string;
}

export interface Proyecto {
  id: string;
  nombre: string;
  rut: string;
  razonSocial: string;
  representanteLegal: string;
  direccion: string;
  cajaCompensacion: string;
  mutualidad: string;
  porcentajeCotizacionMutual: number;
  sistemaOrigen: SistemaOrigen;
  ejecutivoId: string;
  supervisorId: string;
  fechaInicio: string;
  fechaGoLive: string;
  estado: 'activo' | 'completado' | 'pausado';
  observaciones: string;
  creadoEn: string;
}

export interface Fase {
  id: string;
  proyectoId: string;
  codigo: string;
  nombre: string;
  orden: number;
  fechaInicioPlan: string;
  fechaFinPlan: string;
  fechaInicioReal?: string;
  fechaFinReal?: string;
}

export interface Tarea {
  id: string;
  faseId: string;
  proyectoId: string;
  nombre: string;
  descripcion?: string;
  responsable: string;
  estado: EstadoTarea;
  fechaInicioPlan: string;
  fechaFinPlan: string;
  fechaInicioReal?: string;
  fechaFinReal?: string;
  duracionDias: number;
  esMilestone: boolean;
  observacion?: string;
  actualizadoEn: string;
  historial?: Array<{
    fecha: string;
    campo: string;
    valorAnterior: string;
    valorNuevo: string;
    usuario: string;
  }>;
}

export interface Alerta {
  id: string;
  proyectoId: string;
  tareaId: string;
  tipo: 'vencida' | 'proxima_vencer' | 'bloqueada' | 'en_riesgo';
  mensaje: string;
  leida: boolean;
  creadaEn: string;
}

export type Vista = 'dashboard' | 'proyectos' | 'proyecto' | 'fase' | 'mis_tareas' | 'info_cliente' | 'gantt_admin' | 'reportes' | 'ajustes';

export interface AppState {
  usuarioActivo: UsuarioActivo | null;
  ejecutivos: Ejecutivo[];
  proyectos: Proyecto[];
  fases: Fase[];
  tareas: Tarea[];
  alertas: Alerta[];
  vista: Vista;
  proyectoActivoId: string | null;
  faseActivaId: string | null;
  diasAnticipacionAlerta: number;
  tema: TemaApp;
  setUsuarioActivo: (u: UsuarioActivo) => void;
  setVista: (v: Vista, proyectoId?: string, faseId?: string) => void;
  setTema: (tema: TemaApp) => void;
  alternarTema: () => void;
  actualizarTarea: (id: string, cambios: Partial<Tarea>, usuario: string) => void;
  actualizarFechasGantt: (tareaId: string, inicio: string, fin: string) => void;
  crearTarea: (t: Omit<Tarea, 'id' | 'actualizadoEn' | 'historial'>) => void;
  eliminarTarea: (id: string) => void;
  marcarAlertaLeida: (id: string) => void;
  crearProyecto: (p: Omit<Proyecto, 'id' | 'creadoEn'>) => void;
  actualizarProyecto: (id: string, cambios: Partial<Proyecto>) => void;
  eliminarProyecto: (id: string) => void;
  crearEjecutivo: (e: Omit<Ejecutivo, 'id'>) => void;
  actualizarEjecutivo: (id: string, cambios: Partial<Ejecutivo>) => void;
  recalcularAlertas: () => void;
}
