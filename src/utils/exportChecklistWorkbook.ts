import ExcelJS from 'exceljs';
import { format } from 'date-fns';
import { Proyecto } from '../types';
import { ChecklistExpedienteEstado } from './expedienteChecklist';

const triggerDownload = async (workbook: ExcelJS.Workbook, fileName: string) => {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
};

const slugify = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const downloadChecklistWorkbook = async (
  proyecto: Proyecto,
  checklist: ChecklistExpedienteEstado[],
) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Implementator';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Checklist');
  sheet.views = [{ state: 'frozen', ySplit: 3 }];
  sheet.columns = [
    { header: 'Ítem', key: 'item', width: 42 },
    { header: 'Estado', key: 'estado', width: 16 },
    { header: 'Frecuencia', key: 'frecuencia', width: 16 },
    { header: 'Tipo de cumplimiento', key: 'tipo', width: 20 },
    { header: 'Fuente', key: 'fuente', width: 58 },
  ];

  sheet.mergeCells('A1:E1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = `Checklist proyecto · ${proyecto.nombre}`;
  titleCell.font = { bold: true, size: 16, color: { argb: 'FF0F172A' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'left' };

  sheet.mergeCells('A2:E2');
  const metaCell = sheet.getCell('A2');
  metaCell.value = `RUT: ${proyecto.rut} · Sistema origen: ${proyecto.sistemaOrigen} · Descargado: ${format(new Date(), 'dd-MM-yyyy HH:mm')}`;
  metaCell.font = { size: 10, color: { argb: 'FF475569' } };
  metaCell.alignment = { vertical: 'middle', horizontal: 'left' };

  const headerRow = sheet.getRow(3);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  checklist.forEach((item) => {
    const row = sheet.addRow({
      item: item.label,
      estado: item.completo ? 'Completo' : 'Pendiente',
      frecuencia: item.frecuencia,
      tipo: item.auto ? 'Automático' : item.manual ? 'Manual' : 'Sin completar',
      fuente: item.fuente ?? '',
    });

    row.alignment = { vertical: 'top', wrapText: true };
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
    });

    const estadoCell = row.getCell(2);
    estadoCell.font = { bold: true, color: { argb: item.completo ? 'FF166534' : 'FF92400E' } };
    estadoCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: item.completo ? 'FFDCFCE7' : 'FFFEF3C7' },
    };
  });

  const fileName = `implementator-checklist-${slugify(proyecto.nombre)}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  await triggerDownload(workbook, fileName);
};
