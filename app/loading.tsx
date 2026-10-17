export default function Loading() {
  return (
    <div className="min-h-screen bg-canvas-soft">
      <div className="h-14 bg-white border-b border-border" />
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-4">
        <div className="h-24 rounded-2xl bg-surface-hover animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 rounded-2xl bg-surface-hover animate-pulse"
            />
          ))}
        </div>
        <div className="h-48 rounded-2xl bg-surface-hover animate-pulse" />
      </div>
    </div>
  );
}
