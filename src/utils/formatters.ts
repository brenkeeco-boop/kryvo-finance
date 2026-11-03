import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const formatCurrency = (val: number | undefined | null): string => {
  if (val === undefined || val === null || isNaN(val)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(val);
};

export const formatDate = (dateStr: string | Date | undefined | null): string => {
  if (!dateStr) return '';
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    if (!isValid(d)) return '';
    return format(d, 'dd/MM/yyyy');
  } catch {
    return String(dateStr);
  }
};

export const getMonthName = (monthIndex: number): string => {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return months[monthIndex] || '';
};

export const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};
