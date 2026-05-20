import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Plus, X } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useSettings } from "@/lib/settings";
import {
  Itineraries, Pois, Experiences, type Itinerary, type POI, type Experience,
} from "@/lib/api";
import { GalleryDropzone, type GalleryItem } from "@/components/GalleryDropzone";

export const Route = createFileRoute("/itineraries/$id")({
  component: ItineraryDetail,
});

function toIds(arr: Itinerary["pois"]): number[] {
  if (!arr) return [];
  return arr
    .map((x) => (typeof x === "number" ? x : x?.id))
    .filter((n): n is number => typeof n === "number");
}

function ItineraryDetail() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const { settings } = useSettings();
  const owner = settings.owner;

  const { data: itinerary, isLoading, error } = useQuery({
    queryKey: ["itinerary", id],
    queryFn: () => Itineraries.get(id),
  });

  const { data: allPois } = useQuery({
    queryKey: ["pois", owner],
    queryFn: () => Pois.list(owner),
    enabled: !!owner,
  });
  const { data: allExperiences } = useQuery({
    queryKey: ["experiences", owner],
    queryFn: () => Experiences.list(owner),
    enabled: !!owner,
  });

  const [poiIds, setPoiIds] = useState<number[]>([]);
  const [expIds, setExpIds] = useState<number[]>([]);

  useEffect(() => {
    if (itinerary) {
      setPoiIds(toIds(itinerary.pois));
      setExpIds(toIds(itinerary.experiences));
    }
  }, [itinerary]);

  const save = useMutation({
    mutationFn: () => {
      if (!itinerary) throw new Error("Not loaded");
      const body: Itinerary = {
        ...itinerary,
        pois: poiIds,
        experiences: expIds,
        tags: toIds(itinerary.tags),
      };
      return Itineraries.update(id, body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["itinerary", id] });
      qc.invalidateQueries({ queryKey: ["itineraries", owner] });
    },
  });

  const poiById = useMemo(() => {
    const m = new Map<number, POI>();
    allPois?.forEach((p) => p.id != null && m.set(p.id, p));
    return m;
  }, [allPois]);
  const expById = useMemo(() => {
    const m = new Map<number, Experience>();
    allExperiences?.forEach((e) => e.id != null && m.set(e.id, e));
    return m;
  }, [allExperiences]);

  const dirty =
    itinerary &&
    (JSON.stringify(poiIds) !== JSON.stringify(toIds(itinerary.pois)) ||
      JSON.stringify(expIds) !== JSON.stringify(toIds(itinerary.experiences)));

  return (
    <AppLayout
      title={itinerary?.name || `Itinerary #${id}`}
      subtitle={itinerary?.category || undefined}
      actions={
        <Link
          to="/itineraries"
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
      {itinerary && (
        <div className="grid gap-6 lg:grid-cols-2 max-w-5xl">
          <ResourcePicker
            title="Points of interest"
            selectedIds={poiIds}
            onChange={setPoiIds}
            options={allPois ?? []}
            labelOf={(p) => p.name}
            byId={poiById}
            emptyHint="No POIs in this itinerary yet."
          />
          <ResourcePicker
            title="Experiences"
            selectedIds={expIds}
            onChange={setExpIds}
            options={allExperiences ?? []}
            labelOf={(e) => e.name || `#${e.id}`}
            byId={expById}
            emptyHint="No experiences linked yet."
          />

          <div className="lg:col-span-2 flex items-center gap-3">
            <Button onClick={() => save.mutate()} disabled={!dirty || save.isPending}>
              {save.isPending ? "Saving…" : "Save changes"}
            </Button>
            {save.isSuccess && <span className="text-sm text-green-700">Saved.</span>}
            {save.isError && (
              <span className="text-sm text-destructive">
                {(save.error as Error).message}
              </span>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
}

function ResourcePicker<T extends { id?: number }>({
  title, selectedIds, onChange, options, labelOf, byId, emptyHint,
}: {
  title: string;
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  options: T[];
  labelOf: (item: T) => string | undefined;
  byId: Map<number, T>;
  emptyHint: string;
}) {
  const [pick, setPick] = useState<string>("");
  const available = options.filter(
    (o) => o.id != null && !selectedIds.includes(o.id),
  );

  const add = (val: string) => {
    const n = Number(val);
    if (!Number.isFinite(n) || selectedIds.includes(n)) return;
    onChange([...selectedIds, n]);
    setPick("");
  };

  const remove = (n: number) => onChange(selectedIds.filter((x) => x !== n));

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg">{title}</h3>
        <span className="text-xs text-muted-foreground">
          {selectedIds.length} selected
        </span>
      </div>

      <div className="flex gap-2">
        <Select value={pick} onValueChange={(v) => { setPick(v); add(v); }}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder={`Add ${title.toLowerCase()}…`} />
          </SelectTrigger>
          <SelectContent>
            {available.length === 0 ? (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                Nothing to add.
              </div>
            ) : (
              available.map((o) => (
                <SelectItem key={o.id} value={String(o.id)}>
                  {labelOf(o) || `#${o.id}`}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" disabled aria-hidden>
          <Plus className="size-4" />
        </Button>
      </div>

      {selectedIds.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyHint}</p>
      ) : (
        <ul className="space-y-2">
          {selectedIds.map((n) => {
            const item = byId.get(n);
            return (
              <li
                key={n}
                className="flex items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">
                    {item ? labelOf(item) || `#${n}` : `#${n}`}
                  </div>
                  <Badge variant="secondary" className="font-mono text-[10px]">
                    id {n}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(n)}
                  aria-label="Remove"
                >
                  <X className="size-4" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
