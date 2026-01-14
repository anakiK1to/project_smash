const startOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const daysSince = (iso?: string): number | null => {
  if (!iso) {
    return null;
  }
  const target = new Date(iso);
  if (Number.isNaN(target.getTime())) {
    return null;
  }
  const today = startOfDay(new Date());
  const targetDay = startOfDay(target);
  const diffMs = today.getTime() - targetDay.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

export const labelFollowUp = (days: number): string => {
  if (days <= 0) {
    return 'сегодня';
  }
  if (days === 1) {
    return 'вчера';
  }
  return `${days} дн.`;
};

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
