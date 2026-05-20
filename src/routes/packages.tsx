import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { OwnerGate } from "@/components/OwnerGate";
import { Card } from "@/components/ui/card";
import { useSettings } from "@/lib/settings";
import { Packages } from "@/lib/api";

export const Route = createFileRoute("/packages")({
  component: PackagesPage,
  head: () => ({
    meta: [
      { title: "Packages — Manager" },
      { name: "description", content: "Bookable packages and SKUs available for purchase." },
    ],
  }),
});

function PackagesPage() {
  const { settings } = useSettings();
  const owner = settings.owner;
  const { data, isLoading, error } = useQuery({
    queryKey: ["packages", owner],
    queryFn: () => Packages.list(owner),
    enabled: !!owner,
  });

  return (
    <AppLayout title="Packages" subtitle={owner ? `Owner: ${owner} • ${data?.length ?? 0} total` : undefined}>
      <OwnerGate>
        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {error && (
          <Card className="p-4 border-destructive/40 bg-destructive/5 text-sm text-destructive">
            {(error as Error).message}
          </Card>
        )}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data?.map((p) => (
            <Card key={p.id} className="overflow-hidden">
              {p.image && (
                <div className="aspect-[16/9] bg-sand overflow-hidden">
                  <img src={p.image} alt={p.sku || p.id} loading="lazy" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-display text-lg leading-tight">{p.sku || p.id}</div>
                  <div className="text-sm tabular-nums text-accent font-medium">
                    {p.price} {(p.currency || "eur").toUpperCase()}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Provider: {p.provider || "—"}
                  {p.in_app_visible === false && (
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-muted">hidden</span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </OwnerGate>
    </AppLayout>
  );
}
