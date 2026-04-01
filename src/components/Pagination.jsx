export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  return (
    <nav className="pagination" aria-label="Paginare rezultate">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        aria-label="Pagina anterioara"
      >
        ← Inapoi
      </button>
      <span aria-live="polite" aria-atomic="true">Pagina {page} / {totalPages}</span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        aria-label="Pagina urmatoare"
      >
        Inainte →
      </button>
    </nav>
  );
}
