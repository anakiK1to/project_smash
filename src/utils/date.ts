export const formatDateTime = (iso: string): string => {
  if (!iso) {
    return '';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

export const startOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const endOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

export const addDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

export const addMonths = (date: Date, months: number): Date =>
  new Date(date.getFullYear(), date.getMonth() + months, date.getDate());

export const startOfWeek = (
  date: Date,
  weekStartsOnMonday = true,
): Date => {
  const day = date.getDay();
  const offset = weekStartsOnMonday ? (day + 6) % 7 : day;
  return startOfDay(addDays(date, -offset));
};

export const startOfMonth = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), 1);

export const endOfMonth = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

export const buildMonthGrid = (baseDate: Date): Date[] => {
  const gridStart = startOfWeek(startOfMonth(baseDate));
  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
};

export const formatMonthTitle = (date: Date, locale = 'ru'): string => {
  const monthNames =
    locale === 'ru'
      ? [
          'Январь',
          'Февраль',
          'Март',
          'Апрель',
          'Май',
          'Июнь',
          'Июль',
          'Август',
          'Сентябрь',
          'Октябрь',
          'Ноябрь',
          'Декабрь',
        ]
      : [];
  const monthLabel =
    monthNames[date.getMonth()] ??
    new Intl.DateTimeFormat(locale, { month: 'long' }).format(date);
  return `${monthLabel} ${date.getFullYear()}`;
};

export const formatDayHeader = (value: string | Date): string => {
  if (!value) {
    return '';
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return typeof value === 'string' ? value : '';
  }
  const today = startOfDay(new Date());
  const targetDay = startOfDay(date);
  const diffMs = today.getTime() - targetDay.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) {
    return 'Сегодня';
  }
  if (diffDays === 1) {
    return 'Вчера';
  }
  const formatted = new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
  return formatted.replace('.', '').replace(' г.', '');
};

export const formatTime = (iso: string): string => {
  if (!iso) {
    return '';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const toIso = (date: Date): string => date.toISOString();

export const fromIso = (iso: string): Date => new Date(iso);

const pad = (value: number): string => String(value).padStart(2, '0');

export const toDatetimeLocalValue = (iso: string): string => {
  if (!iso) {
    return '';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const fromDatetimeLocalValue = (value: string): string => {
  if (!value) {
    return new Date().toISOString();
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString();
  }
  return date.toISOString();
};
