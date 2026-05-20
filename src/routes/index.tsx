import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { useSettings } from "@/lib/settings";
import { Experiences, Pois, Itineraries, Tags } from "@/lib/api";
import { Compass, MapPin, Route as RouteIcon, Tag as TagIcon, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "Dashboard — Experiences" },
      { name: "description", content: "Overview of experiences, points of interest, itineraries and tags." },
    ],
  }),
});

function Stat({
  to,
  label,
  value,
  loading,
  Icon,
}: {
  to: string;
  label: string;
  value: number | string;
  loading: boolean;
  Icon: typeof Compass;
}) {
  return (
    <Link
      to={to}
      className="group block"
    >
      <Card className="p-6 transition-shadow hover:shadow-md hover:border-accent/40">
        <div className="flex items-center justify-between">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
          <Icon className="size-4 text-accent" />
        </div>
        <div className="mt-4 font-display text-4xl tabular-nums">
          {loading ? "—" : value}
        </div>
        <div className="mt-3 text-xs text-muted-foreground inline-flex items-center gap-1 group-hover:text-accent">
          View all <ArrowRight className="size-3" />
        </div>
      </Card>
    </Link>
  );
}

function Dashboard() {
  const { settings } = useSettings();
  const owner = settings.owner;

  const exp = useQuery({
    queryKey: ["experiences", owner],
    queryFn: () => Experiences.list(owner),
    enabled: !!owner,
  });
  const pois = useQuery({
    queryKey: ["pois", owner],
    queryFn: () => Pois.list(owner),
    enabled: !!owner,
  });
  const its = useQuery({
    queryKey: ["itineraries", owner],
    queryFn: () => Itineraries.list(owner),
    enabled: !!owner,
  });
  const tags = useQuery({ queryKey: ["tags"], queryFn: () => Tags.list() });

  return (
    <AppLayout
      title="Operations dashboard"
      subtitle="A live view of your inventory across the Hop on Mobility platform."
    >
      {!owner && (
        <Card className="p-6 mb-8 bg-sand border-accent/30">
          <div className="flex items-start gap-4">
            <div>
              <h3 className="font-display text-xl">Welcome.</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Pick an <code className="font-mono">owner</code> in{" "}
                <Link to="/settings" className="text-accent underline underline-offset-4">
                  settings
                </Link>{" "}
                to scope experiences, POIs, itineraries and packages.
              </p>
            </div>
          </div>
        </Card>
      )}

      {(() => {
        const expList = Array.isArray(exp.data) ? exp.data : [];
        const poisList = Array.isArray(pois.data) ? pois.data : [];
        const itsList = Array.isArray(its.data) ? its.data : [];
        const tagsList = Array.isArray(tags.data) ? tags.data : [];
        return (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Stat to="/experiences" label="Experiences" Icon={Compass}
                value={expList.length} loading={!!owner && exp.isLoading} />
              <Stat to="/pois" label="Points of interest" Icon={MapPin}
                value={poisList.length} loading={!!owner && pois.isLoading} />
              <Stat to="/itineraries" label="Itineraries" Icon={RouteIcon}
                value={itsList.length} loading={!!owner && its.isLoading} />
              <Stat to="/tags" label="Tags" Icon={TagIcon}
                value={tagsList.length} loading={tags.isLoading} />
            </div>

            <div className="grid gap-6 mt-10 lg:grid-cols-2">
              <Card className="p-6">
                <h3 className="font-display text-xl mb-4">Recent experiences</h3>
                {exp.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
                {!owner && <p className="text-sm text-muted-foreground">Set an owner to load.</p>}
                {exp.data && expList.length === 0 && (
                  <p className="text-sm text-muted-foreground">None yet.</p>
                )}
                <ul className="divide-y divide-border">
                  {expList.slice(0, 6).map((e) => (
                    <li key={e.id} className="py-3 flex items-center justify-between gap-3">
                      <Link
                        to="/experiences/$id"
                        params={{ id: String(e.id) }}
                        className="text-sm hover:text-accent truncate"
                      >
                        {e.name || `Experience #${e.id}`}
                      </Link>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {e.price ? `€${e.price}` : "—"}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card className="p-6">
                <h3 className="font-display text-xl mb-4">Tag families</h3>
                {tags.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
                <div className="flex flex-wrap gap-2">
                  {Array.from(new Set(tagsList.map((t) => t.family || "other")))
                    .slice(0, 30)
                    .map((f) => (
                      <span
                        key={f}
                        className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground"
                      >
                        {f}
                      </span>
                    ))}
                </div>
              </Card>
            </div>
          </>
        );
      })()}
    </AppLayout>
  );
}
