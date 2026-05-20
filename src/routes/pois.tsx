import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { OwnerGate } from "@/components/OwnerGate";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useSettings } from "@/lib/settings";
import { Pois, type POI } from "@/lib/api";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { GalleryDropzone, type GalleryItem } from "@/components/GalleryDropzone";
import { Pencil, Search } from "lucide-react";
import { useInfiniteList } from "@/hooks/useInfiniteList";
import { InfiniteSentinel } from "@/components/InfiniteSentinel";

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
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["pois", owner],
    queryFn: () => Pois.list(owner),
    enabled: !!owner,
  });

  const [editing, setEditing] = useState<POI | null>(null);
  const [name, setName] = useState("");
  const [gallery, setGallery] = useState<Record<string, GalleryItem>>({});
  const [q, setQ] = useState("");

  const ql = q.toLowerCase();
  const { visible, total, hasMore, sentinelRef } = useInfiniteList({
    items: data,
    filter: (p) =>
      !q
        ? true
        : (p.name || "").toLowerCase().includes(ql) ||
          (p.tags || []).some((t) => t.toLowerCase().includes(ql)),
    pageSize: 50,
  });

  useEffect(() => {
    if (editing) {
      setName(editing.name || "");
      setGallery(
        (editing.gallery as Record<string, GalleryItem> | null | undefined) ?? {},
      );
    }
  }, [editing]);

  const update = useMutation({
    mutationFn: () => {
      if (!editing?.id) throw new Error("Missing POI id");
      return Pois.update(editing.id, { ...editing, name, gallery });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pois", owner] });
      setEditing(null);
    },
  });

  return (
    <AppLayout
      title="Points of interest"
      subtitle={owner ? `Owner: ${owner} • ${data?.length ?? 0} total` : undefined}
      actions={
        owner ? (
          <div className="relative">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name or tag…"
              className="pl-9 w-64"
            />
          </div>
        ) : null
      }
    >
      <OwnerGate>
        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {error && (
          <Card className="p-4 border-destructive/40 bg-destructive/5 text-sm text-destructive">
            {(error as Error).message}
          </Card>
        )}
        {data && (
          <>
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Highlight</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead className="text-right">ID</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((p) => (
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
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => setEditing(p)} aria-label="Edit">
                          <Pencil className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {total === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                        No POIs match.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
            {total > 0 && (
              <InfiniteSentinel
                sentinelRef={sentinelRef}
                hasMore={hasMore}
                total={total}
                visibleCount={visible.length}
              />
            )}
          </>
        )}
      </OwnerGate>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit POI</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="poi-name">Name</Label>
              <Input id="poi-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <GalleryDropzone value={gallery} onChange={setGallery} />
            {update.isError && (
              <p className="text-sm text-destructive">{(update.error as Error).message}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={() => update.mutate()} disabled={update.isPending || !name}>
              {update.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
