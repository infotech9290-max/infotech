export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-slate-950 p-6">
      {/* Metrics Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-slate-900 rounded-2xl p-5 animate-pulse">
            <div className="h-3 w-20 bg-slate-700 rounded mb-3" />
            <div className="h-8 w-16 bg-slate-700 rounded" />
          </div>
        ))}
      </div>
      {/* Table Skeleton */}
      <div className="bg-slate-900 rounded-2xl p-5 animate-pulse">
        <div className="h-4 w-40 bg-slate-700 rounded mb-5" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4 mb-4">
            <div className="h-4 w-10 bg-slate-800 rounded" />
            <div className="h-4 flex-1 bg-slate-800 rounded" />
            <div className="h-4 w-24 bg-slate-800 rounded" />
            <div className="h-4 w-20 bg-slate-800 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
