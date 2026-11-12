import { cn } from "./lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-gray-200", className)}
    />
  );
}

export function CardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div
      role="status"
      className="rounded-lg border bg-white p-4 shadow-sm sm:p-6"
    >
      <span className="sr-only">Loading...</span>
      <Skeleton className="h-5 w-1/2" />
      <Skeleton className="mt-2 h-4 w-3/4" />
      <div className="mt-4 space-y-2">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="rounded-lg border border-gray-100 p-3">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="mt-2 h-3 w-1/3" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-white p-4 shadow-sm sm:p-6">
        <Skeleton className="mx-auto h-7 w-48" />
        <Skeleton className="mx-auto mt-3 h-4 w-64 max-w-full" />
      </div>
      <CardSkeleton />
    </div>
  );
}
