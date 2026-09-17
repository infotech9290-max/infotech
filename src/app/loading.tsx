export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-sky-500/20 animate-ping" />
          <div className="absolute inset-2 rounded-full border-4 border-t-sky-500 border-sky-500/20 animate-spin" />
        </div>
        <p className="text-slate-400 text-sm font-medium tracking-wide animate-pulse">Loading…</p>
      </div>
    </div>
  );
}
