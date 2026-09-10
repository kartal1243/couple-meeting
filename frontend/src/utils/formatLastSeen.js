export function formatLastSeen(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  if (diff < 60000) return 'Az once';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} dk once`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} saat once`;
  return `${Math.floor(diff / 86400000)} gun once`;
}
