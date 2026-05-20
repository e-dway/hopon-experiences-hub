import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Experiences, type Experience } from "@/lib/api";
import { GalleryDropzone } from "@/components/GalleryDropzone";
import { ArrowLeft, Trash2 } from "lucide-react";

export const Route = createFileRoute("/experiences/$id")({
  component: ExperienceDetail,
});

function ExperienceDetail() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["experience", id],
    queryFn: () => Experiences.get(id),
  });

  const [form, setForm] = useState<Experience | null>(null);
  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const update = useMutation({
    mutationFn: (body: Experience) => Experiences.update(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["experience", id] });
      qc.invalidateQueries({ queryKey: ["experiences"] });
    },
  });

  const remove = useMutation({
    mutationFn: () => Experiences.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["experiences"] });
      nav({ to: "/experiences" });
    },
  });

  return (
    <AppLayout
      title={form?.name || `Experience #${id}`}
      subtitle={form?.origin || undefined}
      actions={
        <Link
          to="/experiences"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back
        </Link>
      }
    >
      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {error && (
        <Card className="p-4 border-destructive/40 bg-destructive/5 text-sm text-destructive">
          {(error as Error).message}
        </Card>
      )}
      {form && (
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr] max-w-5xl">
          <Card className="p-6 space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={form.name || ""}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="desc">Description</Label>
              <Textarea
                id="desc"
                rows={8}
                value={form.description || ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price (€)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={form.price ?? 0}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="dur">Duration (ISO 8601)</Label>
                <Input
                  id="dur"
                  placeholder="PT2H30M"
                  value={form.duration || ""}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="origin">Origin</Label>
              <Input
                id="origin"
                value={form.origin || ""}
                onChange={(e) => setForm({ ...form, origin: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Button
                onClick={() => update.mutate(form)}
                disabled={update.isPending}
              >
                {update.isPending ? "Saving…" : "Save changes"}
              </Button>
              <Button
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => {
                  if (confirm("Delete this experience?")) remove.mutate();
                }}
                disabled={remove.isPending}
              >
                <Trash2 className="size-4 mr-1" /> Delete
              </Button>
              {update.isError && (
                <span className="text-sm text-destructive">
                  {(update.error as Error).message}
                </span>
              )}
              {update.isSuccess && (
                <span className="text-sm text-green-700">Saved.</span>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-display text-lg mb-3">Raw data</h3>
            <pre className="text-xs bg-muted rounded p-3 overflow-auto max-h-[480px] font-mono">
              {JSON.stringify(data, null, 2)}
            </pre>
          </Card>
        </div>
      )}
    </AppLayout>
  );
}
