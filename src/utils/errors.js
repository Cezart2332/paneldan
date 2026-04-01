export function getErrorMessage(error, fallback) {
  const message = typeof error === 'string' ? error : error?.message;
  if (!message || typeof message !== 'string') return fallback;
  return message;
}
