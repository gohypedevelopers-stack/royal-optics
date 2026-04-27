export default function LoadingProductDetail() {
  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 lg:grid-cols-2">
      <div className="aspect-[4/3] animate-pulse rounded-xl bg-slate-200" />
      <div className="space-y-3">
        <div className="h-10 w-3/4 animate-pulse rounded bg-slate-200" />
        <div className="h-6 w-1/4 animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
      </div>
    </div>
  );
}
