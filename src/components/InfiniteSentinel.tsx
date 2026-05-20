import type { RefObject } from "react";

interface Props {
  sentinelRef: RefObject<HTMLDivElement>;
  hasMore: boolean;
  total: number;
  visibleCount: number;
}

export function InfiniteSentinel({ sentinelRef, hasMore, total, visibleCount }: Props) {
  return (
    <div ref={sentinelRef} className="py-6 text-center text-xs text-muted-foreground">
      {hasMore
        ? `Loading more… (${visibleCount} of ${total})`
        : total > 0
          ? `All ${total} loaded`
          : null}
    </div>
  );
}
