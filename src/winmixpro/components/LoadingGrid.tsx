import { Skeleton } from "@/components/ui/skeleton";
const WinmixProLoadingGrid = () => <div className="grid gap-4 md:grid-cols-2">
    {[0, 1, 2, 3].map(item => <div key={`shimmer-${item}`} className="rounded-3xl border border-white/10 bg-white/5/60 p-6 backdrop-blur">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-24 shimmer-line" />
          <Skeleton className="h-3 w-12 shimmer-line" />
        </div>
        <Skeleton className="mt-4 h-8 w-32 shimmer-line" />
        <Skeleton className="mt-6 h-16 w-full shimmer-line" />
      </div>)}
  </div>;
export default WinmixProLoadingGrid;