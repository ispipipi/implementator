import { ExpedienteProyecto, Proyecto } from '../types';

export type ChecklistExpedienteItem = {
  id: string;
  label: string;
  keywords: string[];
};

export type ChecklistExpedienteEstado = ChecklistExpedienteItem & {
  auto: boolean;
  manual: boolean;
  completo: boolean;
};

export const checklistExpedienteItems: ChecklistExpedienteItem[] = [
  { id: 'ficha_empresa', label: 'Ficha inicial de empresa', keywords: ['ficha inicial', 'ficha empresa', 'razon social', 'representante legal'] },
  { id: 'maestro_personal', label: 'Maestro de Personal completo con base de trabajadores vigentes', keywords: ['maestro personal', 'maestro de personal', 'trabajadores vigentes', 'base trabajadores', 'nomina vigente'] },
  { id: 'matriz_conceptos', label: 'Matriz de Conceptos (Haberes y Descuentos)', keywords: ['matriz conceptos', 'haberes', 'descuentos', 'conceptos remuneracion'] },
  { id: 'saldos_vacaciones', label: 'Saldos de Vacaciones', keywords: ['saldos vacaciones', 'saldo vacaciones', 'vacaciones'] },
  { id: 'estructura_organizacional', label: 'Definición de Estructura Organizacional', keywords: ['estructura organizacional', 'organigrama', 'centro costo', 'sucursales'] },
  { id: 'grupo_familiar', label: 'Grupo Familiar (Cargas y Tramo de asignación familiar)', keywords: ['grupo familiar', 'cargas familiares', 'tramo asignacion familiar', 'asignacion familiar'] },
  { id: 'formatos_documentos', label: 'Formato de documentos, plantillas', keywords: ['formato documentos', 'formatos documentos', 'plantillas', 'modelos documentos', 'tipos documentos'] },
  { id: 'flujos_firma', label: 'Definición Flujos de firma', keywords: ['flujo firma', 'flujos firma', 'firma documentos', 'firmas'] },
  { id: 'finiquitos', label: 'Finiquitos con Causales de término', keywords: ['finiquitos', 'causales termino', 'causal termino', 'termino contrato'] },
  { id: 'libros_remuneraciones', label: 'Libros de Remuneraciones historicos', keywords: ['libros remuneraciones', 'libro remuneraciones', 'historicos remuneraciones'] },
  { id: 'sindicatos', label: 'Sindicatos (cuotas y beneficios)', keywords: ['sindicatos', 'cuotas sindicales', 'beneficios sindicato'] },
  { id: 'centralizacion_contable', label: 'Formato Centralización Contable', keywords: ['centralizacion contable', 'centralizacion', 'contable'] },
  { id: 'retenciones_judiciales', label: 'Retenciones Judiciales (Oficios)', keywords: ['retenciones judiciales', 'oficios', 'retenciones'] },
  { id: 'zona_extrema', label: 'Zona Extrema (si, no. En caso de ser si definir zona)', keywords: ['zona extrema', 'zonas extremas'] },
  { id: 'licencias_medicas', label: 'Licencias Médicas', keywords: ['licencias medicas', 'licencia medica', 'portal licencias'] },
  { id: 'ausencias', label: 'Ausencias', keywords: ['ausencias', 'inasistencias'] },
  { id: 'permisos', label: 'Permisos', keywords: ['permisos', 'permisos administrativos'] },
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

  const blobDocumentos = normalizar(
    documentos
      .map((documento) => [documento.nombre, documento.descripcion, documento.tipo].filter(Boolean).join(' '))
      .join(' '),
  );
  const blobAccesos = normalizar(
    accesos
      .map((acceso) => [acceso.portal, acceso.url, acceso.usuario, acceso.referenciaClave, acceso.responsable, acceso.notas].filter(Boolean).join(' '))
      .join(' '),
  );
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
    const autoPorFicha = item.id === 'ficha_empresa' && proyectoCompletoParaFicha(proyecto);
    const autoPorTexto = item.keywords.some(
      (keyword) =>
        contieneKeyword(blobDocumentos, keyword) ||
        contieneKeyword(blobAccesos, keyword) ||
        contieneKeyword(blobProyecto, keyword),
    );
    const auto = autoPorFicha || autoPorTexto;
    const manualChecked = !!manual[item.id];
    return {
      ...item,
      auto,
      manual: manualChecked,
      completo: auto || manualChecked,
    };
  });
};
