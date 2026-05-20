import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/lib/settings";
import { API_BASE } from "@/lib/api";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
  head: () => ({
    meta: [
      { title: "Settings — Experiences" },
      { name: "description", content: "Configure owner and client identifiers used to scope API requests." },
    ],
  }),
});

function SettingsPage() {
  const { settings, save } = useSettings();
  const [owner, setOwner] = useState("");
  const [client, setClient] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setOwner(settings.owner);
    setClient(settings.client);
  }, [settings.owner, settings.client]);

  return (
    <AppLayout title="Settings" subtitle="Identifiers used to scope every API request.">
      <Card className="p-6 max-w-xl space-y-5">
        <div>
          <Label htmlFor="owner">Owner</Label>
          <Input id="owner" value={owner} onChange={(e) => setOwner(e.target.value)}
            placeholder="e.g. acme-tours" />
          <p className="text-xs text-muted-foreground mt-1">
            Required for experiences, POIs, itineraries and packages.
          </p>
        </div>
        <div>
          <Label htmlFor="client">Client (bookings)</Label>
          <Input id="client" value={client} onChange={(e) => setClient(e.target.value)}
            placeholder="e.g. acme" />
          <p className="text-xs text-muted-foreground mt-1">
            Used by the <code className="font-mono">/tableau</code> bookings endpoint.
          </p>
        </div>
        <div className="pt-2 flex items-center gap-3">
          <Button
            onClick={() => {
              save({ owner: owner.trim(), client: client.trim() });
              setSaved(true);
              setTimeout(() => setSaved(false), 1500);
            }}
          >
            Save
          </Button>
          {saved && <span className="text-sm text-green-700">Saved.</span>}
        </div>
        <div className="pt-4 border-t border-border text-xs text-muted-foreground">
          API base: <code className="font-mono">{API_BASE}</code>
        </div>
      </Card>
    </AppLayout>
  );
}
