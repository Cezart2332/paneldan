export function fmtDateTime(value) {
  if (!value) return '–';
  return new Date(value).toLocaleDateString('ro-RO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
