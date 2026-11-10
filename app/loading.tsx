export default function Loading() {
  return (
    <div className="space-y-4 py-2" aria-busy="true" aria-label="Loading">
      <div className="h-3 w-40 animate-pulse rounded bg-[var(--border)]" />
      <div className="h-10 max-w-xl animate-pulse rounded bg-[var(--border)]" />
      <div className="h-4 max-w-lg animate-pulse rounded bg-[var(--border)]" />
      <div className="h-4 max-w-md animate-pulse rounded bg-[var(--border)]" />
    </div>
  );
}
