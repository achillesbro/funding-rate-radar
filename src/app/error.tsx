'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <h2 className="text-2xl font-bold text-ink-strong mb-4">Something went wrong!</h2>
        <p className="text-kori mb-6">{error.message}</p>
        <button
          onClick={reset}
          className="btn"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
