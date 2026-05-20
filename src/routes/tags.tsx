import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import { Tags, type Tag } from "@/lib/api";
import { Pencil, Trash2, Plus, Search } from "lucide-react";
import { useInfiniteList } from "@/hooks/useInfiniteList";
import { InfiniteSentinel } from "@/components/InfiniteSentinel";

export const Route = createFileRoute("/tags")({
  component: TagsPage,
  head: () => ({
    meta: [
      { title: "Tags — Manager" },
      { name: "description", content: "Manage the global tag taxonomy used across experiences and POIs." },
    ],
  }),
});

const EMPTY: Tag = { name: "", family: "", visible: true, user_preference: false };

function TagsPage() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ["tags"], queryFn: () => Tags.list() });
  const [editing, setEditing] = useState<Tag | null>(null);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ql = q.toLowerCase();
  const { visible, total, hasMore, sentinelRef } = useInfiniteList({
    items: data,
    filter: (t) =>
      !q
        ? true
        : (t.name || "").toLowerCase().includes(ql) ||
          (t.family || "").toLowerCase().includes(ql),
    pageSize: 60,
  });

  const save = useMutation({
    mutationFn: (t: Tag) => (t.id ? Tags.update(t.id, t) : Tags.create(t)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tags"] });
      setOpen(false);
      setEditing(null);
    },
  });
  const remove = useMutation({
    mutationFn: (id: number) => Tags.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tags"] }),
  });

  const grouped = visible.reduce<Record<string, Tag[]>>((acc, t) => {
    const f = t.family || "—";
    (acc[f] ||= []).push(t);
    return acc;
  }, {});

  return (
    <AppLayout
      title="Tags"
      subtitle={`${data?.length ?? 0} tags across ${Object.keys(grouped).length} families`}
      actions={
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search…"
              className="pl-9 w-64"
            />
          </div>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
            <DialogTrigger asChild>
              <Button
                onClick={() => setEditing({ ...EMPTY })}
                className="bg-accent text-accent-foreground hover:opacity-90"
              >
                <Plus className="size-4 mr-1" /> New tag
              </Button>
            </DialogTrigger>
          {editing && (
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">
                  {editing.id ? "Edit tag" : "New tag"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={editing.name}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="family">Family</Label>
                  <Input id="family" value={editing.family || ""}
                    onChange={(e) => setEditing({ ...editing, family: e.target.value })} />
                </div>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox checked={!!editing.visible}
                      onCheckedChange={(v) => setEditing({ ...editing, visible: !!v })} />
                    Visible
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox checked={!!editing.user_preference}
                      onCheckedChange={(v) => setEditing({ ...editing, user_preference: !!v })} />
                    User preference
                  </label>
                </div>
                {save.isError && (
                  <p className="text-sm text-destructive">{(save.error as Error).message}</p>
                )}
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={() => save.mutate(editing)} disabled={save.isPending || !editing.name}>
                  {save.isPending ? "Saving…" : "Save"}
                </Button>
              </DialogFooter>
            </DialogContent>
          )}
        </Dialog>
      }
    >
      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {error && (
        <Card className="p-4 border-destructive/40 bg-destructive/5 text-sm text-destructive">
          {(error as Error).message}
        </Card>
      )}
      <div className="space-y-8">
        {Object.entries(grouped).map(([family, tags]) => (
          <section key={family}>
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
              {family} <span className="text-foreground">({tags.length})</span>
            </div>
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Visible</TableHead>
                    <TableHead>Preference</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tags.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell>{t.visible ? "✓" : "—"}</TableCell>
                      <TableCell>{t.user_preference ? "✓" : "—"}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button size="sm" variant="ghost"
                          onClick={() => { setEditing(t); setOpen(true); }}>
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            if (t.id && confirm(`Delete tag "${t.name}"?`)) remove.mutate(t.id);
                          }}>
                          <Trash2 className="size-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </section>
        ))}
      </div>
    </AppLayout>
  );
}
