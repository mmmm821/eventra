import { Skeleton } from "@/components/ui/skeleton";

export default function EventDetailsLoading() {
  return (
    <div>
      <Skeleton className="h-[42vh] sm:h-[52vh] w-full rounded-none" />
      <div className="container py-10 grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    </div>
  );
}
