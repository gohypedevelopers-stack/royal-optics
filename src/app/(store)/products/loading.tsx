export default function LoadingProducts() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} className="h-72 animate-pulse rounded-xl bg-slate-200" />
        ))}
      </div>
    </div>
  );
}
