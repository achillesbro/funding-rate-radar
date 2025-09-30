export default function Loading() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="text-center">
        <div className="skeleton w-16 h-16 rounded-full mx-auto mb-4"></div>
        <p className="text-kori">Loading funding data...</p>
      </div>
    </div>
  );
}
