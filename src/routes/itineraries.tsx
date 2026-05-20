import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { OwnerGate } from "@/components/OwnerGate";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSettings } from "@/lib/settings";
import { Itineraries, type Itinerary } from "@/lib/api";
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

type FormState = {
  name: string;
  category: string;
  category_icon: string;
  user: string;
  duration: string;
  directed: boolean;
};

const emptyForm: FormState = {
  name: "",
  category: "",
  category_icon: "",
  user: "",
  duration: "",
  directed: false,
};

function ItinerariesPage() {
  const { settings } = useSettings();
  const owner = settings.owner;
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["itineraries", owner],
    queryFn: () => Itineraries.list(owner),
    enabled: !!owner,
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Itinerary | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Itinerary | null>(null);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        name: editing.name ?? "",
        category: editing.category ?? "",
        category_icon: editing.category_icon ?? "",
        user: editing.user ?? "",
        duration: editing.duration ?? "",
        directed: !!editing.directed,
      });
    } else {
      setForm(emptyForm);
    }
  }, [open, editing]);

  const save = useMutation({
    mutationFn: async () => {
      const body: Itinerary = {
        owner,
        name: form.name.trim(),
        category: form.category.trim() || null,
        category_icon: form.category_icon.trim() || null,
        user: form.user.trim() || null,
        duration: form.duration.trim() || null,
        directed: form.directed,
      };
      return editing?.id != null
        ? Itineraries.update(editing.id, body)
        : Itineraries.create(body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["itineraries", owner] });
      setOpen(false);
      setEditing(null);
    },
  });

  const del = useMutation({
    mutationFn: (id: number) => Itineraries.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["itineraries", owner] });
      setDeleteTarget(null);
    },
  });

  const openCreate = () => { setEditing(null); setOpen(true); };
  const openEdit = (i: Itinerary) => { setEditing(i); setOpen(true); };

  return (
    <AppLayout
      title="Itineraries"
      subtitle={owner ? `Owner: ${owner} • ${data?.length ?? 0} total` : undefined}
      actions={
        owner ? (
          <Button onClick={openCreate}>
            <Plus className="size-4" /> Add itinerary
          </Button>
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
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Directed</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell className="font-medium">
                      {i.id != null ? (
                        <Link
                          to="/itineraries/$id"
                          params={{ id: String(i.id) }}
                          className="hover:text-accent underline-offset-4 hover:underline"
                        >
                          {i.name}
                        </Link>
                      ) : (
                        i.name
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{i.category || "—"}</TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">{i.duration || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{i.user || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{i.directed ? "Yes" : "No"}</TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(i)} aria-label="Edit">
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(i)}
                          aria-label="Delete"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {data.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                      No itineraries yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        )}
      </OwnerGate>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit itinerary" : "Add itinerary"}</DialogTitle>
            <DialogDescription>
              Scoped to owner <span className="font-mono">{owner}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="it-name">Name</Label>
              <Input id="it-name" value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="it-cat">Category</Label>
                <Input id="it-cat" value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="it-icon">Category icon</Label>
                <Input id="it-icon" value={form.category_icon}
                  onChange={(e) => setForm((f) => ({ ...f, category_icon: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="it-duration">Duration</Label>
                <Input id="it-duration" placeholder="e.g. PT2H" value={form.duration}
                  onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="it-user">User</Label>
                <Input id="it-user" value={form.user}
                  onChange={(e) => setForm((f) => ({ ...f, user: e.target.value }))} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch id="it-directed" checked={form.directed}
                onCheckedChange={(v) => setForm((f) => ({ ...f, directed: v }))} />
              <Label htmlFor="it-directed">Directed</Label>
            </div>
            {save.error && (
              <p className="text-sm text-destructive">{(save.error as Error).message}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => save.mutate()} disabled={!form.name.trim() || save.isPending}>
              {save.isPending ? "Saving…" : editing ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete itinerary?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.name}" will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget?.id != null && del.mutate(deleteTarget.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
