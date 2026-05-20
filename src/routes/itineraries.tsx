import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { OwnerGate } from "@/components/OwnerGate";
import { Card } from "@/components/ui/card";
import { useSettings } from "@/lib/settings";
import { Itineraries } from "@/lib/api";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";

export const Route = createFileRoute("/itineraries")({
  component: ItinerariesPage,
  head: () => ({
    meta: [
      { title: "Itineraries — Manager" },
      { name: "description", content: "Routes and itineraries scoped to your owner account." },
    ],
  }),
});

function ItinerariesPage() {
  const { settings } = useSettings();
  const owner = settings.owner;
  const { data, isLoading, error } = useQuery({
    queryKey: ["itineraries", owner],
    queryFn: () => Itineraries.list(owner),
    enabled: !!owner,
  });

  return (
    <AppLayout title="Itineraries" subtitle={owner ? `Owner: ${owner} • ${data?.length ?? 0} total` : undefined}>
      <OwnerGate>
        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {error && (
          <Card className="p-4 border-destructive/40 bg-destructive/5 text-sm text-destructive">
            {(error as Error).message}
          </Card>
        )}
        {data && (
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell className="font-medium">{i.name}</TableCell>
                    <TableCell className="text-muted-foreground">{i.category || "—"}</TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">{i.duration || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{i.user || "—"}</TableCell>
                    <TableCell className="text-right text-xs font-mono text-muted-foreground">{i.id}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </OwnerGate>
    </AppLayout>
  );
}
