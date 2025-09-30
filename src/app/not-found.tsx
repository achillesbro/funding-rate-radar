export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-ink-strong mb-4">404</h1>
        <p className="text-kori mb-8">Page not found</p>
        <a href="/" className="btn">
          Go back home
        </a>
      </div>
    </div>
  );
}
