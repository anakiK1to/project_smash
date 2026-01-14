const startOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const formatRelative = (iso: string): string => {
  const target = new Date(iso);
  if (Number.isNaN(target.getTime())) {
    return '';
  }

  const today = startOfDay(new Date());
  const targetDay = startOfDay(target);
  const diffMs = today.getTime() - targetDay.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return 'сегодня';
  }
  if (diffDays === 1) {
    return 'вчера';
  }
  return `${diffDays} дн. назад`;
};
