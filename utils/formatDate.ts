export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatRelative(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  if (diff < 60_000) return 'à l\'instant';
  if (diff < 3_600_000) return `il y a ${Math.floor(diff / 60_000)} min`;
  return formatDate(date);
}
