import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { useInfiniteList } from "@/hooks/useInfiniteList";
import { InfiniteSentinel } from "@/components/InfiniteSentinel";
import { AppLayout } from "@/components/AppLayout";
import { OwnerGate } from "@/components/OwnerGate";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useSettings } from "@/lib/settings";
import { Packages, type Pkg } from "@/lib/api";

export const Route = createFileRoute("/packages")({
  component: PackagesPage,
  head: () => ({
    meta: [
      { title: "Packages — Manager" },
      { name: "description", content: "Bookable packages and SKUs available for purchase." },
    ],
  }),
});

const emptyForm = {
  id: "",
  sku: "",
  image: "",
  price: "",
  currency: "eur",
  provider: "",
  provider_id: "",
  in_app_visible: true,
};

function PackagesPage() {
  const { settings } = useSettings();
  const owner = settings.owner;
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["packages", owner],
    queryFn: () => Packages.list(owner),
    enabled: !!owner,
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [q, setQ] = useState("");

  const ql = q.toLowerCase();
  const { visible, total, hasMore, sentinelRef } = useInfiniteList({
    items: data,
    filter: (p) =>
      !q
        ? true
        : (p.sku || "").toLowerCase().includes(ql) ||
          (p.id || "").toLowerCase().includes(ql) ||
          (p.provider || "").toLowerCase().includes(ql),
    pageSize: 30,
  });

  const create = useMutation({
    mutationFn: () => {
      const body: Pkg = {
        id: form.id.trim(),
        owner,
        sku: form.sku.trim() || null,
        image: form.image.trim() || null,
        price: form.price === "" ? 0 : Number(form.price),
        currency: form.currency.trim() || "eur",
        provider: form.provider.trim() || null,
        provider_id: form.provider_id.trim() || null,
        in_app_visible: form.in_app_visible,
        strings: {},
      };
      return Packages.create(body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["packages", owner] });
      setOpen(false);
      setForm(emptyForm);
    },
  });

  return (
    <AppLayout
      title="Packages"
      subtitle={owner ? `Owner: ${owner} • ${data?.length ?? 0} total` : undefined}
      actions={
        owner ? (
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
            <Button onClick={() => { setForm(emptyForm); setOpen(true); }}>
              <Plus className="size-4" /> Add package
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((p) => (
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
        {data && total > 0 && (
          <InfiniteSentinel
            sentinelRef={sentinelRef}
            hasMore={hasMore}
            total={total}
            visibleCount={visible.length}
          />
        )}
      </OwnerGate>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add package</DialogTitle>
            <DialogDescription>
              Scoped to owner <span className="font-mono">{owner}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="pkg-id">ID</Label>
                <Input id="pkg-id" value={form.id}
                  onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))}
                  placeholder="unique-id" />
              </div>
              <div>
                <Label htmlFor="pkg-sku">SKU</Label>
                <Input id="pkg-sku" value={form.sku}
                  onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="pkg-price">Price</Label>
                <Input id="pkg-price" type="number" step="0.01" value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="pkg-currency">Currency</Label>
                <Input id="pkg-currency" value={form.currency}
                  onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <Label htmlFor="pkg-image">Image URL</Label>
                <Input id="pkg-image" value={form.image}
                  onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="pkg-provider">Provider</Label>
                <Input id="pkg-provider" value={form.provider}
                  onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="pkg-pid">Provider ID</Label>
                <Input id="pkg-pid" value={form.provider_id}
                  onChange={(e) => setForm((f) => ({ ...f, provider_id: e.target.value }))} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch id="pkg-visible" checked={form.in_app_visible}
                onCheckedChange={(v) => setForm((f) => ({ ...f, in_app_visible: v }))} />
              <Label htmlFor="pkg-visible">Visible in app</Label>
            </div>
            {create.error && (
              <p className="text-sm text-destructive">{(create.error as Error).message}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              onClick={() => create.mutate()}
              disabled={!form.id.trim() || create.isPending}
            >
              {create.isPending ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
