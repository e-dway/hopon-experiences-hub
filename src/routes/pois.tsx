import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { OwnerGate } from "@/components/OwnerGate";
import { Card } from "@/components/ui/card";
import { useSettings } from "@/lib/settings";
import { Pois } from "@/lib/api";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/pois")({
  component: PoisPage,
  head: () => ({
    meta: [
      { title: "Points of Interest — Manager" },
      { name: "description", content: "Browse points of interest available to your owner account." },
    ],
  }),
});

function PoisPage() {
  const { settings } = useSettings();
  const owner = settings.owner;
  const { data, isLoading, error } = useQuery({
    queryKey: ["pois", owner],
    queryFn: () => Pois.list(owner),
    enabled: !!owner,
  });

  return (
    <AppLayout title="Points of interest" subtitle={owner ? `Owner: ${owner} • ${data?.length ?? 0} total` : undefined}>
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
                  <TableHead>Highlight</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead className="text-right">ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>
                      {p.highlight ? <Badge className="bg-accent text-accent-foreground">★</Badge> : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="space-x-1">
                      {(p.tags || []).slice(0, 4).map((t) => (
                        <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{t}</span>
                      ))}
                    </TableCell>
                    <TableCell className="text-right text-xs font-mono text-muted-foreground">{p.id}</TableCell>
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
