type ChartSectionSkeletonVariant = 'form' | 'gallery' | 'wide';

export function ChartSectionSkeleton({ variant = 'form' }: { variant?: ChartSectionSkeletonVariant }) {
  if (variant === 'gallery') {
    return (
      <div className="animate-pulse space-y-6 pb-12">
        <SkeletonHeader />
        <div className="flex gap-3 border-b border-slate-200 pb-4">
          {[1, 2, 3].map((item) => <div key={item} className="h-9 w-28 rounded-lg bg-slate-200" />)}
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => <div key={index} className="aspect-[4/3] rounded-xl bg-slate-200" />)}
        </div>
      </div>
    );
  }

  if (variant === 'wide') {
    return (
      <div className="animate-pulse space-y-6 pb-12">
        <SkeletonHeader />
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <div className="h-5 w-48 rounded bg-slate-200" />
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => <div key={index} className="h-24 rounded-xl bg-slate-100" />)}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <div className="h-5 w-56 rounded bg-slate-200" />
          <div className="mt-6 h-40 rounded-xl bg-slate-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-pulse space-y-6 pb-12">
      <SkeletonHeader />
      {[1, 2, 3].map((item) => (
        <div key={item} className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="h-5 w-44 rounded bg-slate-200" />
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="h-12 rounded-lg bg-slate-100" />
            <div className="h-12 rounded-lg bg-slate-100" />
            <div className="h-12 rounded-lg bg-slate-100 sm:col-span-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SkeletonHeader() {
  return (
    <div className="border-b border-slate-200 pb-4">
      <div className="h-7 w-56 rounded-md bg-slate-200" />
      <div className="mt-2 h-4 w-80 max-w-full rounded bg-slate-100" />
    </div>
  );
}