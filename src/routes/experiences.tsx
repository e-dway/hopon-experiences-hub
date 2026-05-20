import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { OwnerGate } from "@/components/OwnerGate";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSettings } from "@/lib/settings";
import { Experiences, type Experience } from "@/lib/api";
import { Plus, Search } from "lucide-react";

export const Route = createFileRoute("/experiences")({
  component: ExperiencesPage,
  head: () => ({
    meta: [
      { title: "Experiences — Manager" },
      { name: "description", content: "Browse and manage all experiences for your owner account." },
    ],
  }),
});

function ExperiencesPage() {
  const { settings } = useSettings();
  const owner = settings.owner;
  const nav = useNavigate();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const emptyForm: Experience = {
    owner,
    name: "",
    description: "",
    price: 0,
    duration: "",
    origin: "",
  };
  const [form, setForm] = useState<Experience>(emptyForm);

  const { data, isLoading, error } = useQuery({
    queryKey: ["experiences", owner],
    queryFn: () => Experiences.list(owner),
    enabled: !!owner,
  });

  const create = useMutation({
    mutationFn: (body: Experience) => Experiences.create(body),
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ["experiences"] });
      setOpen(false);
      setForm({ ...emptyForm, owner });
      if (created?.id) nav({ to: "/experiences/$id", params: { id: String(created.id) } });
    },
  });

  const filtered = (data || []).filter((e) =>
    !q ? true : (e.name || "").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <AppLayout
      title="Experiences"
      subtitle={
        owner
          ? `Owner: ${owner} • ${data?.length ?? 0} total`
          : "Curated tours, activities and bookable products."
      }
      actions={
        owner ? (
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name…"
                className="pl-9 w-64"
              />
            </div>
            <Button
              onClick={() => {
                setForm({ ...emptyForm, owner });
                setOpen(true);
              }}
            >
              <Plus className="size-4" /> Add experience
            </Button>
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
        {data && filtered.length === 0 && (
          <p className="text-sm text-muted-foreground">No experiences found.</p>
        )}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((e) => (
            <Link
              key={e.id}
              to="/experiences/$id"
              params={{ id: String(e.id) }}
              className="group"
            >
              <Card className="overflow-hidden h-full transition-all hover:border-accent/40 hover:shadow-md">
                <div className="aspect-[16/9] bg-sand relative overflow-hidden">
                  {(() => {
                    const g = e.gallery as Record<string, unknown> | null | undefined;
                    const first =
                      g && typeof g === "object"
                        ? (Object.values(g)[0] as { url?: string } | string | undefined)
                        : undefined;
                    const url = typeof first === "string" ? first : first?.url;
                    return url ? (
                      <img
                        src={url}
                        alt={e.name || ""}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-display text-3xl text-clay/40">
                        {(e.name || "?").slice(0, 1)}
                      </div>
                    );
                  })()}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display text-lg leading-tight">
                      {e.name || `#${e.id}`}
                    </h3>
                    <div className="text-sm tabular-nums text-accent font-medium">
                      {e.price ? `€${e.price}` : "—"}
                    </div>
                  </div>
                  {e.description && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {String(e.description).replace(/<[^>]+>/g, "")}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                    {e.duration && <span>⏱ {e.duration}</span>}
                    {e.origin && <span>📍 {e.origin}</span>}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </OwnerGate>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add experience</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="ne-name">Name</Label>
              <Input
                id="ne-name"
                value={form.name || ""}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="ne-desc">Description</Label>
              <Textarea
                id="ne-desc"
                rows={4}
                value={form.description || ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="ne-price">Price (€)</Label>
                <Input
                  id="ne-price"
                  type="number"
                  step="0.01"
                  value={form.price ?? 0}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="ne-dur">Duration</Label>
                <Input
                  id="ne-dur"
                  placeholder="PT2H30M"
                  value={form.duration || ""}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="ne-origin">Origin</Label>
              <Input
                id="ne-origin"
                value={form.origin || ""}
                onChange={(e) => setForm({ ...form, origin: e.target.value })}
              />
            </div>
            {create.isError && (
              <p className="text-sm text-destructive">
                {(create.error as Error).message}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => create.mutate({ ...form, owner })}
              disabled={create.isPending || !form.name}
            >
              {create.isPending ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>

  );
}
