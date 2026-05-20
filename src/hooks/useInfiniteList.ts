import { useEffect, useMemo, useRef, useState } from "react";

export interface UseInfiniteListOptions<T> {
  items: T[] | undefined;
  filter?: (item: T) => boolean;
  pageSize?: number;
}

export function useInfiniteList<T>({
  items,
  filter,
  pageSize = 30,
}: UseInfiniteListOptions<T>) {
  const filtered = useMemo(
    () => (items ?? []).filter((it) => (filter ? filter(it) : true)),
    [items, filter],
  );
  const [count, setCount] = useState(pageSize);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Reset count when filter result shrinks below current count.
  useEffect(() => {
    setCount((c) => Math.min(Math.max(pageSize, c), Math.max(pageSize, filtered.length)));
  }, [filtered.length, pageSize]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setCount((c) => (c < filtered.length ? c + pageSize : c));
          }
        }
      },
      { rootMargin: "300px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [filtered.length, pageSize]);

  const visible = filtered.slice(0, count);
  const hasMore = count < filtered.length;

  return { visible, total: filtered.length, hasMore, sentinelRef };
}
