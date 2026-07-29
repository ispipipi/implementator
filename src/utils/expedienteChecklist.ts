import { ExpedienteProyecto, Proyecto } from '../types';

export type ChecklistExpedienteItem = {
  id: string;
  label: string;
  keywords: string[];
  frecuencia: 'Inicial' | 'Mensual';
};

export type ChecklistExpedienteEstado = ChecklistExpedienteItem & {
  auto: boolean;
  manual: boolean;
  completo: boolean;
  fuente?: string;
};

export const checklistExpedienteItems: ChecklistExpedienteItem[] = [
  { id: 'ficha_empresa', label: 'Ficha inicial de empresa', keywords: ['ficha inicial', 'ficha empresa', 'razon social', 'representante legal'], frecuencia: 'Inicial' },
  { id: 'maestro_personal', label: 'Maestro de Personal completo con base de trabajadores vigentes', keywords: ['maestro personal', 'maestro de personal', 'trabajadores vigentes', 'base trabajadores', 'nomina vigente'], frecuencia: 'Mensual' },
  { id: 'matriz_conceptos', label: 'Matriz de Conceptos (Haberes y Descuentos)', keywords: ['matriz conceptos', 'haberes', 'descuentos', 'conceptos remuneracion'], frecuencia: 'Inicial' },
  { id: 'saldos_vacaciones', label: 'Saldos de Vacaciones', keywords: ['saldos vacaciones', 'saldo vacaciones', 'vacaciones'], frecuencia: 'Mensual' },
  { id: 'estructura_organizacional', label: 'Definición de Estructura Organizacional', keywords: ['estructura organizacional', 'organigrama', 'centro costo', 'sucursales'], frecuencia: 'Inicial' },
  { id: 'grupo_familiar', label: 'Grupo Familiar (Cargas y Tramo de asignación familiar)', keywords: ['grupo familiar', 'cargas familiares', 'tramo asignacion familiar', 'asignacion familiar'], frecuencia: 'Mensual' },
  { id: 'formatos_documentos', label: 'Formato de documentos, plantillas', keywords: ['formato documentos', 'formatos documentos', 'plantillas', 'modelos documentos', 'tipos documentos'], frecuencia: 'Inicial' },
  { id: 'flujos_firma', label: 'Definición Flujos de firma', keywords: ['flujo firma', 'flujos firma', 'firma documentos', 'firmas'], frecuencia: 'Inicial' },
  { id: 'finiquitos', label: 'Finiquitos con Causales de término', keywords: ['finiquitos', 'causales termino', 'causal termino', 'termino contrato'], frecuencia: 'Mensual' },
  { id: 'libros_remuneraciones', label: 'Libros de Remuneraciones historicos', keywords: ['libros remuneraciones', 'libro remuneraciones', 'historicos remuneraciones'], frecuencia: 'Mensual' },
  { id: 'sindicatos', label: 'Sindicatos (cuotas y beneficios)', keywords: ['sindicatos', 'cuotas sindicales', 'beneficios sindicato'], frecuencia: 'Mensual' },
  { id: 'centralizacion_contable', label: 'Formato Centralización Contable', keywords: ['centralizacion contable', 'centralizacion', 'contable'], frecuencia: 'Inicial' },
  { id: 'retenciones_judiciales', label: 'Retenciones Judiciales (Oficios)', keywords: ['retenciones judiciales', 'oficios', 'retenciones'], frecuencia: 'Mensual' },
  { id: 'zona_extrema', label: 'Zona Extrema (si, no. En caso de ser si definir zona)', keywords: ['zona extrema', 'zonas extremas'], frecuencia: 'Inicial' },
  { id: 'licencias_medicas', label: 'Licencias Médicas', keywords: ['licencias medicas', 'licencia medica', 'portal licencias'], frecuencia: 'Mensual' },
  { id: 'ausencias', label: 'Ausencias', keywords: ['ausencias', 'inasistencias'], frecuencia: 'Mensual' },
  { id: 'permisos', label: 'Permisos', keywords: ['permisos', 'permisos administrativos'], frecuencia: 'Mensual' },
];

const normalizar = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const contieneKeyword = (texto: string, keyword: string) => texto.includes(normalizar(keyword));

const proyectoCompletoParaFicha = (proyecto?: Proyecto | null) =>
  !!proyecto &&
  [proyecto.rut, proyecto.razonSocial, proyecto.representanteLegal, proyecto.direccion, proyecto.cajaCompensacion, proyecto.mutualidad]
    .every((value) => value?.trim());

export const calcularChecklistExpediente = (
  proyecto: Proyecto | null | undefined,
  expediente: ExpedienteProyecto | undefined,
): ChecklistExpedienteEstado[] => {
  const documentos = expediente?.documentos ?? [];
  const accesos = expediente?.accesos ?? [];
  const manual = expediente?.checklistManual ?? {};
  const blobProyecto = normalizar(
    proyecto
      ? [
          proyecto.nombre,
          proyecto.sistemaOrigen,
          proyecto.rut,
          proyecto.razonSocial,
          proyecto.representanteLegal,
          proyecto.direccion,
          proyecto.cajaCompensacion,
          proyecto.mutualidad,
          proyecto.observaciones,
        ].join(' ')
      : '',
  );

  return checklistExpedienteItems.map((item) => {
    const manualEntry = manual[item.id];
    const manualChecked = !!manualEntry?.checked;

    let fuenteAuto: string | undefined;

    if (item.id === 'ficha_empresa' && proyectoCompletoParaFicha(proyecto)) {
      fuenteAuto = 'Automático · detectado por ficha del proyecto';
    }

    if (!fuenteAuto) {
      const documentoMatch = documentos.find((documento) =>
        item.keywords.some((keyword) =>
          contieneKeyword(
            normalizar([documento.nombre, documento.descripcion, documento.tipo].filter(Boolean).join(' ')),
            keyword,
          ),
        ),
      );
      if (documentoMatch) {
        fuenteAuto = `Automático · detectado por documento "${documentoMatch.nombre}"`;
      }
    }

    if (!fuenteAuto) {
      const accesoMatch = accesos.find((acceso) =>
        item.keywords.some((keyword) =>
          contieneKeyword(
            normalizar([acceso.portal, acceso.url, acceso.usuario, acceso.referenciaClave, acceso.responsable, acceso.notas].filter(Boolean).join(' ')),
            keyword,
          ),
        ),
      );
      if (accesoMatch) {
        fuenteAuto = `Automático · detectado por acceso "${accesoMatch.portal}"`;
      }
    }

    if (!fuenteAuto) {
      const proyectoMatch = item.keywords.some((keyword) => contieneKeyword(blobProyecto, keyword));
      if (proyectoMatch) {
        fuenteAuto = 'Automático · detectado por datos del proyecto';
      }
    }

    const auto = !!fuenteAuto;
    const fuenteManual = manualChecked
      ? `Manual${manualEntry?.updatedBy ? ` · marcado por ${manualEntry.updatedBy}` : ''}${manualEntry?.updatedAt ? ` el ${new Intl.DateTimeFormat('es-CL', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(manualEntry.updatedAt))}` : ''}`
      : undefined;

    return {
      ...item,
      auto,
      manual: manualChecked,
      completo: auto || manualChecked,
      fuente: fuenteAuto ?? fuenteManual,
    };
  });
};
