import { CumplimientoHrAdminItem } from '../types';

export const CUMPLIMIENTO_HR_ADMIN_SEED: CumplimientoHrAdminItem[] = [
  {
    modulo: 'Módulo de remuneraciones',
    estado: 'concluido',
    pruebasRealizadas: true,
    responsable: null,
    observacion: '',
  },
  {
    modulo: 'Centralización y reportería',
    estado: 'concluido',
    pruebasRealizadas: true,
    responsable: null,
    observacion: '',
  },
  {
    modulo: 'Licencias médicas electrónicas',
    estado: 'en_proceso',
    pruebasRealizadas: false,
    responsable: 'REX+',
    observacion: 'Falta Imed por error de credenciales',
  },
  {
    modulo: 'Registros DT',
    estado: 'en_proceso',
    pruebasRealizadas: false,
    responsable: 'artBPO',
    observacion: 'Falta capacitación de módulo',
  },
  {
    modulo: 'Convenio Previred (notificaciones FUN)',
    estado: 'en_proceso',
    pruebasRealizadas: false,
    responsable: 'TMF',
    observacion: 'Falta concluir mandato de software en Previred',
  },
  {
    modulo: 'Portal del empleado',
    estado: 'concluido',
    pruebasRealizadas: true,
    responsable: null,
    observacion: '',
  },
  {
    modulo: 'Gestión documental',
    estado: 'concluido',
    pruebasRealizadas: true,
    responsable: null,
    observacion: '',
  },
];
