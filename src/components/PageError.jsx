export default function PageError({ message }) {
  if (!message) return null;
  return (
    <div className="form-error" role="alert" aria-live="assertive" aria-atomic="true">
      {message}
    </div>
  );
}
